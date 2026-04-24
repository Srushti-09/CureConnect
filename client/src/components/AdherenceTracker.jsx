import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, api } from '../context/AuthContext';
import {
  Pill, CheckCircle, Clock, AlertCircle,
  Calendar, TrendingUp, Target, Plus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const AdherenceTracker = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [adherenceLogs, setAdherenceLogs] = useState([]);
  const [complianceScore, setComplianceScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showMarkForm, setShowMarkForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prescriptionsRes, logsRes, complianceRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/adherence/logs'),
        api.get('/adherence/compliance')
      ]);

      setPrescriptions(prescriptionsRes.data.filter(p => p.status === 'active'));
      setAdherenceLogs(logsRes.data);
      setComplianceScore(complianceRes.data);
    } catch (error) {
      console.error('Error fetching adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAdherence = async (prescriptionId, medicationName, status, notes = '') => {
    try {
      await api.post('/adherence/mark', {
        prescriptionId,
        medicationName,
        status,
        notes
      });

      // Refresh data
      await fetchData();
      setShowMarkForm(false);
    } catch (error) {
      console.error('Error marking adherence:', error);
    }
  };

  const getTodaysMedications = () => {
    const today = new Date().toDateString();
    const todaysMeds = [];

    prescriptions.forEach(prescription => {
      prescription.medications.forEach(med => {
        // Check if already logged today
        const existingLog = adherenceLogs.find(log =>
          log.prescription._id === prescription._id &&
          log.medication.name === med.name &&
          new Date(log.createdAt).toDateString() === today
        );

        if (!existingLog) {
          todaysMeds.push({
            prescriptionId: prescription._id,
            medication: med,
            prescription: prescription,
            status: null
          });
        } else {
          todaysMeds.push({
            prescriptionId: prescription._id,
            medication: med,
            prescription: prescription,
            status: existingLog.status,
            logId: existingLog._id
          });
        }
      });
    });

    return todaysMeds;
  };

  const getUpcomingDoses = () => {
    const now = new Date();
    const upcoming = [];

    prescriptions.forEach(prescription => {
      prescription.medications.forEach(med => {
        // Simple logic: assume medications need to be taken based on frequency
        // In a real app, you'd have scheduled times
        const lastTaken = adherenceLogs
          .filter(log => log.prescription._id === prescription._id && log.medication.name === med.name)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!lastTaken || new Date(lastTaken.createdAt).getDate() !== now.getDate()) {
          upcoming.push({
            prescription: prescription._id,
            medication: med,
            prescriptionData: prescription,
            dueTime: 'Today' // Simplified
          });
        }
      });
    });

    return upcoming;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const getTodaysLogs = () => {
    const today = new Date().toDateString();
    return adherenceLogs.filter(log => new Date(log.createdAt).toDateString() === today);
  };

  const todaysLogs = getTodaysLogs();
  const upcomingDoses = getUpcomingDoses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medication Adherence</h2>
          <p className="text-gray-600">Track your medication schedule and compliance</p>
        </div>
        <button
          onClick={() => setShowMarkForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Mark Dose
        </button>
      </div>

      {/* Today's Medications */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Medications</h3>
        {getTodaysMedications().length === 0 ? (
          <p className="text-gray-500 text-center py-4">No medications scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {getTodaysMedications().map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.medication.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.medication.dosage} • {item.medication.frequency}
                  </p>
                  <p className="text-xs text-gray-500">{item.prescription.diagnosis}</p>
                </div>
                <div className="flex gap-2">
                  {item.status === null ? (
                    <>
                      <button
                        onClick={() => markAdherence(item.prescriptionId, item.medication.name, 'taken')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Taken
                      </button>
                      <button
                        onClick={() => markAdherence(item.prescriptionId, item.medication.name, 'missed')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <X size={16} />
                        Missed
                      </button>
                    </>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'taken' ? 'bg-green-100 text-green-800' :
                      item.status === 'missed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'taken' ? '✓ Taken' :
                       item.status === 'missed' ? '✗ Missed' :
                       item.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Overview */}
      {complianceScore && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {complianceScore.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Compliance</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {todaysLogs.length}
                </div>
                <div className="text-sm text-gray-600">Doses Today</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {upcomingDoses.length}
                </div>
                <div className="text-sm text-gray-600">Upcoming Doses</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Chart */}
      {complianceScore && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Compliance</span>
              <span className={`text-sm font-bold ${
                complianceScore.overallScore >= 90 ? 'text-green-600' :
                complianceScore.overallScore >= 75 ? 'text-blue-600' :
                complianceScore.overallScore >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {complianceScore.overallScore >= 90 ? 'Excellent' :
                 complianceScore.overallScore >= 75 ? 'Good' :
                 complianceScore.overallScore >= 50 ? 'Poor' :
                 'Critical'} ({complianceScore.overallScore}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  complianceScore.overallScore >= 90 ? 'bg-green-600' :
                  complianceScore.overallScore >= 75 ? 'bg-blue-600' :
                  complianceScore.overallScore >= 50 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${Math.min(complianceScore.overallScore, 100)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {complianceScore.prescriptionScores.reduce((sum, p) => sum + p.takenLogs, 0)}
                </div>
                <div className="text-sm text-gray-600">Doses Taken</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {complianceScore.prescriptionScores.reduce((sum, p) => sum + (p.totalLogs - p.takenLogs), 0)}
                </div>
                <div className="text-sm text-gray-600">Doses Missed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Doses */}
      {upcomingDoses.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-orange-600" size={20} />
            Upcoming Doses
          </h3>
          <div className="space-y-3">
            {upcomingDoses.map((dose, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Pill className="text-orange-600" size={18} />
                  <div>
                    <div className="font-medium">{dose.medication.name}</div>
                    <div className="text-sm text-gray-600">
                      {dose.medication.dosage} • {dose.medication.frequency}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => markAdherence(dose.prescription, dose.medication.name, 'taken')}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Mark Taken
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={20} />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {adherenceLogs.slice(0, 10).map((log, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {log.status === 'taken' ? (
                <CheckCircle className="text-green-600" size={18} />
              ) : log.status === 'missed' ? (
                <AlertCircle className="text-red-600" size={18} />
              ) : (
                <Clock className="text-orange-600" size={18} />
              )}
              <div className="flex-1">
                <div className="font-medium">{log.medication.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(log.createdAt).toLocaleDateString()} • {log.status}
                </div>
              </div>
            </div>
          ))}
          {adherenceLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No adherence logs yet. Start tracking your medications!
            </div>
          )}
        </div>
      </div>

      {/* Mark Adherence Modal */}
      <AnimatePresence>
        {showMarkForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowMarkForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Mark Medication</h3>
              <div className="space-y-4">
                <select
                  value={selectedPrescription || ''}
                  onChange={(e) => setSelectedPrescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Prescription</option>
                  {prescriptions.map(prescription => (
                    <option key={prescription._id} value={prescription._id}>
                      {prescription.diagnosis} - Dr. {prescription.doctor.name}
                    </option>
                  ))}
                </select>

                {selectedPrescription && (
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    onChange={(e) => {
                      const [medName, status] = e.target.value.split('|');
                      if (medName && status) {
                        markAdherence(selectedPrescription, medName, status);
                      }
                    }}
                  >
                    <option value="">Select Medication & Status</option>
                    {prescriptions
                      .find(p => p._id === selectedPrescription)
                      ?.medications.map((med, index) => (
                        <>
                          <option key={`taken-${index}`} value={`${med.name}|taken`}>
                            {med.name} - Taken
                          </option>
                          <option key={`missed-${index}`} value={`${med.name}|missed`}>
                            {med.name} - Missed
                          </option>
                          <option key={`skipped-${index}`} value={`${med.name}|skipped`}>
                            {med.name} - Skipped
                          </option>
                        </>
                      ))}
                  </select>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMarkForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdherenceTracker;