import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Sparkles, Zap, Gift, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/subscription/plans'),
      api.get('/subscription/status'),
    ])
      .then(([plansRes, subRes]) => {
        setPlans(plansRes.data?.data ?? plansRes.data ?? []);
        setCurrentPlan(subRes.data?.data ?? subRes.data ?? null);
      })
      .catch(() => setMessage({ type: 'error', text: 'Error al cargar los planes.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planId) => {
    setActionLoading(planId);
    setMessage(null);
    try {
      const res = await api.post('/subscription/create-preference', { plan: planId });
      const initPoint = res.data?.data?.initPoint || res.data?.initPoint;
      if (initPoint) {
        window.location.href = initPoint;
      } else {
        setMessage({ type: 'error', text: 'Error al redirigir al pago.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al crear la preferencia de pago.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    setMessage(null);
    try {
      await api.post('/subscription/cancel');
      setCurrentPlan((prev) => ({ ...prev, status: 'inactive', plan: 'free' }));
      setMessage({ type: 'success', text: 'Suscripción cancelada.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al cancelar la suscripción.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = currentPlan?.status ?? 'inactive';
  const currentPlanId = currentPlan?.plan?.toLowerCase() ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* FREE MONTH BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 shadow-xl shadow-primary-500/25 mb-10 p-6 sm:p-8 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-xs font-semibold mb-3">
              <Gift size={14} /> Oferta por tiempo limitado
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Primer mes GRATIS para nuevos profesionales
            </h2>
            <p className="text-primary-100 text-sm sm:text-base max-w-lg mx-auto">
              Publica tu perfil, recibí consultas de clientes y hace crecer tu servicio sin riesgo.
            </p>
          </div>
        </div>

        {currentStatus === 'pending_payment' && (
          <div className="max-w-xl mx-auto mb-6 flex items-start gap-3 px-4 py-4 rounded-lg bg-amber-50 border border-amber-200">
            <Zap size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Suscripcion pendiente</p>
              <p className="text-xs text-amber-700 mt-1">
                Elegi un plan y completa el pago para activar tu perfil profesional en el marketplace.
                Sin una suscripcion activa no apareceras en los resultados de busqueda.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`max-w-xl mx-auto mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* PLANS GRID */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id && currentStatus === 'active';
            const isLoading = actionLoading === plan.id;
            const isSemester = plan.id === 'semester';

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-sm border-2 flex flex-col transition-all ${
                  isCurrent
                    ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                    : isSemester
                      ? 'border-emerald-200 hover:border-emerald-300 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 right-4 z-10">
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      <Sparkles size={12} /> {plan.badge}
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                    Plan Actual
                  </span>
                )}

                <div className="p-6 sm:p-8 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    {isSemester && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Mejor valor
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    {plan.originalPrice && (
                      <p className="text-sm text-gray-400 line-through mb-0.5">
                        ${plan.originalPrice.toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm">ARS</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {plan.id === 'monthly' ? '/ mes' : '/ 6 meses'}
                    </p>
                  </div>

                  {plan.originalPrice && (
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Ahorro del {plan.discount}% — ${(plan.originalPrice - plan.price).toLocaleString()} ARS de descuento
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-4 mb-6 flex-1">
                    {plan.description}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isSemester
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25'
                          : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Procesando...
                      </span>
                    ) : isCurrent ? (
                      'Plan Actual'
                    ) : (
                      <>
                        {plan.cta || 'Suscribirme'} <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {currentStatus === 'active' && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'cancel' ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Cancelando...
                </span>
              ) : (
                'Cancelar Suscripción'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
