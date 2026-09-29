import React, { useState, useMemo } from 'react';
import { Package, Plus, Edit2, Trash2, Search, AlertTriangle, CheckCircle2, XCircle, Filter, Calendar, Tag } from 'lucide-react';
import { UnitConverter } from '../utils/inventoryEngine';

const CATEGORIES = ['Dairy', 'Bakery', 'Produce', 'Beans & Teas', 'Packaging', 'Groceries', 'Beverages Raw'];
const PURCHASE_UNITS = ['KG', 'LITRE', 'PACKET', 'BOX', 'DOZEN', 'PIECE'];
const CONSUMPTION_UNITS = ['GRAM', 'ML', 'PIECE'];

export default function InventoryMasterView({ inventoryMaster, onSaveItem, onDeleteItem }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    materialName: '',
    category: 'Dairy',
    unit: 'GRAM',
    purchaseUnit: 'KG',
    consumptionUnit: 'GRAM',
    conversionFactor: 1000,
    openingStock: '',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    purchaseRate: '',
    supplier: '',
    expiryDate: '',
    batchNumber: ''
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      materialName: '',
      category: 'Dairy',
      unit: 'GRAM',
      purchaseUnit: 'KG',
      consumptionUnit: 'GRAM',
      conversionFactor: 1000,
      openingStock: '0',
      currentStock: '0',
      minimumStock: '100',
      maximumStock: '10000',
      purchaseRate: '0',
      supplier: '',
      expiryDate: '',
      batchNumber: `BATCH-${Math.floor(100 + Math.random() * 900)}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      materialName: item.materialName,
      category: item.category,
      unit: item.unit || item.consumptionUnit || 'GRAM',
      purchaseUnit: item.purchaseUnit || 'KG',
      consumptionUnit: item.consumptionUnit || 'GRAM',
      conversionFactor: item.conversionFactor || 1000,
      openingStock: item.openingStock || 0,
      currentStock: item.currentStock || 0,
      minimumStock: item.minimumStock || 0,
      maximumStock: item.maximumStock || 0,
      purchaseRate: item.purchaseRate || 0,
      supplier: item.supplier || '',
      expiryDate: item.expiryDate || '',
      batchNumber: item.batchNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.materialName.trim()) return;

    const currentQty = Number(formData.currentStock) || 0;
    const minQty = Number(formData.minimumStock) || 0;

    let status = 'IN STOCK';
    if (currentQty <= 0) status = 'OUT OF STOCK';
    else if (currentQty <= minQty) status = 'LOW STOCK';

    const itemToSave = {
      id: editingItem ? editingItem.id : `ing-${Date.now()}`,
      materialName: formData.materialName.trim(),
      category: formData.category,
      unit: formData.consumptionUnit,
      purchaseUnit: formData.purchaseUnit,
      consumptionUnit: formData.consumptionUnit,
      conversionFactor: Number(formData.conversionFactor) || 1,
      openingStock: Number(formData.openingStock) || 0,
      currentStock: currentQty,
      minimumStock: minQty,
      maximumStock: Number(formData.maximumStock) || 0,
      purchaseRate: Number(formData.purchaseRate) || 0,
      supplier: formData.supplier.trim(),
      expiryDate: formData.expiryDate || 'N/A',
      batchNumber: formData.batchNumber || 'N/A',
      status: status
    };

    onSaveItem(itemToSave);
    setIsModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return inventoryMaster.filter(item => {
      const matchesSearch = item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.batchNumber && item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [inventoryMaster, searchQuery, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6">
      
      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw material, category, batch #..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700"
          >
            <option value="ALL">All Status</option>
            <option value="IN STOCK">In Stock</option>
            <option value="LOW STOCK">Low Stock Alerts</option>
            <option value="OUT OF STOCK">Out of Stock</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </button>
        </div>

      </div>

      {/* Inventory Master Table */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          Raw Materials & Packaging Inventory Master
        </h3>

        {filteredItems.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No inventory items found.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Material / Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Purchase Unit</th>
                <th className="py-3.5 px-4 text-center">Consumption Unit</th>
                <th className="py-3.5 px-4 text-right">Purchase Rate</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Min Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Batch / Expiry</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-700">
              {filteredItems.map(item => {
                const isOut = item.currentStock <= 0;
                const isLow = item.currentStock > 0 && item.currentStock <= item.minimumStock;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {item.materialName}
                      {item.supplier && <span className="block text-[11px] font-normal text-stone-400">Supplier: {item.supplier}</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 border border-stone-200">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-stone-600">
                      {item.purchaseUnit}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-stone-600">
                      {item.consumptionUnit}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      ₹{item.purchaseRate} / {item.purchaseUnit}
                    </td>

                    <td className="py-3.5 px-4 text-center font-extrabold text-base text-stone-900">
                      {item.currentStock} <span className="text-xs font-normal text-stone-500">{item.consumptionUnit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-stone-500">
                      {item.minimumStock} {item.consumptionUnit}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isOut ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Out of Stock</span>
                      ) : isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Low Stock Alert</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">In Stock</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-stone-500">
                      <span className="block font-mono text-[11px] font-bold text-stone-700">{item.batchNumber}</span>
                      <span>Exp: {item.expiryDate}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center space-x-1">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden">
            <div className="bg-stone-950 text-amber-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold font-serif-title text-base">{editingItem ? 'Edit Inventory Item' : 'Add Inventory Master Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Raw Material / Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  placeholder="e.g. Mozzarella Cheese, Pizza Box"
                  className="w-full px-3.5 py-2 border rounded-xl text-sm bg-stone-50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-semibold bg-stone-50"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>
              </div>

              {/* Units & Conversion */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 space-y-3">
                <span className="text-xs font-bold text-amber-900 uppercase block">Unit Conversion Setup</span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Purchase Unit</label>
                    <select
                      value={formData.purchaseUnit}
                      onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      {PURCHASE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Consumption Unit</label>
                    <select
                      value={formData.consumptionUnit}
                      onChange={(e) => setFormData({ ...formData, consumptionUnit: e.target.value })}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      {CONSUMPTION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Conversion Factor</label>
                    <input
                      type="number"
                      value={formData.conversionFactor}
                      onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                      placeholder="1000"
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white font-bold"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Example: 1 {formData.purchaseUnit} = {formData.conversionFactor} {formData.consumptionUnit}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Purchase Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                    placeholder="450"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Current Stock ({formData.consumptionUnit}) *</label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    placeholder="6500"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Min Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    placeholder="2000"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Max Stock Target</label>
                  <input
                    type="number"
                    value={formData.maximumStock}
                    onChange={(e) => setFormData({ ...formData, maximumStock: e.target.value })}
                    placeholder="20000"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-stone-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm bg-amber-600 text-white font-bold rounded-xl shadow">Save Master Item</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
