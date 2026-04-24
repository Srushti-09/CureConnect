import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ParticleField from '../components/ParticleField';

const personas = [
  { id: 'patient', emoji: '🫀', label: 'Patient', color: '#00d4ff', colorSecondary: '#00ff88', border: 'rgba(0,212,255,0.5)', glow: 'rgba(0,212,255,0.25)', gradient: 'linear-gradient(135deg, #00d4ff, #00ff88)' },
  { id: 'doctor', emoji: '🩺', label: 'Doctor', color: '#8b5cf6', colorSecondary: '#ec4899', border: 'rgba(139,92,246,0.5)', glow: 'rgba(139,92,246,0.25)', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
];

export default function PersonaSelection() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleSelect = (id) => {
    setSelected(id);
    setTimeout(() => navigate(`/auth?role=${id}`), 500);
  };

  const cardSize = isMobile ? 160 : 200;

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-grid" />
      <ParticleField count={40} color={hovered === 'doctor' ? '139, 92, 246' : '0, 212, 255'} />

      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate('/')}
        style={{ position: 'absolute', top: 24, left: isMobile ? 20 : 40, background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
        ← Back to Home
      </motion.button>

      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 64 }}>
        <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 900, letterSpacing: '-2px', marginBottom: 12 }}>Who are you?</h1>
        <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: isMobile ? 15 : 17 }}>Select your role to get started</p>
      </motion.div>

      <div style={{ display: 'flex', gap: isMobile ? 20 : 40, alignItems: 'center', justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
        {personas.map((p, i) => {
          const isHov = hovered === p.id;
          const isSel = selected === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: 'backOut' }}
              onHoverStart={() => setHovered(p.id)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => handleSelect(p.id)}
              style={{
                width: cardSize, height: cardSize, borderRadius: 28,
                background: isHov ? `linear-gradient(135deg, ${p.color}18, ${p.colorSecondary}10)` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isHov ? p.border : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                boxShadow: isHov ? `0 20px 60px ${p.glow}, 0 0 0 1px ${p.border}` : '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: isHov ? 'translateY(-8px) scale(1.04)' : isSel ? 'scale(0.97)' : 'none',
              }}
            >
              <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, background: `radial-gradient(circle, ${p.color}20, transparent 70%)`, borderRadius: '50%', opacity: isHov ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none' }} />
              <motion.div animate={isHov ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}
                style={{ fontSize: isMobile ? 52 : 68, lineHeight: 1, filter: isHov ? `drop-shadow(0 0 16px ${p.color})` : 'none', transition: 'filter 0.3s' }}>
                {p.emoji}
              </motion.div>
              <span style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: isHov ? p.color : 'rgba(240,244,255,0.85)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px', transition: 'color 0.3s' }}>
                {p.label}
              </span>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: p.gradient, opacity: isHov ? 1 : 0, transition: 'opacity 0.3s' }} />
            </motion.div>
          );
        })}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ marginTop: isMobile ? 36 : 56, fontSize: 14, color: 'rgba(240,244,255,0.3)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
        {isMobile ? 'TAP TO CONTINUE →' : 'CLICK TO CONTINUE →'}
      </motion.p>
    </div>
  );
}
