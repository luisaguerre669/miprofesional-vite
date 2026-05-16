import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, Star, DollarSign, MapPin, Search,
  MessageSquare, User, ChevronRight, ArrowRight, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Briefcase
} from 'lucide-react';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ totalBookings: 0, completed: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, analyticsRes, favRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/analytics/dashboard'),
        api.get('/professionals/favorites').catch(() => ({ data: { data: [] } }))
      ]);
      setBookings(bookingsRes.data.data || []);
      setStats(prev => ({ ...prev, ...(analyticsRes.data.data || {}) }));
      setFavorites(favRes.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      setBookings(bookings.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch {
      alert('Error al cancelar reserva');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );

  const statusColor = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-brand-emerald/10 text-brand-emerald',
      cancelled: 'bg-red-100 text-red-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Panel de Cliente</h1>
          <p className="text-gray-500">Bienvenido de vuelta, {user?.name || 'Usuario'}</p>
        </div>
        <Link to="/search"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-600/20"
        >
          <Search size={16} /> Buscar Profesionales
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Reservas Totales', value: stats.totalBookings, icon: Calendar, color: 'from-primary-500 to-primary-600', bg: 'bg-primary-50' },
          { label: 'Completadas', value: stats.completed, icon: CheckCircle, color: 'from-brand-emerald to-emerald-600', bg: 'bg-brand-emerald/5' },
          { label: 'Total Gastado', value: `$${(stats.totalSpent || 0).toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', isCurrency: true },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{s.label}</span>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={18} className={s.color.split(' ')[1].replace('to-', 'text-') || 'text-primary-600'} />
                </div>
              </div>
              <p className={`text-2xl font-black text-gray-900 ${s.isCurrency ? '' : ''}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6">
          <div className="flex gap-6 -mb-px overflow-x-auto scrollbar-hide">
            {[
              { id: 'bookings', label: 'Mis Reservas', icon: Calendar },
              { id: 'favorites', label: 'Favoritos', icon: Star },
              { id: 'activity', label: 'Actividad', icon: TrendingUp },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                        {booking.professionalId?.businessName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{booking.serviceName}</p>
                        <p className="text-sm text-gray-500">{booking.professionalId?.businessName || 'Profesional'}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {booking.time}</span>
                          {booking.price > 0 && <span className="font-medium text-primary-600">${booking.price.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColor(booking.status)}`}>
                        {booking.status === 'in_progress' ? 'En curso' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      {booking.status === 'pending' && (
                        <button onClick={() => cancelBooking(booking._id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Cancelar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No tienes reservas aún</p>
                <Link to="/search" className="text-primary-600 text-sm font-medium mt-2 inline-flex items-center gap-1">
                  Buscar profesionales <ArrowRight size={14} />
                </Link>
              </div>
            )
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {favorites.map((pro) => (
                  <Link key={pro._id} to={`/service/${pro._id}`}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=4f46e5&color=fff`}
                      alt="" className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{pro.businessName || pro.profession}</p>
                      <p className="text-sm text-gray-500">{pro.profession}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{(pro.stats?.rating || 0).toFixed(1)}</span>
                        <span>·</span>
                        <span>{pro.location?.city || 'CABA'}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No tienes favoritos aún</p>
                <Link to="/search" className="text-primary-600 text-sm font-medium mt-2 inline-flex items-center gap-1">
                  Explorar profesionales <ArrowRight size={14} />
                </Link>
              </div>
            )
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Tu actividad aparecerá aquí</p>
              <p className="text-gray-400 text-sm mt-1">Reservas, mensajes y más</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;