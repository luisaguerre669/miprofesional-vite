import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { isNativeAndroid } from '../utils/platform';
import { getAccurateLocation } from '../utils/geolocation';
import MapRenderFix from '../components/map/MapRenderFix';
import {
  Search, ArrowRight, Star, MapPin, Sparkles,
  ChevronLeft, ChevronRight, Shield, Clock,
  UserPlus, Plus, AlertTriangle, Building2,
  Briefcase, Crown, User, CheckCircle, Store
} from 'lucide-react';
import AdBanner from '../components/ads/AdBanner';
import NegociosDestacados from '../components/ads/NegociosDestacados';
import MainBanner from '../components/MainBanner';
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

const colorClasses = {
  pink: { tag: 'text-pink-300', bg: 'bg-pink-500', hover: 'hover:bg-pink-600', shadow: 'shadow-pink-500/25' },
  blue: { tag: 'text-blue-300', bg: 'bg-blue-500', hover: 'hover:bg-blue-600', shadow: 'shadow-blue-500/25' },
  emerald: { tag: 'text-emerald-300', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', shadow: 'shadow-emerald-500/25' },
  purple: { tag: 'text-purple-300', bg: 'bg-purple-500', hover: 'hover:bg-purple-600', shadow: 'shadow-purple-500/25' },
  amber: { tag: 'text-amber-300', bg: 'bg-amber-500', hover: 'hover:bg-amber-600', shadow: 'shadow-amber-500/25' },
  orange: { tag: 'text-orange-300', bg: 'bg-orange-500', hover: 'hover:bg-orange-600', shadow: 'shadow-orange-500/25' },
};

const promoSlides = [
  {
    id: 'comercio',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
    image2: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    tag: 'Nueva Categoria',
    title: 'Comercios y negocios ',
    titleAccent: 'de tu barrio',
    desc: 'Pizzerias, farmacias, veterinarias, opticas, panaderias y mas locales comerciales cerca tuyo. Todo lo que necesitas a pasos de tu casa.',
    link: '/categoria/comercio',
    color: 'orange',
    subcategories: ['Pizzerias', 'Farmacias', 'Veterinarias', 'Panaderias', 'Opticas', 'Cafeterias', 'Kioscos', 'Rotiserias', 'Confiterias', 'Floреrias'],
  },
  {
    id: 'belleza',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80',
    tag: 'Belleza',
    title: 'Belleza y ',
    titleAccent: 'Cuidado Personal',
    desc: 'Encontra los mejores profesionales de estetica, peluqueria, masajes y cuidado personal cerca de tu zona.',
    link: '/categoria/belleza-y-cuidado',
    color: 'pink',
    subcategories: ['Peluqueria', 'Manicuria', 'Unas', 'Masajista', 'Cosmetologia', 'Barbero', 'Maquilladora', 'Depilacion'],
  },
  {
    id: 'profesional',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
    tag: 'Para Profesionales',
    title: 'Publica tu perfil ',
    titleAccent: 'y crece',
    desc: 'Mostra tus servicios a miles de clientes potenciales. Empeza con 60 dias gratis para los primeros 700 suscriptores.',
    link: '/register?role=professional',
    color: 'emerald',
  },
  {
    id: 'salud',
    image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=1200&q=80',
    tag: 'Cuidado de tu Salud',
    title: 'Medicos y ',
    titleAccent: 'especialistas',
    desc: 'Encontra medicos, psicologos, kinesiologos y profesionales de la salud a domicilio o consulta.',
    link: '/categoria/salud',
    color: 'purple',
  },
  {
    id: 'hogar',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80',
    tag: 'Servicios para tu Hogar',
    title: 'Reparaciones y ',
    titleAccent: 'mantenimiento',
    desc: 'Plomeros, electricistas, pintores y mas profesionales para cuidar tu hogar.',
    link: '/categoria/servicios-generales',
    color: 'amber',
  },
];

const benefits = [
  { icon: MapPin, title: 'Profesionales cerca tuyo', desc: 'Filtra por ubicacion y conecta con profesionales verificados en tu zona.' },
  { icon: Search, title: 'Todo en un solo lugar', desc: 'Busca, compara y contacta profesionales de todos los rubros desde una misma plataforma.' },
  { icon: Clock, title: 'Rapido y simple', desc: 'Encontra al profesional que necesitas en minutos, sin vueltas ni comisiones.' },
];


function ProfessionalsImage() {
  return (
    <div className="relative mx-auto w-[180px] sm:w-[220px] lg:w-[300px]">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/40 border border-gray-800">
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80"
          alt="Profesionales y clientes colaborando"
          className="w-full h-full object-cover aspect-[4/3]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">MP</div>
            </div>
            <span className="text-white text-xs font-semibold">+1,000 profesionales</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TEAM_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80';

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
  const promoSlidesForPlatform = promoSlides;
  const activePromoIndex = promoSlidesForPlatform.length ? carouselIndex % promoSlidesForPlatform.length : 0;

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [urgentPros, setUrgentPros] = useState([]);
  const [urgentProsLoading, setUrgentProsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/professionals?featured=true&limit=8')
      .then(r => setFeaturedPros(r.data.data || []))
      .catch(e => console.error('Error al cargar destacados:', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/professionals', { params: { disponibilidad: '24-7', limit: 6 } })
      .then(r => setUrgentPros(r.data.data || []))
      .catch(e => console.error('Error al cargar profesionales 24-7:', e))
      .finally(() => setUrgentProsLoading(false));
  }, []);

  useEffect(() => {
    api.get('/categories/tree')
      .then(r => {
        const data = r.data.data || [];

        // Fallback estático para Comercio si aún no está en la BD
        const hasComercio = data.some(c => c.slug === 'comercio');
        if (!hasComercio) {
          data.unshift({
            _id: 'comercio-static',
            title: 'Comercio',
            slug: 'comercio',
            description: 'Pizzerias, farmacias, panaderias, veterinarias, opticas y mas locales comerciales',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
            icon: 'Store',
            metadata: { color: '#f59e0b', featured: true },
            sortOrder: 0,
            subcategories: [
              { name: 'Pizzerias', slug: 'pizzerias' },
              { name: 'Farmacias', slug: 'farmacias' },
              { name: 'Panaderias', slug: 'panaderias' },
              { name: 'Veterinarias', slug: 'veterinarias' },
              { name: 'Opticas', slug: 'opticas' },
              { name: 'Cafeterias', slug: 'cafeterias' },
              { name: 'Kioscos', slug: 'kioscos' },
              { name: 'Rotiserias', slug: 'rotiserias' },
              { name: 'Floреrias', slug: 'florerias' },
              { name: 'Confiterias', slug: 'confiterias' },
            ],
          });
        }

        // Fallback estático para Belleza si no está en la BD
        const hasBelleza = data.some(c => c.slug === 'belleza-y-cuidado');
        if (!hasBelleza) {
          data.push({
            _id: 'belleza-static',
            title: 'Belleza y Cuidado',
            slug: 'belleza-y-cuidado',
            description: 'Peluqueria, manicuria, masajes y cuidado personal',
            image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
            icon: 'Sparkles',
            metadata: { color: '#ec4899' },
            sortOrder: 15,
            subcategories: [
              { name: 'Peluqueria', slug: 'peluqueria' },
              { name: 'Manicuria', slug: 'manicuria' },
              { name: 'Unas', slug: 'unas' },
              { name: 'Masajista', slug: 'masajista' },
              { name: 'Cosmetologia', slug: 'cosmetologia' },
              { name: 'Barbero', slug: 'barbero' },
              { name: 'Maquilladora', slug: 'maquilladora' },
              { name: 'Depilacion', slug: 'depilacion' },
            ],
          });
        }

        setCategories(data);
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(i => (i + 1) % promoSlidesForPlatform.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promoSlidesForPlatform.length]);

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

  const saveAddressToProfile = useCallback(async () => {
    if (!user || !addressForm.city) return;
    try {
      await api.put('/users/profile', {
        address: {
          street: addressForm.street,
          number: addressForm.number,
          neighborhood: addressForm.neighborhood,
          city: addressForm.city,
          state: addressForm.province,
          country: 'Argentina'
        }
      });
    } catch { /* non-critical */ }
  }, [user, addressForm]);

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

  // Use stored address if logged in, otherwise show address input
  useEffect(() => {
    const coords = user?.coordinates?.coordinates;
    const hasCoords = coords && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);
    if (hasCoords) {
      setUserLocation({ lat: coords[1], lng: coords[0] });
      setLocationMode('city');
      const addr = user.address || {};
      if (addr.street || addr.city) {
        setUserAddress([addr.street, addr.number].filter(Boolean).join(' ') + (addr.city ? `, ${addr.city}` : ''));
      }
      setShowCityInput(false);
    } else {
      setShowCityInput(true);
      setShowFullAddress(true);
    }
  }, [user?.id]);

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
          <MapRenderFix />
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup><div className="text-center"><p className="font-semibold text-sm">Tu ubicacion</p><p className="text-xs text-gray-500">{userAddress || 'Estas aqui'}</p></div></Popup>
          </Marker>
          {featuredPros.slice(0, 5).map((pro) => {
            const raw = pro.location?.coordinates?.coordinates || pro.location?.coordinates;
            return raw && raw.length === 2 ? (
              <Marker key={pro._id} position={[raw[1], raw[0]]} icon={customIcon}>
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
            ) : null;
          })}
        </MapContainer>
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-col items-center gap-1.5">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3 text-sm">
            <MapPin size={14} className="text-primary-500 shrink-0" />
            <span className="text-gray-600 text-xs truncate max-w-[140px]">{userAddress || 'Profesionales cerca de tu ubicacion'}</span>
            {locationMode === 'gps' && <span className="text-[10px] text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded font-medium">GPS</span>}
            {locationMode === 'city' && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Ciudad</span>}
            <button onClick={() => { setShowCityInput(true); setShowFullAddress(true); }} className="text-xs text-gray-400 hover:text-gray-600 underline ml-auto">cambiar</button>
          </div>
          {user && locationMode === 'city' && (
            <button onClick={saveAddressToProfile}
              className="text-[11px] bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg shadow-lg transition-all flex items-center gap-1.5">
              <MapPin size={12} /> Guardar direccion en mi perfil
            </button>
          )}
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
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Link to="/register"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-500 text-white font-bold text-xs rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25"
                  ><UserPlus size={15} /> Crear cuenta gratis</Link>
                  <Link to="/search"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-white/10 text-white font-semibold text-xs rounded-xl hover:bg-white/20 transition-all border border-gray-700 backdrop-blur-sm"
                  ><Search size={15} /> Explorar servicios</Link>
                </div>
              </div>

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
              {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista', 'Pizzeria', 'Farmacia'].map(cat => (
                <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-lg text-[10px] text-gray-300 hover:text-white transition-all"
                >{cat}</Link>
              ))}
            </div>
            <Link to="/categoria/servicios-24-7"
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
                {['Albanil', 'Plomero', 'Electricista', 'Medico', 'Cerrajero', 'Gasista', 'Pizzeria', 'Farmacia', 'Veterinaria', 'Panaderia'].map(cat => (
                  <Link key={cat} to={`/search?q=${encodeURIComponent(cat)}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-500/30 rounded-xl text-[11px] text-gray-300 hover:text-white transition-all"
                  >{cat}</Link>
                ))}
              </div>
              <Link to="/categoria/servicios-24-7"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 hover:from-red-600/30 hover:to-orange-600/30 border border-red-500/30 hover:border-red-500/50 rounded-xl text-xs text-red-400 hover:text-red-300 transition-all"
              ><AlertTriangle size={14} /> 24-7 — Profesionales disponibles todo el dia <ArrowRight size={14} /></Link>
            </div>
            <div className="shrink-0">
              <ProfessionalsImage />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-24 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Urgent Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8 mb-4">
        <Link to="/categoria/servicios-24-7"
          className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all group"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzR2LTJIMjR2MmgxMnpNMzYgMjh2LTJIMjR2MmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="relative px-5 md:px-8 py-5 md:py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <AlertTriangle size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg md:text-xl leading-tight">¿Necesitas ayuda ahora?</h2>
                <p className="text-white/80 text-sm mt-1">Encontra profesionales disponibles las 24 horas, los 7 dias de la semana.</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 font-bold text-sm rounded-xl hover:bg-red-50 transition-all shadow-lg group-hover:translate-x-0.5 transition-transform">
              Ver Servicios 24/7 <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      </section>

      {/* COMERCIO BANNER PRINCIPAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Link to="/categoria/comercio"
          className="block relative overflow-hidden rounded-2xl group shadow-xl hover:shadow-2xl transition-all duration-500"
          style={{ minHeight: '220px' }}
        >
          {/* Imagen de fondo principal — pizzería / comercio real */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=85"
              alt="Comercios de barrio — pizzerías, farmacias, panaderías"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
            {/* Gradient overlay premium */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-amber-900/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Grid de fotos secundarias — esquina derecha */}
          <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden opacity-80 group-hover:opacity-90 transition-opacity">
            <img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=75" alt="Pizzería" className="w-full h-full object-cover" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&q=75" alt="Farmacia" className="w-full h-full object-cover" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75" alt="Cafetería" className="w-full h-full object-cover" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&q=75" alt="Veterinaria" className="w-full h-full object-cover" loading="lazy" />
          </div>
          {/* Overlay sobre grid de fotos */}
          <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-transparent via-amber-950/30 to-transparent pointer-events-none" />

          {/* Contenido principal */}
          <div className="relative z-10 px-6 md:px-10 py-8 md:py-10 flex flex-col justify-between h-full min-h-[220px] md:max-w-[55%]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                  <Store size={16} className="text-white" />
                </div>
                <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">Nueva Categoría</span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">
                Comercios y negocios<br />
                <span className="text-amber-300">de tu barrio</span>
              </h2>
              <p className="text-white/70 text-sm md:text-base mb-5 max-w-md leading-relaxed">
                Pizzerías, farmacias, veterinarias, ópticas, panaderías y más de 30 categorías de locales comerciales cerca tuyo.
              </p>
            </div>

            {/* Chips de subcategorías */}
            <div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['Pizzerías', 'Farmacias', 'Veterinarias', 'Panaderías', 'Ópticas', 'Cafeterías', 'Kioscos', 'Rotiserías', 'Florerías', 'Confiterías', 'Heladerías', 'Ferreterías'].map(sub => (
                  <span key={sub} className="px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg text-white/80 text-[11px] font-medium hover:bg-white/20 transition-colors">
                    {sub}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 text-sm group-hover:translate-x-0.5 transition-transform">
                Explorar Comercios <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* 4 ENTRY POINTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 md:-mt-12 relative z-30 mb-6 md:mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cliente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <User size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cliente</h3>
            <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mb-3">
              <Crown size={12} /> Gratis
            </div>
            <p className="text-xs text-gray-500 mb-4">Publicá búsquedas y encontrá profesionales sin costo.</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-4 text-left">
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Buscar profesionales cerca tuyo</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Comparar servicios y presupuestos</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Subir tu CV para ser encontrado</li>
            </ul>
            <Link to="/register"
              className="block w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
            >Crear cuenta gratis</Link>
          </div>

          {/* Profesional */}
          <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-md p-5 md:p-6 hover:shadow-lg transition-all text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full">
              MÁS ELEGIDO
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Briefcase size={24} className="text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Profesional</h3>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">$5.000</span>
              <span className="text-xs text-gray-400">/mes</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-3">60 días gratis para los primeros 700 suscriptores.</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-4 text-left">
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Perfil visible en el marketplace</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Recibir solicitudes de clientes</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> CV premium destacado</li>
            </ul>
            <Link to="/register?role=professional"
              className="block w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all"
            >Empezar 60 días gratis</Link>
          </div>

          {/* Comercio */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-md p-5 md:p-6 hover:shadow-lg transition-all text-center relative">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Store size={24} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Comercio</h3>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">$10.000</span>
              <span className="text-xs text-gray-400">/mes</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-3">60 días gratis para los primeros 700 suscriptores.</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-4 text-left">
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Perfil en sección Comercios</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Subcategoría específica</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Horarios personalizados</li>
            </ul>
            <Link to="/register?role=professional"
              className="block w-full py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-all"
            >Empezar 60 días gratis</Link>
          </div>

          {/* Empresa */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 hover:shadow-md transition-all text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Building2 size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Empresa</h3>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">$20.000</span>
              <span className="text-xs text-gray-400">/mes</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-3">60 días gratis para los primeros 700 suscriptores.</p>
            <ul className="text-sm text-gray-600 space-y-2 mb-4 text-left">
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Búsqueda avanzada de CVs</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Acceso a profesionales del marketplace</li>
              <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" /> Contacto directo sin comisiones</li>
            </ul>
            <Link to="/register?role=company"
              className="block w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all"
            >Crear cuenta empresa</Link>
          </div>
        </div>
      </section>

      {/* CV CTA Banner (web only) */}
      {!isNativeAndroid() && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
          <div className="bg-gradient-to-r from-primary-600 to-emerald-500 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between shadow-lg">
            <div className="text-white">
              <h3 className="text-lg font-bold">Dejá tu currículum y encontrá trabajo más rápido</h3>
              <p className="text-sm opacity-90 mt-1">Completá tu CV para que empleadores te encuentren fácilmente.</p>
            </div>
            <div>
              <Link to={user ? '/cv' : '/register'} className="inline-flex items-center gap-2 px-5 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:opacity-95 transition-all">
                {user ? 'Cargar CV' : 'Registrate y cargalo'}
              </Link>
            </div>
          </div>
        </section>
      )}

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

      {/* URGENCIAS / DISPONIBLE AHORA */}
      {!urgentProsLoading && urgentPros.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-5 md:p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Urgencias / Disponible Ahora</h2>
                  <p className="text-white/80 text-xs">Profesionales con disponibilidad 24/7 para emergencias</p>
                </div>
              </div>
              <Link to="/categoria/servicios-24-7" className="shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all">
                Ver todos
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {urgentPros.slice(0, 6).map((pro) => (
                <Link key={pro._id} to={`/service/${pro._id}`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center transition-all group"
                >
                  <img src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.businessName || pro.profession)}&background=dc2626&color=fff`}
                    alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover ring-2 ring-white/30 group-hover:ring-white/50 transition-all" />
                  <p className="text-white text-xs font-semibold truncate">{pro.businessName || pro.profession}</p>
                  <p className="text-white/60 text-[10px] truncate">{pro.profession}</p>
                  {pro.available24h && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 text-white text-[9px] font-bold rounded">24/7</span>
                  )}
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

      <NegociosDestacados />

      <MainBanner />

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



      {/* GENERAL PROMO BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-6 md:p-8 text-center shadow-xl shadow-amber-500/20">
          <span className="inline-block px-3 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
            Promoción de lanzamiento
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white mb-2">
            Los primeros 700 Profesionales, Comercios y Empresas que se registren obtendrán 60 días de suscripción totalmente gratis.
          </h3>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition-all shadow-lg mt-4"
          >
            Registrarme ahora <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Elegí el plan ideal para vos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <User size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Cliente</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Gratis</p>
              <p className="text-3xl font-black text-gray-900 mb-1">$0</p>
              <p className="text-[11px] text-gray-500 mb-4">Publicá búsquedas y encontrá profesionales sin costo.</p>
              <ul className="text-xs text-gray-600 space-y-2 mb-5 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Buscar profesionales</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Buscar comercios</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Subir currículum</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Contacto directo</li>
              </ul>
              <Link to="/register" className="block w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all">Crear cuenta</Link>
            </div>
            <div className="bg-white rounded-2xl border-2 border-primary-200 p-5 md:p-6 text-center relative">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full mb-2">60 días gratis para los primeros 700 suscriptores</span>
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Briefcase size={20} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900">Profesional</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">$5.000 por mes</p>
              <p className="text-3xl font-black text-gray-900 mb-1">$5.000</p>
              <p className="text-[11px] text-gray-500 mb-4">60 días gratis para los primeros 700 suscriptores.</p>
              <ul className="text-xs text-gray-600 space-y-2 mb-5 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Perfil en marketplace</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> CV premium destacado</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Estadísticas de perfil</li>
              </ul>
              <Link to="/register?role=professional" className="block w-full py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-all">Empezar 60 días gratis</Link>
            </div>
            <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 md:p-6 text-center relative">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full mb-2">60 días gratis para los primeros 700 suscriptores</span>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Store size={20} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900">Comercio</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">$10.000 por mes</p>
              <p className="text-3xl font-black text-gray-900 mb-1">$10.000</p>
              <p className="text-[11px] text-gray-500 mb-4">60 días gratis para los primeros 700 suscriptores.</p>
              <ul className="text-xs text-gray-600 space-y-2 mb-5 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Perfil en sección Comercios</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Subcategoría específica</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Galería de productos</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Horarios personalizados</li>
              </ul>
              <Link to="/register?role=professional" className="block w-full py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all">Empezar 60 días gratis</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 text-center">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 size={20} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Empresa</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">$20.000 por mes</p>
              <p className="text-3xl font-black text-gray-900 mb-1">$20.000</p>
              <p className="text-[11px] text-gray-500 mb-4">60 días gratis para los primeros 700 suscriptores.</p>
              <ul className="text-xs text-gray-600 space-y-2 mb-5 text-left">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Búsqueda avanzada de CVs</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Contacto ilimitado</li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> Panel de administración</li>
              </ul>
              <Link to="/register?role=company" className="block w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-all">Crear cuenta empresa</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
