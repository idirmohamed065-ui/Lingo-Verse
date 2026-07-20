import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { Trophy, Crown, Medal, Flame } from 'lucide-react';

export default function Leaderboard() {
  const [tab, setTab] = useState('global');
  const { user } = useAuthStore();

  const { data: globalData } = useQuery('leaderboard-global', () =>
    api.get('/leaderboard/global').then(r => r.data.data)
  );

  const { data: friendsData } = useQuery('leaderboard-friends', () =>
    api.get('/leaderboard/friends').then(r => r.data.data)
  );

  const { data: myRankData } = useQuery('my-rank', () =>
    api.get('/leaderboard/my-rank').then(r => r.data.data)
  );

  const leaderboard = tab === 'global' ? globalData?.leaderboard : friendsData?.leaderboard;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
      <p className="text-gray-600 mb-8">Compete with learners around the world</p>

      {myRankData && (
        <div className="card mb-6 bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                #{myRankData.global_rank}
              </div>
              <div>
                <p className="font-semibold">Your Rank</p>
                <p className="text-sm text-gray-600">{myRankData.total_xp} XP • {myRankData.current_level}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="font-medium">{myRankData.current_streak}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {['global', 'friends'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {leaderboard?.map((entry) => (
          <div key={entry.id || entry.rank}
            className={`card py-3 flex items-center gap-4 ${entry.is_me ? 'border-primary-300 bg-primary-50' : ''}`}>
            <div className="w-8 text-center font-bold text-lg">
              {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-500 mx-auto" /> :
               entry.rank === 2 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> :
               entry.rank === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> :
               <span className="text-gray-500">{entry.rank}</span>}
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
              {entry.display_name?.[0] || entry.user?.display_name?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium">{entry.display_name || entry.user?.display_name}</p>
              <p className="text-sm text-gray-600">{entry.current_level || entry.user?.current_level}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary-600">{entry.total_xp || entry.total_xp} XP</p>
              <p className="text-sm text-gray-600">{entry.lessons_completed || 0} lessons</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
