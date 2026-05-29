import React, { useEffect, useState } from 'react';
import { Briefcase, Camera, GraduationCap, MapPin, Save, Shield, Sparkles, User } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';

const emptyCv = {
  visibility: 'private',
  personalData: { fullName: '', email: '', phone: '', headline: '', summary: '' },
  photo: '',
  jobTitles: [],
  skills: [],
  experience: [],
  education: [],
  availability: { status: 'a-convenir', mode: 'indistinto', hours: 'full-time' },
  location: { city: '', state: '', country: 'Argentina' },
  experienceLevel: 'entry'
};

const parseList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);

const parseRows = (value, mapper) => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => mapper(line.split('|').map((item) => item.trim())));

const formatExperience = (items = []) => items
  .map((item) => [item.jobTitle, item.company, item.startDate?.slice?.(0, 10), item.endDate?.slice?.(0, 10), item.description].filter(Boolean).join(' | '))
  .join('\n');

const formatEducation = (items = []) => items
  .map((item) => [item.degree, item.institution, item.field, item.startDate?.slice?.(0, 10), item.endDate?.slice?.(0, 10)].filter(Boolean).join(' | '))
  .join('\n');

export default function CVForm({ compact = false }) {
  const { user } = useAuth();
  const [cv, setCv] = useState(emptyCv);
  const [skillText, setSkillText] = useState('');
  const [jobTitleText, setJobTitleText] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [educationText, setEducationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/cv/me')
      .then((response) => {
        if (!mounted) return;
        const data = response.data.data;
        const initial = data || {
          ...emptyCv,
          personalData: {
            fullName: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            headline: '',
            summary: ''
          },
          location: {
            city: user?.address?.city || '',
            state: user?.address?.state || '',
            country: 'Argentina'
          }
        };
        setCv(initial);
        setJobTitleText((initial.jobTitles || []).join(', '));
        setSkillText((initial.skills || []).map((skill) => skill.name).join(', '));
        setExperienceText(formatExperience(initial.experience));
        setEducationText(formatEducation(initial.education));
      })
      .catch(() => setMessage('No se pudo cargar tu CV.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [user]);

  const setPersonal = (key, value) => setCv((current) => ({
    ...current,
    personalData: { ...current.personalData, [key]: value }
  }));

  const setLocation = (key, value) => setCv((current) => ({
    ...current,
    location: { ...current.location, [key]: value }
  }));

  const setAvailability = (key, value) => setCv((current) => ({
    ...current,
    availability: { ...current.availability, [key]: value }
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      ...cv,
      jobTitles: parseList(jobTitleText),
      skills: parseList(skillText).map((name) => ({ name, level: 'intermedio' })),
      experience: parseRows(experienceText, ([jobTitle, company, startDate, endDate, description]) => ({
        jobTitle, company, startDate: startDate || null, endDate: endDate || null, description, current: !endDate
      })),
      education: parseRows(educationText, ([degree, institution, field, startDate, endDate]) => ({
        degree, institution, field, startDate: startDate || null, endDate: endDate || null, current: !endDate
      }))
    };

    try {
      const response = await api.put('/cv/me', payload);
      setCv(response.data.data);
      setMessage('CV guardado correctamente.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al guardar el CV.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="bg-white border border-gray-100 rounded-xl p-5 text-sm text-gray-500">Cargando CV...</div>;
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase size={20} className="text-primary-600" /> Curriculum Vitae
          </h2>
          <p className="text-xs text-gray-500 mt-1">Disponible en la app movil para busquedas laborales.</p>
        </div>
        <Shield size={20} className="text-gray-300" />
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') || message.includes('No se') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Nombre completo</span>
            <input value={cv.personalData?.fullName || ''} onChange={(e) => setPersonal('fullName', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Email</span>
            <input value={cv.personalData?.email || ''} onChange={(e) => setPersonal('email', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Telefono</span>
            <input value={cv.personalData?.phone || ''} onChange={(e) => setPersonal('phone', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Foto URL</span>
            <div className="relative">
              <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={cv.photo || ''} onChange={(e) => setCv({ ...cv, photo: e.target.value })} className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm" />
            </div>
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-gray-600">Titulo profesional</span>
          <input value={cv.personalData?.headline || ''} onChange={(e) => setPersonal('headline', e.target.value)} placeholder="Ej: Administrativo contable, desarrollador React" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-gray-600">Resumen</span>
          <textarea value={cv.personalData?.summary || ''} onChange={(e) => setPersonal('summary', e.target.value)} rows={compact ? 3 : 4} className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Puestos buscados</span>
            <input value={jobTitleText} onChange={(e) => setJobTitleText(e.target.value)} placeholder="Ventas, Soporte, Diseno" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Habilidades</span>
            <input value={skillText} onChange={(e) => setSkillText(e.target.value)} placeholder="Excel, React, Atencion al cliente" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Visibilidad</span>
            <select value={cv.visibility} onChange={(e) => setCv({ ...cv, visibility: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="private">Privado</option>
              <option value="recruiter-only">Solo reclutadores</option>
              <option value="public">Publico</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Experiencia</span>
            <select value={cv.experienceLevel} onChange={(e) => setCv({ ...cv, experienceLevel: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="entry">Inicial</option>
              <option value="mid">Intermedia</option>
              <option value="senior">Senior</option>
              <option value="lead">Liderazgo</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Disponibilidad</span>
            <select value={cv.availability?.status || 'a-convenir'} onChange={(e) => setAvailability('status', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="inmediata">Inmediata</option>
              <option value="15-dias">15 dias</option>
              <option value="30-dias">30 dias</option>
              <option value="a-convenir">A convenir</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Modalidad</span>
            <select value={cv.availability?.mode || 'indistinto'} onChange={(e) => setAvailability('mode', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="indistinto">Indistinto</option>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="hibrido">Hibrido</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Ciudad</span>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={cv.location?.city || ''} onChange={(e) => setLocation('city', e.target.value)} className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm" />
            </div>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Provincia</span>
            <input value={cv.location?.state || ''} onChange={(e) => setLocation('state', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
          </label>
        </div>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><Sparkles size={14} /> Experiencia</span>
          <textarea value={experienceText} onChange={(e) => setExperienceText(e.target.value)} rows={compact ? 3 : 5} placeholder="Puesto | Empresa | 2022-01-01 | 2024-01-01 | Tareas y logros" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        </label>

        <label className="space-y-1 block">
          <span className="text-xs font-medium text-gray-600 flex items-center gap-1"><GraduationCap size={14} /> Educacion</span>
          <textarea value={educationText} onChange={(e) => setEducationText(e.target.value)} rows={compact ? 2 : 4} placeholder="Titulo | Institucion | Area | 2018-01-01 | 2021-01-01" className="w-full p-3 border border-gray-300 rounded-lg text-sm" />
        </label>

        <button type="submit" disabled={saving} className="w-full md:w-auto px-5 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
          <Save size={18} /> {saving ? 'Guardando...' : 'Guardar CV'}
        </button>
      </form>
    </section>
  );
}
