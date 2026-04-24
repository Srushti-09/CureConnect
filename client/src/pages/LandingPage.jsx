import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import ParticleField from '../components/ParticleField';
import ECGLine from '../components/ECGLine';
import { Heart, Shield, Zap, ArrowRight, Activity, Lock, Globe, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

// ── Hero rotating visuals ──────────────────────────────────────────────────
const heroSlides = [
  {
    id: 0,
    emoji: '🫀',
    title: 'Real-time Health Monitoring',
    subtitle: 'Live vitals. AI predictions. Zero delays.',
    bg: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,255,136,0.08) 100%)',
    border: 'rgba(0,212,255,0.3)',
    glow: 'rgba(0,212,255,0.2)',
    accent: '#00d4ff',
    stats: [
      { label: 'Heart Rate', value: '72 bpm', icon: '❤️' },
      { label: 'Blood O₂', value: '98%', icon: '🫁' },
      { label: 'BP', value: '118/76', icon: '🩺' },
    ],
  },
  {
    id: 1,
    emoji: '🔒',
    title: 'Secure Health Records',
    subtitle: 'Your documents, private — shared only by you.',
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.08) 100%)',
    border: 'rgba(139,92,246,0.3)',
    glow: 'rgba(139,92,246,0.2)',
    accent: '#8b5cf6',
    stats: [
      { label: 'Encrypted', value: '256-bit', icon: '🔐' },
      { label: 'Private', value: '100%', icon: '✅' },
      { label: 'Records', value: '2.4M+', icon: '📋' },
    ],
  },
  {
    id: 2,
    emoji: '🤖',
    title: 'AI Health Assistant',
    subtitle: 'Smart insights personalized to you.',
    bg: 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,212,255,0.08) 100%)',
    border: 'rgba(0,255,136,0.3)',
    glow: 'rgba(0,255,136,0.2)',
    accent: '#00ff88',
    stats: [
      { label: 'Accuracy', value: '94.7%', icon: '🎯' },
      { label: 'Response', value: '< 1s', icon: '⚡' },
      { label: 'Languages', value: '42', icon: '🌍' },
    ],
  },
  {
    id: 3,
    emoji: '👨‍⚕️',
    title: 'Connect to Top Doctors',
    subtitle: 'Video · Voice · In-Person — your call.',
    bg: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(139,92,246,0.08) 100%)',
    border: 'rgba(236,72,153,0.3)',
    glow: 'rgba(236,72,153,0.2)',
    accent: '#ec4899',
    stats: [
      { label: 'Specialists', value: '12K+', icon: '🏥' },
      { label: 'Avg. Wait', value: '< 2min', icon: '⏱️' },
      { label: 'Rating', value: '4.9★', icon: '⭐' },
    ],
  },
  {
    id: 4,
    emoji: '💊',
    title: 'Smart Medication Tracker',
    subtitle: 'Never miss a dose. Intelligent reminders.',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(255,68,68,0.08) 100%)',
    border: 'rgba(245,158,11,0.3)',
    glow: 'rgba(245,158,11,0.2)',
    accent: '#f59e0b',
    stats: [
      { label: 'Adherence', value: '+47%', icon: '📈' },
      { label: 'Reminders', value: 'Smart', icon: '🔔' },
      { label: 'Rx Refills', value: 'Auto', icon: '🔄' },
    ],
  },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef(null);

  const goTo = (idx, direction) => {
    setDir(direction);
    setCurrent(idx);
  };

  const next = () => goTo((current + 1) % heroSlides.length, 1);
  const prev = () => goTo((current - 1 + heroSlides.length) % heroSlides.length, -1);

  useEffect(() => {
    timerRef.current = setInterval(() => next(), 3200);
    return () => clearInterval(timerRef.current);
  }, [current]);

  const slide = heroSlides[current];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
      {/* Main Card */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={slide.id}
          custom={dir}
          variants={{
            enter: d => ({ opacity: 0, x: d * 60, scale: 0.94 }),
            center: { opacity: 1, x: 0, scale: 1 },
            exit: d => ({ opacity: 0, x: -d * 60, scale: 0.94 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: slide.bg,
            border: `1px solid ${slide.border}`,
            borderRadius: 28,
            padding: '44px 40px',
            boxShadow: `0 0 80px ${slide.glow}, 0 20px 60px rgba(0,0,0,0.4)`,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow orb */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220,
            background: `radial-gradient(circle, ${slide.accent}25, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <motion.span
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{ fontSize: 56, lineHeight: 1 }}
            >
              {slide.emoji}
            </motion.span>

            {/* Live badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px',
              background: `${slide.accent}18`,
              border: `1px solid ${slide.accent}40`,
              borderRadius: 40,
              fontSize: 12,
              color: slide.accent,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: slide.accent,
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }} />
              LIVE
            </div>
          </div>

          <h3 style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 8,
            letterSpacing: '-0.4px',
          }}>
            {slide.title}
          </h3>
          <p style={{
            fontSize: 14,
            color: 'rgba(240,244,255,0.5)',
            marginBottom: 28,
            lineHeight: 1.6,
          }}>
            {slide.subtitle}
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 10 }}>
            {slide.stats.map(s => (
              <div key={s.label} style={{
                flex: 1,
                padding: '12px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <p style={{ fontSize: 15, fontWeight: 800, color: slide.accent, letterSpacing: '-0.3px' }}>{s.value}</p>
                <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom ECG strip */}
          <div style={{ marginTop: 20, opacity: 0.6 }}>
            <ECGLine color={slide.accent} height={36} speed={3} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        style={{
          position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--bg-dropdown)', border: '1px solid var(--border-glass)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(240,244,255,0.7)',
          zIndex: 10,
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        style={{
          position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--bg-dropdown)', border: '1px solid var(--border-glass)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(240,244,255,0.7)',
          zIndex: 10,
        }}
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20,
      }}>
        {heroSlides.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? slide.accent : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

const SEQUENCE_DURATION = 5500; // ms for intro to complete

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0=boot, 1=ecg, 2=logo, 3=content
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user already saw intro
    if (sessionStorage.getItem('cc_intro_done')) {
      setPhase(3);
      return;
    }

    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => {
      setPhase(3);
      sessionStorage.setItem('cc_intro_done', '1');
    }, SEQUENCE_DURATION);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSkip = () => {
    setPhase(3);
    sessionStorage.setItem('cc_intro_done', '1');
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { value: '2.4M+', label: 'Patients Connected', icon: Activity },
    { value: '98.7%', label: 'Uptime SLA', icon: Shield },
    { value: '512-bit', label: 'Encryption', icon: Lock },
    { value: '190+', label: 'Countries', icon: Globe },
  ];

  const features = [
    {
      icon: '🔒',
      title: 'Private Health Records',
      desc: 'Your documents are encrypted and private. Access is controlled by you — share only with trusted doctors via a secure code.',
      color: '#00d4ff',
    },
    {
      icon: '🤖',
      title: 'AI Health Assistant',
      desc: 'Powered by the latest medical AI models. Get instant insights, track vitals, predict risks.',
      color: '#8b5cf6',
    },
    {
      icon: '⚡',
      title: 'Real-Time Sync',
      desc: 'Prescriptions, appointments, and records sync instantly between patients and doctors.',
      color: '#00ff88',
    },
    {
      icon: '🏥',
      title: 'Doctor Network',
      desc: 'Connect with verified specialists. Video, voice, or in-person — on your schedule.',
      color: '#ec4899',
    },
  ];

  const navLinks = ['Features', 'Security', 'Doctors', 'Pricing'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deepest)', position: 'relative', overflow: 'hidden' }}>
      {/* Background layers */}
      <div className="bg-grid" />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── PHASE 0: Boot screen ── */}
      <AnimatePresence>
        {phase < 1 && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg-deepest)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
              style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 0 60px rgba(0,212,255,0.4)',
              }}
            >
              <Heart size={36} color="#000" fill="#000" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(0,212,255,0.6)', fontSize: 13, letterSpacing: 2 }}
            >
              INITIALIZING CURECONNECT OS...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE 1 & 2: ECG + Logo Reveal ── */}
      <AnimatePresence>
        {phase >= 1 && phase < 3 && (
          <motion.div
            key="ecg-reveal"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg-deepest)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              gap: 40,
            }}
          >
            <ParticleField count={40} />

            {/* ECG line */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ width: '60vw', maxWidth: 700, transformOrigin: 'left' }}
            >
              <ECGLine color="#00d4ff" height={80} speed={4} />
            </motion.div>

            {/* Logo assembles */}
            <AnimatePresence>
              {phase >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'backOut' }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                    <motion.div
                      animate={{ boxShadow: ['0 0 30px rgba(0,212,255,0.4)', '0 0 60px rgba(0,212,255,0.7)', '0 0 30px rgba(0,212,255,0.4)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{
                        width: 60,
                        height: 60,
                        background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Heart size={28} color="#000" fill="#000" />
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="landing-intro-title"
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-2px',
                      }}
                    >
                      CureConnect
                    </motion.h1>
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, letterSpacing: 3 }}
                  >
                    CONNECTING CARE · ANYTIME · ANYWHERE
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleSkip}
              style={{
                position: 'fixed',
                bottom: 40,
                right: 40,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 40,
                padding: '8px 20px',
                color: 'rgba(240,244,255,0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Skip Intro →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PHASE 3: Main Landing Page ── */}
      {phase === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <ParticleField count={55} />

          {/* ── Responsive Nav bar ── */}
          <nav className="landing-navbar">
            {/* Logo */}
            <div className="landing-navbar-logo">
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Heart size={18} color="#000" fill="#000" />
              </div>
              {/* Cursive name in navbar (no typewriter, just styled) */}
              <span style={{
                fontFamily: '"Dancing Script", cursive',
                fontSize: 24,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>CureConnect</span>
            </div>

            {/* Desktop nav links */}
            <div className="landing-nav-links">
              {navLinks.map(item => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  style={{
                    color: 'rgba(240,244,255,0.6)',
                    background: 'none',
                    border: 'none',
                    fontSize: 15,
                    fontFamily: 'Outfit, sans-serif',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                    padding: 0,
                  }}
                  onMouseEnter={e => e.target.style.color = '#00d4ff'}
                  onMouseLeave={e => e.target.style.color = 'rgba(240,244,255,0.6)'}
                >{item}</button>
              ))}
            </div>

            {/* Desktop action buttons */}
            <div className="landing-nav-actions">
              <button className="btn-ghost" onClick={() => navigate('/auth')} style={{ padding: '9px 20px', fontSize: 14 }}>
                Sign In
              </button>
              <button className="btn-primary" onClick={() => navigate('/select')} style={{ padding: '9px 20px', fontSize: 14 }}>
                <span>Get Started</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="hamburger-btn landing-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>

          {/* ── Mobile menu overlay ── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="landing-mobile-menu"
              >
                {navLinks.map(item => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="landing-mobile-menu-link"
                  >{item}</button>
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
                <button className="btn-ghost" onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  Sign In
                </button>
                <button className="btn-primary" onClick={() => { setMobileMenuOpen(false); navigate('/select'); }} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  <span>Get Started</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Hero Section — uses CSS classes for responsive ── */}
          <section className="hero-section">
            {/* Left column — text */}
            <div className="hero-text">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  borderRadius: 40,
                  marginBottom: 32,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px rgba(0,255,136,0.6)' }} />
                <span style={{ fontSize: 13, color: 'rgba(0,212,255,0.9)', fontFamily: 'JetBrains Mono, monospace' }}>
                  v2.0 · Now with AI Health Insights
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{
                  fontSize: 'clamp(40px, 5.5vw, 76px)',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-3px',
                  marginBottom: 24,
                }}
              >
                Your Health.
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #00d4ff 20%, #00ff88 80%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Reimagined.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontSize: 18,
                  color: 'rgba(240,244,255,0.6)',
                  lineHeight: 1.75,
                  marginBottom: 40,
                  maxWidth: 480,
                }}
              >
                The next-generation digital health OS. Secure records,
                AI-powered insights, and seamless doctor-patient connectivity.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}
              >
                <button
                  className="btn-primary"
                  onClick={() => navigate('/select')}
                  style={{ padding: '14px 32px', fontSize: 16, borderRadius: 50 }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Start for Free <ArrowRight size={18} />
                  </span>
                </button>
                <button className="btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
                  Watch Demo
                </button>
              </motion.div>

              {/* ECG strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                style={{ maxWidth: 480 }}
              >
                <ECGLine color="#00d4ff" height={48} />
              </motion.div>
            </div>

            {/* Right column — rotating carousel */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="hero-carousel-wrap"
            >
              <HeroCarousel />
            </motion.div>
          </section>

          {/* ── Stats — uses CSS class for responsive grid ── */}
          <section className="landing-section">
            <div className="content-container">
              <div className="landing-stats-grid">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{ padding: '28px 24px', textAlign: 'center' }}
                  >
                    <stat.icon size={24} style={{ color: '#00d4ff', marginBottom: 12 }} />
                    <p style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{stat.value}</p>
                    <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', marginTop: 6 }}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features — uses CSS class for responsive grid ── */}
          <section id="features" className="landing-section">
            <div className="content-container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', marginBottom: 64 }}
              >
                <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 16 }}>
                  Built for the <span style={{ background: 'linear-gradient(135deg,#00d4ff,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>future</span>
                </h2>
                <p style={{ color: 'rgba(240,244,255,0.55)', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>
                  Every feature engineered with precision, security, and care at its core.
                </p>
              </motion.div>

              <div className="landing-grid-2">
                {features.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="glass-card"
                    style={{
                      padding: '36px',
                      border: `1px solid ${feat.color}22`,
                      boxShadow: `0 0 40px ${feat.color}10`,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -30, right: -30,
                      width: 120, height: 120,
                      background: `radial-gradient(circle, ${feat.color}15, transparent)`,
                      borderRadius: '50%',
                    }} />
                    <span style={{ fontSize: 40, marginBottom: 20, display: 'block' }}>{feat.icon}</span>
                    <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: feat.color }}>{feat.title}</h3>
                    <p style={{ color: 'rgba(240,244,255,0.6)', lineHeight: 1.7, fontSize: 15 }}>{feat.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA Section ── */}
          <section id="security" className="landing-section landing-section-cta">
            <div className="content-container" style={{ maxWidth: 800 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-card landing-cta-card"
                style={{
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.15)',
                  boxShadow: '0 0 80px rgba(0,212,255,0.08)',
                }}
              >
                <Zap size={48} style={{ color: '#00d4ff', marginBottom: 24 }} />
                <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
                  Ready to transform<br />
                  <span className="gradient-text-cyan">your health journey?</span>
                </h2>
                <p style={{ color: 'rgba(240,244,255,0.55)', fontSize: 17, marginBottom: 40, lineHeight: 1.7 }}>
                  Join millions of patients and doctors who trust CureConnect for their most important health decisions.
                </p>
                <div className="landing-cta-buttons">
                  <button className="btn-primary" onClick={() => navigate('/select')} style={{ padding: '15px 40px', fontSize: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>I'm a Patient <ArrowRight size={18} /></span>
                  </button>
                  <button className="btn-ghost" onClick={() => navigate('/select')} style={{ padding: '15px 40px', fontSize: 16 }}>
                    I'm a Doctor
                  </button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="landing-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Heart size={16} color="#00d4ff" />
              <span style={{ fontSize: 14, color: 'rgba(240,244,255,0.4)' }}>© 2024 CureConnect. Built with care.</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
              v2.0.0 · All systems operational
            </p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}
