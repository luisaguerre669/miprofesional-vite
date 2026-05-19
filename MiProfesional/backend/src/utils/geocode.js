const logger = require('./logger');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function geocodeAddress({ address, city, state, country = 'Argentina' }) {
  const parts = [address, city, state, country].filter(Boolean);
  if (parts.length < 2) return null;

  const q = encodeURIComponent(parts.join(', '));
  const url = `${NOMINATIM_URL}?format=json&q=${q}&limit=1&accept-language=es`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MiProfesional/1.0 (miprofesional.online)' }
    });
    if (!res.ok) {
      logger.warn(`Nominatim returned ${res.status} for: ${parts.join(', ')}`);
      return null;
    }
    const data = await res.json();
    if (!data || data.length === 0) {
      logger.warn(`No results from Nominatim for: ${parts.join(', ')}`);
      return null;
    }
    const { lat, lon, display_name } = data[0];
    logger.info(`Geocoded: ${parts.join(', ')} -> ${lat}, ${lon}`);
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      displayName: display_name
    };
  } catch (err) {
    logger.error('Geocode request failed:', err.message);
    return null;
  }
}

module.exports = { geocodeAddress };
