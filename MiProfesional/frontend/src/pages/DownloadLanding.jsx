import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Smartphone, Plus, QrCode, MapPin, MessageCircle, ShieldCheck, Search, Phone, ArrowRight } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

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

const trustItems = [
  { icon: MapPin, title: 'Profesionales cerca tuyo', desc: 'Encontra electricistas, plomeros, medicos y mas profesionales verificados en tu zona.' },
  { icon: MessageCircle, title: 'Contacto directo', desc: 'Comunicate directamente con el profesional. Sin intermediarios, sin comisiones.' },
  { icon: ShieldCheck, title: 'Servicios verificados', desc: 'Todos los profesionales pasan por verificacion de identidad y antecedentes.' },
];

const steps = [
  { number: '1', icon: Download, title: 'Descarga la app', desc: 'Instala MiProfesional en tu celular gratis. Disponible para Android y iOS.' },
  { number: '2', icon: Search, title: 'Busca un profesional', desc: 'Encuentra al experto que necesitas cerca de tu ubicacion. Filtra por rubro y zona.' },
  { number: '3', icon: Phone, title: 'Contactalo directo', desc: 'Chatea o llama al profesional. Acuerden precio, fecha y forma de pago.' },
];

export default function DownloadLanding() {
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

  const renderDownloadButton = () => {
    if (device === 'android') {
      return (
        <a href={APK_URL} download
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white font-bold text-lg rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
        >
          <Download size={22} />
          Descargar para Android
        </a>
      );
    }
    if (device === 'ios') {
      return (
        <span
          className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-500/30 cursor-default"
        >
          <Plus size={22} />
          Instalar en iPhone
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-primary-500/30 cursor-default"
      >
        <QrCode size={22} />
        Abri desde tu celular
      </span>
    );
  };

  const renderDeviceHint = () => {
    if (device === 'android') {
      return (
        <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl p-4 max-w-md mx-auto text-left">
          <p className="text-xs text-amber-800 font-medium">Instrucciones:</p>
          <ol className="text-xs text-amber-700 mt-2 space-y-1.5 list-decimal list-inside">
            <li>Toca <span className="font-semibold">Descargar para Android</span></li>
            <li>Si el sistema lo solicita, habilita <span className="font-semibold">fuentes desconocidas</span></li>
            <li>Abre el archivo y toca <span className="font-semibold">Instalar</span></li>
          </ol>
        </div>
      );
    }
    if (device === 'ios') {
      return (
        <div className="bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-xl p-4 max-w-md mx-auto text-left">
          <p className="text-xs text-blue-800 font-medium">Pasos para instalar en iPhone:</p>
          <ol className="text-xs text-blue-700 mt-2 space-y-1.5 list-decimal list-inside">
            <li>Abre Safari y entra a <span className="font-semibold">miprofesional.online</span></li>
            <li>Toca el icono <span className="font-semibold">Compartir</span> en la barra inferior</li>
            <li>Selecciona <span className="font-semibold">Agregar a pantalla de inicio</span></li>
          </ol>
        </div>
      );
    }
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="inline-block p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl mb-4">
          <QRCodeCanvas value={SITE_URL} size={140} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <code className="text-sm bg-white/10 px-3 py-1.5 rounded-lg text-gray-300 font-mono">{SITE_URL}</code>
          <button onClick={copyLink}
            className="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >{copied ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Escanea el codigo con la camara de tu celular</p>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Descargar MiProfesional — App de Profesionales en Argentina</title>
        <meta name="description" content="Descarga MiProfesional, la app para encontrar profesionales verificados cerca tuyo. Disponible para Android e iOS." />
        <meta property="og:title" content="Descargar MiProfesional — App de Profesionales" />
        <meta property="og:description" content="Encuentra profesionales verificados cerca tuyo. Descarga la app." />
      </Helmet>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-sm group-hover:bg-primary-700 transition-colors">MP</div>
            <span className="font-bold text-lg text-gray-900">MiProfesional</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Inicio</Link>
            <Link to="/search" className="text-gray-600 hover:text-gray-900 transition-colors">Buscar</Link>
            <Link to="/login" className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm">
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover opacity-15" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-3xl mx-auto text-center md:text-left md:mx-0">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6">
              <Smartphone size={14} className="text-primary-400" />
              <span>App oficial de MiProfesional</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-5">
              Encontra profesionales<br />
              <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">cerca tuyo en minutos</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Electricistas, plomeros, tecnicos, salud, legales y mas profesionales verificados en toda Argentina.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              {renderDownloadButton()}
              <p className="text-sm text-gray-500">Gratis &middot; Sin registro</p>
            </div>
            {renderDeviceHint()}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* TRUST */}
      <section className="py-20 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Confianza</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Por que elegir MiProfesional</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">La forma mas facil de encontrar profesionales verificados</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                    <Icon size={28} className="text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-primary-500 text-xs font-semibold uppercase tracking-widest">Simple</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">Como funciona</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Tres pasos para conectar con el profesional que necesitas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-600/20">
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-sm font-bold flex items-center justify-center border-2 border-white">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-24 md:py-28 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            Empeza a encontrar profesionales hoy
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Miles de profesionales verificados te esperan. Descarga gratis y conecta en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {device === 'android' ? (
              <a href={APK_URL} download
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 text-base"
              >
                <Download size={18} />
                Descargar para Android
              </a>
            ) : device === 'ios' ? (
              <Link to="/"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 text-base"
              >
                <Plus size={18} />
                Ir a la web e instalar
              </Link>
            ) : (
              <Link to="/"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/25 text-base"
              >
                <ArrowRight size={18} />
                Ir a MiProfesional.online
              </Link>
            )}
            <Link to="/search"
              className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-gray-700 text-base backdrop-blur-sm"
            >
              Explorar sin descargar
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-xs">MP</div>
              <span className="font-bold text-lg text-gray-900">MiProfesional</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
              <Link to="/categorias" className="hover:text-primary-600 transition-colors">Categorias</Link>
              <Link to="/search" className="hover:text-primary-600 transition-colors">Buscar</Link>
              <Link to="/login" className="hover:text-primary-600 transition-colors">Ingresar</Link>
            </nav>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs">2026 MiProfesional — Plataforma de conexion entre clientes y profesionales</p>
            <p className="text-gray-400 text-xs">Desarrollado por <span className="font-medium text-gray-500">Luis Aguerre</span></p>
          </div>
        </div>
      </footer>
    </>
  );
}
