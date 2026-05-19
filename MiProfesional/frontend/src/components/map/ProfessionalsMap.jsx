import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Navigation, Layers, Award, Zap, Crosshair } from 'lucide-react';
import api from '@/lib/axios';
import { getAccurateLocation } from '@/utils/geolocation';

function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C9.716 0 3 6.716 3 15c0 11.25 15 29 15 29s15-17.75 15-29C33 6.716 26.284 0 18 0z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="18" cy="15" r="7" fill="white"/></svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44]
  });
}

const NEARBY_ICON = makeIcon('#ef4444');
const RECOMMENDED_ICON = makeIcon('#22c55e');
const ACTIVE_ICON = makeIcon('#3b82f6');
const USER_ICON = L.divIcon({
  html: '<div style="background:#0f7a5a;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Recomendados', desc: 'Mejor rating, verificados, perfil completo' },
  { color: '#3b82f6', label: 'Activos', desc: 'Actividad en las ultimas 48 horas' },
  { color: '#ef4444', label: 'Cercanos', desc: 'Ordenados por distancia' }
];

export default function ProfessionalsMap({
  professionals = [],
  userLocation = null,
  selectedProfessional = null,
  onSelectProfessional = () => {},
  radius = 50
}) {
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [grouped, setGrouped] = useState({ recommended: [], active: [], nearby: [] });
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [mapCenter, setMapCenter] = useState(userLocation
    ? [userLocation.lat, userLocation.lng]
    : [-34.6037, -58.3816]);

  useEffect(() => {
    if (userLocation) setMapCenter([userLocation.lat, userLocation.lng]);
  }, [userLocation]);

  const fetchDiscovery = useCallback(async () => {
    setLoadingDiscovery(true);
    try {
      const params = {};
      if (userLocation) { params.latitude = userLocation.lat; params.longitude = userLocation.lng; params.maxDistance = radius; }
      const res = await api.get('/professionals/map', { params });
      if (res.data?.success) {
        setGrouped(res.data.data);
        setDiscoveryMode(true);
      }
    } catch { /* ignore */ }
    setLoadingDiscovery(false);
  }, [userLocation, radius]);

  const toggleDiscovery = () => {
    if (discoveryMode) {
      setDiscoveryMode(false);
    } else {
      fetchDiscovery();
    }
  };

  const allGrouped = useMemo(() => {
    if (!discoveryMode) return [];
    return [
      ...grouped.recommended.map(p => ({ ...p, _discovery: 'recommended' })),
      ...grouped.active.map(p => ({ ...p, _discovery: 'active' })),
      ...grouped.nearby.map(p => ({ ...p, _discovery: 'nearby' }))
    ];
  }, [grouped, discoveryMode]);

  const discoveryIcon = useCallback((cat) => {
    if (cat === 'recommended') return RECOMMENDED_ICON;
    if (cat === 'active') return ACTIVE_ICON;
    return NEARBY_ICON;
  }, []);

  const discoveryLabel = useCallback((cat) => {
    if (cat === 'recommended') return 'Recomendado';
    if (cat === 'active') return 'Activo';
    return 'Cercano';
  }, []);

  const discoveryBadge = useCallback((cat) => {
    if (cat === 'recommended') return 'bg-green-100 text-green-800';
    if (cat === 'active') return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  }, []);

  // Fallback: show professionals as-is when discovery mode is off
  const fallbackPros = useMemo(() => {
    if (discoveryMode) return [];
    return professionals.filter(p =>
      p.location?.coordinates?.coordinates?.[0] &&
      p.location?.coordinates?.coordinates?.[1]
    );
  }, [professionals, discoveryMode]);

  return (
    <div className="w-full h-[600px] relative">
      {/* Top bar: discovery toggle + legend */}
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <Button
          onClick={toggleDiscovery}
          disabled={loadingDiscovery}
          variant={discoveryMode ? 'default' : 'outline'}
          className={`shadow-lg text-xs ${discoveryMode ? 'bg-primary-600' : ''}`}
        >
          <Layers className="w-4 h-4 mr-1.5" />
          {loadingDiscovery ? 'Cargando...' : discoveryMode ? 'Descubrimiento: ON' : 'Modo Descubrimiento'}
        </Button>
        {discoveryMode && (
          <Button
            onClick={() => setShowLegend(!showLegend)}
            variant="outline"
            className="bg-white shadow-lg text-xs"
          >
            Leyenda
          </Button>
        )}
      </div>

      {/* Legend popover */}
      {showLegend && discoveryMode && (
        <div className="absolute top-20 left-4 z-[1000] bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Leyenda</h4>
          <div className="space-y-3">
            {LEGEND_ITEMS.map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My location button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={async () => {
            const loc = await getAccurateLocation();
            if (loc && !loc.error) setMapCenter([loc.lat, loc.lng]);
          }}
          variant="outline"
          className="bg-white shadow-lg"
        >
          <Navigation className="w-4 h-4 mr-1.5" /> Mi ubicacion
        </Button>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter center={mapCenter} />

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radius * 1000}
              pathOptions={{ fillColor: '#0f7a5a', fillOpacity: 0.08, color: '#0f7a5a', weight: 1.5 }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
              <Popup>Tu ubicacion</Popup>
            </Marker>
          </>
        )}

        {/* Discovery mode markers */}
        {discoveryMode && allGrouped.map((pro) => {
          const coords = pro.location?.coordinates?.coordinates;
          if (!coords || coords.length < 2) return null;
          return (
            <Marker
              key={pro._id}
              position={[coords[1], coords[0]]}
              icon={discoveryIcon(pro._discovery)}
              eventHandlers={{ click: () => onSelectProfessional(pro) }}
            >
              <Popup>
                <Card className="w-64 border-0 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{pro.businessName || pro.profession}</h3>
                          <Badge className={`text-[10px] ${discoveryBadge(pro._discovery)}`}>
                            {discoveryLabel(pro._discovery)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{pro.profession}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{pro.location?.city || ''}</span>
                        </div>
                        {pro.computedDistance && (
                          <p className="text-xs text-gray-500 mt-0.5">{pro.computedDistance} km de distancia</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {pro.verification?.isVerified && (
                            <Badge variant="secondary" className="text-[10px]">Verificado</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{pro.stats?.rating || 0}</span>
                          </div>
                        </div>
                        <Button size="sm" className="w-full mt-2" onClick={() => onSelectProfessional(pro)}>Ver perfil</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}

        {/* Fallback markers (discovery off) */}
        {!discoveryMode && fallbackPros.map((pro) => {
          const coords = pro.location.coordinates.coordinates;
          return (
            <Marker key={pro._id} position={[coords[1], coords[0]]}
              eventHandlers={{ click: () => onSelectProfessional(pro) }}
            >
              <Popup>
                <Card className="w-64 border-0 shadow-none">
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">{pro.businessName || pro.profession}</h3>
                    <p className="text-xs text-gray-500">{pro.profession}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{pro.stats?.rating || 0}</span>
                    </div>
                    <Button size="sm" className="w-full mt-2" onClick={() => onSelectProfessional(pro)}>Ver perfil</Button>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Feature badges at bottom */}
      {discoveryMode && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2 flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Recomendados</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Activos</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cercanos</span>
          </div>
        </div>
      )}
    </div>
  );
}