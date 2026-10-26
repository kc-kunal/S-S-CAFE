import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle2, XCircle, Plus, Edit2, Trash2, Search, Filter, TrendingDown, Layers, PackageCheck, UtensilsCrossed } from 'lucide-react';

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
  const absStock = Math.abs(stock);

  if ((unit === 'gram' || unit === 'gm' || unit === 'g') && absStock >= 1000) {
    const inKg = (stock / 1000).toFixed(absStock % 1000 === 0 ? 0 : 2);
    return {
      primary: `${stock.toLocaleString()} gm`,
      secondary: `(${inKg} Kg)`
    };
  }

  if ((unit === 'ml' || unit === 'milliliter') && absStock >= 1000) {
    const inL = (stock / 1000).toFixed(absStock % 1000 === 0 ? 0 : 2);
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
    linkedItemIds: [],
    recipeQuantity: '1',
    recipeUnit: 'Piece'
  });

  // Packaging & Recipe selection search & category filter inside modal
  const [packagingSearch, setPackagingSearch] = useState('');
  const [packagingCategory, setPackagingCategory] = useState('ALL');

  // Extract unique categories from menu items for packaging & recipe linking filter
  const menuCategories = useMemo(() => {
    const cats = new Set();
    menuItems.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [menuItems]);

  // Filtered menu items for packaging & recipe linking
  const filteredPackagingMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const q = packagingSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        (item.name || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      const matchesCat = packagingCategory === 'ALL' || item.category === packagingCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, packagingSearch, packagingCategory]);

  const handleOpenAdd = (initialCategory = 'Groceries') => {
    setEditingItem(null);
    const cat = typeof initialCategory === 'string' && initialCategory ? initialCategory : 'Groceries';
    const initUnit = cat === 'Packaging' ? 'Piece' : 'Kg';
    const defaultRecipeUnit = (initUnit === 'Kg') ? 'Gram' : (initUnit === 'Liters' ? 'ml' : initUnit);
    const defaultRecipeQty = (initUnit === 'Kg') ? '25' : (initUnit === 'Liters' ? '100' : '1');
    setFormData({
      materialName: '',
      category: cat,
      unit: initUnit,
      reorderLevel: cat === 'Packaging' ? '20' : '5',
      packagingChannel: 'online',
      linkedItemIds: [],
      recipeQuantity: defaultRecipeQty,
      recipeUnit: defaultRecipeUnit
    });
    setPackagingSearch('');
    setPackagingCategory('ALL');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    const isPack = item.category === 'Packaging';

    // For non-packaging: find which menu items already use this raw material in their recipe
    let linkedIds = [];
    let defaultRecipeQty = '1';
    let defaultRecipeUnit = item.unit || 'Piece';

    if (isPack) {
      linkedIds = Array.isArray(item.linkedItemIds) ? item.linkedItemIds : [];
    } else {
      const targetId = String(item.id || '').toLowerCase();
      const targetName = String(item.materialName || '').toLowerCase().trim();

      menuItems.forEach(m => {
        if (Array.isArray(m.recipe)) {
          const matchedRec = m.recipe.find(r => 
            (r.ingredientId && String(r.ingredientId).toLowerCase() === targetId) ||
            (r.name && String(r.name).toLowerCase().trim() === targetName)
          );
          if (matchedRec) {
            linkedIds.push(m.id);
            if (matchedRec.quantity) defaultRecipeQty = String(matchedRec.quantity);
            if (matchedRec.unit) defaultRecipeUnit = matchedRec.unit;
          }
        }
      });
    }

    setFormData({
      materialName: item.materialName || '',
      category: item.category || 'Groceries',
      unit: item.unit || (isPack ? 'Piece' : 'Kg'),
      reorderLevel: item.reorderLevel !== undefined ? String(item.reorderLevel) : '5',
      packagingChannel: item.packagingChannel || (isPack ? 'online' : 'both'),
      linkedItemIds: linkedIds,
      recipeQuantity: defaultRecipeQty,
      recipeUnit: defaultRecipeUnit
    });
    setPackagingSearch('');
    setPackagingCategory('ALL');
    setIsModalOpen(true);
  };

  const handleCategoryChange = (newCat) => {
    setFormData(prev => {
      const isSwitchingToPack = newCat === 'Packaging';
      const newUnit = isSwitchingToPack && (prev.unit === 'Kg' || prev.unit === 'Gram' || prev.unit === 'Liters' || prev.unit === 'ml')
        ? 'Piece'
        : prev.unit;
      return {
        ...prev,
        category: newCat,
        unit: newUnit,
        reorderLevel: isSwitchingToPack && prev.reorderLevel === '5' ? '20' : prev.reorderLevel,
        packagingChannel: prev.packagingChannel || 'online',
        linkedItemIds: Array.isArray(prev.linkedItemIds) ? prev.linkedItemIds : [],
        recipeQuantity: prev.recipeQuantity || '1',
        recipeUnit: prev.recipeUnit || newUnit || 'Piece'
      };
    });
  };

  const handleUnitChange = (newUnit) => {
    setFormData(prev => ({
      ...prev,
      unit: newUnit,
      recipeUnit: (newUnit === 'Kg') ? 'Gram' : (newUnit === 'Liters' ? 'ml' : newUnit),
      recipeQuantity: (newUnit === 'Kg') ? '25' : (newUnit === 'Liters' ? '100' : (prev.recipeQuantity || '1'))
    }));
  };

  const toggleLinkedItem = (itemId) => {
    const current = Array.isArray(formData.linkedItemIds) ? formData.linkedItemIds : [];
    if (current.includes(itemId)) {
      setFormData({
        ...formData,
        linkedItemIds: current.filter(id => id !== itemId)
      });
    } else {
      setFormData({
        ...formData,
        linkedItemIds: [...current, itemId]
      });
    }
  };

  const handleSelectAllFiltered = () => {
    const current = new Set(Array.isArray(formData.linkedItemIds) ? formData.linkedItemIds : []);
    const allFilteredSelected = filteredPackagingMenuItems.length > 0 && 
      filteredPackagingMenuItems.every(item => current.has(item.id));

    if (allFilteredSelected) {
      const filteredIds = new Set(filteredPackagingMenuItems.map(m => m.id));
      setFormData({
        ...formData,
        linkedItemIds: (Array.isArray(formData.linkedItemIds) ? formData.linkedItemIds : []).filter(id => !filteredIds.has(id))
      });
    } else {
      filteredPackagingMenuItems.forEach(item => current.add(item.id));
      setFormData({
        ...formData,
        linkedItemIds: Array.from(current)
      });
    }
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
      linkedItemIds: formData.category === 'Packaging' ? (Array.isArray(formData.linkedItemIds) ? formData.linkedItemIds : []) : undefined,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const recipeLinkInfo = formData.category !== 'Packaging' ? {
      itemIds: Array.isArray(formData.linkedItemIds) ? formData.linkedItemIds : [],
      quantity: Number(formData.recipeQuantity) || 1,
      unit: formData.recipeUnit || formData.unit || 'Piece',
      syncUnchecked: Boolean(editingItem)
    } : null;

    onSaveItem(itemToSave, recipeLinkInfo);
    setIsModalOpen(false);
  };

  // Derived Statistics
  const totalItems = inventoryItems.length;
  const totalValuation = inventoryItems.reduce((sum, item) => sum + (Math.max(0, item.currentStock) * (item.unitCost || 0)), 0);
  const lowStockCount = inventoryItems.filter(item => item.currentStock > 0 && item.currentStock <= item.reorderLevel).length;
  const outOfStockCount = inventoryItems.filter(item => item.currentStock === 0).length;
  const deficitStockCount = inventoryItems.filter(item => item.currentStock < 0).length;

  // Filtering & Sorting (Recent items appear at the top)
  const filteredItems = useMemo(() => {
    const list = inventoryItems.filter(item => {
      const mat = String(item?.materialName || '').toLowerCase();
      const cat = String(item?.category || '').toLowerCase();
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = mat.includes(q) || cat.includes(q);
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'LOW') {
        matchesStatus = item.currentStock > 0 && item.currentStock <= item.reorderLevel;
      } else if (statusFilter === 'OUT') {
        matchesStatus = item.currentStock === 0;
      } else if (statusFilter === 'DEFICIT') {
        matchesStatus = item.currentStock < 0;
      } else if (statusFilter === 'OK') {
        matchesStatus = item.currentStock > item.reorderLevel;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });

    return list.sort((a, b) => {
      // 1. Compare lastUpdated / updatedAt / createdAt (ISO date/time)
      const timeA = new Date(a.updatedAt || a.lastUpdated || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.lastUpdated || b.createdAt || 0).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB && timeA > 0 && timeB > 0) {
        return timeB - timeA;
      }

      // 2. Numeric timestamp extracted from id (e.g. inv-1740...)
      const numA = Number(String(a.id || '').replace(/\D/g, '')) || 0;
      const numB = Number(String(b.id || '').replace(/\D/g, '')) || 0;
      if (numA !== numB) {
        return numB - numA;
      }

      return String(b.id || '').localeCompare(String(a.id || ''));
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

        {/* Out of Stock & Deficit */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'OUT' || statusFilter === 'DEFICIT' ? 'ALL' : deficitStockCount > 0 ? 'DEFICIT' : 'OUT')}
          className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all text-left cursor-pointer group shadow-xs ${
            statusFilter === 'OUT' || statusFilter === 'DEFICIT'
              ? 'border-purple-500 ring-2 ring-purple-500/10 bg-purple-50/20'
              : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              {deficitStockCount > 0 ? 'Out / Negative Deficit' : 'Out of Stock'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              deficitStockCount > 0 ? 'bg-purple-100 text-purple-700' : outOfStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-400'
            }`}>
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h3 className={`text-xl sm:text-2xl font-black ${deficitStockCount > 0 ? 'text-purple-700' : outOfStockCount > 0 ? 'text-rose-700' : 'text-stone-900'}`}>
              {deficitStockCount > 0 ? `${outOfStockCount + deficitStockCount}` : outOfStockCount}
            </h3>
            {deficitStockCount > 0 ? (
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                {deficitStockCount} Deficit (-)
              </span>
            ) : outOfStockCount > 0 ? (
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md">
                Urgent
              </span>
            ) : null}
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
              <option value="OUT">Out of Stock (0)</option>
              {deficitStockCount > 0 && (
                <option value="DEFICIT">⚠️ Negative Deficit ({deficitStockCount})</option>
              )}
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



            {/* Quick Add Packaging Button */}
            <button
              type="button"
              onClick={() => handleOpenAdd('Packaging')}
              className="w-full sm:w-auto px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Add Packaging Material (Box, Plate, Cup, Bag)"
            >
              <Package className="w-4 h-4 text-amber-700" />
              <span>+ Add Packaging</span>
            </button>

            {/* Add Raw Material Button */}
            <button
              type="button"
              onClick={() => handleOpenAdd('Groceries')}
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
                    const stockVal = Math.max(0, item.currentStock) * (item.unitCost || 0);
                    const isDeficit = item.currentStock < 0;
                    const isOut = item.currentStock === 0;
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
                              isDeficit ? 'text-purple-700' : isOut ? 'text-rose-600' : isLow ? 'text-amber-700' : 'text-stone-900'
                            }`}>
                              {qtyMeta.primary}
                            </span>
                            {isDeficit ? (
                              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 mt-0.5" title="Order punch hone se minus me hai. Nayi kharid par auto adjust hoga.">
                                Deficit (Minus)
                              </span>
                            ) : qtyMeta.secondary && (
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
                          {isDeficit ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs"
                              title="Negative stock: Billing chalu hai, maal khareedne par auto-adjust hoga"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                              <span>⚠️ Minus / Deficit</span>
                            </span>
                          ) : isOut ? (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Modal Header */}
            <div className="shrink-0 bg-stone-950 text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  {formData.category === 'Packaging' ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300">
                    {editingItem
                      ? (formData.category === 'Packaging' ? 'Edit Packaging Material' : 'Edit Raw Material')
                      : (formData.category === 'Packaging' ? 'Add Packaging Material' : 'Add Raw Material')}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {formData.category === 'Packaging'
                      ? 'Box, Plate, Bag ya Glass auto-deduction ke sath set karein'
                      : 'Inventory & Recipe tracking stock unit'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-stone-400 hover:text-white text-base font-bold w-7 h-7 flex items-center justify-center rounded-xl hover:bg-stone-800 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form id="inventory-material-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                
                {/* Material / Packaging Name */}
                <div>
                  <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">
                    {formData.category === 'Packaging' ? 'Packaging Item Name *' : 'Material Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.materialName}
                    onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                    placeholder={
                      formData.category === 'Packaging'
                        ? 'e.g. Pizza Box 7", Paper Plate Medium, Shake Glass, Burger Bag'
                        : 'e.g. Whole Milk, Coffee Beans, Burger Buns, Mozzarella Cheese'
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  {formData.category === 'Packaging' && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                      <span className="text-[10px] text-stone-400 font-medium">Quick Suggestions:</span>
                      {['Pizza Box 7"', 'Burger Box', 'Paper Plate', 'Coffee Cup', 'Shake Glass', 'Parcel Bag'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, materialName: preset }))}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 font-semibold border border-stone-200 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category & Unit in responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-stone-700 uppercase mb-1">Stock Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-full px-2.5 py-2 border border-stone-300 rounded-xl text-xs font-bold bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <p className="text-[10px] text-stone-400 mt-0.5">Ye unit Purchase tab me automatically aayegi.</p>
                  </div>
                </div>

                {/* Low Stock Alert Level */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-extrabold text-stone-700 uppercase">
                      Low Stock Alert Level ({formData.unit}) *
                    </label>
                    <span className="text-[10px] text-stone-400">Stock isse kam hone par alert aayega</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder={formData.category === 'Packaging' ? 'e.g. 20' : 'e.g. 5'}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Zero Quantity Notice Banner */}
                {!editingItem && (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
                    <span className="text-base shrink-0">ℹ️</span>
                    <span className="text-[11px]">Naya item <strong>0 quantity</strong> se save hoga. Iska actual stock aur khareed rate <strong>Purchase tab</strong> se add hoga.</span>
                  </div>
                )}

                {/* If editing item, show current stock indicator */}
                {editingItem && (
                  <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-between text-xs text-stone-700">
                    <span>Current Stock: <strong>{editingItem.currentStock} {editingItem.unit}</strong></span>
                    <span className="text-[10px] text-stone-500">Stock update Purchase tab se karein</span>
                  </div>
                )}

                {/* 📦 SMART PACKAGING SECTION (Active when category === 'Packaging') */}
                {formData.category === 'Packaging' && (
                  <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                    
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
                      <span className="text-lg">📦</span>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Smart Packaging Auto-Deduction Rules
                        </h4>
                        <p className="text-[10px] text-amber-800">
                          Chunein ki ye dabba ya plate kab aur kis menu item ke sath automatic deduct hoga
                        </p>
                      </div>
                    </div>

                    {/* 1. Channel Selector (3 Interactive Cards) */}
                    <div>
                      <label className="block text-[11px] font-black text-stone-800 uppercase mb-1.5">
                        1. Yeh Packaging Kab Lagti Hai? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Option 1: Online / Parcel Only */}
                        <div
                          onClick={() => setFormData({ ...formData, packagingChannel: 'online' })}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                            formData.packagingChannel === 'online'
                              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white/70 border-stone-200 hover:border-amber-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">📦</span>
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              formData.packagingChannel === 'online' ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                            }`}>
                              {formData.packagingChannel === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <h5 className="text-xs font-extrabold text-stone-900 leading-tight">Parcel Only</h5>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">Zomato, Swiggy & Parcel orders</p>
                        </div>

                        {/* Option 2: Dine-In Only */}
                        <div
                          onClick={() => setFormData({ ...formData, packagingChannel: 'dinein' })}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                            formData.packagingChannel === 'dinein'
                              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white/70 border-stone-200 hover:border-amber-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">🍽️</span>
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              formData.packagingChannel === 'dinein' ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                            }`}>
                              {formData.packagingChannel === 'dinein' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <h5 className="text-xs font-extrabold text-stone-900 leading-tight">Dine-In Plate</h5>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">Counter & Table serve plate</p>
                        </div>

                        {/* Option 3: Both Channels */}
                        <div
                          onClick={() => setFormData({ ...formData, packagingChannel: 'both' })}
                          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                            formData.packagingChannel === 'both'
                              ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white/70 border-stone-200 hover:border-amber-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">🔄</span>
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              formData.packagingChannel === 'both' ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                            }`}>
                              {formData.packagingChannel === 'both' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <h5 className="text-xs font-extrabold text-stone-900 leading-tight">Dono Me (Both)</h5>
                          <p className="text-[10px] text-stone-500 leading-tight mt-0.5">Glasses, Cups, Paper Bags</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Menu Items Linking with Filter & Search */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div>
                          <label className="block text-[11px] font-black text-stone-800 uppercase">
                            2. Kin Menu Items Ke Sath Jayega?
                          </label>
                          <span className="text-[10px] font-bold text-amber-900">
                            {(formData.linkedItemIds || []).length} items linked
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {filteredPackagingMenuItems.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSelectAllFiltered}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 cursor-pointer shadow-2xs transition-colors"
                            >
                              {filteredPackagingMenuItems.every(m => (formData.linkedItemIds || []).includes(m.id))
                                ? 'Deselect Shown'
                                : 'Select Shown'}
                            </button>
                          )}
                          {(formData.linkedItemIds || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, linkedItemIds: [] })}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-bold hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search & Category Filter Bar */}
                      <div className="bg-white/80 p-2 rounded-xl border border-stone-200/90 space-y-2 mb-2">
                        {/* Search input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={packagingSearch}
                            onChange={(e) => setPackagingSearch(e.target.value)}
                            placeholder="Menu item search karein (e.g. Pizza, Burger, Cold Coffee)..."
                            className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                          />
                          {packagingSearch && (
                            <button
                              type="button"
                              onClick={() => setPackagingSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Category filter chips */}
                        {menuCategories.length > 0 && (
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                            <button
                              type="button"
                              onClick={() => setPackagingCategory('ALL')}
                              className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                                packagingCategory === 'ALL'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              All ({menuItems.length})
                            </button>
                            {menuCategories.map(cat => {
                              const count = menuItems.filter(m => m.category === cat).length;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setPackagingCategory(cat)}
                                  className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                                    packagingCategory === cat
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                  }`}
                                >
                                  {cat} ({count})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Scrollable Checkbox List */}
                      <div className="bg-white border border-stone-200 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                        {filteredPackagingMenuItems.length === 0 ? (
                          <p className="text-[11px] text-stone-400 text-center py-4">
                            {menuItems.length === 0 ? 'Menu me koi items nahi hain.' : 'Koi matching item nahi mila.'}
                          </p>
                        ) : (
                          filteredPackagingMenuItems.map(item => {
                            const isSelected = (formData.linkedItemIds || []).includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isSelected ? 'bg-amber-100/80 text-stone-950 font-bold border border-amber-200' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleLinkedItem(item.id)}
                                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                                  />
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className="text-[10px] text-stone-400 font-medium">₹{item.price}</span>
                                  <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold">
                                    {item.category}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>

                      {/* Selected Items summary tags if any */}
                      {(formData.linkedItemIds || []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className="text-[9px] font-bold text-stone-500 uppercase">Selected:</span>
                          {(formData.linkedItemIds || []).slice(0, 6).map(id => {
                            const found = menuItems.find(m => m.id === id);
                            if (!found) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-amber-200 text-[10px] font-semibold text-stone-800 shadow-2xs"
                              >
                                <span className="max-w-[100px] truncate">{found.name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleLinkedItem(id)}
                                  className="text-stone-400 hover:text-rose-600 text-[10px] font-black cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                          {(formData.linkedItemIds || []).length > 6 && (
                            <span className="text-[10px] font-bold text-amber-800">
                              +{(formData.linkedItemIds || []).length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-stone-500 mt-1.5 leading-snug">
                        💡 <strong>Smart Rule:</strong> Jaise hi POS ya Online se <em>{formData.materialName || 'yeh packaging item'}</em> se jude item ka order aayega, ye automatically stock se deduct ho jayega!
                      </p>
                    </div>

                  </div>
                )}

                {/* 👨‍🍳 SMART RECIPE AUTO-LINK SECTION (Active when category !== 'Packaging') */}
                {formData.category !== 'Packaging' && (
                  <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                    
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
                      <span className="text-lg">👨‍🍳</span>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                          Smart Recipe Auto-Link (Menu Items ki Recipe me Add Karein)
                        </h4>
                        <p className="text-[10px] text-amber-800">
                          Chunein ki yeh raw material kin-kin menu items me use hoga (jaise Pizza Base sabhi Pizzas me, Bun sabhi Burgers me)
                        </p>
                      </div>
                    </div>

                    {/* 1. Per Item Quantity & Unit */}
                    <div className="bg-white/90 p-3 rounded-xl border border-amber-200/90 space-y-1.5">
                      <label className="block text-[11px] font-black text-stone-800 uppercase">
                        1. 1 Order Me Kitna Lagega? (Recipe Portion) *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Quantity (Matra):</span>
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            value={formData.recipeQuantity}
                            onChange={(e) => setFormData({ ...formData, recipeQuantity: e.target.value })}
                            placeholder="e.g. 1 ya 25"
                            className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Recipe Unit (Ikai):</span>
                          <select
                            value={formData.recipeUnit}
                            onChange={(e) => setFormData({ ...formData, recipeUnit: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        💡 {formData.materialName ? `"${formData.materialName}"` : 'Yeh maal'} 1 order par <strong>{formData.recipeQuantity || 1} {formData.recipeUnit || formData.unit}</strong> deduct hoga.
                      </p>
                    </div>

                    {/* 2. Menu Items Linking with Filter & Search */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div>
                          <label className="block text-[11px] font-black text-stone-800 uppercase">
                            2. Kin Menu Items Ki Recipe Me Judega?
                          </label>
                          <span className="text-[10px] font-bold text-amber-900">
                            {(formData.linkedItemIds || []).length} items selected
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {filteredPackagingMenuItems.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSelectAllFiltered}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 cursor-pointer shadow-2xs transition-colors"
                            >
                              {filteredPackagingMenuItems.every(m => (formData.linkedItemIds || []).includes(m.id))
                                ? 'Deselect Shown'
                                : 'Select Shown'}
                            </button>
                          )}
                          {(formData.linkedItemIds || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, linkedItemIds: [] })}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-bold hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Search & Category Filter Bar */}
                      <div className="bg-white/80 p-2 rounded-xl border border-stone-200/90 space-y-2 mb-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input
                            type="text"
                            value={packagingSearch}
                            onChange={(e) => setPackagingSearch(e.target.value)}
                            placeholder="Menu item search karein (e.g. Pizza, Burger, Pasta, Sandwich)..."
                            className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                          />
                          {packagingSearch && (
                            <button
                              type="button"
                              onClick={() => setPackagingSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {menuCategories.length > 0 && (
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                            <button
                              type="button"
                              onClick={() => setPackagingCategory('ALL')}
                              className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                                packagingCategory === 'ALL'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              All ({menuItems.length})
                            </button>
                            {menuCategories.map(cat => {
                              const count = menuItems.filter(m => m.category === cat).length;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setPackagingCategory(cat)}
                                  className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                                    packagingCategory === cat
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                  }`}
                                >
                                  {cat} ({count})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Scrollable Checkbox List */}
                      <div className="bg-white border border-stone-200 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1">
                        {filteredPackagingMenuItems.length === 0 ? (
                          <p className="text-[11px] text-stone-400 text-center py-4">
                            {menuItems.length === 0 ? 'Menu me koi items nahi hain.' : 'Koi matching item nahi mila.'}
                          </p>
                        ) : (
                          filteredPackagingMenuItems.map(item => {
                            const isSelected = (formData.linkedItemIds || []).includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                  isSelected ? 'bg-amber-100/80 text-stone-950 font-bold border border-amber-200' : 'hover:bg-stone-50 text-stone-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleLinkedItem(item.id)}
                                    className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                                  />
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className="text-[10px] text-stone-400 font-medium">₹{item.price}</span>
                                  <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-semibold">
                                    {item.category}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>

                      {/* Selected Items summary tags */}
                      {(formData.linkedItemIds || []).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className="text-[9px] font-bold text-stone-500 uppercase">Selected:</span>
                          {(formData.linkedItemIds || []).slice(0, 6).map(id => {
                            const found = menuItems.find(m => m.id === id);
                            if (!found) return null;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-amber-200 text-[10px] font-semibold text-stone-800 shadow-2xs"
                              >
                                <span className="max-w-[100px] truncate">{found.name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleLinkedItem(id)}
                                  className="text-stone-400 hover:text-rose-600 text-[10px] font-black cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                          {(formData.linkedItemIds || []).length > 6 && (
                            <span className="text-[10px] font-bold text-amber-800">
                              +{(formData.linkedItemIds || []).length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-[10px] text-stone-500 mt-1.5 leading-snug">
                        💡 <strong>Auto Recipe Link:</strong> Save karte hi in selected menu items ki recipe me <em>{formData.materialName || 'yeh raw material'}</em> jud jayega aur POS sale hone par auto-stock minus hoga!
                      </p>
                    </div>

                  </div>
                )}

              </div>

              {/* Sticky Footer with Save & Cancel Buttons (Never Hidden!) */}
              <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-xs text-stone-600 font-bold hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black rounded-xl shadow-md shadow-amber-600/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>{editingItem ? 'Update Material' : 'Save Material'}</span>
                  <span>✓</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
