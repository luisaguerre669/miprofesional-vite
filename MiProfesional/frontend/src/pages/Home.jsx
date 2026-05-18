import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/axios';
import {
  Search, ArrowRight, Star, MapPin, Building2, Wrench,
  Hammer, Zap, Droplets, Paintbrush, Lock, TreePine,
  SprayCan, Truck, Stethoscope, Users, Heart, Briefcase,
  AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon,
  UserPlus, Shield, LayoutGrid, Clock, X, Megaphone
} from 'lucide-react';

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#0f7a5a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const clusters = [
  {
    id: 'construccion', title: 'Construccion', slug: 'construccion',
    color: 'from-amber-700 to-amber-900', icon: Building2,
    description: 'Albaniles, plomeros, electricistas, gasistas, pintores',
    bg: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80',
    subcategories: [
      { name: 'Albanil', icon: Hammer, slug: 'albanil' },
      { name: 'Plomero', icon: Droplets, slug: 'plomero' },
      { name: 'Electricista', icon: Zap, slug: 'electricista' },
      { name: 'Gasista', icon: Zap, slug: 'gasista' },
      { name: 'Pintor', icon: Paintbrush, slug: 'pintor' },
      { name: 'Carpintero', icon: Hammer, slug: 'carpintero' },
      { name: 'Techista', icon: Building2, slug: 'techista' },
      { name: 'Herrero', icon: Hammer, slug: 'herrero' },
      { name: 'Pisos', icon: Wrench, slug: 'colocador-pisos' },
      { name: 'Yesero', icon: Wrench, slug: 'yesero' },
      { name: 'Aberturas', icon: Lock, slug: 'aberturas' },
    ],
  },
  {
    id: 'servicios', title: 'Servicios Generales', slug: 'servicios-generales',
    color: 'from-primary-700 to-primary-900', icon: Wrench,
    description: 'Limpieza, jardineria, mantenimiento, reparaciones, mudanzas',
    bg: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    subcategories: [
      { name: 'Limpieza Casa', icon: SprayCan, slug: 'limpieza-casas' },
      { name: 'Limpieza Oficinas', icon: Building2, slug: 'limpieza-oficinas' },
      { name: 'Jardineria', icon: TreePine, slug: 'jardineria' },
      { name: 'Paisajismo', icon: TreePine, slug: 'paisajismo' },
      { name: 'Mantenimiento', icon: Wrench, slug: 'mantenimiento-general' },
      { name: 'Reparaciones', icon: Hammer, slug: 'reparaciones-menores' },
      { name: 'Mudanzas', icon: Truck, slug: 'mudanzas' },
      { name: 'Fletes', icon: Truck, slug: 'fletes' },
    ],
  },
  {
    id: 'emergencias', title: 'Emergencias 24/7', slug: 'emergencias',
    color: 'from-red-700 to-red-900', icon: AlertTriangle,
    description: 'Servicios urgentes disponibles todo el dia',
    bg: 'https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=800&q=80',
    badge: '24/7',
    subcategories: [
      { name: 'Medico', icon: Stethoscope, slug: 'medico-domicilio' },
      { name: 'Enfermero/a', icon: Heart, slug: 'enfermero' },
      { name: 'Cuidador', icon: Users, slug: 'cuidador-mayores' },
      { name: 'Psicologo', icon: Heart, slug: 'psicologo-urgencia' },
      { name: 'Electricista Urg.', icon: Zap, slug: 'electricista-urgente' },
      { name: 'Plomero Urg.', icon: Droplets, slug: 'plomero-urgente' },
      { name: 'Cerrajero Urg.', icon: Lock, slug: 'cerrajero-urgente' },
    ],
  },
  {
    id: 'empresas', title: 'Empresas / Equipos', slug: 'empresas',
    color: 'from-blue-700 to-blue-900', icon: Briefcase,
    description: 'Cuadrillas, constructoras y equipos completos',
    bg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    subcategories: [
      { name: 'Constructoras', icon: Building2, slug: 'empresas-construccion' },
      { name: 'Cuadrillas', icon: Users, slug: 'cuadrillas' },
      { name: 'Equipos Manto.', icon: Users, slug: 'equipos-mantenimiento' },
      { name: 'Empresas Limpieza', icon: SprayCan, slug: 'empresas-limpieza' },
      { name: 'Corporativos', icon: Briefcase, slug: 'corporativos' },
    ],
  },
];

const StarRating = ({ rating = 0, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPros, setFeaturedPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    api.get('/professionals?featured=true&limit=8')
      .then(r => setFeaturedPros(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [manualCity, setManualCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('miprofesional_location');
    if (cached) {
      try { const p = JSON.parse(cached); if (p.lat && p.lng) { setUserLocation(p); return; } } catch {}
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem('miprofesional_location', JSON.stringify(loc));
        },
        () => {
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(d => d && d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : null)
            .then(loc => { if (loc) { setUserLocation(loc); localStorage.setItem('miprofesional_location', JSON.stringify(loc)); } })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
      );
    }
  }, []);

  useEffect(() => {
    if (featuredPros.length === 0) return;
    const timer = setInterval(() => setCarouselIndex(prev => (prev + 1) % featuredPros.length), 5000);
    return () => clearInterval(timer);
  }, [featuredPros]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const visiblePros = featuredPros.slice(carouselIndex, carouselIndex + 3);
  if (visiblePros.length < 3 && featuredPros.length > 0) {
    const remaining = featuredPros.slice(0, 3 - visiblePros.length);
    visiblePros.push(...remaining);
  }

  return (
    <>
      <Helmet>
        <title>MiProfesional — Marketplace de Servicios Profesionales</title>
        <meta name="description" content="Encuentra profesionales verificados para construccion, servicios generales, emergencias 24/7 y empresas." />
        <link rel="canonical" href="https://www.miprofesional.online" />
      </Helmet>

      {/* NAVBAR */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-sm">MP</div>
            <span className="font-bold text-lg text-gray-900">MiProfesional</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/" className="font-medium text-gray-900">Inicio</Link>
            <Link to="/categorias">Categorias</Link>
            <Link to="/search">Profesionales</Link>
            <Link to="/categoria/emergencias" className="text-red-600 font-medium">Urgencias 24H</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/register" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Ingresar</Link>
            <Link to="/register?role=professional" className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all">
              Soy Profesional
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-black">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.4)' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
              <Shield size={14} className="text-primary-400" />
              <span>Plataforma de conexion entre clientes y profesionales</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              Encuentra un<br /><span className="text-primary-400">Profesional</span> cerca tuyo
            </h1>
            <p className="text-lg text-gray-300 mb-10 max-w-xl leading-relaxed">
              Conectamos clientes con profesionales verificados. Desde albaniles hasta medicos, el experto que necesitas esta aqui.
            </p>
            <form onSubmit={handleSearch} className="max-w-xl mb-10">
              <div className="flex bg-white/5 border border-gray-700 rounded-xl overflow-hidden focus-within:border-primary-500 transition-all">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Que servicio necesitas? Ej: Plomero, Electricista..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-600 focus:outline-none text-base"
                />
                <button type="submit" className="px-8 py-4 bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-2">
                  Buscar <Search size={18} />
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-3">
              {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero'].map(cat => (
                <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-primary-500/50 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      {featuredPros.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-20">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-primary-500 text-xs font-semibold uppercase tracking-wider">Destacados</span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5">Profesionales Recomendados</h2>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCarouselIndex(prev => (prev - 1 + featuredPros.length) % featuredPros.length)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                ><ChevronLeft size={18} /></button>
                <button onClick={() => setCarouselIndex(prev => (prev + 1) % featuredPros.length)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                ><ChevronRightIcon size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visiblePros.map((pro) => (
                <Link key={pro._id} to={`/service/${pro._id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=0f7a5a&color=fff`}
                    alt="" className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary-500 transition-colors">
                      {pro.businessName || pro.profession}
                    </h3>
                    <p className="text-xs text-gray-500">{pro.profession}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={pro.stats?.rating || 0} size={12} />
                      <span className="text-xs text-gray-400">{(pro.stats?.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BANNER PUBLICITARIO */}
      {bannerVisible && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl overflow-hidden">
            <button onClick={() => setBannerVisible(false)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all z-10"
            ><X size={16} /></button>
            <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Megaphone size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Publicidad</p>
                  <p className="text-primary-200 text-sm">Promociona tu negocio en MiProfesional — llega a miles de clientes</p>
                </div>
              </div>
              <Link to="/register?role=professional"
                className="shrink-0 px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-all text-sm"
              >Publicitar ahora</Link>
            </div>
          </div>
        </section>
      )}

      {/* 4 CLUSTERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Categorias</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Explora nuestros rubros y encuentra al profesional que buscas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((cluster) => {
            const Icon = cluster.icon;
            const isEmergency = cluster.id === 'emergencias';
            return (
              <div key={cluster.id}
                className={`relative rounded-2xl overflow-hidden border border-gray-200 bg-white hover-lift ${isEmergency ? 'md:col-span-2 md:grid md:grid-cols-2 border-red-200 ring-2 ring-red-500/20' : ''}`}
              >
                <div className={`relative overflow-hidden ${isEmergency ? 'h-full min-h-[280px]' : 'h-48'}`}>
                  <img src={cluster.bg} alt={cluster.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className={`absolute ${isEmergency ? 'inset-0 flex flex-col items-center justify-center text-center p-6' : 'bottom-4 left-4 right-4'}`}>
                    <div className={`flex items-center gap-3 ${isEmergency ? 'flex-col' : ''}`}>
                      <div className={`rounded-xl bg-gradient-to-br ${cluster.color} flex items-center justify-center shadow-lg ${isEmergency ? 'w-16 h-16' : 'w-12 h-12'}`}>
                        <Icon size={isEmergency ? 32 : 24} className="text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-white ${isEmergency ? 'text-3xl' : 'text-xl'}`}>{cluster.title}</h3>
                          {cluster.badge && (
                            <span className={`px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-md ${isEmergency ? 'animate-pulse' : ''}`}>{cluster.badge}</span>
                          )}
                        </div>
                        <p className={`text-gray-300 ${isEmergency ? 'text-base mt-2' : 'text-xs'}`}>{cluster.description}</p>
                        {isEmergency && (
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <Clock size={14} className="text-red-400" />
                            <span className="text-red-300 text-sm font-medium">Disponible las 24 horas</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 ${isEmergency ? 'flex flex-col justify-center bg-gradient-to-br from-red-50 to-red-50/50' : ''}`}>
                  <div className="grid grid-cols-3 gap-2">
                    {cluster.subcategories.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link key={sub.slug} to={`/search?q=${encodeURIComponent(sub.name)}`}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all group ${isEmergency ? 'hover:bg-red-100' : 'hover:bg-gray-50'}`}
                        >
                          <SubIcon size={18} className={`transition-colors ${isEmergency ? 'text-red-400 group-hover:text-red-600' : 'text-gray-400 group-hover:text-primary-500'}`} />
                          <span className={`text-[11px] text-center leading-tight transition-colors ${isEmergency ? 'text-red-700 group-hover:text-red-900 font-medium' : 'text-gray-500 group-hover:text-gray-900'}`}>
                            {sub.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link to={`/categoria/${cluster.slug}`}
                    className={`mt-3 w-full flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isEmergency ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' : 'border border-gray-200 text-gray-600 hover:text-primary-500 hover:border-primary-300'}`}
                  >
                    {isEmergency ? 'Solicitar emergencia' : 'Ver todos'} <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BANNER 2 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-primary-400/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <UserPlus size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Sos profesional?</p>
              <p className="text-primary-200 text-sm">Registrate y ofrece tus servicios a miles de clientes</p>
            </div>
          </div>
          <Link to="/register?role=professional"
            className="shrink-0 px-6 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all text-sm shadow-lg"
          >Registrarme gratis</Link>
        </div>
      </section>

      {/* MAS CATEGORIAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <div className="border border-dashed border-gray-300 rounded-2xl p-10 md:p-14 bg-white">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LayoutGrid size={28} className="text-gray-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Mas categorias</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Mascotas, Belleza, Gastronomia, Transporte, Cerrajeria, Tecnologia, Automotor, Hogar — explora todos los servicios disponibles en la plataforma.
          </p>
          <Link to="/categorias"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
          >Ver todas las categorias <ArrowRight size={18} /></Link>
        </div>
      </section>

      {/* MAPA TIPO UBER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Profesionales cerca tuyo</h2>
            <p className="text-gray-500 mt-1">Busca profesionales en tu zona y contacta directamente</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); if (manualCity.trim()) navigate(`/search?q=${encodeURIComponent(manualCity.trim())}`); }}
              className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
              <MapPin size={14} className="text-gray-400" />
              <input type="text" value={manualCity} onChange={e => setManualCity(e.target.value)}
                placeholder="Tu ciudad..." className="bg-transparent text-sm w-32 focus:outline-none text-gray-700 placeholder-gray-400" />
              <button type="submit" className="text-primary-600 text-xs font-medium hover:underline">Ir</button>
            </form>
            <Link to="/search"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all text-sm"
            ><Search size={16} /> Buscar ahora</Link>
          </div>
        </div>
        {userLocation && !showCityInput ? (
          <div className="h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
            <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} className="h-full w-full" zoomControl={false}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup><div className="text-center"><p className="font-semibold text-sm">Tu ubicacion</p><p className="text-xs text-gray-500">Estas aqui</p></div></Popup>
              </Marker>
              {featuredPros.slice(0, 5).map((pro) => (
                pro.location?.coordinates?.length === 2 && (
                  <Marker key={pro._id} position={[pro.location.coordinates[1], pro.location.coordinates[0]]} icon={customIcon}>
                    <Popup>
                      <div className="text-center min-w-[180px]">
                        <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=0f7a5a&color=fff`}
                          alt="" className="w-10 h-10 rounded-full mx-auto mb-2 object-cover" />
                        <p className="font-semibold text-sm">{pro.businessName || pro.profession}</p>
                        <p className="text-xs text-gray-500 mb-2">{pro.profession}</p>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">{(pro.stats?.rating || 0).toFixed(1)}</span>
                        </div>
                        <Link to={`/service/${pro._id}`} className="text-xs text-primary-600 font-medium hover:underline">Ver perfil</Link>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
            <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-center">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-5 py-3 flex items-center gap-4 text-sm">
                <MapPin size={16} className="text-primary-500 shrink-0" />
                <span className="text-gray-600">Mostrando profesionales cerca de tu ubicacion</span>
                <Link to="/search" className="px-4 py-1.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-all text-xs">Explorar mapa</Link>
                <button onClick={() => setShowCityInput(true)} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">ubicacion incorrecta?</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium mb-2">{showCityInput ? 'Ingresa tu ciudad para buscar profesionales' : 'Activa la ubicacion o ingresa tu ciudad'}</p>
              <form onSubmit={(e) => { e.preventDefault(); if (manualCity.trim()) navigate(`/search?q=${encodeURIComponent(manualCity.trim())}`); }}
                className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm max-w-xs mx-auto">
                <MapPin size={14} className="text-gray-400" />
                <input type="text" value={manualCity} onChange={e => setManualCity(e.target.value)}
                  placeholder="Ej: Buenos Aires..." className="bg-transparent text-sm flex-1 focus:outline-none text-gray-700 placeholder-gray-400" />
                <button type="submit" className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700">Buscar</button>
              </form>
              {showCityInput && (
                <button onClick={() => { setShowCityInput(false); localStorage.removeItem('miprofesional_location'); window.location.reload(); }} className="text-xs text-gray-400 hover:text-gray-600 underline mt-3">volver al mapa</button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Como Funciona</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Encontrar al profesional ideal es simple y rapido</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, step: '1', title: 'Busca', desc: 'Explora por categoria o busca directamente el servicio que necesitas.' },
            { icon: Users, step: '2', title: 'Compara', desc: 'Revisa perfiles con calificaciones reales de otros clientes.' },
            { icon: ArrowRight, step: '3', title: 'Contacta', desc: 'Conecta directamente con el profesional y acuerda los detalles.' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center p-8 bg-white rounded-2xl border border-gray-200">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Icon size={28} className="text-primary-500" />
                </div>
                <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">{item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SUSCRIPCION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="border border-gray-200 rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                <Shield size={14} /> Suscripcion Profesional
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ofrece tus servicios</h3>
              <p className="text-gray-600 text-sm mb-4">
                Para formar parte del marketplace es requerida una suscripcion activa. La plataforma solo conecta clientes con profesionales.
              </p>
              <div className="text-3xl font-black text-gray-900 mb-2">$10.000 <span className="text-base font-normal text-gray-500">ARS / mes</span></div>
              <ul className="space-y-2 mb-6">
                {['Perfil destacado en busquedas', 'Recibe contactos de clientes', 'Sin comisiones por servicio', 'Panel de control'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <ArrowRight size={14} className="text-primary-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=professional"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all"
              >Registrarme como Profesional <ArrowRight size={18} /></Link>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 md:p-8">
              <h4 className="font-semibold text-gray-900 mb-3">Terminos Legales</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" /><span>La plataforma no garantiza trabajo a los profesionales registrados.</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" /><span>La plataforma no gestiona pagos entre clientes y profesionales.</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" /><span>La plataforma no interviene en las transacciones acordadas.</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" /><span>La plataforma no es responsable por trabajos, pagos o conflictos entre las partes.</span></li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" /><span>Toda relacion contractual es exclusivamente entre el cliente y el profesional.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-black text-center py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-gray-800 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-6">
            <UserPlus size={16} /> <span>Unete a nuestra comunidad</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">Comienza Hoy</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">Ya seas cliente o profesional, encuentra lo que necesitas en un solo lugar.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-10 py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-xl text-base">Crear Cuenta Gratis</Link>
            <Link to="/search" className="px-10 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-gray-700 text-base">Explorar Servicios</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-white font-black text-xs">MP</div>
            <span className="font-bold text-lg text-gray-900">MiProfesional</span>
          </div>
          <p className="text-gray-500 text-sm mb-2">Conectando personas con profesionales verificados en toda Argentina</p>
          <p className="text-gray-400 text-xs">Desarrollado por Luis Aguerre</p>
        </div>
      </footer>
    </>
  );
};

export default Home;
