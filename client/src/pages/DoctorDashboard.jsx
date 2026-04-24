import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ECGLine from '../components/ECGLine';
import ClinicStockTracker from '../components/ClinicStockTracker';
import MedicineAutocomplete from '../components/MedicineAutocomplete';
import InteractionChecker from '../components/InteractionChecker';
import {
  Users, Calendar, ClipboardList, BarChart2, Brain,
  Plus, Search, ChevronRight, Clock, FileText,
  TrendingUp, Stethoscope, Activity, Pill, Edit3,
  Send, Zap, Star, Key, CheckCircle2, AlertCircle,
  Eye, X, Trash2, User, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// ─── AI Diagnosis Suggestions (mock) ────────────────────────────────────────
const aiSuggestions = [
  { urgency: 'high', icon: '⚠️', patient: 'Rajan Mehta', suggestion: 'BP consistently elevated. Consider adjusting Lisinopril dosage to 15mg.' },
  { urgency: 'low', icon: '✅', patient: 'Aisha Sharma', suggestion: 'HbA1c trending down. Continue current Metformin regimen. Next lab in 3 months.' },
  { urgency: 'medium', icon: '🔍', patient: 'Dev Patel', suggestion: 'TSH slightly low. Recommend free T3/T4 panel before next prescription renewal.' },
];

const analyticsData = [
  { month: 'Oct', patients: 38, appointments: 62 },
  { month: 'Nov', patients: 45, appointments: 71 },
  { month: 'Dec', patients: 41, appointments: 65 },
  { month: 'Jan', patients: 52, appointments: 84 },
  { month: 'Feb', patients: 49, appointments: 78 },
  { month: 'Mar', patients: 61, appointments: 95 },
  { month: 'Apr', patients: 58, appointments: 91 },
];

const appointmentsToday = [
  { time: '9:00 AM', patient: 'Aisha Sharma', type: 'Follow-up', duration: 30, status: 'completed' },
  { time: '10:30 AM', patient: 'Rajan Mehta', type: 'Consultation', duration: 45, status: 'completed' },
  { time: '2:00 PM', patient: 'Priya Nair', type: 'Review', duration: 20, status: 'upcoming' },
  { time: '3:30 PM', patient: 'New Patient', type: 'Initial Visit', duration: 60, status: 'upcoming' },
];

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
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState([]);
  const [interactionCheck, setInteractionCheck] = useState(null);
  const [showSevereConfirmation, setShowSevereConfirmation] = useState(false);
  const [confirmedSevere, setConfirmedSevere] = useState(false);

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicines(prev => [...prev, {
      name: medicine.name,
      dosage: '',
      frequency: '',
      duration: '',
      genericName: medicine.genericName,
      drugClass: medicine.class
    }]);
  };

  const handleMedicineRemove = (medicine) => {
    setSelectedMedicines(prev => prev.filter(med => med.name !== medicine.name));
  };

  const updateMedicine = (index, field, value) => {
    setSelectedMedicines(prev => prev.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const handleAcknowledgeWarning = (warningId) => {
    setAcknowledgedWarnings(prev => [...prev, warningId]);
  };

  const handleSend = async () => {
    if (!patientId || selectedMedicines.length === 0 || !diagnosis) {
      alert('Please fill in all required fields');
      return;
    }

    // Check for interactions if not already checked or medicines changed
    if (selectedMedicines.length >= 2 && !interactionCheck) {
      await checkInteractions();
      return;
    }

    // If severe interactions exist and not confirmed, show confirmation
    if (interactionCheck?.hasSevereInteractions && !confirmedSevere) {
      setShowSevereConfirmation(true);
      return;
    }

    // Proceed with saving prescription
    await savePrescription();
  };

  const checkInteractions = async () => {
    setLoading(true);
    try {
      const response = await api.post('/prescriptions/check-interactions', {
        medications: selectedMedicines.map(med => med.name)
      });
      setInteractionCheck(response.data);
    } catch (error) {
      console.error('Error checking interactions:', error);
      alert('Failed to check drug interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePrescription = async () => {
    setLoading(true);
    try {
      const prescriptionData = {
        patient: patientId,
        medications: selectedMedicines.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          genericName: med.genericName,
          drugClass: med.drugClass,
          instructions: med.instructions || ''
        })),
        diagnosis,
        notes,
        confirmedSevereInteractions: confirmedSevere
      };

      await api.post('/prescriptions', prescriptionData);

      setSent(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSevere = () => {
    setConfirmedSevere(true);
    setShowSevereConfirmation(false);
    savePrescription();
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 60, marginBottom: 16 }}>✅</motion.div>
      <p style={{ color: '#00ff88', fontWeight: 700, fontSize: 18 }}>Prescription created successfully!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
      <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8 }}>
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>Patient: {patient}</p>
      </div>

      <div>
        <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Primary Diagnosis *</label>
        <textarea
          className="input-glass"
          placeholder="Enter primary diagnosis..."
          value={diagnosis}
          onChange={e => setDiagnosis(e.target.value)}
          style={{ minHeight: 60, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
        />
      </div>

      <div>
        <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Medications *</label>
        <MedicineAutocomplete
          onSelect={handleMedicineSelect}
          onRemove={handleMedicineRemove}
          selectedMedicines={selectedMedicines}
          placeholder="Search and add medications..."
        />

        {selectedMedicines.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedMedicines.map((med, index) => (
              <div key={index} style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#8b5cf6' }}>{med.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    className="input-glass"
                    placeholder="Dosage (e.g. 10mg)"
                    value={med.dosage}
                    onChange={e => updateMedicine(index, 'dosage', e.target.value)}
                  />
                  <input
                    className="input-glass"
                    placeholder="Frequency (e.g. Twice daily)"
                    value={med.frequency}
                    onChange={e => updateMedicine(index, 'frequency', e.target.value)}
                  />
                  <input
                    className="input-glass"
                    placeholder="Duration (e.g. 30 days)"
                    value={med.duration}
                    onChange={e => updateMedicine(index, 'duration', e.target.value)}
                  />
                  <input
                    className="input-glass"
                    placeholder="Instructions (optional)"
                    value={med.instructions || ''}
                    onChange={e => updateMedicine(index, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMedicines.length >= 2 && (
        <InteractionChecker
          medications={selectedMedicines}
          onAcknowledge={handleAcknowledgeWarning}
          acknowledgedWarnings={acknowledgedWarnings}
        />
      )}

      <div>
        <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Additional Notes</label>
        <textarea
          className="input-glass"
          placeholder="Additional notes or instructions..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ minHeight: 60, resize: 'vertical', fontFamily: 'Outfit, sans-serif' }}
        />
      </div>

      {/* Severe Interaction Confirmation Modal */}
      {showSevereConfirmation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Severe Drug Interactions Detected</h3>
            </div>
            <p className="text-gray-700 mb-4">
              This prescription contains severe drug interactions that may cause serious harm to the patient.
              Are you sure you want to proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSevereConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSevere}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={loading || !diagnosis || selectedMedicines.length === 0}
          style={{
            flex: 2,
            padding: '12px',
            background: loading ? '#666' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Outfit, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Creating...
            </>
          ) : (
            <>
              <Send size={16} /> Create Prescription
            </>
          )}
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
  const [selectedInteractionMeds, setSelectedInteractionMeds] = useState([]);

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
    { label: "Today's Appointments", value: '4', icon: Calendar, color: '#00d4ff', delta: '2 remaining' },
    { label: 'Prescriptions Sent', value: '12', icon: Pill, color: '#00ff88', delta: 'this month' },
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
          <div style={{ marginTop: 14 }}><ECGLine color="#8b5cf6" height={38} /></div>
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

        {/* ── Row 1: Add Patient + My Patients ── */}
        <div id="patients" style={{position:"absolute",marginTop:-80}} />
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
        <div id="analytics" style={{position:"absolute",marginTop:-80}} />
        {/* Placeholder for Records/Prescriptions which are part of the Patients list or other cards */}
        <div id="prescriptions" style={{position:"absolute",marginTop:-80}} />
        <div id="records" style={{position:"absolute",marginTop:-80}} />
        <div id="appointments" style={{position:"absolute",marginTop:-80}} />
        <div className="dashboard-grid-2">
          <WidgetCard title="Today's Schedule" icon={Calendar} color="#00d4ff">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {appointmentsToday.map((appt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: appt.status === 'upcoming' ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${appt.status === 'upcoming' ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: appt.status === 'completed' ? '#00ff88' : '#00d4ff', boxShadow: appt.status === 'upcoming' ? '0 0 8px rgba(0,212,255,0.6)' : 'none' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{appt.patient}</p>
                    <p style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)' }}>{appt.type} · {appt.duration}min</p>
                  </div>
                  <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: appt.status === 'upcoming' ? '#00d4ff' : 'rgba(240,244,255,0.4)' }}>{appt.time}</p>
                </div>
              ))}
            </div>
          </WidgetCard>

          <WidgetCard title="Patient Analytics" icon={BarChart2} color="#00d4ff">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(240,244,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-dropdown)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 13 }} />
                <Bar dataKey="patients" name="New Patients" fill="#8b5cf6" radius={[4,4,0,0]} />
                <Bar dataKey="appointments" name="Appointments" fill="#00d4ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </WidgetCard>
        </div>

        {/* ── Row 3: AI Diagnosis & Drug Interactions ── */}
        <div id="ai" style={{position:"absolute",marginTop:-80}} />
        <div className="dashboard-grid-2">
          <WidgetCard title="AI Diagnosis Alerts" icon={Brain} color="#8b5cf6">
            <div className="ai-suggestions-grid">
              {aiSuggestions.map((s, i) => (
                <motion.div key={i} whileHover={{ y: -2 }} style={{ padding: '16px', background: s.urgency === 'high' ? 'rgba(255,68,68,0.08)' : s.urgency === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(0,255,136,0.06)', border: `1px solid ${s.urgency === 'high' ? 'rgba(255,68,68,0.2)' : s.urgency === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(0,255,136,0.15)'}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{s.patient}</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.6)', lineHeight: 1.6 }}>{s.suggestion}</p>
                </motion.div>
              ))}
            </div>
          </WidgetCard>

          <WidgetCard title="Quick Interaction Checker" icon={AlertCircle} color="#ff4444">
            <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
              Quickly check for dangerous drug-to-drug interactions before prescribing.
            </p>
            <div style={{ marginBottom: 16 }}>
              <MedicineAutocomplete
                onSelect={(med) => setSelectedInteractionMeds(prev => [...prev, med])}
                onRemove={(med) => setSelectedInteractionMeds(prev => prev.filter(m => m.name !== med.name))}
                selectedMedicines={selectedInteractionMeds}
                placeholder="Type medicine names to check..."
              />
            </div>
            {selectedInteractionMeds.length >= 2 && (
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: 2, borderRadius: 12 }}>
                <InteractionChecker medications={selectedInteractionMeds} />
              </div>
            )}
            {selectedInteractionMeds.length < 2 && (
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.3)' }}>Add at least 2 medications to check for interactions</p>
              </div>
            )}
            {selectedInteractionMeds.length > 0 && (
               <button 
                 onClick={() => setSelectedInteractionMeds([])}
                 style={{ marginTop: 12, width: '100%', padding: '8px', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, color: '#ff6b6b', fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
               >
                 Clear Check
               </button>
            )}
          </WidgetCard>
        </div>

        {/* ── Row 4: Clinic Inventory Tracker ── */}
        <div id="inventory" style={{position:"absolute",marginTop:-80}} />
        <div style={{ marginTop: 24 }}>
          <WidgetCard title="Clinic Medicine Inventory & Stock Tracker" icon={Pill} color="#ec4899">
            <ClinicStockTracker doctorId={user?._id || 'demo_doctor'} />
          </WidgetCard>
        </div>

        {/* ── Prescription Modal ── */}
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
