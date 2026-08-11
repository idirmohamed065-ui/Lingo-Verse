import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery, useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import { Heart, MessageCircle, Share2, Send, Image, Trophy, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Social() {
  const { user } = useAuthStore();
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('text');

  const { data, refetch } = useQuery('social-feed', () =>
    api.get('/social/feed').then(r => r.data.data)
  );

  const createPost = useMutation(
    (data) => api.post('/social/posts', data).then(r => r.data),
    { onSuccess: () => { setNewPost(''); refetch(); toast.success('Post shared!'); } }
  );

  const likePost = useMutation(
    (postId) => api.post(`/social/posts/${postId}/like`).then(r => r.data),
    { onSuccess: () => refetch() }
  );

  const posts = data?.posts || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Social Feed</h1>
      <p className="text-gray-600 mb-8">Share your learning journey with the community</p>

      <div className="card mb-6">
        <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your progress..."
          className="input min-h-[80px] resize-none mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['text', 'achievement', 'streak'].map((type) => (
              <button key={type} onClick={() => setPostType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  postType === type ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => createPost.mutate({ content: newPost, post_type: postType })}
            disabled={!newPost.trim() || createPost.isLoading}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> Post
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                {post.author?.display_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{post.author?.display_name}</p>
                <p className="text-xs text-gray-500">@{post.author?.username}</p>
              </div>
              {post.post_type === 'achievement' && <Trophy className="w-5 h-5 text-yellow-500 ml-auto" />}
              {post.post_type === 'streak' && <Flame className="w-5 h-5 text-orange-500 ml-auto" />}
            </div>
            <p className="text-gray-800 mb-3">{post.content}</p>
            <div className="flex items-center gap-4 text-gray-500">
              <button onClick={() => likePost.mutate(post.id)}
                className="flex items-center gap-1 hover:text-danger-500 transition-colors">
                <Heart className="w-4 h-4" /> {post.likes_count}
              </button>
              <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                <MessageCircle className="w-4 h-4" /> {post.comments_count}
              </button>
              <button className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
