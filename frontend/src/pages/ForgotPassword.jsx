import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../stores/authStore';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset email sent!');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Unable to send reset email'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold">
            Forgot your password?
          </h1>

          <p className="text-gray-600 mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="card">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <Mail className="w-10 h-10 mx-auto text-primary-600" />
              </div>

              <h2 className="font-semibold text-lg mb-2">
                Check your email
              </h2>

              <p className="text-gray-600 text-sm">
                If an account exists with that email,
                you will receive a password reset link.
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}