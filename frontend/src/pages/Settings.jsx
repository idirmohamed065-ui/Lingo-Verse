import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../stores/authStore';
import { User, Bell, Shield, Globe, Moon, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    daily_goal_minutes: user?.daily_goal_minutes || 15,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Moon },
  ];

  const handleSave = async () => {
    try {
      await api.patch('/users/profile', form);
      updateUser(form);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="flex gap-8">
        <div className="w-64 shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-danger-600 hover:bg-danger-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input type="text" value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="input min-h-[100px] resize-none" maxLength={500} />
                  <p className="text-xs text-gray-500 mt-1">{form.bio.length}/500</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Goal (minutes)</label>
                  <input type="range" min="5" max="120" step="5" value={form.daily_goal_minutes}
                    onChange={(e) => setForm({ ...form, daily_goal_minutes: parseInt(e.target.value) })}
                    className="w-full" />
                  <p className="text-sm text-gray-600 mt-1">{form.daily_goal_minutes} minutes</p>
                </div>
                <button onClick={handleSave} className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { key: 'email_lesson_reminder', label: 'Lesson Reminders', desc: 'Daily reminders to complete your lessons' },
                  { key: 'email_streak_warning', label: 'Streak Warnings', desc: 'Get notified when your streak is at risk' },
                  { key: 'email_achievements', label: 'Achievement Notifications', desc: 'New badges and achievements' },
                  { key: 'push_friend_activity', label: 'Friend Activity', desc: 'When friends complete lessons' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
              <div className="space-y-3">
                {[
                  { key: 'profile_visible', label: 'Public Profile', desc: 'Allow others to view your profile' },
                  { key: 'show_streak', label: 'Show Streak', desc: 'Display your streak on your profile' },
                  { key: 'show_xp', label: 'Show XP', desc: 'Display your XP on your profile' },
                  { key: 'allow_friend_requests', label: 'Friend Requests', desc: 'Allow others to send you friend requests' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <p className="text-gray-600">Theme settings will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
