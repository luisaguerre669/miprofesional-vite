import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const AD_ASSETS = {
  top: {
    gradient: 'from-indigo-600 to-purple-700',
    icon: 'bg-white/10',
    title: 'Publicita en MiProfesional',
    desc: 'Llega a miles de clientes potenciales en tu zona',
    cta: 'Saber mas',
  },
  between: {
    gradient: 'from-amber-500 to-orange-600',
    icon: 'bg-white/10',
    title: 'Promociona tu servicio',
    desc: 'Profesionales destacados tienen 3x mas contactos',
    cta: 'Destacar perfil',
  },
  sidebar: {
    gradient: 'from-emerald-600 to-teal-700',
    icon: 'bg-white/10',
    title: 'Espacio Premium',
    desc: 'Posicion privilegiada para tu negocio',
    cta: 'Reservar',
  },
  mobile: {
    gradient: 'from-rose-600 to-pink-700',
    icon: 'bg-white/10',
    title: 'Oferta especial',
    desc: 'Publicidad con resultados garantizados',
    cta: 'Consultar',
  },
};

const AdBanner = ({ position = 'top', image, link, onDismiss }) => {
  const asset = AD_ASSETS[position] || AD_ASSETS.top;

  if (position === 'sidebar') {
    return (
      <div className={`relative bg-gradient-to-br ${asset.gradient} rounded-xl overflow-hidden`}>
        {onDismiss && (
          <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 z-10">
            <X size={14} />
          </button>
        )}
        <div className="p-5 text-center">
          <div className={`w-10 h-10 rounded-xl ${asset.icon} flex items-center justify-center mx-auto mb-3`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          </div>
          <p className="text-white font-bold text-sm">{asset.title}</p>
          <p className="text-white/70 text-xs mt-1 leading-relaxed">{asset.desc}</p>
          <Link to={link || '/register?role=professional'}
            className="mt-3 inline-flex px-4 py-2 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
          >{asset.cta}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-r ${asset.gradient} rounded-xl overflow-hidden shadow-md`}>
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 z-10">
          <X size={14} />
        </button>
      )}
      <div className="p-4 md:p-5 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${asset.icon} flex items-center justify-center shrink-0`}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm md:text-base">{asset.title}</p>
          <p className="text-white/70 text-xs md:text-sm mt-0.5">{asset.desc}</p>
        </div>
        <Link to={link || '/register?role=professional'}
          className="shrink-0 px-4 py-2 bg-white text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg whitespace-nowrap"
        >{asset.cta}</Link>
      </div>
    </div>
  );
};

export default AdBanner;
