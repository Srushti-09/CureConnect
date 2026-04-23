import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';
import {
  Activity, Plus, AlertTriangle, TrendingUp,
  Check, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';

// ── Common symptom presets for quick selection ──
const SYMPTOM_PRESETS = [
  { label: 'Fatigue', emoji: '😴' },
  { label: 'Headache', emoji: '🤕' },
  { label: 'Nausea', emoji: '🤢' },
  { label: 'Fever', emoji: '🤒' },
  { label: 'Cough', emoji: '😷' },
  { label: 'Body Pain', emoji: '💪' },
  { label: 'Dizziness', emoji: '😵' },
  { label: 'Breathlessness', emoji: '🫁' },
  { label: 'Chest Pain', emoji: '💔' },
  { label: 'Insomnia', emoji: '🌙' },
  { label: 'Loss of Appetite', emoji: '🍽️' },
  { label: 'Anxiety', emoji: '😰' },
];

const SEVERITY_LABELS = ['', 'Mild', 'Low', 'Moderate', 'High', 'Severe'];
const SEVERITY_COLORS = ['', '#00ff88', '#00d4ff', '#f59e0b', '#ff6b35', '#ff4444'];

export default function SymptomLogger() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customSymptom, setCustomSymptom] = useState('');

  // Fetch recent symptom history
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/symptoms');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch symptom history:', err);
    }
  };

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

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) return;
    setLoading(true);
    try {
      await api.post('/symptoms', {
        symptoms: selectedSymptoms,
        severity,
        notes,
      });
      setSubmitted(true);
      setSelectedSymptoms([]);
      setSeverity(1);
      setNotes('');
      fetchHistory();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to log symptoms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a cascade pattern exists in recent history
  const cascadeDetected = (() => {
    if (history.length < 2) return false;
    const recent = history.slice(0, 3);
    for (let i = 1; i < recent.length; i++) {
      if (recent[i - 1].severity > recent[i].severity) return true;
      const newOnes = recent[i - 1].symptoms.filter(
        (s) => !recent[i].symptoms.includes(s)
      );
      if (newOnes.length > 0) return true;
    }
    return false;
  })();

  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  return (
    <div>
      {/* ── Success Banner ── */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: '12px 16px',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.3)',
              borderRadius: 10,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#00ff88',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Check size={16} /> Symptoms logged! Your doctor will be notified if a pattern is detected.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cascade Warning ── */}
      {cascadeDetected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '12px 16px',
            background: 'rgba(255,68,68,0.08)',
            border: '1px solid rgba(255,68,68,0.25)',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={18} color="#ff4444" />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#ff4444' }}>
              Escalating Pattern Detected
            </p>
            <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>
              Your symptoms are escalating. Your doctor has been alerted.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Symptom Chips ── */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 10, letterSpacing: 1 }}>
        SELECT SYMPTOMS
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {SYMPTOM_PRESETS.map((s) => {
          const active = selectedSymptoms.includes(s.label.toLowerCase());
          return (
            <motion.button
              key={s.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSymptom(s.label)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: active
                  ? '1px solid rgba(0,212,255,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: active
                  ? 'rgba(0,212,255,0.12)'
                  : 'rgba(255,255,255,0.03)',
                color: active ? '#00d4ff' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 14 }}>{s.emoji}</span>
              {s.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Custom Symptom Input ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          className="input-glass"
          placeholder="Add custom symptom..."
          value={customSymptom}
          onChange={(e) => setCustomSymptom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
          style={{ flex: 1, fontSize: 13, padding: '10px 14px' }}
        />
        <button
          onClick={addCustomSymptom}
          className="btn-ghost"
          style={{ padding: '10px 14px', borderRadius: 10 }}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* ── Selected Symptoms Tags ── */}
      {selectedSymptoms.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {selectedSymptoms.map((s) => (
            <span
              key={s}
              style={{
                padding: '4px 12px',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: 16,
                fontSize: 12,
                color: '#00d4ff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {s}
              <Trash2
                size={12}
                style={{ cursor: 'pointer', opacity: 0.6 }}
                onClick={() =>
                  setSelectedSymptoms((prev) => prev.filter((x) => x !== s))
                }
              />
            </span>
          ))}
        </div>
      )}

      {/* ── Severity Slider ── */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>
        SEVERITY LEVEL
      </p>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <input
            type="range"
            min="1"
            max="5"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: SEVERITY_COLORS[severity],
              height: 6,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: SEVERITY_COLORS[severity],
              fontFamily: 'JetBrains Mono, monospace',
              minWidth: 70,
              textAlign: 'right',
            }}
          >
            {severity}/5 {SEVERITY_LABELS[severity]}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  n <= severity
                    ? SEVERITY_COLORS[severity]
                    : 'rgba(255,255,255,0.1)',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Notes ── */}
      <textarea
        className="input-glass"
        placeholder="Optional notes (e.g., 'worse after lunch')..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        style={{
          fontSize: 13,
          resize: 'none',
          marginBottom: 16,
          fontFamily: 'Outfit, sans-serif',
        }}
      />

      {/* ── Submit ── */}
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={selectedSymptoms.length === 0 || loading}
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '14px',
          opacity: selectedSymptoms.length === 0 ? 0.4 : 1,
          cursor: selectedSymptoms.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} />
          {loading ? 'Logging...' : 'Log Today\'s Symptoms'}
        </span>
      </button>

      {/* ── History Toggle ── */}
      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            RECENT LOGS ({Math.min(history.length, 7)})
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: 10 }}
              >
                {history.slice(0, 7).map((log, i) => (
                  <div
                    key={log._id || i}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatDate(log.date)}
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: SEVERITY_COLORS[log.severity],
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        SEV {log.severity}/5
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {log.symptoms.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: '2px 8px',
                            background: 'rgba(0,212,255,0.06)',
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
