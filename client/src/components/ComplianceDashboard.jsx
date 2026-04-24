import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, Pill, AlertTriangle,
  CheckCircle, Clock, Target
} from 'lucide-react';

const ComplianceDashboard = () => {
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No analytics data available
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Compliance Analytics</h2>
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
        <div className="glass-card p-6">
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

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {patientSummary.filter(p => p.complianceRate >= 80).length}
              </div>
              <div className="text-sm text-gray-600">High Compliance (&gt;80%)</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {patientSummary.filter(p => p.complianceRate < 70).length}
              </div>
              <div className="text-sm text-gray-600">Low Compliance (&lt;70%)</div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Pill className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalLogs}
              </div>
              <div className="text-sm text-gray-600">Total Logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            Compliance Trend (Last 90 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complianceTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Compliance']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Adherence Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="text-green-600" size={20} />
            Adherence Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={adherenceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {adherenceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {adherenceDistribution.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Adherence Breakdown */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart className="text-purple-600" size={20} />
          Daily Adherence Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={complianceTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="taken" stackId="a" fill="#10B981" name="Taken" />
            <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Missed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Patients */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          Patient Compliance Ranking
        </h3>
        <div className="space-y-3">
          {topPatients.map((patient, index) => (
            <div key={patient.patient} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">Patient {patient.patient.toString().slice(-6)}</div>
                  <div className="text-sm text-gray-600">
                    {patient.takenLogs}/{patient.totalLogs} doses taken
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  patient.complianceRate >= 80 ? 'text-green-600' :
                  patient.complianceRate >= 70 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {patient.complianceRate.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ComplianceDashboard;