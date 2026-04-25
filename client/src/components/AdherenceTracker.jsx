import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Pill, Activity, TrendingUp } from 'lucide-react';
import { api } from '../context/AuthContext';

const AdherenceTracker = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [compliance, setCompliance] = useState({ score: 100, status: 'Excellent' });
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prescRes, compRes] = await Promise.all([
          api.get('/prescriptions'),
          api.get(`/adherence/compliance/${patientId || ''}`)
        ]);
        
        setPrescriptions(prescRes.data.filter(p => p.status === 'active'));
        setCompliance(compRes.data);
        
        // Load today's logs
        const logsRes = await api.get(`/adherence/${patientId || ''}`);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLogs = {};
        logsRes.data.forEach(log => {
          if (log.date.split('T')[0] === todayStr) {
            todayLogs[log.medicineName] = log.status;
          }
        });
        setLogs(todayLogs);
      } catch (err) {
        console.error('Failed to fetch adherence data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  const markLog = async (prescriptionId, medicineName, status) => {
    try {
      await api.post('/adherence/mark', {
        prescriptionId,
        medicineName,
        status,
        date: new Date()
      });
      setLogs(prev => ({ ...prev, [medicineName]: status }));
      
      // Refresh score
      const compRes = await api.get(`/adherence/compliance/${patientId || ''}`);
      setCompliance(compRes.data);
    } catch (err) {
      console.error('Marking failed', err);
    }
  };

  if (loading) return <div>Loading tracker...</div>;

  const activeMeds = prescriptions.flatMap(p => p.medications.map(m => ({ ...m, prescriptionId: p._id })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Compliance Score Bar */}
      <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={compliance.score > 75 ? '#00ff88' : '#f59e0b'} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Compliance Score</span>
          </div>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 800, 
            padding: '2px 10px', 
            borderRadius: 20,
            background: compliance.score >= 90 ? 'rgba(0,255,136,0.1)' : 
                        compliance.score >= 75 ? 'rgba(0,212,255,0.1)' : 'rgba(255,68,68,0.1)',
            color: compliance.score >= 90 ? '#00ff88' : 
                   compliance.score >= 75 ? '#00d4ff' : '#ff4444'
          }}>
            {compliance.status}
          </span>
        </div>
        
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${compliance.score}%` }}
            transition={{ duration: 1 }}
            style={{ 
              height: '100%', 
              background: `linear-gradient(90deg, #8b5cf6, ${compliance.score > 75 ? '#00ff88' : '#ec4899'})` 
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>{compliance.score}% Overall Adherence</p>
      </div>

      {/* Daily Medicines List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>Today's Schedule</p>
        {activeMeds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>No medications prescribed.</div>
        ) : activeMeds.map((med, i) => (
          <div key={i} style={{ 
            padding: 14, 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ 
              width: 40, height: 40, 
              borderRadius: 10, 
              background: 'rgba(139,92,246,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Pill size={18} color="#8b5cf6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{med.name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{med.dosage} · {med.frequency}</p>
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              {logs[med.name] === 'Taken' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00ff88', fontSize: 12, fontWeight: 700, padding: '6px 12px', background: 'rgba(0,255,136,0.1)', borderRadius: 8 }}>
                  <CheckCircle size={14} /> Taken
                </div>
              ) : logs[med.name] === 'Missed' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ff4444', fontSize: 12, fontWeight: 700, padding: '6px 12px', background: 'rgba(255,68,68,0.1)', borderRadius: 8 }}>
                  <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} /> Missed
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => markLog(med.prescriptionId, med.name, 'Missed')}
                    style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}
                  >
                    Missed
                  </button>
                  <button 
                    onClick={() => markLog(med.prescriptionId, med.name, 'Taken')}
                    style={{ padding: '6px 12px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mark Taken
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdherenceTracker;
