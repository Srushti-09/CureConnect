import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell, Settings, LogOut, Search,
  ChevronDown, Pill, X, Clock, User, FileText, Menu,
  Sun, Moon
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ECGLine from './ECGLine';

/* ── Mock dataset for smart search ── */
const MOCK_DATA = [
  { id: 1, name: 'Aarav Sharma', type: 'patient', meta: 'ID: P-10234 • Cardiology' },
  { id: 2, name: 'Priya Patel', type: 'patient', meta: 'ID: P-10412 • Neurology' },
  { id: 3, name: 'Rohan Mehta', type: 'patient', meta: 'ID: P-10587 • Dermatology' },
  { id: 4, name: 'Sneha Iyer', type: 'patient', meta: 'ID: P-10623 • Oncology' },
  { id: 5, name: 'Vikram Reddy', type: 'patient', meta: 'ID: P-10891 • Orthopedics' },
  { id: 6, name: 'Ananya Gupta', type: 'patient', meta: 'ID: P-11032 • Pediatrics' },
  { id: 7, name: 'Kabir Singh', type: 'patient', meta: 'ID: P-11198 • Pulmonology' },
  { id: 8, name: 'Meera Joshi', type: 'patient', meta: 'ID: P-11345 • ENT' },
  { id: 9, name: 'Blood Test Report — Priya Patel', type: 'record', meta: 'Uploaded: 12 Apr 2026' },
  { id: 10, name: 'MRI Scan — Aarav Sharma', type: 'record', meta: 'Uploaded: 8 Apr 2026' },
  { id: 11, name: 'ECG Report — Vikram Reddy', type: 'record', meta: 'Uploaded: 3 Apr 2026' },
  { id: 12, name: 'X-Ray — Rohan Mehta', type: 'record', meta: 'Uploaded: 28 Mar 2026' },
  { id: 13, name: 'Prescription — Sneha Iyer', type: 'record', meta: 'Uploaded: 25 Mar 2026' },
  { id: 14, name: 'Discharge Summary — Kabir Singh', type: 'record', meta: 'Uploaded: 20 Mar 2026' },
  { id: 15, name: 'Lab Report — Meera Joshi', type: 'record', meta: 'Uploaded: 15 Mar 2026' },
  { id: 16, name: 'CT Scan — Ananya Gupta', type: 'record', meta: 'Uploaded: 10 Mar 2026' },
];

/* ── Highlight matching text ── */
function HighlightText({ text, query }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{
            color: '#00d4ff',
            fontWeight: 700,
            textShadow: '0 0 8px rgba(0,212,255,0.5)',
          }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Navbar({ role, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Smart search state
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // ── Track viewport width ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Filter suggestions as user types ──
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSearch(false);
      setActiveIndex(-1);
      return;
    }
    const q = query.toLowerCase();
    const filtered = MOCK_DATA
      .filter(item => item.name.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q))
      .slice(0, 5);
    setSuggestions(filtered);
    setShowSearch(filtered.length > 0);
    setActiveIndex(-1);
  }, [query]);

  // ── Close dropdown on outside click ──
  const handleClickOutside = useCallback((e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSearch(false);
      setActiveIndex(-1);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // ── Keyboard navigation ──
  const handleKeyDown = (e) => {
    if (!showSearch || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSearch(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    setShowSearch(false);
    setActiveIndex(-1);

    const section = item.type === 'patient' ? 'patients' : 'records';
    const target = role === 'doctor' ? section : 'locker';

    // If already on the right page, scroll directly
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Navigate first, then scroll after page renders
      navigate(role === 'doctor' ? `/doctor#${target}` : `/patient#${target}`);
      setTimeout(() => {
        const el2 = document.getElementById(target);
        if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSearch(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  // ── Load notifications (prescriptions received) ──
  useEffect(() => {
    const loadNotifs = () => {
      const userId = user?._id || 'demo';
      const stored = JSON.parse(localStorage.getItem(`cc_prescriptions_${userId}`) || '[]');
      setNotifications(stored);
    };
    loadNotifs();
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

  const accentColor = role === 'doctor' ? '#8b5cf6' : '#00d4ff';

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="navbar-responsive"
      style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 260,
        right: 0,
        height: isMobile ? 56 : 68,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 32px',
        zIndex: 100,
        gap: isMobile ? 8 : 16,
      }}
    >
      {/* ── Left: Hamburger (mobile) + ECG strip (desktop) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: isMobile ? '0 0 auto' : 1,
      }}>
        {/* Hamburger toggle — visible only on mobile */}
        {isMobile && (
          <button
            className="hamburger-btn"
            onClick={onToggleSidebar}
            style={{ display: 'flex' }}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* ECG strip — hidden on mobile to save space */}
        {!isMobile && (
          <div style={{ opacity: 0.5, width: 200 }}>
            <ECGLine color={role === 'doctor' ? '#8b5cf6' : '#00d4ff'} height={36} />
          </div>
        )}
      </div>

      {/* ── Center: Smart Search ── */}
      <div
        ref={searchRef}
        style={{
          flex: 1,
          maxWidth: isMobile ? '100%' : 420,
          position: 'relative',
          minWidth: 0,
        }}
      >
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(240,244,255,0.4)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          className="input-glass"
          placeholder="Search patients, records..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSearch(true); }}
          onKeyDown={handleKeyDown}
          style={{
            paddingLeft: 40,
            paddingRight: query ? 38 : 16,
            height: isMobile ? 36 : 40,
            fontSize: isMobile ? 13 : 14,
            width: '100%',
          }}
          id="navbar-smart-search"
          autoComplete="off"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(240,244,255,0.5)',
              zIndex: 2,
              transition: 'var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(240,244,255,0.5)'; }}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}

        {/* ── Search Suggestions Dropdown ── */}
        <AnimatePresence>
          {showSearch && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: isMobile ? -12 : 0,
                right: isMobile ? -12 : 0,
                width: isMobile ? 'calc(100% + 24px)' : undefined,
                maxWidth: isMobile ? 'calc(100vw - 24px)' : undefined,
                background: 'rgba(6, 13, 28, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0,212,255,0.06)',
                overflow: 'hidden',
                zIndex: 300,
              }}
              id="search-suggestions-dropdown"
            >
              {/* Top glow bar */}
              <div style={{
                height: 2,
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                opacity: 0.5,
              }} />

              {suggestions.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: isMobile ? '10px 14px' : '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: activeIndex === index ? 'rgba(0,212,255,0.07)' : 'transparent',
                    transition: 'background 150ms ease',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: item.type === 'patient'
                      ? 'rgba(0, 212, 255, 0.12)'
                      : 'rgba(139, 92, 246, 0.12)',
                    border: `1px solid ${item.type === 'patient' ? 'rgba(0,212,255,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'var(--transition-fast)',
                    ...(activeIndex === index ? {
                      boxShadow: `0 0 12px ${item.type === 'patient' ? 'rgba(0,212,255,0.25)' : 'rgba(139,92,246,0.25)'}`,
                    } : {}),
                  }}>
                    {item.type === 'patient'
                      ? <User size={16} color="#00d4ff" />
                      : <FileText size={16} color="#8b5cf6" />
                    }
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                    }}>
                      <HighlightText text={item.name} query={query} />
                    </p>
                    <p style={{
                      fontSize: isMobile ? 11 : 12,
                      color: 'rgba(240,244,255,0.4)',
                      fontFamily: 'JetBrains Mono, monospace',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.meta}
                    </p>
                  </div>

                  {/* Type badge */}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: 20,
                    fontFamily: 'JetBrains Mono, monospace',
                    flexShrink: 0,
                    background: item.type === 'patient'
                      ? 'rgba(0,212,255,0.12)'
                      : 'rgba(139,92,246,0.12)',
                    color: item.type === 'patient' ? '#00d4ff' : '#8b5cf6',
                    border: `1px solid ${item.type === 'patient' ? 'rgba(0,212,255,0.25)' : 'rgba(139,92,246,0.25)'}`,
                  }}>
                    {item.type}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: Theme Toggle + Notifications + Profile ── */}
      <div style={{
        flex: isMobile ? '0 0 auto' : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: isMobile ? 6 : 12,
      }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-ghost"
          style={{
            padding: '8px',
            borderRadius: '50%',
            width: isMobile ? 34 : 38,
            height: isMobile ? 34 : 38,
            justifyContent: 'center',
            color: 'var(--text-primary)',
          }}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowDropdown(false); }}
            className="btn-ghost"
            style={{
              padding: '8px',
              borderRadius: '50%',
              width: isMobile ? 34 : 38,
              height: isMobile ? 34 : 38,
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={16} />
            {unread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ff4444',
                  boxShadow: '0 0 8px rgba(255,68,68,0.8)',
                }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: 'absolute',
                  right: isMobile ? -60 : 0,
                  top: 'calc(100% + 10px)',
                  width: isMobile ? 'calc(100vw - 24px)' : 360,
                  background: 'var(--bg-modal)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 16,
                  padding: 0,
                  boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                  zIndex: 200,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={15} color="var(--cyan)" />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
                  </div>
                  <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {notifications.length === 0 ? "No new notifications" : "Notification system active"}
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
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 10,
              padding: isMobile ? '4px 8px' : '6px 14px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              borderRadius: 40,
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: role === 'doctor'
                ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                : 'linear-gradient(135deg, #00d4ff, #00ff88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#000',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!isMobile && <span style={{ fontSize: 14, fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>}
            <ChevronDown size={14} style={{ opacity: 0.5 }} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: 200,
                  background: 'var(--bg-modal)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 14,
                  padding: 8,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  zIndex: 200,
                }}
              >
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderRadius: 8, fontSize: 14 }}
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