import { useState, useEffect } from 'react';
import { Bell, Globe, DollarSign, Trash2, Save } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [settings, setSettings] = useState(loadSettings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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
      setToast({ type: 'success', text: 'Configuración guardada correctamente.' });
    } catch {
      setToast({ type: 'error', text: 'Error al guardar la configuración.' });
    } finally {
      setSaving(false);
    }
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeleteAccount = () => {
    alert('Esta acción eliminará tu cuenta de forma permanente. Contacta con soporte para continuar.');
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition translate-y-0 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configuración</h1>

        {toast && (
          <div
            className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <span className="w-4 h-4 rounded-full bg-green-500" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-red-500" />
            )}
            {toast.text}
          </div>
        )}

        {/* Notifications */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Alertas por correo' },
              { key: 'smsAlerts', label: 'Alertas por SMS' },
              { key: 'pushNotifications', label: 'Notificaciones push' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{label}</span>
                <Toggle checked={settings[key]} onChange={() => update(key, !settings[key])} />
              </div>
            ))}
          </div>
        </section>

        {/* Language & Currency */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={20} className="text-primary-600" />
                <label className="text-sm font-medium text-gray-700">Idioma</label>
              </div>
              <select
                value={settings.language}
                onChange={(e) => update('language', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} className="text-primary-600" />
                <label className="text-sm font-medium text-gray-700">Moneda</label>
              </div>
              <select
                value={settings.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ARS">ARS (Peso argentino)</option>
                <option value="USD">USD (Dólar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="mb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Delete Account */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Eliminar cuenta</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Una vez eliminada, no podrás recuperar tu cuenta ni tus datos.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-red-300 text-red-600 bg-white hover:bg-red-50 transition"
          >
            Eliminar mi cuenta
          </button>
        </section>
      </div>
    </div>
  );
}
