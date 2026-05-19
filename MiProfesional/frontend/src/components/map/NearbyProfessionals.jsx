import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Star, Navigation, Search, BadgeCheck, Phone, Crosshair } from 'lucide-react';
import ProfessionalsMap from './ProfessionalsMap';
import api from '@/lib/axios';

const PROVINCES = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucuman'
];

export default function NearbyProfessionals() {
  const [professionals, setProfessionals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [city, setCity] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [category, setCategory] = useState('');
  const [showMap, setShowMap] = useState(true);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationMode, setLocationMode] = useState(''); // 'gps' | 'city' | 'manual'

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS no disponible. Usa la busqueda por ciudad.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationMode('gps');
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError('No se pudo obtener ubicacion GPS. Busca por ciudad.');
        fetch('https://ipapi.co/json/')
          .then(r => r.json())
          .then(d => d && d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : null)
          .then(loc => { if (loc) { setUserLocation(loc); setGeoError(''); } })
          .catch(() => {});
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => { getLocation(); }, []);

  const searchNearby = async () => {
    if (!userLocation) return getLocation();
    setLoading(true);
    try {
      const res = await api.get('/professionals/nearby', {
        params: { latitude: userLocation.lat, longitude: userLocation.lng, maxDistance: radius, limit: 30 }
      });
      if (res.data?.success) setProfessionals(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const searchByCity = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      if (selectedProvince) {
        const geoRes = await api.get('/professionals/geocode', {
          params: { address: '', city: city.trim(), state: selectedProvince, country: 'Argentina' }
        });
        if (geoRes.data?.success && geoRes.data?.data) {
          setUserLocation({ lat: geoRes.data.data.latitude, lng: geoRes.data.data.longitude });
          setLocationMode('city');
          const nearbyRes = await api.get('/professionals/nearby', {
            params: { latitude: geoRes.data.data.latitude, longitude: geoRes.data.data.longitude, maxDistance: radius, limit: 30 }
          });
          if (nearbyRes.data?.success) setProfessionals(nearbyRes.data.data || []);
          return;
        }
      }
      const res = await api.get(`/professionals/by-city/${encodeURIComponent(city.trim())}`);
      if (res.data?.success) setProfessionals(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Profesionales cerca tuyo</h1>
        <p className="text-gray-600">
          Encuentra profesionales verificados en tu zona
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda por ubicación */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Buscar por ubicación actual</label>
              <div className="flex gap-2">
                <Button 
                  onClick={searchNearby}
                  disabled={loading || !userLocation}
                  className="flex-1"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {loading ? 'Buscando...' : 'Profesionales cercanos'}
                </Button>
              </div>
              
              {userLocation && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">
                    Radio de búsqueda: {radius} km
                  </label>
                  <Slider
                    value={[radius]}
                    onValueChange={([value]) => setRadius(value)}
                    min={1}
                    max={100}
                    step={1}
                  />
                </div>
              )}
            </div>

            {/* Búsqueda por ciudad */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Buscar por ciudad</label>
              <div className="flex gap-2">
                <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 max-w-[130px]">
                  <option value="">Provincia</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Input
                  placeholder="Ciudad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchByCity()}
                  className="flex-1"
                />
                <Button onClick={searchByCity} disabled={loading || !city} variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Location mode + error */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {locationMode === 'gps' && <Badge variant="outline" className="text-[11px] text-primary-600 border-primary-200 bg-primary-50"><Navigation className="w-3 h-3 mr-1" />GPS</Badge>}
              {locationMode === 'city' && <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-200 bg-amber-50"><MapPin className="w-3 h-3 mr-1" />Ciudad</Badge>}
              {geoError && !userLocation && <span className="text-xs text-red-500">{geoError}</span>}
            </div>
            <Button variant="outline" onClick={() => setShowMap(!showMap)}>
              {showMap ? 'Ver lista' : 'Ver mapa'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      {showMap && (
        <ProfessionalsMap
          professionals={professionals}
          userLocation={userLocation}
          selectedProfessional={selectedProfessional}
          onSelectProfessional={setSelectedProfessional}
          radius={radius}
        />
      )}

      {/* Lista de resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((pro) => (
          <Card 
            key={pro._id}
            className={`cursor-pointer transition-all ${
              selectedProfessional?._id === pro._id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedProfessional(pro)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{pro.businessName || pro.profession}</h3>
                  <p className="text-sm text-gray-500">{pro.profession}</p>
                </div>
                {pro.verification?.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{pro.location?.neighborhood || pro.location?.city}</span>
              </div>

              {pro.distance && (
                <Badge variant="secondary">
                  A {pro.distance} km de distancia
                </Badge>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{pro.stats?.rating || 0}</span>
                  <span className="text-gray-500">({pro.stats?.reviewCount || 0})</span>
                </div>
                <span className="font-semibold text-green-600">
                  ${pro.pricing?.hourlyRate || 0}/hora
                </span>
              </div>

              <Button className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Contactar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {professionals.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron profesionales en esta zona</p>
          <p className="text-sm">Intenta ampliar el radio de búsqueda o buscar otra ciudad</p>
        </div>
      )}
    </div>
  );
}
