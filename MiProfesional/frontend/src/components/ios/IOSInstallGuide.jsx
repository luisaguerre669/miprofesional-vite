import { useState, useEffect } from 'react';
import { X, Smartphone, Share2, Plus } from 'lucide-react';

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua);
  const isStandalone = 'standalone' in window.navigator && window.navigator.standalone;
  return isIOS && isSafari && !isStandalone;
}

const STEPS = [
  {
    icon: Smartphone,
    title: 'Abri en Safari',
    desc: 'Esta pagina ya esta en Safari. Si la abriste desde otra app, toca "Abrir en Safari".',
  },
  {
    icon: Share2,
    title: 'Toca el boton Compartir',
    desc: 'En la barra inferior del Safari, toca el icono de cuadrado con flecha hacia arriba.',
  },
  {
    icon: Plus,
    title: 'Agrega a pantalla de inicio',
    desc: 'Desplazate hacia abajo en el menu y selecciona "Agregar a pantalla de inicio".',
  },
];

export default function IOSInstallGuide() {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ios-guide-dismissed');
    if (stored === 'true') {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => {
      if (detectIOS()) {
        setShowBanner(true);
      }
    }, 3000);
    const handleExternalOpen = () => { setShowBanner(false); setShowModal(true); };
    window.addEventListener('open-ios-guide', handleExternalOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-ios-guide', handleExternalOpen);
    };
  }, []);

  const handleOpen = () => {
    setShowModal(true);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowModal(false);
    setDismissed(true);
    localStorage.setItem('ios-guide-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <>
      {/* Floating Banner */}
      {showBanner && (
        <div className="fixed bottom-6 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto max-w-sm animate-slide-up">
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/30 p-4">
            <button onClick={handleDismiss} className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
                <Smartphone size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">Usar en iPhone</p>
                <p className="text-white/60 text-[11px]">Instala MiProfesional como app</p>
              </div>
              <button onClick={handleOpen}
                className="shrink-0 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
              >
                Ver como
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleDismiss}>
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:mx-4 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Smartphone size={16} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Instalar en iPhone</h2>
              </div>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Segui estos pasos para usar MiProfesional como una aplicacion nativa en tu iPhone:
            </p>

            {/* Steps */}
            <div className="space-y-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-primary-700 text-xs font-bold">{idx + 1}</span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="w-0.5 flex-1 bg-primary-100 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon size={16} className="text-primary-600 shrink-0" />
                        <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 ml-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tip */}
            <div className="mt-5 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-xs text-primary-800 font-medium">
                Una vez agregada, la app se abre sola, sin la barra del navegador, y recibe notificaciones como cualquier app nativa.
              </p>
            </div>

            <button onClick={handleDismiss}
              className="w-full mt-4 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
