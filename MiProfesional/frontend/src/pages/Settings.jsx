import { useState, useEffect } from 'react';
import { Bell, Globe, DollarSign, Trash2, Save, AlertTriangle, X } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'miprofesional_settings';

const defaults = {
  emailAlerts: true,
  smsAlerts: false,
  pushNotifications: true,
  language: 'es',
  currency: 'ARS',
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      await api.put('/users/profile', { preferences: settings });
      setToast({ type: 'success', text: 'Configuracion guardada correctamente.' });
    } catch {
      setToast({ type: 'error', text: 'Error al guardar la configuracion.' });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/');
    } catch {
      setToast({ type: 'error', text: 'Error al eliminar la cuenta.' });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.text}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold">Eliminar cuenta</h3>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Esta accion es irreversible. Se desactivara tu cuenta y no podras acceder nuevamente.</p>
            <p className="text-sm text-gray-500 mb-6">Todos tus datos seran desactivados permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Si, eliminar mi cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuracion</h1>

      <div className="space-y-6">
        {/* Notifications */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Alertas por email</p><p className="text-xs text-gray-500">Recibi notificaciones por correo</p></div>
              <Toggle checked={settings.emailAlerts} onChange={(v) => update('emailAlerts', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Alertas por SMS</p><p className="text-xs text-gray-500">Recibi notificaciones por mensaje de texto</p></div>
              <Toggle checked={settings.smsAlerts} onChange={(v) => update('smsAlerts', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-900">Notificaciones push</p><p className="text-xs text-gray-500">Recibi notificaciones en el navegador</p></div>
              <Toggle checked={settings.pushNotifications} onChange={(v) => update('pushNotifications', v)} />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preferencias</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
              <select value={settings.language} onChange={(e) => update('language', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select value={settings.currency} onChange={(e) => update('currency', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500" >
                <option value="ARS">ARS (Peso argentino)</option>
                <option value="USD">USD (Dolar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="mb-6">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed" >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Delete Account */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Dar de baja la cuenta</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Al dar de baja tu cuenta, no podras acceder nuevamente. Todos tus datos seran desactivados.
          </p>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition" >
            Dar de baja mi cuenta
          </button>
        </section>
      </div>
    </div>
  );
}
