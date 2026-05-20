import { useState, useEffect } from 'react';
import { Smartphone, Download, Apple, Monitor, QrCode, Shield } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from 'react-router-dom';

const APK_VERSION = 'v1.0.0';
const APK_URL = `/downloads/miprofesional-${APK_VERSION}.apk`;
const SITE_URL = 'https://www.miprofesional.online';

function detectDevice() {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'desktop';
}

export default function DownloadSection() {
  const [device, setDevice] = useState('desktop');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(SITE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 md:py-24 px-4">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500 rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">App Mobile</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Descarga MiProfesional</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Lleva tu conexion con profesionales verificados a todos lados</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10 text-center">

            {device === 'android' && (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                  <Smartphone size={32} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Disponible para Android</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Descarga el archivo APK e instalalo en tu dispositivo
                  </p>
                </div>
                <a
                  href={APK_URL}
                  download
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-500/20 text-base"
                >
                  <Download size={18} />
                  Descargar para Android
                </a>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                  <p className="text-xs text-amber-800 font-medium">Instrucciones de instalacion:</p>
                  <ol className="text-xs text-amber-700 mt-2 space-y-1.5 list-decimal list-inside">
                    <li>Toca el boton de descarga de arriba</li>
                    <li>Si tu celular lo solicita, habilita <span className="font-semibold">Instalar apps de fuentes desconocidas</span></li>
                    <li>Abre el archivo descargado y toca <span className="font-semibold">Instalar</span></li>
                    <li>Una vez instalada, abri la app y registrate</li>
                  </ol>
                </div>
                <p className="text-xs text-gray-400">
                  Version {APK_VERSION} &middot; {Math.round(12036489 / 1024 / 1024)} MB
                </p>
              </div>
            )}

            {device === 'ios' && (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
                  <Apple size={32} className="text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Proximamente en App Store</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    La version para iOS esta en desarrollo. Te avisaremos cuando este disponible.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                  <Apple size={16} />
                  App Store
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-semibold">PROXIMAMENTE</span>
                </div>
                <p className="text-xs text-gray-400">
                  Mientras tanto, podes usar la version web desde tu navegador
                </p>
              </div>
            )}

            {device === 'desktop' && (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                  <QrCode size={32} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Escanea desde tu celular</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Abri la camara de tu telefono y escanea el codigo QR para descargar
                  </p>
                </div>
                <div className="inline-block p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <QRCodeCanvas value={SITE_URL} size={160} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-2">O accede desde:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 font-mono">{SITE_URL}</code>
                    <button onClick={copyLink}
                      className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Shield size={12} />
                  <span>Descarga segura y gratuita</span>
                </div>
              </div>
            )}

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
