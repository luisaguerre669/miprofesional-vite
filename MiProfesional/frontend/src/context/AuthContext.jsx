import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';
import { log } from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);

  useEffect(() => {
    log('[Auth] App mounted, running checkAuth...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      const nextUser = response.data?.data?.user || response.data?.data || response.data?.user;
      if (nextUser) {
        setUser(nextUser);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        log('[Auth] User not authenticated');
        setUser(null);
      } else if (error.code === 'ECONNABORTED') {
        log('[Auth] /auth/me timeout');
      } else {
        log('[Auth] Error checking auth:', error.message);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const startTime = Date.now();
    log('[Auth] Login attempt:', email);
    if (loginAttempts >= 3) {
      return { success: false, error: 'Demasiados intentos. Espera unos segundos.' };
    }
    setLoginAttempts(prev => prev + 1);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data.data;
      log('[Auth] Login success:', { userName: user?.name, role: user?.role, timeMs: Date.now() - startTime });
      setUser(user);
      setLoginAttempts(0);
      return { success: true, role: user?.role };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      log('[Auth] Login failed:', { status: error.response?.status, message: error.response?.data?.message || error.message, timeMs: elapsed });
      const userMsg = error.code === 'ECONNABORTED' || elapsed >= 60000
        ? 'Error de conexion. El servidor no responde. Intentá nuevamente mas tarde.'
        : error.response?.data?.message || 'Error al iniciar sesion. Verifica tus credenciales.';
      return { success: false, error: userMsg };
    }
  };

  const register = async (name, email, password, role = 'client', extra = {}) => {
    const { traceId, ...bodyFields } = extra;
    const tid = traceId || 'no-trace';
    try {
      log('[AUDIT:' + tid + '] Step 4 — Petición POST /auth/register enviada');
      console.log('[FLOW] POST /auth/register');
      const response = await api.post('/auth/register', { name, email, password, role, ...bodyFields });
      const status = response.status;
      const bodyStr = JSON.stringify(response.data);
      log('[AUDIT:' + tid + '] Step 9 — Respuesta recibida (HTTP ' + status + '):', bodyStr);
      const { user } = response.data.data;
      setUser(user);
      return { success: true, traceId: tid };
    } catch (error) {
      const httpStatus = error.response?.status || 0;
      const responseData = error.response?.data || {};
      log('[AUDIT:' + tid + '] Step 9 — Respuesta recibida (HTTP ' + httpStatus + ', error):', JSON.stringify(responseData));
      const backendMsg = responseData.message || responseData.error || 'Error al registrarse. Intenta de nuevo mas tarde.';
      return { 
        success: false, 
        error: backendMsg,
        traceId: tid
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      log('[Auth] Logout error:', error.message);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      const nextUser = response.data?.data?.user || response.data?.data || response.data?.user;
      setUser(nextUser);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al actualizar perfil.' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isProfessional: user?.role === 'professional',
    isEmployer: user?.role === 'employer',
    isCompany: user?.role === 'company',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
