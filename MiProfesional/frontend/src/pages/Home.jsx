import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle, ChevronLeft, ChevronRight, Shield, Clock,
  UserPlus, LayoutGrid, X, Phone, CheckCircle, Award,
  TrendingUp, MessageCircle, Quote
} from 'lucide-react';
import AdBanner from '../components/ads/AdBanner';

const ChefHat = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/></svg>;
const Monitor = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>;
const PawPrint = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>;

const customIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#0f7a5a;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});

const userIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});

const categories = [
  { name: 'Construccion', icon: Building2, slug: 'construccion', color: 'from-amber-600 to-amber-800', count: '11 servicios', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&q=80' },
  { name: 'Servicios Generales', icon: Wrench, slug: 'servicios-generales', color: 'from-emerald-600 to-emerald-800', count: '8 servicios', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' },
  { name: 'Emergencias 24/7', icon: AlertTriangle, slug: 'emergencias', color: 'from-red-600 to-red-800', count: '7 servicios', image: 'https://images.unsplash.com/photo-1587745416684-47953f16fdd1?w=400&q=80', badge: '24/7' },
  { name: 'Hogar y Confort', icon: Paintbrush, slug: 'hogar', color: 'from-violet-600 to-violet-800', count: '5 servicios', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80' },
  { name: 'Belleza y Cuidado', icon: Heart, slug: 'belleza', color: 'from-pink-600 to-pink-800', count: '8 servicios', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80' },
  { name: 'Gastronomia', icon: ChefHat, slug: 'gastronomia', color: 'from-orange-600 to-orange-800', count: '4 servicios', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
  { name: 'Tecnologia', icon: Monitor, slug: 'tecnologia', color: 'from-cyan-600 to-cyan-800', count: '6 servicios', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80' },
  { name: 'Automotor', icon: Truck, slug: 'automotor', color: 'from-slate-600 to-slate-800', count: '5 servicios', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80' },
  { name: 'Mascotas', icon: PawPrint, slug: 'mascotas', color: 'from-teal-600 to-teal-800', count: '4 servicios', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&q=80' },
  { name: 'Empresas', icon: Briefcase, slug: 'empresas', color: 'from-blue-600 to-blue-800', count: '5 servicios', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80' },
];

const testimonials = [
  { name: 'Martin G.', role: 'Cliente', text: 'Encontre al electricista perfecto en minutos. Muy facil de usar y los profesionales son verificados.', rating: 5, avatar: 'MG' },
  { name: 'Laura D.', role: 'Profesional', text: 'Desde que me registre recibo consultas semanalmente. La mejor decision para mi negocio.', rating: 5, avatar: 'LD' },
  { name: 'Carlos R.', role: 'Cliente', text: 'Servicio rapido y confiable. Ya contrate 2 profesionales por la plataforma y todo perfecto.', rating: 5, avatar: 'CR' },
];

const benefits = [
  { icon: Shield, title: 'Profesionales Verificados', desc: 'Todos los profesionales pasan por un proceso de verificacion de identidad y antecedentes.' },
  { icon: Star, title: 'Calificaciones Reales', desc: 'Cada profesional tiene calificaciones y opiniones de clientes reales como vos.' },
  { icon: TrendingUp, title: 'Sin Comisiones', desc: 'La plataforma solo conecta. No cobramos comisiones por los trabajos realizados.' },
  { icon: MessageCircle, title: 'Contacto Directo', desc: 'Comunicate directamente con el profesional sin intermediarios ni barreras.' },
  { icon: Clock, title: 'Respuesta Rapida', desc: 'La mayoria de los profesionales responden en menos de 2 horas.' },
  { icon: MapPin, title: 'Cerca de tu Zona', desc: 'Filtra por ubicacion y encuentra profesionales cerca de tu domicilio.' },
];

const StarRating = ({ rating = 0, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
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
  const [bannerTop, setBannerTop] = useState(true);
  const [bannerSide1, setBannerSide1] = useState(true);
  const [bannerSide2] = useState(true);

  useEffect(() => {
    api.get('/professionals?featured=true&limit=8')
      .then(r => setFeaturedPros(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [manualCity, setManualCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Tu navegador no soporta geolocalizacion');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGeoLoading(false);
        setGeoError('');
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Permiso de ubicacion denegado. Activalo desde la configuracion del navegador.');
        } else if (err.code === 2) {
          setGeoError('No se pudo obtener la ubicacion. Senal GPS no disponible.');
        } else {
          setGeoError('No se pudo obtener la ubicacion. Intenta de nuevo.');
        }
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(d => d && d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : null)
          .then(loc => { if (loc) { setUserLocation(loc); setGeoError(''); } })
          .catch(() => {});
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

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

  const renderMap = () => {
    if (geoLoading) {
      return (
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">Obteniendo ubicacion...</p>
          </div>
        </div>
      );
    }
    if (geoError && !userLocation) {
      return (
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin size={28} className="mx-auto text-red-300 mb-2" />
            <p className="text-red-500 font-medium text-sm mb-1">Error de ubicacion</p>
            <p className="text-gray-400 text-xs mb-4 max-w-[200px] mx-auto">{geoError}</p>
            <button onClick={getLocation}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-all shadow-sm">
              Reintentar ubicacion
            </button>
            <button onClick={() => setShowCityInput(true)}
              className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
              Ingresar ciudad manualmente
            </button>
          </div>
        </div>
      );
    }
    if (showCityInput) {
      return (
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium text-sm mb-3">Ingresa tu ciudad</p>
            <form onSubmit={(e) => { e.preventDefault(); if (manualCity.trim()) navigate(`/search?q=${encodeURIComponent(manualCity.trim())}`); }}
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm max-w-xs mx-auto">
              <MapPin size={14} className="text-gray-400" />
              <input type="text" value={manualCity} onChange={e => setManualCity(e.target.value)}
                placeholder="Buenos Aires..." className="bg-transparent text-sm flex-1 focus:outline-none text-gray-700 placeholder-gray-400" />
              <button type="submit" className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700">Ir</button>
            </form>
            <button onClick={() => { setShowCityInput(false); getLocation(); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline mt-2">usar GPS</button>
          </div>
        </div>
      );
    }
    if (!userLocation) {
      return (
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4">
            <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium text-sm mb-3">Activa tu ubicacion</p>
            <button onClick={getLocation}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-all shadow-sm">
              Activar ubicacion
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
        <MapContainer key={`${userLocation.lat}-${userLocation.lng}`} center={[userLocation.lat, userLocation.lng]} zoom={13} className="h-full w-full" zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                    <StarRating rating={pro.stats?.rating || 0} size={11} />
                    <Link to={`/service/${pro._id}`} className="block mt-2 text-xs text-primary-600 font-medium hover:underline">Ver perfil</Link>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3 text-sm">
            <MapPin size={14} className="text-primary-500 shrink-0" />
            <span className="text-gray-600 text-xs">Profesionales cerca de tu ubicacion</span>
            <button onClick={() => setShowCityInput(true)} className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">cambiar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>MiProfesional — Marketplace de Servicios Profesionales en Argentina</title>
        <meta name="description" content="Encuentra profesionales verificados cerca tuyo: albaniles, plomeros, electricistas, medicos y mas. Conectamos clientes con profesionales en toda Argentina." />
        <meta name="keywords" content="profesionales, servicios, albanil, plomero, electricista, medico, argentina, marketplace" />
        <meta property="og:title" content="MiProfesional — Encuentra Profesionales Cerca Tuyo" />
        <meta property="og:description" content="Conectamos clientes con profesionales verificados en toda Argentina." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.miprofesional.online" />
        <link rel="canonical" href="https://www.miprofesional.online" />
      </Helmet>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-sm group-hover:bg-primary-700 transition-colors">MP</div>
            <span className="font-bold text-lg text-gray-900">MiProfesional</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/" className="font-medium text-gray-900">Inicio</Link>
            <Link to="/categorias">Categorias</Link>
            <Link to="/search">Profesionales</Link>
            <Link to="/categoria/emergencias" className="text-red-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Urgencias</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/register" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Ingresar</Link>
            <Link to="/register?role=professional" className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm">
              Soy Profesional
            </Link>
          </div>
        </div>
      </header>

      {/* HERO PREMIUM */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover opacity-20" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
              <Shield size={14} className="text-primary-400" />
              <span>Marketplace de confianza en Argentina</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6">
              El profesional que necesitas<br />
              <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">esta mas cerca de lo que crees</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10 max-w-xl leading-relaxed">
              Conectamos clientes con profesionales verificados en toda Argentina. Desde albaniles hasta medicos, el experto ideal para cada proyecto.
            </p>
            <form onSubmit={handleSearch} className="max-w-xl">
              <div className="relative flex bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all shadow-xl shadow-black/20">
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Busca un servicio: Plomero, Electricista, Medico..."
                  className="w-full pl-12 pr-4 py-4 md:py-5 bg-transparent text-white placeholder-gray-600 focus:outline-none text-base"
                />
                <button type="submit" className="px-6 md:px-8 py-4 md:py-5 bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-2">
                  <span className="hidden sm:inline">Buscar</span> <Search size={18} />
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-2 mt-8">
              {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista'].map(cat => (
                <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-xl text-xs text-gray-300 hover:text-white transition-all"
                >{cat}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* FEATURED PROS CAROUSEL */}
      {featuredPros.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-20">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Profesionales</span>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">Destacados de la Semana</h2>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setCarouselIndex(prev => (prev - 1 + featuredPros.length) % featuredPros.length)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                ><ChevronLeft size={18} /></button>
                <button onClick={() => setCarouselIndex(prev => (prev + 1) % featuredPros.length)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                ><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visiblePros.map((pro) => (
                <Link key={pro._id} to={`/service/${pro._id}`}
                  className="group relative flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="relative shrink-0">
                    <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=0f7a5a&color=fff&bold=true`}
                      alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                    {pro.verification?.isVerified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                      {pro.businessName || pro.profession}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{pro.profession}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StarRating rating={pro.stats?.rating || 0} size={11} />
                      <span className="text-[11px] text-gray-400">{(pro.stats?.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-2" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Rubros</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Categorias</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Explora nuestros rubros y encuentra al profesional que necesitas</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.slug} to={`/categoria/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className="text-white shrink-0" />
                    <h3 className="text-sm font-bold text-white truncate">{cat.name}</h3>
                  </div>
                  <p className="text-[11px] text-white/70 mt-0.5">{cat.count}</p>
                </div>
                {cat.badge && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md animate-pulse">{cat.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* MAP + ADS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="mb-6">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Ubicacion</span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">Profesionales cerca de tu zona</h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-[40%]">
            <div className="h-[300px] md:h-[400px]">
              {renderMap()}
            </div>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-4">
            {bannerSide1 && <div className="flex-1"><AdBanner position="sidebar" onDismiss={() => setBannerSide1(false)} /></div>}
            {bannerSide2 && <div className="flex-1"><AdBanner position="sidebar" link="/register?role=professional" /></div>}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-gray-50 py-20 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Por que elegirnos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Beneficios de la Plataforma</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Todo lo que necesitas para conectar con el profesional ideal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="text-center mb-12">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Testimonios</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Lo que dicen nuestros usuarios</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-md transition-all">
              <Quote size={24} className="text-primary-200 mb-3" />
              <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{t.avatar}</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
                <div className="ml-auto">
                  <StarRating rating={t.rating} size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-20 md:py-24 px-4">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
            <UserPlus size={14} /> <span>Comienza hoy</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            {featuredPros.length > 0 ? 'Unite a miles de profesionales' : 'Encontra al profesional ideal'}
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
            {featuredPros.length > 0
              ? 'Registrate gratis y ofrece tus servicios a miles de clientes en toda Argentina.'
              : 'Explora profesionales verificados cerca tuyo y contacta directo sin intermediarios.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 text-base">
              Crear Cuenta Gratis
            </Link>
            <Link to="/search" className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-gray-700 text-base backdrop-blur-sm">
              Explorar Servicios
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-xs">MP</div>
                <span className="font-bold text-lg text-gray-900">MiProfesional</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Conectando personas con profesionales verificados en toda Argentina.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/search" className="hover:text-primary-600 transition-colors">Buscar profesionales</Link></li>
                <li><Link to="/categorias" className="hover:text-primary-600 transition-colors">Categorias</Link></li>
                <li><Link to="/categoria/emergencias" className="hover:text-red-600 transition-colors">Emergencias 24/7</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Profesionales</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link to="/register?role=professional" className="hover:text-primary-600 transition-colors">Registrarse</Link></li>
                <li><Link to="/subscription" className="hover:text-primary-600 transition-colors">Planes de suscripcion</Link></li>
                <li><Link to="/login" className="hover:text-primary-600 transition-colors">Iniciar sesion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><span className="hover:text-primary-600 transition-colors cursor-default">Terminos y condiciones</span></li>
                <li><span className="hover:text-primary-600 transition-colors cursor-default">Politica de privacidad</span></li>
                <li><span className="hover:text-primary-600 transition-colors cursor-default">Defensa del consumidor</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs"> 2026 MiProfesional — Plataforma de conexion entre clientes y profesionales</p>
            <p className="text-gray-400 text-xs">Desarrollado por <span className="font-medium text-gray-500">Luis Aguerre</span></p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
