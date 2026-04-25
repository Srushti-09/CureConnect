import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, Activity, 
  ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { api } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const COLORS = ['#8b5cf6', '#00d4ff', '#00ff88', '#f59e0b', '#ec4899'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/adherence/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deepest)' }}>
      <Activity className="animate-spin" size={32} color="var(--cyan)" />
    </div>
  );

  const stats = [
    { label: 'Patient Compliance', value: `${data?.summary?.averageCompliance || 0}%`, icon: Activity, color: '#00ff88', trend: '+5.2%' },
    { label: 'Total Logs', value: data?.summary?.totalLogs || 0, icon: TrendingUp, color: '#00d4ff', trend: 'Stable' },
    { label: 'Active Patients', value: data?.patientSummary?.length || 0, icon: Users, color: '#8b5cf6', trend: '+12%' },
    { label: 'Network Health', value: '99.9%', icon: Activity, color: '#ec4899', trend: 'Optimal' },
  ];

  return (
    <div className="dashboard-layout">
      <div className="bg-grid" />
      <Sidebar role="doctor" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar role="doctor" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="dashboard-main">
          <header style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900 }}>
              <span className="text-gradient">Healthcare Intelligence</span>
            </h1>
            <p style={{ opacity: 0.5, marginTop: 4 }}>System-wide adherence monitoring and data-driven insights</p>
          </header>

          <div className="dashboard-grid-4" style={{ marginBottom: 32 }}>
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={22} color={s.color} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#00ff88' }}>{s.trend}</div>
                </div>
                <p style={{ fontSize: 28, fontWeight: 900 }}>{s.value}</p>
                <p style={{ fontSize: 14, opacity: 0.4, marginTop: 4 }}>{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Compliance Trend</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.dailyAnalytics || []}>
                    <defs>
                      <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="complianceRate" stroke="#00d4ff" strokeWidth={3} fill="url(#colorCompliance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Risk Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data?.patientSummary?.filter(p => p.complianceRate < 70).map((p, i) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>Patient Alert</span>
                      <AlertTriangle size={14} color="#ff4444" />
                    </div>
                    <p style={{ fontSize: 12, opacity: 0.6 }}>Compliance dropped to {Math.round(p.complianceRate)}% for ID {p.patient.substring(0,8)}</p>
                  </div>
                ))}
                {(data?.patientSummary?.filter(p => p.complianceRate < 70).length === 0) && (
                  <p style={{ opacity: 0.4, fontSize: 13, textAlign: 'center' }}>No high-risk patients detected.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAnalytics;
