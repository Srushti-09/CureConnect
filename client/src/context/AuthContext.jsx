import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Set up axios base — proxy in vite.config.js routes /api → http://localhost:5000
const api = axios.create({ baseURL: '/api' });

/**
 * Parses axios errors into human-readable messages.
 * Handles: proper API errors, 502/503 proxy failures (server down),
 * and ERR_NETWORK / timeout errors.
 */
function _parseError(err, fallback) {
  // 1. Backend returned a JSON error message
  if (err?.response?.data?.message) return err.response.data.message;

  // 2. Vite proxy couldn't reach the backend (502 Bad Gateway)
  const status = err?.response?.status;
  if (status === 502 || status === 503 || status === 504) {
    return '⚠️ Server is offline. Please start the backend on port 5000 and try again.';
  }

  // 3. No response at all — pure network error / server not running
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED' || !err.response) {
    return '⚠️ Cannot reach server. Make sure the backend is running on port 5000.';
  }

  return fallback;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const stored = localStorage.getItem('cc_user');

    if (token && stored) {
      // Immediately restore from localStorage so the UI doesn't flash blank
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token with backend in background — update user data if server is up
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('cc_user', JSON.stringify({ ...data, token }));
        })
        .catch(() => {
          // Token is invalid / expired — clear session
          // But only clear if we get a 401, not a network error
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      const msg = _parseError(err, 'Login failed. Please try again.');
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData);
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      const msg = _parseError(err, 'Registration failed. Please try again.');
      throw new Error(msg);
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
