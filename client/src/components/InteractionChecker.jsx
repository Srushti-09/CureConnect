import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { api } from '../context/AuthContext';

const InteractionChecker = ({ medications, onAcknowledge, acknowledgedWarnings = [] }) => {
  const [interactions, setInteractions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (medications.length >= 2) {
      checkInteractions();
    } else {
      setInteractions(null);
    }
  }, [medications]);

  const checkInteractions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/interactions/check', {
        medications: medications.map(med => med.name)
      });

      setInteractions(response.data);
    } catch (err) {
      console.error('Error checking interactions:', err);
      setError('Failed to check drug interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'major': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'major': return <X size={16} className="text-red-600" />;
      case 'moderate': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'minor': return <Info size={16} className="text-yellow-600" />;
      default: return <Info size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-800 text-sm">Checking for drug interactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={16} className="text-red-600" />
        <span className="text-red-800 text-sm">{error}</span>
      </div>
    );
  }

  if (!interactions || !interactions.hasInteractions) {
    if (medications.length >= 2) {
      return (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-green-800 text-sm">No known interactions found between selected medications.</span>
        </div>
      );
    }
    return null;
  }

  const totalInteractions = interactions.totalInteractions;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={18} className="text-red-600" />
        <div>
          <div className="text-red-800 font-medium text-sm">
            {totalInteractions} potential drug interaction{totalInteractions !== 1 ? 's' : ''} detected
          </div>
          <div className="text-red-700 text-xs">
            Please review carefully before prescribing
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(interactions.interactions).map(([severity, interactionList]) =>
          interactionList.map((interaction, index) => {
            const warningId = `${severity}-${index}`;
            const isAcknowledged = acknowledgedWarnings.includes(warningId);

            return (
              <div
                key={warningId}
                className={`p-3 border rounded-lg ${getSeverityColor(severity)} ${isAcknowledged ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm capitalize">{severity} Interaction</span>
                      <span className="text-xs opacity-75">
                        {interaction.source} • {interaction.evidenceLevel} evidence
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      <strong>{interaction.drugs.join(' + ')}</strong>
                    </div>
                    <div className="text-sm">{interaction.description}</div>
                    {!isAcknowledged && onAcknowledge && (
                      <button
                        onClick={() => onAcknowledge(warningId)}
                        className="mt-2 px-3 py-1 text-xs bg-white border border-current rounded hover:bg-gray-50 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {isAcknowledged && (
                      <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Acknowledged
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InteractionChecker;