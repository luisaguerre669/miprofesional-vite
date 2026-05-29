import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapRenderFix from './map/MapRenderFix';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const defaultCenter = [-34.6037, -58.3816];

const MapView = ({ professionals = [], center, zoom = 11, height = '400px' }) => {
  const mapCenter = center || defaultCenter;

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <MapRenderFix />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {professionals.map((pro) => {
          const lat = pro.location?.coordinates?.lat;
          const lng = pro.location?.coordinates?.lng;
          if (!lat || !lng) return null;
          return (
            <Marker key={pro._id} position={[lat, lng]}>
              <Popup>
                <strong>{pro.businessName || pro.profession}</strong>
                <br />
                {pro.profession}
                {pro.location?.city && <><br />{pro.location.city}</>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
