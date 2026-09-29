import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle2, XCircle, Plus, Edit2, Trash2, Search, Filter, TrendingDown, Layers } from 'lucide-react';

const CATEGORIES = ['Dairy', 'Beans & Teas', 'Produce', 'Bakery', 'Packaging', 'Groceries'];
const UNITS = ['Kg', 'Liters', 'Packets', 'Bags', 'Boxes', 'Units', 'Packs'];

export default function InventoryTracker({ inventoryItems, onSaveItem, onDeleteItem, onAdjustStock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    materialName: '',
    category: 'Dairy',
    currentStock: '',
    unit: 'Kg',
    reorderLevel: '',
    unitCost: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      materialName: '',
      category: 'Dairy',
      currentStock: '',
      unit: 'Kg',
      reorderLevel: '5',
      unitCost: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      materialName: item.materialName,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      unitCost: item.unitCost || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.materialName.trim()) return;

    const itemToSave = {
      id: editingItem ? editingItem.id : `inv-${Date.now()}`,
      materialName: formData.materialName.trim(),
      category: formData.category,
      currentStock: Number(formData.currentStock) || 0,
      unit: formData.unit,
      reorderLevel: Number(formData.reorderLevel) || 0,
      unitCost: Number(formData.unitCost) || 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    onSaveItem(itemToSave);
    setIsModalOpen(false);
  };

  // Derived Statistics
  const totalItems = inventoryItems.length;
  const totalValuation = inventoryItems.reduce((sum, item) => sum + (item.currentStock * (item.unitCost || 0)), 0);
  const lowStockCount = inventoryItems.filter(item => item.currentStock > 0 && item.currentStock <= item.reorderLevel).length;
  const outOfStockCount = inventoryItems.filter(item => item.currentStock <= 0).length;

  // Filtering
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'LOW') {
        matchesStatus = item.currentStock > 0 && item.currentStock <= item.reorderLevel;
      } else if (statusFilter === 'OUT') {
        matchesStatus = item.currentStock <= 0;
      } else if (statusFilter === 'OK') {
        matchesStatus = item.currentStock > item.reorderLevel;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase">Inventory Items</p>
            <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{totalItems}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase">Stock Valuation</p>
            <h3 className="text-2xl font-extrabold text-amber-900 mt-1">₹{totalValuation.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase">Low Stock Alerts</p>
            <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{lowStockCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase">Out of Stock</p>
            <h3 className="text-2xl font-extrabold text-rose-700 mt-1">{outOfStockCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Control Bar: Search & Add Item */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory material..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
            >
              <option value="ALL">All Stock Status</option>
              <option value="OK">In Stock Only</option>
              <option value="LOW">Low Stock Alerts Only</option>
              <option value="OUT">Out of Stock Only</option>
            </select>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Raw Material Item</span>
            </button>
          </div>

        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold text-stone-900 mb-4">Stock Levels & Inventory Status</h3>

        {filteredItems.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No inventory items match the current filter.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Material Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Reorder Level</th>
                <th className="py-3 px-4 text-right">Est. Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Stock Status</th>
                <th className="py-3 px-4 text-center">Quick Stock Adjust</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-700">
              {filteredItems.map(item => {
                const stockVal = item.currentStock * (item.unitCost || 0);
                const isOut = item.currentStock <= 0;
                const isLow = item.currentStock > 0 && item.currentStock <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900">{item.materialName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 border border-stone-200">
                        {item.category}
                      </span>
                    </td>
                    
                    {/* Current Stock */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-base text-stone-900">
                      {item.currentStock} <span className="text-xs font-normal text-stone-500">{item.unit}</span>
                    </td>

                    {/* Reorder Threshold */}
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-stone-500">
                      {item.reorderLevel} {item.unit}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-4 text-right text-xs font-semibold text-stone-600">
                      ₹{item.unitCost || 0}
                    </td>

                    {/* Total Value */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-900">
                      ₹{stockVal.toLocaleString()}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Stock</span>
                        </span>
                      )}
                    </td>

                    {/* Quick Adjust Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onAdjustStock(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300"
                          title="Decrease Stock (-1)"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onAdjustStock(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300"
                          title="Increase Stock (+1)"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onAdjustStock(item.id, 5)}
                          className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-300"
                          title="Add +5 Stock"
                        >
                          +5
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
            <div className="bg-stone-950 text-amber-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-title">
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  placeholder="e.g. Whole Milk, Coffee Beans"
                  className="w-full px-3.5 py-2 border rounded-xl text-sm bg-stone-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm font-semibold bg-stone-50"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Current Stock *</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    placeholder="10"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-stone-50"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Reorder Alert Level *</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder="5"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    placeholder="50"
                    className="w-full px-3.5 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-600 font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-amber-600 text-white font-bold rounded-xl shadow">Save Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
