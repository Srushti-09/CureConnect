import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart, Home, FileText, Calendar, Pill,
  MessageCircle, AlertTriangle, Users, BarChart2,
  ClipboardList, Activity, Stethoscope, ChevronLeft, X, Video
} from 'lucide-react';
import { useState, useEffect } from 'react';

const patientNav = [
  { icon: Home, label: 'Dashboard', path: '/patient', section: 'main' },
  { icon: Heart, label: 'Smart Triage', path: '/patient#triage', section: 'main' },
  { icon: Activity, label: 'Health Score', path: '/patient#health', section: 'main' },
  { icon: Activity, label: 'Symptom Tracker', path: '/patient#symptoms', section: 'main' },
  { icon: FileText, label: 'Health Locker', path: '/patient#locker', section: 'records' },
  { icon: Calendar, label: 'Appointments', path: '/patient#appointments', section: 'records' },
  { icon: Pill, label: 'Medications', path: '/patient#medications', section: 'records' },
  { icon: MessageCircle, label: 'AI Assistant', path: '/patient#ai', section: 'tools' },
  { icon: AlertTriangle, label: 'Emergency SOS', path: '/patient#sos', section: 'tools' },
  { icon: Video, label: 'Video Consult', path: '/consult', section: 'tools' },
];

const doctorNav = [
  { icon: Home, label: 'Dashboard', path: '/doctor', section: 'main' },
  { icon: AlertTriangle, label: 'Cascade Alerts', path: '/doctor#alerts', section: 'main' },
  { icon: Users, label: 'Patients', path: '/doctor#patients', section: 'main' },
  { icon: Calendar, label: 'Appointments', path: '/doctor#appointments', section: 'main' },
  { icon: ClipboardList, label: 'Prescriptions', path: '/doctor#prescriptions', section: 'records' },
  { icon: FileText, label: 'Records', path: '/doctor#records', section: 'records' },
  { icon: BarChart2, label: 'Analytics', path: '/admin', section: 'tools' },
  { icon: MessageCircle, label: 'AI Diagnosis', path: '/doctor#ai', section: 'tools' },
  { icon: Video, label: 'Video Consult', path: '/consult', section: 'tools' },
];

export default function Sidebar({ role, mobileOpen, onClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navItems = role === 'doctor' ? doctorNav : patientNav;
  const accentColor = role === 'doctor' ? '#8b5cf6' : '#00d4ff';
  const gradientStart = role === 'doctor' ? '#8b5cf6' : '#00d4ff';
  const gradientEnd = role === 'doctor' ? '#ec4899' : '#00ff88';

  const sections = [...new Set(navItems.map(n => n.section))];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile && mobileOpen) onClose?.();
  }, [location.pathname, location.hash]);

  const sidebarWidth = collapsed && !isMobile ? 72 : 260;

  const scroll = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNav = (e, item) => {
    if (item.path.includes('#')) {
      const [path, hash] = item.path.split('#');
      if (location.pathname === path) {
        e.preventDefault();
        scroll(hash);
        if (isMobile) onClose?.();
      }
    }
  };

  return (
    <>
      {isMobile && mobileOpen && <div className="sidebar-overlay visible" onClick={onClose} />}
      <motion.aside
        animate={{ x: isMobile ? (mobileOpen ? 0 : -280) : 0, width: sidebarWidth }}
        transition={{ duration: 0.3 }}
        className="sidebar-container"
        style={{ position: 'fixed', top: 0, left: 0, height: '100vh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', zIndex: 200, overflow: 'hidden' }}
      >
        <div className="sidebar-header" style={{ padding: collapsed && !isMobile ? '24px 0' : '24px 20px', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(!collapsed || isMobile) ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={16} color="#000" /></div>
                <span className="text-gradient" style={{ fontSize: 18, fontWeight: 800 }}>CureConnect</span>
             </div>
          ) : (
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={16} color="#000" /></div>
          )}
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {sections.map(section => (
            <div key={section} style={{ marginBottom: 12 }}>
              {(!collapsed || isMobile) && <p style={{ fontSize: 10, opacity: 0.3, textTransform: 'uppercase', padding: '8px' }}>{section}</p>}
              {navItems.filter(n => n.section === section).map(item => {
                const active = location.pathname === item.path.split('#')[0] && (location.hash === '' || location.hash === '#' + item.path.split('#')[1]);
                return (
                  <Link key={item.label} to={item.path} onClick={(e) => handleNav(e, item)} className={`nav-link ${active ? 'active' : ''}`}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 10, textDecoration: 'none', color: active ? accentColor : 'var(--text-secondary)',
                      background: active ? `rgba(${role === 'doctor' ? '139,92,246' : '0,212,255'}, 0.1)` : 'transparent'
                    }}>
                    <item.icon size={18} />
                    {(!collapsed || isMobile) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </motion.aside>
    </>
  );
}
