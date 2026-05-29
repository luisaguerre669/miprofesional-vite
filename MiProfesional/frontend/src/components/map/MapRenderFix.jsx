import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapRenderFix() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => {
      map.invalidateSize({ animate: false });
    };

    const frames = [
      window.requestAnimationFrame(invalidate),
      window.setTimeout(invalidate, 150),
      window.setTimeout(invalidate, 500),
      window.setTimeout(invalidate, 1000),
    ];

    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);
    document.addEventListener('visibilitychange', invalidate);

    return () => {
      window.cancelAnimationFrame(frames[0]);
      frames.slice(1).forEach(window.clearTimeout);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
      document.removeEventListener('visibilitychange', invalidate);
    };
  }, [map]);

  return null;
}
