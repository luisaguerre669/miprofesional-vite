import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  MapPin, 
  Star, 
  Navigation, 
  Search, 
  Filter,
  Verified,
  Phone
} from 'lucide-react';
import ProfessionalsMap from './ProfessionalsMap';

const API = import.meta.env.VITE_API_URL;

export default function NearbyProfessionals() {
  const [professionals, setProfessionals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Buscar profesionales cercanos
  const searchNearby = async () => {
    if (!userLocation) {
      alert('Necesitamos tu ubicación para buscar profesionales cercanos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API}/api/professionals/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
      );
      const data = await response.json();
      
      if (data.ok) {
        setProfessionals(data.professionals);
      }
    } catch (error) {
      console.error('Error searching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar por ciudad
  const searchByCity = async () => {
    if (!city) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API}/api/professionals/by-city/${encodeURIComponent(city)}`
      );
      const data = await response.json();
      
      if (data.ok) {
        setProfessionals(data.professionals);
      }
    } catch (error) {
      console.error('Error searching by city:', error);
    } finally {
      setLoading(false);
    }
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
              <label className="text-sm font-medium">O buscar por ciudad</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Buenos Aires, Córdoba..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchByCity()}
                />
                <Button 
                  onClick={searchByCity}
                  disabled={loading || !city}
                  variant="outline"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Toggle map/list */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
            >
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
                  <Verified className="w-5 h-5 text-blue-500" />
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
