import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, PackageCheck, Trash2, Tag, Truck, Calculator, Sparkles, Check, Search, TrendingUp, IndianRupee, Layers, AlertCircle } from 'lucide-react';
import { KNOWN_MATERIAL_ALIASES, INITIAL_INVENTORY_ITEMS, findMatchingInventoryItem, convertQuantity } from '../utils/storage';

const CATEGORIES = ['Dairy', 'Bakery', 'Groceries', 'Beans & Teas', 'Frozen', 'Dry', 'Packaging'];
const UNITS = ['Kg', 'Gram', 'Liters', 'ml', 'Piece', 'Packet', 'Box'];

// Popular cafe raw materials for 1-click quick selection
const QUICK_MATERIALS = [
  { name: 'Pizza Base', icon: '🍕', category: 'Bakery', unit: 'Piece', defaultRate: 15 },
  { name: 'Mozzarella Cheese', icon: '🧀', category: 'Dairy', unit: 'Kg', defaultRate: 450 },
  { name: 'Pizza Sauce', icon: '🥫', category: 'Groceries', unit: 'Kg', defaultRate: 200 },
  { name: 'Burger Buns', icon: '🍔', category: 'Bakery', unit: 'Piece', defaultRate: 8 },
  { name: 'Veg Aloo Patty', icon: '🥔', category: 'Groceries', unit: 'Piece', defaultRate: 10 },
  { name: 'Mayonnaise', icon: '🥣', category: 'Groceries', unit: 'Kg', defaultRate: 180 },
  { name: 'Whole Milk', icon: '🥛', category: 'Dairy', unit: 'Liters', defaultRate: 60 },
  { name: 'Coffee Powder', icon: '☕', category: 'Beans & Teas', unit: 'Gram', defaultRate: 1.5 },
  { name: 'French Fries (Frozen)', icon: '🍟', category: 'Groceries', unit: 'Kg', defaultRate: 160 },
  { name: 'Paneer (Cottage Cheese)', icon: '🧀', category: 'Dairy', unit: 'Kg', defaultRate: 380 },
  { name: 'Sandwich Bread', icon: '🥪', category: 'Bakery', unit: 'Piece', defaultRate: 35 },
  { name: 'Butter', icon: '🧈', category: 'Dairy', unit: 'Kg', defaultRate: 500 }
];

export default function ProcurementLog({
  procurementLogs = [],
  inventoryItems = [],
  menuItems = [],
  onAddProcurement,
  onDeleteProcurement
}) {
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState('Dairy');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Collect all known raw materials (from Inventory + Menu Recipes + Preset)
  const allAvailableMaterials = useMemo(() => {
    const map = new Map();

    // 1. Existing inventory items
    (inventoryItems || []).forEach(inv => {
      if (inv.materialName) {
        map.set(inv.materialName.toLowerCase().trim(), {
          name: inv.materialName.trim(),
          category: inv.category || 'Groceries',
          unit: inv.unit || 'Piece',
          currentStock: inv.currentStock || 0,
          unitCost: inv.unitCost || 0
        });
      }
    });

    // 2. Ingredients from Menu Items recipes
    (menuItems || []).forEach(item => {
      if (Array.isArray(item.recipe)) {
        item.recipe.forEach(r => {
          if (r.name && !map.has(r.name.toLowerCase().trim())) {
            map.set(r.name.toLowerCase().trim(), {
              name: r.name.trim(),
              category: 'Groceries',
              unit: r.unit || 'Piece',
              currentStock: 0,
              unitCost: 0
            });
          }
        });
      }
    });

    // 3. Preset catalog materials
    INITIAL_INVENTORY_ITEMS.forEach(init => {
      if (!map.has(init.materialName.toLowerCase().trim())) {
        map.set(init.materialName.toLowerCase().trim(), {
          name: init.materialName,
          category: init.category,
          unit: init.unit,
          currentStock: 0,
          unitCost: init.unitCost
        });
      }
    });

    return Array.from(map.values());
  }, [inventoryItems, menuItems]);

  // Suggestions for autocomplete while user types
  const suggestions = useMemo(() => {
    if (!materialName || materialName.trim().length === 0) {
      return allAvailableMaterials.slice(0, 8);
    }
    const q = materialName.toLowerCase().trim();

    return allAvailableMaterials.filter(m => {
      const name = m.name.toLowerCase();
      if (name.includes(q)) return true;

      // Check aliases
      for (const [canonical, aliases] of Object.entries(KNOWN_MATERIAL_ALIASES)) {
        if (name === canonical || name.includes(canonical)) {
          if (aliases.some(a => a.includes(q) || q.includes(a))) return true;
        }
      }
      return false;
    }).slice(0, 8);
  }, [materialName, allAvailableMaterials]);

  // Smart spelling correction recommendation (e.g. "mozzerella" -> "Mozzarella Cheese")
  const spellingCorrection = useMemo(() => {
    if (!materialName || materialName.trim().length < 3) return null;
    const q = materialName.toLowerCase().trim();

    // If already exact match, no correction needed
    if (allAvailableMaterials.some(m => m.name.toLowerCase() === q)) return null;

    // Check aliases
    for (const [canonical, aliases] of Object.entries(KNOWN_MATERIAL_ALIASES)) {
      if (aliases.some(a => a === q || a.includes(q) || q.includes(a))) {
        const target = allAvailableMaterials.find(m => m.name.toLowerCase() === canonical) ||
                       INITIAL_INVENTORY_ITEMS.find(m => m.materialName.toLowerCase() === canonical);
        if (target && target.name.toLowerCase() !== q) {
          return target;
        }
      }
    }

    // Check fuzzy match
    const matched = findMatchingInventoryItem(materialName, allAvailableMaterials);
    if (matched && matched.name.toLowerCase() !== q) {
      return matched;
    }

    return null;
  }, [materialName, allAvailableMaterials]);

  // Choose a raw material from suggestions or quick chips
  const handleSelectMaterial = (item) => {
    setMaterialName(item.name);
    setCategory(item.category || 'Groceries');

    // Auto-select unit: If recipe uses Grams, purchase default is Kg; if recipe uses ml, purchase is Liters
    if (item.unit === 'Gram') {
      setUnit('Kg');
    } else if (item.unit === 'ml') {
      setUnit('Liters');
    } else if (item.unit) {
      setUnit(item.unit);
    }

    // Suggest previous rate if exists in procurementLogs
    const prevLog = procurementLogs.find(p => p.materialName.toLowerCase() === item.name.toLowerCase());
    if (prevLog && prevLog.ratePerUnit) {
      setRatePerUnit(prevLog.ratePerUnit);
      if (quantity) {
        setTotalCost((Number(quantity) * Number(prevLog.ratePerUnit)).toFixed(2));
      }
    } else if (item.unitCost && Number(item.unitCost) > 0) {
      // If unit was converted from Gram to Kg, adjust rate
      const adjustedRate = (item.unit === 'Gram' && unit === 'Kg') ? item.unitCost * 1000 : item.unitCost;
      setRatePerUnit(adjustedRate);
      if (quantity) {
        setTotalCost((Number(quantity) * adjustedRate).toFixed(2));
      }
    }

    setShowSuggestions(false);
  };

  // Auto-calculate Total Cost when Quantity or Rate per Unit changes
  const handleQuantityChange = (val) => {
    setQuantity(val);
    if (val && ratePerUnit) {
      const computed = (Number(val) * Number(ratePerUnit)).toFixed(2);
      setTotalCost(parseFloat(computed));
    }
  };

  const handleRateChange = (val) => {
    setRatePerUnit(val);
    if (quantity && val) {
      const computed = (Number(quantity) * Number(val)).toFixed(2);
      setTotalCost(parseFloat(computed));
    }
  };

  const handleTotalCostChange = (val) => {
    setTotalCost(val);
    if (quantity && Number(quantity) > 0 && val) {
      const computed = (Number(val) / Number(quantity)).toFixed(2);
      setRatePerUnit(parseFloat(computed));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!materialName.trim() || !quantity || !totalCost) return;

    // Use normalized spelling if user typed close alias
    let finalName = materialName.trim();
    if (spellingCorrection && spellingCorrection.name) {
      finalName = spellingCorrection.name;
    }

    const newEntry = {
      id: `proc-${Date.now()}`,
      materialName: finalName,
      category,
      quantityReceived: Number(quantity),
      unit,
      ratePerUnit: Number(ratePerUnit) || (Number(totalCost) / Number(quantity)),
      totalCost: Number(totalCost),
      supplier: supplier.trim(),
      date,
      createdAt: new Date().toISOString()
    };

    onAddProcurement(newEntry);

    // Reset form
    setMaterialName('');
    setQuantity('');
    setRatePerUnit('');
    setTotalCost('');
    setSupplier('');
    setShowSuggestions(false);
  };

  // Filtered Logs
  const filteredLogs = procurementLogs.filter(p => {
    const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
    const matchesSearch = !searchFilter || p.materialName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (p.supplier && p.supplier.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalProcurementSpend = useMemo(() => {
    return procurementLogs.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [procurementLogs]);

  // Check if current unit selection triggers automatic Gram/ml conversion
  const conversionInfo = useMemo(() => {
    const lower = materialName.toLowerCase().trim();
    const matched = allAvailableMaterials.find(m => m.name.toLowerCase() === lower);
    if (!matched) return null;

    if (unit === 'Kg' && matched.unit === 'Gram') {
      const qtyNum = Number(quantity) || 1;
      return `${qtyNum} Kg = ${qtyNum * 1000} Grams (Recipe Gram me use karti hai, stock me auto-convert ho jayega)`;
    }
    if (unit === 'Liters' && matched.unit === 'ml') {
      const qtyNum = Number(quantity) || 1;
      return `${qtyNum} Liter = ${qtyNum * 1000} ml (Recipe ml me use karti hai, stock me auto-convert ho jayega)`;
    }
    return null;
  }, [materialName, unit, quantity, allAvailableMaterials]);

  return (
    <div className="space-y-6">
      
      {/* ⚡ ONE-CLICK QUICK SELECTION CHIPS */}
      <div className="bg-stone-900 text-white rounded-3xl p-5 border border-stone-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
              Quick Purchase Shortcuts (Click to Auto-Fill Correct Name)
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">Spelling Mistake Se Bachne Ke Liye</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_MATERIALS.map((m) => {
            const isSelected = materialName.toLowerCase() === m.name.toLowerCase();
            return (
              <button
                key={m.name}
                type="button"
                onClick={() => handleSelectMaterial(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-md'
                    : 'bg-stone-800/90 text-stone-200 hover:bg-stone-700 hover:text-white border border-stone-700/60'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🛒 ADD RAW MATERIAL PROCUREMENT FORM WITH AUTOCOMPLETE */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-600" />
              <span>Log Raw Material Purchase (Stock Badhega)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Yahan purchase log karte hi raw material inventory me automatic stock aur rate update ho jata hai.
            </p>
          </div>

          {conversionInfo && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span>⚖️</span>
              <span>{conversionInfo}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            
            {/* 1. Material Name with Live Suggestions Dropdown */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Raw Material Name *
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  required
                  value={materialName}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setMaterialName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="e.g. Mozzarella Cheese, Pizza Sauce..."
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-stone-100">
                  <div className="p-2 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Sahi spelling select karein:
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectMaterial(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <span className="font-bold text-stone-900 group-hover:text-amber-900">{item.name}</span>
                        <span className="text-[10px] text-stone-400 ml-1.5 font-medium">({item.category})</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {item.currentStock} {item.unit} in stock
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Spelling Correction Banner (Did you mean?) */}
              {spellingCorrection && (
                <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-300 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="text-[11px] text-amber-950 font-medium">
                    <span>💡 Kya aapka matlab: </span>
                    <strong className="font-bold text-amber-900 underline">{spellingCorrection.name}</strong>?
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMaterial(spellingCorrection)}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-extrabold rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Apply Sahi Spelling
                  </button>
                </div>
              )}
            </div>

            {/* 2. Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* 3. Quantity & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0.001"
                  step="any"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="e.g. 1, 5, 0.5"
                  className="w-full px-3 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none font-extrabold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Unit *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-2 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none font-extrabold text-amber-900"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* 4. Rate Per Unit (₹) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Rate (₹ per {unit}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ratePerUnit}
                  onChange={(e) => handleRateChange(e.target.value)}
                  placeholder={`Rate per ${unit}`}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none text-stone-800"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-stone-100">
            
            {/* Total Cost (₹) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Total Purchase Cost (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-amber-900 font-bold text-xs">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={totalCost}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                  placeholder="Auto-calculated"
                  className="w-full pl-7 pr-3 py-2.5 text-sm font-extrabold bg-amber-50 border border-amber-300 rounded-xl focus:outline-none text-amber-950"
                />
              </div>
            </div>

            {/* Supplier / Vendor Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Supplier / Vendor Name</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Metro Wholesale, Amul Vendor"
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none"
              />
            </div>

            {/* Date Received */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Date Purchased *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Purchase & Update Stock</span>
              </button>
            </div>

          </div>

        </form>
      </div>

      {/* 📜 PROCUREMENT LOGS HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900">Procurement History (Raw Material Purchases)</h3>
            <p className="text-xs text-stone-500">
              Total Spend on Raw Materials: <strong className="text-amber-900">₹{totalProcurementSpend.toLocaleString()}</strong> ({procurementLogs.length} purchases)
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search raw material or vendor..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-10 text-stone-400">
            <PackageCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No raw material purchases found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Raw Material</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Qty Received</th>
                  <th className="py-3.5 px-4 text-right">Rate / Unit</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-700">
                {filteredLogs.map((proc) => (
                  <tr key={proc.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-stone-500">{proc.date}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      <span>{proc.materialName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-100 font-semibold text-xs text-stone-700 border border-stone-200">
                        {proc.category || 'Groceries'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-stone-900">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        {proc.quantityReceived} {proc.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-stone-600">
                      ₹{proc.ratePerUnit ? Number(proc.ratePerUnit).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800">
                      ₹{Number(proc.totalCost).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-500 font-medium">
                      {proc.supplier || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteProcurement(proc.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete purchase log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
