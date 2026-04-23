import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import PersonaSelection from './pages/PersonaSelection';
import AuthPage from './pages/AuthPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deepest)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, border: '3px solid rgba(0,212,255,0.2)', borderTop: '3px solid #00d4ff', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin-slow 1s linear infinite' }} />
        <p style={{ color: 'var(--cyan)', fontFamily: 'Outfit, sans-serif', fontSize: 14 }}>Initializing CureConnect...</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/select" element={<PersonaSelection />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/patient" element={
          <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
