import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setResetLoading(true);

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        'http://localhost:5000/api';

      const response = await fetch(
        `${apiUrl}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to send reset email'
        );
      }

      toast.success(
        'If this email exists, a password reset link has been sent.'
      );

      setForgotMode(false);
    } catch (error) {
      toast.error(
        error.message || 'Failed to send reset email'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>

          <h1 className="text-2xl font-bold">
            {forgotMode ? 'Reset your password' : 'Welcome back'}
          </h1>

          <p className="text-gray-600 mt-1">
            {forgotMode
              ? 'Enter your email to receive a password reset link'
              : 'Sign in to continue your learning journey'}
          </p>
        </div>

        <div className="card">

          {!forgotMode ? (
            <>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="input pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-sm text-primary-600 font-medium hover:text-primary-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 disabled:opacity-50"
                >
                  {loading
                    ? 'Signing in...'
                    : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">
                  Don't have an account?{' '}
                </span>

                <Link
                  to="/register"
                  className="text-primary-600 font-medium hover:text-primary-700"
                >
                  Get started
                </Link>
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full btn-primary py-2.5 disabled:opacity-50"
                >
                  {resetLoading
                    ? 'Sending...'
                    : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-primary-600 font-medium hover:text-primary-700"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}