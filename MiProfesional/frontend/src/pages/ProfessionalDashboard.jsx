import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Star, DollarSign, Users, Clock, CheckCircle, XCircle,
  BarChart3, TrendingUp, Award, MessageSquare, Eye, Settings,
  Edit3, BadgeCheck, ChevronRight, Bell, Shield, Briefcase,
  Upload, Image as ImageIcon, Trash2, Plus, CreditCard, AlertTriangle,
  Sparkles, Gift, ExternalLink, RefreshCw, FileText, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import DashboardStats from '../components/dashboard/StatsCards';

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0, completed: 0, cancelled: 0, rating: 0, reviewCount: 0,
    totalRevenue: 0, responseTime: 0, responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, analyticsRes] = await Promise.all([
        api.get('/professionals'),
        api.get('/analytics/dashboard')
      ]);
      api.get('/subscription/status').then(r => setSubscription(r.data?.data || null)).catch(() => {});
      const pro = (profilesRes.data.data || []).find(p => p.userId?._id === user?.id || p.userId === user?.id);
      setMyProfile(pro);
      setStats(prev => ({ ...prev, ...(analyticsRes.data.data || {}) }));

      if (pro) {
        const [bookingsRes, statsRes] = await Promise.all([
          api.get('/bookings/professional', { params: { professionalId: pro._id } }),
          api.get(`/professionals/${pro._id}/stats`).catch(() => ({ data: {} }))
        ]);
        setBookings(bookingsRes.data.data || []);
        if (statsRes.data?.stats) setStats(prev => ({ ...prev, ...statsRes.data.stats }));
        if (statsRes.data?.data) setStats(prev => ({ ...prev, ...statsRes.data.data }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
    } catch { alert('Error al actualizar estado'); }
  };

  const handleUploadPhotos = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      for (let i = 0; i < Math.min(files.length, 4); i++) form.append('photos', files[i]);
      await api.post('/upload/work-photos', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchData();
    } catch { alert('Error al subir fotos'); }
    setUploadingPhoto(false);
  };

  const handleDeletePhoto = async (index) => {
    try {
      await api.delete(`/upload/work-photos/${index}`);
      await fetchData();
    } catch { alert('Error al eliminar foto'); }
  };

  const handleUploadLicense = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLicense(true);
    try {
      const form = new FormData();
      form.append('license', file);
      await api.post('/upload/license', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchData();
    } catch { alert('Error al subir matricula'); }
    setUploadingLicense(false);
  };

  const handleCreatePayment = async () => {
    setCreatingPayment(true);
    try {
      const r = await api.post('/subscription/create-preapproval', { plan: 'monthly' });
      if (r.data.data.initPoint) {
        window.open(r.data.data.initPoint, '_blank');
      }
    } catch (e) { alert(e.response?.data?.message || 'Error al crear pago'); }
    setCreatingPayment(false);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );

  const statusColor = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const p = myProfile;
  const monthlyData = [
    { name: 'Ene', bookings: stats.totalBookings > 6 ? 8 : 2, revenue: stats.totalRevenue ? 45000 : 12000 },
    { name: 'Feb', bookings: 4, revenue: 28000 },
    { name: 'Mar', bookings: 6, revenue: 52000 },
    { name: 'Abr', bookings: 3, revenue: 19000 },
    { name: 'May', bookings: 7, revenue: 61000 },
    { name: 'Jun', bookings: stats.totalBookings || 5, revenue: stats.totalRevenue || 38000 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel Profesional</h1>
          <p className="text-gray-500 text-sm">{p?.businessName || p?.profession || 'Bienvenido'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {p?.verification?.isVerified ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
              <BadgeCheck size={14} /> Verificado
            </span>
          ) : p?.verification?.verificationStatus === 'pending' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
              <Clock size={14} /> En revision
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
              <Shield size={14} /> No verificado
            </span>
          )}
          <Link to="/profile" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-all">
            <Edit3 size={14} /> Editar
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Reservas', value: stats.totalBookings, icon: Calendar, color: 'from-primary-500 to-primary-600', bg: 'bg-primary-50' },
          { label: 'Completadas', value: stats.completed, icon: CheckCircle, color: 'from-green-500 to-green-600', bg: 'bg-green-50' },
          { label: 'Rating', value: stats.rating.toFixed(1), icon: Star, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
          { label: 'Ingresos', value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon size={16} className={s.color.split(' ')[1].replace('to-', 'text-') || 'text-primary-600'} />
                </div>
              </div>
              <p className="text-xl font-black text-gray-900">{typeof s.value === 'number' && s.value > 0 ? s.value.toLocaleString() : s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary-600" /> Reservas Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#0f7a5a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" /> Ingresos Mensuales
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#0f7a5a" strokeWidth={2} dot={{ fill: '#0f7a5a', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-5 -mb-px overflow-x-auto scrollbar-hide">
            {[
              { id: 'bookings', label: 'Reservas', icon: Calendar },
              { id: 'photos', label: 'Fotos Trabajos', icon: ImageIcon },
              { id: 'license', label: 'Matricula', icon: Shield },
              { id: 'subscription', label: 'Suscripcion', icon: CreditCard },
              { id: 'stats', label: 'Estadisticas', icon: BarChart3 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-1 py-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5">
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            bookings.length > 0 ? (
              <div className="space-y-2.5">
                {bookings.map((booking) => (
                  <div key={booking._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50 rounded-xl gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{booking.serviceName}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {booking.time}</span>
                        {booking.userId && <span>Cliente: {booking.userId.name || 'N/A'}</span>}
                        {booking.price > 0 && <span className="font-medium text-primary-600">${booking.price.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${statusColor(booking.status)}`}>
                        {booking.status === 'in_progress' ? 'En curso' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.status === 'confirmed' && (
                        <button onClick={() => updateStatus(booking._id, 'in_progress')}
                          className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-medium hover:bg-purple-700">Iniciar</button>
                      )}
                      {booking.status === 'in_progress' && (
                        <button onClick={() => updateStatus(booking._id, 'completed')}
                          className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-[10px] font-medium hover:bg-green-700">Completar</button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button onClick={() => updateStatus(booking._id, 'cancelled')}
                          className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-[10px] font-medium hover:bg-red-700">Cancelar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium text-sm">No tenes reservas aun</p>
              </div>
            )
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Fotos de Trabajos ({p?.workPhotos?.length || 0})</h3>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-primary-700 transition-all">
                  <Upload size={14} /> {uploadingPhoto ? 'Subiendo...' : 'Subir fotos'}
                  <input type="file" multiple accept="image/*" onChange={handleUploadPhotos} className="hidden" disabled={uploadingPhoto} />
                </label>
              </div>
              {p?.workPhotos?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {p.workPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                      <img src={photo.url} alt={photo.caption || 'Trabajo'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button onClick={() => handleDeletePhoto(idx)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <ImageIcon size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Subi fotos de tus trabajos</p>
                  <p className="text-gray-400 text-xs mt-1">Mostra tu calidad con 3-4 fotos de ejemplo</p>
                </div>
              )}
            </div>
          )}

          {/* License Tab */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Estado de Matricula</h3>
                <div className="flex items-center gap-2 mt-2">
                  {p?.verification?.isVerified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                      <BadgeCheck size={14} /> Verificada
                    </span>
                  ) : p?.verification?.verificationStatus === 'pending' ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium flex items-center gap-1">
                      <Clock size={14} /> Pendiente de verificacion
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">No subida</span>
                  )}
                </div>
              </div>
              {!p?.verification?.isVerified && (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-primary-400 transition-all">
                  <Upload size={28} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">{uploadingLicense ? 'Subiendo...' : 'Subir foto de matricula'}</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG o PDF max 10MB</p>
                  <input type="file" accept="image/*,.pdf" onChange={handleUploadLicense} className="hidden" disabled={uploadingLicense} />
                </label>
              )}
              {p?.verification?.documents?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Documentos subidos:</h4>
                  <div className="space-y-1.5">
                    {p.verification.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                        <FileText size={14} className="text-primary-500" />
                        <span>{doc.name || `Documento ${idx + 1}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              {subscription ? (
                <>
                  {subscription.status === 'active' && (
                    <div className="p-5 rounded-xl border bg-green-50 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Sparkles size={20} className="text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Suscripcion Activa</h4>
                            <p className="text-xs text-gray-500">
                              Plan Mensual Recurrente - Renovacion automatica mensual
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600 font-medium">{subscription.daysRemaining} dias restantes</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${Math.min(100, (subscription.daysRemaining / 30) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {(subscription.status === 'trial' && subscription.daysRemaining > 0) && (
                    <>
                      <div className="p-5 rounded-xl border bg-primary-50 border-primary-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                              <Gift size={20} className="text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">30 días gratis</h4>
                              <p className="text-xs text-gray-500">
                                Disfrutá tu mes gratuito sin cargo. Tu perfil esta visible para clientes.
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-primary-600 font-medium">{subscription.daysRemaining} dias restantes</p>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500 transition-all"
                            style={{ width: `${Math.min(100, (subscription.daysRemaining / 30) * 100)}%` }} />
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-start gap-3">
                          <RefreshCw size={18} className="text-primary-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Luego $5.000/mes</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Al finalizar los 30 días gratis, se activara automaticamente tu suscripcion recurrente de <strong>$5.000 ARS/mes</strong>.
                              Sin cargos anticipados. Podes cancelar cuando quieras.
                            </p>
                            <button onClick={handleCreatePayment}
                              disabled={creatingPayment}
                              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50"
                            >
                              {creatingPayment ? 'Procesando...' : <>Activar suscripcion ahora <ArrowRight size={14} /></>}
                            </button>
                            <p className="text-[10px] text-gray-400 mt-1.5">Al activar ahora, el cobro comenzara al finalizar los 30 días gratis.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {(subscription.status === 'suspended') && (
                    <>
                      <div className="p-5 rounded-xl border bg-red-50 border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle size={18} className="text-red-500" />
                          <h4 className="font-bold text-gray-900 text-sm">Periodo Gratuito Finalizado</h4>
                        </div>
                        <p className="text-xs text-red-700 mb-4">Tu perfil ya no es visible. Activa tu suscripcion de $5.000/mes para seguir apareciendo en el marketplace.</p>
                      </div>
                      <button onClick={handleCreatePayment}
                        disabled={creatingPayment}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                      >
                        {creatingPayment ? 'Generando pago...' : <>Activar suscripcion $5.000/mes <ArrowRight size={16} /></>}
                      </button>
                    </>
                  )}

                  {(subscription.status === 'inactive' || subscription.status === 'pending_payment') && (
                    <>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Suscripcion requerida</p>
                          <p className="text-xs text-amber-600">Activa tu suscripcion para aparecer en los resultados de busqueda del marketplace.</p>
                        </div>
                      </div>
                      <button onClick={handleCreatePayment}
                        disabled={creatingPayment}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
                      >
                        {creatingPayment ? 'Generando pago...' : <>Activar suscripcion $5.000/mes <ArrowRight size={16} /></>}
                      </button>
                    </>
                  )}

                  {subscription.status === 'expired' && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-red-500" />
                        <h4 className="font-bold text-gray-900 text-sm">Suscripcion Vencida</h4>
                      </div>
                      <p className="text-xs text-red-700 mb-4">Tu suscripcion ha expirado. Reactivala para seguir visible en el marketplace.</p>
                      <button onClick={handleCreatePayment}
                        disabled={creatingPayment}
                        className="w-full px-4 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 text-sm disabled:opacity-50"
                      >Renovar $5.000 ARS / mes</button>
                    </div>
                  )}

                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-900 text-sm mb-2">Que incluye tu suscripcion</h4>
                    <p className="text-xs text-gray-500">30 días gratis, luego $5.000/mes. Acceso completo a la plataforma: tu perfil aparece en los resultados de busqueda del marketplace y los clientes pueden contactarte directamente. Cancelas cuando quieras.</p>
                  </div>

                  {subscription.isVisible === false && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Tu perfil no es visible</p>
                        <p className="text-xs text-amber-600">Necesitas una suscripcion activa para aparecer en los resultados de busqueda del marketplace.</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <CreditCard size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium text-sm">Cargando informacion de suscripcion...</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Completadas', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Canceladas', value: stats.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
                  { label: 'Tasa respuesta', value: stats.responseRate ? `${stats.responseRate}%` : '-', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Tiempo resp.', value: stats.responseTime ? `${stats.responseTime}h` : '-', color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-lg font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Rating general</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-gray-900 text-sm">{stats.rating.toFixed(1)}</span>
                    <span className="text-gray-400 text-[10px]">/ 5.0</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${(stats.rating / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-green-50 rounded-xl p-5 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Ingresos totales</p>
                <p className="text-3xl font-black text-gray-900">${(stats.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-1">Historial de ingresos por servicios prestados</p>
              </div>
              <DashboardStats />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDashboard;
