import { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, Pill, AlertTriangle, TrendingUp,
  Activity, Calendar, Target, UserCheck
} from 'lucide-react';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/adherence/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              No analytics data available
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { dailyAnalytics, patientSummary, summary } = analytics;

  // Prepare data for charts
  const complianceTrendData = dailyAnalytics.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    compliance: day.complianceRate,
    taken: day.taken,
    missed: day.missed
  }));

  const adherenceDistribution = [
    { name: 'Taken', value: summary.totalLogs > 0 ? (patientSummary.reduce((sum, p) => sum + p.takenLogs, 0) / summary.totalLogs * 100) : 0, color: '#10B981' },
    { name: 'Missed', value: summary.totalLogs > 0 ? (patientSummary.reduce((sum, p) => sum + (p.totalLogs - p.takenLogs), 0) / summary.totalLogs * 100) : 0, color: '#EF4444' }
  ];

  const topPatients = patientSummary
    .sort((a, b) => b.complianceRate - a.complianceRate)
    .slice(0, 5);

  const nonAdherentPatients = patientSummary
    .filter(p => p.complianceRate < 75)
    .sort((a, b) => a.complianceRate - b.complianceRate)
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Adherence Analytics</h1>
                <p className="text-gray-600">Monitor patient medication adherence across your practice</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{summary.averageCompliance}%</div>
                  <div className="text-sm text-gray-600">Average Compliance</div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {patientSummary.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Patients</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Pill className="text-green-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.totalLogs}
                    </div>
                    <div className="text-sm text-gray-600">Total Logs</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {nonAdherentPatients.length}
                    </div>
                    <div className="text-sm text-gray-600">Non-Adherent</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Target className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {summary.averageCompliance}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Compliance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Trend */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend (30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="compliance" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Adherence Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adherence Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={adherenceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {adherenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Patient Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Patients */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="text-green-600" size={20} />
                  Top Performing Patients
                </h3>
                <div className="space-y-3">
                  {topPatients.map((patient, index) => (
                    <div key={patient.patientId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{patient.patientName}</div>
                          <div className="text-sm text-gray-600">{patient.totalLogs} doses logged</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{patient.complianceRate}%</div>
                        <div className="text-xs text-gray-500">compliance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Adherent Patients */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  Patients Needing Attention
                </h3>
                <div className="space-y-3">
                  {nonAdherentPatients.map((patient, index) => (
                    <div key={patient.patientId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600">
                          !
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{patient.patientName}</div>
                          <div className="text-sm text-gray-600">{patient.totalLogs} doses logged</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{patient.complianceRate}%</div>
                        <div className="text-xs text-gray-500">compliance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;