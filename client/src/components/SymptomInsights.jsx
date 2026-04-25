import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../context/AuthContext';
import {
  Heart, Leaf, Dumbbell, Stethoscope, TrendingUp,
  Calendar, ChevronRight, Sparkles, AlertTriangle,
  CheckCircle, Clock, X, BarChart3
} from 'lucide-react';

const STATUS_CONFIG = {
  good: { color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', icon: CheckCircle, label: 'All Good' },
  caution: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, label: 'Monitor' },
  concern: { color: '#ff4444', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.25)', icon: AlertTriangle, label: 'Attention' },
};

// ── Daily Insights Panel ──
export function DailyInsights({ symptoms, severity, visible, onClose }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && symptoms?.length > 0) {
      setLoading(true);
      api.post('/symptoms/insights', { symptoms, severity })
        .then(res => setInsights(res.data))
        .catch(err => console.error('Insights error:', err))
        .finally(() => setLoading(false));
    }
  }, [visible, symptoms, severity]);

  if (!visible) return null;

  const cardStyle = {
    padding: 14, borderRadius: 12, marginBottom: 8,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        style={{ marginTop: 20 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>
              YOUR DAILY INSIGHTS
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(240,244,255,0.5)', fontSize: 13 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
              <Sparkles size={24} color="#f59e0b" />
            </motion.div>
            <p style={{ marginTop: 10 }}>Generating personalized insights...</p>
          </div>
        ) : insights ? (
          <div>
            {/* Daily Tip Banner */}
            {insights.dailyTip && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                padding: '12px 16px', background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,255,136,0.06))',
                border: '1px solid rgba(0,212,255,0.2)', borderRadius: 12, marginBottom: 16,
                fontSize: 13, color: 'rgba(240,244,255,0.8)', fontStyle: 'italic', lineHeight: 1.5,
              }}>
                {insights.dailyTip}
              </motion.div>
            )}

            {/* Home Remedies */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Leaf size={14} color="#00ff88" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#00ff88', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>HOME REMEDIES</span>
              </div>
              {insights.homeRemedies?.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{r.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.6)', lineHeight: 1.5 }}>{r.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Exercises */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Dumbbell size={14} color="#00d4ff" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>RECOMMENDED EXERCISES</span>
              </div>
              {insights.exercises?.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{e.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.title}</p>
                        {e.duration && (
                          <span style={{ fontSize: 10, color: '#00d4ff', background: 'rgba(0,212,255,0.1)', padding: '2px 8px', borderRadius: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                            <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{e.duration}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.6)', lineHeight: 1.5 }}>{e.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Medical Suggestion */}
            {insights.medicalSuggestion && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Stethoscope size={14} color="#8b5cf6" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>MEDICAL SUGGESTION</span>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{
                  ...cardStyle,
                  background: insights.medicalSuggestion.urgency === 'high' ? 'rgba(255,68,68,0.06)' : 'rgba(139,92,246,0.06)',
                  border: `1px solid ${insights.medicalSuggestion.urgency === 'high' ? 'rgba(255,68,68,0.2)' : 'rgba(139,92,246,0.15)'}`,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: insights.medicalSuggestion.urgency === 'high' ? '#ff4444' : '#8b5cf6', marginBottom: 6 }}>
                    {insights.medicalSuggestion.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)', lineHeight: 1.6, marginBottom: 8 }}>
                    {insights.medicalSuggestion.description}
                  </p>
                  {insights.medicalSuggestion.specialist && insights.medicalSuggestion.specialist !== 'Not needed at this time' && (
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontFamily: 'JetBrains Mono, monospace' }}>
                      Specialist: {insights.medicalSuggestion.specialist}
                    </span>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Weekly Analysis Panel ──
export function WeeklyAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchAnalysis = () => {
    setLoading(true);
    setExpanded(true);
    api.get('/symptoms/weekly-analysis')
      .then(res => setAnalysis(res.data))
      .catch(err => console.error('Weekly analysis error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalysis(); }, []);

  const cfg = analysis?.overallStatus ? STATUS_CONFIG[analysis.overallStatus] : STATUS_CONFIG.good;
  const StatusIcon = cfg.icon;

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={() => { if (!analysis) fetchAnalysis(); else setExpanded(!expanded); }}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace' }}>
        <BarChart3 size={14} />
        WEEKLY ANALYSIS
        <ChevronRight size={14} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: 10 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'rgba(240,244,255,0.5)', fontSize: 13 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                  <BarChart3 size={20} color="#00d4ff" />
                </motion.div>
                <p style={{ marginTop: 8 }}>Analyzing your week...</p>
              </div>
            ) : analysis && !analysis.hasEnoughData ? (
              <div style={{ padding: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center' }}>
                <Calendar size={28} color="rgba(240,244,255,0.3)" />
                <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.6)', marginTop: 10 }}>{analysis.message}</p>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12 }}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} style={{ width: 24, height: 6, borderRadius: 3, background: d <= analysis.daysLogged ? '#00d4ff' : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                  {analysis.daysLogged}/{analysis.daysNeeded} days logged
                </p>
              </div>
            ) : analysis?.hasEnoughData ? (
              <div>
                {/* Status Card */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                  padding: 16, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <StatusIcon size={20} color={cfg.color} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{analysis.statusTitle}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)', lineHeight: 1.6 }}>{analysis.statusDescription}</p>
                  {analysis.shouldSeeDoctor && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,68,68,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={14} color="#ff4444" />
                      <span style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600 }}>
                        Doctor visit recommended ({analysis.doctorUrgency})
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Patterns */}
                {analysis.patterns?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>PATTERNS DETECTED</p>
                    {analysis.patterns.map((p, i) => (
                      <div key={i} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.observation}</p>
                        <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{p.interpretation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>RECOMMENDATIONS</p>
                    {analysis.recommendations.map((r, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        style={{ padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 18 }}>{r.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</p>
                            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>{r.type}</span>
                          </div>
                          <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.6)', lineHeight: 1.5 }}>{r.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Exercise Plan */}
                {analysis.weeklyExercisePlan && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, letterSpacing: 1 }}>EXERCISE PLAN</p>
                    <div style={{ padding: 12, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#00d4ff', marginBottom: 8 }}>{analysis.weeklyExercisePlan.title}</p>
                      {analysis.weeklyExercisePlan.activities?.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < analysis.weeklyExercisePlan.activities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <Dumbbell size={12} color="rgba(0,212,255,0.5)" />
                          <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, minWidth: 100 }}>{a.name}</span>
                          <span style={{ fontSize: 10, color: 'rgba(240,244,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>{a.frequency} · {a.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encouragement */}
                {analysis.encouragement && (
                  <div style={{ padding: '10px 14px', background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,212,255,0.06))', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 10, fontSize: 12, color: 'rgba(240,244,255,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>
                    {analysis.encouragement}
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
