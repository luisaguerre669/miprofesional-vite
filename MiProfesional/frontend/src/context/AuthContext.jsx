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

  useEffect(() => {
    console.log('[Auth] App mounted, running checkAuth...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('[Auth] checkAuth:', { hasToken: !!token, hasStoredUser: !!storedUser, tokenPrefix: token ? token.substring(0, 12) + '...' : null });
    
    if (token && storedUser) {
      try {
        console.log('[Auth] Verifying token via /auth/me...');
        const response = await api.get('/auth/me');
        console.log('[Auth] /auth/me response:', { success: !!response.data?.data?.user, userName: response.data?.data?.user?.name });
        setUser(response.data.data.user);
      } catch (error) {
        console.warn('[Auth] /auth/me failed, clearing storage:', error.response?.status || error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('[Auth] No token found, user is visitor');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      console.log('[Auth] Login attempt:', email);
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      console.log('[Auth] Login success:', { userName: user?.name, role: user?.role, tokenPrefix: token?.substring(0, 12) + '...' });
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.warn('[Auth] Login failed:', error.response?.status, error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesion. Verifica tus credenciales.' 
      };
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
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
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
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
