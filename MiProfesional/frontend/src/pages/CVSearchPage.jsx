import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, Tag, UserRound, ShieldOff, CreditCard, ArrowLeft, ArrowRight, X, SlidersHorizontal, Crown, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'por-proyecto', label: 'Por proyecto' }
];

const LEVEL_LABEL = { entry: 'Inicial', mid: 'Intermedia', senior: 'Senior', lead: 'Liderazgo' };

export default function CVSearchPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    jobTitle: '', location: '', experienceYears: '', availability: '',
    skills: '', salaryMin: '', salaryMax: '', ageMin: '', ageMax: ''
  });
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const limit = 20;

  const isCompanyOrEmployer = user?.role === 'company' || user?.role === 'employer';
  const subscriptionActive = user?.subscription?.status === 'active';
  const canSearch = user?.role === 'admin' || (isCompanyOrEmployer && subscriptionActive);

  const searchCvs = async (p = page) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = { page: p, limit };
      if (filters.jobTitle) params.jobTitle = filters.jobTitle;
      if (filters.location) params.location = filters.location;
      if (filters.experienceYears) {
        params.experienceYearsMin = filters.experienceYears;
      }
      if (filters.availability) params.availability = filters.availability;
      if (filters.skills) params.skills = filters.skills;
      if (filters.salaryMin) params.salaryMin = filters.salaryMin;
      if (filters.salaryMax) params.salaryMax = filters.salaryMax;
      if (filters.ageMin) params.ageMin = filters.ageMin;
      if (filters.ageMax) params.ageMax = filters.ageMax;

      const response = await api.get('/cv/search', { params });
      setResults(response.data.data || []);
      setTotalCount(response.data.meta?.count || 0);
    } catch (err) {
      if (results.length === 0) setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    searchCvs(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  const clearFilters = () => {
    setFilters({ jobTitle: '', location: '', experienceYears: '', availability: '', skills: '', salaryMin: '', salaryMax: '', ageMin: '', ageMax: '' });
    setPage(1);
    setResults([]);
    setSearched(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Blocking screen for unauthorized
  if (!canSearch) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <ShieldOff size={40} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso exclusivo para empresas</h1>
          <p className="text-gray-500 leading-relaxed">
            La búsqueda avanzada de currículums está disponible solo para empresas con suscripción activa.
            {!isCompanyOrEmployer
              ? ' Cambiá tu cuenta a un plan empresa para acceder a esta funcionalidad.'
              : ' Tu suscripción actual no está activa. Renová tu plan para continuar.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/subscriptions"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all"
            >
              <CreditCard size={18} />
              Ver planes
            </Link>
            {!isCompanyOrEmployer && (
              <Link to="/settings"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all"
              >
                <Crown size={18} />
                Convertirme en empresa
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="text-primary-600" size={26} />
              Buscador de Currículums
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount > 0
                ? `${totalCount} candidatos encontrados`
                : 'Encontrá profesionales calificados para tu empresa'}
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>

        <div className="flex gap-6">
          {/* Filter Panel - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5 sticky top-24">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-gray-400" />
                  Filtros
                </h2>
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs text-primary-600 hover:underline">Limpiar</button>
                )}
              </div>

              <FilterGroup label="Puesto / Profesión" icon={Briefcase}>
                <input type="text" value={filters.jobTitle} onChange={e => setFilters({ ...filters, jobTitle: e.target.value })}
                  placeholder="Ej: Electricista, Plomero..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FilterGroup>

              <FilterGroup label="Ubicación" icon={MapPin}>
                <input type="text" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Ciudad o provincia"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FilterGroup>

              <FilterGroup label="Skills" icon={Tag}>
                <input type="text" value={filters.skills} onChange={e => setFilters({ ...filters, skills: e.target.value })}
                  placeholder="Separadas por coma"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FilterGroup>

              <FilterGroup label="Experiencia mínima (años)" icon={Clock}>
                <input type="number" min="0" value={filters.experienceYears} onChange={e => setFilters({ ...filters, experienceYears: e.target.value })}
                  placeholder="0"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FilterGroup>

              <FilterGroup label="Disponibilidad" icon={Calendar}>
                <select value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FilterGroup>

              <FilterGroup label="Edad" icon={UserRound}>
                <div className="flex gap-2">
                  <input type="number" min="18" value={filters.ageMin} onChange={e => setFilters({ ...filters, ageMin: e.target.value })}
                    placeholder="Mín"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input type="number" min="18" value={filters.ageMax} onChange={e => setFilters({ ...filters, ageMax: e.target.value })}
                    placeholder="Máx"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </FilterGroup>

              <FilterGroup label="Salario pretendido" icon={DollarSign}>
                <div className="flex gap-2">
                  <input type="number" min="0" value={filters.salaryMin} onChange={e => setFilters({ ...filters, salaryMin: e.target.value })}
                    placeholder="Mín"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input type="number" min="0" value={filters.salaryMax} onChange={e => setFilters({ ...filters, salaryMax: e.target.value })}
                    placeholder="Máx"
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </FilterGroup>

              <button type="submit" disabled={loading}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
              >
                <Search size={16} />
                {loading ? 'Buscando...' : 'Buscar CVs'}
              </button>
            </form>
          </aside>

          {/* Mobile Filter Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Filtros</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={(e) => { handleSubmit(e); setShowMobileFilters(false); }} className="p-4 space-y-4">
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} className="text-sm text-primary-600 hover:underline">Limpiar filtros</button>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puesto / Profesión</label>
                    <input type="text" value={filters.jobTitle} onChange={e => setFilters({ ...filters, jobTitle: e.target.value })}
                      placeholder="Ej: Electricista, Plomero..." className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input type="text" value={filters.location} onChange={e => setFilters({ ...filters, location: e.target.value })}
                      placeholder="Ciudad o provincia" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <input type="text" value={filters.skills} onChange={e => setFilters({ ...filters, skills: e.target.value })}
                      placeholder="Separadas por coma" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia mínima (años)</label>
                    <input type="number" min="0" value={filters.experienceYears} onChange={e => setFilters({ ...filters, experienceYears: e.target.value })}
                      placeholder="0" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilidad</label>
                    <select value={filters.availability} onChange={e => setFilters({ ...filters, availability: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
                      {AVAILABILITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                    <div className="flex gap-2">
                      <input type="number" min="18" value={filters.ageMin} onChange={e => setFilters({ ...filters, ageMin: e.target.value })}
                        placeholder="Mín" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                      <input type="number" min="18" value={filters.ageMax} onChange={e => setFilters({ ...filters, ageMax: e.target.value })}
                        placeholder="Máx" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salario pretendido ($)</label>
                    <div className="flex gap-2">
                      <input type="number" min="0" value={filters.salaryMin} onChange={e => setFilters({ ...filters, salaryMin: e.target.value })}
                        placeholder="Mín" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                      <input type="number" min="0" value={filters.salaryMax} onChange={e => setFilters({ ...filters, salaryMax: e.target.value })}
                        placeholder="Máx" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <Search size={16} />
                    {loading ? 'Buscando...' : 'Buscar CVs'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Results Panel */}
          <div className="flex-1 min-w-0">
            {/* Quick search bar for mobile */}
            <div className="lg:hidden mb-4">
              <div className="relative" onKeyDown={handleKeyDown}>
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={filters.jobTitle}
                  onChange={e => setFilters({ ...filters, jobTitle: e.target.value })}
                  placeholder="Buscar por puesto o profesión..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16" />
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-6 bg-gray-200 rounded w-14" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && searched && results.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron candidatos</h3>
                <p className="text-sm text-gray-500">Probá con otros filtros o ampliá los criterios de búsqueda.</p>
              </div>
            )}

            {/* Initial state */}
            {!loading && !searched && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <Briefcase size={28} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Buscador de Currículums</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Usá los filtros del panel izquierdo para encontrar profesionales calificados. Ajustá tus criterios y presioná "Buscar CVs".
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <>
                <div className="space-y-4">
                  {results.map(cv => (
                    <CvCard key={cv._id} cv={cv} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { const np = page - 1; setPage(np); searchCvs(np); }}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={16} />
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500">
                    Página {page}
                  </span>
                  <button
                    onClick={() => { const np = page + 1; setPage(np); searchCvs(np); }}
                    disabled={results.length < limit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
        <Icon size={14} className="text-gray-400" />
        {label}
      </label>
      {children}
    </div>
  );
}

function CvCard({ cv }) {
  const [imgError, setImgError] = useState(false);
  const topSkills = (cv.skills || []).slice(0, 5);
  const name = cv.personalData?.fullName || 'Candidato';
  const title = cv.personalData?.headline || cv.jobTitles?.[0] || 'Sin título profesional';
  const city = cv.location?.city || '';
  const state = cv.location?.state || '';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
          {cv.photo && !imgError ? (
            <img src={cv.photo} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <UserRound className="text-primary-600" size={24} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-primary-600 truncate">{title}</p>
            </div>
            <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              {LEVEL_LABEL[cv.experienceLevel] || 'Inicial'}
            </span>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            {(city || state) && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {city}{city && state ? ', ' : ''}{state}
              </span>
            )}
            {cv.experienceYears != null && cv.experienceYears >= 0 && (
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                {cv.experienceYears} {cv.experienceYears === 1 ? 'año' : 'años'} de exp.
              </span>
            )}
            {cv.age && (
              <span className="flex items-center gap-1">
                <UserRound size={12} />
                {cv.age} años
              </span>
            )}
            {cv.availability?.hours && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {AVAILABILITY_LABELS[cv.availability.hours] || cv.availability.hours}
              </span>
            )}
            {cv.expectedSalary != null && (
              <span className="flex items-center gap-1">
                <DollarSign size={12} />
                ${cv.expectedSalary.toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Skills */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {topSkills.map(skill => (
                <span key={skill.name}
                  className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-[11px] font-medium"
                >
                  {skill.name}
                </span>
              ))}
              {cv.skills.length > 5 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[11px] font-medium">
                  +{cv.skills.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-3">
        <Link to={`/cv/${cv._id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition-all"
        >
          Ver CV
        </Link>
        <Link to={`/chat/${cv.userId?._id || cv.userId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all"
        >
          Contactar
        </Link>
        {cv.personalData?.summary && (
          <p className="text-xs text-gray-400 truncate flex-1 ml-2 hidden sm:block">{cv.personalData.summary}</p>
        )}
      </div>
    </div>
  );
}

const AVAILABILITY_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'freelance': 'Freelance',
  'por-proyecto': 'Por proyecto'
};
