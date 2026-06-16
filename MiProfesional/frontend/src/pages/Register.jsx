import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import DOMPurify from 'dompurify';
import {
  UserPlus, Shield, ArrowRight, CheckCircle, AlertCircle,
  Phone, Mail, Lock, User, Briefcase, Upload, Gift,
  FileText, Building2, Sparkles, Smartphone, Info, CreditCard, MapPin, AlertTriangle, Store, Tag
} from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

const LICENSED_PROFESSIONS = [
  'medicos-247', 'medico-domicilio', 'medico', 'enfermeros-247', 'enfermero', 'terapeuta', 'terapeutas-247', 'psicologos-guardia', 'psicologo-247',
  'electricistas-247', 'electricista', 'gasistas-247', 'gasista', 'cerrajeros-247', 'cerrajero-urgente', 'cerrajero',
  'paramedicos', 'veterinarios-urgencia'
];

function validatePassword(pw) {
  const errors = [];
  if (!pw || pw.length < 8) errors.push('Debe tener al menos 8 caracteres');
  if (!/[A-Z]/.test(pw)) errors.push('Debe contener al menos una mayúscula');
  if (!/[0-9]/.test(pw)) errors.push('Debe contener al menos un número');
  return errors;
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { t } = useTranslation('auth');
  const roleParam = searchParams.get('role');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    role: roleParam || 'client',
    profession: '', licenseNumber: '', licenseFile: null,
    street: '', number: '', neighborhood: '', city: '', province: '',
    latitude: '', longitude: '',
    acceptTerms: false,
    available24h: false,
    disponible24hs: false,
    disponibleFinesDeSemana: false,
    disponibleFeriados: false,
    atencionInmediata: false,
    servicioADomicilio: false,
    primaryCategory: '',
    commerceType: '',
    subCategory: '',
    tags: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('none');
  const [registered, setRegistered] = useState(false);
  const [customProfession, setCustomProfession] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [categories, setCategories] = useState([]);
  const isProfessional = formData.role === 'professional';
  const licenseRequired = isProfessional && LICENSED_PROFESSIONS.includes(formData.profession);

  useEffect(() => {
    api.get('/categories?limit=50').then(r => {
      const data = r.data?.data || r.data?.categories || [];
      setCategories(Array.isArray(data) ? data : []);
    }).catch(e => console.error('Error al cargar categorías:', e));
  }, []);

  useEffect(() => {
    if (isProfessional && formData.profession && findGroupForProfession(formData.profession) === '24-7') {
      setFormData(prev => ({ ...prev, available24h: true }));
    }
  }, [formData.profession, isProfessional]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    const rawValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : typeof value === 'string' ? value : value;
    const sanitizedValue = name === 'password' ? rawValue : (typeof rawValue === 'string' ? DOMPurify.sanitize(rawValue.trim()) : rawValue);
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    setError('');
    
    if (name === 'password') {
      setPasswordErrors(validatePassword(sanitizedValue));
    }
  };

  const handleSendCode = async () => {
    if (!formData.phone) { setError(t('register.errorPhoneRequired')); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-verification', { phone: DOMPurify.sanitize(formData.phone.trim()) });
      if (res.data.success) setPhoneStep('verify');
      else setError(res.data.error || t('login.errorSendCode'));
    } catch { setError(t('login.errorConnection')); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    console.log("BUILD VERSION:", "__BUILD_20260612_REGISTER_FIX__");
    // Step 1
    console.log('[FLOW] Step 1 - handleSubmit iniciado');
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalProfession = formData.profession === '__other__' ? customProfession : formData.profession;

    if (isProfessional && !finalProfession) {
      console.error('[FLOW] Registro cancelado: profesión requerida');
      setError(t('register.errorProfessionRequired'));
      setLoading(false);
      return;
    }

    // Step 2
    console.log('[FLOW] Step 2 - validaciones completadas');

    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      console.error('[FLOW] Registro cancelado: contraseña inválida', passwordValidationErrors);
      setError('La contraseña no cumple con los requisitos de seguridad');
      setPasswordErrors(passwordValidationErrors);
      setLoading(false);
      return;
    }

    const mapCoords = formData.latitude && formData.longitude ? {
      type: 'Point',
      coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
    } : undefined;

    const address = formData.street || formData.city || mapCoords ? {
      street: formData.street,
      number: formData.number,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.province,
      country: 'Argentina',
      ...(mapCoords && { coordinates: mapCoords })
    } : undefined;

    const catId = isProfessional ? findCategoryId(finalProfession) : undefined;
    const subId = isProfessional && catId ? findSubcategoryId(finalProfession, catId) : undefined;

    if (isProfessional && !catId) {
      console.error('[FLOW] Registro cancelado: categoría requerida');
      setError(t('register.errorCategoryRequired'));
      setLoading(false);
      return;
    }

    try {
      const traceId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'trace-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      console.log('[FLOW] traceId:', traceId);
      console.log('[FLOW] Step 3 - llamando register()');

      const sanitizedData = {
        name: DOMPurify.sanitize(formData.name.trim()),
        email: DOMPurify.sanitize(formData.email.trim().toLowerCase()),
        password: formData.password,
        phone: formData.phone ? DOMPurify.sanitize(formData.phone.trim()) : undefined,
        role: formData.role,
        profession: finalProfession,
        categories: catId ? [{ categoryId: catId, subcategoryId: subId || null }] : [],
        available24h: formData.available24h,
        disponible24hs: formData.disponible24hs,
        disponibleFinesDeSemana: formData.disponibleFinesDeSemana,
        disponibleFeriados: formData.disponibleFeriados,
        atencionInmediata: formData.atencionInmediata,
        servicioADomicilio: formData.servicioADomicilio,
        primaryCategory: findGroupForProfession(formData.profession) === 'Comercios' ? 'comercio' : 'professional',
        commerceType: formData.commerceType || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        address,
        termsAccepted: formData.acceptTerms
      };

      const safeLog = { ...sanitizedData, password: '***HIDDEN***' };
      console.log('[FLOW] Payload:', JSON.stringify(safeLog));
      
      console.log('[FLOW] Invocando AuthContext.register');
      const result = await register(
        sanitizedData.name, sanitizedData.email, sanitizedData.password, sanitizedData.role,
        { phone: sanitizedData.phone, profession: sanitizedData.profession, categories: sanitizedData.categories, available24h: sanitizedData.available24h, disponible24hs: sanitizedData.disponible24hs, disponibleFinesDeSemana: sanitizedData.disponibleFinesDeSemana, disponibleFeriados: sanitizedData.disponibleFeriados, atencionInmediata: sanitizedData.atencionInmediata, servicioADomicilio: sanitizedData.servicioADomicilio, primaryCategory: sanitizedData.primaryCategory, commerceType: sanitizedData.commerceType, tags: sanitizedData.tags, address: sanitizedData.address, termsAccepted: sanitizedData.termsAccepted, traceId }
      );
      console.log('[FLOW] Step 4 - register() finalizado');
      if (result.success) {
        console.log('[FLOW] Step 5 - respuesta procesada: éxito');
        if (result.requiresEmailVerification) {
          setRegistered(true);
          setLoading(false);
          return;
        }
        if (isProfessional && licenseRequired && formData.licenseFile) {
          const form = new FormData();
          form.append('license', formData.licenseFile);
          await api.post('/upload/license', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }).catch(e => console.error('Error al subir licencia:', e));
        }
        if (isProfessional) {
          navigate('/dashboard/professional');
        } else if (formData.role === 'company') {
          navigate('/dashboard/company');
        } else {
          navigate('/');
        }
      } else {
        console.log('[FLOW] Step 5 - respuesta procesada: fallo', result.error);
        setError(result.error || t('register.errorRegistration'));
      }
    } catch (err) {
      console.error('[FLOW] Step 5 - excepción no capturada:', err);
      const httpStatus = err.response?.status || 0;
      const responseData = err.response?.data || {};
      console.log('[FLOW] Detalles HTTP', httpStatus, ':', JSON.stringify(responseData));
      setError(responseData.message || responseData.error || t('register.errorRegistration'));
    }
    setLoading(false);
  };

  if (registered) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('register.successTitle')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('register.successMessage')}</p>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm">
              {t('register.goToLogin')} <ArrowRight size={16} />
            </Link>
            <Link to="/search" className="text-primary-600 text-xs font-medium hover:underline">
              {t('register.exploreServices')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const GROUP_TO_SLUG = {
    'Construccion': 'construccion-y-hogar',
    'Servicios Generales': 'servicios-generales',
    '24-7': 'servicios-24-7',
    'Hogar y Confort': 'hogar-diseno',
    'Belleza y Cuidado': 'belleza-y-cuidado',
    'Bienestar y Deporte': 'bienestar-y-deportes',
    'Mascotas': 'mascotas',
    'Tecnologia': 'tecnologia',
    'Automotor': 'automotores',
    'Transporte y Turismo': 'transporte',
    'Empresas': 'legales-y-administracion',
    'Comercios': 'comercio',
  };

  const categoriesBySlug = {};
  categories.forEach(c => { categoriesBySlug[c.slug] = c; });

  const findGroupForProfession = (professionValue) => {
    for (const g of PROFESSIONS) {
      if (!g.group) continue;
      if (g.items.some(item => item.value === professionValue)) return g.group;
    }
    return null;
  };

  const findCategoryId = (professionValue) => {
    const groupName = findGroupForProfession(professionValue);
    if (!groupName) return undefined;
    const slug = GROUP_TO_SLUG[groupName];
    if (!slug) return undefined;
    const cat = categoriesBySlug[slug];
    return cat?._id;
  };

  const findSubcategoryId = (professionValue, catId) => {
    const cat = categories.find(c => c._id === catId);
    if (!cat || !cat.subcategories) return undefined;
    const exact = cat.subcategories.find(s => s.slug === professionValue);
    if (exact) return exact._id;
    const partial = cat.subcategories.find(s => s.slug.includes(professionValue) || professionValue.includes(s.slug));
    return partial?._id;
  };

  const PROFESSIONS = [
    { value: '', label: t('register.professionSelect') },
    { value: '__other__', label: t('register.professionOther') },
    { group: 'Construccion', items: [
      { value: 'albanil', label: 'Albañil' },
      { value: 'plomero', label: 'Plomero' },
      { value: 'electricista', label: 'Electricista' },
      { value: 'gasista', label: 'Gasista' },
      { value: 'pintor', label: 'Pintor' },
      { value: 'carpintero', label: 'Carpintero' },
      { value: 'techista', label: 'Techista' },
      { value: 'herrero', label: 'Herrero' },
      { value: 'pisero', label: 'Pisero' },
      { value: 'yesero', label: 'Yesero' },
      { value: 'estructuras-metalicas', label: 'Estructuras Metálicas' },
    ]},
    { group: 'Servicios Generales', items: [
      { value: 'jardineria', label: 'Jardinería' },
      { value: 'limpieza', label: 'Limpieza' },
      { value: 'mudanzas', label: 'Mudanzas' },
      { value: 'fumigacion', label: 'Fumigación / Control de Plagas' },
      { value: 'piletero', label: 'Piletero / Mantenimiento de Piletas' },
      { value: 'cerrajero', label: 'Cerrajero' },
    ]},
    { group: '24-7', items: [
      { value: 'medicos-247', label: 'Médicos 24/7' },
      { value: 'enfermeros-247', label: 'Enfermeros 24/7' },
      { value: 'paramedicos', label: 'Paramédicos' },
      { value: 'cuidadores-adultos-mayores', label: 'Cuidadores de Adultos Mayores' },
      { value: 'acompanantes-terapeuticos-247', label: 'Acompañantes Terapéuticos' },
      { value: 'psicologos-guardia', label: 'Psicólogos de Guardia' },
      { value: 'terapeutas-247', label: 'Terapeutas 24/7' },
      { value: 'mecanicos-emergencia', label: 'Mecánicos de Emergencia' },
      { value: 'auxilio-mecanico-247', label: 'Auxilio Mecánico' },
      { value: 'gruas-remolques', label: 'Grúas y Remolques' },
      { value: 'cerrajeros-247', label: 'Cerrajeros 24/7' },
      { value: 'electricistas-247', label: 'Electricistas 24/7' },
      { value: 'plomeros-247', label: 'Plomeros 24/7' },
      { value: 'gasistas-247', label: 'Gasistas 24/7' },
      { value: 'vidrieros-247', label: 'Vidrieros 24/7' },
      { value: 'destapaciones', label: 'Destapaciones' },
      { value: 'vigiladores', label: 'Vigiladores' },
      { value: 'veterinarios-urgencia', label: 'Veterinarios de Urgencia' },
      { value: 'traslado-mascotas', label: 'Traslado de Mascotas' },
      { value: 'transporte-urgente', label: 'Transporte Urgente' },
      { value: 'mensajeria-cadeteria', label: 'Mensajería y Cadetería' },
      { value: 'fletes-emergencia', label: 'Fletes de Emergencia' },
    ]},
    { group: 'Hogar y Confort', items: [
      { value: 'decorador', label: 'Decorador de Interiores' },
      { value: 'arquitecto', label: 'Arquitecto' },
      { value: 'disenador-interiores', label: 'Diseñador de Interiores' },
      { value: 'domotica', label: 'Domótica / Hogar Inteligente' },
      { value: 'tapicero', label: 'Tapicero' },
    ]},
    { group: 'Belleza y Cuidado', items: [
      { value: 'peluquero', label: 'Peluquero/a' },
      { value: 'manicuria', label: 'Manicuría' },
      { value: 'unas', label: 'Uñas / Esculpidas' },
      { value: 'masajista', label: 'Masajista' },
      { value: 'cosmetologo', label: 'Cosmetólogo/a' },
      { value: 'barbero', label: 'Barbero' },
      { value: 'maquillador', label: 'Maquillador/a' },
      { value: 'depilacion', label: 'Depilación' },
    ]},
    { group: 'Bienestar y Deporte', items: [
      { value: 'personal-trainer', label: 'Personal Trainer / Instructor' },
      { value: 'yoga', label: 'Profesor de Yoga' },
      { value: 'pilates', label: 'Instructor de Pilates' },
      { value: 'entrenador', label: 'Entrenador Funcional' },
      { value: 'coach', label: 'Coach Personal' },
    ]},
    { group: 'Gastronomia', items: [
      { value: 'chef', label: 'Chef / Cocinero/a' },
      { value: 'catering', label: 'Servicio de Catering' },
      { value: 'pastelero', label: 'Pastelero/a' },
      { value: 'bartender', label: 'Bartender / Coctelería' },
      { value: 'eventos-gastronomicos', label: 'Eventos Gastronómicos' },
    ]},
    { group: 'Mascotas', items: [
      { value: 'veterinario', label: 'Veterinario/a' },
      { value: 'paseador', label: 'Paseador de Perros' },
      { value: 'peluquero-mascotas', label: 'Peluquero/a de Mascotas' },
      { value: 'adiestrador', label: 'Adiestrador/a' },
      { value: 'guarderia-mascotas', label: 'Guardería de Mascotas' },
    ]},
    { group: 'Tecnologia', items: [
      { value: 'reparacion-pc', label: 'Reparación de PC / Notebook' },
      { value: 'reparacion-celulares', label: 'Reparación de Celulares' },
      { value: 'desarrollador', label: 'Desarrollador / Programador' },
      { value: 'disenador-web', label: 'Diseñador Web / UX/UI' },
      { value: 'soporte-tecnico', label: 'Soporte Técnico / Redes' },
      { value: 'instalacion-camaras', label: 'Instalación de Cámaras / Alarmas' },
    ]},
    { group: 'Automotor', items: [
      { value: 'mecanico', label: 'Mecánico Automotriz' },
      { value: 'electricista-auto', label: 'Electricista Automotriz' },
      { value: 'chapista', label: 'Chapista / Pintura' },
      { value: 'gomerias', label: 'Gomería / Neumáticos' },
      { value: 'lavadero', label: 'Lavadero de Autos' },
      { value: 'cerrajero-auto', label: 'Cerrajero de Autos' },
    ]},
    { group: 'Transporte y Turismo', items: [
      { value: 'remis', label: 'Remis / Taxi' },
      { value: 'flete', label: 'Flete / Camioneta' },
      { value: 'tour-guide', label: 'Guía de Turismo' },
      { value: 'transporte-escolar', label: 'Transporte Escolar' },
      { value: 'viajes-egresados', label: 'Viajes de Egresados' },
    ]},
    { group: 'Empresas', items: [
      { value: 'contador', label: 'Contador/a' },
      { value: 'abogado', label: 'Abogado/a' },
      { value: 'seguros', label: 'Productor de Seguros' },
      { value: 'marketing', label: 'Marketing / Publicidad' },
      { value: 'fotografo', label: 'Fotógrafo/a' },
      { value: 'traductor', label: 'Traductor/a' },
      { value: 'community-manager', label: 'Community Manager' },
      { value: 'video-editor', label: 'Editor de Video' },
    ]},
    { group: 'Comercios', items: [
      { value: 'comercio-minorista', label: 'Comercio Minorista' },
      { value: 'comercio-mayorista', label: 'Comercio Mayorista' },
      { value: 'comercio-mixto', label: 'Comercio Mixto' },
      { value: 'pizzeria', label: 'Pizzería' },
      { value: 'farmacia', label: 'Farmacia' },
      { value: 'panaderia', label: 'Panadería' },
      { value: 'veterinaria', label: 'Veterinaria' },
      { value: 'optica', label: 'Óptica' },
      { value: 'cafeteria', label: 'Cafetería' },
      { value: 'kiosco', label: 'Kiosco' },
      { value: 'rotiseria', label: 'Rotisería' },
      { value: 'heladeria', label: 'Heladería' },
      { value: 'confiteria', label: 'Confitería' },
      { value: 'carniceria', label: 'Carnicería' },
      { value: 'verduleria', label: 'Verdulería' },
      { value: 'floreria', label: 'Florería' },
      { value: 'libreria', label: 'Librería' },
      { value: 'ferreteria', label: 'Ferretería' },
      { value: 'jugueteria', label: 'Juguetería' },
      { value: 'bazar', label: 'Bazar' },
      { value: 'muebleria', label: 'Mueblería' },
      { value: 'electrodomesticos', label: 'Electrodomésticos' },
      { value: 'almacen', label: 'Almacén' },
      { value: 'dietetica', label: 'Dietética' },
      { value: 'vinoteca', label: 'Vinoteca' },
      { value: 'supermercado-chino', label: 'Supermercado / Autoservicio' },
    ]},
  ];

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('register.title')}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {formData.role === 'company' ? t('register.subtitleCompany') : isProfessional ? t('register.subtitleProfessional') : t('register.subtitleClient')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, role: 'client' })); setStep(1); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      formData.role === 'client' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  ><User size={16} className="inline mr-1.5 -mt-0.5" /> {t('register.clientType')}</button>
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, role: 'professional' })); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      formData.role === 'professional' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  ><Briefcase size={16} className="inline mr-1.5 -mt-0.5" /> {t('register.professionalType')}</button>
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, role: 'company' })); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      formData.role === 'company' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  ><Building2 size={16} className="inline mr-1.5 -mt-0.5" /> {t('register.companyType')}</button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.nameLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="name" type="text" required value={formData.name} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder={t('register.namePlaceholder')} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.emailLabel')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="email" type="email" required value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder={t('register.emailPlaceholder')} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.passwordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="password" type="password" required minLength={8} value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder={t('register.passwordPlaceholder')} />
                  </div>
                  {passwordErrors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600 space-y-0.5">
                      {passwordErrors.map((err, i) => <div key={i}>• {err}</div>)}
                    </div>
                  )}
                  {formData.password && passwordErrors.length === 0 && (
                    <div className="mt-2 text-xs text-green-600">✓ Contraseña segura</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('register.phoneLabel')} <span className="text-gray-400 font-normal">{t('register.phoneOptional')}</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder={t('register.phonePlaceholder')} />
                  </div>
                  {formData.phone && phoneStep === 'none' && (
                    <button type="button" onClick={handleSendCode}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    ><Smartphone size={13} /> {t('register.verifyPhone')}</button>
                  )}
                  {phoneStep === 'verify' && (
                    <div className="mt-2 flex gap-2">
                      <input type="text" maxLength={6} value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center tracking-[6px] font-mono"
                        placeholder="000000" />
                      <button type="button" onClick={handleSendCode}
                        className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
                      >{t('register.verify')}</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Professional Details */}
            {step === 2 && isProfessional && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.professionLabel')}</label>
                  <select name="profession" value={formData.profession} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
                  >
                    {PROFESSIONS.filter(p => !p.group).map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                    {PROFESSIONS.filter(g => g.group).map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.items.map(item => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Commerce-specific fields */}
                {findGroupForProfession(formData.profession) === 'Comercios' && (
                  <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Store size={16} className="text-amber-600" />
                      <p className="text-sm font-semibold text-gray-900">Información del Comercio</p>
                    </div>
                    {/* Auto-detect commerceType from profession */}
                    {(() => {
                      const detectedType = formData.profession === 'comercio-minorista' ? 'minorista'
                        : formData.profession === 'comercio-mayorista' ? 'mayorista'
                        : formData.profession === 'comercio-mixto' ? 'mixto'
                        : null;
                      return detectedType ? (
                        <input type="hidden" name="commerceType" value={detectedType} />
                      ) : null;
                    })()}
                    {/* Manual commerceType for specific business types */}
                    {!['comercio-minorista', 'comercio-mayorista', 'comercio-mixto'].includes(formData.profession) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Comercio</label>
                        <div className="flex gap-2">
                          {['minorista', 'mayorista', 'mixto'].map(type => (
                            <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, commerceType: type }))}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                formData.commerceType === type
                                  ? 'border-amber-500 bg-amber-100 text-amber-800'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              {type === 'minorista' ? 'Minorista' : type === 'mayorista' ? 'Mayorista' : 'Mixto'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags del comercio (opcional)</label>
                      <input type="text" value={formData.tags} onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="Ej: 24hs, envios, delivery (separados por coma)"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                )}

                {formData.profession === '__other__' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.professionCustomLabel')}</label>
                    <input name="customProfession" value={customProfession} onChange={e => setCustomProfession(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder={t('register.professionCustomPlaceholder')} />
                  </div>
                )}

                {licenseRequired && (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{t('register.licenseRequired')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.licenseNumberLabel')}</label>
                      <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder={t('register.licenseNumberPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.licenseFileLabel')}</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                        <input type="file" name="licenseFile" accept="image/*,.pdf" onChange={handleChange}
                          className="hidden" id="licenseFile" />
                        <label htmlFor="licenseFile" className="cursor-pointer">
                          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            {formData.licenseFile ? formData.licenseFile.name : t('register.licenseFileClick')}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{t('register.licenseFileHint')}</p>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Disponibilidad y Servicios */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div className="flex-1">
                      <label className="font-semibold text-gray-900 text-sm block mb-1">
                        {t('register.emergencyServices')}
                      </label>
                      <p className="text-xs text-gray-500 mb-3">{t('register.emergencyDesc')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { key: 'disponible24hs', label: t('register.available247'), desc: t('register.available247Desc') },
                          { key: 'atencionInmediata', label: t('register.immediateAttention'), desc: t('register.immediateAttentionDesc') },
                          { key: 'servicioADomicilio', label: t('register.homeService'), desc: t('register.homeServiceDesc') },
                          { key: 'disponibleFinesDeSemana', label: t('register.weekends'), desc: t('register.weekendsDesc') },
                          { key: 'disponibleFeriados', label: t('register.holidays'), desc: t('register.holidaysDesc') },
                        ].map(opt => (
                          <label
                            key={opt.key}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                              formData[opt.key]
                                ? 'bg-red-50 border-red-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData[opt.key]}
                              onChange={() => setFormData(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                              className="mt-0.5 rounded border-gray-300 text-red-500 focus:ring-red-400"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                              <p className="text-[11px] text-gray-400">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Address (with map) + Legal & Finish */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-primary-600" /> {t('register.locationTitle')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t('register.locationSubtitle')}</p>
                  </div>
                  <div className="p-4">
                    <LocationPicker
                      onLocationChange={({ lat, lng, address, city, state }) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                          city: city || prev.city,
                          province: state || prev.province,
                        }));
                      }}
                      height="280px"
                      compact
                    />
                  </div>
                  <div className="px-4 pb-4 space-y-2">
                    <div className="flex gap-2">
                      <input name="street" value={formData.street} onChange={handleChange}
                        placeholder={t('register.streetPlaceholder')} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <input name="number" value={formData.number} onChange={handleChange}
                        placeholder={t('register.numberPlaceholder')} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <input name="neighborhood" value={formData.neighborhood} onChange={handleChange}
                      placeholder={t('register.neighborhoodPlaceholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <div className="flex gap-2">
                      <input name="city" value={formData.city} onChange={handleChange}
                        placeholder={t('register.cityPlaceholder')} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <select name="province" value={formData.province} onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                        <option value="">{t('register.provincePlaceholder')}</option>
                        {['CABA','Buenos Aires','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Shield size={16} className="text-primary-600" /> {t('register.legalTitle')}
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>{t('register.legalItem1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>{t('register.legalItem2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>{t('register.legalItem3')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>{t('register.legalItem4')}</span>
                    </li>
                  </ul>
                </div>

                {isProfessional && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-4 text-center">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white rounded-full" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Gift size={12} /> 60 días gratis para los primeros 700 suscriptores.
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800">
                        <strong className="text-amber-900">{t('register.subscriptionRequired')}</strong>
                      </p>
                    </div>
                    {(() => {
                      const primaryCat = findGroupForProfession(formData.profession);
                      const isComercio = primaryCat === 'Comercios';
                      const planPrice = isComercio ? '$10.000' : '$5.000';
                      const planLabel = isComercio ? 'Plan Comercio' : 'Plan Profesional';
                      const planDesc = isComercio ? 'Ideal para pizzerías, farmacias, panaderías y más' : 'Accedé a todas las funciones profesionales';
                      if (isComercio) {
                        return (
                          <div className="p-4 rounded-xl border-2 border-amber-100 bg-amber-50/50">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{planLabel}</p>
                                <p className="text-xs text-gray-500">{planDesc}</p>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Recurrente</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className="text-lg font-bold text-gray-900">{planPrice}</p>
                              <p className="text-xs text-gray-400">/mes</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Cancelá cuando quieras. Sin permanencia.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="p-4 rounded-xl border-2 border-primary-100 bg-primary-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{planLabel}</p>
                              <p className="text-xs text-gray-500">{planDesc}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">Recurrente</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <p className="text-lg font-bold text-gray-900">{planPrice}</p>
                            <p className="text-xs text-gray-400">/mes</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Cancelá cuando quieras. Sin permanencia.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      {isProfessional
                        ? t('register.postRegisterProfessional')
                        : t('register.postRegisterClient')}
                    {isProfessional && licenseRequired && ' ' + t('register.licenseVerification')}
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-600">
                    {t('register.acceptTerms')}{' '}
                    <Link to="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 font-medium underline">
                      {t('register.termsLink')}
                    </Link>{' '}
                    {t('register.termsDescription')}
                  </span>
                </label>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(isProfessional ? step - 1 : 1)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                >{t('register.back')}</button>
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(isProfessional ? step + 1 : 3)}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm"
                >{t('register.continue')}</button>
              ) : (
                <button type="submit" disabled={loading || !formData.acceptTerms}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >{loading ? t('register.creating') : t('register.createAccount')}</button>
              )}
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              {t('register.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">{t('register.loginLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
