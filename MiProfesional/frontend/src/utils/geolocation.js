import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const GEO_LOG_PREFIX = '[Geo]';

function log(...args) {
  console.log(GEO_LOG_PREFIX, ...args);
}

function logError(...args) {
  console.error(GEO_LOG_PREFIX, ...args);
}

export async function requestLocationPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }
  try {
    const permResult = await Geolocation.requestPermissions();
    const fine = permResult.location === 'granted' || permResult.coarseLocation === 'granted';
    log('Permisos Android:', permResult.location, permResult.coarseLocation, '-> granted:', fine);
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
    log(`Intento ${attemptNum} exitoso (Capacitor):`, {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      source: 'GPS/Native',
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      source: 'gps',
    };
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        log(`Intento ${attemptNum} exitoso (Web):`, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'navigator.geolocation',
        });
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'gps',
        });
      },
      (err) => {
        logError(`Intento ${attemptNum} fallo:`, err.code, err.message);
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
    log('Plataforma nativa detectada (Android)');
    const hasPerms = await requestLocationPermissions();
    if (!hasPerms) {
      logError('Permisos GPS denegados por el usuario');
      return { error: 'Permiso de ubicacion denegado.', source: 'permission_denied' };
    }
  } else {
    log('Plataforma web detectada');
    if (!('geolocation' in navigator)) {
      logError('navigator.geolocation no disponible');
      return { error: 'Tu navegador no soporta geolocalizacion.', source: 'unsupported' };
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
  return { error: 'No se pudo obtener ubicacion GPS.', source: 'gps_failed' };
}
