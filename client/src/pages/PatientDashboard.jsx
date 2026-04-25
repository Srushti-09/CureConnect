import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ECGLine from '../components/ECGLine';
import DailyVitalsModal from '../components/DailyVitalsModal';
import AdherenceTracker from '../components/AdherenceTracker';
import SymptomLogger from '../components/SymptomLogger';
import SmartTriage from '../components/SmartTriage';
import {
  Activity, FileText, Calendar, Pill,
  TrendingUp, Heart, Plus, Upload, Search,
  Clock, CheckCircle, Brain,
  Thermometer, Droplets, Key, Copy, RefreshCw,
  Stethoscope, AlertTriangle, X, Eye,
  ChevronDown, CheckCircle2, Trash2, Video, MapPin, Phone, ArrowUpDown, User
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Specialty suggestion based on conditions
const SPECIALTY_MAP = {
  'diabetes': { spec: 'Endocrinologist', emoji: '🩺', color: '#00d4ff', desc: 'For blood sugar management and hormonal disorders' },
  'hypertension': { spec: 'Cardiologist', emoji: '❤️', color: '#ff4444', desc: 'For blood pressure and heart health management' },
  'blood pressure': { spec: 'Cardiologist', emoji: '❤️', color: '#ff4444', desc: 'For cardiovascular and blood pressure concerns' },
  'asthma': { spec: 'Pulmonologist', emoji: '🫁', color: '#00ff88', desc: 'For respiratory and lung care' },
  'thyroid': { spec: 'Endocrinologist', emoji: '🩺', color: '#00d4ff', desc: 'For thyroid and hormonal health' },
  'skin': { spec: 'Dermatologist', emoji: '✨', color: '#ec4899', desc: 'For skin conditions and treatments' },
  'eye': { spec: 'Ophthalmologist', emoji: '👁️', color: '#8b5cf6', desc: 'For vision and eye health' },
  'joint': { spec: 'Rheumatologist', emoji: '🦴', color: '#f59e0b', desc: 'For joint pain and autoimmune conditions' },
  'arthritis': { spec: 'Rheumatologist', emoji: '🦴', color: '#f59e0b', desc: 'For arthritis and inflammatory disorders' },
  'kidney': { spec: 'Nephrologist', emoji: '🫘', color: '#00ff88', desc: 'For kidney function and care' },
  'ckd': { spec: 'Nephrologist', emoji: '🫘', color: '#00ff88', desc: 'For chronic kidney disease care' },
  'mental': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For mental health and emotional wellbeing' },
  'anxiety': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For anxiety, stress and mental health' },
  'depression': { spec: 'Psychiatrist', emoji: '🧠', color: '#8b5cf6', desc: 'For mood disorders and mental health' },
  'bone': { spec: 'Orthopedist', emoji: '🦴', color: '#f59e0b', desc: 'For bone, muscle and skeletal care' },
  'digestive': { spec: 'Gastroenterologist', emoji: '🫃', color: '#00ff88', desc: 'For digestive tract and gut health' },
  'stomach': { spec: 'Gastroenterologist', emoji: '🫃', color: '#00ff88', desc: 'For stomach and digestive concerns' },
  'uti': { spec: 'Urologist', emoji: '💧', color: '#f59e0b', desc: 'For urinary tract and bladder infections' },
  'urine': { spec: 'Urologist', emoji: '💧', color: '#f59e0b', desc: 'For urinary and bladder issues' },
  'fever': { spec: 'General Physician', emoji: '👨‍⚕️', color: '#ec4899', desc: 'For initial consultation of fever and symptoms' },
  'blood': { spec: 'Hematologist', emoji: '🩸', color: '#ff4444', desc: 'For blood disorders and lab results' },
  'infection': { spec: 'Infectious Disease Specialist', emoji: '🦠', color: '#00ff88', desc: 'For infectious diseases and pathogens' }
};

function getSuggestedSpecialties(records, userConditions) {
  const suggestions = new Map();
  const text = [
    ...records.map(r => `${r.title} ${r.description || ''} ${r.type || ''}`),
    userConditions || '',
  ].join(' ').toLowerCase();

  for (const [keyword, info] of Object.entries(SPECIALTY_MAP)) {
    if (text.includes(keyword)) {
      suggestions.set(info.spec, info);
    }
  }
  return [...suggestions.values()];
}

const AI_QA = [
  {
    category: 'Vitals',
    questions: [
      { q: 'Is my blood pressure reading normal?', a: 'Your current reading of 118/76 mmHg is within the normal range (below 120/80). Keep monitoring daily and maintain low sodium intake. If it rises above 130/80 consistently, consult a Cardiologist.' },
      { q: 'What does my heart rate tell me?', a: 'Your heart rate of 72 bpm is healthy (normal: 60–100 bpm). Regular aerobic exercise can lower resting heart rate. If you experience palpitations or rates above 100, seek medical attention.' },
      { q: 'What does my blood oxygen level mean?', a: 'Your SpO₂ of 98% is excellent (normal: 95–100%). Levels below 92% require immediate medical attention. Factors like altitude, smoking, and lung disease can affect it.' },
    ],
  },
  {
    category: 'Medications',
    questions: [
      { q: 'What happens if I miss a medication dose?', a: 'Take it as soon as you remember — unless it\'s almost time for the next dose. Never double up. Missing doses can reduce effectiveness. Set a daily alarm to maintain consistency.' },
      { q: 'Can I take my medications together?', a: 'Based on your current prescriptions, consult your doctor before combining medications. Some drugs interact: for example, blood thinners should not be taken with NSAIDs without guidance.' },
    ],
  },
  {
    category: 'When to Visit Doctor',
    questions: [
      { q: 'What symptoms should trigger an emergency visit?', a: 'Seek emergency care for: chest pain, sudden severe headache, difficulty breathing, one-sided weakness/numbness, vision loss, or blood sugar below 70 or above 300 mg/dL. Call 108 (India) or 911 immediately.' },
    ],
  },
];

const vitalsData = [
  { day: 'Mon', bp: 118, hr: 72, o2: 98 },
  { day: 'Tue', bp: 122, hr: 75, o2: 97 },
  { day: 'Wed', bp: 115, hr: 68, o2: 99 },
  { day: 'Thu', bp: 128, hr: 80, o2: 98 },
  { day: 'Fri', bp: 120, hr: 73, o2: 97 },
  { day: 'Sat', bp: 116, hr: 71, o2: 98 },
  { day: 'Sun', bp: 119, hr: 70, o2: 99 },
];

const baseMedications = [
  { name: 'Metformin', dose: '500mg', freq: 'Twice daily', time: '8 AM / 8 PM', status: 'taken', color: '#00d4ff', condition: 'diabetes' },
  { name: 'Lisinopril', dose: '10mg', freq: 'Once daily', time: '9:00 AM', status: 'pending', color: '#8b5cf6', condition: 'hypertension' },
];

const WidgetCard = ({ children, title, icon: Icon, color = '#00d4ff', action, style = {} }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card"
    style={{ padding: 24, ...style }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
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

const HealthMeter = ({ score }) => {
  const c = 2 * Math.PI * 50;
  const color = score >= 80 ? '#00ff88' : score >= 60 ? '#00d4ff' : '#f59e0b';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <motion.circle cx="70" cy="70" r="50" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          transform="rotate(-90 70 70)" filter={`drop-shadow(0 0 8px ${color})`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 900, color }}>{score}</span>
        <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>SCORE</span>
      </div>
    </div>
  );
};

const DOC_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'prescription', label: 'Prescriptions' },
  { id: 'report', label: 'Lab Reports' },
  { id: 'image', label: 'X-rays / Images' },
  { id: 'other', label: 'Other' },
];

const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [accessCode, setAccessCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);
  const [selectedQ, setSelectedQ] = useState(null);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [liveVitals, setLiveVitals] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [bookForm, setBookForm] = useState({ doctor: '', specialty: '', date: '', time: '', type: 'video', reason: '' });
  const [bookSuccess, setBookSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (user?._id) {
      const today = new Date().toLocaleDateString();
      const lastCheck = localStorage.getItem(`lastVitalsLog_${user._id}`);
      if (lastCheck !== today) setShowVitalsModal(true);
    }
  }, [user]);

  const handleVitalsComplete = (data) => {
    if (data && data.bp && data.hr && data.spo2) setLiveVitals(data);
    if (user?._id) localStorage.setItem(`lastVitalsLog_${user._id}`, new Date().toLocaleDateString());
    setShowVitalsModal(false);
  };

  const userConditionsText = (user?.chronicConditions || []).join(' ').toLowerCase();
  const vitals = [
    { icon: Heart, label: 'Heart Rate', value: liveVitals?.hr || (userConditionsText.includes('arrhythmia') ? '88' : '72'), unit: 'bpm', color: '#ff4444' },
    { icon: Activity, label: 'Blood Pressure', value: liveVitals?.bp || (userConditionsText.includes('hypertension') || userConditionsText.includes('bp') ? '142/90' : '118/76'), unit: 'mmHg', color: '#00d4ff' },
    { icon: Droplets, label: 'Blood Oxygen', value: liveVitals?.spo2 || (userConditionsText.includes('asthma') ? '94' : '98'), unit: '%', color: '#00ff88' },
    { icon: Thermometer, label: 'Temperature', value: '98.4', unit: '°F', color: '#f59e0b' },
  ];

  useEffect(() => {
    if (!bookForm.doctor || !bookForm.date) {
      setAvailableSlots([]); return;
    }
    setLoadingSlots(true);
    api.get(`/appointments/slots/${bookForm.doctor}/${bookForm.date}`)
      .then(res => setAvailableSlots(res.data?.slots || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [bookForm.doctor, bookForm.date]);

  useEffect(() => {
    if (!user) return;
    api.get('/users/doctors').then(res => setAvailableDoctors(res.data)).catch(console.error);
    api.get('/appointments/my').then(res => setBookedAppointments(res.data)).catch(console.error);
    api.get('/records').then(res => {
      const mappedDocs = res.data.map(d => ({
        id: d._id, name: d.title, type: d.fileType, size: 'Cloud Stored', date: new Date(d.date).toLocaleDateString(), data: d.fileUrl, category: d.type === 'lab_report' ? 'report' : d.type === 'imaging' ? 'image' : d.type === 'prescription' ? 'prescription' : 'other'
      }));
      setDocuments(mappedDocs);
    }).catch(console.error);
  }, [user]);

  const handleBookAppointment = async () => {
    if (!bookForm.doctor || !bookForm.date || !bookForm.timeSlot) return;
    try {
      const { data } = await api.post('/appointments/book', { doctorId: bookForm.doctor, date: bookForm.date, timeSlot: bookForm.timeSlot, reason: bookForm.reason });
      setBookedAppointments(prev => [data, ...prev]);
      setBookSuccess(true);
      setTimeout(() => { setBookSuccess(false); setShowBooking(false); setBookForm({ doctor: '', date: '', timeSlot: '', reason: '' }); setAvailableSlots([]); }, 1800);
    } catch (error) { alert(error.response?.data?.message || 'Booking failed'); }
  };

  const cancelAppointment = async (id) => {
    try {
      const { data } = await api.put(`/appointments/${id}/cancel`);
      setBookedAppointments(prev => prev.map(a => a._id === id ? data : a));
    } catch (error) { console.error('Cancel failed', error); }
  };

  useEffect(() => {
    const userId = user?._id || 'demo';
    const code = localStorage.getItem(`cc_code_${userId}`);
    if (code) setAccessCode(code);
    else {
      const newCode = genCode();
      localStorage.setItem(`cc_code_${userId}`, newCode);
      setAccessCode(newCode);
    }
  }, [user]);

  const copyCode = () => { navigator.clipboard.writeText(accessCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); };
  const regenerateCode = () => { const newCode = genCode(); localStorage.setItem(`cc_code_${user?._id || 'demo'}`, newCode); setAccessCode(newCode); };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const { data } = await api.post('/records', { title: file.name, type: 'other', fileUrl: ev.target.result, fileName: file.name, fileType: file.type });
          setDocuments(prev => [{ id: data._id, name: data.title, type: data.fileType, size: (file.size / 1024).toFixed(1) + ' KB', date: new Date().toLocaleDateString(), data: data.fileUrl, category: 'other' }, ...prev]);
        } catch (error) { console.error("Upload failed", error); }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerSOS = () => {
    setSosCountdown(5);
    const iv = setInterval(() => setSosCountdown(c => {
      if (c <= 1) { clearInterval(iv); return null; }
      return c - 1;
    }), 1000);
  };

  const specialtySuggestions = getSuggestedSpecialties(documents, user?.chronicConditions?.join(' ') || '');
  const filteredDocs = documents.filter(d => (activeCategory === 'all' || d.category === activeCategory) && d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <DailyVitalsModal isOpen={showVitalsModal} onClose={() => setShowVitalsModal(false)} onComplete={handleVitalsComplete} />
      <div className="bg-grid" />
      <Sidebar role="patient" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar role="patient" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="dashboard-main">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800 }}>Good morning, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Patient'}</span> 👋</h1>
              <p style={{ color: 'rgba(240,244,255,0.45)', marginTop: 6 }}>Manage your health journey in one place</p>
            </div>
            <motion.button onClick={triggerSOS} animate={sosCountdown ? { scale: [1, 1.05, 1] } : {}} className="btn-sos">
              <AlertTriangle size={18} /> {sosCountdown ? `SOS in ${sosCountdown}s` : 'EMERGENCY SOS'}
            </motion.button>
          </div>
          <div style={{ marginTop: 16 }}><ECGLine color="#00d4ff" height={44} /></div>
        </motion.div>

        <div className="dashboard-grid-3">
          <WidgetCard title="Health Score" icon={Activity} color="#00ff88">
            <HealthMeter score={user?.healthScore || 78} />
          </WidgetCard>
          <WidgetCard title="Today's Vitals" icon={Heart} color="#ff4444">
            <div className="vitals-grid">
              {vitals.map(v => (
                <div key={v.label} className="vital-mini-card" style={{ background: `${v.color}08`, border: `1px solid ${v.color}20` }}>
                  <v.icon size={16} color={v.color} />
                  <div>
                    <p className="vital-label">{v.label}</p>
                    <p className="vital-value" style={{ color: v.color }}>{v.value} <span>{v.unit}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </WidgetCard>
          <WidgetCard title="Smart Triage" icon={Brain} color="#8b5cf6">
            <SmartTriage />
          </WidgetCard>
        </div>

        <div style={{ marginTop: 24 }}>
          <SymptomLogger />
        </div>

        <div className="dashboard-grid-2" style={{ marginTop: 24 }}>
          <WidgetCard title="Health Locker" icon={FileText} color="#00d4ff" action={{ label: 'Upload', icon: Upload, fn: () => fileInputRef.current?.click() }}>
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileUpload} />
            <div className="doc-list">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-icon">{doc.category === 'prescription' ? '💊' : '📄'}</div>
                  <div className="doc-info">
                    <p>{doc.name}</p>
                    <span>{doc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </WidgetCard>
          <AdherenceTracker />
        </div>

        <div className="dashboard-grid-2" style={{ marginTop: 24 }}>
          <WidgetCard title="Appointments" icon={Calendar} color="#8b5cf6" action={{ label: 'Book New', icon: Plus, fn: () => setShowBooking(true) }}>
            <div className="appt-list">
              {bookedAppointments.map(appt => (
                <div key={appt._id} className="appt-item">
                  <div>
                    <p className="appt-doc">{appt.doctorId?.name || 'Doctor'}</p>
                    <p className="appt-spec">{appt.doctorId?.specialization}</p>
                  </div>
                  <div className="appt-status">{appt.status}</div>
                </div>
              ))}
            </div>
          </WidgetCard>
          <WidgetCard title="AI Assistant" icon={Brain} color="#8b5cf6">
            <div className="faq-list">
              {AI_QA[0].questions.map((qa, i) => (
                <button key={i} onClick={() => setSelectedQ(qa)} className="faq-btn">{qa.q}</button>
              ))}
            </div>
            {selectedQ && (
              <div className="faq-answer">
                <p><strong>Answer:</strong> {selectedQ.a}</p>
              </div>
            )}
          </WidgetCard>
        </div>

        <AnimatePresence>
          {showBooking && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="modal-content glass-card">
                <h3>Book Appointment</h3>
                <select className="input-glass" value={bookForm.doctor} onChange={e => setBookForm(f => ({ ...f, doctor: e.target.value }))}>
                  <option value="">Select Doctor</option>
                  {availableDoctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <input type="date" className="input-glass" value={bookForm.date} onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} />
                <div className="slots-grid">
                  {availableSlots.map(s => (
                    <button key={s.time} className={`slot-btn ${bookForm.timeSlot === s.time ? 'active' : ''}`} onClick={() => setBookForm(f => ({...f, timeSlot: s.time}))}>{s.time}</button>
                  ))}
                </div>
                <button className="btn-primary" onClick={handleBookAppointment}>Confirm Booking</button>
                <button className="btn-ghost" onClick={() => setShowBooking(false)}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
