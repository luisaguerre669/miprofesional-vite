import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Plus, MapPin, MessageCircle, ShieldCheck, Search, Phone } from 'lucide-react';
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[180px] sm:w-[200px] lg:w-[220px]">
      <div className="relative bg-gray-900 rounded-[28px] p-1.5 shadow-2xl shadow-black/40 border border-gray-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-4 bg-gray-900 rounded-b-xl z-10" />
        <div className="bg-white rounded-[20px] overflow-hidden aspect-[9/19] flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col items-center justify-center p-4">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-2 shadow-lg">
              <span className="text-primary-600 font-black text-sm">MP</span>
            </div>
            <p className="text-white text-[11px] font-bold text-center leading-tight">MiProfesional</p>
            <p className="text-white/60 text-[9px] mt-0.5 text-center">Encuentra profesionales</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const downloadBtn = () => {
    if (device === 'android') {
      return (
        <a href={APK_URL} download
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
        >
          <Download size={20} />
          Descargar APK
        </a>
      );
    }
    if (device === 'ios') {
      return (
        <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
        >
          <Plus size={20} />
          Instalar en iPhone
        </a>
      );
    }
    return (
      <a href={SITE_URL} target="_blank" rel="noopener noreferrer"
        className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary-500 text-white font-bold text-base rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/30"
      >
        <Download size={20} />
        Ir a la App
      </a>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 lg:h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black text-xs lg:text-sm group-hover:bg-primary-700 transition-colors">MP</div>
            <span className="font-bold text-base lg:text-lg text-gray-900">MiProfesional</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Inicio</Link>
            <Link to="/search" className="text-gray-600 hover:text-gray-900 transition-colors">Buscar</Link>
            <Link to="/login" className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm">Ingresar</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80" alt="" className="w-full h-full object-cover opacity-15" style={{ filter: 'brightness(0.3)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-gray-950/20" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3.5 py-1 text-sm text-gray-300 mb-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <span>App oficial de MiProfesional</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-3">
                Encontra profesionales<br />
                <span className="bg-gradient-to-r from-primary-400 via-primary-300 to-emerald-300 bg-clip-text text-transparent">cerca tuyo en minutos</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Electricistas, plomeros, tecnicos, salud, legales y mas profesionales verificados en toda Argentina.
              </p>
            </div>

            {/* Right: phone mockup + QR + download button */}
            <div className="shrink-0 flex flex-col items-center gap-5 lg:gap-6">
              <PhoneMockup />
              <div className="flex items-stretch gap-3 w-full max-w-[340px]">
                {device === 'desktop' && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 shrink-0 flex items-center">
                    <QRCodeCanvas value={SITE_URL} size={60} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                  </div>
                )}
                {device === 'android' && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 shrink-0 flex items-center">
                    <QRCodeCanvas value={SITE_URL} size={60} bgColor="#ffffff" fgColor="#0f7a5a" level="M" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1.5">
                  {downloadBtn()}
                  <p className="text-[11px] text-gray-500 text-center">{device === 'android' ? `Version ${APK_VERSION} · Gratis` : 'Gratis · Sin registro'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* TRUST */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
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
      <section className="bg-gray-50 py-16 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
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

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4">
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
