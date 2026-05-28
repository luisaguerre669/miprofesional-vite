import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Save, Briefcase, CheckCircle, Camera } from 'lucide-react';

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
    state: ''
  });
  const [available24h, setAvailable24h] = useState(false);

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
          state: pro.location?.state || ''
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
        available24h,
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="font-medium text-gray-900 text-sm">Disponible 24/7</label>
                <p className="text-xs text-gray-500">Marcá si atendés urgencias fuera del horario comercial</p>
              </div>
              <button type="button" onClick={() => setAvailable24h(!available24h)}
                className={`relative w-12 h-6 rounded-full transition-colors ${available24h ? 'bg-primary-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${available24h ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center">
              <Save size={18} className="mr-2" /> {saving ? 'Guardando...' : (professional ? 'Actualizar Perfil' : 'Crear Perfil')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
