import express from 'express';
import { body } from 'express-validator';
import Stripe from 'stripe';
import { User, Subscription, Payment } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create subscription
router.post('/create-subscription',
  authenticate,
  [body('price_id').isString(), body('payment_method_id').optional().isString(), validate],
  async (req, res, next) => {
    try {
      const { price_id, payment_method_id } = req.body;
      const user = req.user;

      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.display_name,
          metadata: { user_id: user.id }
        });
        customerId = customer.id;
        await user.update({ stripe_customer_id: customerId });
      }

      if (payment_method_id) {
        await stripe.paymentMethods.attach(payment_method_id, { customer: customerId });
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: payment_method_id }
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price_id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      const tier = price_id === process.env.STRIPE_PRICE_PREMIUM ? 'premium' : 'pro';
      const subRecord = await Subscription.create({
        user_id: user.id,
        tier,
        status: 'trial',
        stripe_subscription_id: subscription.id,
        stripe_price_id: price_id,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

      res.json({
        success: true,
        data: {
          subscription_id: subscription.id,
          client_secret: subscription.latest_invoice?.payment_intent?.client_secret,
          status: subscription.status,
          tier
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get subscription details
router.get('/subscription', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: { tier: 'free', status: 'active' }
      });
    }

    res.json({ success: true, data: { subscription } });
  } catch (error) {
    next(error);
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id, status: 'active' },
      order: [['created_at', 'DESC']]
    });

    if (!subscription) throw new AppError('No active subscription found', 404);

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    await subscription.update({ cancel_at_period_end: true });

    res.json({ success: true, message: 'Subscription will cancel at period end' });
  } catch (error) {
    next(error);
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', authenticate, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      where: { user_id: req.user.id, status: 'active', cancel_at_period_end: true },
      order: [['created_at', 'DESC']]
    });

    if (!subscription) throw new AppError('No cancellable subscription found', 404);

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false
    });

    await subscription.update({ cancel_at_period_end: false });

    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (error) {
    next(error);
  }
});

// Get payment history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const sub = await Subscription.findOne({
          where: { stripe_subscription_id: subscriptionId }
        });
        if (sub) {
          await sub.update({ status: 'active', amount_paid: invoice.amount_paid / 100 });
          await User.update(
            { subscription_tier: sub.tier },
            { where: { id: sub.user_id } }
          );
          await Payment.create({
            user_id: sub.user_id,
            stripe_payment_intent_id: invoice.payment_intent,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: 'succeeded',
            description: `Subscription payment - ${sub.tier}`
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const sub = await Subscription.findOne({
          where: { stripe_subscription_id: subscription.id }
        });
        if (sub) {
          await sub.update({ status: 'cancelled' });
          await User.update(
            { subscription_tier: 'free' },
            { where: { id: sub.user_id } }
          );
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Get pricing plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = [
      {
        tier: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: null,
        features: [
          'Basic courses',
          '5 lessons per day',
          'Basic progress tracking',
          'Community access'
        ],
        limitations: ['No AI tutor', 'No pronunciation practice', 'No advanced analytics']
      },
      {
        tier: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All courses unlocked',
          'Unlimited lessons',
          'AI Tutor access',
          'Pronunciation practice',
          'Advanced analytics',
          'Streak freeze',
          'Ad-free experience'
        ],
        stripe_price_id: process.env.STRIPE_PRICE_PREMIUM
      },
      {
        tier: 'pro',
        name: 'Pro',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Everything in Premium',
          'AI Lesson generation',
          'Priority support',
          'Offline mode',
          'Family sharing (up to 4)',
          'Custom learning paths',
          '1-on-1 tutoring credits'
        ],
        stripe_price_id: process.env.STRIPE_PRICE_PRO
      }
    ];

    res.json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
});

export default router;
