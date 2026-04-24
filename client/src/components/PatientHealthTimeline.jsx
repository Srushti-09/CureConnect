import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Stethoscope, FileText, Pill, Upload, Brain } from 'lucide-react';
import { api } from '../context/AuthContext';

const ICONS = {
  checkup: Stethoscope,
  lab: FileText,
  medication: Pill,
  procedure: Activity,
  upload: Upload,
};

export default function PatientHealthTimeline() {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/timeline')
      .then(res => {
        setTimelineEvents(res.data);
      })
      .catch(err => {
        console.error("Timeline fetch error:", err);
        setError("Failed to load timeline. Please ensure the backend is running correctly and Gemini API key is active.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '30px 20px', textAlign: 'center' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block', marginBottom: 12 }}>
          <Brain size={32} color="#8b5cf6" />
        </motion.div>
        <p style={{ color: '#8b5cf6', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Gemini AI is summarizing your health history...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'rgba(255,68,68,0.8)', fontSize: 13, padding: '20px' }}>⚠️ {error}</div>;
  }

  if (timelineEvents.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px', textAlign: 'center' }}>No health events found to summarize. Upload files or book appointments to generate your timeline!</div>;
  }

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ position: 'relative', paddingLeft: 30 }}>
        {/* Vertical line connecting events */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 14,
          width: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 0
        }} />

        {timelineEvents.map((event, index) => {
          const IconComponent = ICONS[event.type] || FileText;
          const color = event.color || '#00d4ff';
          
          return (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: -30,
                top: 2,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: `${color}20`,
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 10px ${color}40`,
                zIndex: 2,
              }}>
                <IconComponent size={14} color={color} />
              </div>

              {/* Event Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: 16,
                marginLeft: 16,
                transition: 'all 0.3s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = `${color}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>{event.title}</h4>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: `${color}15`,
                    color: color,
                    fontWeight: 600,
                    fontFamily: 'Outfit, sans-serif'
                  }}>{event.date}</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'rgba(240, 244, 255, 0.6)', lineHeight: 1.5, fontFamily: 'Outfit, sans-serif' }}>
                  {event.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 12, color: 'rgba(240, 244, 255, 0.4)', fontWeight: 500, fontFamily: 'Outfit, sans-serif' }}>{event.doctor || 'System'}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
