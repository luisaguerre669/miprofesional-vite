import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/axios';
import { getAccurateLocation } from '../utils/geolocation';
import { useAuth } from '../context/AuthContext';
import {
  Search, ArrowRight, Star, MapPin, Heart,
  AlertTriangle, ChevronLeft, ChevronRight, Shield, Clock,
  UserPlus, TrendingUp, MessageCircle, LogOut, User, Settings,
  LayoutDashboard, Download, Plus
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import AdBanner from '../components/ads/AdBanner';
import { resolveIcon, getInlineGradient } from '../utils/categoryIcons';

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

const benefits = [
  { icon: Shield, title: 'Profesionales Verificados', desc: 'Todos los profesionales pasan por un proceso de verificacion de identidad y antecedentes.' },
  { icon: Star, title: 'Calificaciones Reales', desc: 'Cada profesional tiene calificaciones y opiniones de clientes reales como vos.' },
  { icon: TrendingUp, title: 'Sin Comisiones', desc: 'La plataforma solo conecta. No cobramos comisiones por los trabajos realizados.' },
  { icon: MessageCircle, title: 'Contacto Directo', desc: 'Comunicate directamente con el profesional sin intermediarios ni barreras.' },
  { icon: Clock, title: 'Respuesta Rapida', desc: 'La mayoria de los profesionales responden en menos de 2 horas.' },
  { icon: MapPin, title: 'Cerca de tu Zona', desc: 'Filtra por ubicacion y encuentra profesionales cerca de tu domicilio.' },
];

const APK_VERSION = 'v1.0.0';
const APK_URL = `/downloads/miprofesional-${APK_VERSION}.apk`;
const SITE_URL = 'https://www.miprofesional.online';

function detectDevice() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

function isStandalone() {
  return typeof window !== 'undefined' && 'standalone' in window.navigator && window.navigator.standalone;
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[110px] sm:w-[140px] lg:w-[200px]">
      <div className="relative bg-gray-900 rounded-[20px] sm:rounded-[24px] p-1.5 shadow-2xl shadow-black/40 border border-gray-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50px] sm:w-[70px] h-3 bg-gray-900 rounded-b-xl z-10" />
        <div className="bg-white rounded-[16px] sm:rounded-[18px] overflow-hidden aspect-[9/19] flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col items-center justify-center p-3 sm:p-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-white flex items-center justify-center mb-1.5 sm:mb-2 shadow-lg">
              <span className="text-primary-600 font-black text-[10px] sm:text-xs">MP</span>
            </div>
            <p className="text-white text-[8px] sm:text-[10px] font-bold text-center leading-tight">MiProfesional</p>
            <p className="text-white/60 text-[7px] sm:text-[8px] mt-0.5 text-center">Encuentra profesionales</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const StarRating = ({ rating = 0, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
    ))}
  </div>
);

const PROVINCES = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman'
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isProfessional } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPros, setFeaturedPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [bannerTop, setBannerTop] = useState(true);
  const [bannerSide1, setBannerSide1] = useState(true);
  const [bannerSide2] = useState(true);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [device, setDevice] = useState('desktop');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => { setDevice(detectDevice()); setAlreadyInstalled(isStandalone()); }, []);

  useEffect(() => {
    api.get('/professionals?featured=true&limit=8')
      .then(r => setFeaturedPros(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/categories/tree')
      .then(r => setCategories(r.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const [manualCity, setManualCity] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [locationMode, setLocationMode] = useState(''); // 'gps' | 'city' | 'manual'
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', number: '', neighborhood: '', city: '', province: '' });

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`, {
        headers: { 'User-Agent': 'MiProfesional/1.0' }
      });
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(',');
        const short = parts.slice(0, 3).join(',').trim();
        setUserAddress(short);
      } else {
        setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      setUserAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  const geocodeFullAddress = useCallback(async (fields) => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const streetAddr = [fields.street, fields.number].filter(Boolean).join(' ');
      const res = await api.get('/professionals/geocode', {
        params: {
          address: streetAddr || `${fields.neighborhood}`,
          city: fields.city,
          state: fields.province,
          country: 'Argentina'
        }
      });
      if (res.data?.success && res.data?.data) {
        const loc = { lat: res.data.data.latitude, lng: res.data.data.longitude };
        setUserLocation(loc);
        setUserAddress(res.data.data.displayName || `${streetAddr}, ${fields.city}`);
        setLocationMode('city');
        setShowCityInput(false);
      } else {
        setGeoError(res.data?.message || 'No se pudo encontrar la direccion. Verifica los datos.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al buscar la ubicacion. Intenta de nuevo.';
      setGeoError(msg);
    }
    setGeoLoading(false);
  }, []);

  const getLocation = useCallback(async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const result = await getAccurateLocation();
      if (result.error) {
        setGeoError(result.error);
        setShowFullAddress(true);
        setShowCityInput(true);
      } else {
        setUserLocation({ lat: result.lat, lng: result.lng });
        setLocationMode('gps');
        setGeoError('');
        setShowCityInput(false);
        reverseGeocode(result.lat, result.lng);
      }
    } catch (err) {
      setGeoError('Error inesperado al obtener ubicacion.');
      setShowCityInput(true);
    }
    setGeoLoading(false);
  }, [reverseGeocode]);

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
            <button onClick={() => { setShowCityInput(true); setShowFullAddress(true); }}
              className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
              Ingresar direccion manualmente
            </button>
          </div>
        </div>
      );
    }
    if (showCityInput) {
      return (
        <div className="h-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          <div className="text-center px-4 w-full max-w-xs">
            <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 font-medium text-sm mb-3">
              {showFullAddress ? 'Ingresa tu direccion exacta' : 'Selecciona tu ubicacion'}
            </p>
            {showFullAddress ? (
              <div className="space-y-2 text-left">
                <div className="flex gap-2">
                  <input type="text" value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                    placeholder="Calle" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                  <input type="text" value={addressForm.number} onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))}
                    placeholder="Numero" className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <input type="text" value={addressForm.neighborhood} onChange={e => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))}
                  placeholder="Barrio (opcional)" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                <div className="flex gap-2">
                  <input type="text" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Ciudad" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                  <select value={addressForm.province} onChange={e => setAddressForm(f => ({ ...f, province: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                    <option value="">Provincia</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button onClick={() => geocodeFullAddress(addressForm)}
                  disabled={!addressForm.city || !addressForm.province || geoLoading}
                  className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  {geoLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin size={14} />}
                  {geoLoading ? 'Buscando...' : 'Ubicar direccion'}
                </button>
                <button onClick={() => setShowFullAddress(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center">Usar solo ciudad</button>
              </div>
            ) : (
              <div className="space-y-2">
                <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="">Provincia</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" value={manualCity} onChange={e => setManualCity(e.target.value)}
                  placeholder="Ciudad (ej: La Plata)"
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                <button onClick={() => { if (manualCity.trim() && selectedProvince) { setAddressForm(f => ({ ...f, city: manualCity, province: selectedProvince })); setShowFullAddress(true); } }}
                  disabled={!manualCity.trim() || !selectedProvince || geoLoading}
                  className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2">
                  {geoLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MapPin size={14} />}
                  {geoLoading ? 'Buscando...' : 'Siguiente: direccion exacta'}
                </button>
                <button onClick={() => setShowFullAddress(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center">Ingresar direccion completa</button>
              </div>
            )}
            {geoError && <p className="text-red-500 text-xs mt-2">{geoError}</p>}
            <button onClick={() => { setShowCityInput(false); getLocation(); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline mt-3">Intentar con GPS</button>
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
            <button onClick={() => { setShowCityInput(true); setShowFullAddress(true); }}
              className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
              Ingresar direccion manualmente
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
            <Popup><div className="text-center"><p className="font-semibold text-sm">Tu ubicacion</p><p className="text-xs text-gray-500">{userAddress || 'Estas aqui'}</p></div></Popup>
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
            <span className="text-gray-600 text-xs truncate max-w-[160px]">{userAddress || 'Profesionales cerca de tu ubicacion'}</span>
            {locationMode === 'gps' && <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded font-medium">GPS</span>}
            {locationMode === 'city' && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Ciudad</span>}
            <button onClick={() => { setShowCityInput(true); setShowFullAddress(true); }} className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">cambiar</button>
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
            {isAuthenticated ? (
              <div className="relative flex items-center gap-2">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-900 hidden sm:block">{user?.name?.split(' ')[0] || 'Usuario'}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                      <Link to={isProfessional ? '/dashboard/professional' : '/dashboard/client'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard size={16} className="text-gray-400" /> Dashboard
                      </Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={16} className="text-gray-400" /> Mi Perfil
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={16} className="text-gray-400" /> Configuracion
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setUserMenuOpen(false); logout(); navigate('/'); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={16} /> Cerrar Sesion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Ingresar</Link>
                <Link to="/register?role=professional" className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm">
                  Soy Profesional
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO PREMIUM */}
      <section className="relative flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover opacity-20" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-16">
          {/* MOBILE LAYOUT */}
          <div className="block lg:hidden space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-0.5 text-[10px] text-gray-300 mb-2">
                <Shield size={10} className="text-primary-400" />
                <span>Marketplace de confianza</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                El profesional que necesitas<br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">esta mas cerca</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">Conectamos clientes con profesionales verificados en toda Argentina.</p>
            </div>

            {!alreadyInstalled && (
              <div className="space-y-3">
                <a href={APK_URL} download
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-all shadow-xl shadow-primary-500/30"
                ><Download size={22} /> Descargar APK — Gratis</a>

                <div className="flex items-center justify-center gap-2">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1.5 shrink-0">
                    <QRCodeCanvas value={SITE_URL} size={54} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                  </div>
                  <p className="text-[11px] text-gray-400">{device === 'android' ? `Version ${APK_VERSION} · Gratis` : 'Gratis · Sin registro'}</p>
                </div>

                <div className="flex justify-center">
                  <PhoneMockup />
                </div>
              </div>
            )}

            <form onSubmit={handleSearch}>
              <div className="relative flex bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Plomero, Electricista, Medico..."
                  className="w-full pl-9 pr-2 py-2.5 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                />
                <button type="submit" className="px-3 py-2.5 bg-primary-500 text-white font-bold text-xs hover:bg-primary-600 transition-all flex items-center gap-1">
                  Buscar
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista'].map(cat => (
                <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-lg text-[10px] text-gray-300 hover:text-white transition-all"
                >{cat}</Link>
              ))}
            </div>
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:flex lg:flex-row items-center gap-14">
            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
                <Shield size={14} className="text-primary-400" />
                <span>Marketplace de confianza en Argentina</span>
              </div>
              <h1 className="text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-4">
                El profesional que necesitas<br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">esta mas cerca de lo que crees</span>
              </h1>
              <p className="text-lg text-gray-400 mb-6 max-w-xl leading-relaxed">
                Conectamos clientes con profesionales verificados en toda Argentina.
              </p>
              <form onSubmit={handleSearch} className="max-w-xl">
                <div className="relative flex bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all shadow-xl shadow-black/20">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Busca un servicio: Plomero, Electricista, Medico..."
                    className="w-full pl-12 pr-4 py-5 bg-transparent text-white placeholder-gray-600 focus:outline-none text-base"
                  />
                  <button type="submit" className="px-8 py-5 bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-2">
                    <span>Buscar</span> <Search size={18} />
                  </button>
                </div>
              </form>
              <div className="flex flex-wrap gap-2 mt-6">
                {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista'].map(cat => (
                  <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-xl text-xs text-gray-300 hover:text-white transition-all"
                  >{cat}</Link>
                ))}
              </div>
            </div>
            {!alreadyInstalled && (
              <div className="shrink-0 flex flex-col items-center gap-5">
                <PhoneMockup />
                <div className="flex items-stretch gap-3">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 shrink-0 flex items-center">
                    <QRCodeCanvas value={SITE_URL} size={70} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                  </div>
                  <div className="flex flex-col justify-center gap-1.5">
                    {device === 'android' && (
                      <a href={APK_URL} download
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Download size={20} /> Descargar APK</a>
                    )}
                    {device === 'ios' && (
                      <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Plus size={20} /> Instalar en iPhone</a>
                    )}
                    {device === 'desktop' && (
                      <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Download size={20} /> Ir a la App</a>
                    )}
                    <p className="text-[11px] text-gray-500 text-center">{device === 'android' ? `Version ${APK_VERSION} · Gratis` : 'Gratis · Sin registro'}</p>
                  </div>
                </div>
              </div>
            )}
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
        {categoriesLoading ? (
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible pb-2 md:pb-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="snap-start shrink-0 w-[160px] md:w-auto md:flex-1 rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:overflow-visible pb-2 md:pb-0">
            {categories.map((cat) => {
              const Icon = resolveIcon(cat.icon);
              const gradient = getInlineGradient(cat.metadata?.color);
              const subCount = cat.subcategories?.length || 0;
              return (
                <Link key={cat.slug} to={`/categoria/${cat.slug}`}
                  className="snap-start shrink-0 w-[160px] md:w-auto md:flex-1 group relative overflow-hidden rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 opacity-60 group-hover:opacity-75 transition-all duration-300" style={{ background: gradient }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className="text-white shrink-0" />
                      <h3 className="text-sm font-bold text-white truncate group-hover:drop-shadow-md transition-all">{cat.title}</h3>
                    </div>
                    <p className="text-[11px] text-white/70 mt-0.5">{subCount} servicios</p>
                  </div>
                  {cat.metadata?.emergency && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md animate-pulse">24/7</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
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
