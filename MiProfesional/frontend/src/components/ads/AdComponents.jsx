import { Link } from 'react-router-dom';
import { X, Megaphone, Star } from 'lucide-react';

export const AdTopBanner = ({ visible, onDismiss }) => {
  if (!visible) return null;
  return (
    <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl overflow-hidden">
      <button onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-10"
      ><X size={14} /></button>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Megaphone size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Publicita en MiProfesional</p>
          <p className="text-primary-200 text-xs">Llega a miles de clientes potenciales</p>
        </div>
        <Link to="/register?role=professional"
          className="shrink-0 px-3 py-1.5 bg-white text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-50 transition-all"
        >Saber mas</Link>
      </div>
    </div>
  );
};

export const AdCard = () => (
  <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-4 text-center">
    <div className="w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center mx-auto mb-2">
      <Megaphone size={16} className="text-amber-600" />
    </div>
    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Publicidad</p>
    <p className="text-sm text-amber-900 font-medium mt-0.5">Promociona tu servicio</p>
    <p className="text-xs text-amber-600 mt-0.5">Llega a profesionales y clientes en tu zona</p>
    <Link to="/register?role=professional"
      className="mt-2 inline-flex px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-all"
    >Publicitar</Link>
  </div>
);

export const AdPremiumSlot = () => (
  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-5 text-center">
    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mx-auto mb-3">
      <Star size={20} className="text-white" />
    </div>
    <p className="text-sm font-bold text-purple-900">Slot Premium</p>
    <p className="text-xs text-purple-700 mt-1 max-w-[180px] mx-auto">Destaca tu negocio en esta posicion privilegiada</p>
    <Link to="/register?role=professional"
      className="mt-3 inline-flex px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-all"
    >Reservar espacio</Link>
  </div>
);
