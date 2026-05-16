import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
  Search, Star, MapPin, ChevronRight, ArrowRight, BadgeCheck
} from 'lucide-react';

const iconMap = {
  Building2, Wrench, Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase, AlertTriangle,
};

const clusterConfig = {
  construccion: {
    title: 'Construccion',
    color: 'from-amber-700 to-amber-900',
    badge: null,
  },
  'servicios-generales': {
    title: 'Servicios Generales',
    color: 'from-primary-700 to-primary-900',
    badge: null,
  },
  emergencias: {
    title: 'Emergencias 24/7',
    color: 'from-red-700 to-red-900',
    badge: '24/7',
  },
  empresas: {
    title: 'Empresas y Equipos',
    color: 'from-blue-700 to-blue-900',
    badge: null,
  },
  tecnologia: {
    title: 'Tecnologia',
    color: 'from-purple-700 to-purple-900',
    badge: null,
  },
  automotor: {
    title: 'Automotor',
    color: 'from-cyan-700 to-cyan-900',
    badge: null,
  },
  hogar: {
    title: 'Hogar y Confort',
    color: 'from-amber-600 to-amber-800',
    badge: null,
  },
  mascotas: {
    title: 'Mascotas',
    color: 'from-cyan-700 to-cyan-900',
    badge: null,
  },
  belleza: {
    title: 'Belleza y Cuidado',
    color: 'from-pink-700 to-pink-900',
    badge: null,
  },
  gastronomia: {
    title: 'Gastronomia',
    color: 'from-red-700 to-red-900',
    badge: null,
  },
  transporte: {
    title: 'Transporte y Turismo',
    color: 'from-blue-700 to-blue-900',
    badge: null,
  },
  cerrajeria: {
    title: 'Cerrajeria',
    color: 'from-lime-700 to-lime-900',
    badge: null,
  },
};

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      api.get(`/categories/slug/${slug}`).then(r => r.data.data).catch(() => null),
      api.get('/professionals/search', { params: { q: slug, limit: 12 } }).then(r => r.data.data || []).catch(() => []),
    ]).then(([cat, pros]) => {
      setCategory(cat);
      setProfessionals(pros);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="skeleton h-64 rounded-3xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!category) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-gray-900">Categoría no encontrada</h2>
      <Link to="/" className="text-primary-600 mt-2 inline-block">Volver al inicio</Link>
    </div>
  );

  const config = clusterConfig[category.slug];
  const getIcon = (name) => {
    const Icon = iconMap[name] || Briefcase;
    return <Icon size={22} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
      <Helmet>
        <title>{category.title} — Profesionales en MiProfesional</title>
        <meta name="description" content={category.description?.slice(0, 160)} />
        <link rel="canonical" href={`https://miprofesional.com/categoria/${category.slug}`} />
      </Helmet>

      {/* Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden min-h-[280px] flex items-center">
        <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
        <div className="relative z-10 p-8 md:p-12 max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white border border-white/10">
              {getIcon(category.icon)}
            </div>
            <div>
              <span className="text-white/50 text-xs uppercase tracking-wider">Categoría</span>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-black text-white">{category.title}</h1>
                {config?.badge && (
                  <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-md">{config.badge}</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-white/60 text-base mb-6">{category.description}</p>
          <Link to={`/search?category=${category._id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all"
          >
            Buscar en {category.title} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Subcategorías */}
      {category.subcategories?.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subcategorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {category.subcategories.map((sub, idx) => (
              <Link key={sub._id || idx} to={`/search?subcategory=${sub._id}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] border border-gray-200 hover-lift"
              >
                <img src={sub.image} alt={sub.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-sm">{sub.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Profesionales */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profesionales</h2>
          <Link to={`/search?category=${category._id}`}
            className="hidden sm:flex items-center gap-1 text-primary-600 font-medium text-sm"
          >
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>
        {professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {professionals.slice(0, 6).map((pro, idx) => (
              <Link key={pro._id} to={`/service/${pro._id}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover-lift overflow-hidden"
              >
                <div className="relative h-36 bg-gray-900 overflow-hidden">
                  <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=166534&color=fff&size=200`}
                    alt="" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <div className="flex items-center gap-3">
                      <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=166534&color=fff`}
                        alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30"
                      />
                      <div>
                        <h3 className="font-bold text-white text-sm">{pro.businessName || pro.profession}</h3>
                        <p className="text-xs text-white/70">{pro.profession}</p>
                      </div>
                    </div>
                  </div>
                  {pro.verification?.isVerified && (
                    <BadgeCheck size={18} className="absolute top-3 right-3 text-primary-400 bg-white/90 rounded-full" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={pro.stats?.rating || 0} size={13} />
                    <span className="text-sm font-semibold text-gray-800">{(pro.stats?.rating || 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({pro.stats?.reviewCount || 0})</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{pro.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {pro.location?.city || 'CABA'}
                    </span>
                    {pro.pricing?.hourlyRate > 0 && (
                      <span className="font-bold text-primary-600 text-sm">${pro.pricing.hourlyRate.toLocaleString()}/h</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Search size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay profesionales en esta categoría aún</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
