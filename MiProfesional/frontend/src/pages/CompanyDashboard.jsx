import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import {
  Search, Users, FileText, Eye, MessageSquare,
  Building2, CreditCard, ArrowRight, Crown, Clock,
  TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle,
  BarChart3, ChevronRight, Calendar, Zap, Activity
} from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ cvViews: 0, contactsMade: 0, searches: 0, totalCandidates: 0 });
  const [recentCvs, setRecentCvs] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  const sub = user?.subscription || {};
  const subStatus = sub.status || 'inactive';
  const subPlan = sub.plan || 'free';
  const isActive = subStatus === 'active';
  const isExpired = subStatus === 'suspended' || (sub.endDate && new Date(sub.endDate) < new Date());
  const isTrial = subStatus === 'trial';
  const canSearch = isActive || user?.role === 'admin';

  const planLabel = subPlan === 'company' ? 'Plan Empresa' : subPlan === 'professional' ? 'Plan Profesional' : 'Plan gratuito';

  useEffect(() => {
    Promise.all([
      api.get('/subscription/status').catch(() => ({ data: { data: null } })),
      api.get('/cv/search', { params: { limit: 5 } }).catch(() => ({ data: { data: [] } }))
    ]).then(([subRes, cvRes]) => {
      setSubscription(subRes.data?.data || null);
      const cvs = cvRes.data?.data || [];
      setRecentCvs(cvs);
      setStats(prev => ({ ...prev, totalCandidates: cvs.length }));

      const storedStats = localStorage.getItem('company_dashboard_stats');
      if (storedStats) {
        try { setStats(prev => ({ ...prev, ...JSON.parse(storedStats) })); } catch {}
      }
    }).catch(err => {
      setError('Error al cargar datos del dashboard');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription?.endDate
    ? Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-primary-600" size={26} />
              Dashboard Empresa
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido, {user?.name || 'Empresa'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
                <CheckCircle size={14} />
                {planLabel} · Activo
              </span>
            ) : isTrial ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                <Clock size={14} />
                Período de prueba
              </span>
            ) : (
              <Link to="/subscriptions"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-all"
              >
                <AlertTriangle size={14} />
                Sin suscripción activa
              </Link>
            )}
          </div>
        </div>

        {/* Subscription blocked banner */}
        {!canSearch && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Crown size={24} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">Activá tu suscripción para acceder a todas las funciones</h3>
                <p className="text-sm text-amber-700 mb-3">Sin una suscripción activa al Plan Empresa no podés buscar candidatos ni ver CVs completos.</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/subscriptions"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all"
                  >
                    <CreditCard size={16} />
                    Ver planes
                  </Link>
                </div>
              </div>
            </div>
            {isExpired && subscription?.endDate && (
              <div className="mt-3 pt-3 border-t border-amber-200/50 text-xs text-amber-700">
                Tu suscripción venció el {new Date(subscription.endDate).toLocaleDateString('es-AR')}.
                {daysRemaining < 0 && ` Hace ${Math.abs(daysRemaining)} días sin acceso.`}
              </div>
            )}
          </div>
        )}

        {/* Subscription active banner */}
        {isActive && subscription && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">
                  {planLabel} activo
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {daysRemaining > 0
                    ? `Vence el ${new Date(subscription.endDate).toLocaleDateString('es-AR')} (${daysRemaining} días restantes)`
                    : 'Sin fecha de vencimiento'}
                </p>
              </div>
              <Link to="/subscriptions"
                className="shrink-0 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all"
              >
                Administrar
              </Link>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Candidatos encontrados', value: stats.totalCandidates, icon: Users, color: 'bg-blue-50 text-blue-600' },
            { label: 'Búsquedas realizadas', value: stats.searches, icon: Search, color: 'bg-purple-50 text-purple-600' },
            { label: 'CVs vistos', value: stats.cvViews, icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Contactos realizados', value: stats.contactsMade, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions + Recent CVs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap size={16} className="text-gray-400" />
              Acciones rápidas
            </h2>
            <div className="space-y-3">
              <Link to="/cv-search"
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${canSearch ? 'bg-white border-gray-100 hover:border-primary-200 hover:shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed pointer-events-none'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Search size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Buscar candidatos</p>
                  <p className="text-xs text-gray-500">Filtrá por profesión, ubicación y más</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link to="/cv"
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText size={20} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Mi CV empresarial</p>
                  <p className="text-xs text-gray-500">Creá o editá el CV de tu empresa</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link to="/subscriptions"
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <CreditCard size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Suscripción y facturación</p>
                  <p className="text-xs text-gray-500">Administrá tu plan y pagos</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
              <Link to="/profile"
                className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Building2 size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Perfil de empresa</p>
                  <p className="text-xs text-gray-500">Completá los datos de tu empresa</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </Link>
            </div>
          </div>

          {/* Recent CVs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                Últimos candidatos
              </h2>
              {canSearch && (
                <Link to="/cv-search" className="text-xs text-primary-600 hover:underline font-medium">
                  Ver todos <ArrowRight size={12} className="inline" />
                </Link>
              )}
            </div>
            {recentCvs.length > 0 ? (
              <div className="space-y-3">
                {recentCvs.map(cv => (
                  <div key={cv._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
                        {cv.photo ? (
                          <img src={cv.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} className="text-primary-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {cv.personalData?.fullName || 'Candidato'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {cv.personalData?.headline || cv.jobTitles?.[0] || 'Sin título'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-gray-400">
                          {cv.location?.city || ''}{cv.location?.city && cv.location?.state ? ', ' : ''}{cv.location?.state || ''}
                        </span>
                        <Link to={`/cv/${cv._id}`}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-all"
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                    {cv.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cv.skills.slice(0, 4).map(s => (
                          <span key={s.name} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{s.name}</span>
                        ))}
                        {cv.skills.length > 4 && (
                          <span className="text-[10px] text-gray-400">+{cv.skills.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <Users size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {canSearch
                    ? 'Buscá candidatos para ver resultados aquí'
                    : 'Activá tu suscripción para comenzar a buscar'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription detail */}
        {subscription && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              Detalle de suscripción
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Plan</span>
                <p className="font-semibold text-gray-900 capitalize">{subscription.plan === 'company' ? 'Empresa' : subscription.plan === 'professional' ? 'Profesional' : subscription.plan || 'Sin plan'}</p>
              </div>
              <div>
                <span className="text-gray-500">Estado</span>
                <p className={`font-semibold capitalize ${subscription.status === 'active' ? 'text-emerald-600' : subscription.status === 'expired' || subscription.status === 'suspended' ? 'text-red-600' : 'text-gray-900'}`}>
                  {subscription.status === 'active' ? 'Activo' : subscription.status === 'expired' ? 'Vencido' : subscription.status === 'suspended' ? 'Suspendido' : subscription.status || 'Inactivo'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Vencimiento</span>
                <p className="font-semibold text-gray-900">
                  {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('es-AR') : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Días restantes</span>
                <p className={`font-semibold ${daysRemaining > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {daysRemaining > 0 ? daysRemaining : 'Vencido'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
