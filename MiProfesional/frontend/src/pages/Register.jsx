import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import {
  UserPlus, Shield, ArrowRight, CheckCircle, AlertCircle,
  Phone, Mail, Lock, User, Briefcase, Upload, Gift,
  FileText, Building2, Sparkles, Smartphone, Info, CreditCard
} from 'lucide-react';

const LICENSED_PROFESSIONS = [
  'medico-domicilio', 'medico', 'enfermero', 'terapeuta', 'psicologo-urgencia',
  'electricista', 'gasista', 'cerrajero-urgente', 'cerrajero'
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const roleParam = searchParams.get('role');

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    role: roleParam || 'client',
    profession: '', licenseNumber: '', licenseFile: null,
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneStep, setPhoneStep] = useState('none');
  const [registered, setRegistered] = useState(false);
  const [customProfession, setCustomProfession] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const isProfessional = formData.role === 'professional';
  const licenseRequired = isProfessional && LICENSED_PROFESSIONS.includes(formData.profession);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
    setError('');
  };

  const handleSendCode = async () => {
    if (!formData.phone) { setError('Ingresa tu numero de telefono'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-verification', { phone: formData.phone });
      if (res.data.success) setPhoneStep('verify');
      else setError(res.data.error || 'Error al enviar codigo');
    } catch { setError('Error de conexion'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const finalProfession = formData.profession === '__other__' ? customProfession : formData.profession;

    if (isProfessional && !finalProfession) {
      setError('Selecciona o escribe tu profesion');
      setLoading(false);
      return;
    }

    try {
      const result = await register(
        formData.name, formData.email, formData.password, formData.role,
        { phone: formData.phone, profession: finalProfession }
      );
      if (result.success) {
        if (isProfessional && licenseRequired && formData.licenseFile) {
          const form = new FormData();
          form.append('license', formData.licenseFile);
          await api.post('/upload/license', form, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }).catch(() => {});
        }
        if (isProfessional) {
          try {
            const prefRes = await api.post('/subscription/create-preference', { plan: selectedPlan });
            const initPoint = prefRes.data?.data?.initPoint || prefRes.data?.initPoint;
            if (initPoint) {
              window.location.href = initPoint;
              return;
            }
          } catch {}
          navigate('/subscriptions');
        } else {
          setRegistered(true);
        }
      } else {
        setError(result.error || 'Error al registrarse');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse');
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registro Exitoso</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu cuenta fue creada exitosamente. Revisa tu correo para verificar tu cuenta.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm">
              Iniciar Sesion <ArrowRight size={16} />
            </Link>
            <Link to="/search" className="text-primary-600 text-xs font-medium hover:underline">
              Explorar servicios mientras tanto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const PROFESSIONS = [
    { value: '', label: 'Selecciona tu profesion...' },
    { value: '__other__', label: 'Otra (escribir profesion)' },
    { group: 'Construccion', items: [
      { value: 'albanil', label: 'Albanil' },
      { value: 'plomero', label: 'Plomero' },
      { value: 'electricista', label: 'Electricista' },
      { value: 'gasista', label: 'Gasista' },
      { value: 'pintor', label: 'Pintor' },
      { value: 'carpintero', label: 'Carpintero' },
      { value: 'techista', label: 'Techista' },
      { value: 'herrero', label: 'Herrero' },
      { value: 'pisero', label: 'Pisero' },
      { value: 'yesero', label: 'Yesero' },
      { value: 'estructuras-metalicas', label: 'Estructuras Metalicas' },
    ]},
    { group: 'Servicios Generales', items: [
      { value: 'jardineria', label: 'Jardineria' },
      { value: 'limpieza', label: 'Limpieza' },
      { value: 'mudanzas', label: 'Mudanzas' },
      { value: 'fumigacion', label: 'Fumigacion / Control de Plagas' },
      { value: 'piletero', label: 'Piletero / Mantenimiento de Piletas' },
      { value: 'cerrajero', label: 'Cerrajero' },
    ]},
    { group: 'Emergencias 24/7', items: [
      { value: 'medico-domicilio', label: 'Medico a Domicilio' },
      { value: 'enfermero', label: 'Enfermero/a' },
      { value: 'psicologo-urgencia', label: 'Psicologo de Urgencia' },
      { value: 'ambulancia', label: 'Servicio de Ambulancia' },
      { value: 'vigilancia', label: 'Vigilancia Privada' },
    ]},
    { group: 'Hogar y Confort', items: [
      { value: 'decorador', label: 'Decorador de Interiores' },
      { value: 'arquitecto', label: 'Arquitecto' },
      { value: 'disenador-interiores', label: 'Disenador de Interiores' },
      { value: 'domotica', label: 'Domotica / Hogar Inteligente' },
      { value: 'tapicero', label: 'Tapicero' },
    ]},
    { group: 'Belleza y Cuidado', items: [
      { value: 'peluquero', label: 'Peluquero/a' },
      { value: 'manicura', label: 'Manicura / Unias' },
      { value: 'masajista', label: 'Masajista' },
      { value: 'cosmetologo', label: 'Cosmetologo/a' },
      { value: 'barbero', label: 'Barbero' },
      { value: 'maquillador', label: 'Maquillador/a' },
      { value: 'depilacion', label: 'Depilacion' },
      { value: 'personal-trainer', label: 'Personal Trainer / Instructor' },
    ]},
    { group: 'Gastronomia', items: [
      { value: 'chef', label: 'Chef / Cocinero/a' },
      { value: 'catering', label: 'Servicio de Catering' },
      { value: 'pastelero', label: 'Pastelero/a' },
      { value: 'bartender', label: 'Bartender / Cocteleria' },
      { value: 'eventos-gastronomicos', label: 'Eventos Gastronomicos' },
    ]},
    { group: 'Mascotas', items: [
      { value: 'veterinario', label: 'Veterinario/a' },
      { value: 'paseador', label: 'Paseador de Perros' },
      { value: 'peluquero-mascotas', label: 'Peluquero/a de Mascotas' },
      { value: 'adiestrador', label: 'Adiestrador/a' },
      { value: 'guarderia-mascotas', label: 'Guarderia de Mascotas' },
    ]},
    { group: 'Tecnologia', items: [
      { value: 'reparacion-pc', label: 'Reparacion de PC / Notebook' },
      { value: 'reparacion-celulares', label: 'Reparacion de Celulares' },
      { value: 'desarrollador', label: 'Desarrollador / Programador' },
      { value: 'disenador-web', label: 'Disenador Web / UX/UI' },
      { value: 'soporte-tecnico', label: 'Soporte Tecnico / Redes' },
      { value: 'instalacion-camaras', label: 'Instalacion de Camaras / Alarmas' },
    ]},
    { group: 'Automotor', items: [
      { value: 'mecanico', label: 'Mecanico Automotriz' },
      { value: 'electricista-auto', label: 'Electricista Automotriz' },
      { value: 'chapista', label: 'Chapista / Pintura' },
      { value: 'gomerias', label: 'Gomeria / Neumaticos' },
      { value: 'lavadero', label: 'Lavadero de Autos' },
      { value: 'cerrajero-auto', label: 'Cerrajero de Autos' },
    ]},
    { group: 'Transporte y Turismo', items: [
      { value: 'remis', label: 'Remis / Taxi' },
      { value: 'flete', label: 'Flete / Camioneta' },
      { value: 'tour-guide', label: 'Guia de Turismo' },
      { value: 'transporte-escolar', label: 'Transporte Escolar' },
      { value: 'viajes-egresados', label: 'Viajes de Egresados' },
    ]},
    { group: 'Empresas', items: [
      { value: 'contador', label: 'Contador/a' },
      { value: 'abogado', label: 'Abogado/a' },
      { value: 'seguros', label: 'Productor de Seguros' },
      { value: 'marketing', label: 'Marketing / Publicidad' },
      { value: 'fotografo', label: 'Fotografo/a' },
      { value: 'traductor', label: 'Traductor/a' },
      { value: 'community-manager', label: 'Community Manager' },
      { value: 'video-editor', label: 'Editor de Video' },
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
            <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isProfessional ? 'Registrate como profesional' : 'Registrate como cliente'}
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
                  ><User size={16} className="inline mr-1.5 -mt-0.5" /> Cliente</button>
                  <button type="button" onClick={() => { setFormData(prev => ({ ...prev, role: 'professional' })); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      formData.role === 'professional' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  ><Briefcase size={16} className="inline mr-1.5 -mt-0.5" /> Profesional</button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="name" type="text" required value={formData.name} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Tu nombre" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electronico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="email" type="email" required value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="tu@email.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contrasena</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="password" type="password" required minLength={6} value={formData.password} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Minimo 6 caracteres" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefono <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="+54 11 1234-5678" />
                  </div>
                  {formData.phone && phoneStep === 'none' && (
                    <button type="button" onClick={handleSendCode}
                      className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    ><Smartphone size={13} /> Verificar telefono</button>
                  )}
                  {phoneStep === 'verify' && (
                    <div className="mt-2 flex gap-2">
                      <input type="text" maxLength={6} value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center tracking-[6px] font-mono"
                        placeholder="000000" />
                      <button type="button" onClick={handleSendCode}
                        className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
                      >Verificar</button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Professional Details */}
            {step === 2 && isProfessional && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Profesion</label>
                  <select name="profession" value={formData.profession} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="">Selecciona tu profesion...</option>
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

                {formData.profession === '__other__' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Escribe tu profesion</label>
                    <input name="customProfession" value={customProfession} onChange={e => setCustomProfession(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      placeholder="Ej: Musicoterapeuta, Organizador de Eventos..." />
                  </div>
                )}

                {licenseRequired && (
                  <>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Tu profesion requiere matricula obligatoria. Subi una foto de tu matricula para verificar tu identidad profesional.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero de Matricula</label>
                      <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Ej: MP 12345" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto de Matricula / Documento</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                        <input type="file" name="licenseFile" accept="image/*,.pdf" onChange={handleChange}
                          className="hidden" id="licenseFile" />
                        <label htmlFor="licenseFile" className="cursor-pointer">
                          <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            {formData.licenseFile ? formData.licenseFile.name : 'Click para subir foto de matricula'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG o PDF max 10MB</p>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Step 3: Legal & Finish */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Shield size={16} className="text-primary-600" /> Terminos Legales
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>La plataforma no garantiza trabajo a los profesionales registrados.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>La plataforma no gestiona pagos entre clientes y profesionales.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>La plataforma no interviene en las transacciones acordadas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      <span>Toda relacion contractual es exclusivamente entre el cliente y el profesional.</span>
                    </li>
                  </ul>
                </div>

                {isProfessional && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500 p-4 text-center">
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white rounded-full" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-white text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Gift size={12} /> Primer mes GRATIS para nuevos profesionales
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800">
                        <strong className="text-amber-900">Suscripcion obligatoria:</strong> Elegi un plan para activar tu perfil profesional en el marketplace.
                        Despues del pago vas a poder completar tu perfil.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setSelectedPlan('monthly')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPlan === 'monthly' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <p className="text-sm font-semibold text-gray-900">Plan Mensual</p>
                        <p className="text-lg font-bold text-primary-600">$10.000</p>
                        <p className="text-xs text-gray-500">/ mes — Probar gratis</p>
                      </button>
                      <button type="button" onClick={() => setSelectedPlan('semester')}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          selectedPlan === 'semester' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">15% OFF</span>
                        <p className="text-sm font-semibold text-gray-900">Plan Semestral</p>
                        <p className="text-xs text-gray-400 line-through">$60.000</p>
                        <p className="text-lg font-bold text-emerald-600 -mt-0.5">$51.000</p>
                        <p className="text-xs text-gray-500">/ 6 meses — Suscribirme</p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    {isProfessional
                      ? 'Despues del registro seras redirigido a Mercado Pago para completar el pago. Una vez aprobado, tu perfil se activara automaticamente y podras completar tus datos.'
                      : 'Despues del registro, recibiras un correo de verificacion. Tu cuenta no sera visible hasta que verifiques tu correo.'}
                    {isProfessional && licenseRequired && ' Ademas, tu matricula debe ser verificada por nuestro equipo.'}
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-600">
                    Acepto los terminos y condiciones. Entiendo que MiProfesional es solo una plataforma de conexion y no garantiza trabajo, no gestiona pagos ni interviene en transacciones.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
                >Atras</button>
              )}
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm"
                >Continuar</button>
              ) : (
                <button type="submit" disabled={loading || !formData.acceptTerms}
                  className="flex-1 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >{loading ? 'Creando cuenta...' : 'Crear Cuenta'}</button>
              )}
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Ya tenes una cuenta?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Inicia sesion</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
