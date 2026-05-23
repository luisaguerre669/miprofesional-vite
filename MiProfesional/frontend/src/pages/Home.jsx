import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/axios';
import { getAccurateLocation } from '../utils/geolocation';
import {
  Search, ArrowRight, Star, MapPin, Sparkles,
  ChevronLeft, ChevronRight, Shield, Clock,
  UserPlus, Download, Plus, Smartphone, AlertTriangle
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
  { icon: MapPin, title: 'Profesionales cerca tuyo', desc: 'Filtra por ubicacion y conecta con profesionales verificados en tu zona.' },
  { icon: Search, title: 'Todo en un solo lugar', desc: 'Busca, compara y contacta profesionales de todos los rubros desde una misma plataforma.' },
  { icon: Clock, title: 'Rapido y simple', desc: 'Encontra al profesional que necesitas en minutos, sin vueltas ni comisiones.' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredPros, setFeaturedPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
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

      {/* HERO PREMIUM */}
      <section className="relative flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover opacity-20" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-10">
          {/* MOBILE LAYOUT */}
          <div className="block lg:hidden space-y-2.5">
            {!alreadyInstalled && (
              <div className="space-y-2">
                {device === 'android' && (
                  <a href={APK_URL} download
                    className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-all shadow-lg shadow-primary-500/30"
                  ><Download size={20} /> Descargar APK — Gratis</a>
                )}
                {device === 'ios' && (
                  <div onClick={() => window.dispatchEvent(new CustomEvent('open-ios-guide'))}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 cursor-pointer"
                  ><Plus size={20} /> Agregar a pantalla de inicio</div>
                )}

                <div className="flex gap-2">
                  <Link to="/register"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-500 text-white font-bold text-xs rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
                  ><UserPlus size={15} /> Crear cuenta gratis</Link>
                  <Link to="/search"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 text-white font-semibold text-xs rounded-xl hover:bg-white/20 transition-all border border-gray-700 backdrop-blur-sm"
                  ><Search size={15} /> Explorar servicios</Link>
                </div>
              </div>
            )}
            {alreadyInstalled && (
              <div className="flex gap-2">
                <Link to="/register"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-500 text-white font-bold text-xs rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
                ><UserPlus size={15} /> Crear cuenta gratis</Link>
                <Link to="/search"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 text-white font-semibold text-xs rounded-xl hover:bg-white/20 transition-all border border-gray-700 backdrop-blur-sm"
                ><Search size={15} /> Explorar servicios</Link>
              </div>
            )}

            <div className="text-center">
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                El profesional que necesitas<br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">esta mas cerca</span>
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Conectamos clientes con profesionales verificados en toda Argentina.</p>
            </div>

            <form onSubmit={handleSearch}>
              <div className="relative flex bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Plomero, Electricista, Medico..."
                  className="w-full pl-9 pr-2 py-2 bg-transparent text-white placeholder-gray-600 focus:outline-none text-xs"
                />
                <button type="submit" className="px-3 py-2 bg-primary-500 text-white font-bold text-[11px] hover:bg-primary-600 transition-all flex items-center gap-1">
                  Buscar
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-1 justify-center">
              {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista'].map(cat => (
                <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-lg text-[10px] text-gray-300 hover:text-white transition-all"
                >{cat}</Link>
              ))}
            </div>
            <Link to="/search?disponibilidad=24-7"
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 border border-red-500/30 hover:border-red-500/50 rounded-xl text-[11px] text-red-400 hover:text-red-300 transition-all"
            ><AlertTriangle size={12} /> 24-7 — Profesionales disponibles todo el dia <ArrowRight size={12} /></Link>
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:flex lg:flex-row items-center gap-8">
            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3.5 py-1 text-xs text-gray-300 mb-4">
                <Shield size={12} className="text-primary-400" />
                <span>Marketplace de confianza en Argentina</span>
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-3">
                El profesional que necesitas<br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">esta mas cerca de lo que crees</span>
              </h1>
              <p className="text-base text-gray-400 mb-4 max-w-xl leading-relaxed">
                Conectamos clientes con profesionales verificados en toda Argentina.
              </p>
              <div className="flex gap-3 mb-4">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
                ><UserPlus size={16} /> Crear cuenta gratis</Link>
                <Link to="/search"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition-all border border-gray-700 backdrop-blur-sm"
                ><Search size={16} /> Explorar servicios</Link>
              </div>
              <form onSubmit={handleSearch} className="max-w-xl">
                <div className="relative flex bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20 transition-all shadow-xl shadow-black/20">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Busca un servicio: Plomero, Electricista, Medico..."
                    className="w-full pl-10 pr-4 py-3.5 bg-transparent text-white placeholder-gray-600 focus:outline-none text-sm"
                  />
                  <button type="submit" className="px-6 py-3.5 bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-2 text-sm">
                    <span>Buscar</span> <Search size={16} />
                  </button>
                </div>
              </form>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista'].map(cat => (
                  <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-xl text-[11px] text-gray-300 hover:text-white transition-all"
                  >{cat}</Link>
                ))}
              </div>
              <Link to="/search?disponibilidad=24-7"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 border border-red-500/30 hover:border-red-500/50 rounded-xl text-xs text-red-400 hover:text-red-300 transition-all"
              ><AlertTriangle size={14} /> 24-7 — Profesionales disponibles todo el dia <ArrowRight size={14} /></Link>
            </div>
            {!alreadyInstalled && (
              <div className="shrink-0 flex flex-col items-center gap-3">
                <PhoneMockup />
                <div className="flex items-stretch gap-2">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2 shrink-0 flex items-center">
                    <QRCodeCanvas value={SITE_URL} size={60} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    {device === 'android' && (
                      <a href={APK_URL} download
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Download size={18} /> Descargar APK</a>
                    )}
                    {device === 'ios' && (
                      <button onClick={() => window.dispatchEvent(new CustomEvent('open-ios-guide'))}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Plus size={18} /> Instalar en iPhone</button>
                    )}
                    {device === 'desktop' && (
                      <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
                      ><Download size={18} /> Ir a la App</a>
                    )}
                    <p className="text-[10px] text-gray-500 text-center">{device === 'android' ? `v${APK_VERSION} · Gratis` : 'Gratis · Sin registro'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-24 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* FEATURED PROS CAROUSEL */}
      {featuredPros.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-20 relative z-20 mb-6 md:mb-20">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/80 rounded-2xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {visiblePros.map((pro) => (
                <Link key={pro._id} to={`/service/${pro._id}`}
                  className="group relative flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="relative shrink-0">
                    <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=0f7a5a&color=fff&bold=true`}
                      alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-20">
        <div className="text-center mb-6 md:mb-10">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Rubros</span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-1">Categorias</h2>
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

      {/* BELLEZA Y CUIDADO BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-20">
        <Link to="/categoria/belleza-y-cuidado"
          className="group relative block overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="aspect-[21/9] md:aspect-[3/1] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80"
              alt="Belleza y Cuidado Personal"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          <div className="absolute inset-0 p-6 md:p-10 lg:p-14 flex flex-col justify-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={20} className="text-pink-300" />
                <span className="text-pink-300 text-xs font-bold uppercase tracking-widest">Nueva Categoria</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
                Belleza y <span className="text-pink-300">Cuidado Personal</span>
              </h2>
              <p className="text-sm md:text-base text-white/60 mb-4 md:mb-6 max-w-md leading-relaxed">
                Encontra los mejores profesionales de estetica, peluqueria, masajes y cuidado personal cerca de tu zona.
              </p>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/25 text-sm">
                Ver profesionales <ArrowRight size={16} />
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 p-4 md:p-6 hidden sm:block">
            <div className="flex flex-wrap justify-end gap-1.5 max-w-md">
              {['Peluqueria', 'Manicuria', 'Unas', 'Masajista', 'Cosmetologia', 'Barbero', 'Maquilladora', 'Depilacion'].map((sub) => (
                <span key={sub}
                  className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-md text-white/80 text-[11px] font-medium border border-white/10"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </section>

      {/* MAP + ADS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-20">
        <div className="mb-6">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Ubicacion</span>
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mt-1">Profesionales cerca de tu zona</h2>
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

      {/* BENEFITS COMPACT */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Por que elegir MiProfesional</h2>
            <p className="text-gray-500 mt-1 max-w-xl mx-auto text-xs md:text-sm">La forma mas simple de conectar con profesionales verificados</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 text-center hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                    <Icon size={18} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs mb-1">{b.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IOS BLOCK */}
      {device === 'ios' && (
        <section className="bg-gray-50 py-10 md:py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Smartphone size={24} className="text-primary-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-gray-900 font-bold text-sm">Usa MiProfesional desde tu iPhone</p>
                <p className="text-gray-500 text-xs mt-1">Safari <span className="text-gray-300 mx-1">→</span> Compartir <span className="text-gray-300 mx-1">→</span> Agregar a pantalla de inicio</p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-ios-guide'))}
                className="shrink-0 px-5 py-2.5 bg-primary-500 text-white font-bold text-sm rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 ml-auto">
                Como hacerlo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* PRICING */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Planes para profesionales</h2>
            <p className="text-gray-500 mt-1 text-xs md:text-sm">Publica tu perfil y conecta con clientes</p>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 md:p-6 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full mb-2">
                30 días gratis
              </span>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Plan Mensual</p>
              <p className="text-3xl md:text-4xl font-black text-gray-900 mb-1">$5.000</p>
              <p className="text-[11px] text-gray-400 mb-1 line-through">$5.000</p>
              <p className="text-[11px] text-gray-500 mb-3">por mes · Recurrencia automatica · Cancelas cuando quieras</p>
              <Link to="/subscription" className="block w-full px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-all shadow-sm">
                Activar suscripcion
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
