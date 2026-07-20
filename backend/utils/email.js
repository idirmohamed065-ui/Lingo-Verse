import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'LingoVerse'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email, token, name) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Verify your LingoVerse account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to LingoVerse, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
        <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
    text: `Welcome to LingoVerse! Verify your email: ${verifyUrl}`
  });
};

export const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: 'Reset your LingoVerse password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${resetUrl}</p>
        <p style="color: #6b7280; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Password reset: ${resetUrl}`
  });
};

export const sendWelcomeEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to LingoVerse!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome aboard, ${name}!</h2>
        <p>You're now part of a global community of language learners. Here's how to get started:</p>
        <ul>
          <li>Complete your first lesson</li>
          <li>Chat with our AI tutor</li>
          <li>Connect with other learners</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/learn" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Start Learning</a>
      </div>
    `,
    text: `Welcome to LingoVerse! Start learning at ${process.env.FRONTEND_URL}/learn`
  });
};
