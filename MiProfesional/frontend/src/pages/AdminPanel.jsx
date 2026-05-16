import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, Briefcase, Star, DollarSign, AlertTriangle, Shield, Eye } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'professionals', label: 'Professionals', icon: Briefcase },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reports', label: 'Reports', icon: AlertTriangle },
];

export default function AdminPanel() {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchDashboardData();
    fetchUsers();
    fetchProfessionals();
  }, [isAuthenticated, isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboardData(data.data || data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || data.users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionals = async () => {
    try {
      const { data } = await api.get('/professionals');
      setProfessionals(data.data || data.professionals || []);
    } catch (err) {
      console.error('Failed to fetch professionals', err);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      setUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      console.error('Failed to toggle user status', err);
    }
  };

  const updateVerification = async (professionalId, status) => {
    try {
      await api.patch(`/admin/professionals/${professionalId}/verification`, { status });
      setProfessionals(prev =>
        prev.map(p => (p._id === professionalId ? { ...p, verificationStatus: status } : p))
      );
    } catch (err) {
      console.error('Failed to update verification', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Shield className="h-16 w-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: dashboardData?.stats?.totalUsers ?? dashboardData?.totalUsers ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Professionals', value: dashboardData?.stats?.totalProfessionals ?? dashboardData?.totalProfessionals ?? '—', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Total Bookings', value: dashboardData?.stats?.totalBookings ?? dashboardData?.totalBookings ?? '—', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Total Revenue', value: dashboardData?.stats?.totalRevenue ? `$${dashboardData.stats.totalRevenue}` : dashboardData?.totalRevenue ? `$${dashboardData.totalRevenue}` : '—', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage users, professionals, reviews, and reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
            <div className={`${stat.bg} p-3 rounded-lg`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 font-medium text-gray-500">Name</th>
                        <th className="pb-3 font-medium text-gray-500">Email</th>
                        <th className="pb-3 font-medium text-gray-500">Role</th>
                        <th className="pb-3 font-medium text-gray-500">Status</th>
                        <th className="pb-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={5} className="pt-6 text-center text-gray-400">No users found.</td>
                        </tr>
                      )}
                      {users.map((u) => (
                        <tr key={u._id} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{u.name}</td>
                          <td className="py-3 text-gray-600">{u.email}</td>
                          <td className="py-3">
                            <span className="capitalize text-gray-700">{u.role}</span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => toggleUserStatus(u._id, u.isActive)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                u.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'professionals' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 font-medium text-gray-500">Business Name</th>
                        <th className="pb-3 font-medium text-gray-500">Profession</th>
                        <th className="pb-3 font-medium text-gray-500">Verification</th>
                        <th className="pb-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professionals.length === 0 && (
                        <tr>
                          <td colSpan={4} className="pt-6 text-center text-gray-400">No professionals found.</td>
                        </tr>
                      )}
                      {professionals.map((p) => (
                        <tr key={p._id} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{p.businessName || p.name}</td>
                          <td className="py-3 text-gray-600 capitalize">{p.profession || '—'}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                p.verificationStatus === 'verified'
                                  ? 'bg-green-100 text-green-700'
                                  : p.verificationStatus === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {p.verificationStatus === 'verified' && <CheckCircle className="h-3 w-3" />}
                              {p.verificationStatus === 'rejected' && <XCircle className="h-3 w-3" />}
                              {p.verificationStatus === 'pending' && <AlertTriangle className="h-3 w-3" />}
                              {p.verificationStatus || 'pending'}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateVerification(p._id, 'verified')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateVerification(p._id, 'rejected')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Eye className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Reviews Management</h3>
                  <p className="text-gray-400 mt-1">Coming soon — review moderation features will appear here.</p>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-500">Reports Management</h3>
                  <p className="text-gray-400 mt-1">Coming soon — user-reported content moderation will appear here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
