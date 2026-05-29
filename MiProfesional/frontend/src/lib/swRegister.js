import { Capacitor } from '@capacitor/core';

let refreshing = false;

function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function clearNativeWebCaches() {
  if (!isNativePlatform()) return;

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations || []).map((registration) => registration.unregister()));
  } catch {
    // Cache cleanup must never block app startup.
  }

  try {
    const keys = await window.caches?.keys?.();
    await Promise.all((keys || []).map((key) => window.caches.delete(key)));
  } catch {
    // Cache Storage may be unavailable on older Android WebViews.
  }
}

export function registerSW() {
  if (isNativePlatform()) {
    clearNativeWebCaches();
    return;
  }

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker.register('/sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    });

    if (reg.waiting && navigator.serviceWorker.controller) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }).catch(() => {});
}
