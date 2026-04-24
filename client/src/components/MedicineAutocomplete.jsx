import { useState, useEffect, useRef } from 'react';
import { Search, X, Pill, AlertTriangle } from 'lucide-react';
import { api } from '../context/AuthContext';

const MedicineAutocomplete = ({ onSelect, onRemove, selectedMedicines = [], placeholder = "Search for medicine..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Common medicines database (fallback when API fails)
  const commonMedicines = [
    { name: 'Aspirin', genericName: 'Acetylsalicylic acid', class: 'NSAID' },
    { name: 'Lisinopril', genericName: 'Lisinopril', class: 'ACE Inhibitor' },
    { name: 'Metformin', genericName: 'Metformin', class: 'Biguanide' },
    { name: 'Atorvastatin', genericName: 'Atorvastatin', class: 'Statin' },
    { name: 'Warfarin', genericName: 'Warfarin', class: 'Anticoagulant' },
    { name: 'Amiodarone', genericName: 'Amiodarone', class: 'Antiarrhythmic' },
    { name: 'Digoxin', genericName: 'Digoxin', class: 'Cardiac glycoside' },
    { name: 'Furosemide', genericName: 'Furosemide', class: 'Loop diuretic' },
    { name: 'Omeprazole', genericName: 'Omeprazole', class: 'Proton pump inhibitor' },
    { name: 'Prednisone', genericName: 'Prednisone', class: 'Corticosteroid' },
    { name: 'Gabapentin', genericName: 'Gabapentin', class: 'Anticonvulsant' },
    { name: 'Sertraline', genericName: 'Sertraline', class: 'SSRI' },
    { name: 'Levothyroxine', genericName: 'Levothyroxine', class: 'Thyroid hormone' },
    { name: 'Albuterol', genericName: 'Albuterol', class: 'Beta-2 agonist' },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', class: 'NSAID' },
    { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', class: 'Fluoroquinolone' },
    { name: 'Clarithromycin', genericName: 'Clarithromycin', class: 'Macrolide' },
    { name: 'Spironolactone', genericName: 'Spironolactone', class: 'Diuretic' },
    { name: 'Simvastatin', genericName: 'Simvastatin', class: 'Statin' },
    { name: 'Phenytoin', genericName: 'Phenytoin', class: 'Anticonvulsant' }
  ];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // In a real app, you'd call a medicine API
        // For now, filter from common medicines
        const filtered = commonMedicines.filter(med =>
          med.name.toLowerCase().includes(query.toLowerCase()) ||
          med.genericName.toLowerCase().includes(query.toLowerCase()) ||
          med.class.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching medicine suggestions:', error);
        // Fallback to local filtering
        const filtered = commonMedicines.filter(med =>
          med.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        setSuggestions(filtered);
        setShowSuggestions(true);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelect = (medicine) => {
    if (!selectedMedicines.some(med => med.name.toLowerCase() === medicine.name.toLowerCase())) {
      onSelect(medicine);
    }
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="medicine-autocomplete">
      <div className="relative">
        <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm"
          />
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((medicine, index) => (
              <button
                key={index}
                onClick={() => handleSelect(medicine)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                <Pill size={16} className="text-blue-500" />
                <div>
                  <div className="font-medium text-sm">{medicine.name}</div>
                  <div className="text-xs text-gray-500">
                    {medicine.genericName} • {medicine.class}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMedicines.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedMedicines.map((medicine, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <Pill size={14} className="text-blue-600" />
              <span className="text-blue-800">{medicine.name}</span>
              <button
                onClick={() => onRemove(medicine)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineAutocomplete;