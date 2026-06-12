import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Crosshair, Loader2, Info } from 'lucide-react';
import MapRenderFix from './map/MapRenderFix';
import { getAccurateLocation } from '../utils/geolocation';
import api from '../lib/axios';

const RED_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 26 16 26s16-16 16-26C32 7.164 24.836 0 16 0z" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="7" fill="white" stroke="#fca5a5" stroke-width="0.5"/>
</svg>`;

const RED_ICON = L.divIcon({
  html: RED_MARKER_SVG,
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
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
      icon={RED_ICON}
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
    if (center) map.setView(center, map.getZoom() < 15 ? 15 : map.getZoom());
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

  const notifyPosition = useCallback((lat, lng, extra = {}) => {
    onLocationChange && onLocationChange({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      address: extra.address || resolvedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: extra.city || '',
      state: extra.state || '',
      street: extra.street || '',
      number: extra.number || '',
      neighborhood: extra.neighborhood || '',
    });
  }, [onLocationChange, resolvedAddress]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const { data } = await api.get('/geocode/reverse', { params: { lat, lng } });
      if (data?.success && data?.data) {
        const result = data.data;
        const display = result.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setResolvedAddress(display);
        setAddressInput(result.street + (result.number ? ` ${result.number}` : ''));
        notifyPosition(lat, lng, {
          address: display,
          city: result.city || '',
          state: result.state || '',
          street: result.street || '',
          number: result.number || '',
          neighborhood: result.neighborhood || '',
        });
        if (data.warning) {
          setGeoError(data.warning);
        }
      } else {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setResolvedAddress(fallback);
        notifyPosition(lat, lng, { address: fallback });
      }
    } catch (err) {
      setGeoError('No se pudo obtener la dirección automáticamente, pero la ubicación fue guardada correctamente');
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setResolvedAddress(fallback);
      notifyPosition(lat, lng, { address: fallback });
    } finally {
      setGeoLoading(false);
    }
  }, [notifyPosition]);

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
        const display = result.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setResolvedAddress(display);
        setAddressInput(result.street + (result.number ? ` ${result.number}` : ''));
        notifyPosition(lat, lng, {
          address: display,
          city: result.city || '',
          state: result.state || '',
          street: result.street || '',
          number: result.number || '',
          neighborhood: result.neighborhood || '',
        });
      } else {
        setGeoError('No se encontró la dirección');
      }
    } catch (err) {
      setGeoError('Error al buscar dirección');
    } finally {
      setGeoLoading(false);
    }
  }, [notifyPosition]);

  const handleMarkerDrag = useCallback(async ({ lat, lng }) => {
    setPosition([lat, lng]);
    await reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setPosition([lat, lng]);
    await reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMyLocation = async (e) => {
    if (e) e.preventDefault();
    const loc = await getAccurateLocation();
    if (loc && !loc.error && loc.lat && loc.lng) {
      setPosition([loc.lat, loc.lng]);
      await reverseGeocode(loc.lat, loc.lng);
    } else {
      setGeoError('No se pudo obtener tu ubicación. Verificá el GPS.');
    }
  };

  const handleAddressSearch = (e) => {
    if (e) e.preventDefault();
    geocodeAddress(addressInput);
  };

  const currentLat = position[0];
  const currentLng = position[1];
  const isDefault = currentLat === DEFAULT_CENTER[0] && currentLng === DEFAULT_CENTER[1];

  return (
    <div className={`space-y-3 ${compact ? 'text-sm' : ''}`}>
      {/* Search bar + GPS button */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddressSearch(e); } }}
              placeholder="Calle y número, ciudad..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={geoLoading || !addressInput.trim()}
            className="px-3 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={geoLoading}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          title="Usar mi ubicación actual"
        >
          <Crosshair size={16} />
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <Info size={14} className="text-amber-500 shrink-0" /> {geoError}
        </p>
      )}

      {/* Instructional banner */}
      {!isDefault && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Arrastrá el <strong>pin rojo</strong> hasta la ubicación exacta de tu domicilio o zona de trabajo.
            Esa ubicación será utilizada para mostrarte en búsquedas cercanas.
          </p>
        </div>
      )}

      {/* Map */}
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

      {/* Coordinates + Address panel */}
      {!isDefault && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={14} className="text-red-500 shrink-0" />
            <span className="font-medium text-gray-700">Coordenadas seleccionadas:</span>
            <code className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </code>
          </div>
          {resolvedAddress && (
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700 shrink-0">Dirección:</span>
              <span>{resolvedAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Hint text */}
      {isDefault && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <MapPin size={12} className="text-gray-300" />
          Buscá una dirección o usá el botón de ubicación para comenzar.
        </p>
      )}
    </div>
  );
}
