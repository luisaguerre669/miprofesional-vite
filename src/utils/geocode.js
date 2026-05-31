const logger = require('./logger');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function normalize(text) {
  if (!text) return '';
  let s = text.trim().replace(/\s+/g, ' ');
  // Expand abbreviations: match word optionally followed by period
  s = s.replace(/\bAv\.?(?:\s|$)/gi, (m) => m.startsWith('Av') || m.startsWith('av') ? 'Avenida ' : 'avenida ');
  s = s.replace(/\bCll\.?(?:\s|$)/gi, (m) => m.startsWith('C') || m.startsWith('c') ? 'Calle ' : 'calle ');
  s = s.replace(/\bCra\.?(?:\s|$)/gi, (m) => m.startsWith('C') || m.startsWith('c') ? 'Carrera ' : 'carrera ');
  s = s.replace(/\bNro?\.?(?:\s|$)/gi, 'Numero ');
  s = s.replace(/\bBs\s*As\.?\b/gi, 'Buenos Aires');
  s = s.replace(/\bCABA\b/gi, 'Ciudad Autonoma de Buenos Aires');
  s = s.replace(/\bPcia\.?(?:\s|$)/gi, 'Provincia ');
  s = s.replace(/\bSta\.?(?:\s|$)/gi, 'Santa ');
  s = s.replace(/\bS\/N\b/gi, '');
  s = s.replace(/\.(?=\s|$)|\.(?=\.)/g, '');
  s = s.replace(/[<>{}[\]'"`]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

function selectBestResult(results, { city, state }) {
  if (!results || results.length === 0) return null;

  const cityLower = city ? city.toLowerCase().trim() : '';
  const stateLower = state ? state.toLowerCase().trim() : '';

  const scored = results.map(r => {
    let score = r.importance || 0.5;
    const display = (r.display_name || '').toLowerCase();

    if (cityLower && display.includes(cityLower)) score += 0.3;
    if (stateLower && display.includes(stateLower)) score += 0.2;

    if (r.type === 'city' || r.type === 'town' || r.type === 'village') score += 0.1;
    if (r.category === 'place' || r.category === 'boundary') score += 0.05;

    if (cityLower && !display.includes(cityLower)) score -= 0.5;

    return { result: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  logger.debug(`Geocode selection for city="${city}" state="${state}":`, {
    candidates: results.map(r => ({ display: r.display_name, importance: r.importance, type: r.type })),
    selected: scored[0]?.result?.display_name,
    score: scored[0]?.score
  });

  return scored[0].result;
}

async function geocodeAddress({ address, city, state, country = 'Argentina' }) {
  const normAddr = normalize(address);
  const normCity = normalize(city);
  const normState = normalize(state);

  const parts = [normAddr, normCity, normState, 'Argentina'].filter(Boolean);
  if (parts.length < 2) {
    logger.warn('Geocode: insufficient address parts', { address, city, state });
    return null;
  }

  const query = parts.join(', ');
  const q = encodeURIComponent(query);
  const url = `${NOMINATIM_URL}?format=json&q=${q}&limit=5&countrycodes=ar&accept-language=es`;

  logger.debug(`Geocode request URL: ${url}`);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MiProfesional/1.0 (miprofesional.online)' },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      logger.warn(`Nominatim returned ${res.status} for query: ${query}`);
      return null;
    }

    const data = await res.json();
    logger.debug(`Nominatim response count: ${data?.length || 0}`, {
      query,
      firstResult: data?.[0]?.display_name || 'none'
    });

    if (!data || data.length === 0) {
      logger.warn(`No results from Nominatim for: ${query}`);
      return null;
    }

    const best = selectBestResult(data, { city: normCity, state: normState });
    if (!best) {
      logger.warn(`No valid result after selection for: ${query}`);
      return null;
    }

    const { lat, lon, display_name } = best;
    logger.info(`Geocoded: ${query} -> ${lat}, ${lon} | ${display_name}`);

    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      displayName: display_name
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

module.exports = { geocodeAddress };
