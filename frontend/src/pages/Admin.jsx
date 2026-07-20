import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery } from 'react-query';
import { Users, BookOpen, DollarSign, Shield, BarChart3, Flag } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: dashboardData } = useQuery('admin-dashboard', () =>
    api.get('/admin/dashboard').then(r => r.data.data)
  );

  const { data: usersData } = useQuery('admin-users', () =>
    api.get('/admin/users').then(r => r.data.data)
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'moderation', label: 'Moderation', icon: Flag },
  ];

  const stats = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_users || 0}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_users || 0}</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_courses || 0}</p>
                  <p className="text-sm text-gray-600">Courses</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_revenue || 0}</p>
                  <p className="text-sm text-gray-600">Payments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">XP</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.users?.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{u.display_name}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3"><span className="badge bg-gray-100 text-gray-700">{u.role}</span></td>
                    <td className="p-3"><span className={`badge ${u.account_status === 'active' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>{u.account_status}</span></td>
                    <td className="p-3">{u.total_xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Content Management</h3>
          <p className="text-gray-600">Course, lesson, and question management tools will be available here.</p>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="card">
          <h3 className="font-semibold mb-4">Content Moderation</h3>
          <p className="text-gray-600">Review and moderate user-generated content.</p>
        </div>
      )}
    </div>
  );
}
