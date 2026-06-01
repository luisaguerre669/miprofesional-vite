import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, Users, FileText, BarChart3, Shield, CreditCard,
  ArrowRight, CheckCircle, Crown, Building2, ChevronRight,
  Star, MapPin, Briefcase, Award, TrendingUp, Zap
} from 'lucide-react';

export default function EmpresasPage() {
  const { isAuthenticated } = useAuth();

  const steps = [
    { icon: Building2, title: '1. Creá tu cuenta empresa', desc: 'Registrate como empresa en segundos. Sin costo, sin compromiso.' },
    { icon: CreditCard, title: '2. Activá tu suscripción', desc: 'Elegí el plan que mejor se adapte a tu equipo. Desde $5.000/mes.' },
    { icon: Search, title: '3. Encontrá talento', desc: 'Accedé a nuestra base de candidatos con filtros avanzados.' },
    { icon: Users, title: '4. Conectá y contratá', desc: 'Contactá directo con los candidatos. Sin comisiones ni intermediarios.' },
  ];

  const benefits = [
    { icon: Search, title: 'Búsqueda avanzada de CVs', desc: 'Filtrá por profesión, ubicación, experiencia, skills, salario y más. Encontrá al candidato ideal en segundos.' },
    { icon: Users, title: 'Acceso a profesionales del marketplace', desc: 'Conectá con profesionales verificados que ofrecen servicios directos. Ideal para proyectos puntuales.' },
    { icon: FileText, title: 'CVs completos y actualizados', desc: 'Accedé al CV completo de cada candidato: experiencia, educación, skills, portfolio y datos de contacto.' },
    { icon: BarChart3, title: 'Estadísticas y reportes', desc: 'Panel con métricas de búsqueda, candidatos vistos, contactos realizados y más.' },
    { icon: Zap, title: 'Contacto directo sin comisiones', desc: 'Comunicate directamente con los candidatos vía chat. Sin comisiones por contratación.' },
    { icon: Shield, title: 'Candidatos verificados', desc: 'Todos los profesionales pasan por un proceso de verificación. Calidad y confianza garantizadas.' },
  ];

  const plans = [
    {
      name: 'Plan Profesional',
      price: '$5.000',
      period: '/mes',
      desc: 'Para emprendedores y pequeños equipos',
      features: ['Perfil de empresa visible', 'Búsqueda básica de CVs', 'Hasta 5 contactos por mes', 'Estadísticas básicas', 'Soporte por email'],
      cta: 'Comenzá gratis',
      href: '/register?role=company',
      popular: false
    },
    {
      name: 'Plan Empresa',
      price: '$20.000',
      period: '/mes',
      desc: 'Para equipos de RRHH y reclutamiento',
      features: ['Búsqueda avanzada de CVs', 'Acceso a CVs completos', 'Contacto ilimitado', 'Panel de administración', 'Soporte prioritario', 'Publicación de ofertas'],
      cta: 'Comenzá gratis',
      href: '/register?role=company',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-white/80 text-sm mb-6">
              <Crown size={16} />
              <span>Plataforma de reclutamiento inteligente</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Encontrá al profesional ideal para tu empresa
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
              Accedé a la base de currículums más completa de profesionales verificados.
              Búsqueda avanzada, contacto directo y sin comisiones de contratación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <Link to="/cv-search"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl"
                >
                  <Search size={20} />
                  Buscar candidatos ahora
                </Link>
              ) : (
                <Link to="/register?role=company"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl"
                >
                  <Building2 size={20} />
                  Crear cuenta empresa gratis
                </Link>
              )}
              <Link to="#benefits"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Conocer más <ChevronRight size={18} />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> Sin compromiso</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> 30 días gratis</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400" /> Cancelás cuando quieras</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '2,500+', label: 'Profesionales registrados' },
              { number: '15+', label: 'Categorías disponibles' },
              { number: '98%', label: 'Tasa de respuesta' },
              { number: '30 días', label: 'Prueba gratuita' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-gray-900">{s.number}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Cómo funciona</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Encontrá al profesional ideal en 4 pasos simples.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="text-primary-600" size={28} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Todo lo que necesitás para contratar</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Herramientas profesionales de reclutamiento en una sola plataforma.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-100 hover:shadow-sm transition-all">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="text-primary-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Planes para empresas</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Elegí el plan que mejor se adapte a tu equipo. Ambos incluyen 30 días de prueba gratuita.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`relative bg-white rounded-2xl border-2 p-8 ${plan.popular ? 'border-primary-500 shadow-xl' : 'border-gray-100 shadow-sm'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50'}`}
                >
                  {plan.cta} <ArrowRight size={16} className="inline ml-1" />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-sm text-gray-500">
              ¿Tenés un equipo grande?{' '}
              <Link to="/contacto" className="text-primary-600 font-medium hover:underline">Contactanos para planes personalizados</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Lo que dicen las empresas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Martín García', role: 'Director RRHH, TechSolutions', text: 'Encontrar talento calificado en tiempo récord. La búsqueda avanzada de CVs nos ahorró horas de selección.' },
              { name: 'Carolina López', role: 'CEO, Constructora del Plata', text: 'Necesitábamos profesionales para obras específicas. Con MiProfesional los encontramos en días, no en meses.' },
              { name: 'Andrés Martínez', role: 'Gerente, ServiExpress', text: 'La plataforma nos permitió acceder a candidatos que no están en otras bolsas de trabajo. Altamente recomendable.' },
            ].map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Empezá a encontrar talento hoy</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">30 días gratis, sin compromiso. Creá tu cuenta empresa en menos de 2 minutos.</p>
          {isAuthenticated ? (
            <Link to="/cv-search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              <Search size={20} />
              Buscar candidatos ahora
            </Link>
          ) : (
            <Link to="/register?role=company"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              <Building2 size={20} />
              Crear cuenta empresa gratis
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
