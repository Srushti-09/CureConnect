import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Plus, Minus, AlertTriangle, 
  Trash2, Edit3, Check, X, Search,
  Tag, BarChart3
} from 'lucide-react';

const CATEGORIES = ['Antibiotics', 'Analgesics', 'Vaccines', 'Supplies', 'Samples', 'Other'];

export default function ClinicStockTracker({ doctorId = 'demo_user' }) {
  const [inventory, setInventory] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Other',
    currentStock: 0,
    threshold: 5,
    unit: 'Units'
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`cc_inventory_${doctorId}`);
    if (stored) {
      setInventory(JSON.parse(stored));
    } else {
      // Small seed data if empty
      const initial = [
        { id: 1, name: 'Amoxicillin 500mg', category: 'Antibiotics', currentStock: 12, threshold: 10, unit: 'Strips' },
        { id: 2, name: 'Paracetamol 650mg', category: 'Analgesics', currentStock: 4, threshold: 15, unit: 'Strips' },
        { id: 3, name: 'Surgical Gloves (M)', category: 'Supplies', currentStock: 45, threshold: 20, unit: 'Pairs' },
        { id: 4, name: 'Metformin 500mg', category: 'Samples', currentStock: 25, threshold: 10, unit: 'Strips' },
        { id: 5, name: 'Vitamin D3 60K', category: 'Samples', currentStock: 8, threshold: 12, unit: 'Capsules' },
        { id: 6, name: 'Azithromycin 250mg', category: 'Antibiotics', currentStock: 3, threshold: 5, unit: 'Strips' },
        { id: 7, name: 'Disposable Masks', category: 'Supplies', currentStock: 150, threshold: 50, unit: 'Pieces' },
        { id: 8, name: 'Insulin Glargine', category: 'Samples', currentStock: 2, threshold: 5, unit: 'Vials' }
      ];
      setInventory(initial);
      localStorage.setItem(`cc_inventory_${doctorId}`, JSON.stringify(initial));
    }
  }, [doctorId]);

  // Save to localStorage
  const saveToStorage = (updated) => {
    setInventory(updated);
    localStorage.setItem(`cc_inventory_${doctorId}`, JSON.stringify(updated));
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;
    const itemToAdd = {
      ...newItem,
      id: Date.now(),
      currentStock: Number(newItem.currentStock),
      threshold: Number(newItem.threshold)
    };
    const updated = [itemToAdd, ...inventory];
    saveToStorage(updated);
    setNewItem({ name: '', category: 'Other', currentStock: 0, threshold: 5, unit: 'Units' });
    setIsAdding(false);
  };

  const updateStock = (id, delta) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.currentStock + delta);
        
        // Trigger alert if stock hits exactly or below threshold (and it wasn't already alerted)
        if (newStock <= item.threshold && item.currentStock > item.threshold) {
          triggerAlert(item.name, newStock, item.unit);
        }
        
        return { ...item, currentStock: newStock };
      }
      return item;
    });
    saveToStorage(updated);
  };

  const triggerAlert = (name, stock, unit) => {
    const key = `cc_notifications_${doctorId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newAlert = {
      id: Date.now(),
      type: 'inventory_alert',
      title: 'Low Stock Alert',
      message: `${name} is running low (${stock} ${unit} remaining)`,
      sentAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    localStorage.setItem(key, JSON.stringify([...existing, newAlert]));
    
    // Also trigger a custom event so Navbar can refresh immediately
    window.dispatchEvent(new Event('cc_notif_update'));
  };

  const deleteItem = (id) => {
    const updated = inventory.filter(item => item.id !== id);
    saveToStorage(updated);
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="clinic-stock-tracker">
      {/* Header / Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(240,244,255,0.4)' }} />
          <input 
            className="input-glass"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, height: 42, fontSize: 13 }}
          />
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ 
            padding: '0 16px', 
            background: isAdding ? 'rgba(255,68,68,0.15)' : 'rgba(139,92,246,0.15)',
            border: `1px solid ${isAdding ? 'rgba(255,68,68,0.3)' : 'rgba(139,92,246,0.3)'}`,
            borderRadius: 10,
            color: isAdding ? '#ff6b6b' : '#8b5cf6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: 13
          }}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}
          >
            <div style={{ 
              padding: 16, 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 14,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 6, display: 'block' }}>MEDICINE NAME</label>
                <input 
                  className="input-glass" 
                  placeholder="e.g. Insulin Vials"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 6, display: 'block' }}>CATEGORY</label>
                <select 
                  className="input-glass"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  style={{ background: '#0a1628' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 6, display: 'block' }}>UNIT TYPE</label>
                <input 
                  className="input-glass" 
                  placeholder="e.g. Strips, Pairs"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 6, display: 'block' }}>INITIAL STOCK</label>
                <input 
                  type="number"
                  className="input-glass" 
                  value={newItem.currentStock}
                  onChange={(e) => setNewItem({...newItem, currentStock: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(240,244,255,0.4)', marginBottom: 6, display: 'block' }}>LOW STOCK ALERT (THRESHOLD)</label>
                <input 
                  type="number"
                  className="input-glass" 
                  value={newItem.threshold}
                  onChange={(e) => setNewItem({...newItem, threshold: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddItem}
                style={{ 
                  gridColumn: 'span 2',
                  padding: 12,
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 8
                }}
              >
                Add to Inventory
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredInventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4 }}>
            <Package size={40} style={{ marginBottom: 12 }} />
            <p>No inventory items found.</p>
          </div>
        ) : (
          filteredInventory.map((item) => {
            const isLow = item.currentStock <= item.threshold;
            return (
              <motion.div 
                layout
                key={item.id}
                style={{ 
                  padding: '14px 16px',
                  background: isLow ? 'rgba(255,68,68,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isLow ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                {/* Status Icon */}
                <div style={{ 
                  width: 40, height: 40, 
                  borderRadius: 12, 
                  background: isLow ? 'rgba(255,68,68,0.15)' : 'rgba(139,92,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isLow ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <AlertTriangle size={18} color="#ff6b6b" />
                    </motion.div>
                  ) : (
                    <Package size={18} color="#8b5cf6" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</h4>
                    <span style={{ 
                      fontSize: 10, 
                      padding: '2px 8px', 
                      background: 'rgba(255,255,255,0.06)', 
                      borderRadius: 100,
                      color: 'rgba(240,244,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: isLow ? '#ff6b6b' : 'rgba(240,244,255,0.4)', marginTop: 4 }}>
                    {isLow ? '⚠️ LOW STOCK ALERT' : 'Normal supply levels'}
                  </p>
                </div>

                {/* Stock Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: isLow ? '#ff6b6b' : '#fff' }}>
                      {item.currentStock}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase' }}>
                      {item.unit}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button 
                      onClick={() => updateStock(item.id, 1)}
                      style={{ 
                        padding: 4, 
                        background: 'rgba(0,255,136,0.1)', 
                        border: '1px solid rgba(0,255,136,0.2)', 
                        borderRadius: 6,
                        color: '#00ff88',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => updateStock(item.id, -1)}
                      style={{ 
                        padding: 4, 
                        background: 'rgba(255,68,68,0.1)', 
                        border: '1px solid rgba(255,68,68,0.2)', 
                        borderRadius: 6,
                        color: '#ff6b6b',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => deleteItem(item.id)}
                    style={{ 
                      padding: 10, 
                      background: 'transparent', 
                      border: 'none',
                      color: 'rgba(255,68,68,0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Summary Badge */}
      <div style={{ 
        marginTop: 20, 
        padding: '12px 16px', 
        background: 'rgba(139,92,246,0.06)', 
        border: '1px solid rgba(139,92,246,0.12)', 
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag size={14} color="#8b5cf6" />
          <span style={{ fontSize: 12, color: 'rgba(240,244,255,0.6)' }}>
            Total Items: <strong>{inventory.length}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={14} color="#ff6b6b" />
          <span style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 700 }}>
            {inventory.filter(i => i.currentStock <= i.threshold).length} Low Stock Alerts
          </span>
        </div>
      </div>
    </div>
  );
}
