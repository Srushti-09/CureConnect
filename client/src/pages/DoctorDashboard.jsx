import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ECGLine from '../components/ECGLine';
import ClinicStockTracker from '../components/ClinicStockTracker';
import MedicineAutocomplete from '../components/MedicineAutocomplete';
import InteractionChecker from '../components/InteractionChecker';
import InteractionAlert from '../components/InteractionAlert';
import {
  Users, Calendar, ClipboardList, BarChart2, Brain,
  Plus, Search, ChevronRight, Clock, FileText,
  TrendingUp, Stethoscope, Activity, Pill, Edit3,
  Send, Zap, Star, Key, CheckCircle2, AlertCircle,
  Eye, X, Trash2, User, ChevronDown, ActivitySquare, CheckCircle, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const aiSuggestions = [
  { urgency: 'high', icon: '⚠️', patient: 'Rajan Mehta', suggestion: 'BP consistently elevated. Consider adjusting Lisinopril dosage to 15mg.' },
  { urgency: 'low', icon: '✅', patient: 'Aisha Sharma', suggestion: 'HbA1c trending down. Continue current Metformin regimen. Next lab in 3 months.' },
];

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

    if (selectedMedicines.length >= 2 && !interactionCheck) {
      await checkInteractions();
      return;
    }

    if (interactionCheck?.hasSevereInteractions && !confirmedSevere) {
      setShowSevereConfirmation(true);
      return;
    }

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
    } finally {
      setLoading(false);
    }
  };

  const savePrescription = async () => {
    setLoading(true);
    try {
      await api.post('/prescriptions', {
        patient: patientId,
        medications: selectedMedicines,
        diagnosis,
        notes,
        confirmedSevereInteractions: confirmedSevere
      });
      setSent(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 60, marginBottom: 16 }}>✅</motion.div>
      <p style={{ color: '#00ff88', fontWeight: 700, fontSize: 18 }}>Prescription created successfully!</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
      <textarea className="input-glass" placeholder="Primary diagnosis..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
      <MedicineAutocomplete onSelect={handleMedicineSelect} onRemove={handleMedicineRemove} selectedMedicines={selectedMedicines} />
      {selectedMedicines.map((med, index) => (
        <div key={index} className="med-input-row" style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
          <p style={{ fontWeight: 600 }}>{med.name}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <input className="input-glass" placeholder="Dosage" value={med.dosage} onChange={e => updateMedicine(index, 'dosage', e.target.value)} />
            <input className="input-glass" placeholder="Freq" value={med.frequency} onChange={e => updateMedicine(index, 'frequency', e.target.value)} />
          </div>
        </div>
      ))}
      {selectedMedicines.length >= 2 && <InteractionChecker medications={selectedMedicines} />}
      <textarea className="input-glass" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <button onClick={handleSend} className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Send Prescription'}</button>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [myPatients, setMyPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [showPrescPad, setShowPrescPad] = useState(false);
  const [prescPatient, setPrescPatient] = useState('');
  const [prescPatientId, setPrescPatientId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [cascadeAlerts, setCascadeAlerts] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get('/appointments/my').then(res => setAppointments(res.data)).catch(console.error);
    api.get('/symptoms/cascade-alerts').then(res => setCascadeAlerts(res.data)).catch(console.error);
    const doctorId = user?._id || 'demo_doctor';
    const stored = localStorage.getItem(`cc_doctor_patients_${doctorId}`);
    if (stored) setMyPatients(JSON.parse(stored));
  }, [user]);

  const handleAddPatient = () => {
    setAddingPatient(true);
    // Logic for adding patient via access code
    setTimeout(() => setAddingPatient(false), 1000);
  };

  const todaysAppointments = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString());

  const stats = [
    { label: 'My Patients', value: String(myPatients.length), icon: Users, color: '#8b5cf6', delta: 'via codes' },
    { label: "Today's Appts", value: String(todaysAppointments.length), icon: Calendar, color: '#00d4ff', delta: 'scheduled' },
    { label: 'Alerts', value: String(cascadeAlerts.length), icon: AlertTriangle, color: '#ff4444', delta: 'requiring attention' },
    { label: 'Rating', value: '4.9', icon: Star, color: '#f59e0b', delta: 'patient feedback' },
  ];

  return (
    <div className="dashboard-layout">
      <div className="bg-grid" />
      <Sidebar role="doctor" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar role="doctor" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="dashboard-main">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Dr. <span className="text-gradient">{user?.name?.split(' ')[1] || 'Doctor'}</span></h1>
          <p style={{ color: 'rgba(240,244,255,0.45)' }}>{user?.specialization} · {user?.hospital}</p>
          <div style={{ marginTop: 14 }}><ECGLine color="#8b5cf6" height={38} /></div>
        </motion.div>

        <div className="dashboard-grid-4">
          {stats.map((s, i) => (
            <div key={s.label} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <s.icon size={18} color={s.color} />
                <span style={{ fontSize: 24, fontWeight: 900 }}>{s.value}</span>
              </div>
              <p style={{ fontSize: 13, marginTop: 8 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="dashboard-grid-2" style={{ marginTop: 24 }}>
          <WidgetCard title="Add Patient" icon={Key} color="#00d4ff">
            <input className="input-glass" placeholder="Access code" value={codeInput} onChange={e => setCodeInput(e.target.value)} />
            <button className="btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleAddPatient}>Add Patient</button>
          </WidgetCard>
          <WidgetCard title="Today's Appointments" icon={Calendar} color="#8b5cf6">
            <div className="appt-list-doctor">
              {todaysAppointments.map(a => (
                <div key={a._id} className="appt-item-doctor">
                  <p>{a.patientId?.name}</p>
                  <span>{a.timeSlot}</span>
                </div>
              ))}
            </div>
          </WidgetCard>
        </div>

        <div style={{ marginTop: 24 }}>
          <ClinicStockTracker />
        </div>

        <AnimatePresence>
          {showPrescPad && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="modal-content glass-card">
                <h3>Prescription for {prescPatient}</h3>
                <PrescriptionPad patient={prescPatient} patientId={prescPatientId} onClose={() => setShowPrescPad(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
