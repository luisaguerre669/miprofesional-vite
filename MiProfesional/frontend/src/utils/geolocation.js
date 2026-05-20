import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const GEO_LOG_PREFIX = '[Geo]';

function log(...args) {
  console.log(GEO_LOG_PREFIX, ...args);
}

function logError(...args) {
  console.error(GEO_LOG_PREFIX, ...args);
}

function isHttps() {
  return typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
}

function isLocalhost() {
  return typeof window !== 'undefined' && window.location && (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  );
}

async function checkWebLocationPermission() {
  if (!('permissions' in navigator)) return 'prompt';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    log('Web permission state:', result.state);
    result.addEventListener('change', () => log('Permission changed to:', result.state));
    return result.state;
  } catch {
    return 'prompt';
  }
}

export async function requestLocationPermissions() {
  if (!Capacitor.isNativePlatform()) {
    const state = await checkWebLocationPermission();
    if (state === 'denied') {
      logError('Web location permission permanently denied');
      return false;
    }
    return true;
  }
  try {
    const permResult = await Geolocation.requestPermissions();
    const fine = permResult.location === 'granted' || permResult.coarseLocation === 'granted';
    log('Permisos nativos:', permResult.location, permResult.coarseLocation, '-> granted:', fine);
    return fine;
  } catch (err) {
    logError('Error solicitando permisos GPS:', err);
    return false;
  }
}

async function attemptGetCurrentPosition(options, attemptNum) {
  log(`Intento ${attemptNum}: enableHighAccuracy=${options.enableHighAccuracy}, timeout=${options.timeout}ms`);
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition(options);
    const lat = Number(pos.coords.latitude);
    const lng = Number(pos.coords.longitude);
    const accuracy = Number(pos.coords.accuracy);

    if (isNaN(lat) || isNaN(lng)) {
      logError(`Intento ${attemptNum} fallo: Capacitor devolvio coordenadas invalidas (NaN)`);
      throw new Error('Coordenadas invalidas');
    }

    log(`Intento ${attemptNum} exitoso (Capacitor):`, { lat, lng, accuracy, source: 'GPS/Native' });
    return { lat, lng, accuracy, source: 'gps' };
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude);
        const lng = Number(pos.coords.longitude);
        const accuracy = Number(pos.coords.accuracy);
        if (isNaN(lat) || isNaN(lng)) {
          logError(`Intento ${attemptNum} fallo: Navigator devolvio coordenadas invalidas (NaN)`);
          reject(new Error('Coordenadas invalidas'));
          return;
        }
        log(`Intento ${attemptNum} exitoso (Web):`, { lat, lng, accuracy, source: 'navigator.geolocation' });
        resolve({ lat, lng, accuracy, source: 'gps' });
      },
      (err) => {
        logError(`Intento ${attemptNum} fallo: codigo=${err.code}, mensaje=${err.message}`);
        reject(err);
      },
      options
    );
  });
}

const ATTEMPTS = [
  { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 },
];

export async function getAccurateLocation() {
  log('Iniciando geolocalizacion precisa...');

  if (Capacitor.isNativePlatform()) {
    log('Plataforma nativa detectada (' + Capacitor.getPlatform() + ')');
    const hasPerms = await requestLocationPermissions();
    if (!hasPerms) {
      logError('Permisos GPS denegados por el usuario');
      return { error: 'Permiso de ubicacion denegado. Activa la ubicacion en los ajustes del dispositivo.', source: 'permission_denied' };
    }
  } else {
    log('Plataforma web detectada');
    if (!('geolocation' in navigator)) {
      logError('navigator.geolocation no disponible');
      return { error: 'Tu navegador no soporta geolocalizacion.', source: 'unsupported' };
    }

    if (!isLocalhost() && !isHttps()) {
      logError('GPS requiere HTTPS en produccion');
    }

    const permState = await checkWebLocationPermission();
    if (permState === 'denied') {
      logError('Permiso de ubicacion denegado permanentemente en el navegador');
      return {
        error: 'Bloqueaste la ubicacion para este sitio. Para activarla: haz clic en el icono de candado en la barra de direcciones y permite la ubicacion.',
        source: 'permission_denied'
      };
    }
  }

  for (let i = 0; i < ATTEMPTS.length; i++) {
    try {
      const result = await attemptGetCurrentPosition(ATTEMPTS[i], i + 1);
      return result;
    } catch (err) {
      if (err.code === 1) {
        logError('Permiso denegado, no se reintenta');
        return { error: 'Permiso de ubicacion denegado.', source: 'permission_denied' };
      }
      if (i < ATTEMPTS.length - 1) {
        log(`Reintentando con configuracion ${i + 2}...`);
      }
    }
  }

  logError('Todos los intentos de GPS fallaron');
  return { error: 'No se pudo obtener ubicacion GPS. Verifica que el GPS este activado.', source: 'gps_failed' };
}
