import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Navigation } from 'lucide-react';

// Fix for default markers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const verifiedIcon = new Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  className: 'verified-marker'
});

// Componente para centrar el mapa
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function ProfessionalsMap({ 
  professionals = [], 
  userLocation = null,
  selectedProfessional = null,
  onSelectProfessional = () => {},
  radius = 50 
}) {
  const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816]); // Buenos Aires default
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoadingLocation(false);
        }
      );
    }
  };

  // Actualizar centro cuando hay ubicación de usuario
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Filtrar profesionales con coordenadas válidas
  const professionalsWithCoords = useMemo(() => {
    return professionals.filter(pro => 
      pro.location?.coordinates?.coordinates?.[0] && 
      pro.location?.coordinates?.coordinates?.[1]
    );
  }, [professionals]);

  return (
    <div className="w-full h-[600px] relative">
      {/* Botón de ubicación */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button 
          onClick={getUserLocation}
          disabled={loadingLocation}
          className="bg-white text-black hover:bg-gray-100 shadow-lg"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {loadingLocation ? 'Ubicando...' : 'Mi ubicación'}
        </Button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter center={mapCenter} />

        {/* Círculo de radio de búsqueda */}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius * 1000}
            pathOptions={{ 
              fillColor: '#3b82f6', 
              fillOpacity: 0.1, 
              color: '#3b82f6',
              weight: 2 
            }}
          />
        )}

        {/* Marcador de ubicación del usuario */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={defaultIcon}
          >
            <Popup>Tu ubicación</Popup>
          </Marker>
        )}

        {/* Marcadores de profesionales */}
        {professionalsWithCoords.map((pro) => {
          const [lng, lat] = pro.location.coordinates.coordinates;
          const isSelected = selectedProfessional?._id === pro._id;
          const isVerified = pro.verification?.isVerified;

          return (
            <Marker
              key={pro._id}
              position={[lat, lng]}
              icon={isVerified ? verifiedIcon : defaultIcon}
              eventHandlers={{
                click: () => onSelectProfessional(pro)
              }}
            >
              <Popup>
                <Card className="w-64 border-0 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {pro.businessName || pro.profession}
                        </h3>
                        <p className="text-xs text-gray-500">{pro.profession}</p>
                        
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {pro.location?.neighborhood || pro.location?.city}
                          </span>
                        </div>

                        {pro.distance && (
                          <p className="text-xs text-blue-600 mt-1">
                            A {pro.distance} km de distancia
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          {isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{pro.stats?.rating || 0}</span>
                          </div>
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => onSelectProfessional(pro)}
                        >
                          Ver perfil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
