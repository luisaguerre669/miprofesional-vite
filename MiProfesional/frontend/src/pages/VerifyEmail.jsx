import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('invalid');
      return;
    }
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'verifying') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500">Verificando tu correo electronico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Correo Verificado</h2>
            <p className="text-gray-500 text-sm mb-6">Tu direccion de correo electronico fue verificada exitosamente. Ya podes iniciar sesion.</p>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm">
              Iniciar Sesion
            </Link>
          </>
        ) : status === 'error' ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Verificacion</h2>
            <p className="text-gray-500 text-sm mb-6">El enlace de verificacion es invalido o ha expirado. Intenta registrarte nuevamente.</p>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm">
              Registrarse
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-amber-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace Invalido</h2>
            <p className="text-gray-500 text-sm mb-6">No se proporciono un token de verificacion valido.</p>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all text-sm">
              Iniciar Sesion
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
