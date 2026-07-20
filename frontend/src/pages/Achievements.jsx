import { api } from '../stores/authStore';
import { useQuery, useMutation } from 'react-query';
import { Award, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Achievements() {
  const { data: badgesData } = useQuery('my-badges', () =>
    api.get('/achievements/my-badges').then(r => r.data.data)
  );

  const { data: progressData, refetch } = useQuery('achievement-progress', () =>
    api.get('/achievements/progress').then(r => r.data.data)
  );

  const checkBadges = useMutation(
    () => api.post('/achievements/check-badges').then(r => r.data),
    { onSuccess: (data) => {
      if (data.data.newly_earned.length > 0) {
        toast.success(`Earned ${data.data.newly_earned.length} new badge(s)!`);
        refetch();
      } else {
        toast('No new badges yet. Keep learning!');
      }
    }}
  );

  const progress = progressData?.progress || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-gray-600">Track your progress and earn badges</p>
        </div>
        <button onClick={() => checkBadges.mutate()}
          disabled={checkBadges.isLoading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Award className="w-4 h-4" /> Check for New Badges
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progress.map((badge) => (
          <div key={badge.id} className={`card ${badge.earned ? 'border-success-300' : 'border-gray-200 opacity-75'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                {badge.icon_emoji}
              </div>
              {badge.earned ? (
                <CheckCircle className="w-5 h-5 text-success-500" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <h3 className="font-semibold">{badge.display_name}</h3>
            <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{badge.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${badge.earned ? 'bg-success-500' : 'bg-primary-600'}`}
                  style={{ width: `${badge.progress}%` }} />
              </div>
              <p className="text-xs text-gray-500">{badge.current_value} / {badge.target_value}</p>
            </div>
            {badge.earned && (
              <p className="text-xs text-success-600 mt-2">Earned on {new Date(badge.earned_at).toLocaleDateString()}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
