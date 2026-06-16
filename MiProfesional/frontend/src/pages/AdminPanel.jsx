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
  Activity, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, RefreshCw, Wifi, Database, Server, Terminal,
  Building2, Crown, Zap, FileText, Eye, Store
} from 'lucide-react';

const sidebar = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'professionals', label: 'Profesionales', icon: Briefcase },
  { id: 'companies', label: 'Empresas', icon: Building2 },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'cvs', label: 'Curriculums', icon: FileText },
  { id: 'stats', label: 'Estadisticas', icon: BarChart3 },
  { id: 'settings', label: 'Configuracion', icon: Settings },
];

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  professional: 'bg-blue-100 text-blue-700',
  client: 'bg-gray-100 text-gray-700',
  company: 'bg-amber-100 text-amber-700',
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

  const [companies, setCompanies] = useState([]);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesTotal, setCompaniesTotal] = useState(0);
  const [companiesSearch, setCompaniesSearch] = useState('');
  const [companiesSubFilter, setCompaniesSubFilter] = useState('');
  const [companiesStats, setCompaniesStats] = useState(null);

  const [companyPayments, setCompanyPayments] = useState([]);
  const [companyPaymentsPage, setCompanyPaymentsPage] = useState(1);
  const [companyPaymentsTotal, setCompanyPaymentsTotal] = useState(0);

  const [cvs, setCvs] = useState([]);
  const [cvsPage, setCvsPage] = useState(1);
  const [cvsTotal, setCvsTotal] = useState(0);
  const [cvsSearch, setCvsSearch] = useState('');
  const [cvsProfessionFilter, setCvsProfessionFilter] = useState('');
  const [cvsCompletenessFilter, setCvsCompletenessFilter] = useState('');
  const [cvsCategoryFilter, setCvsCategoryFilter] = useState('');
  const [cvsStatusFilter, setCvsStatusFilter] = useState('');
  const [cvsSubcategoryFilter, setCvsSubcategoryFilter] = useState('');
  const [selectedCv, setSelectedCv] = useState(null);
  const [selectedCvFull, setSelectedCvFull] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    fetchProfessionals();
    fetchPayments();
    fetchStats();
    fetchCompanies();
    fetchCompaniesStats();
    fetchCompanyPayments();
    fetchCVs();
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

  const fetchCompanies = async (page = 1, search = '', subFilter = '') => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (subFilter) params.subscriptionStatus = subFilter;
      const { data } = await api.get('/admin/companies', { params });
      setCompanies(data.data || []);
      setCompaniesTotal(data.pagination?.total || 0);
      setCompaniesPage(page);
    } catch (e) { console.error(e); }
  };

  const fetchCompaniesStats = async () => {
    try {
      const { data } = await api.get('/admin/companies/stats');
      setCompaniesStats(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchCompanyPayments = async (page = 1) => {
    try {
      const { data } = await api.get('/admin/payments/companies', { params: { page, limit: 15 } });
      setCompanyPayments(data.data || []);
      setCompanyPaymentsTotal(data.pagination?.total || 0);
      setCompanyPaymentsPage(page);
    } catch (e) { console.error(e); }
  };

  const handleCompanySearch = (e) => {
    e.preventDefault();
    fetchCompanies(1, companiesSearch, companiesSubFilter);
  };

  const toggleUserStatus = async (id, current) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive: !current });
      fetchUsers(usersPage, usersSearch);
      fetchCompanies(companiesPage, companiesSearch, companiesSubFilter);
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

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Eliminar a ${name} y todos sus datos asociados?`)) return;
    try {
      const { data } = await api.delete(`/admin/users/${id}`);
      fetchUsers(usersPage, usersSearch);
    } catch (e) { alert(e.response?.data?.message || 'Error al eliminar usuario'); }
  };

  const reprocessPayment = async (userId) => {
    try {
      const { data } = await api.post(`/admin/reprocess-webhook/${userId}`);
      alert(data.message || 'Suscripcion reactivada');
      fetchPayments(paymentsPage);
      fetchCompanies(companiesPage, companiesSearch, companiesSubFilter);
      fetchCompanyPayments(companyPaymentsPage);
    } catch (e) { alert(e.response?.data?.message || 'Error al reprocesar'); }
  };

  const fetchCVs = async (page = 1, search = '', profession = '', completeness = '', category = '', status = '', subcategory = '') => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (profession) params.profession = profession;
      if (completeness) params.completeness = completeness;
      if (category) params.category = category;
      if (status) params.status = status;
      if (subcategory) params.subcategory = subcategory;
      const { data } = await api.get('/admin/cvs', { params });
      setCvs(data.data || []);
      setCvsTotal(data.pagination?.total || 0);
      setCvsPage(page);
    } catch (e) { console.error(e); }
  };

  const handleCvSearch = (e) => {
    e.preventDefault();
    fetchCVs(1, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter);
  };

  const updateCvStatus = async (id, status) => {
    try {
      await api.patch(`/admin/cvs/${id}/status`, { status });
      fetchCVs(cvsPage, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter);
    } catch (e) { console.error(e); }
  };

  const toggleCvFeatured = async (id) => {
    try {
      await api.patch(`/admin/cvs/${id}/featured`);
      fetchCVs(cvsPage, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter);
    } catch (e) { console.error(e); }
  };

  const deleteCv = async (id, name) => {
    if (!window.confirm(`Eliminar el CV de ${name}?`)) return;
    try {
      await api.delete(`/admin/cvs/${id}`);
      if (selectedCv?._id === id) setSelectedCv(null);
      if (selectedCvFull?._id === id) setSelectedCvFull(null);
      fetchCVs(cvsPage, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter);
    } catch (e) { console.error(e); }
  };

  const openCvDetail = async (cv) => {
    setSelectedCv(cv);
    try {
      const { data } = await api.get(`/admin/cvs/${cv._id}`);
      setSelectedCvFull(data.data);
    } catch (e) {
      setSelectedCvFull(cv);
    }
  };

  const cleanTestData = async () => {
    if (!window.confirm('Eliminar todos los datos de prueba (usuarios test/fix/demo)? Esta accion no se puede deshacer.')) return;
    try {
      const { data } = await api.post('/admin/clean-test-data');
      alert(data.message);
      fetchDashboard(); fetchUsers(); fetchProfessionals(); fetchPayments(); fetchStats(); fetchCompanies(); fetchCompaniesStats(); fetchCompanyPayments();
    } catch (e) { alert('Error al limpiar datos'); }
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
    { label: 'Empresas', value: (dashboard.stats.totalCompanies || 0).toLocaleString(), icon: Building2, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
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

              {/* CV Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileText size={20} className="text-purple-600" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{(dashboard?.stats?.totalCVs || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Curriculums</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle size={20} className="text-emerald-600" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{(dashboard?.stats?.totalCVsComplete || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Curriculums Completos</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-amber-600" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{(dashboard?.stats?.totalCVsIncomplete || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Curriculums Incompletos</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <CreditCard size={20} className="text-blue-600" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{(dashboard?.stats?.totalPayments || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Pagos</p>
                </div>
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
                              <option value="company">company</option>
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
                        <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                          <button onClick={() => toggleUserStatus(u._id, u.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                              u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive ? 'Bloquear' : 'Activar'}
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u._id, u.name)}
                              className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                              title="Eliminar usuario"
                            ><Trash2 size={12} /></button>
                          )}
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
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Marketplace</th>
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
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              const cats = p.categories?.length ? p.categories : (p.categoryId ? [{ categoryId: p.categoryId, subcategoryId: p.subcategoryId }] : []);
                              return cats.length > 0 ? cats.map((cat, i) => {
                                const catTitle = cat.categoryId?.title || (typeof cat.categoryId === 'string' ? cat.categoryId.slice(-6) : '—');
                                const subTitle = cat.subcategoryId?.title || (typeof cat.subcategoryId === 'string' ? cat.subcategoryId.slice(-6) : null);
                                return (
                                  <span key={i} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded-md ${subTitle ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {catTitle}{subTitle ? <span className="opacity-50">→</span> : ''}{subTitle}
                                  </span>
                                );
                              }) : <span className="text-gray-400 text-xs">—</span>;
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md ${
                            p.primaryCategory === 'comercio' ? 'bg-amber-50 text-amber-700' :
                            p.primaryCategory === 'empresa' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {p.primaryCategory === 'comercio' ? <>
                              <Store size={10} /> Comercio{p.commerceType ? <span className="opacity-50">·{p.commerceType}</span> : ''}
                            </> : p.primaryCategory === 'empresa' ? <>
                              <Building2 size={10} /> Empresa
                            </> : p.primaryCategory === 'professional' ? <>
                              <Briefcase size={10} /> Profesional
                            </> : '—'}
                          </span>
                        </td>
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

          {/* ===== COMPANIES ===== */}
          {activeSection === 'companies' && (
            <div className="space-y-6">
              {/* Companies stats cards */}
              {companiesStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 size={18} className="text-amber-500" />
                      <ArrowUpRight size={14} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{companiesStats.totalCompanies}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Total empresas</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Crown size={18} className="text-emerald-500" />
                      <ArrowUpRight size={14} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{companiesStats.activeSubscriptions}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Suscripciones activas</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <XCircle size={18} className="text-red-500" />
                      <ArrowUpRight size={14} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{companiesStats.suspendedCompanies}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Suspendidas</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Zap size={18} className="text-primary-500" />
                      <ArrowUpRight size={14} className="text-gray-300" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {companiesStats.totalCompanies > 0
                        ? Math.round((companiesStats.activeSubscriptions / companiesStats.totalCompanies) * 100) + '%'
                        : '0%'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">Tasa de conversion</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">Empresas</h2>
                    <p className="text-xs text-gray-500">{companiesTotal} registradas</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select value={companiesSubFilter} onChange={e => { setCompaniesSubFilter(e.target.value); fetchCompanies(1, companiesSearch, e.target.value); }}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Todas</option>
                      <option value="active">Activas</option>
                      <option value="suspended">Suspendidas</option>
                    </select>
                    <form onSubmit={handleCompanySearch} className="flex gap-2">
                      <div className="relative w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={companiesSearch} onChange={e => setCompaniesSearch(e.target.value)}
                          placeholder="Buscar empresa..."
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
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Suscripcion</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                        <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay empresas registradas</td></tr>
                      )}
                      {companies.map(c => (
                        <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                {c.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <span className="font-medium text-gray-900">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{c.email}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                              c.subscription?.plan === 'company' ? 'bg-amber-100 text-amber-700' :
                              c.subscription?.plan === 'professional' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {c.subscription?.plan === 'company' && <Crown size={10} />}
                              {c.subscription?.plan || 'free'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                              c.subscription?.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              c.subscription?.status === 'suspended' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {c.subscription?.status === 'active' && <CheckCircle size={10} />}
                              {c.subscription?.status === 'suspended' && <XCircle size={10} />}
                              {c.subscription?.status || 'inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {c.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                              {c.isActive ? 'Activo' : 'Bloqueado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {c.subscription?.endDate ? new Date(c.subscription.endDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => toggleUserStatus(c._id, c.isActive)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                                  c.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                              >
                                {c.isActive ? 'Bloquear' : 'Activar'}
                              </button>
                              {c.subscription?.status === 'active' && c.subscription?.endDate && (
                                <button onClick={() => reprocessPayment(c._id)}
                                  className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                  title="Reactivar suscripcion"><RefreshCw size={12} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>Pagina {companiesPage} de {Math.ceil(companiesTotal / 15) || 1}</span>
                  <div className="flex gap-2">
                    <button disabled={companiesPage <= 1} onClick={() => fetchCompanies(companiesPage - 1, companiesSearch, companiesSubFilter)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Anterior</button>
                    <button disabled={companiesPage >= Math.ceil(companiesTotal / 15)} onClick={() => fetchCompanies(companiesPage + 1, companiesSearch, companiesSubFilter)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Siguiente</button>
                  </div>
                </div>
              </div>

              {/* Company Payments sub-section */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={16} /> Pagos de Empresas
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{companyPaymentsTotal} transacciones de empresas</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyPayments.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay pagos de empresas</td></tr>
                      )}
                      {companyPayments.map(p => (
                        <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4 text-[10px] text-gray-400 font-mono">{(p.mpPaymentId || p._id).toString().slice(-8)}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 text-xs">{p.userId?.name || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 block">{p.userId?.email || ''}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{p.description || p.type || 'Suscripcion empresa'}</td>
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
                          <td className="py-3 px-4 text-right">
                            {p.status === 'approved' && p.userId?._id && (
                              <button onClick={() => reprocessPayment(p.userId._id)}
                                className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                title="Reactivar suscripcion"><RefreshCw size={12} /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>Pagina {companyPaymentsPage} de {Math.ceil(companyPaymentsTotal / 15) || 1}</span>
                  <div className="flex gap-2">
                    <button disabled={companyPaymentsPage <= 1} onClick={() => fetchCompanyPayments(companyPaymentsPage - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Anterior</button>
                    <button disabled={companyPaymentsPage >= Math.ceil(companyPaymentsTotal / 15)} onClick={() => fetchCompanyPayments(companyPaymentsPage + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Siguiente</button>
                  </div>
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
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
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
                        <td className="py-3 px-4 text-right">
                          {p.status === 'approved' && p.userId?._id && (
                            <button onClick={() => reprocessPayment(p.userId._id)}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                              title="Reactivar suscripcion"><RefreshCw size={12} /></button>
                          )}
                        </td>
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
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Configuracion del Sistema</h2>
                <p className="text-sm text-gray-500 mb-6">Administra el estado del servidor, caracteristicas y datos</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-4"><Server size={16} /> Modo Mantenimiento</h3>
                    <p className="text-xs text-gray-500 mb-3">Cuando esta activo, los usuarios no pueden realizar cambios en el sistema</p>
                    <div className="flex items-center gap-3">
                      <button onClick={async () => {
                        try { await api.post('/admin/maintenance', { active: true, message: 'Sistema en mantenimiento' }); alert('Modo mantenimiento activado'); } catch (e) { alert('Error'); }
                      }} className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600">Activar</button>
                      <button onClick={async () => {
                        try { await api.post('/admin/maintenance', { active: false }); alert('Modo mantenimiento desactivado'); } catch (e) { alert('Error'); }
                      }} className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50">Desactivar</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-4"><Terminal size={16} /> Registros de Errores</h3>
                    <p className="text-xs text-gray-500 mb-3">Los errores recientes se almacenan en memoria para diagnostico rapido</p>
                    <button onClick={async () => {
                      try { await api.post('/admin/clear-errors'); alert('Errores limpiados'); } catch (e) { alert('Error'); }
                    }} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600">Limpiar Errores</button>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-4"><Wifi size={16} /> Feature Flags</h3>
                    <p className="text-xs text-gray-500 mb-3">Activa o desactiva funcionalidades del sistema en tiempo real</p>
                    <div className="flex items-center gap-2">
                      <input id="ffKey" placeholder="Nombre (ej: new_search)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" />
                      <button onClick={() => {
                        const input = document.getElementById('ffKey');
                        const key = input?.value?.trim();
                        if (key) { api.post('/admin/features', { key, value: true }); alert(`Feature "${key}" activado`); input.value = ''; }
                      }} className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Activar</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-4"><Database size={16} /> Limpiar Datos de Prueba</h3>
                    <p className="text-xs text-gray-500 mb-3">Elimina usuarios de prueba (test, demo, fix, etc.) y sus datos asociados</p>
                    <button onClick={cleanTestData}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Limpiar Datos de Prueba</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><Activity size={16} /> Estado del Servidor</h3>
                <SystemStatus />
              </div>
            </div>
          )}

          {/* ===== CURRÍCULUMS ===== */}
          {activeSection === 'cvs' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <form onSubmit={handleCvSearch} className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className="flex-1 relative min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Buscar por nombre, email o telefono..."
                      value={cvsSearch} onChange={e => setCvsSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" />
                  </div>
                  <input type="text" placeholder="Profesion..."
                    value={cvsProfessionFilter} onChange={e => setCvsProfessionFilter(e.target.value)}
                    className="w-full md:w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" />
                  <select value={cvsCategoryFilter} onChange={e => setCvsCategoryFilter(e.target.value)}
                    className="w-full md:w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
                    <option value="">Categoria</option>
                    <option value="professional">Profesionales</option>
                    <option value="empresa">Empresas</option>
                    <option value="comercio">Comercio</option>
                  </select>
                  <select value={cvsStatusFilter} onChange={e => setCvsStatusFilter(e.target.value)}
                    className="w-full md:w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
                    <option value="">Estado</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="revisado">Revisado</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                  <input type="text" placeholder="Subcategoria..."
                    value={cvsSubcategoryFilter} onChange={e => setCvsSubcategoryFilter(e.target.value)}
                    className="w-full md:w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" />
                  <select value={cvsCompletenessFilter} onChange={e => setCvsCompletenessFilter(e.target.value)}
                    className="w-full md:w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500">
                    <option value="">Completitud</option>
                    <option value="complete">Completos</option>
                    <option value="incomplete">Incompletos</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all">
                    <Search size={14} className="inline mr-1" /> Buscar
                  </button>
                </form>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">Curriculums</h2>
                    <p className="text-xs text-gray-500">{cvsTotal} registros</p>
                  </div>
                  <button onClick={() => fetchCVs(1, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Profesion</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Estado CV</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Destacado</th>
                        <th className="text-left py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="text-right py-3 px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cvs.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-10 text-gray-400">No hay curriculums registrados</td></tr>
                      )}
                      {cvs.map(cv => (
                        <tr key={cv._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 text-xs">{cv.fullName}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs truncate max-w-[120px]">{cv.email}</td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700 text-xs">{cv.profession || '—'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md ${
                              cv.primaryCategory === 'comercio' ? 'bg-amber-50 text-amber-700' :
                              cv.primaryCategory === 'empresa' ? 'bg-blue-50 text-blue-700' :
                              cv.primaryCategory === 'professional' ? 'bg-gray-100 text-gray-700' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              {cv.primaryCategory === 'comercio' ? 'Comercio' :
                               cv.primaryCategory === 'empresa' ? 'Empresa' :
                               cv.primaryCategory === 'professional' ? 'Profesional' :
                               '—'}
                            </span>
                            {cv.subCategory && <span className="ml-1 text-[10px] text-gray-400">· {cv.subCategory}</span>}
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{cv.skillsCount}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                              cv.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                              cv.status === 'revisado' ? 'bg-blue-100 text-blue-700' :
                              cv.status === 'rechazado' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {cv.status === 'aprobado' && <CheckCircle size={10} />}
                              {cv.status === 'rechazado' && <XCircle size={10} />}
                              {cv.status === 'revisado' && <Clock size={10} />}
                              {(!cv.status || cv.status === 'nuevo') && <AlertTriangle size={10} />}
                              {cv.status || 'nuevo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {cv.featured ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-medium">
                                <Crown size={10} /> Si
                              </span>
                            ) : (
                              <span className="text-gray-300 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">{new Date(cv.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openCvDetail(cv)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all"
                              ><Eye size={12} /> Ver</button>
                              <div className="relative group">
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-all">
                                  <MoreHorizontal size={14} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 hidden group-hover:block">
                                  {cv.status !== 'aprobado' && (
                                    <button onClick={() => updateCvStatus(cv._id, 'aprobado')}
                                      className="w-full text-left px-3 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                                      <CheckCircle size={12} /> Aprobar
                                    </button>
                                  )}
                                  {cv.status !== 'revisado' && (
                                    <button onClick={() => updateCvStatus(cv._id, 'revisado')}
                                      className="w-full text-left px-3 py-1.5 text-[11px] text-blue-700 hover:bg-blue-50 flex items-center gap-2">
                                      <Clock size={12} /> Marcar revisado
                                    </button>
                                  )}
                                  {cv.status !== 'rechazado' && (
                                    <button onClick={() => updateCvStatus(cv._id, 'rechazado')}
                                      className="w-full text-left px-3 py-1.5 text-[11px] text-red-700 hover:bg-red-50 flex items-center gap-2">
                                      <XCircle size={12} /> Rechazar
                                    </button>
                                  )}
                                  <button onClick={() => toggleCvFeatured(cv._id)}
                                    className="w-full text-left px-3 py-1.5 text-[11px] text-amber-700 hover:bg-amber-50 flex items-center gap-2">
                                    <Crown size={12} /> {cv.featured ? 'Quitar destacado' : 'Destacar'}
                                  </button>
                                  <hr className="my-1 border-gray-100" />
                                  <button onClick={() => deleteCv(cv._id, cv.fullName)}
                                    className="w-full text-left px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Trash2 size={12} /> Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>Pagina {cvsPage} de {Math.ceil(cvsTotal / 15) || 1}</span>
                  <div className="flex gap-2">
                    <button disabled={cvsPage <= 1} onClick={() => fetchCVs(cvsPage - 1, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Anterior</button>
                    <button disabled={cvsPage >= Math.ceil(cvsTotal / 15)} onClick={() => fetchCVs(cvsPage + 1, cvsSearch, cvsProfessionFilter, cvsCompletenessFilter, cvsCategoryFilter, cvsStatusFilter, cvsSubcategoryFilter)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:border-gray-300">Siguiente</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CV Detail Modal */}
          {selectedCv && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setSelectedCv(null); setSelectedCvFull(null); }}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                  <h3 className="font-bold text-gray-900 text-lg">Detalle del Curriculum</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      selectedCv.status === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                      selectedCv.status === 'revisado' ? 'bg-blue-100 text-blue-700' :
                      selectedCv.status === 'rechazado' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedCv.status || 'nuevo'}
                    </span>
                    {selectedCv.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-medium">
                        <Crown size={10} /> Destacado
                      </span>
                    )}
                    <button onClick={() => { setSelectedCv(null); setSelectedCvFull(null); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center">
                      <FileText size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{selectedCv.fullName}</h4>
                      <p className="text-sm text-gray-500">{selectedCv.profession || 'Sin profesion'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          selectedCv.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedCv.isComplete ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                          {selectedCv.isComplete ? 'Completo' : 'Incompleto'}
                        </span>
                        <span className="text-[10px] text-gray-400">Creado: {new Date(selectedCv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedCv.email || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Telefono</p>
                      <p className="text-sm font-medium text-gray-900">{selectedCv.phone || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Categoria</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedCv.primaryCategory === 'comercio' ? 'Comercio' :
                         selectedCv.primaryCategory === 'empresa' ? 'Empresa' :
                         selectedCv.primaryCategory === 'professional' ? 'Profesional' : '—'}
                        {selectedCv.subCategory ? <span className="text-gray-400 text-xs"> · {selectedCv.subCategory}</span> : ''}
                      </p>
                    </div>
                  </div>

                  {/* Full CV Data */}
                  {selectedCvFull && (
                    <>
                      {/* Tags */}
                      {selectedCvFull.tags?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCvFull.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {selectedCvFull.skills?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Habilidades ({selectedCvFull.skills.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCvFull.skills.map((skill, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                skill.level === 'experto' ? 'bg-purple-100 text-purple-700' :
                                skill.level === 'avanzado' ? 'bg-blue-100 text-blue-700' :
                                skill.level === 'intermedio' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {skill.name}{skill.level ? <span className="opacity-50 ml-0.5">·{skill.level}</span> : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {selectedCvFull.experience?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Experiencia ({selectedCvFull.experience.length})</p>
                          <div className="space-y-2">
                            {selectedCvFull.experience.map((exp, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{exp.jobTitle || 'Sin titulo'}</p>
                                    <p className="text-xs text-gray-500">{exp.company || ''}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '?'}
                                    {' — '}
                                    {exp.current ? 'Actual' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '?'}
                                  </span>
                                </div>
                                {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {selectedCvFull.education?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Educacion ({selectedCvFull.education.length})</p>
                          <div className="space-y-2">
                            {selectedCvFull.education.map((edu, i) => (
                              <div key={i} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{edu.degree || 'Sin titulo'}</p>
                                    <p className="text-xs text-gray-500">{edu.institution}{edu.field ? ` · ${edu.field}` : ''}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {edu.startDate ? new Date(edu.startDate).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '?'}
                                    {' — '}
                                    {edu.current ? 'Actual' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '?'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location & Availability */}
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCvFull.location?.city && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Ubicacion</p>
                            <p className="text-sm font-medium text-gray-900">
                              {[selectedCvFull.location.city, selectedCvFull.location.state].filter(Boolean).join(', ') || '—'}
                            </p>
                          </div>
                        )}
                        {selectedCvFull.availability?.status && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Disponibilidad</p>
                            <p className="text-sm font-medium text-gray-900">{selectedCvFull.availability.status}</p>
                            <p className="text-[10px] text-gray-400">
                              {selectedCvFull.availability.mode} · {selectedCvFull.availability.hours}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Experience Level */}
                      {selectedCvFull.experienceLevel && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Nivel de Experiencia</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{selectedCvFull.experienceLevel}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Linked User */}
                  {selectedCv.userId && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Vinculado a Usuario</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {(selectedCv.userId.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedCv.userId.name || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{selectedCv.userId.email || ''}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2">
                    <div className="flex gap-1.5">
                      <button onClick={() => updateCvStatus(selectedCv._id, 'revisado')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          selectedCv.status === 'revisado' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`} disabled={selectedCv.status === 'revisado'}>
                        <Clock size={12} className="inline mr-1" /> Revisado
                      </button>
                      <button onClick={() => updateCvStatus(selectedCv._id, 'aprobado')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          selectedCv.status === 'aprobado' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`} disabled={selectedCv.status === 'aprobado'}>
                        <CheckCircle size={12} className="inline mr-1" /> Aprobar
                      </button>
                      <button onClick={() => updateCvStatus(selectedCv._id, 'rechazado')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          selectedCv.status === 'rechazado' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`} disabled={selectedCv.status === 'rechazado'}>
                        <XCircle size={12} className="inline mr-1" /> Rechazar
                      </button>
                    </div>
                    <div className="flex gap-1.5 ml-auto">
                      <button onClick={() => toggleCvFeatured(selectedCv._id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          selectedCv.featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                        }`}>
                        <Crown size={12} className="inline mr-1" /> {selectedCv.featured ? 'Destacado' : 'Destacar'}
                      </button>
                      <button onClick={() => { deleteCv(selectedCv._id, selectedCv.fullName); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all">
                        <Trash2 size={12} className="inline mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

const SystemStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/system-status').then(r => setStatus(r.data.data)).catch(e => console.error('Error al obtener estado del sistema:', e)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Cargando...</div>;
  if (!status) return <p className="text-sm text-red-500">Error al obtener estado</p>;

  const { server, database, maintenance, features, recentErrors } = status;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Solicitudes</p>
          <p className="text-lg font-bold text-gray-900">{server?.requestCount || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Memoria</p>
          <p className="text-lg font-bold text-gray-900">{server?.memory?.rss || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Node</p>
          <p className="text-lg font-bold text-gray-900">{server?.nodeVersion || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Uptime</p>
          <p className="text-lg font-bold text-gray-900">{server?.uptime ? `${Math.round(server.uptime / 60)}min` : '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">DB</p>
          <p className="text-sm font-bold text-gray-900">{database?.state || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Usuarios</p>
          <p className="text-lg font-bold text-gray-900">{database?.collections?.users || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Profesionales</p>
          <p className="text-lg font-bold text-gray-900">{database?.collections?.professionals || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] text-gray-500 uppercase font-semibold">Mantenimiento</p>
          <p className={`text-sm font-bold ${maintenance?.active ? 'text-red-600' : 'text-emerald-600'}`}>{maintenance?.active ? 'ACTIVO' : 'Inactivo'}</p>
        </div>
      </div>

      {recentErrors?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Errores Recientes ({recentErrors.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {recentErrors.slice(0, 10).map((e, i) => (
              <div key={i} className="text-[10px] font-mono text-red-600 bg-red-50 rounded px-2 py-1">
                {e.timestamp?.slice(11, 19)} — {e.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
