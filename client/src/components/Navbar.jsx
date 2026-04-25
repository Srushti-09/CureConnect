import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bell, Settings, LogOut, Search,
  ChevronDown, Pill, X, Clock, User, FileText, Menu, AlertTriangle, Sun, Moon
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import ECGLine from './ECGLine';

const MOCK_DATA = [
  { id: 1, name: 'Aarav Sharma', type: 'patient', meta: 'ID: P-10234 • Cardiology' },
  { id: 2, name: 'Priya Patel', type: 'patient', meta: 'ID: P-10412 • Neurology' },
];

export default function Navbar({ role, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <motion.nav className="navbar-container" style={{ position: 'fixed', top: 0, left: isMobile ? 0 : 260, right: 0, height: isMobile ? 56 : 68, background: 'var(--bg-navbar)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && <button onClick={onToggleSidebar} className="btn-ghost"><Menu size={20} /></button>}
        {!isMobile && <div style={{ width: 200, opacity: 0.5 }}><ECGLine color={role === 'doctor' ? '#8b5cf6' : '#00d4ff'} height={36} /></div>}
      </div>

      <div ref={searchRef} style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
        <input className="input-glass" placeholder="Search..." style={{ paddingLeft: 36, width: '100%' }} value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggleTheme} className="btn-ghost" style={{ borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn-ghost" style={{ position: 'relative' }}>
            <Bell size={18} />
            {unread > 0 && <span className="notif-badge" style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: '#ff4444', borderRadius: '50%' }} />}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dropdown-panel glass-card" style={{ position: 'absolute', right: 0, top: '100%', width: 300, padding: 16 }}>
                <p style={{ fontWeight: 700, marginBottom: 12 }}>Notifications</p>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? <p style={{ fontSize: 12, opacity: 0.5 }}>No new notifications</p> : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>{user?.name?.[0]}</div>
            {!isMobile && <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user?.name}</span>}
            <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dropdown-panel glass-card" style={{ position: 'absolute', right: 0, top: '100%', width: 180, padding: 8, marginTop: 8 }}>
                <button className="dropdown-item" onClick={() => navigate('/profile')}><User size={14} /> Profile</button>
                <button className="dropdown-item" onClick={() => navigate('/settings')}><Settings size={14} /> Settings</button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <button className="dropdown-item text-red" onClick={handleLogout}><LogOut size={14} /> Logout</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.nav>
  );
}