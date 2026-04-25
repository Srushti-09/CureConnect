import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const InteractionAlert = ({ interactions, onClose, onConfirm }) => {
  if (!interactions || interactions.length === 0) return null;

  const hasSevere = interactions.some(i => i.severity === 'Severe');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        padding: 20
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 500,
          padding: 24,
          border: `1px solid ${hasSevere ? '#ff444450' : '#f59e0b50'}`,
          boxShadow: `0 20px 40px ${hasSevere ? '#ff444415' : '#f59e0b15'}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hasSevere ? (
              <AlertCircle color="#ff4444" size={24} />
            ) : (
              <AlertTriangle color="#f59e0b" size={24} />
            )}
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Drug Interaction Detected</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {interactions.map((interaction, idx) => (
            <div 
              key={idx}
              style={{
                padding: 16,
                background: interaction.severity === 'Severe' ? 'rgba(255,68,68,0.1)' : 
                            interaction.severity === 'Moderate' ? 'rgba(245,158,11,0.1)' : 
                            'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  interaction.severity === 'Severe' ? 'rgba(255,68,68,0.2)' : 
                  interaction.severity === 'Moderate' ? 'rgba(245,158,11,0.2)' : 
                  'rgba(255,255,255,0.1)'
                }`,
                borderRadius: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{interaction.drugA} + {interaction.drugB}</span>
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 900, 
                  padding: '2px 8px', 
                  borderRadius: 10,
                  background: interaction.severity === 'Severe' ? '#ff4444' : 
                             interaction.severity === 'Moderate' ? '#f59e0b' : 
                             '#00d4ff',
                  color: '#fff'
                }}>
                  {interaction.severity.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>
                {interaction.warning}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onClose}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Go Back & Edit
          </button>
          <button 
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: hasSevere ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
              border: hasSevere ? '1px solid rgba(255,68,68,0.3)' : 'none',
              borderRadius: 12, 
              color: '#fff', 
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {hasSevere ? 'Confirm Risk & Save' : 'Proceed Anyway'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InteractionAlert;
