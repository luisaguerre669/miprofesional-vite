import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import CVForm from '../components/cv/CVForm';
import {
  Briefcase, CheckCircle, ChevronDown, ChevronRight, Mail, MapPin,
  Phone, Save, Store, Home, Monitor, Smartphone, User, Layers, Tag
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isProfessional, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [professional, setProfessional] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    street: user?.address?.street || '',
    number: user?.address?.number || '',
    neighborhood: user?.address?.neighborhood || '',
    city: user?.address?.city || '',
    province: user?.address?.state || ''
  });
  const [proForm, setProForm] = useState({
    businessName: '',
    profession: '',
    description: '',
    specialties: '',
    hourlyRate: '',
    phone: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    primaryCategory: '',
    commerceType: '',
    subCategory: '',
    tags: '',
  });
  const [available24h, setAvailable24h] = useState(false);
  const [availabilityFlags, setAvailabilityFlags] = useState({
    disponible24hs: false,
    disponibleFinesDeSemana: false,
    disponibleFeriados: false,
    atencionInmediata: false,
    servicioADomicilio: false,
  });
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedWorkModalities, setSelectedWorkModalities] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const MODALITIES = [
    { key: 'local', label: 'Local fisico', icon: Store },
    { key: 'home_service', label: 'A domicilio', icon: Home },
    { key: 'online', label: 'Online', icon: Monitor },
    { key: 'mobile', label: 'Movil', icon: Smartphone },
  ];

  useEffect(() => {
    api.get('/categories?limit=50').then(r => setAllCategories(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        street: user.address?.street || '',
        number: user.address?.number || '',
        neighborhood: user.address?.neighborhood || '',
        city: user.address?.city || '',
        province: user.address?.state || ''
      });
    }
    if (isProfessional) {
      fetchProfessional();
    }
  }, [user]);

  const fetchProfessional = async () => {
    try {
      const response = await api.get('/professionals');
      const pro = (response.data.data || []).find(p => p.userId?._id === user?.id || p.userId === user?.id);
      if (pro) {
        setProfessional(pro);
        setAvailable24h(pro.available24h || false);
        setAvailabilityFlags({
          disponible24hs: pro.disponible24hs || false,
          disponibleFinesDeSemana: pro.disponibleFinesDeSemana || false,
          disponibleFeriados: pro.disponibleFeriados || false,
          atencionInmediata: pro.atencionInmediata || false,
          servicioADomicilio: pro.servicioADomicilio || false,
        });
        setSelectedCategories(pro.categories || []);
        setSelectedWorkModalities(pro.workModalities || []);
        setProForm({
          businessName: pro.businessName || '',
          profession: pro.profession || '',
          description: pro.description || '',
          specialties: (pro.specialties || []).join(', '),
          hourlyRate: pro.pricing?.hourlyRate || '',
          phone: pro.contact?.phone || '',
          address: pro.location?.address || '',
          neighborhood: pro.location?.neighborhood || '',
          city: pro.location?.city || '',
          state: pro.location?.state || '',
          primaryCategory: pro.primaryCategory || '',
          commerceType: pro.commerceType || '',
          subCategory: pro.subCategory || '',
          tags: (pro.tags || []).join(', '),
        });
      }
    } catch (error) {
      console.error('Error fetching professional:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: formData.name,
      phone: formData.phone,
      address: {
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.province,
        country: 'Argentina'
      }
    };
    if (formData.location) payload.location = formData.location;
    const result = await updateProfile(payload);
    setMessage(result.success ? 'Perfil actualizado' : result.error);
    setSaving(false);
  };

  const handleProUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let coordinates;
      if (proForm.address || proForm.city) {
        try {
          const geoRes = await api.get('/professionals/geocode', {
            params: { address: proForm.address, city: proForm.city, state: proForm.state, country: 'Argentina' }
          });
          if (geoRes.data?.success && geoRes.data?.data) {
            coordinates = { type: 'Point', coordinates: [geoRes.data.data.longitude, geoRes.data.data.latitude] };
          }
        } catch {
          // geocoding non-critical; backend will re-try on save
        }
      }

      const payload = {
        businessName: proForm.businessName,
        profession: proForm.profession,
        description: proForm.description,
        specialties: proForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
        primaryCategory: proForm.primaryCategory || undefined,
        commerceType: proForm.commerceType || undefined,
        subCategory: proForm.subCategory || undefined,
        tags: proForm.tags ? proForm.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        categories: selectedCategories,
        workModalities: selectedWorkModalities,
        available24h,
        ...availabilityFlags,
        pricing: { hourlyRate: Number(proForm.hourlyRate) },
        contact: { phone: proForm.phone },
        location: {
          address: proForm.address, neighborhood: proForm.neighborhood, city: proForm.city, state: proForm.state, country: 'Argentina',
          ...(coordinates ? { coordinates } : {})
        }
      };

      if (professional) {
        await api.put(`/professionals/${professional._id}`, payload);
        setMessage('Perfil profesional actualizado');
        fetchProfessional();
      } else {
        await api.post('/professionals', payload);
        setMessage('Perfil profesional creado. Ahora suscribite para activarlo.');
        setTimeout(() => navigate('/subscriptions'), 1500);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center"><User className="mr-2" size={20} /> Información Personal</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" value={formData.email} disabled className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Calle" />
                </div>
                <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-24 px-3 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Número" />
              </div>
              <input type="text" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Barrio (opcional)" />
              <div className="flex gap-2">
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm" placeholder="Ciudad" />
                <select value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Provincia</option>
                  {['CABA','Buenos Aires','Catamarca','Chaco','Chubut','Cordoba','Corrientes','Entre Rios','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquen','Rio Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
            <Save size={18} className="mr-2" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      {isProfessional && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center"><Briefcase className="mr-2" size={20} /> Perfil Profesional</h2>
          {professional?.verification?.isVerified && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center text-green-800">
              <CheckCircle size={18} className="mr-2" /> Perfil verificado
            </div>
          )}
          <form onSubmit={handleProUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
                <input type="text" value={proForm.businessName} onChange={(e) => setProForm({ ...proForm, businessName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Mi Negocio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
                <input type="text" value={proForm.profession} onChange={(e) => setProForm({ ...proForm, profession: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Ej: Plomero" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={proForm.description} onChange={(e) => setProForm({ ...proForm, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg" rows={3} placeholder="Describe tus servicios..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades (separadas por coma)</label>
              <input type="text" value={proForm.specialties} onChange={(e) => setProForm({ ...proForm, specialties: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Ej: Gas, Electricidad, Reparaciones" />
            </div>

            {/* Multi-Category Selector */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <div>
                <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5"><Layers size={14} /> Categorias del Negocio</p>
                <p className="text-xs text-gray-500">Selecciona una o mas categorias donde aparece tu negocio</p>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {allCategories.filter(c => !c.parentId).map(cat => (
                  <div key={cat._id} className="border border-gray-100 rounded-lg">
                    <button type="button" onClick={() => setExpandedCats(p => ({ ...p, [cat._id]: !p[cat._id] }))}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <span>{cat.title}</span>
                      {expandedCats[cat._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {expandedCats[cat._id] && (cat.subcategories || allCategories.filter(s => s.parentId === cat._id)).map(sub => (
                      <label key={sub._id || sub.slug} className={`flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-all ${
                        selectedCategories.some(s => s.subcategoryId === (sub._id || sub.slug)) ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}>
                        <input type="checkbox" checked={selectedCategories.some(s => s.subcategoryId === (sub._id || sub.slug))}
                          onChange={() => {
                            setSelectedCategories(prev => {
                              const exists = prev.some(s => s.subcategoryId === (sub._id || sub.slug));
                              if (exists) return prev.filter(s => s.subcategoryId !== (sub._id || sub.slug));
                              return [...prev, { categoryId: cat._id, subcategoryId: sub._id || sub.slug }];
                            });
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                        />
                        <span className="text-sm text-gray-600">{sub.title}</span>
                      </label>
                    ))}
                    {!expandedCats[cat._id] && (
                      <label className="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={selectedCategories.some(s => s.categoryId === cat._id)}
                          onChange={() => {
                            setSelectedCategories(prev => {
                              const exists = prev.some(s => s.categoryId === cat._id);
                              if (exists) return prev.filter(s => s.categoryId !== cat._id);
                              return [...prev, { categoryId: cat._id, subcategoryId: null }];
                            });
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                        />
                        <span className="text-sm text-gray-600">{cat.title} (categoria completa)</span>
                      </label>
                    )}
                  </div>
                ))}
                {allCategories.length === 0 && <p className="text-xs text-gray-400 py-2 text-center">Cargando categorias...</p>}
              </div>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategories.map((sc, i) => {
                    const cat = allCategories.find(c => c._id === sc.categoryId);
                    const sub = cat?.subcategories?.find(s => (s._id || s.slug) === sc.subcategoryId) || allCategories.find(c => c._id === sc.subcategoryId);
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-medium rounded-md">
                        {cat?.title}{sub ? ` → ${sub.title}` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Work Modalities */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
              <p className="font-medium text-gray-900 text-sm">Modalidades de atencion</p>
              <p className="text-xs text-gray-500">¿Como ofreces tus servicios?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODALITIES.map(mod => {
                  const ModIcon = mod.icon;
                  return (
                    <label key={mod.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      selectedWorkModalities.includes(mod.key) ? 'bg-white border-primary-300' : 'bg-white/50 border-gray-200'
                    }`}>
                      <input type="checkbox" checked={selectedWorkModalities.includes(mod.key)}
                        onChange={() => setSelectedWorkModalities(prev =>
                          prev.includes(mod.key) ? prev.filter(k => k !== mod.key) : [...prev, mod.key]
                        )}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                      />
                      <ModIcon size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{mod.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Marketplace Fields */}
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
              <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5"><Store size={14} /> Marketplace</p>
              <p className="text-xs text-gray-500">Configura los datos de tu comercio o empresa</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Perfil</label>
                  <select value={proForm.primaryCategory} onChange={e => setProForm({ ...proForm, primaryCategory: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Seleccionar</option>
                    <option value="professional">Profesional</option>
                    <option value="empresa">Empresa</option>
                    <option value="comercio">Comercio</option>
                  </select>
                </div>
                {proForm.primaryCategory === 'comercio' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Comercio</label>
                      <select value={proForm.commerceType} onChange={e => setProForm({ ...proForm, commerceType: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Seleccionar</option>
                        <option value="minorista">Minorista</option>
                        <option value="mayorista">Mayorista</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría</label>
                      <input type="text" value={proForm.subCategory} onChange={e => setProForm({ ...proForm, subCategory: e.target.value })}
                        placeholder="Ej: Pizzería, Farmacia"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
                      <input type="text" value={proForm.tags} onChange={e => setProForm({ ...proForm, tags: e.target.value })}
                        placeholder="Ej: 24hs, envios, delivery"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Marketplace Fields */}
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
              <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5"><Store size={14} /> Marketplace</p>
              <p className="text-xs text-gray-500">Configura los datos de tu comercio o empresa</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Perfil</label>
                  <select value={proForm.primaryCategory} onChange={e => setProForm({ ...proForm, primaryCategory: e.target.value })}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Seleccionar</option>
                    <option value="professional">Profesional</option>
                    <option value="empresa">Empresa</option>
                    <option value="comercio">Comercio</option>
                  </select>
                </div>
                {proForm.primaryCategory === 'comercio' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Comercio</label>
                      <select value={proForm.commerceType} onChange={e => setProForm({ ...proForm, commerceType: e.target.value })}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Seleccionar</option>
                        <option value="minorista">Minorista</option>
                        <option value="mayorista">Mayorista</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría</label>
                      <input type="text" value={proForm.subCategory} onChange={e => setProForm({ ...proForm, subCategory: e.target.value })}
                        placeholder="Ej: Pizzería, Farmacia"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
                      <input type="text" value={proForm.tags} onChange={e => setProForm({ ...proForm, tags: e.target.value })}
                        placeholder="Ej: 24hs, envios, delivery"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa por hora ($)</label>
                <input type="number" value={proForm.hourlyRate} onChange={(e) => setProForm({ ...proForm, hourlyRate: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
                <input type="text" value={proForm.phone} onChange={(e) => setProForm({ ...proForm, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" value={proForm.address} onChange={(e) => setProForm({ ...proForm, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Calle y número" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                <input type="text" value={proForm.neighborhood} onChange={(e) => setProForm({ ...proForm, neighborhood: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Opcional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                <input type="text" value={proForm.city} onChange={(e) => setProForm({ ...proForm, city: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <select value={proForm.state} onChange={(e) => setProForm({ ...proForm, state: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white" required>
                  <option value="">Seleccionar</option>
                  {['CABA','Buenos Aires','Catamarca','Chaco','Chubut','Cordoba','Corrientes','Entre Rios','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquen','Rio Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">Servicios 24/7</p>
                <p className="text-xs text-gray-500">Marcá las opciones para aparecer en la seccion de emergencias y urgencias</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'disponible24hs', label: 'Disponible 24 hs' },
                  { key: 'atencionInmediata', label: 'Atencion inmediata' },
                  { key: 'servicioADomicilio', label: 'Servicio a domicilio' },
                  { key: 'disponibleFinesDeSemana', label: 'Fines de semana' },
                  { key: 'disponibleFeriados', label: 'Feriados' },
                ].map(opt => (
                  <label key={opt.key} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    availabilityFlags[opt.key] ? 'bg-white border-red-300' : 'bg-white/50 border-red-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={availabilityFlags[opt.key]}
                      onChange={() => setAvailabilityFlags(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                      className="rounded border-gray-300 text-red-500 focus:ring-red-400"
                    />
                    <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
              <Save size={18} className="mr-2" /> {saving ? 'Guardando...' : (professional ? 'Actualizar Perfil' : 'Crear Perfil')}
            </button>
          </form>
        </div>
      )}

      <CVForm compact />
    </div>
  );
};

export default Profile;
