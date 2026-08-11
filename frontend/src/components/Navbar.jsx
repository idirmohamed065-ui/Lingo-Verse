import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BookOpen, Users, Trophy, MessageCircle, LogOut, Flame, Crown } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: BookOpen },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/ai-tutor', label: 'AI Tutor', icon: MessageCircle },
    { to: '/social', label: 'Social', icon: Users },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LingoVerse</span>
            </Link>
          </div>
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <link.icon className="w-4 h-4" />{link.label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-medium">{user?.current_streak || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary-600">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">{user?.total_xp || 0} XP</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${user?.id}`}
                    className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {user?.display_name?.[0]?.toUpperCase() || 'U'}
                  </Link>
                  <button onClick={logout}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
