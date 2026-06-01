import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

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
    console.log('[Auth] App mounted, running checkAuth...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const response = await api.get('/auth/me');
        const nextUser = response.data?.data?.user || response.data?.data || response.data?.user;
        if (nextUser) {
          setUser(nextUser);
          localStorage.setItem('user', JSON.stringify(nextUser));
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          console.warn('[Auth] /auth/me timeout, using cached data');
          try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } else {
      console.log('[Auth] No token found, user is visitor');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const startTime = Date.now();
    console.log('[Auth] Login attempt:', email);
    if (loginAttempts >= 3) {
      return { success: false, error: 'Demasiados intentos. Espera unos segundos.' };
    }
    setLoginAttempts(prev => prev + 1);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      console.log('[Auth] Login success:', { userName: user?.name, role: user?.role, timeMs: Date.now() - startTime });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setLoginAttempts(0);
      return { success: true, role: user?.role };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.warn('[Auth] Login failed:', { status: error.response?.status, message: error.response?.data?.message || error.message, timeMs: elapsed });
      const userMsg = error.code === 'ECONNABORTED' || elapsed >= 60000
        ? 'Error de conexion. El servidor no responde. Intentá nuevamente mas tarde.'
        : error.response?.data?.message || 'Error al iniciar sesion. Verifica tus credenciales.';
      return { success: false, error: userMsg };
    }
  };

  const register = async (name, email, password, role = 'client', extra = {}) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role, ...extra });
      const { token, user } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al registrarse. Intenta de nuevo mas tarde.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      const nextUser = response.data?.data?.user || response.data?.data || response.data?.user;
      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
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
