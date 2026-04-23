import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Stethoscope, FileText, Pill } from 'lucide-react';

const timelineEvents = [
  {
    id: 1,
    date: 'Apr 20, 2026',
    title: 'Routine Checkup',
    description: 'General health checkup. Vitals are normal. Blood pressure slightly elevated.',
    type: 'checkup',
    doctor: 'Dr. Priya Mehta',
    icon: Stethoscope,
    color: '#00d4ff', // Cyan
  },
  {
    id: 2,
    date: 'Mar 15, 2026',
    title: 'Lab Test: Blood Panel',
    description: 'Complete blood count and lipid panel. Cholesterol levels improved.',
    type: 'lab',
    doctor: 'LabCorp',
    icon: FileText,
    color: '#f59e0b', // Orange
  },
  {
    id: 3,
    date: 'Jan 10, 2026',
    title: 'Prescription Refill',
    description: 'Lisinopril 10mg prescribed for 3 months.',
    type: 'medication',
    doctor: 'Dr. Sarah Chen',
    icon: Pill,
    color: '#8b5cf6', // Purple
  },
  {
    id: 4,
    date: 'Nov 05, 2025',
    title: 'Vaccination',
    description: 'Annual Flu shot administered.',
    type: 'procedure',
    doctor: 'Pharmacy Clinic',
    icon: Activity,
    color: '#00ff88', // Green
  }
];

export default function PatientHealthTimeline() {
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

        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.id}
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
              background: `${event.color}20`,
              border: `2px solid ${event.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 10px ${event.color}40`,
              zIndex: 2,
            }}>
              <event.icon size={14} color={event.color} />
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
                e.currentTarget.style.borderColor = `${event.color}50`;
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
                  background: `${event.color}15`,
                  color: event.color,
                  fontWeight: 600,
                  fontFamily: 'Outfit, sans-serif'
                }}>{event.date}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'rgba(240, 244, 255, 0.6)', lineHeight: 1.5, fontFamily: 'Outfit, sans-serif' }}>
                {event.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: event.color }} />
                <span style={{ fontSize: 12, color: 'rgba(240, 244, 255, 0.4)', fontWeight: 500, fontFamily: 'Outfit, sans-serif' }}>{event.doctor}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
