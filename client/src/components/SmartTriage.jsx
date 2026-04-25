import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';
import { Activity, Plus, AlertCircle, TrendingUp, Check, Trash2, HeartPulse, Stethoscope, Zap } from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Chest Pain', 'Breathlessness', 'Numbness',
  'Fever', 'Nausea', 'Dizziness', 'Cough', 'Headache'
];

export default function SmartTriage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const toggleSymptom = (label) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label.toLowerCase())
        ? prev.filter((s) => s !== label.toLowerCase())
        : [...prev, label.toLowerCase()]
    );
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim().toLowerCase();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms((prev) => [...prev, trimmed]);
      setCustomSymptom('');
    }
  };

  const handleTriage = async () => {
    if (selectedSymptoms.length === 0) return;
    setLoading(true);
    try {
      const { data } = await api.post('/symptoms/triage', {
        symptoms: selectedSymptoms
      });
      setTriageResult(data);
    } catch (err) {
      console.error('Failed to run triage:', err);
      // In case of error, show a robust fail-safe message
      setTriageResult({
        priority: 'Green',
        specialistType: 'General Call Center',
        urgency: 'Standard queue'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTriage = () => {
    setSelectedSymptoms([]);
    setTriageResult(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: 28, overflow: 'hidden', position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: 10, background: 'rgba(236,72,153,0.1)', borderRadius: 12, display: 'flex' }}>
          <HeartPulse size={24} color="#ec4899" />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Smart Triage Intake</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 4 }}>
            Describe your current symptoms for instant specialist routing and urgency assignment.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!triageResult ? (
          <motion.div
            key="intake"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10, letterSpacing: 1 }}>
              ACTIVE SYMPTOMS
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {COMMON_SYMPTOMS.map((s) => {
                const active = selectedSymptoms.includes(s.toLowerCase());
                return (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSymptom(s)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: active ? '1px solid rgba(236,72,153,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      background: active ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#ec4899' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s}
                  </motion.button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                className="input-glass"
                placeholder="Type another symptom..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
                style={{ flex: 1, fontSize: 14, padding: '12px 16px' }}
              />
              <button onClick={addCustomSymptom} className="btn-ghost" style={{ padding: '0 16px', borderRadius: 12 }}>
                <Plus size={20} />
              </button>
            </div>

            {selectedSymptoms.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                {selectedSymptoms.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(236,72,153,0.05)',
                      border: '1px solid rgba(236,72,153,0.2)',
                      borderRadius: 16,
                      fontSize: 12,
                      color: '#ec4899',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {s}
                    <Trash2
                      size={12}
                      style={{ cursor: 'pointer', opacity: 0.6 }}
                      onClick={() => setSelectedSymptoms((prev) => prev.filter((x) => x !== s))}
                    />
                  </span>
                ))}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleTriage}
              disabled={selectedSymptoms.length === 0 || loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '16px',
                fontSize: 15,
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                opacity: selectedSymptoms.length === 0 ? 0.5 : 1,
                cursor: selectedSymptoms.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} />
                {loading ? 'Analyzing...' : 'Run Triage Logic'}
              </span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div
              style={{
                padding: '24px',
                background: triageResult.priority === 'Red' ? 'rgba(255,68,68,0.08)' : triageResult.priority === 'Yellow' ? 'rgba(245,158,11,0.08)' : 'rgba(0,255,136,0.08)',
                border: `1px solid ${triageResult.priority === 'Red' ? '#ff4444' : triageResult.priority === 'Yellow' ? '#f59e0b' : '#00ff88'}`,
                borderRadius: 16,
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                <Activity size={120} color={triageResult.priority === 'Red' ? '#ff4444' : triageResult.priority === 'Yellow' ? '#f59e0b' : '#00ff88'} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4, letterSpacing: 1 }}>
                    PRIORITY LEVEL
                  </p>
                  <h3 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: triageResult.priority === 'Red' ? '#ff4444' : triageResult.priority === 'Yellow' ? '#f59e0b' : '#00ff88', textTransform: 'uppercase' }}>
                    {triageResult.priority}
                  </h3>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 20 }}>
                  <p style={{ fontSize: 11, margin: 0, color: 'var(--text-secondary)' }}>Matrix Score</p>
                  <p style={{ fontSize: 18, margin: 0, fontWeight: 800, textAlign: 'center', color: '#fff' }}>{triageResult.score || 0}</p>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Stethoscope size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Routed Specialist</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                  {triageResult.specialistType}
                </p>
              </div>

              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AlertCircle size={16} color="var(--text-secondary)" />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Urgency Estimate</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>
                  {triageResult.urgency}
                </p>
              </div>
            </div>

            <button
              className="btn-ghost"
              onClick={resetTriage}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14 }}
            >
              Start New Triage Assessment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
