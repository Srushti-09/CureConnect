import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Heart, Home, FileText, Calendar, Pill,
  MessageCircle, AlertTriangle, Users, BarChart2,
  ClipboardList, Activity, Stethoscope, ChevronLeft, X
} from 'lucide-react';
import { useState, useEffect } from 'react';

const patientNav = [
  { icon: Home, label: 'Dashboard', path: '/patient', section: 'main' },
  { icon: Activity, label: 'Health Score', path: '/patient#health', section: 'main' },
  { icon: FileText, label: 'Health Locker', path: '/patient#locker', section: 'records' },
  { icon: Calendar, label: 'Appointments', path: '/patient#appointments', section: 'records' },
  { icon: Pill, label: 'Medications', path: '/patient#medications', section: 'records' },
  { icon: MessageCircle, label: 'AI Assistant', path: '/patient#ai', section: 'tools' },
  { icon: AlertTriangle, label: 'Emergency SOS', path: '/patient#sos', section: 'tools' },
];

const doctorNav = [
  { icon: Home, label: 'Dashboard', path: '/doctor', section: 'main' },
  { icon: Users, label: 'Patients', path: '/doctor#patients', section: 'main' },
  { icon: Calendar, label: 'Appointments', path: '/doctor#appointments', section: 'main' },
  { icon: ClipboardList, label: 'Prescriptions', path: '/doctor#prescriptions', section: 'records' },
  { icon: FileText, label: 'Records', path: '/doctor#records', section: 'records' },
  { icon: BarChart2, label: 'Analytics', path: '/doctor#analytics', section: 'tools' },
  { icon: MessageCircle, label: 'AI Diagnosis', path: '/doctor#ai', section: 'tools' },
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

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile && mobileOpen) onClose?.();
  }, [location.pathname, location.hash]);

  const sidebarWidth = collapsed && !isMobile ? 72 : 260;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={isMobile ? { x: -280 } : { x: -280 }}
        animate={{
          x: isMobile ? (mobileOpen ? 0 : -280) : 0,
          width: sidebarWidth,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 200,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed && !isMobile ? '24px 0' : '24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          minHeight: 80,
        }}>
          {(!collapsed || isMobile) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Heart size={16} color="#000" fill="#000" />
                </div>
                <span style={{
                  fontSize: 18,
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px',
                }}>CureConnect</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', marginLeft: 42, fontFamily: 'JetBrains Mono, monospace' }}>
                {role === 'doctor' ? '// Doctor Portal' : '// Patient OS'}
              </p>
            </div>
          )}
          {collapsed && !isMobile && (
            <div style={{
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Heart size={18} color="#000" fill="#000" />
            </div>
          )}

          {/* Close button for mobile, Collapse button for desktop */}
          {isMobile ? (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={14} style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: '0.3s' }} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed && !isMobile ? '16px 8px' : '16px 12px' }}>
          {sections.map(section => (
            <div key={section} style={{ marginBottom: 8 }}>
              {(!collapsed || isMobile) && (
                <p style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(240,244,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  padding: '8px 8px 4px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {section}
                </p>
              )}
              {navItems.filter(n => n.section === section).map(item => {
                const active = location.pathname === item.path.split('#')[0];
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => { if (isMobile) onClose?.(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: collapsed && !isMobile ? '10px' : '10px 12px',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: active ? accentColor : 'var(--text-secondary)',
                      background: active ? `rgba(${role === 'doctor' ? '139,92,246' : '0,212,255'}, 0.1)` : 'transparent',
                      border: active ? `1px solid rgba(${role === 'doctor' ? '139,92,246' : '0,212,255'}, 0.2)` : '1px solid transparent',
                      transition: 'all 0.2s',
                      justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                      marginBottom: 2,
                      minHeight: 42,
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    data-tooltip={collapsed && !isMobile ? item.label : undefined}
                  >
                    <item.icon size={18} style={{ flexShrink: 0 }} />
                    {(!collapsed || isMobile) && (
                      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                    )}
                    {active && (!collapsed || isMobile) && (
                      <div style={{
                        marginLeft: 'auto',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: accentColor,
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom status */}
        {(!collapsed || isMobile) && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00ff88',
              }} />
              <span style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                System Online
              </span>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
