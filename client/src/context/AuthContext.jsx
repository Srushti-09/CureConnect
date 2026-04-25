import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : '/api'
});

function _parseError(err, fallback) {
  const backendMsg = err?.response?.data?.message;
  if (typeof backendMsg === 'string' && backendMsg.length > 0) {
    return backendMsg;
  }
  const status = err?.response?.status;
  if (status && status >= 400 && status < 500) {
    return fallback;
  }
  return '🔴 Backend server is offline.\nPlease ensure your backend is running or check your internet connection.';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token  = localStorage.getItem('cc_token');
    const stored = localStorage.getItem('cc_user');

    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore bad JSON */ }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('cc_user', JSON.stringify({ ...data, token }));
        })
        .catch((err) => {
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

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('cc_token', data.token);
      localStorage.setItem('cc_user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data);
      return data;
    } catch (err) {
      throw new Error(_parseError(err, 'Login failed. Please try again.'));
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
