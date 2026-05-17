import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Briefcase, CreditCard, BarChart3, Settings,
  ChevronDown, Search, CheckCircle, XCircle, AlertTriangle, Clock,
  Shield, Star, Mail, Phone, MapPin, Trash2, ExternalLink, Edit3,
  UserPlus, DollarSign, Calendar, Filter, ArrowUpRight, TrendingUp,
  Activity, Loader2, ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';

const sidebar = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'professionals', label: 'Profesionales', icon: Briefcase },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'stats', label: 'Estadisticas', icon: BarChart3 },
  { id: 'settings', label: 'Configuracion', icon: Settings },
];

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  professional: 'bg-blue-100 text-blue-700',
  client: 'bg-gray-100 text-gray-700',
};

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-700',
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');

  const [professionals, setProfessionals] = useState([]);
  const [prosPage, setProsPage] = useState(1);
  const [prosTotal, setProsTotal] = useState(0);
  const [prosSearch, setProsSearch] = useState('');
  const [prosFilter, setProsFilter] = useState('');

  const [payments, setPayments] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);

  const [detailedStats, setDetailedStats] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchProfessionals();
    fetchPayments();
    fetchStats();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data.data || data);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
      setUsersTotal(data.pagination?.total || 0);
      setUsersPage(page);
    } catch (e) { console.error(e); }
  };

  const fetchProfessionals = async (page = 1, filter = '', search = '') => {
    try {
      const params = { page, limit: 15 };
      if (filter) params.verification = filter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/professionals', { params });
      setProfessionals(data.data || []);
      setProsTotal(data.pagination?.total || 0);
      setProsPage(page);
    } catch (e) { console.error(e); }
  };

  const fetchPayments = async (page = 1) => {
    try {
      const { data } = await api.get('/admin/payments', { params: { page, limit: 15 } });
      setPayments(data.data || []);
      setPaymentsTotal(data.pagination?.total || 0);
      setPaymentsPage(page);
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setDetailedStats(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleUserStatus = async (id, current) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !current });
      fetchUsers(usersPage, usersSearch);
    } catch (e) { console.error(e); }
  };

  const changeUserRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      fetchUsers(usersPage, usersSearch);
    } catch (e) { console.error(e); }
  };

  const updateVerification = async (id, status) => {
    try {
      await api.patch(`/admin/professionals/${id}/verification`, { status });
      fetchProfessionals(prosPage, prosFilter, prosSearch);
    } catch (e) { console.error(e); }
  };

  const deleteProfessional = async (id) => {
    if (!window.confirm('Eliminar este profesional permanentemente?')) return;
    try {
      await api.delete(`/admin/professionals/${id}`);
      fetchProfessionals(prosPage, prosFilter, prosSearch);
    } catch (e) { console.error(e); }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, usersSearch);
  };

  const handleProSearch = (e) => {
    e.preventDefault();
    fetchProfessionals(1, prosFilter, prosSearch);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  );

  const stats = dashboard?.stats ? [
    { label: 'Usuarios', value: dashboard.stats.totalUsers.toLocaleString(), icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
    { label: 'Profesionales', value: dashboard.stats.totalProfessionals.toLocaleString(), icon: Briefcase, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Reservas', value: dashboard.stats.totalBookings.toLocaleString(), icon: Calendar, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
    { label: 'Ingresos', value: `$${(dashboard.stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Helmet><title>Admin Panel — MiProfesional</title></Helmet>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} bg-gray-900 text-white transition-all duration-300 flex-shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-black text-sm shrink-0">MP</div>
            {sidebarOpen && <span className="font-bold text-sm">Admin</span>}
          </Link>
        </div>
        <nav className="p-2 space-y-1">
          {sidebar.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-primary-600/20 text-primary-300' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span>{s.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft size={16} className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">
            {sidebar.find(s => s.id === activeSection)?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{user?.name}</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-semibold uppercase">Admin</span>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* ===== DASHBOARD ===== */}
          {activeSection === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover-lift">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                          <Icon size={20} className={`text-${s.color.split(' ')[0].replace('from-', '')}`} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-300" />
                      </div>
                      <p className="text-2xl font-black text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Usuarios Recientes</h3>
                  <div className="space-y-3">
                    {(dashboard?.recentUsers || []).slice(0, 5).map(u => (
                      <div key={u._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Actividad Reciente</h3>
                  <div className="space-y-3">
                    {(dashboard?.recentBookings || []).slice(0, 5).map(b => (
                      <div key={b._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Activity size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.serviceName || 'Reserva'}</p>
                            <p className="text-xs text-gray-400">{b.userId?.name || 'Usuario'} — {new Date(b.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== USERS ===== */}
          {activeSection === 'users' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Usuarios</h2>
                  <p className="text-xs text-gray-500">{usersTotal} registrados</p>
                </div>
                <form onSubmit={handleUserSearch} className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={usersSearch} onChange={e => setUsersSearch(e.target.value)}
                      placeholder="Buscar por nombre o email..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Buscar</button>
                </form>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay usuarios</td></tr>
                    )}
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                              {u.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{u.email}</td>
                        <td className="py-3 px-4">
                          <select value={u.role} onChange={e => changeUserRole(u._id, e.target.value)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border-0 cursor-pointer ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="client">client</option>
                            <option value="professional">professional</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {u.isActive ? 'Activo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => toggleUserStatus(u._id, u.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                              u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Bloquear' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Pagina {usersPage} de {Math.ceil(usersTotal / 15) || 1}</span>
                <div className="flex gap-2">
                  <button disabled={usersPage <= 1} onClick={() => fetchUsers(usersPage - 1, usersSearch)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300 transition-all">Anterior</button>
                  <button disabled={usersPage >= Math.ceil(usersTotal / 15)} onClick={() => fetchUsers(usersPage + 1, usersSearch)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300 transition-all">Siguiente</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== PROFESSIONALS ===== */}
          {activeSection === 'professionals' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Profesionales</h2>
                  <p className="text-xs text-gray-500">{prosTotal} registrados</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select value={prosFilter} onChange={e => { setProsFilter(e.target.value); fetchProfessionals(1, e.target.value, prosSearch); }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="verified">Verificados</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                  <form onSubmit={handleProSearch} className="flex gap-2">
                    <div className="relative w-48">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={prosSearch} onChange={e => setProsSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Buscar</button>
                  </form>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Profesional</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rubro</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Verificacion</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionals.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay profesionales</td></tr>
                    )}
                    {professionals.map(p => (
                      <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.businessName || p.profession)}&background=0f7a5a&color=fff&size=32`}
                              className="w-8 h-8 rounded-full object-cover" alt="" />
                            <div>
                              <p className="font-medium text-gray-900">{p.businessName || p.profession}</p>
                              <p className="text-[10px] text-gray-400">{p.location?.city || '-'}, {p.location?.state || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.profession}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{p.categoryId?.title || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            p.verification?.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            p.verification?.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {p.verification?.verificationStatus === 'verified' && <CheckCircle size={10} />}
                            {p.verification?.verificationStatus === 'rejected' && <XCircle size={10} />}
                            {(!p.verification?.verificationStatus || p.verification?.verificationStatus === 'pending') && <Clock size={10} />}
                            {p.verification?.verificationStatus || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span className="font-medium text-gray-900 text-xs">{p.stats?.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.verification?.verificationStatus !== 'verified' && (
                              <button onClick={() => updateVerification(p._id, 'verified')}
                                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-medium hover:bg-emerald-100 transition-all"
                              >Aprobar</button>
                            )}
                            {p.verification?.verificationStatus !== 'rejected' && (
                              <button onClick={() => updateVerification(p._id, 'rejected')}
                                className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-medium hover:bg-red-100 transition-all"
                              >Rechazar</button>
                            )}
                            <Link to={`/service/${p._id}`} target="_blank"
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-all"
                            ><ExternalLink size={14} /></Link>
                            <button onClick={() => deleteProfessional(p._id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-all"
                            ><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Pagina {prosPage} de {Math.ceil(prosTotal / 15) || 1}</span>
                <div className="flex gap-2">
                  <button disabled={prosPage <= 1} onClick={() => fetchProfessionals(prosPage - 1, prosFilter, prosSearch)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Anterior</button>
                  <button disabled={prosPage >= Math.ceil(prosTotal / 15)} onClick={() => fetchProfessionals(prosPage + 1, prosFilter, prosSearch)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Siguiente</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {activeSection === 'payments' && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Pagos y Suscripciones</h2>
                <p className="text-xs text-gray-500">{paymentsTotal} transacciones</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay pagos registrados</td></tr>
                    )}
                    {payments.map(p => (
                      <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 text-[10px] text-gray-400 font-mono">{(p.mpPaymentId || p._id).toString().slice(-8)}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 text-xs">{p.userId?.name || 'N/A'}</span>
                          <span className="text-[10px] text-gray-400 block">{p.userId?.email || ''}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{p.description || p.type || 'Suscripcion'}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">${(p.amount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'rejected' || p.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {p.status === 'approved' && <CheckCircle size={10} />}
                            {p.status === 'pending' && <Clock size={10} />}
                            {p.status === 'rejected' && <XCircle size={10} />}
                            {p.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{new Date(p.createdAt || p.dateCreated).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Pagina {paymentsPage} de {Math.ceil(paymentsTotal / 15) || 1}</span>
                <div className="flex gap-2">
                  <button disabled={paymentsPage <= 1} onClick={() => fetchPayments(paymentsPage - 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Anterior</button>
                  <button disabled={paymentsPage >= Math.ceil(paymentsTotal / 15)} onClick={() => fetchPayments(paymentsPage + 1)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Siguiente</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== STATS ===== */}
          {activeSection === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Users size={16} /> Usuarios por Rol</h3>
                  <div className="space-y-3">
                    {(detailedStats?.userStats || []).map(s => (
                      <div key={s._id} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${roleColors[s._id] || 'bg-gray-100 text-gray-600'}`}>{s._id}</span>
                        <span className="font-bold text-gray-900">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Shield size={16} /> Profesionales</h3>
                  <div className="space-y-3">
                    {(detailedStats?.professionalStats || []).map(s => (
                      <div key={s._id} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[s._id] || 'bg-gray-100 text-gray-600'}`}>{s._id}</span>
                        <span className="font-bold text-gray-900">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><CreditCard size={16} /> Pagos por Estado</h3>
                  <div className="space-y-3">
                    {(detailedStats?.paymentStats || []).map(s => (
                      <div key={s._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{s._id}</span>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{s.count}</span>
                          {s.total > 0 && <span className="text-xs text-gray-400 ml-2">${s.total.toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} /> Ingresos Mensuales (ultimos 12)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-[10px] font-semibold text-gray-500 uppercase">Mes</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Transacciones</th>
                        <th className="text-right py-2 text-[10px] font-semibold text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailedStats?.revenueByMonth || []).map(r => (
                        <tr key={r._id} className="border-b border-gray-50">
                          <td className="py-2 font-medium text-gray-900">{r._id}</td>
                          <td className="py-2 text-right text-gray-600">{r.count}</td>
                          <td className="py-2 text-right font-medium text-gray-900">${(r.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Briefcase size={16} /> Profesionales por Categoria</h3>
                <div className="space-y-2">
                  {(detailedStats?.categoryStats || []).map(c => (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-40 truncate">{c.title}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(100, (c.count / Math.max(...(detailedStats?.categoryStats || []).map(x => x.count), 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeSection === 'settings' && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Settings size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Configuracion</h3>
              <p className="text-sm text-gray-500">Seccion de configuracion del panel administrativo.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
