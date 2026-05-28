import { Link } from 'react-router-dom';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.miprofesional.app';

export default function DownloadSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 md:py-24 px-4">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500 rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">App Android</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Descarga MiProfesional</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Conecta con profesionales verificados desde tu celular</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary-600">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Disponible en Google Play</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Descarga la app oficial de MiProfesional desde la tienda de Android
                </p>
              </div>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20 text-base"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                Ir a Google Play
              </a>
              <p className="text-xs text-gray-400">
                Gratis · Sin registro · App oficial
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-gray-400 hover:text-primary-600 transition-colors">
            Seguir navegando en la version web
          </Link>
        </div>
      </div>
    </section>
  );
}