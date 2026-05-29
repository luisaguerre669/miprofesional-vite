import React, { useState } from 'react';
import { Briefcase, Filter, MapPin, Search, Shield, UserRound } from 'lucide-react';
import api from '../lib/axios';

const levelLabel = {
  entry: 'Inicial',
  mid: 'Intermedia',
  senior: 'Senior',
  lead: 'Liderazgo'
};

export default function CandidateSearch() {
  const [filters, setFilters] = useState({ q: '', jobTitle: '', skills: '', location: '', experienceLevel: '' });
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const searchCandidates = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await api.get('/cv/search', { params: filters });
      setCandidates(response.data.data || []);
      if ((response.data.data || []).length === 0) setMessage('No se encontraron candidatos con esos filtros.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'No se pudo buscar candidatos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="text-primary-600" size={24} /> Buscar candidatos
          </h1>
          <p className="text-sm text-gray-500 mt-1">CVs visibles para empresas y reclutadores autorizados.</p>
        </div>
        <Shield size={22} className="text-gray-300" />
      </div>

      <form onSubmit={searchCandidates} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Buscar texto libre" className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm" />
        </div>
        <input value={filters.jobTitle} onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })} placeholder="Puesto" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        <input value={filters.skills} onChange={(e) => setFilters({ ...filters, skills: e.target.value })} placeholder="Skills, separadas por coma" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Ubicacion" className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={filters.experienceLevel} onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Experiencia</option>
          <option value="entry">Inicial</option>
          <option value="mid">Intermedia</option>
          <option value="senior">Senior</option>
          <option value="lead">Liderazgo</option>
        </select>
        <button type="submit" disabled={loading} className="md:col-span-4 lg:col-span-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <Filter size={16} /> {loading ? 'Buscando...' : 'Filtrar'}
        </button>
      </form>

      {message && <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((candidate) => (
          <article key={candidate._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden shrink-0">
                {candidate.photo ? <img src={candidate.photo} alt="" className="w-full h-full object-cover" /> : <UserRound className="text-primary-600" size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 truncate">{candidate.personalData?.fullName || 'Candidato'}</h2>
                <p className="text-sm text-primary-600 truncate">{candidate.personalData?.headline || candidate.jobTitles?.[0] || 'Sin titulo'}</p>
                <p className="text-xs text-gray-500 mt-1">{candidate.location?.city || '-'} {candidate.location?.state ? `, ${candidate.location.state}` : ''}</p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 h-fit">{levelLabel[candidate.experienceLevel] || 'Inicial'}</span>
            </div>
            {candidate.personalData?.summary && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{candidate.personalData.summary}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(candidate.skills || []).slice(0, 8).map((skill) => (
                <span key={skill.name} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-[11px] font-medium">{skill.name}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{candidate.availability?.status || 'a convenir'} · {candidate.availability?.mode || 'indistinto'}</span>
              <span>{candidate.visibility === 'public' ? 'Publico' : 'Reclutadores'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
