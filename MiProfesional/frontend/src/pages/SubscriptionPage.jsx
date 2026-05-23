import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Gift, ArrowRight, Sparkles } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/subscription/plans'),
      api.get('/subscription/status'),
    ])
      .then(([plansRes, subRes]) => {
        setPlan(Array.isArray(plansRes.data?.data) ? plansRes.data.data[0] : null);
        setSubscription(subRes.data?.data ?? subRes.data ?? null);
      })
      .catch(() => setMessage({ type: 'error', text: 'Error al cargar los datos.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/subscription/create-preapproval', { plan: 'monthly' });
      const initPoint = res.data?.data?.initPoint || res.data?.initPoint;
      if (initPoint) {
        window.location.href = initPoint;
      } else {
        setMessage({ type: 'error', text: 'Error al redirigir a la autorizacion.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al procesar la solicitud.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.post('/subscription/cancel');
      setSubscription((prev) => ({ ...prev, status: 'inactive' }));
      setMessage({ type: 'success', text: 'Suscripción cancelada.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al cancelar la suscripción.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = subscription?.status ?? 'inactive';
  const isActive = currentStatus === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 shadow-xl shadow-primary-500/25 mb-8 p-6 sm:p-8 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              30 días gratis
            </h2>
            <p className="text-primary-100 text-base sm:text-lg font-semibold">
              Luego $5.000/mes
            </p>
            <p className="text-primary-100/80 text-sm mt-2 max-w-sm mx-auto">
              Publica tu perfil, recibí consultas de clientes. Cancelas cuando quieras.
            </p>
          </div>
        </div>

        {/* STATUS ALERTS */}
        {currentStatus === 'trial' && subscription?.daysRemaining > 0 && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-lg bg-primary-50 border border-primary-200">
            <Gift size={20} className="text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-primary-800">30 días gratis en curso</p>
              <p className="text-xs text-primary-700 mt-1">
                Te quedan <strong>{subscription.daysRemaining} dias</strong> gratuitos. Sin cargos ni compromiso.
                Al finalizar, se activara automaticamente tu suscripcion de <strong>$5.000/mes</strong>.
              </p>
            </div>
          </div>
        )}
        {currentStatus === 'suspended' && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-lg bg-red-50 border border-red-200">
            <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Periodo gratuito finalizado</p>
              <p className="text-xs text-red-700 mt-1">
                Tu perfil ya no es visible. Activa tu suscripcion de $5.000/mes para volver a aparecer en el marketplace.
              </p>
            </div>
          </div>
        )}
        {currentStatus === 'pending_payment' && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
            <XCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Suscripcion pendiente</p>
              <p className="text-xs text-amber-700 mt-1">
                Completa la activacion para que tu perfil sea visible en el marketplace.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* SINGLE PLAN CARD */}
        {plan && (
          <div className={`relative bg-white rounded-2xl shadow-sm border-2 ${
            isActive ? 'border-primary-500 shadow-lg shadow-primary-500/10' : 'border-gray-200 shadow-sm'
          }`}>
            {isActive && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                Plan Activo
              </span>
            )}

            <div className="p-6 sm:p-8 text-center">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-4">
                <Sparkles size={12} /> Suscripcion Mensual
              </span>

              <div className="mb-2">
                <p className="text-sm text-gray-400 mb-1 line-through">$5.000</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-gray-900">$0</span>
                  <span className="text-gray-500 text-sm">ARS</span>
                </div>
                <p className="text-sm font-semibold text-primary-600 mt-0.5">30 días gratis</p>
                <p className="text-xs text-gray-400 mt-1">Luego $5.000/mes · Recurrencia automatica</p>
              </div>

              <ul className="text-xs text-left text-gray-600 space-y-2 my-6 bg-gray-50 rounded-xl p-4">
                {['Primer mes completamente gratis, sin cargos', 'Suscripcion recurrente automatica', 'Cancelacion sin cargo en cualquier momento', 'Perfil visible en el marketplace', 'Sin compromiso mensual'].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={isActive ? handleCancel : handleUpgrade}
                disabled={actionLoading}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Procesando...
                  </span>
                ) : isActive ? (
                  'Cancelar Suscripcion'
                ) : (
                  <>Activar suscripcion <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
