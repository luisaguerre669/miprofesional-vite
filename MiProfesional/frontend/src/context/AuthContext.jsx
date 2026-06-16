import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { __setInitialized } from '../lib/axios';
import { log } from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEY_USER = 'user';
const STORAGE_KEY_TOKEN = 'token';

let _uidCounter = 0;
function uid() { return ++_uidCounter; }

function loadFromStorage() {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return { token, user: stored ? JSON.parse(stored) : null };
  } catch {
    return { token: null, user: null };
  }
}

function saveToStorage(token, user) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    log('[Auth] Failed to save to localStorage:', e.message);
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) {
    log('[Auth] Failed to clear localStorage:', e.message);
  }
}

function finalizeInit$() {
  __setInitialized(true);
}

export const AuthProvider = ({ children }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  const { token: storedToken, user: storedUser } = loadFromStorage();
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isFirstRun = useRef(true);
  const prevState = useRef({});
  const currState = { initialized, loading, isLoggingIn, user: user?.id || user?.email || null, token: !!storedToken };
  if (prevState.current.initialized !== currState.initialized || prevState.current.loading !== currState.loading || prevState.current.isLoggingIn !== currState.isLoggingIn || prevState.current.user !== currState.user) {
    console.log(`[AUTH] Render #${renderCount.current} | init=${currState.initialized} | load=${currState.loading} | loggingIn=${currState.isLoggingIn} | user=${currState.user} | hasToken=${currState.token}`);
    prevState.current = currState;
  }

  // ---- Event listener for forced logout (401 from axios interceptor) ----
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      console.log(`[AUTH] force-logout event received — clearing user (triggered by ${detail.method || '?'} ${detail.url || '?'})`);
      clearStorage();
      setUser(null);
      setInitialized(true);
      setLoading(false);
      finalizeInit$();
    };
    window.addEventListener('auth:force-logout', handler);
    return () => window.removeEventListener('auth:force-logout', handler);
  }, []);

  // ---- Mount: validate existing token once ----
  useEffect(() => {
    const id = uid();
    console.log(`[AUTH] Mount effect #${id} — storedToken=${!!storedToken}`);
    if (storedToken) {
      if (storedUser) {
        console.log(`[AUTH] Mount #${id} — restoring cached user:`, storedUser?.email || storedUser?._id);
        setUser(storedUser);
      }
      api.get('/auth/me')
        .then(response => {
          const fresh = response.data?.data?.user || response.data?.data || response.data?.user;
          if (fresh) {
            console.log(`[AUTH] Mount #${id} — /auth/me success:`, fresh?.email || fresh?._id);
            setUser(fresh);
            saveToStorage(storedToken, fresh);
          }
        })
        .catch(error => {
          const status = error.response?.status;
          if (status === 401) {
            console.log(`[AUTH] Mount #${id} — /auth/me 401, clearing`);
            clearStorage();
            setUser(null);
          } else if (status === 429) {
            console.log(`[AUTH] Mount #${id} — /auth/me 429 rate limited, manteniendo caché`);
          } else {
            console.log(`[AUTH] Mount #${id} — /auth/me error, keeping cached:`, error.message);
          }
        })
        .finally(() => {
          console.log(`[AUTH] Mount #${id} — finalizing init`);
          setLoading(false);
          setInitialized(true);
          finalizeInit$();
        });
    } else {
      console.log(`[AUTH] Mount #${id} — no stored token, finalizing immediately`);
      setLoading(false);
      setInitialized(true);
      finalizeInit$();
    }
  }, []);

  // ---- checkAuth: validate token from a callback (Google OAuth) ----
  const checkAuth = async () => {
    const checkId = uid();
    const { token } = loadFromStorage();
    console.log(`[AUTH] checkAuth #${checkId} — token=${!!token}`);
    if (!token) {
      console.log(`[AUTH] checkAuth #${checkId} — no token, returning null`);
      return null;
    }
    try {
      const response = await api.get('/auth/me');
      const nextUser = response.data?.data?.user || response.data?.data || response.data?.user;
      if (nextUser) {
        console.log(`[AUTH] checkAuth #${checkId} — success:`, nextUser?.email || nextUser?._id);
        setUser(nextUser);
        saveToStorage(token, nextUser);
        return nextUser;
      }
      return null;
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        console.log(`[AUTH] checkAuth #${checkId} — 401, clearing`);
        clearStorage();
        setUser(null);
      } else if (status === 429) {
        console.log(`[AUTH] checkAuth #${checkId} — 429 rate limited, devolviendo caché`);
        return user;
      } else {
        console.log(`[AUTH] checkAuth #${checkId} — error:`, error.message);
      }
      return null;
    }
  };

  // ---- login: email/password ----
  const login = async (email, password) => {
    const loginId = uid();
    log(`[AUTH] login #${loginId} — email=${email}`);
    setIsLoggingIn(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.accessToken || response.data.data?.accessToken || response.data.data?.token;
      const { user: freshUser } = response.data.data;
      console.log(`[AUTH] login #${loginId} — success role=${freshUser?.role}`);
      saveToStorage(token, freshUser);
      setUser(freshUser);
      return { success: true, role: freshUser?.role, token };
    } catch (error) {
      const userMsg = error.response?.data?.message || 'Error al iniciar sesion. Verifica tus credenciales.';
      log(`[AUTH] login #${loginId} — failed:`, userMsg);
      return { success: false, error: userMsg };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (name, email, password, role = 'client', extra = {}) => {
    const { traceId, ...bodyFields } = extra;
    const tid = traceId || 'no-trace';
    try {
      log('[AUDIT:' + tid + '] Step 4 — POST /auth/register');
      const response = await api.post('/auth/register', { name, email, password, role, ...bodyFields });
      if (response.data.data?.requiresEmailVerification) {
        log('[AUDIT:' + tid + '] Email verification required');
        return { success: true, requiresEmailVerification: true, traceId: tid };
      }
      const token = response.data.accessToken || response.data.data?.accessToken || response.data.data?.token;
      const { user: registeredUser } = response.data.data;
      saveToStorage(token, registeredUser);
      setUser(registeredUser);
      return { success: true, traceId: tid };
    } catch (error) {
      const backendMsg = error.response?.data?.message || error.response?.data?.error || 'Error al registrarse.';
      return { success: false, error: backendMsg, traceId: tid };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      log('[Auth] Logout error:', error.message);
    } finally {
      clearStorage();
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
      return { success: false, error: error.response?.data?.message || 'Error al actualizar perfil.' };
    }
  };

  const value = {
    user,
    loading,
    initialized,
    isLoggingIn,
    login,
    register,
    logout,
    checkAuth,
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
