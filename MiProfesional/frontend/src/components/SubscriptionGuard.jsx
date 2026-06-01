import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldOff, Crown, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function SubscriptionGuard({ children, requiredPlan = 'company' }) {
  const { user } = useAuth();

  const isCompany = user?.role === 'company';
  const subscription = user?.subscription || {};
  const subStatus = subscription.status || 'inactive';
  const subPlan = subscription.plan || 'free';
  const subEndDate = subscription.endDate;

  const daysRemaining = subEndDate
    ? Math.ceil((new Date(subEndDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const hasCompanyPlan = subStatus === 'active' && subPlan === 'company';
  const hasAnyPlan = subStatus === 'active';
  const isExpired = subStatus === 'suspended' || (subEndDate && new Date(subEndDate) < new Date());
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return <>{children}</>;
  }

  if (!isCompany) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <ShieldOff size={40} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso exclusivo para empresas</h1>
          <p className="text-gray-500 leading-relaxed">
            Esta sección está disponible solo para cuentas empresa con suscripción activa al Plan Empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/empresas"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
            >
              <Crown size={18} />
              Ver planes empresa
            </Link>
            <Link to="/register?role=company"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all"
            >
              <CreditCard size={18} />
              Crear cuenta empresa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired || !hasCompanyPlan) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Suscripción requerida</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                {isExpired
                  ? 'Tu suscripción al Plan Empresa ha vencido. Activála nuevamente para acceder a la búsqueda de candidatos.'
                  : 'Necesitás el Plan Empresa para acceder a esta funcionalidad.'}
              </p>
            </div>

            {subStatus === 'active' && subPlan !== 'company' && (
              <div className="bg-white rounded-xl p-4 text-left border border-amber-100">
                <p className="text-xs text-gray-500 mb-2">Tu plan actual:</p>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium text-gray-900 capitalize">{subPlan}</span>
                  <span className="text-xs text-gray-400">— Activo</span>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="bg-white/60 rounded-xl p-4 text-left border border-amber-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Vencido el</span>
                  <span className="font-medium text-gray-900">
                    {subEndDate ? new Date(subEndDate).toLocaleDateString('es-AR') : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Días sin acceso</span>
                  <span className="font-medium text-red-600">{Math.abs(daysRemaining)} días</span>
                </div>
              </div>
            )}

            <Link to="/subscriptions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-lg"
            >
              <CreditCard size={18} />
              {isExpired ? 'Renovar Plan Empresa' : 'Adquirir Plan Empresa'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
