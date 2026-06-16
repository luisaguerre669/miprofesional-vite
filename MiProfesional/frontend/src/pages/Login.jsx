import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { LogIn, Mail, Lock, AlertCircle, Chrome, Smartphone, ArrowLeft, CheckCircle, Building2, Briefcase, User, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, checkAuth, initialized, isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState('email');
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [accountType, setAccountType] = useState('client');
  const [deferringAuth, setDeferringAuth] = useState(false);
  const [mountedAt] = useState(Date.now());
  const renderCount = React.useRef(0);
  renderCount.current++;
  console.log(`[LOGIN] Render #${renderCount.current} | init=${initialized} | auth=${isAuthenticated} | role=${user?.role || 'none'} | defer=${deferringAuth}`);

  // ---- If already authenticated and initialized, redirect to home ----
  useEffect(() => {
    if (initialized && isAuthenticated) {
      console.log(`[LOGIN] Already authenticated (role=${user?.role}), redirecting to /`);
      if (user?.role === 'company' || user?.role === 'employer') navigate('/dashboard/company', { replace: true });
      else if (user?.role === 'professional') navigate('/dashboard/professional', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [initialized, isAuthenticated]);

  // ---- Read URL params for verification/error messages ----
  useEffect(() => {
    const verified = searchParams.get('verified');
    const errorParam = searchParams.get('error');
    if (verified === 'true') setSuccess('Correo verificado exitosamente. Ya podes iniciar sesion.');
    if (verified === 'false') setError('El enlace de verificacion es invalido o ha expirado.');
    if (errorParam === 'google_auth_failed') setError('La autenticacion con Google fallo. Intenta de nuevo.');
    if (errorParam === 'google_not_configured') setError('El inicio de sesion con Google no esta habilitado temporalmente. Usa email y contrasena.');
  }, [searchParams]);

  // ---- Google callback: save token + verify via checkAuth ----
  const tokenParam = searchParams.get('token');
  const providerParam = searchParams.get('provider');
  useEffect(() => {
    if (!tokenParam) return;
    console.log(`[LOGIN] Google callback effect — token=${tokenParam.slice(0, 12)}… | init=${initialized} | auth=${isAuthenticated}`);
    localStorage.setItem('token', tokenParam);
    localStorage.setItem('user', JSON.stringify({ authProvider: providerParam || 'google' }));
    if (!initialized) {
      console.log('[LOGIN] Auth not initialized yet, will retry when init completes');
      return;
    }
    if (isAuthenticated && user) {
      console.log(`[LOGIN] Already authenticated as ${user.email || user._id}, navigating`);
      navigate('/', { replace: true });
      return;
    }
    console.log(`[LOGIN] Calling checkAuth...`);
    setDeferringAuth(true);
    checkAuth().then(usr => {
      setDeferringAuth(false);
      if (usr) {
        console.log(`[LOGIN] checkAuth OK — user=${usr.email || usr._id}, navigating to /`);
        navigate('/', { replace: true });
      } else {
        console.warn('[LOGIN] checkAuth failed — token invalid or expired');
        setError('Error al verificar tu sesión. Intenta iniciar sesión nuevamente.');
      }
    });
  }, [initialized, tokenParam, isAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);

    const safetyTimer = setTimeout(() => {
      setLocalLoading(false);
      setError('El servidor esta iniciando. Esperá unos segundos e intentá nuevamente.');
    }, 65000);

    if (mode === 'email') {
      console.log(`[LOGIN] handleSubmit — calling login()`);
      const result = await login(formData.email, formData.password);
      clearTimeout(safetyTimer);
      if (result.success) {
        const role = result.role;
        console.log(`[LOGIN] login OK — role=${role}, navigating`);
        if (role === 'company' || role === 'employer') navigate('/dashboard/company', { replace: true });
        else if (role === 'professional') navigate('/dashboard/professional', { replace: true });
        else navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    }
    setLocalLoading(false);
  };

  const handleSendCode = async () => {
    if (!formData.phone) { setError('Ingresa tu numero de telefono'); return; }
    setLocalLoading(true);
    try {
      const res = await api.post('/auth/send-verification', { phone: formData.phone });
      if (res.data.success) setCodeSent(true);
      else setError(res.data.error || 'Error al enviar codigo');
    } catch { setError('Error de conexion'); }
    setLocalLoading(false);
  };

  const handleVerifyCode = async () => {
    setLocalLoading(true);
    try {
      const res = await api.post('/auth/verify-phone', { phone: formData.phone, code: formData.code });

      if (res.data.success) {
        const result = await login(formData.phone, '');
        if (result.success) navigate('/', { replace: true });
        else setError(result.error);
      } else setError(res.data.error || 'Codigo invalido');
    } catch { setError('Error de conexion'); }
    setLocalLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:10000/api'}/auth/google`;
  };

  if (deferringAuth) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Verificando tu sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesion</h1>
            <p className="text-gray-500 mt-1 text-sm">Ingresa a tu cuenta de MiProfesional</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Account type selector */}
          <div className="flex gap-1.5 mb-5 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <button type="button" onClick={() => setAccountType('client')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                accountType === 'client' ? 'bg-white text-primary-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User size={14} className="inline mr-1 -mt-0.5" /> Cliente
            </button>
            <button type="button" onClick={() => setAccountType('professional')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                accountType === 'professional' ? 'bg-white text-primary-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase size={14} className="inline mr-1 -mt-0.5" /> Profesional
            </button>
            <button type="button" onClick={() => setAccountType('company')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                accountType === 'company' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 size={14} className="inline mr-1 -mt-0.5" /> Empresa
            </button>
          </div>

          {accountType === 'company' && (
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Building2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Acceso para empresas</p>
                  <p className="text-xs text-amber-700 mt-0.5">Ingresá con tu cuenta empresa para buscar candidatos y gestionar tu equipo.</p>
                </div>
              </div>
            </div>
          )}

          {/* Login mode tabs */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-6">
            <button onClick={() => { setMode('email'); setCodeSent(false); }}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${mode === 'email' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Mail size={15} className="inline mr-1.5 -mt-0.5" /> Email
            </button>
            <button onClick={() => setMode('sms')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${mode === 'sms' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Smartphone size={15} className="inline mr-1.5 -mt-0.5" /> SMS
            </button>
          </div>

          {/* Email Login */}
          {mode === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <input name="password" type="password" required value={formData.password} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 hover:underline">Olvidaste tu contrasena?</Link>
              </div>
              <button type="submit" disabled={localLoading}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
              >{localLoading ? 'Ingresando...' : 'Iniciar Sesion'}</button>
            </form>
          )}

          {/* SMS Login */}
          {mode === 'sms' && !codeSent && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero de Telefono</label>
                <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="+54 11 1234-5678" />
              </div>
              <button onClick={handleSendCode} disabled={localLoading}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
              >{localLoading ? 'Enviando...' : 'Enviar codigo'}</button>
            </div>
          )}

          {mode === 'sms' && codeSent && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">Ingresa el codigo de 6 digitos enviado a {formData.phone}</p>
              <input name="code" type="text" maxLength={6} value={formData.code} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-center tracking-[8px] font-mono"
                placeholder="000000" />
              <button onClick={handleVerifyCode} disabled={localLoading || formData.code.length !== 6}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
              >{localLoading ? 'Verificando...' : 'Verificar codigo'}</button>
              <button onClick={() => setCodeSent(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              ><ArrowLeft size={14} /> Cambiar numero</button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">O</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Google Login */}
          <button onClick={handleGoogleLogin}
            className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Chrome size={18} /> Continuar con Google
          </button>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              No tenes una cuenta?{' '}
              <Link to={accountType === 'company' ? '/register?role=company' : '/register'} className="text-primary-600 hover:text-primary-700 font-medium">Registrate</Link>
            </p>
            {accountType !== 'company' && (
              <p className="text-xs text-gray-400">
                <Link to="/register?role=company" className="hover:text-primary-600 transition-colors">Soy empresa &rarr;</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
