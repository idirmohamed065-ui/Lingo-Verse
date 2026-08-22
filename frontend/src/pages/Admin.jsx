import { useState } from 'react';
import { api } from '../stores/authStore';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Users,
  BookOpen,
  DollarSign,
  BarChart3,
  Flag,
  Shield,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  MessageSquare,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  // =========================
  // Dashboard
  // =========================

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching
  } = useQuery(
    'admin-dashboard',
    () => api.get('/admin/dashboard').then((r) => r.data.data),
    {
      staleTime: 30000
    }
  );

  // =========================
  // Users
  // =========================

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching
  } = useQuery(
    ['admin-users', page, search, roleFilter, statusFilter],
    () =>
      api
        .get('/admin/users', {
          params: {
            page,
            limit: 20,
            search: search || undefined,
            role: roleFilter || undefined,
            status: statusFilter || undefined
          }
        })
        .then((r) => r.data.data),
    {
      keepPreviousData: true,
      enabled: activeTab === 'users'
    }
  );

  // =========================
  // Moderation
  // =========================

  const {
    data: moderationData,
    isLoading: moderationLoading,
    isFetching: moderationFetching
  } = useQuery(
    ['admin-moderation', page],
    () =>
      api
        .get('/admin/moderation/posts', {
          params: {
            page,
            limit: 20
          }
        })
        .then((r) => r.data.data),
    {
      keepPreviousData: true,
      enabled: activeTab === 'moderation'
    }
  );

  // =========================
  // User Status Mutation
  // =========================

  const updateStatusMutation = useMutation(
    ({ userId, account_status }) =>
      api.patch(`/admin/users/${userId}/status`, {
        account_status
      }),
    {
      onSuccess: () => {
        toast.success('User status updated');
        queryClient.invalidateQueries('admin-users');
        queryClient.invalidateQueries('admin-dashboard');
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            'Failed to update user status'
        );
      }
    }
  );

  // =========================
  // User Role Mutation
  // =========================

  const updateRoleMutation = useMutation(
    ({ userId, role }) =>
      api.patch(`/admin/users/${userId}/role`, {
        role
      }),
    {
      onSuccess: () => {
        toast.success('User role updated');
        queryClient.invalidateQueries('admin-users');
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            'Failed to update user role'
        );
      }
    }
  );

  // =========================
  // Delete Post
  // =========================

  const deletePostMutation = useMutation(
    ({ postId, reason }) =>
      api.delete(`/admin/moderation/posts/${postId}`, {
        data: { reason }
      }),
    {
      onSuccess: () => {
        toast.success('Post deleted');
        queryClient.invalidateQueries('admin-moderation');
        queryClient.invalidateQueries('admin-dashboard');
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            'Failed to delete post'
        );
      }
    }
  );

  // =========================
  // Tabs
  // =========================

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users
    },
    {
      id: 'content',
      label: 'Content',
      icon: BookOpen
    },
    {
      id: 'moderation',
      label: 'Moderation',
      icon: Flag
    }
  ];

  const stats = dashboardData || {};

  // =========================
  // Helpers
  // =========================

  const handleRefresh = () => {
    queryClient.invalidateQueries('admin-dashboard');
    queryClient.invalidateQueries('admin-users');
    queryClient.invalidateQueries('admin-moderation');

    toast.success('Data refreshed');
  };

  const handleStatusChange = (userId, status) => {
    updateStatusMutation.mutate({
      userId,
      account_status: status
    });
  };

  const handleRoleChange = (userId, role) => {
    updateRoleMutation.mutate({
      userId,
      role
    });
  };

  const handleDeletePost = (postId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post?'
    );

    if (!confirmed) return;

    deletePostMutation.mutate({
      postId,
      reason: 'Deleted by administrator'
    });
  };

  const usersPagination = usersData?.pagination;
  const moderationPagination = moderationData?.pagination;

  // =========================
  // Loading
  // =========================

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  // =========================
  // Stat Card
  // =========================

  const StatCard = ({
    icon: Icon,
    value,
    label,
    iconClass
  }) => (
    <div className="card">
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <p className="text-2xl font-bold">
            {value ?? 0}
          </p>

          <p className="text-sm text-gray-600">
            {label}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Admin Dashboard
              </h1>

              <p className="text-gray-500">
                Manage LingoVerse
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================
          DASHBOARD
      ========================= */}

      {activeTab === 'dashboard' && (
        <div>
          {dashboardLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                <StatCard
                  icon={Users}
                  value={stats.total_users}
                  label="Total Users"
                  iconClass="bg-primary-100 text-primary-600"
                />

                <StatCard
                  icon={UserCheck}
                  value={stats.active_users}
                  label="Active Users"
                  iconClass="bg-green-100 text-green-600"
                />

                <StatCard
                  icon={BookOpen}
                  value={stats.total_courses}
                  label="Courses"
                  iconClass="bg-purple-100 text-purple-600"
                />

                <StatCard
                  icon={DollarSign}
                  value={stats.total_revenue}
                  label="Successful Payments"
                  iconClass="bg-yellow-100 text-yellow-600"
                />

              </div>

              {/* Extra stats */}
              <div className="grid md:grid-cols-2 gap-6">

                <div className="card">
                  <div className="flex items-center gap-3 mb-5">
                    <FileText className="w-5 h-5 text-primary-600" />

                    <h2 className="font-semibold">
                      Platform Overview
                    </h2>
                  </div>

                  <div className="space-y-4">

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total Lessons
                      </span>

                      <span className="font-semibold">
                        {stats.total_lessons || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Total Posts
                      </span>

                      <span className="font-semibold">
                        {stats.total_posts || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Active Users
                      </span>

                      <span className="font-semibold">
                        {stats.active_users || 0}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3 mb-5">
                    <Shield className="w-5 h-5 text-primary-600" />

                    <h2 className="font-semibold">
                      Subscription Stats
                    </h2>
                  </div>

                  {stats.subscription_stats?.length ? (
                    <div className="space-y-3">
                      {stats.subscription_stats.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between border-b border-gray-100 pb-2"
                        >
                          <span className="capitalize text-gray-600">
                            {item.tier}
                          </span>

                          <span className="font-semibold">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No subscription data yet.
                    </p>
                  )}
                </div>

              </div>

              {/* Recent Users */}
              <div className="card mt-6">
                <h2 className="font-semibold mb-4">
                  Recent Users
                </h2>

                {stats.recent_users?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">
                            Name
                          </th>
                          <th className="text-left p-3">
                            Email
                          </th>
                          <th className="text-left p-3">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {stats.recent_users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-100"
                          >
                            <td className="p-3 font-medium">
                              {user.display_name}
                            </td>

                            <td className="p-3 text-gray-600">
                              {user.email}
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.account_status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {user.account_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No users yet.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* =========================
          USERS
      ========================= */}

      {activeTab === 'users' && (
        <div className="card">

          <div className="flex flex-col lg:flex-row gap-3 mb-6">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, username or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>

          </div>

          {usersLoading || usersFetching ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">
                        User
                      </th>

                      <th className="text-left p-3">
                        Role
                      </th>

                      <th className="text-left p-3">
                        Status
                      </th>

                      <th className="text-left p-3">
                        XP
                      </th>

                      <th className="text-left p-3">
                        Level
                      </th>

                      <th className="text-right p-3">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {usersData?.users?.length ? (
                      usersData.users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >

                          <td className="p-3">
                            <div>
                              <p className="font-medium">
                                {u.display_name}
                              </p>

                              <p className="text-xs text-gray-500">
                                {u.email}
                              </p>

                              {u.username && (
                                <p className="text-xs text-gray-400">
                                  @{u.username}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <select
                              value={u.role}
                              disabled={updateRoleMutation.isLoading}
                              onChange={(e) =>
                                handleRoleChange(
                                  u.id,
                                  e.target.value
                                )
                              }
                              className="px-2 py-1 border border-gray-200 rounded bg-white text-xs"
                            >
                              <option value="user">
                                User
                              </option>

                              <option value="moderator">
                                Moderator
                              </option>

                              <option value="admin">
                                Admin
                              </option>
                            </select>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.account_status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : u.account_status === 'suspended'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.account_status}
                            </span>
                          </td>

                          <td className="p-3">
                            {u.total_xp || 0}
                          </td>

                          <td className="p-3">
                            {u.current_level || 1}
                          </td>

                          <td className="p-3">
                            <div className="flex justify-end gap-2">

                              {u.account_status !== 'active' && (
                                <button
                                  title="Activate"
                                  disabled={
                                    updateStatusMutation.isLoading
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      u.id,
                                      'active'
                                    )
                                  }
                                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}

                              {u.account_status === 'active' && (
                                <button
                                  title="Suspend"
                                  disabled={
                                    updateStatusMutation.isLoading
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      u.id,
                                      'suspended'
                                    )
                                  }
                                  className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}

                              {u.account_status !== 'deactivated' && (
                                <button
                                  title="Deactivate"
                                  disabled={
                                    updateStatusMutation.isLoading
                                  }
                                  onClick={() =>
                                    handleStatusChange(
                                      u.id,
                                      'deactivated'
                                    )
                                  }
                                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}

                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-8 text-center text-gray-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

              {/* Pagination */}
              {usersPagination && usersPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">

                  <p className="text-sm text-gray-500">
                    Page {usersPagination.page} of{' '}
                    {usersPagination.pages}
                  </p>

                  <div className="flex gap-2">

                    <button
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((p) => Math.max(1, p - 1))
                      }
                      className="p-2 border rounded-lg disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      disabled={
                        page >= usersPagination.pages
                      }
                      onClick={() =>
                        setPage((p) =>
                          Math.min(
                            usersPagination.pages,
                            p + 1
                          )
                        )
                      }
                      className="p-2 border rounded-lg disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================
          CONTENT
      ========================= */}

      {activeTab === 'content' && (
        <div className="grid md:grid-cols-3 gap-6">

          <div className="card">
            <BookOpen className="w-8 h-8 text-primary-600 mb-4" />

            <h3 className="font-semibold text-lg mb-2">
              Courses
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              Create and manage language courses.
            </p>

            <div className="text-sm text-gray-500">
              Total courses:{' '}
              <strong>
                {stats.total_courses || 0}
              </strong>
            </div>
          </div>

          <div className="card">
            <FileText className="w-8 h-8 text-purple-600 mb-4" />

            <h3 className="font-semibold text-lg mb-2">
              Lessons
            </h3>

            <p className="text-gray-600 text-sm mb-4">
              Manage lessons and learning material.
            </p>

            <div className="text-sm text-gray-500">
              Total lessons:{' '}
              <strong>
                {stats.total_lessons || 0}
              </strong>
            </div>
          </div>

          <div className="card">
            <MessageSquare className="w-8 h-8 text-green-600 mb-4" />

            <h3 className="font-semibold text-lg mb-2">
              Questions
            </h3>

            <p className="text-gray-600 text-sm">
              Manage quiz and lesson questions through
              the admin API.
            </p>
          </div>

        </div>
      )}

      {/* =========================
          MODERATION
      ========================= */}

      {activeTab === 'moderation' && (
        <div className="card">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">
                Content Moderation
              </h2>

              <p className="text-sm text-gray-500">
                Review and moderate user-generated posts.
              </p>
            </div>

            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>

          {moderationLoading || moderationFetching ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="space-y-4">

                {moderationData?.posts?.length ? (
                  moderationData.posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        <div className="flex-1">

                          <div className="flex items-center gap-2 mb-2">

                            <span className="font-semibold">
                              {post.author?.display_name ||
                                'Unknown user'}
                            </span>

                            {post.author?.email && (
                              <span className="text-xs text-gray-400">
                                {post.author.email}
                              </span>
                            )}

                          </div>

                          <p className="text-gray-700 whitespace-pre-wrap">
                            {post.content ||
                              'No content'}
                          </p>

                          {post.created_at && (
                            <p className="text-xs text-gray-400 mt-3">
                              {new Date(
                                post.created_at
                              ).toLocaleString()}
                            </p>
                          )}

                        </div>

                        <button
                          onClick={() =>
                            handleDeletePost(post.id)
                          }
                          disabled={
                            deletePostMutation.isLoading
                          }
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>

                      </div>

                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">

                    <Flag className="w-10 h-10 mx-auto text-gray-300 mb-3" />

                    <p className="text-gray-500">
                      No posts to moderate.
                    </p>

                  </div>
                )}

              </div>

              {moderationPagination &&
                moderationPagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6">

                    <p className="text-sm text-gray-500">
                      Page {moderationPagination.page} of{' '}
                      {moderationPagination.pages}
                    </p>

                    <div className="flex gap-2">

                      <button
                        disabled={page <= 1}
                        onClick={() =>
                          setPage((p) =>
                            Math.max(1, p - 1)
                          )
                        }
                        className="p-2 border rounded-lg disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        disabled={
                          page >=
                          moderationPagination.pages
                        }
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              moderationPagination.pages,
                              p + 1
                            )
                          )
                        }
                        className="p-2 border rounded-lg disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                )}
            </>
          )}

        </div>
      )}

    </div>
  );
}