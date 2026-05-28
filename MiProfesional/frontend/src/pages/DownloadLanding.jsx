import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.miprofesional.app';

export default function DownloadLanding() {
  useEffect(() => {
    window.location.href = PLAY_STORE_URL;
  }, []);

  return (
    <>
      <Helmet>
        <title>Descargar MiProfesional — App Android en Google Play</title>
        <meta name="description" content="Descarga MiProfesional desde Google Play. App oficial para encontrar profesionales verificados en Argentina." />
        <meta property="og:title" content="Descargar MiProfesional — App Android" />
        <meta property="og:description" content="Consigue la app oficial en Google Play." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-6 shadow-xl shadow-primary-600/30">
          <span className="text-white font-black text-xl">MP</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Redirigiendo a Google Play...</h1>
        <p className="text-gray-400 text-sm mb-8 text-center">
          Si no sos redirigido automaticamente, hace clic en el boton de abajo.
        </p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
          Abrir en Google Play
        </a>
        <Link to="/" className="mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}