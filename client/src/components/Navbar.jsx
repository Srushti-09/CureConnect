import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Settings, LogOut, Search,
  ChevronDown, Pill, X, Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ECGLine from './ECGLine';
// Aisha UI improvement
export default function Navbar({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Load notifications (prescriptions received)
  useEffect(() => {
    const loadNotifs = () => {
      const userId = user?._id || 'demo';
      const stored = JSON.parse(localStorage.getItem(`cc_prescriptions_${userId}`) || '[]');
      setNotifications(stored);
    };
    loadNotifs();
    // Poll every 5s so new prescriptions appear without reload
    const iv = setInterval(loadNotifs, 5000);
    return () => clearInterval(iv);
  }, [user]);

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const userId = user?._id || 'demo';
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(`cc_prescriptions_${userId}`, JSON.stringify(updated));
    setNotifications(updated);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0, left: 260, right: 0,
        height: window.innerWidth < 768 ? 56 : 68,
        background: 'rgba(6, 13, 28, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        zIndex: 100,
      }}
    >
      {/* Left — ECG strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        <div style={{ opacity: 0.5, width: 200 }}>
          <ECGLine color={role === 'doctor' ? '#8b5cf6' : '#00d4ff'} height={36} />
        </div>
      </div>

      {/* Center — Search */}
      <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.4)' }} />
        <input className="input-glass" placeholder="Search records, patients..." style={{ paddingLeft: 40, height: 40, fontSize: 14 }} />
      </div>

      {/* Right */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowDropdown(false); }}
            className="btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', width: 38, height: 38, justifyContent: 'center', position: 'relative' }}
          >
            <Bell size={16} />
            {unread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ff4444',
                  boxShadow: '0 0 8px rgba(255,68,68,0.8)',
                }}
              />
            )}
          </button>

          {/* Notification Panel */}
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 360,
                  background: 'rgba(6,13,28,0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: 0,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                  zIndex: 200, overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={15} color="#00d4ff" />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
                    {unread > 0 && (
                      <span style={{ background: '#ff4444', color: '#fff', fontSize: 11, borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>
                        {unread} new
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {unread > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 12, color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)' }}>
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Bell size={28} style={{ color: 'rgba(240,244,255,0.15)', marginBottom: 10 }} />
                      <p style={{ fontSize: 14, color: 'rgba(240,244,255,0.35)' }}>No notifications yet</p>
                      <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.2)', marginTop: 6 }}>Prescriptions from your doctor will appear here</p>
                    </div>
                  ) : (
                    [...notifications].reverse().map((notif, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: notif.read ? 'transparent' : 'rgba(139,92,246,0.06)',
                          borderLeft: notif.read ? '3px solid transparent' : '3px solid #8b5cf6',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Pill size={16} color="#8b5cf6" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <p style={{ fontSize: 13, fontWeight: 700 }}>Prescription Received</p>
                              {!notif.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', marginTop: 4 }} />}
                            </div>
                            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.6)', marginBottom: 4 }}>
                              From: <span style={{ color: '#8b5cf6' }}>Dr. {notif.doctorName}</span>
                            </p>
                            {notif.diagnosis && (
                              <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', marginBottom: 4 }}>
                                Diagnosis: {notif.diagnosis}
                              </p>
                            )}
                            {notif.medications?.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                {notif.medications.filter(m => m.name).map((m, mi) => (
                                  <div key={mi} style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)', padding: '4px 8px', background: 'rgba(139,92,246,0.1)', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 6 }}>
                                    💊 <strong>{m.name}</strong> {m.dose} — {m.frequency} {m.duration && `for ${m.duration}`}
                                  </div>
                                ))}
                              </div>
                            )}
                            {notif.notes && (
                              <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.45)', marginTop: 6, fontStyle: 'italic' }}>"{notif.notes}"</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                              <Clock size={10} color="rgba(240,244,255,0.3)" />
                              <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{notif.sentAt}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifs(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 40, cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: role === 'doctor'
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                : 'linear-gradient(135deg, #00d4ff, #00ff88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#000',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.5 }} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                  width: 200,
                  background: 'rgba(6,13,28,0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14, padding: 8,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {role === 'doctor' ? '🩺 Doctor' : '🫀 Patient'}
                  </p>
                </div>
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Settings size={15} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: 8, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}
