import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery, useMutation } from 'react-query';
import { Search, UserPlus, Check, X, UserCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friendsData, refetch: refetchFriends } = useQuery('friends-list', () =>
    api.get('/friends/list').then(r => r.data.data)
  );

  const { data: pendingData, refetch: refetchPending } = useQuery('pending-requests', () =>
    api.get('/friends/pending').then(r => r.data.data)
  );

  const { data: searchData } = useQuery(['friend-search', searchQuery], () =>
    api.get(`/friends/search?q=${searchQuery}`).then(r => r.data.data), { enabled: searchQuery.length >= 2 }
  );

  const sendRequest = useMutation(
    (friendId) => api.post('/friends/request', { friend_id: friendId }).then(r => r.data),
    { onSuccess: () => { toast.success('Friend request sent!'); } }
  );

  const respondRequest = useMutation(
    ({ friendId, status }) => api.patch(`/friends/request/${friendId}`, { status }).then(r => r.data),
    { onSuccess: () => { refetchPending(); refetchFriends(); toast.success('Request updated!'); } }
  );

  const friends = friendsData?.friends || [];
  const pending = pendingData?.requests || [];
  const searchResults = searchData?.users || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Friends</h1>
      <p className="text-gray-600 mb-8">Connect with other learners</p>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="input pl-10" />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {u.display_name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{u.display_name}</p>
                    <p className="text-sm text-gray-600">@{u.username} • {u.current_level}</p>
                  </div>
                </div>
                {u.friendship_status === 'none' && (
                  <button onClick={() => sendRequest.mutate(u.id)}
                    className="btn-primary text-sm flex items-center gap-1">
                    <UserPlus className="w-4 h-4" /> Add
                  </button>
                )}
                {u.friendship_status === 'pending' && (
                  <span className="text-sm text-gray-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Pending</span>
                )}
                {u.friendship_status === 'accepted' && (
                  <span className="text-sm text-success-600 flex items-center gap-1"><UserCheck className="w-4 h-4" /> Friends</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Pending Requests ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    {req.requester?.display_name[0]}
                  </div>
                  <p className="font-medium">{req.requester?.display_name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respondRequest.mutate({ friendId: req.user_id, status: 'accepted' })}
                    className="p-2 bg-success-100 text-success-600 rounded-lg hover:bg-success-200">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => respondRequest.mutate({ friendId: req.user_id, status: 'declined' })}
                    className="p-2 bg-danger-100 text-danger-600 rounded-lg hover:bg-danger-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-4">My Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No friends yet. Search for users above to connect!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                  {friend.display_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{friend.display_name}</p>
                  <p className="text-sm text-gray-600">{friend.total_xp} XP • {friend.current_streak} day streak</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
