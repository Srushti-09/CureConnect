import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Axios instance — Vite proxy routes /api → http://localhost:5000
const api = axios.create({ 
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
});

/**
 * Smart error parser.
 *
 * Priority order:
 *  1. Backend sent a JSON { message: "..." }  → use it exactly
 *  2. It's a 4xx client error but no message   → generic fallback (shouldn't normally happen)
 *  3. EVERYTHING else (5xx, no response, proxy 502, ERR_NETWORK, HTML pages, etc.)
 *     → "Server is offline" message so the user knows to start the backend
 */
function _parseError(err, fallback) {
  // 1. Our backend returned a proper JSON message (e.g. "Email already registered")
  const backendMsg = err?.response?.data?.message;
  if (typeof backendMsg === 'string' && backendMsg.length > 0) {
    return backendMsg;
  }

  // 2. Got a 4xx response but no JSON message (edge case)
  const status = err?.response?.status;
  if (status && status >= 400 && status < 500) {
    return fallback;
  }

  // 3. Everything else = server is unreachable / down / proxy failure
  //    (covers: ERR_NETWORK, ECONNREFUSED, 500, 502, 503, 504, HTML body, undefined response…)
  return '🔴 Backend server is offline.\nPlease open a NEW terminal and run:\n  cd server\n  node index.js';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load
  useEffect(() => {
    const token  = localStorage.getItem('cc_token');
    const stored = localStorage.getItem('cc_user');

    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore bad JSON */ }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Re-validate token with backend silently (background)
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('cc_user', JSON.stringify({ ...data, token }));
        })
        .catch((err) => {
          // Only invalidate session on explicit 401 (bad/expired token)
          // Do NOT clear on network errors — let the cached session stand
          if (err?.response?.status === 401) {
            localStorage.removeItem('cc_token');
            localStorage.removeItem('cc_user');
            setUser(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * POST /api/auth/login
   * Returns the full user object (flat) including token on success.
   */
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // data = { _id, name, email, role, avatar, healthScore, token }
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      throw new Error(_parseError(err, 'Login failed. Please try again.'));
    }
  };

  /**
   * POST /api/auth/register
   * Backend validates, hashes password, and saves to MongoDB.
   * Returns the new user object + JWT on success.
   */
  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      // data = { _id, name, email, role, avatar, healthScore, token }
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      throw new Error(_parseError(err, 'Registration failed. Please try again.'));
    }
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { api };
