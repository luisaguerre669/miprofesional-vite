import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Phone, MessageCircle, Clock, Sparkles, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const PLACEHOLDER_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iI2UyZThmMCIvPjxwYXRoIGQ9Ik0zMiAyMkwyMiAzMmg0djEwaDZ2LTVoNHY1aDZWMzJsLTEwLTEweiIgZmlsbD0iIzk0YTNiOCIvPjwvc3ZnPg==';

const FEATURED_BUSINESSES = [
  {
    id: 1,
    name: 'Constructora del Plata',
    logo: PLACEHOLDER_LOGO,
    address: 'Av. Corrientes 1234, CABA',
    phone: '011-4567-8901',
    whatsapp: '541145678901',
    rating: 4.8,
    hours: 'Lun a Vie 08:00-18:00 · Sab 09:00-13:00',
    promotion: 'Presupuesto sin cargo · 15% de descuento en tu primer proyecto',
    slug: 'constructora-del-plata',
  },
  {
    id: 2,
    name: 'Grupo Eléctrico Sur',
    logo: PLACEHOLDER_LOGO,
    address: 'Av. Rivadavia 5678, CABA',
    phone: '011-4987-6543',
    whatsapp: '541149876543',
    rating: 4.9,
    hours: 'Lun a Vie 09:00-19:00 · Urgencias 24h',
    promotion: 'Servicio de urgencia sin recargo · 10% de descuento para empresas',
    slug: 'grupo-electrico-sur',
  },
  {
    id: 3,
    name: 'Tech Solutions SA',
    logo: PLACEHOLDER_LOGO,
    address: 'Av. Cabildo 2345, CABA',
    phone: '011-4789-0123',
    whatsapp: '541147890123',
    rating: 4.7,
    hours: 'Lun a Vie 09:00-20:00 · Sab 10:00-14:00',
    promotion: 'Diagnóstico gratis · Instalación sin costo adicional',
    slug: 'tech-solutions',
  },
  {
    id: 4,
    name: 'Servicios Generales MG',
    logo: PLACEHOLDER_LOGO,
    address: 'Av. Santa Fe 3456, CABA',
    phone: '011-4567-8902',
    whatsapp: '541145678902',
    rating: 4.6,
    hours: 'Lun a Sab 08:00-20:00',
    promotion: 'Primera visita sin cargo · Mantenimiento preventivo incluido',
    slug: 'servicios-generales-mg',
  },
];

const NegociosDestacados = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2;
  const totalPages = Math.ceil(FEATURED_BUSINESSES.length / itemsPerPage);

  const nextPage = () => setCurrentPage(p => (p + 1) % totalPages);
  const prevPage = () => setCurrentPage(p => (p - 1 + totalPages) % totalPages);

  useEffect(() => {
    const timer = setInterval(() => nextPage(), 6000);
    return () => clearInterval(timer);
  }, []);

  const visible = FEATURED_BUSINESSES.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-20">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-xl border border-gray-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(251,191,36,0.05),transparent_50%)]" />
        <div className="relative p-5 md:p-8">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg md:text-xl">Negocios Destacados</h2>
                <p className="text-gray-400 text-xs md:text-sm">Profesionales verificados con la mejor reputación</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevPage} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextPage} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {visible.map(biz => (
              <Link key={biz.id} to={`/profile/${biz.slug}`}
                className="group block relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 bg-white/10 ring-1 ring-white/10">
                    <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-bold text-sm md:text-base truncate group-hover:text-amber-400 transition-colors">{biz.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 text-xs font-bold">{biz.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{biz.address}</span>
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                      <Clock size={10} className="shrink-0" />
                      {biz.hours}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <a href={`tel:${biz.phone}`} onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg transition-all"
                      >
                        <Phone size={11} /> Llamar
                      </a>
                      <a href={`https://wa.me/${biz.whatsapp}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-semibold rounded-lg transition-all"
                      >
                        <MessageCircle size={11} /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
                {biz.promotion && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded">OFERTA</span>
                      <p className="text-amber-300/80 text-[11px] font-medium truncate">{biz.promotion}</p>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPage ? 'bg-amber-400 w-4' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/search?featured=true"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-amber-400 text-xs font-medium transition-colors"
            >
              Ver todos los negocios destacados <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NegociosDestacados;
