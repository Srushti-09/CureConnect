import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../context/AuthContext';
import ParticleField from '../components/ParticleField';
import {
  Heart, Mail, Lock, User, Phone, Eye, EyeOff,
  ArrowRight, Loader, AlertCircle, CheckCircle2, LogIn, Wifi, WifiOff, Upload
} from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register } = useAuth();

  const defaultRole = params.get('role') || 'patient';
  const [mode, setMode]           = useState('login');
  const [role, setRole]           = useState(defaultRole);
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);

  useEffect(() => {
    api.get('/health', { timeout: 3000 })
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [phone, setPhone]                 = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAlreadyExists(false);

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login(email, password);
        navigate(data.role === 'doctor' ? '/doctor' : '/patient');
      } else {
        const data = await register({ name, email, password, role, phone });
        setSuccess('✅ Account created!');
        setTimeout(() => navigate(data.role === 'doctor' ? '/doctor' : '/patient'), 900);
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      if (msg.includes('already registered')) setAlreadyExists(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = role === 'doctor';
  const accentGrad = isDoctor ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #00d4ff, #00ff88)';

  return (
    <div className="auth-layout" style={{ minHeight: '100vh', background: 'var(--bg-deepest)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-grid" />
      <ParticleField count={30} color={isDoctor ? '139, 92, 246' : '0, 212, 255'} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, background: accentGrad, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={24} color="#000" /></div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>CureConnect</h2>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {['patient', 'doctor'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: role === r ? accentGrad : 'transparent', color: role === r ? '#000' : '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && <input className="input-glass" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />}
            <input className="input-glass" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-glass" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            
            {error && <p style={{ color: '#ff4444', fontSize: 13 }}>{error}</p>}
            {success && <p style={{ color: '#00ff88', fontSize: 13 }}>{success}</p>}

            <button type="submit" className="btn-primary" style={{ background: accentGrad, color: '#000', fontWeight: 800, padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, opacity: 0.6 }}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: isDoctor ? '#8b5cf6' : '#00d4ff', cursor: 'pointer', fontWeight: 700 }}>
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
