import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { Crown, Check, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Subscription() {
  const { user } = useAuthStore();

  const { data: plansData } = useQuery('plans', () =>
    api.get('/payments/plans').then(r => r.data.data)
  );

  const { data: subData } = useQuery('subscription', () =>
    api.get('/payments/subscription').then(r => r.data.data)
  );

  const plans = plansData?.plans || [];
  const currentTier = subData?.subscription?.tier || user?.subscription_tier || 'free';

  const handleSubscribe = async (priceId) => {
    try {
      const response = await api.post('/payments/create-subscription', { price_id: priceId });
      toast.success('Redirecting to payment...');
    } catch (error) {
      toast.error('Payment setup failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-gray-600">Unlock premium features and accelerate your learning</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.tier} className={`card relative ${plan.tier === currentTier ? 'border-primary-500 ring-2 ring-primary-200' : ''}`}>
            {plan.tier === currentTier && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Current Plan
              </div>
            )}
            {plan.tier === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Best Value
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                {plan.interval && <span className="text-gray-600">/{plan.interval}</span>}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limitations?.map((limit, i) => (
                <li key={`l${i}`} className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs">-</span>
                  <span>{limit}</span>
                </li>
              ))}
            </ul>

            {plan.tier !== 'free' && (
              <button onClick={() => handleSubscribe(plan.stripe_price_id)}
                disabled={plan.tier === currentTier}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                  plan.tier === currentTier
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}>
                {plan.tier === currentTier ? 'Current Plan' : 'Subscribe'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
