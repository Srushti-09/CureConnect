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
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="loading-spinner">Loading Intelligence...</div>;

  const stats = [
    { label: 'Patient Compliance', value: '84%', icon: Activity, color: '#00ff88', trend: '+5.2%' },
    { label: 'Risky Interactions', value: data?.riskyCombinations?.length || 0, icon: AlertTriangle, color: '#ff4444', trend: '-2.1%' },
    { label: 'Active Patients', value: '1,284', icon: Users, color: '#8b5cf6', trend: '+12%' },
    { label: 'System Uptime', value: '99.9%', icon: TrendingUp, color: '#00d4ff', trend: 'Stable' },
  ];

  return (
    <div className="dashboard-layout">
      <div className="bg-grid" />
      <Sidebar role="doctor" mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar role="doctor" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <main className="dashboard-main">
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>
            <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Healthcare Intelligence
            </span> Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Real-time adherence monitoring and drug risk analytics</p>
        </header>

        {/* Stats Row */}
        <div className="dashboard-grid-4" style={{ marginBottom: 24 }}>
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card" 
              style={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: s.trend.startsWith('+') ? '#00ff88' : s.trend === 'Stable' ? '#00d4ff' : '#ff4444' }}>
                  {s.trend.startsWith('+') ? <ArrowUpRight size={12} /> : s.trend.startsWith('-') ? <ArrowDownRight size={12} /> : null}
                  {s.trend}
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 900 }}>{s.value}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Main Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Missed Doses Trend</h3>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}><Filter size={14} /> Last 7 Days</button>
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.missedDosesTrend}>
                  <defs>
                    <linearGradient id="colorMissed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMissed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risky Combinations */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Top Risky Combinations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data?.riskyCombinations?.map((combo, i) => (
                <div key={i} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{combo.drugs}</span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: combo.risk === 'Severe' ? '#ff4444' : '#f59e0b' }}>{combo.risk}</span>
                  </div>
                  <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(combo.detections/20)*100}%`, background: combo.risk === 'Severe' ? '#ff4444' : '#f59e0b' }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{combo.detections} detections this month</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Non-adherent patients */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Non-Adherent Patients</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data?.nonAdherentPatients?.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>All patients are currently compliant. Good job!</p>
              ) : data?.nonAdherentPatients?.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)', borderRadius: 12 }}>
                   <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#ff4444' }}>{p.name[0]}</div>
                   <div style={{ flex: 1 }}>
                     <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                     <p style={{ fontSize: 11, color: 'rgba(255,68,68,0.6)' }}>Compliance: {p.score}%</p>
                   </div>
                   <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, color: '#ff4444' }}>Alert Patient</button>
                </div>
              ))}
            </div>
          </div>

          {/* Adherence Distribution */}
          <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Compliance Distribution</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <ResponsiveContainer width="100%" height={240}>
                 <PieChart>
                  <Pie
                    data={[
                      { name: 'Excellent', value: 45 },
                      { name: 'Good', value: 30 },
                      { name: 'Poor', value: 15 },
                      { name: 'Critical', value: 10 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Excellent', 'Good', 'Poor', 'Critical'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                       <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
