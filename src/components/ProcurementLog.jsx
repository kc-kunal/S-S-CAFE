import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, PackageCheck, Trash2, Tag, Truck, Calculator, Sparkles, Check, Search, TrendingUp, IndianRupee, Layers, AlertCircle, Calendar } from 'lucide-react';
import { KNOWN_MATERIAL_ALIASES, INITIAL_INVENTORY_ITEMS, findMatchingInventoryItem, convertQuantity, classifyMaterialProcurementType } from '../utils/storage';

const CATEGORIES = ['Dairy', 'Bakery', 'Groceries', 'Beans & Teas', 'Frozen', 'Dry', 'Packaging'];
const UNITS = ['Kg', 'Gram', 'Liters', 'ml', 'Piece', 'Packet', 'Box'];

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
  const [frequencyFilter, setFrequencyFilter] = useState('ALL'); // 'ALL' | 'daily' | 'weekly'
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
      return allAvailableMaterials;
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
    });
  }, [materialName, allAvailableMaterials]);

  // Dynamically monitor purchase frequency & inventory to build Quick Buttons for THIS cafe (Not hardcoded!)
  const monitoredQuickMaterials = useMemo(() => {
    const purchaseCounts = {};
    const purchaseUnits = {};
    const purchaseRates = {};
    const purchaseCategories = {};

    (procurementLogs || []).forEach(p => {
      const name = p.materialName?.trim();
      if (name) {
        purchaseCounts[name] = (purchaseCounts[name] || 0) + 1;
        if (!purchaseUnits[name] && p.unit) purchaseUnits[name] = p.unit;
        if (!purchaseRates[name] && p.ratePerUnit) purchaseRates[name] = p.ratePerUnit;
        if (!purchaseCategories[name] && p.category) purchaseCategories[name] = p.category;
      }
    });

    // 1. Sort by purchase frequency descending
    const sortedFromPurchases = Object.entries(purchaseCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const matchedInv = (inventoryItems || []).find(
          i => i.materialName.toLowerCase() === name.toLowerCase()
        );
        return {
          name,
          category: purchaseCategories[name] || matchedInv?.category || 'Groceries',
          unit: purchaseUnits[name] || matchedInv?.unit || 'Kg',
          defaultRate: purchaseRates[name] || matchedInv?.unitCost || 0,
          purchaseCount: count,
          currentStock: matchedInv?.currentStock,
          isFrequent: true
        };
      });

    // 2. If purchase logs are few (< 12), fill with active inventory items from this cafe
    const existingNames = new Set(sortedFromPurchases.map(s => s.name.toLowerCase()));
    const fromInventory = (inventoryItems || [])
      .filter(i => !existingNames.has(i.materialName.toLowerCase()))
      .map(inv => ({
        name: inv.materialName,
        category: inv.category || 'Groceries',
        unit: inv.unit || 'Kg',
        defaultRate: inv.unitCost || 0,
        purchaseCount: 0,
        currentStock: inv.currentStock,
        isFrequent: false
      }));

    return [...sortedFromPurchases, ...fromInventory].slice(0, 12);
  }, [procurementLogs, inventoryItems]);

  // Exact Match with existing stock item
  const exactMatch = useMemo(() => {
    if (!materialName || materialName.trim().length === 0) return null;
    const q = materialName.toLowerCase().trim();
    return allAvailableMaterials.find(m => m.name.toLowerCase() === q);
  }, [materialName, allAvailableMaterials]);

  // Smart spelling correction recommendation (e.g. "mozzerella" -> "Mozzarella Cheese", "pizza basse" -> "Pizza Base")
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

    // Use normalized spelling if user typed close alias or minor typo
    let finalName = materialName.trim();
    if (spellingCorrection && spellingCorrection.name) {
      finalName = spellingCorrection.name;
    } else {
      const fuzzy = findMatchingInventoryItem(finalName, inventoryItems);
      if (fuzzy) finalName = fuzzy.materialName;
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
  const filteredLogs = useMemo(() => {
    return procurementLogs.filter(p => {
      const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
      const freq = classifyMaterialProcurementType(p.materialName);
      const matchesFreq = frequencyFilter === 'ALL' || freq === frequencyFilter;
      const matchesSearch = !searchFilter || p.materialName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            (p.supplier && p.supplier.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCat && matchesFreq && matchesSearch;
    });
  }, [procurementLogs, filterCategory, frequencyFilter, searchFilter]);

  const totalProcurementSpend = useMemo(() => {
    return procurementLogs.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [procurementLogs]);

  const dailyProcurementSpend = useMemo(() => {
    return procurementLogs
      .filter(p => classifyMaterialProcurementType(p.materialName) === 'daily')
      .reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [procurementLogs]);

  const weeklyProcurementSpend = useMemo(() => {
    return procurementLogs
      .filter(p => classifyMaterialProcurementType(p.materialName) === 'weekly')
      .reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
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
      
      {/* ⚡ MONITORED QUICK SELECTION CHIPS (Dynamic for this Cafe) */}
      <div className="bg-stone-900 text-white rounded-3xl p-5 border border-stone-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
              Cafe Monitored Raw Materials (Frequent Purchases)
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">Aapke Cafe Ki Khareedi Par Auto-Monitored</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {monitoredQuickMaterials.length === 0 ? (
            <p className="text-xs text-stone-400 py-2 italic">
              💡 Naye cafe ke liye: Jaise-jaise aap maal purchase karenge, aapke cafe ke frequent items yahan auto-monitor hokar 1-click button ban jayenge.
            </p>
          ) : (
            monitoredQuickMaterials.map((m) => {
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
                  title={`${m.name} (${m.purchaseCount > 0 ? `${m.purchaseCount}x Purchased` : `Stock: ${m.currentStock || 0} ${m.unit}`})`}
                >
                  <span>📦</span>
                  <span>{m.name}</span>
                  {m.purchaseCount > 0 ? (
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-md font-extrabold">
                      {m.purchaseCount}x
                    </span>
                  ) : m.currentStock !== undefined ? (
                    <span className="text-[10px] text-stone-400">
                      ({m.currentStock} {m.unit})
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Raw Material Name *
                </label>
                {allAvailableMaterials.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                  >
                    📦 View Stock List ({allAvailableMaterials.length})
                  </button>
                )}
              </div>
              
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
                  placeholder="e.g. Mozzarella Cheese, Pizza Base..."
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 transition-all ${
                    exactMatch
                      ? 'bg-emerald-50/40 border border-emerald-300'
                      : spellingCorrection
                      ? 'bg-amber-50/50 border-2 border-amber-400'
                      : 'bg-stone-50 border border-stone-300'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Exact Stock Match Indicator */}
              {exactMatch && (
                <div className="mt-1.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Existing Stock Item: {exactMatch.currentStock} {exactMatch.unit} in stock (Stock isme badhega).</span>
                </div>
              )}

              {/* New Material Notice */}
              {!exactMatch && !spellingCorrection && materialName.trim().length >= 3 && (
                <div className="mt-1.5 text-[11px] text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-200">
                  <span>➕ <strong>Naya Raw Material:</strong> Ye item aapke Stock me naya add ho jayega.</span>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-stone-100">
                  <div className="p-2 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Aapke Stock Me Se Chuniye ({suggestions.length}):</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
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

              {/* Spelling Auto-Correction Banner (Did you mean?) */}
              {spellingCorrection && (
                <div className="mt-2 p-3 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
                  <div className="text-[11px] text-amber-950 font-medium">
                    <span className="text-amber-800 font-bold block">✨ Auto-Correct Match Found:</span>
                    <span>Aapne "<strong>{materialName}</strong>" likha hai. Stock me <strong>"{spellingCorrection.name}"</strong> maujood hai.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectMaterial(spellingCorrection)}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-extrabold rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Apply "{spellingCorrection.name}"
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">Procurement History (Raw Material Purchases)</h3>
            </div>
            
            {/* Daily Fresh vs Weekly Bulk Spend Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
              <span className="font-semibold text-stone-500">
                Total Spend: <strong className="text-amber-900 font-extrabold">₹{totalProcurementSpend.toLocaleString()}</strong>
              </span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                <span>🥛 Daily Fresh (Doodh, Buns, Sabzi):</span>
                <span>₹{dailyProcurementSpend.toLocaleString()}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                <span>📦 Weekly Bulk (Cheese, Fries, Sauces):</span>
                <span>₹{weeklyProcurementSpend.toLocaleString()}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Daily vs Weekly Frequency Switcher */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
              <button
                type="button"
                onClick={() => setFrequencyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  frequencyFilter === 'ALL' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                All ({procurementLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setFrequencyFilter('daily')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  frequencyFilter === 'daily' ? 'bg-blue-600 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>🥛 Roz Maal</span>
              </button>
              <button
                type="button"
                onClick={() => setFrequencyFilter('weekly')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  frequencyFilter === 'weekly' ? 'bg-purple-600 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <span>📦 Bulk Stock</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search material/vendor..."
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
            <p className="text-xs font-semibold">No raw material purchases found matching filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Raw Material</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Qty Received</th>
                    <th className="py-3.5 px-4 text-right">Rate / Unit</th>
                    <th className="py-3.5 px-4 text-right">Total Cost</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  {filteredLogs.map((proc) => {
                    const isDaily = classifyMaterialProcurementType(proc.materialName) === 'daily';
                    return (
                      <tr key={proc.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4 text-xs font-semibold text-stone-500">{proc.date}</td>
                        <td className="py-3 px-4 font-bold text-stone-900">
                          <span>{proc.materialName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isDaily ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {isDaily ? '🥛 Roz' : '📦 Bulk'}
                          </span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredLogs.map((proc) => {
                const isDaily = classifyMaterialProcurementType(proc.materialName) === 'daily';
                return (
                  <div key={proc.id} className="p-3.5 bg-stone-50/70 border border-stone-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-900 text-sm truncate">{proc.materialName}</h4>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                          isDaily ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {isDaily ? '🥛 Roz' : '📦 Bulk'}
                        </span>
                        <span className="text-[9px] font-semibold text-stone-600 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                          {proc.category || 'Material'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                        <span>{proc.date}</span>
                        <span>•</span>
                        <span className="font-bold text-stone-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                          {proc.quantityReceived} {proc.unit}
                        </span>
                        {proc.supplier && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-stone-400 truncate max-w-[100px]">{proc.supplier}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-emerald-800 text-base">₹{Number(proc.totalCost).toLocaleString()}</div>
                        {proc.ratePerUnit && (
                          <span className="text-[10px] text-stone-500">₹{Number(proc.ratePerUnit).toFixed(1)}/{proc.unit}</span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteProcurement(proc.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete purchase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
