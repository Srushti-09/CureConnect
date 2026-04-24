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

// ─── Reusable icon-prefixed input (defined OUTSIDE to prevent re-mount) ──────
function InputField({ icon: Icon, placeholder, type = 'text', value, onChange, required = false }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={16} style={{
        position: 'absolute', left: 14, top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(240,244,255,0.35)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="input-glass"
        style={{ paddingLeft: 42 }}
        autoComplete="off"
      />
    </div>
  );
}

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
  // Server health
  const [serverOnline, setServerOnline] = useState(null); // null = checking, true/false

  // Ping health endpoint on mount to detect if backend is running
  useEffect(() => {
    api.get('/health', { timeout: 3000 })
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  // Form fields
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [phone, setPhone]                 = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospital, setHospital]           = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bloodGroup, setBloodGroup]       = useState('');
  const [gender, setGender]               = useState('');
  const [height, setHeight]               = useState('');
  const [weight, setWeight]               = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [allergies, setAllergies]         = useState('');
  const [pastDocuments, setPastDocuments] = useState([]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPastDocuments(prev => [...prev, {
          fileName: file.name,
          fileType: file.type,
          fileUrl: ev.target.result,
          title: file.name,
          type: (file.name.toLowerCase().includes('rx') || file.name.toLowerCase().includes('prescription')) ? 'prescription' :
                (file.type.includes('image') ? 'imaging' : 'lab_report')
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Switch to sign-in tab, keeping the email pre-filled ─────────────────
  const switchToSignIn = () => {
    setMode('login');
    setError('');
    setAlreadyExists(false);
    setSuccess('Your email is already registered — just sign in below! 👇');
  };

  // ── Main form submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAlreadyExists(false);

    // Client-side validation for register
    if (mode === 'register') {
      if (!name.trim())          { setError('Full name is required.'); return; }
      if (!email.trim())         { setError('Email address is required.'); return; }
      if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        // ── SIGN IN ──────────────────────────────────────────────────────
        const data = await login(email, password);
        const userRole = data?.role;
        navigate(userRole === 'doctor' ? '/doctor' : '/patient');

      } else {
        // ── REGISTER ─────────────────────────────────────────────────────
        const userData = {
          name, email, password, role, phone,
          specialization, hospital, licenseNumber, bloodGroup, gender,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
          chronicConditions: chronicConditions ? chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          pastDocuments
        };
        const data = await register(userData);
        setSuccess('✅ Account created! Taking you to your dashboard...');
        const userRole = data?.role;
        setTimeout(() => navigate(userRole === 'doctor' ? '/doctor' : '/patient'), 900);
      }
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Something went wrong. Please try again.');

      // ── Smart detection: email already registered ─────────────────────
      // The backend returns exactly this string in auth.js
      const isDuplicate =
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('please sign in');

      if (isDuplicate && mode === 'register') {
        setAlreadyExists(true);   // show the special "sign in instead" banner
        setError('');             // clear generic error — we have the smart one
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isDoctor   = role === 'doctor';
  const accentColor = isDoctor ? '#8b5cf6' : '#00d4ff';
  const accentGrad  = isDoctor
    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
    : 'linear-gradient(135deg, #00d4ff, #00ff88)';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deepest)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="bg-grid" />
      <ParticleField count={35} color={isDoctor ? '139, 92, 246' : '0, 212, 255'} />

      {/* ── Centered card ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: 480 }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/select')}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(240,244,255,0.4)',
              fontSize: 14, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              marginBottom: 32,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            ← Change Role
          </button>

          {/* ── Server online / offline indicator ── */}
          <AnimatePresence>
            {serverOnline === false && (
              <motion.div
                key="offline-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px',
                  background: 'rgba(255,68,68,0.1)',
                  border: '1px solid rgba(255,68,68,0.35)',
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <WifiOff size={18} style={{ color: '#ff6b6b', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ color: '#ff6b6b', fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
                    Backend server is offline
                  </p>
                  <p style={{ color: 'rgba(240,244,255,0.5)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.8 }}>
                    Open a <span style={{ color: '#fbbf24' }}>new terminal</span> and run:<br />
                    <span style={{ color: '#00ff88' }}>Backend is being reached at:</span><br />
<span style={{ color: '#00ff88' }}>https://aisham30-cureconnect.onrender.com</span>
                  </p>
                </div>
              </motion.div>
            )}
            {serverOnline === true && (
              <motion.div
                key="online-banner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px',
                  background: 'rgba(0,255,136,0.07)',
                  border: '1px solid rgba(0,255,136,0.2)',
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <Wifi size={14} style={{ color: '#00ff88' }} />
                <span style={{ color: '#00ff88', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                  Server online · MongoDB connected
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 44, height: 44,
              background: accentGrad,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={22} color="#000" fill="#000" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, background: accentGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CureConnect
              </p>
              <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                {isDoctor ? '// Doctor Portal' : '// Patient OS'}
              </p>
            </div>
          </div>

          {/* Role toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
          }}>
            {['patient', 'doctor'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.25s',
                  background: role === r
                    ? (r === 'doctor' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #00d4ff, #00ff88)')
                    : 'transparent',
                  color: role === r ? '#000' : 'rgba(240,244,255,0.5)',
                }}
              >
                {r === 'patient' ? '🫀 Patient' : '🩺 Doctor'}
              </button>
            ))}
          </div>

          {/* Sign In / Create Account tabs */}
          <div style={{ display: 'flex', marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccess(''); setAlreadyExists(false); }}
                style={{
                  flex: 1, padding: '13px', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 15,
                  fontWeight: mode === m ? 700 : 400,
                  color: mode === m ? accentColor : 'rgba(240,244,255,0.4)',
                  borderBottom: mode === m ? `2px solid ${accentColor}` : '2px solid transparent',
                  fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', marginBottom: -1,
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Register-only fields */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}
                >
                  {/* Name */}
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="input-glass"
                      style={{ paddingLeft: 42 }}
                    />
                  </div>

                  {/* Phone */}
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
                    <input
                      type="tel"
                      placeholder="Phone Number (optional)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="input-glass"
                      style={{ paddingLeft: 42 }}
                    />
                  </div>

                  {/* Doctor / Patient extra fields */}
                  {isDoctor ? (
                    <>
                      <input className="input-glass" placeholder="Specialization (e.g. Cardiology)" value={specialization} onChange={e => setSpecialization(e.target.value)} />
                      <input className="input-glass" placeholder="Hospital / Clinic" value={hospital} onChange={e => setHospital(e.target.value)} />
                      <input className="input-glass" placeholder="Medical License Number" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                    </>
                  ) : (
                    <>
                      <div style={{display: 'flex', gap: 10}}>
                        <select className="input-glass" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}
                          style={{ background: 'var(--select-bg)', color: bloodGroup ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          <option value="">Blood Group (optional)</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select className="input-glass" value={gender} onChange={e => setGender(e.target.value)}
                          style={{ background: 'var(--select-bg)' }}>
                          <option value="">Gender (optional)</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div style={{display: 'flex', gap: 10}}>
                        <input className="input-glass" placeholder="Height (cm)" type="number" value={height} onChange={e => setHeight(e.target.value)} />
                        <input className="input-glass" placeholder="Weight (kg)" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
                      </div>
                      <input className="input-glass" placeholder="Pre-existing Conditions (e.g. Diabetes, Asthma)" value={chronicConditions} onChange={e => setChronicConditions(e.target.value)} />
                      <input className="input-glass" placeholder="Allergies (e.g. Penicillin, Peanuts)" value={allergies} onChange={e => setAllergies(e.target.value)} />
                      
                      <div style={{ marginTop: 10, padding: 16, border: '1px dashed rgba(0,212,255,0.3)', borderRadius: 12, background: 'rgba(0,0,0,0.2)', textAlign: 'center', position: 'relative' }}>
                        <Upload size={24} color="rgba(0,212,255,0.6)" style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.6)', marginBottom: 4 }}>Upload Past Medical Documents</p>
                        <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>PDF, JPG, PNG (Generates your AI timeline instantly)</p>
                        <input type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        {pastDocuments.length > 0 && (
                          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                            {pastDocuments.map((doc, i) => (
                              <span key={i} style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, padding: '4px 8px', fontSize: 11, color: '#00d4ff' }}>
                                {doc.fileName.substring(0, 15)}{doc.fileName.length > 15 ? '...' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input-glass"
                style={{ paddingLeft: 42 }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input-glass"
                style={{ paddingLeft: 42, paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)', zIndex: 1 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* ─── Alerts ─── */}
            <AnimatePresence mode="wait">

              {/* 1 ─ Email already in DB → smart "sign in" suggestion */}
              {alreadyExists && (
                <motion.div
                  key="already-exists"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(250,204,21,0.08)',
                    border: '1px solid rgba(250,204,21,0.35)',
                    borderRadius: 12,
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    ⚠️ This email is already registered!
                  </p>
                  <p style={{ color: 'rgba(240,244,255,0.6)', fontSize: 12, marginBottom: 10 }}>
                    An account with <strong style={{ color: '#fbbf24' }}>{email}</strong> already exists in our database.
                    Don't create a new one — just sign in!
                  </p>
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '9px 18px',
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      border: 'none', borderRadius: 8,
                      color: '#000', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    <LogIn size={14} /> Sign In Instead
                  </button>
                </motion.div>
              )}

              {/* 2 ─ Generic error */}
              {error && !alreadyExists && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    background: 'rgba(255,68,68,0.1)',
                    border: '1px solid rgba(255,68,68,0.25)',
                    borderRadius: 10, color: '#ff6b6b', fontSize: 13, lineHeight: 1.6,
                  }}
                >
                  <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
                </motion.div>
              )}

              {/* 3 ─ Success */}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: 'rgba(0,255,136,0.1)',
                    border: '1px solid rgba(0,255,136,0.25)',
                    borderRadius: 10, color: '#00ff88', fontSize: 13,
                  }}
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.div>
              )}

            </AnimatePresence>

            {/* Submit button — hidden when showing "already exists" prompt */}
            {!alreadyExists && (
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                style={{
                  padding: '14px',
                  background: accentGrad,
                  border: 'none', borderRadius: 12,
                  color: '#000', fontWeight: 800, fontSize: 16,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'Outfit, sans-serif',
                  opacity: loading ? 0.7 : 1, marginTop: 6,
                  boxShadow: `0 8px 30px ${accentColor}40`,
                }}
              >
                {loading ? (
                  <><Loader size={18} style={{ animation: 'spin-slow 1s linear infinite' }} /> Processing...</>
                ) : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
                )}
              </motion.button>
            )}
          </form>

          {/* Footer hint */}
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
              🗄️ Accounts saved to MongoDB Atlas · Backend hosted on Render
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
