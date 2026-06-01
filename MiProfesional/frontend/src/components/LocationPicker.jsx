import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Crosshair, Loader2 } from 'lucide-react';
import MapRenderFix from './map/MapRenderFix';
import { getAccurateLocation } from '../utils/geolocation';
import api from '../lib/axios';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = React.useRef(null);
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const { lat, lng } = marker.getLatLng();
        onPositionChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      }
    },
  };
  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick({ lat: parseFloat(e.latlng.lat.toFixed(6)), lng: parseFloat(e.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

function MapBoundsUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom() < 14 ? 14 : map.getZoom());
  }, [center, map]);
  return null;
}

const DEFAULT_CENTER = [-34.6037, -58.3816];

export default function LocationPicker({
  initialLat,
  initialLng,
  initialAddress,
  onLocationChange,
  height = '350px',
  compact = false,
}) {
  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
  );
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress || '');

  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const { data } = await api.get('/geocode/reverse', { params: { lat, lng } });
      if (data?.success && data?.data) {
        const result = data.data;
        setResolvedAddress(result.displayName);
        setAddressInput(result.street + (result.number ? ` ${result.number}` : ''));
        onLocationChange && onLocationChange({
          lat, lng,
          address: result.displayName,
          city: result.city || '',
          state: result.state || '',
          street: result.street || '',
          number: result.number || '',
          neighborhood: result.neighborhood || '',
        });
      } else {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setResolvedAddress(fallback);
        onLocationChange && onLocationChange({ lat, lng, address: fallback });
      }
    } catch (err) {
      setGeoError('No se pudo resolver la dirección');
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setResolvedAddress(fallback);
      onLocationChange && onLocationChange({ lat, lng, address: fallback });
    } finally {
      setGeoLoading(false);
    }
  }, [onLocationChange]);

  const geocodeAddress = useCallback(async (query) => {
    if (!query.trim()) return;
    setGeoLoading(true);
    setGeoError('');
    try {
      const { data } = await api.get('/geocode/search', { params: { q: query } });
      if (data?.success && data?.data) {
        const result = data.data;
        const lat = result.latitude;
        const lng = result.longitude;
        setPosition([lat, lng]);
        setResolvedAddress(result.displayName);
        setAddressInput(result.street + (result.number ? ` ${result.number}` : ''));
        onLocationChange && onLocationChange({
          lat, lng,
          address: result.displayName,
          city: result.city || '',
          state: result.state || '',
          street: result.street || '',
          number: result.number || '',
        });
      } else {
        setGeoError('No se encontró la dirección');
      }
    } catch (err) {
      setGeoError('Error al buscar dirección');
    } finally {
      setGeoLoading(false);
    }
  }, [onLocationChange]);

  const handleMarkerDrag = useCallback(async ({ lat, lng }) => {
    setPosition([lat, lng]);
    await reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setPosition([lat, lng]);
    await reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMyLocation = async () => {
    const loc = await getAccurateLocation();
    if (loc && !loc.error && loc.lat && loc.lng) {
      setPosition([loc.lat, loc.lng]);
      await reverseGeocode(loc.lat, loc.lng);
    } else {
      setGeoError('No se pudo obtener tu ubicación. Verificá el GPS.');
    }
  };

  const handleAddressSearch = (e) => {
    e.preventDefault();
    geocodeAddress(addressInput);
  };

  return (
    <div className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
      <div className="flex gap-2">
        <form onSubmit={handleAddressSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Ej: Pampa 1375, Bella Vista..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={geoLoading || !addressInput.trim()}
            className="px-3 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={geoLoading}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          title="Usar mi ubicación"
        >
          <Crosshair size={16} />
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <MapPin size={12} /> {geoError}
        </p>
      )}

      <div
        style={{ height, width: '100%' }}
        className="rounded-xl overflow-hidden border border-gray-200 relative"
      >
        <MapContainer center={position} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <MapRenderFix />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />
          <MapBoundsUpdater center={position} />
          <DraggableMarker position={position} onPositionChange={handleMarkerDrag} />
        </MapContainer>

        {geoLoading && (
          <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-gray-600 flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Geocodificando...
            </span>
          </div>
        )}
      </div>

      {resolvedAddress && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5">
          <MapPin size={14} className="text-primary-600 shrink-0 mt-0.5" />
          <span>{resolvedAddress}</span>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Arrastrá el marcador para ajustar la ubicación exacta, o hacé clic en cualquier lugar del mapa.
      </p>
    </div>
  );
}
