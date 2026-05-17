import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, TrendingUp, Activity } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const defaultIcon = new Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function AdminGeoDashboard() {
  const [stats, setStats] = useState({
    totalProfessionals: 0,
    withLocation: 0,
    byCity: [],
    recentActivity: []
  });
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGeoStats();
    loadProfessionalsMap();
  }, []);

  const loadGeoStats = async () => {
    try {
      const response = await fetch(`${API}/professionals/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(prev => ({
          ...prev,
          totalProfessionals: data.data?.totalProfessionals || 0
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadProfessionalsMap = async () => {
    try {
      const response = await fetch(`${API}/professionals/map?limit=500`);
      const data = await response.json();
      if (data.ok) {
        setProfessionals(data.professionals);
        setStats(prev => ({
          ...prev,
          withLocation: data.professionals.filter(p => p.coordinates).length
        }));
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por ciudad
  const byCity = professionals.reduce((acc, pro) => {
    const city = pro.city || 'Sin ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(byCity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de Geolocalización</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Profesionales</p>
                <p className="text-2xl font-bold">{stats.totalProfessionals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Con Ubicación</p>
                <p className="text-2xl font-bold">{stats.withLocation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Cobertura</p>
                <p className="text-2xl font-bold">{Object.keys(byCity).length} ciudades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Tasa de ubicación</p>
                <p className="text-2xl font-bold">
                  {stats.totalProfessionals > 0 
                    ? Math.round((stats.withLocation / stats.totalProfessionals) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa de actividad */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mapa de Profesionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              {!loading && (
                <MapContainer
                  center={[-34.6037, -58.3816]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-lg"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {professionals.map((pro) => {
                    if (!pro.coordinates) return null;
                    const [lng, lat] = pro.coordinates;
                    return (
                      <Marker
                        key={pro.id}
                        position={[lat, lng]}
                        icon={defaultIcon}
                      />
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top ciudades */}
        <Card>
          <CardHeader>
            <CardTitle>Top Ciudades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCities.map(([city, count]) => (
                <div 
                  key={city}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{city}</span>
                  <Badge>{count} profesionales</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
