import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Zap, Crown, Sparkles } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const PLAN_ICONS = { free: Sparkles, premium: Crown, pro: Zap };

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

  const handleUpgrade = async (planName) => {
    setActionLoading(planName);
    setMessage(null);
    try {
      const res = await api.post('/subscription/create-preference', { plan: planName });
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
      const res = await api.post('/subscription/cancel');
      setCurrentPlan(res.data?.plan ?? 'free');
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlanName = currentPlan?.plan?.toLowerCase() ?? currentPlan?.name?.toLowerCase() ?? currentPlan?.toLowerCase() ?? 'free';
  const currentStatus = currentPlan?.status ?? 'inactive';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Planes de Suscripción</h1>
        <p className="text-center text-gray-500 mb-8">Elige el plan que mejor se adapte a tus necesidades</p>

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

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const planKey = plan.name?.toLowerCase() ?? '';
            const isCurrent = currentPlanName === planKey;
            const Icon = PLAN_ICONS[planKey] ?? Sparkles;
            const isFree = planKey === 'free';
            const isLoading = actionLoading === planKey;

            return (
              <div
                key={planKey}
                className={`relative bg-white rounded-xl shadow-sm p-6 flex flex-col transition ${
                  isCurrent ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {(isCurrent || currentStatus === 'active') && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Plan Actual
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-6 h-6 ${isCurrent ? 'text-primary-600' : 'text-gray-400'}`} />
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">{plan.name}</h2>
                </div>

                <p className="text-3xl font-bold text-gray-900 mb-4">
                  {plan.price != null && plan.price > 0
                    ? `$${plan.price?.toLocaleString?.() ?? plan.price}/mes`
                    : 'Gratis'}
                </p>

                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.benefits ?? []).map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {!isFree && (
                  <button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Procesando...
                      </span>
                    ) : isCurrent ? (
                      'Plan Actual'
                    ) : (
                      'Actualizar'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {currentPlanName !== 'free' && (
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
