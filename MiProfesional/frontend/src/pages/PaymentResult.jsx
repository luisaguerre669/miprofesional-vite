import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const STATUS_CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', iconColor: 'text-green-500', title: 'Pago Exitoso', msg: 'Tu suscripcion ha sido activada. Ya formas parte del marketplace.' },
  failure: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-500', title: 'Pago Rechazado', msg: 'El pago no pudo completarse. Intenta nuevamente.' },
  pending: { icon: Clock, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', iconColor: 'text-yellow-500', title: 'Pago Pendiente', msg: 'El pago esta siendo procesado. Te notificaremos cuando se confirme.' },
};

export default function PaymentResult({ status }) {
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.failure;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className={`max-w-md w-full rounded-2xl shadow-lg border ${config.bg} ${config.border} p-8 text-center`}>
        <div className={`w-16 h-16 ${config.iconColor} mx-auto mb-4`}>
          <Icon size={64} />
        </div>
        <h1 className={`text-2xl font-bold mb-2 ${config.text}`}>{config.title}</h1>
        <p className="text-gray-600 mb-6">{config.msg}</p>
        <div className="flex flex-col gap-3">
          <Link to="/dashboard/professional" className="w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition">
            Ir a mi panel
          </Link>
          <Link to="/" className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}