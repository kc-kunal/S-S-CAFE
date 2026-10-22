import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle2, XCircle, Plus, Edit2, Trash2, Search, Filter, TrendingDown, Layers, PackageCheck } from 'lucide-react';

const CATEGORIES = ['Dairy', 'Beans & Teas', 'Produce', 'Bakery', 'Packaging', 'Groceries', 'Beverages', 'Spices & Sauces', 'Frozen'];
const UNITS = ['Kg', 'Gram', 'Liters', 'ml', 'Piece', 'Slice', 'Portion', 'Packets', 'Bags', 'Boxes', 'Packs', 'Units'];

// Smart rate formatter: shows both bulk standard rate (Kg/L) and base unit rate (gm/ml) so owner never gets confused
export const formatStockRate = (item) => {
  const cost = Number(item?.unitCost) || 0;
  const unit = (item?.unit || '').trim().toLowerCase();

  if (unit === 'gram' || unit === 'gm' || unit === 'g') {
    const perKg = cost * 1000;
    const formattedKg = perKg >= 1 ? Math.round(perKg).toLocaleString() : perKg.toFixed(1);
    return {
      primary: `₹${formattedKg}/Kg`,
      secondary: `(₹${cost >= 0.01 ? cost.toFixed(2) : cost}/gm)`,
      factor: 1000,
      bulkUnit: 'Kg'
    };
  }

  if (unit === 'ml' || unit === 'milliliter') {
    const perLiter = cost * 1000;
    const formattedLiter = perLiter >= 1 ? Math.round(perLiter).toLocaleString() : perLiter.toFixed(1);
    return {
      primary: `₹${formattedLiter}/L`,
      secondary: `(₹${cost >= 0.01 ? cost.toFixed(2) : cost}/ml)`,
      factor: 1000,
      bulkUnit: 'Liter'
    };
  }

  return {
    primary: `₹${cost.toLocaleString()}/${item?.unit || 'unit'}`,
    secondary: null,
    factor: 1,
    bulkUnit: item?.unit || 'unit'
  };
};

// Smart quantity formatter: displays both base count and bulk measure (e.g. 3,000 gm (3.0 Kg))
export const formatStockQuantity = (item) => {
  const stock = Number(item?.currentStock) || 0;
  const unit = (item?.unit || '').trim().toLowerCase();

  if ((unit === 'gram' || unit === 'gm' || unit === 'g') && stock >= 1000) {
    const inKg = (stock / 1000).toFixed(stock % 1000 === 0 ? 0 : 2);
    return {
      primary: `${stock.toLocaleString()} gm`,
      secondary: `(${inKg} Kg)`
    };
  }

  if ((unit === 'ml' || unit === 'milliliter') && stock >= 1000) {
    const inL = (stock / 1000).toFixed(stock % 1000 === 0 ? 0 : 2);
    return {
      primary: `${stock.toLocaleString()} ml`,
      secondary: `(${inL} L)`
    };
  }

  return {
    primary: `${stock.toLocaleString()} ${item?.unit || ''}`,
    secondary: null
  };
};

export default function InventoryTracker({ inventoryItems, menuItems = [], onSaveItem, onDeleteItem, onAdjustStock, onNavigateToProcurement }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    materialName: '',
    category: 'Groceries',
    unit: 'Kg',
    reorderLevel: '5',
    packagingChannel: 'online', // 'online' | 'dinein' | 'both'
    linkedItemIds: []
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      materialName: '',
      category: 'Groceries',
      unit: 'Kg',
      reorderLevel: '5',
      packagingChannel: 'online',
      linkedItemIds: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      materialName: item.materialName || '',
      category: item.category || 'Groceries',
      unit: item.unit || 'Kg',
      reorderLevel: item.reorderLevel !== undefined ? String(item.reorderLevel) : '5',
      packagingChannel: item.packagingChannel || (item.category === 'Packaging' ? 'online' : 'both'),
      linkedItemIds: Array.isArray(item.linkedItemIds) ? item.linkedItemIds : []
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
      // Naya item 0 quantity me save hoga; editing item me existing stock preserve hoga
      currentStock: editingItem ? (Number(editingItem.currentStock) || 0) : 0,
      unit: formData.unit,
      reorderLevel: Number(formData.reorderLevel) || 0,
      unitCost: editingItem ? (Number(editingItem.unitCost) || 0) : 0,
      packagingChannel: formData.category === 'Packaging' ? formData.packagingChannel : undefined,
      linkedItemIds: formData.category === 'Packaging' ? formData.linkedItemIds : undefined,
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
      const mat = String(item?.materialName || '').toLowerCase();
      const cat = String(item?.category || '').toLowerCase();
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = mat.includes(q) || cat.includes(q);
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
    <div className="space-y-3.5">
      
      {/* 4-KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Total Items */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all text-left cursor-pointer group shadow-xs ${
            statusFilter === 'ALL'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Total Materials
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-stone-900">{totalItems}</h3>
            <span className="text-[11px] font-semibold text-stone-400">items</span>
          </div>
        </button>

        {/* Total Stock Valuation */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Stock Valuation (Godam Ka Maal)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <h3 className="text-xl sm:text-2xl font-black text-amber-900">₹{Math.round(totalValuation).toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-stone-400">asset</span>
          </div>
          <p className="text-[9px] text-stone-400 font-medium mt-0.5 leading-tight">
            Dukan / Fridge me pade raw material ki khareed keemat (Stock × Rate)
          </p>
        </div>

        {/* Low Stock Alerts */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all text-left cursor-pointer group shadow-xs ${
            statusFilter === 'LOW'
              ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/20'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Low Alerts
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              lowStockCount > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-stone-100 text-stone-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h3 className={`text-xl sm:text-2xl font-black ${lowStockCount > 0 ? 'text-amber-700' : 'text-stone-900'}`}>
              {lowStockCount}
            </h3>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                Reorder
              </span>
            )}
          </div>
        </button>

        {/* Out of Stock */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all text-left cursor-pointer group shadow-xs ${
            statusFilter === 'OUT'
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/20'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              Out of Stock
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              outOfStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-400'
            }`}>
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h3 className={`text-xl sm:text-2xl font-black ${outOfStockCount > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
              {outOfStockCount}
            </h3>
            {outOfStockCount > 0 && (
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md">
                Urgent
              </span>
            )}
          </div>
        </button>

      </div>

      {/* Control Bar: Search & Action Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          
          {/* Search Box */}
          <div className="w-full lg:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search raw materials..."
              className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option value="ALL">All Stock Status</option>
              <option value="OK">In Stock Only</option>
              <option value="LOW">Low Stock Alerts</option>
              <option value="OUT">Out of Stock</option>
            </select>

            {/* Log Purchase Button */}
            {onNavigateToProcurement && (
              <button
                type="button"
                onClick={onNavigateToProcurement}
                className="w-full sm:w-auto px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700 active:scale-95"
                title="Khareeda hua maal log karein aur stock badhayein"
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Log Purchase</span>
              </button>
            )}



            {/* Add Raw Material Button */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Raw Material</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Stock List Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs">
        
        {/* Table/List Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-extrabold text-stone-900">Inventory Stock Levels</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              {filteredItems.length} items
            </span>
            <span className="text-[11px] text-stone-400 hidden lg:inline">
              • Purchases tab me add kiya maal auto-stock update karta hai
            </span>
          </div>

          {onNavigateToProcurement && (
            <button
              type="button"
              onClick={onNavigateToProcurement}
              className="text-xs text-amber-700 hover:text-amber-800 font-bold underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>View Purchase Bills →</span>
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-2">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-stone-700">No inventory materials found</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Try clearing filters or search term, or click "+ Add Raw Material" above.</p>

          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/90 text-stone-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-stone-200">
                    <th className="py-2.5 px-3.5">Material</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Current Stock</th>
                    <th className="py-2.5 px-3 text-center">Alert Level</th>
                    <th className="py-2.5 px-3 text-right">Khareed Rate</th>
                    <th className="py-2.5 px-3 text-right">Stock Value (Godam)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Quick Adjust</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredItems.map(item => {
                    const stockVal = item.currentStock * (item.unitCost || 0);
                    const isOut = item.currentStock <= 0;
                    const isLow = item.currentStock > 0 && item.currentStock <= item.reorderLevel;
                    const rateMeta = formatStockRate(item);
                    const qtyMeta = formatStockQuantity(item);

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                        
                        {/* Material Name */}
                        <td className="py-2.5 px-3.5 font-bold text-stone-900">
                          {item.materialName}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            {item.category}
                          </span>
                        </td>
                        
                        {/* Current Stock */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-black text-sm ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-900'
                            }`}>
                              {qtyMeta.primary}
                            </span>
                            {qtyMeta.secondary && (
                              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-md mt-0.5">
                                {qtyMeta.secondary}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reorder Threshold */}
                        <td className="py-2.5 px-3 text-center text-stone-500 font-semibold text-xs">
                          {item.reorderLevel} {item.unit}
                        </td>

                        {/* Khareed Rate (Unit Cost) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold text-xs text-stone-900">
                              {rateMeta.primary}
                            </span>
                            {rateMeta.secondary && (
                              <span className="text-[10px] font-semibold text-stone-400">
                                {rateMeta.secondary}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Stock Value */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-xs text-amber-900">
                              ₹{Math.round(stockVal).toLocaleString()}
                            </span>
                            <span className="text-[9px] text-stone-400 font-medium">
                              (Stock × Rate)
                            </span>
                          </div>
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-2.5 px-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              <span>Out of Stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              <span>In Stock</span>
                            </span>
                          )}
                        </td>

                        {/* Quick Adjust Buttons */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95 transition-all"
                              title="Decrease (-1)"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95 transition-all"
                              title="Increase (+1)"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => onAdjustStock(item.id, 5)}
                              className="px-1.5 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[10px] border border-stone-300 cursor-pointer active:scale-95 transition-all"
                              title="Add +5"
                            >
                              +5
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                              title="Edit Material"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Delete Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredItems.map(item => {
                const stockVal = item.currentStock * (item.unitCost || 0);
                const isOut = item.currentStock <= 0;
                const isLow = item.currentStock > 0 && item.currentStock <= item.reorderLevel;
                const rateMeta = formatStockRate(item);
                const qtyMeta = formatStockQuantity(item);

                return (
                  <div key={item.id} className="p-3 bg-stone-50/70 border border-stone-200 rounded-xl space-y-2 shadow-2xs">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-stone-900 text-xs truncate">{item.materialName}</h4>
                        <span className="text-[10px] font-semibold text-stone-600 bg-white px-2 py-0.2 rounded-md border border-stone-200 shrink-0">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Details 3-Box Strip */}
                    <div className="grid grid-cols-3 gap-1.5 bg-white p-2 rounded-xl border border-stone-200/80 text-center">
                      <div>
                        <span className="text-[9px] text-stone-400 font-extrabold block uppercase">Current Stock</span>
                        <span className={`text-xs font-black block ${isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-900'}`}>
                          {qtyMeta.primary}
                        </span>
                        {qtyMeta.secondary && (
                          <span className="text-[9px] font-bold text-stone-500 block">{qtyMeta.secondary}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 font-extrabold block uppercase">Khareed Rate</span>
                        <span className="text-xs font-bold text-stone-800 block">{rateMeta.primary}</span>
                        {rateMeta.secondary && (
                          <span className="text-[9px] text-stone-400 block">{rateMeta.secondary}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 font-extrabold block uppercase">Stock Value</span>
                        <span className="text-xs font-black text-amber-900 block">₹{Math.round(stockVal).toLocaleString()}</span>
                        <span className="text-[9px] text-stone-400 block">In Godown</span>
                      </div>
                    </div>

                    {/* Status & Quick Adjust Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-200/60">
                      <div>
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                            🚫 Out
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            ⚡ Low ({item.reorderLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ In Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95 text-xs"
                          title="-1"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center border border-stone-300 cursor-pointer active:scale-95 text-xs"
                          title="+1"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, 5)}
                          className="px-1.5 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[10px] border border-stone-300 cursor-pointer active:scale-95"
                          title="+5"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-stone-950 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-amber-300">
                  {editingItem ? 'Edit Raw Material' : 'Add Raw Material'}
                </h3>
                <p className="text-[10px] text-stone-400">Inventory & Recipe tracking stock unit</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-stone-400 hover:text-white text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={formData.materialName}
                  onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                  placeholder="e.g. Whole Milk, Coffee Beans, Burger Buns"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Stock Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2.5 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <p className="text-[10px] text-stone-400 mt-0.5">Ye unit Purchase tab me automatically aayegi.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Low Stock Alert Level *</label>
                  <input
                    type="number"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">Stock isse kam hone par alert aayega.</p>
                </div>
              </div>

              {/* Zero Quantity Notice Banner */}
              {!editingItem && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                  <span className="text-base">ℹ️</span>
                  <span>Naya item <strong>0 quantity</strong> se save hoga. Iska actual stock aur khareed rate <strong>Purchase tab</strong> se add hoga.</span>
                </div>
              )}

              {/* If editing item, show current stock indicator */}
              {editingItem && (
                <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between text-xs text-stone-700">
                  <span>Current Stock: <strong>{editingItem.currentStock} {editingItem.unit}</strong></span>
                  <span className="text-[10px] text-stone-500">Stock update Purchase tab ya Stock adjustment se karein</span>
                </div>
              )}

              {/* 📦 SMART PACKAGING MAPPING & AUTO-DEDUCTION RULES (Shown when category === 'Packaging') */}
              {formData.category === 'Packaging' && (
                <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                        Smart Packaging Rule & Auto-Deduction
                      </h4>
                      <p className="text-[10px] text-amber-800">
                        Set karein ki ye dabba ya plate kab aur kis item ke sath auto-deduct hoga
                      </p>
                    </div>
                  </div>

                  {/* 1. Channel Selector */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1.5">
                      Yeh Packaging Kab Lagti Hai? *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, packagingChannel: 'online' })}
                        className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                          formData.packagingChannel === 'online'
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        📦 Zomato / Swiggy (Parcel Only)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, packagingChannel: 'dinein' })}
                        className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                          formData.packagingChannel === 'dinein'
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        🍽️ Dine-In (Counter Plate)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, packagingChannel: 'both' })}
                        className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition-all text-center cursor-pointer ${
                          formData.packagingChannel === 'both'
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        🔄 Dono Me (Glass / Cup)
                      </button>
                    </div>
                  </div>

                  {/* 2. Menu Items Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-extrabold text-stone-700 uppercase">
                        Kin Items Ke Sath Jayega? ({formData.linkedItemIds.length} Selected)
                      </label>
                      {menuItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.linkedItemIds.length === menuItems.length) {
                              setFormData({ ...formData, linkedItemIds: [] });
                            } else {
                              setFormData({ ...formData, linkedItemIds: menuItems.map(m => m.id) });
                            }
                          }}
                          className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                        >
                          {formData.linkedItemIds.length === menuItems.length ? 'Deselect All' : 'Select All Items'}
                        </button>
                      )}
                    </div>

                    <div className="bg-white border border-stone-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
                      {menuItems.length === 0 ? (
                        <p className="text-[11px] text-stone-400 text-center py-2">Menu me koi items nahi hain.</p>
                      ) : (
                        menuItems.map(item => {
                          const isSelected = formData.linkedItemIds.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-100/70 text-stone-950 font-bold' : 'hover:bg-stone-50 text-stone-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        linkedItemIds: [...formData.linkedItemIds, item.id]
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        linkedItemIds: formData.linkedItemIds.filter(id => id !== item.id)
                                      });
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>{item.name}</span>
                              </div>
                              <span className="text-[10px] text-stone-400 font-medium">({item.category})</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">
                      💡 Jaise: 7 inch pizza tick karoge toh order aane par ye dabba/plate automatic deduct hoga!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-3.5 py-1.5 text-xs text-stone-600 font-bold hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-all"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
