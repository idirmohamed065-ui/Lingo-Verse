import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Mail, Lock, User, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    language: 'en',
  });

  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const languages = [
    { id: 'en', name: 'English' },
    { id: 'fr', name: 'French' },
    { id: 'es', name: 'Spanish' },
    { id: 'de', name: 'German' },
    { id: 'it', name: 'Italian' },
    { id: 'ja', name: 'Japanese' },
    { id: 'ko', name: 'Korean' },
    { id: 'zh', name: 'Chinese' },
    { id: 'ar', name: 'Arabic' },
  ];

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const email = form.email.trim();
    const display_name = form.display_name.trim();
    const password = form.password;
    const language = form.language || 'en';

    if (!display_name) {
      toast.error('Please enter your name.');
      return;
    }

    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email,
        password,
        display_name,
        language,
      });

      toast.success('Account created! Welcome to LingoVerse!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Registration error:', error);

      const responseData = error?.response?.data;

      const message =
        responseData?.message ||
        responseData?.error ||
        (Array.isArray(responseData?.errors)
          ? responseData.errors
              .map((item) => item?.message || item)
              .join(', ')
          : null) ||
        (error?.message === 'Network Error'
          ? 'Unable to connect to the LingoVerse server. Please try again.'
          : 'Registration failed. Please try again.');

      toast.error(message);
    } finally {
      setLoading(false);
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
            Create your account
          </h1>

          <p className="text-gray-600 mt-1">
            Start your language learning journey today
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) =>
                    handleChange('display_name', e.target.value)
                  }
                  className="input pl-10"
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    handleChange('email', e.target.value)
                  }
                  className="input pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
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
                  value={form.password}
                  onChange={(e) =>
                    handleChange('password', e.target.value)
                  }
                  className="input pl-10"
                  placeholder="Min 8 characters"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Native Language
              </label>

              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <select
                  value={form.language}
                  onChange={(e) =>
                    handleChange('language', e.target.value)
                  }
                  className="input pl-10"
                >
                  {languages.map((language) => (
                    <option
                      key={language.id}
                      value={language.id}
                    >
                      {language.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 disabled:opacity-50"
            >
              {loading
                ? 'Creating account...'
                : 'Get Started'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">
              Already have an account?{' '}
            </span>

            <Link
              to="/login"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}