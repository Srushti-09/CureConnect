import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Pill, Activity, TrendingUp, Clock, Target } from 'lucide-react';
import { api } from '../context/AuthContext';

const AdherenceTracker = ({ patientId }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [compliance, setCompliance] = useState({ score: 100, status: 'Excellent', total: 0, taken: 0 });
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [prescRes, compRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get(`/adherence/compliance${patientId ? `/${patientId}` : ''}`)
      ]);
      
      setPrescriptions(prescRes.data.filter(p => p.status === 'active'));
      setCompliance(compRes.data);
      
      const logsRes = await api.get(`/adherence/logs${patientId ? `?patientId=${patientId}` : ''}`);
      const todayStr = new Date().toDateString();
      const todayLogs = {};
      logsRes.data.forEach(log => {
        if (new Date(log.createdAt).toDateString() === todayStr) {
          todayLogs[log.medication.name] = log.status.toLowerCase();
        }
      });
      setLogs(todayLogs);
    } catch (err) {
      console.error('Failed to fetch adherence data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const markLog = async (prescriptionId, medicationName, status) => {
    try {
      await api.post('/adherence/mark', {
        prescriptionId,
        medicationName,
        status: status.toLowerCase(),
        takenAt: new Date()
      });
      fetchData(); // Refresh everything
    } catch (err) {
      console.error('Marking failed', err);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <Activity className="animate-spin" size={24} color="var(--cyan)" />
    </div>
  );

  const activeMeds = prescriptions.flatMap(p => p.medications.map(m => ({ ...m, prescriptionId: p._id })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={20} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Health Compliance</span>
          </div>
          <span className="notif-badge" style={{ background: compliance.score >= 80 ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)', color: compliance.score >= 80 ? 'var(--green)' : 'var(--red)', border: 'none', padding: '4px 12px' }}>
            {compliance.status}
          </span>
        </div>
        
        <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${compliance.score}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #00d4ff)' }} />
        </div>
        <p style={{ fontSize: 12, opacity: 0.5, textAlign: 'right' }}>{compliance.score}% score • {compliance.taken}/{compliance.total} doses logged</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, opacity: 0.6, marginLeft: 4 }}>TODAY'S MEDICATIONS</h4>
        {activeMeds.length === 0 ? (
          <div className="glass-card" style={{ padding: 30, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>No active prescriptions.</div>
        ) : activeMeds.map((med, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pill size={20} color="#8b5cf6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{med.name}</p>
              <p style={{ fontSize: 12, opacity: 0.5 }}>{med.dosage} • {med.frequency}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {logs[med.name] === 'taken' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontWeight: 700, fontSize: 13, background: 'rgba(0,255,136,0.1)', padding: '6px 14px', borderRadius: 10 }}>
                  <CheckCircle size={16} /> Taken
                </div>
              ) : logs[med.name] === 'missed' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontWeight: 700, fontSize: 13, background: 'rgba(255,68,68,0.1)', padding: '6px 14px', borderRadius: 10 }}>
                  <Clock size={16} /> Missed
                </div>
              ) : (
                <>
                  <button onClick={() => markLog(med.prescriptionId, med.name, 'missed')} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Missed</button>
                  <button onClick={() => markLog(med.prescriptionId, med.name, 'taken')} className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>Mark Taken</button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdherenceTracker;
