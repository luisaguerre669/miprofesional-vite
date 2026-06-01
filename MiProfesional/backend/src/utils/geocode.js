const logger = require('./logger');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

function normalize(text) {
  if (!text) return '';
  let s = text.trim().replace(/\s+/g, ' ');
  s = s.replace(/\bAv\.?(?:\s|$)/gi, 'Avenida ');
  s = s.replace(/\bCll\.?(?:\s|$)/gi, 'Calle ');
  s = s.replace(/\bCra\.?(?:\s|$)/gi, 'Carrera ');
  s = s.replace(/\bNro?\.?(?:\s|$)/gi, '');
  s = s.replace(/[#Nn][°º]?\s*/g, '');
  s = s.replace(/\bBs\s*As\.?\b/gi, 'Buenos Aires');
  s = s.replace(/\bCABA\b/gi, 'Ciudad Autonoma de Buenos Aires');
  s = s.replace(/\bPcia\.?(?:\s|$)/gi, 'Provincia ');
  s = s.replace(/\bSta\.?(?:\s|$)/gi, 'Santa ');
  s = s.replace(/\bS\/N\b/gi, '');
  s = s.replace(/\.(?=\s|$)|\.(?=\.)/g, '');
  s = s.replace(/[<>{}[\]'"`]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

function parseStreetNumber(text) {
  if (!text) return null;
  const match = text.match(/(\d+)\s*$/);
  return match ? match[1] : null;
}

function selectBestResult(results, { city, state, streetNumber }) {
  if (!results || results.length === 0) return null;
  const cityLower = city ? city.toLowerCase().trim() : '';
  const stateLower = state ? state.toLowerCase().trim() : '';
  const scored = results.map(r => {
    let score = r.importance || 0.5;
    const display = (r.display_name || '').toLowerCase();
    const addr = r.address || {};

    if (cityLower && display.includes(cityLower)) score += 0.3;
    if (stateLower && display.includes(stateLower)) score += 0.2;

    if (r.type === 'house' || r.type === 'building') score += 0.4;
    else if (r.class === 'place' && r.type === 'house') score += 0.35;
    else if (r.type === 'amenity' || r.type === 'shop') score += 0.1;

    if (r.category === 'place' || r.category === 'boundary') score -= 0.3;
    if (r.type === 'city' || r.type === 'town' || r.type === 'village') score -= 0.2;

    if (r.class === 'highway' || r.type === 'road' || r.type === 'street') score -= 0.3;

    if (addr.house_number && streetNumber) {
      if (addr.house_number === streetNumber) score += 0.5;
      else score -= 0.2;
    } else if (streetNumber && display.includes(streetNumber)) {
      score += 0.3;
    }
    if (addr.road && display.includes(addr.road.toLowerCase())) score += 0.1;

    if (cityLower && !display.includes(cityLower)) score -= 0.5;
    if (stateLower && !display.includes(stateLower)) score -= 0.3;

    return { result: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  logger.debug('Geocode scoring:', scored.map(s => ({ display: s.result.display_name, score: s.score.toFixed(2), type: s.result.type })));
  return scored[0].result;
}

async function geocodeAddress({ address, city, state, country = 'Argentina' }) {
  const normAddr = normalize(address);
  const normCity = normalize(city);
  const normState = normalize(state);
  const streetNumber = parseStreetNumber(address);

  const parts = [normAddr, normCity, normState, 'Argentina'].filter(Boolean);
  if (parts.length < 2) {
    logger.warn('Geocode: insufficient address parts', { address, city, state });
    return null;
  }

  const query = parts.join(', ');
  const q = encodeURIComponent(query);
  const url = `${NOMINATIM_URL}?format=json&q=${q}&limit=15&countrycodes=ar&addressdetails=1&accept-language=es`;

  logger.debug(`Geocode request URL: ${url}`, { streetNumber });

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MiProfesional/1.0 (miprofesional.online)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      logger.warn(`Nominatim returned ${res.status} for query: ${query}`);
      return null;
    }
    const data = await res.json();
    if (!data || data.length === 0) {
      logger.warn(`No results from Nominatim for: ${query}`);
      return null;
    }

    const best = selectBestResult(data, { city: normCity, state: normState, streetNumber });
    if (!best) {
      logger.warn(`No valid result after selection for: ${query}`);
      return null;
    }

    const { lat, lon, display_name } = best;
    const addr = best.address || {};

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      displayName: display_name,
      street: addr.road || '',
      number: addr.house_number || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      state: addr.state || '',
      country: addr.country || 'Argentina',
      postcode: addr.postcode || '',
      neighborhood: addr.neighbourhood || addr.suburb || '',
      raw: best
    };
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      logger.error('Geocode request timed out for:', query);
    } else {
      logger.error('Geocode request failed:', err.message);
    }
    return null;
  }
}

async function reverseGeocode({ latitude, longitude }) {
  const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`;
  logger.debug(`Reverse geocode URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MiProfesional/1.0 (miprofesional.online)' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      logger.warn(`Nominatim reverse returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data || data.error) {
      logger.warn(`No reverse geocode result for ${latitude}, ${longitude}`);
      return null;
    }
    const addr = data.address || {};
    return {
      latitude,
      longitude,
      displayName: data.display_name || '',
      street: addr.road || '',
      number: addr.house_number || '',
      city: addr.city || addr.town || addr.village || addr.municipality || '',
      state: addr.state || '',
      country: addr.country || 'Argentina',
      postcode: addr.postcode || '',
      neighborhood: addr.neighbourhood || addr.suburb || '',
    };
  } catch (err) {
    logger.error('Reverse geocode failed:', err.message);
    return null;
  }
}

module.exports = { geocodeAddress, reverseGeocode };
