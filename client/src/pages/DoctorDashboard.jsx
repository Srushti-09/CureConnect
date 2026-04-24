import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ECGLine from '../components/ECGLine';

import {
  Users, Calendar, ClipboardList, BarChart2, Brain,
  Plus, Search, ChevronRight, Clock, FileText,
  TrendingUp, Stethoscope, Activity, Pill, Edit3,
  Send, Zap, Star, Key, CheckCircle2, AlertCircle,
  Eye, X, Trash2, User, ChevronDown, ActivitySquare, CheckCircle, AlertTriangle
} from 'lucide-react';


// Static mock removed — appointments are fetched from the API

// ─── WidgetCard ────────────────────────────────────────────────────────────
const WidgetCard = ({ children, title, icon: Icon, color = '#8b5cf6', action, style = {} }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card"
    style={{ padding: 24, ...style }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>
      {action && (
        <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }} onClick={action.fn}>
          {action.icon && <action.icon size={13} />} {action.label}
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

// ─── Prescription Pad ────────────────────────────────────────────────────────
function PrescriptionPad({ patient, patientId, doctorName, onClose }) {
  const [meds, setMeds] = useState([{ name: '', dose: '', frequency: '', duration: '' }]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);

  const addMed = () => setMeds(m => [...m, { name: '', dose: '', frequency: '', duration: '' }]);

  const handleSend = () => {
    // Save prescription to patient's notification store
    if (patient) {
      // Find patient ID from my patients list (passed via patientId prop)
      const targetPatientId = patientId || null;
      if (targetPatientId) {
        const key = `cc_prescriptions_${targetPatientId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const newRx = {
          id: Date.now(),
          doctorName: doctorName || 'Your Doctor',
          diagnosis,
          medications: meds.filter(m => m.name),
          notes,
          sentAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        localStorage.setItem(key, JSON.stringify([...existing, newRx]));
      }
    }
    setSent(true);
    setTimeout(() => onClose(), 1500);
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 60, marginBottom: 16 }}>✅</motion.div>
      <p style={{ color: '#00ff88', fontWeight: 700, fontSize: 18 }}>Prescription sent to {patient}!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8 }}>
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Patient: {patient}</p>
      </div>
      <textarea className="input-glass" placeholder="Primary diagnosis..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} style={{ minHeight: 60, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }} />
      {meds.map((med, i) => (
        <div key={i} style={{ padding: 12, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-glass" placeholder="Medication name" value={med.name} onChange={e => { const n = [...meds]; n[i].name = e.target.value; setMeds(n); }} style={{ flex: 2 }} />
            <input className="input-glass" placeholder="Dosage" value={med.dose} onChange={e => { const n = [...meds]; n[i].dose = e.target.value; setMeds(n); }} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-glass" placeholder="Frequency (e.g. Twice daily)" value={med.frequency} onChange={e => { const n = [...meds]; n[i].frequency = e.target.value; setMeds(n); }} style={{ flex: 1 }} />
            <input className="input-glass" placeholder="Duration" value={med.duration} onChange={e => { const n = [...meds]; n[i].duration = e.target.value; setMeds(n); }} style={{ flex: 1 }} />
          </div>
        </div>
      ))}
      <button onClick={addMed} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '9px', borderStyle: 'dashed' }}>
        <Plus size={14} /> Add Medication
      </button>
      <textarea className="input-glass" placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 60, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
        <button onClick={handleSend} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Send size={16} /> Send Prescription
        </button>
      </div>
    </div>
  );
}

// ─── Document Viewer Modal ───────────────────────────────────────────────────
function PatientDocuments({ patient, onClose }) {
  const docs = patient?.docs || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800 }}>Documents — {patient.name}</h3>
          <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.4)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            Access granted via code · {docs.length} file(s)
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,244,255,0.4)', fontSize: 20 }}>✕</button>
      </div>

      {docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <FileText size={40} style={{ color: 'rgba(240,244,255,0.2)', marginBottom: 12 }} />
          <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: 14 }}>No documents uploaded by this patient yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>
                {doc.category === 'PDF' ? '📄' : doc.category === 'Image' ? '🖼️' : '📋'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{doc.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginTop: 2 }}>{doc.date} · {doc.size}</p>
              </div>
              <button
                onClick={() => {
                  if (doc.data) {
                    const win = window.open();
                    win.document.write(`<iframe src="${doc.data}" style="width:100%;height:100vh;border:none;"></iframe>`);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, color: '#8b5cf6', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}
              >
                <Eye size={13} /> View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user } = useAuth();

  // My patients (added via access code)
  const [myPatients, setMyPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Access code entry
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);

  // Modals
  const [showPrescPad, setShowPrescPad] = useState(false);
  const [prescPatient, setPrescPatient] = useState('');
  const [prescPatientId, setPrescPatientId] = useState('');
  const [viewingPatient, setViewingPatient] = useState(null);
  const [expandedPatient, setExpandedPatient] = useState(null);

  // Symptom Cascade Alerts
  const [cascadeAlerts, setCascadeAlerts] = useState([]);
  const [loadingCascades, setLoadingCascades] = useState(true);

  // Smart Triage Matrix Rules
  const [triageRules, setTriageRules] = useState([]);

  // Appointments state
  const [appointments, setAppointments] = useState([]);

  // Fetch cascade alerts on mount
  useEffect(() => {
    const fetchCascades = async () => {
      try {
        const res = await api.get('/symptoms/cascade-alerts');
        setCascadeAlerts(res.data);
      } finally {
        setLoadingCascades(false);
      }
    };
    fetchCascades();

    const fetchRules = async () => {
      try {
        const res = await api.get('/symptoms/triage/rules');
        setTriageRules(res.data);
      } catch (err) {
        console.error('Failed to fetch triage rules:', err);
      }
    };
    fetchRules();
  }, []);

  // Fetch appointments from backend
  useEffect(() => {
    if (!user) return;
    api.get('/appointments/my')
      .then(res => setAppointments(res.data))
      .catch(console.error);
  }, [user]);

  // Derive today's and upcoming appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaysAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d >= today && d <= todayEnd && a.status !== 'cancelled';
  });

  const upcomingAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d > todayEnd && a.status !== 'cancelled';
  });

  const handleCompleteAppointment = async (id) => {
    try {
      const { data } = await api.put(`/appointments/${id}/complete`);
      setAppointments(prev => prev.map(a => a._id === id ? data : a));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to complete');
    }
  };

  const handleCancelAppointment = async (id) => {
    try {
      const { data } = await api.put(`/appointments/${id}/cancel`);
      setAppointments(prev => prev.map(a => a._id === id ? data : a));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel');
    }
  };

  // Load my patients from localStorage
  useEffect(() => {
    const doctorId = user?._id || 'demo_doctor';
    const stored = localStorage.getItem(`cc_doctor_patients_${doctorId}`);
    if (stored) setMyPatients(JSON.parse(stored));
  }, [user]);

  const savePatients = (list) => {
    const doctorId = user?._id || 'demo_doctor';
    localStorage.setItem(`cc_doctor_patients_${doctorId}`, JSON.stringify(list));
    setMyPatients(list);
  };

  // Add patient via access code
  const handleAddPatient = () => {
    setCodeError('');
    setCodeSuccess('');
    const code = codeInput.trim().toUpperCase();
    if (code.length < 6) { setCodeError('Please enter a valid access code.'); return; }

    setAddingPatient(true);
    setTimeout(() => {
      // Look up code in localStorage codemap
      const codemap = JSON.parse(localStorage.getItem('cc_codemap') || '{}');
      const patientId = codemap[code];

      if (!patientId) {
        setCodeError('Invalid or expired access code. Ask the patient to share their current code.');
        setAddingPatient(false);
        return;
      }

      // Check if already added
      if (myPatients.find(p => p.patientId === patientId)) {
        setCodeError('This patient is already in your list.');
        setAddingPatient(false);
        return;
      }

      // Get patient data from localStorage
      const allUsers = JSON.parse(localStorage.getItem('cc_demo_users') || '[]');
      const patientUser = allUsers.find(u => u._id === patientId);

      // Get patient documents
      const docs = JSON.parse(localStorage.getItem(`cc_docs_${patientId}`) || '[]');

      const newPatient = {
        patientId,
        name: patientUser?.name || 'Patient',
        bloodGroup: patientUser?.bloodGroup || '—',
        gender: patientUser?.gender || '—',
        addedAt: new Date().toLocaleDateString('en-IN'),
        docs,
        accessCode: code,
      };

      const updated = [...myPatients, newPatient];
      savePatients(updated);
      setCodeInput('');
      setCodeSuccess(`✅ ${newPatient.name} added to your patients! You can now view their documents.`);
      setAddingPatient(false);
    }, 800);
  };

  const removePatient = (patientId) => {
    savePatients(myPatients.filter(p => p.patientId !== patientId));
  };

  const filtered = myPatients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'My Patients', value: String(myPatients.length), icon: Users, color: '#8b5cf6', delta: 'via access codes' },
    { label: "Today's Appointments", value: String(todaysAppointments.length), icon: Calendar, color: '#00d4ff', delta: `${todaysAppointments.filter(a => a.status === 'booked').length} remaining` },
    { label: 'Upcoming', value: String(upcomingAppointments.length), icon: Clock, color: '#00ff88', delta: 'scheduled' },
    { label: 'Avg. Rating', value: '4.9', icon: Star, color: '#f59e0b', delta: '★ from patients' },
  ];

  return (
    <div className="dashboard-layout">
      <div className="bg-grid" />
      <Sidebar role="doctor" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar role="doctor" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="dashboard-main">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Dr. <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ').slice(1).join(' ') || user?.name || 'Doctor'}
            </span>
          </h1>
          <p style={{ color: 'rgba(240,244,255,0.45)', fontSize: 14, marginTop: 4 }}>
            {user?.specialization || 'General Practice'} · {user?.hospital || 'CureConnect Network'}
          </p>

        </motion.div>

        {/* Stats */}
        <div className="dashboard-grid-4"> 
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={17} color={s.color} />
                </div>
                <span style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>{s.delta}</p>
            </motion.div>
          ))}
        </div>

          {/* ── Symptom Cascade Alerts ── */}
          <div id="alerts" style={{position:"absolute",marginTop:-80}} />
          {cascadeAlerts.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <WidgetCard title="🚨 Critical Alerts: Escalating Symptom Cascades" icon={AlertTriangle} color="#ff4444">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                  {cascadeAlerts.map(alert => (
                    <motion.div
                      key={alert.patientId}
                      whileHover={{ scale: 1.01 }}
                      style={{
                        background: 'rgba(255,68,68,0.05)',
                        border: '1px solid rgba(255,68,68,0.3)',
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ color: '#ff4444', margin: 0, fontSize: 16 }}>{alert.patientName}</h4>
                        <span style={{ fontSize: 12, padding: '4px 8px', background: 'rgba(255,68,68,0.1)', borderRadius: 12, color: '#ff4444', fontWeight: 'bold' }}>
                          Score: {alert.cascadeScore}
                        </span>
                      </div>

                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>New Emerging Symptoms:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {alert.newSymptomsDetected.map(s => (
                            <span key={s} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>{s}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)' }}>Entries: <strong>{alert.totalEntries}</strong></p>
                        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.7)' }}>Max Sev: <strong style={{ color: '#ff4444' }}>{alert.maxSeverity}/5</strong></p>
                      </div>

                      <button className="btn-primary" style={{ padding: '8px', fontSize: 13, background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.3)' }} onClick={() => {
                        setPrescPatient(alert.patientName);
                        setPrescPatientId(alert.patientId);
                        setShowPrescPad(true);
                      }}>
                        Review & Prescribe
                      </button>
                    </motion.div>
                  ))}
                </div>
              </WidgetCard>
            </div>
          )}

          {/* ── Row 1: Add Patient + My Patients ── */}
          <div id="patients" style={{ position: "absolute", marginTop: -80 }} />
          <div className="dashboard-grid-2">

            {/* Add Patient via Code */}
            <WidgetCard title="Add Patient via Code" icon={Key} color="#00d4ff">
              <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.5)', lineHeight: 1.6, marginBottom: 18 }}>
                Ask your patient to share their 8-digit access code from their dashboard. Enter it below to get access to their health documents.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  className="input-glass"
                  placeholder="Enter patient access code..."
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); setCodeSuccess(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAddPatient()}
                  maxLength={10}
                  style={{ letterSpacing: '4px', fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
                />
                <button
                  onClick={handleAddPatient}
                  disabled={addingPatient}
                  style={{ padding: '12px', background: 'linear-gradient(135deg,#00d4ff,#00ff88)', border: 'none', borderRadius: 12, color: '#000', fontWeight: 800, fontSize: 15, cursor: addingPatient ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: addingPatient ? 0.7 : 1 }}
                >
                  {addingPatient ? (
                    <><div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} /> Verifying...</>
                  ) : (
                    <><Plus size={16} /> Add Patient</>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {codeError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 10, color: '#ff6b6b', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
                    <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} /> {codeError}
                  </motion.div>
                )}
                {codeSuccess && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10, color: '#00ff88', fontSize: 13, marginTop: 10 }}>
                    <CheckCircle2 size={15} /> {codeSuccess}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: 'rgba(0,212,255,0.7)' }}>
                  ℹ️ Access is controlled by the patient. They can revoke it anytime by regenerating their code.
                </p>
              </div>
            </WidgetCard>

            {/* My Patients list */}
            <WidgetCard title="My Patients" icon={Users} color="#8b5cf6">
              {myPatients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Users size={40} style={{ color: 'rgba(240,244,255,0.15)', marginBottom: 14 }} />
                  <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: 14, marginBottom: 8 }}>No patients added yet</p>
                  <p style={{ color: 'rgba(240,244,255,0.25)', fontSize: 13 }}>Ask a patient to share their access code, then enter it on the left</p>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative', marginBottom: 14 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.35)' }} />
                    <input className="input-glass" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 38, height: 40, fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                    {filtered.map((p, i) => (
                      <motion.div key={p.patientId} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ background: expandedPatient === p.patientId ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${expandedPatient === p.patientId ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, overflow: 'hidden' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                          onClick={() => setExpandedPatient(expandedPatient === p.patientId ? null : p.patientId)}
                        >
                          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, fontWeight: 700, color: '#fff' }}>
                            {p.name[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</p>
                            <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                              Added {p.addedAt} · {p.docs?.length || 0} doc(s)
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="badge badge-green">{p.docs?.length || 0} docs</span>
                            <ChevronDown size={15} style={{ color: 'rgba(240,244,255,0.3)', transform: expandedPatient === p.patientId ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedPatient === p.patientId && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                              <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => setViewingPatient(p)}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10, color: '#00d4ff', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>
                                  <Eye size={13} /> View Documents
                                </button>
                                <button
                                  onClick={() => { setPrescPatient(p.name); setPrescPatientId(p.patientId); setShowPrescPad(true); }}
                                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
                                  <Edit3 size={13} /> Prescribe
                                </button>
                                <button
                                  onClick={() => removePatient(p.patientId)}
                                  style={{ padding: '9px 12px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: 10, color: '#ff6b6b', cursor: 'pointer' }}
                                  title="Remove patient">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </WidgetCard>
          </div>

          {/* ── Row 2: Schedule + Analytics ── */}
          <div id="analytics" style={{ position: "absolute", marginTop: -80 }} />
          <div id="prescriptions" style={{ position: "absolute", marginTop: -80 }} />
          <div id="records" style={{ position: "absolute", marginTop: -80 }} />
          <div id="appointments" style={{ position: "absolute", marginTop: -80 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

            {/* Today's Appointments */}
            <WidgetCard title="Today's Appointments" icon={Calendar} color="#00d4ff">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
                {todaysAppointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <Calendar size={28} style={{ color: 'rgba(240,244,255,0.2)', marginBottom: 10 }} />
                    <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.35)' }}>No appointments today</p>
                  </div>
                ) : todaysAppointments.map(appt => {
                  const statusColor = appt.status === 'booked' ? '#00ff88' : appt.status === 'completed' ? '#00d4ff' : '#ff4444';
                  const statusBg = appt.status === 'booked' ? 'rgba(0,255,136,0.12)' : appt.status === 'completed' ? 'rgba(0,212,255,0.12)' : 'rgba(255,68,68,0.12)';
                  return (
                    <div key={appt._id} style={{ padding: '12px 14px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700 }}>{appt.patientId?.name || 'Patient'}</p>
                          <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)', marginTop: 2 }}>{appt.patientId?.email || ''}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <span style={{ fontSize: 12, color: '#00d4ff', fontWeight: 600 }}>{appt.timeSlot}</span>
                          </div>
                          {appt.reason && <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', marginTop: 4 }}>Reason: {appt.reason}</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 11, padding: '2px 10px', background: statusBg, color: statusColor, borderRadius: 20, fontWeight: 700 }}>{appt.status}</span>
                          {appt.status === 'booked' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleCompleteAppointment(appt._id)} style={{ fontSize: 11, color: '#00d4ff', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CheckCircle size={11} /> Complete
                              </button>
                              <button onClick={() => handleCancelAppointment(appt._id)} style={{ fontSize: 11, color: 'rgba(255,68,68,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </WidgetCard>

            {/* Upcoming Appointments */}
            <WidgetCard title="Upcoming Appointments" icon={Clock} color="#8b5cf6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto' }}>
                {upcomingAppointments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                    <Clock size={28} style={{ color: 'rgba(240,244,255,0.2)', marginBottom: 10 }} />
                    <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.35)' }}>No upcoming appointments</p>
                  </div>
                ) : upcomingAppointments.map(appt => {
                  const statusColor = appt.status === 'booked' ? '#00ff88' : appt.status === 'completed' ? '#00d4ff' : '#ff4444';
                  const statusBg = appt.status === 'booked' ? 'rgba(0,255,136,0.12)' : appt.status === 'completed' ? 'rgba(0,212,255,0.12)' : 'rgba(255,68,68,0.12)';
                  return (
                    <div key={appt._id} style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700 }}>{appt.patientId?.name || 'Patient'}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Calendar size={10} />
                              {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>{appt.timeSlot}</span>
                          </div>
                          {appt.reason && <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', marginTop: 4 }}>Reason: {appt.reason}</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 11, padding: '2px 10px', background: statusBg, color: statusColor, borderRadius: 20, fontWeight: 700 }}>{appt.status}</span>
                          {appt.status === 'booked' && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleCompleteAppointment(appt._id)} style={{ fontSize: 11, color: '#00d4ff', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CheckCircle size={11} /> Complete
                              </button>
                              <button onClick={() => handleCancelAppointment(appt._id)} style={{ fontSize: 11, color: 'rgba(255,68,68,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </WidgetCard>

          </div>

          {/* ── Row 3: AI Suggestions ── */}
          <div id="triage" style={{ position: "absolute", marginTop: -80 }} />
          {triageRules && Array.isArray(triageRules) && triageRules.length > 0 && (
            <WidgetCard title="Smart Triage Algorithm Matrix" icon={ActivitySquare} color="#ec4899" style={{ marginTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {triageRules.map(rule => (
                  <div key={rule._id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${rule.priority === 'Red' ? 'rgba(255,68,68,0.3)' : rule.priority === 'Yellow' ? 'rgba(245,158,11,0.3)' : 'rgba(0,255,136,0.3)'}`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'capitalize' }}>"{rule.symptomKeyword}"</span>
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800, background: rule.priority === 'Red' ? 'rgba(255,68,68,0.2)' : rule.priority === 'Yellow' ? 'rgba(245,158,11,0.2)' : 'rgba(0,255,136,0.2)', color: rule.priority === 'Red' ? '#ff4444' : rule.priority === 'Yellow' ? '#f59e0b' : '#00ff88' }}>
                        {rule.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div><strong>Route to:</strong> {rule.specialistType}</div>
                      <div><strong>Urgency:</strong> {rule.urgencyEstimate} (+{rule.score} pts)</div>
                    </div>
                  </div>
                ))}
              </div>
            </WidgetCard>
          )}          {/* ── Prescription Modal ── */}
          {showPrescPad && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 500 }} onClick={e => { if (e.target === e.currentTarget) setShowPrescPad(false); }}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', padding: 28, border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 16px 40px rgba(139,92,246,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>Digital Prescription Pad</h3>
                  <button onClick={() => setShowPrescPad(false)} style={{ background: 'none', border: 'none', color: 'rgba(240,244,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                </div>
                <PrescriptionPad
                  patient={prescPatient}
                  patientId={prescPatientId}
                  doctorName={user?.name}
                  onClose={() => setShowPrescPad(false)}
                />
              </motion.div>
            </motion.div>
          )}

          {/* ── Patient Documents Modal ── */}
          {viewingPatient && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 500 }} onClick={e => { if (e.target === e.currentTarget) setViewingPatient(null); }}>
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', padding: 28, border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 16px 40px rgba(0,212,255,0.08)' }}>
                <PatientDocuments patient={viewingPatient} onClose={() => setViewingPatient(null)} />
              </motion.div>
            </motion.div>
          )}

      </main>
    </div>
  );
}
// Inventory feature removed

