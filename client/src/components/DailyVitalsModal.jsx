import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, Droplets, ArrowRight, X } from 'lucide-react';
import { api } from '../context/AuthContext';

export default function DailyVitalsModal({ isOpen, onClose, onComplete }) {
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('72');
  const [spo2, setSpo2] = useState('98');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a background health record so it goes into the Gemini AI Timeline!
      await api.post('/records', {
        title: 'Daily Vitals Log',
        type: 'lab_report', // Closest type that fits timeline mapping for now
        fileType: 'text/plain',
        fileName: 'vitals.txt',
        fileUrl: `data:text/plain;base64,${btoa(`Heart Rate: ${hr} bpm, BP: ${bp} mmHg, SpO2: ${spo2}%`)}`
      });

      // Pass the data back to dashboard
      onComplete({ bp, hr, spo2 });
      onClose();
    } catch (err) {
      console.error('Failed to log daily vitals', err);
      // Even if it fails, close the modal to not block the user
      onComplete({ bp, hr, spo2 });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(6,13,28,0.85)', backdropFilter: 'blur(8px)',
            padding: 20
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            style={{
              background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.95) 100%)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 24, padding: 32, width: '100%', maxWidth: 400,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
              position: 'relative'
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.05)', border: 'none',
                borderRadius: '50%', width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(240,244,255,0.5)', cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'linear-gradient(135deg, #00d4ff, #00ff88)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,212,255,0.3)' }}>
                <Activity size={32} color="#000" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Good Morning! 👋</h2>
              <p style={{ color: 'rgba(240,244,255,0.6)', fontSize: 14 }}>Let's log your vitals to keep your health score accurate today.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Blood Pressure */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Activity size={14} color="#00d4ff" /> BLOOD PRESSURE (mmHg)
                </label>
                <input
                  type="text" required
                  value={bp} onChange={e => setBp(e.target.value)}
                  className="input-glass"
                  style={{ background: 'rgba(0,0,0,0.2)', fontSize: 16, fontWeight: 600, textAlign: 'center' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Heart Rate */}
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Heart size={14} color="#ff4444" /> HEART RATE
                  </label>
                  <input
                    type="number" required
                    value={hr} onChange={e => setHr(e.target.value)}
                    className="input-glass"
                    style={{ background: 'rgba(0,0,0,0.2)', fontSize: 16, fontWeight: 600, textAlign: 'center' }}
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Droplets size={14} color="#00ff88" /> OXYGEN SpO2
                  </label>
                  <input
                    type="number" required max="100"
                    value={spo2} onChange={e => setSpo2(e.target.value)}
                    className="input-glass"
                    style={{ background: 'rgba(0,0,0,0.2)', fontSize: 16, fontWeight: 600, textAlign: 'center' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 12, padding: '16px',
                  background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                  border: 'none', borderRadius: 14,
                  color: '#000', fontWeight: 800, fontSize: 16,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 20px rgba(0,212,255,0.25)', transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Saving...' : 'Log Vitals'} <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}
              >
                Skip for now
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
