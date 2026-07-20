import { useParams } from 'react-router-dom';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { Trophy, Flame, BookOpen, Award, Calendar } from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const targetId = userId || currentUser?.id;
  const isMe = targetId === currentUser?.id;

  const { data } = useQuery(['profile', targetId], () =>
    api.get(`/users/profile/${targetId}`).then(r => r.data.data)
  );

  const profile = data?.user;

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card mb-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl text-primary-700 font-bold">
            {profile.display_name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-gray-600">@{profile.username}</p>
            <p className="text-gray-600 mt-2">{profile.bio || 'No bio yet'}</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1 text-primary-600">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">{profile.total_xp} XP</span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="font-medium">{profile.current_streak} day streak</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{profile.lessons_completed} lessons</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-primary-600" /> Badges</h3>
          {profile.badges?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, i) => (
                <div key={i} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                  <span>{badge.icon_emoji}</span>
                  <span>{badge.display_name}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-600 text-sm">No badges earned yet</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" /> Recent Activity</h3>
          {profile.recent_posts?.length > 0 ? (
            <div className="space-y-3">
              {profile.recent_posts.map((post, i) => (
                <div key={i} className="text-sm text-gray-600 border-b border-gray-100 pb-2">
                  {post.content?.substring(0, 100)}...
                </div>
              ))}
            </div>
          ) : <p className="text-gray-600 text-sm">No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
