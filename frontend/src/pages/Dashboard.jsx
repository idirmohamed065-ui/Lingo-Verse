import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { BookOpen, Flame, Trophy, Target, Clock, TrendingUp, MessageCircle, Mic } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: progressData } = useQuery('progress-overview', () =>
    api.get('/progress/overview').then(r => r.data.data), { enabled: !!user }
  );

  const { data: streakData } = useQuery('streak-current', () =>
    api.get('/streaks/current').then(r => r.data.data), { enabled: !!user }
  );

  const quickActions = [
    { to: '/learn', icon: BookOpen, label: 'Continue Learning', color: 'bg-primary-100 text-primary-600' },
    { to: '/ai-tutor', icon: MessageCircle, label: 'AI Tutor', color: 'bg-purple-100 text-purple-600' },
    { to: '/pronunciation', icon: Mic, label: 'Pronunciation', color: 'bg-green-100 text-green-600' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'bg-yellow-100 text-yellow-600' },
  ];

  const progress = progressData || {};
  const streak = streakData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.display_name?.split(' ')[0]}!</h1>
        <p className="text-gray-600 mt-1">Here's your learning progress today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak.current_streak || 0}</p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.total_xp || 0}</p>
              <p className="text-sm text-gray-600">Total XP</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.completed_lessons || 0}</p>
              <p className="text-sm text-gray-600">Lessons Done</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{progress.completion_rate || 0}%</p>
              <p className="text-sm text-gray-600">Completion</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} to={action.to}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Today's Goal</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Study Time</span>
                <span className="font-medium">{streak.today_progress?.minutes || 0} / {streak.daily_goal_minutes || 15} min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((streak.today_progress?.minutes || 0) / (streak.daily_goal_minutes || 15)) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">XP Earned</span>
                <span className="font-medium">{streak.today_progress?.xp || 0} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-success-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((streak.today_progress?.xp || 0) / 50) * 100)}%` }} />
              </div>
            </div>
            {streak.streak_at_risk && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-danger-500" />
                <p className="text-sm text-danger-700">Your streak is at risk! Complete a lesson today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
