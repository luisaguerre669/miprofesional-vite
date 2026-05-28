import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import {
  Search as SearchIcon, Star, MapPin, SlidersHorizontal, X,
  BadgeCheck, ChevronRight, Briefcase, Navigation, AlertTriangle
} from 'lucide-react';
import MapView from '../components/MapView';
import { getAccurateLocation } from '../utils/geolocation';
const PROVINCES = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman'
];

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

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [professionals, setProfessionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [disponibilidad247, setDisponibilidad247] = useState(searchParams.get('disponibilidad') === '24-7');
  const [geoError, setGeoError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', number: '', city: '', province: '' });
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    subcategory: '',
    minRating: 0,
    maxPrice: '',
    verified: false,
    featured: false,
    sortBy: '',
    location: '',
  });

  useEffect(() => {
    api.get('/categories?limit=50').then(r => setCategories(r.data.data || [])).catch(e => console.error('Error al cargar categorías:', e));
    
    getAccurateLocation().then(res => {
      if (!res.error && res.lat && res.lng) {
        setUserLocation({ lat: res.lat, lng: res.lng });
      } else {
        setGeoError('No pudimos obtener tu ubicación automática. Ingresá tu dirección manualmente para buscar profesionales cerca tuyo.');
      }
    }).catch(() => {
      setGeoError('No pudimos obtener tu ubicación automática. Ingresá tu dirección manualmente para buscar profesionales cerca tuyo.');
    });

    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const disp247 = searchParams.get('disponibilidad') === '24-7';
    if (q || cat || disp247) {
      if (q) setQuery(q);
      if (cat) setFilters(f => ({ ...f, category: cat }));
      searchProfessionals(q || '', { ...filters, category: cat || filters.category }, disp247);
    } else {
      fetchProfessionals();
    }
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (disponibilidad247) params.disponibilidad = '24-7';
      const response = await api.get('/professionals', { params });
      setProfessionals(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProfessionals = async (q, filterOpts, disp247) => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (filterOpts.category) params.categoryId = filterOpts.category;
      if (filterOpts.subcategory) params.subcategoryId = filterOpts.subcategory;
      if (filterOpts.minRating > 0) params.minRating = filterOpts.minRating;
      if (filterOpts.maxPrice) params.maxPrice = filterOpts.maxPrice;
      if (filterOpts.verified) params.isVerified = true;
      if (filterOpts.featured) params.featured = true;
      if (filterOpts.sortBy) params.sortBy = filterOpts.sortBy;
      if (disp247 || disponibilidad247) params.disponibilidad = '24-7';
      params.limit = 20;

      // Geocodificar siempre, asegurando coordenadas reales
      if (filterOpts.location && filterOpts.location.trim()) {
        const geoRes = await api.get('/professionals/geocode', { params: { city: filterOpts.location, country: 'Argentina' } });
        if (geoRes.data?.success && geoRes.data?.data) {
          params.location = JSON.stringify({ 
            latitude: geoRes.data.data.latitude, 
            longitude: geoRes.data.data.longitude 
          });
        }
      } else if (userLocation) {
        params.location = JSON.stringify({ 
          latitude: userLocation.lat, 
          longitude: userLocation.lng 
        });
      }

      const response = await api.get('/professionals/search', { params: { q, ...params } });
      setProfessionals(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const p = {};
    if (query.trim()) p.q = query;
    if (disponibilidad247) p.disponibilidad = '24-7';
    setSearchParams(p);
    searchProfessionals(query, filters);
  };

  const clear247 = () => {
    setDisponibilidad247(false);
    const p = {};
    if (query.trim()) p.q = query;
    if (filters.category) p.category = filters.category;
    setSearchParams(p);
    searchProfessionals(query, filters, false);
  };

  const applyFilters = () => searchProfessionals(query, filters, disponibilidad247);

  const selectedCategory = categories.find(c => c._id === filters.category);
  const subcategories = selectedCategory?.subcategories || [];

  const mapProfessionals = professionals.filter(
    p => p.location?.coordinates?.lat && p.location?.coordinates?.lng
  );

  return (
    <>
    <Helmet>
      <title>Buscar Profesionales — MiProfesional</title>
      <meta name="description" content="Encuentra profesionales verificados. Filtra por categoría, ubicación, rating y precio." />
    </Helmet>
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 24-7 Banner */}
      {disponibilidad247 && (
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-2xl p-4 md:p-5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">24-7 — Profesionales disponibles todo el dia</h3>
              <p className="text-white/80 text-xs">Servicios urgentes y atencion permanente</p>
            </div>
          </div>
          <button onClick={clear247}
            className="shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-all">
            Quitar filtro
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar profesionales, servicios, oficios..." autoFocus
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-base"
            />
          </div>
          <button type="submit" className="px-6 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg flex items-center gap-2">
            <SearchIcon size={18} />
            <span className="hidden md:inline">Buscar</span>
          </button>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
              showFilters ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden md:inline">Filtros</span>
          </button>
          {mapProfessionals.length > 0 && (
            <button type="button" onClick={() => setShowMap(!showMap)}
              className={`px-4 py-3.5 rounded-xl border-2 transition-all flex items-center gap-2 ${
                showMap ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Navigation size={18} />
              <span className="hidden md:inline">Mapa</span>
            </button>
          )}
        </form>

        {(filters.category || filters.minRating > 0 || filters.maxPrice || filters.verified || filters.featured) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm">
                {categories.find(c => c._id === filters.category)?.title}
                <button onClick={() => { setFilters({...filters, category: '', subcategory: ''}); applyFilters(); }}><X size={14} /></button>
              </span>
            )}
            {filters.minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                {filters.minRating}+ estrellas <button onClick={() => { setFilters({...filters, minRating: 0}); applyFilters(); }}><X size={14} /></button>
              </span>
            )}
            {filters.verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                Verificados <button onClick={() => { setFilters({...filters, verified: false}); applyFilters(); }}><X size={14} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría</label>
              <select value={filters.category} onChange={e => { setFilters({...filters, category: e.target.value, subcategory: ''}); }}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.title}</option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subcategoría</label>
                <select value={filters.subcategory} onChange={e => setFilters({...filters, subcategory: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Todas</option>
                  {subcategories.map(sc => (
                    <option key={sc._id || sc} value={sc._id || sc}>{sc.title || sc}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating mínimo</label>
              <select value={filters.minRating} onChange={e => setFilters({...filters, minRating: Number(e.target.value)})}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value={0}>Cualquiera</option>
                <option value={3}>3+ estrellas</option>
                <option value={4}>4+ estrellas</option>
                <option value={4.5}>4.5+ estrellas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio máximo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                  placeholder="0" className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ubicación</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}
                  placeholder="Ciudad..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ordenar por</label>
              <select value={filters.sortBy} onChange={e => setFilters({...filters, sortBy: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Relevancia</option>
                <option value="rating">Rating</option>
                <option value="price">Menor precio</option>
                <option value="-price">Mayor precio</option>
                <option value="createdAt">Más recientes</option>
              </select>
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.verified} onChange={e => setFilters({...filters, verified: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Verificados</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.featured} onChange={e => setFilters({...filters, featured: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Destacados</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Radio de busqueda</label>
              <div className="flex gap-1.5">
                {[5, 10, 20, 50].map(km => (
                  <button key={km} onClick={() => setSearchRadius(km)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      searchRadius === km ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >{km} km</button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button onClick={applyFilters} className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Fallback */}
      {geoError && !showAddressForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <MapPin size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-800">{geoError}</p>
            <button onClick={() => setShowAddressForm(true)}
              className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700 underline underline-offset-2"
            >Ingresar dirección manualmente</button>
          </div>
        </div>
      )}

      {showAddressForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Ingresá tu ubicación</h3>
            <button onClick={() => { setShowAddressForm(false); setGeoError(''); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" value={addressForm.street} onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
              placeholder="Calle" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input type="text" value={addressForm.number} onChange={e => setAddressForm(f => ({ ...f, number: e.target.value }))}
              placeholder="Altura" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input type="text" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
              placeholder="Ciudad" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select value={addressForm.province} onChange={e => setAddressForm(f => ({ ...f, province: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Provincia</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={async () => {
            if (!addressForm.city) return;
            try {
              const res = await api.get('/professionals/geocode', {
                params: {
                  address: [addressForm.street, addressForm.number].filter(Boolean).join(' '),
                  city: addressForm.city,
                  state: addressForm.province,
                  country: 'Argentina'
                }
              });
              if (res.data?.success && res.data?.data) {
                setUserLocation({ lat: res.data.data.latitude, lng: res.data.data.longitude });
                setFilters(f => ({ ...f, location: res.data.data.displayName || addressForm.city }));
                setShowAddressForm(false);
                setGeoError('');
              }
            } catch (e) {
              setGeoError('No encontramos esa dirección. Revisá los datos e intentá de nuevo.');
            }
          }}
            className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm"
          >Ubicar en el mapa</button>
        </div>
      )}

      {/* Map */}
      {showMap && mapProfessionals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-500">
              <MapPin size={13} className="inline mr-1 -mt-0.5" />
              {mapProfessionals.length} profesionales en {searchRadius} km a la redonda
            </span>
            <span className="text-[10px] text-gray-400">{searchRadius} km de radio</span>
          </div>
          <MapView professionals={mapProfessionals} height="400px" />
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Buscando...' : `${professionals.length} profesionales`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="skeleton h-44" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : professionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((pro, idx) => (
            <Link key={pro._id} to={`/service/${pro._id}`}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover-lift overflow-hidden"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="relative h-44 bg-gray-900 overflow-hidden">
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
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{pro.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>{pro.location?.city || 'CABA'}</span>
                  </div>
                  {pro.pricing?.hourlyRate > 0 && (
                    <span className="font-bold text-primary-600 text-sm">${pro.pricing.hourlyRate.toLocaleString()}/h</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchIcon size={56} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron resultados</h3>
          <p className="text-gray-500">Intenta con otros términos o filtros</p>
        </div>
      )}
    </div>
    </>
  );
};

export default Search;
