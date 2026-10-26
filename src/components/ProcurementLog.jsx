import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, PackageCheck, Trash2, Tag, Truck, Calculator, Sparkles, Check, Search, TrendingUp, IndianRupee, Layers, AlertCircle, Calendar } from 'lucide-react';
import { findMatchingInventoryItem, convertQuantity, classifyMaterialProcurementType } from '../utils/storage';

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

  // Collect all known raw materials (from Inventory first, then recipe items)
  const allAvailableMaterials = useMemo(() => {
    const map = new Map();

    // 1. Existing inventory items (Primary Source of Truth from Stock tab!)
    (inventoryItems || []).forEach(inv => {
      if (inv?.materialName) {
        map.set(inv.materialName.toLowerCase().trim(), {
          name: inv.materialName.trim(),
          category: inv.category || 'Groceries',
          unit: inv.unit || 'Piece',
          currentStock: inv.currentStock || 0,
          unitCost: inv.unitCost || 0
        });
      }
    });

    // 2. Ingredients from Menu Items recipes (if added via recipe)
    (menuItems || []).forEach(item => {
      if (Array.isArray(item.recipe)) {
        item.recipe.forEach(r => {
          if (r?.name && !map.has(r.name.toLowerCase().trim())) {
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

    return Array.from(map.values());
  }, [inventoryItems, menuItems]);

  // Suggestions for autocomplete while user types (exact substring match from stock)
  const suggestions = useMemo(() => {
    if (!materialName || materialName.trim().length === 0) {
      return allAvailableMaterials;
    }
    const q = materialName.toLowerCase().trim();
    return allAvailableMaterials.filter(m => m.name.toLowerCase().includes(q));
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
        const safeName = String(name || '').toLowerCase();
        const matchedInv = (inventoryItems || []).find(
          i => String(i?.materialName || '').toLowerCase() === safeName
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
    const existingNames = new Set(sortedFromPurchases.map(s => String(s.name || '').toLowerCase()));
    const fromInventory = (inventoryItems || [])
      .filter(i => i?.materialName && !existingNames.has(String(i.materialName).toLowerCase()))
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
    return allAvailableMaterials.find(m => String(m?.name || m?.materialName || '').toLowerCase() === q);
  }, [materialName, allAvailableMaterials]);

  // Look up previous purchase rate or stock unit cost for the selected material
  const previousRateInfo = useMemo(() => {
    if (!materialName || !materialName.trim()) return null;
    const q = materialName.toLowerCase().trim();
    // 1. Check most recent procurement log
    const prevLog = (procurementLogs || []).find(p => String(p?.materialName || '').toLowerCase().trim() === q);
    if (prevLog && Number(prevLog.ratePerUnit) > 0) {
      return {
        rate: Math.round(Number(prevLog.ratePerUnit) * 100) / 100,
        unit: prevLog.unit || 'Piece',
        date: prevLog.date,
        source: 'Pichhli Khareed'
      };
    }
    // 2. Check stock item
    if (exactMatch && Number(exactMatch.unitCost) > 0) {
      return {
        rate: Math.round(Number(exactMatch.unitCost) * 100) / 100,
        unit: exactMatch.unit || 'Piece',
        source: 'Stock Rate'
      };
    }
    return null;
  }, [materialName, procurementLogs, exactMatch]);

  // Whenever materialName exactly matches an existing inventory item, auto-sync unit, category & suggested rate!
  useEffect(() => {
    if (exactMatch) {
      if (exactMatch.unit) setUnit(exactMatch.unit);
      if (exactMatch.category) setCategory(exactMatch.category);

      const q = (materialName || '').toLowerCase().trim();
      const prevLog = (procurementLogs || []).find(p => String(p?.materialName || '').toLowerCase().trim() === q);
      const rate = prevLog?.ratePerUnit || exactMatch.unitCost || 0;
      if (Number(rate) > 0) {
        const roundedRate = Math.round(Number(rate) * 100) / 100;
        setRatePerUnit(roundedRate);
        if (quantity && Number(quantity) > 0 && !totalCost) {
          setTotalCost((Number(quantity) * roundedRate).toFixed(2));
        }
      }
    }
  }, [exactMatch, materialName, procurementLogs]);

  // Choose a raw material from suggestions or quick chips
  const handleSelectMaterial = (item) => {
    const itemName = item?.name || item?.materialName || '';
    setMaterialName(itemName);
    if (item.category) setCategory(item.category);

    const targetUnit = item.unit || 'Piece';
    setUnit(targetUnit);

    // Look up previous rate
    const q = itemName.toLowerCase().trim();
    const prevLog = (procurementLogs || []).find(p => String(p?.materialName || '').toLowerCase().trim() === q);
    const rate = prevLog?.ratePerUnit || item.defaultRate || item.unitCost || 0;

    if (rate > 0) {
      const roundedRate = Math.round(Number(rate) * 100) / 100;
      setRatePerUnit(roundedRate);
      if (quantity && Number(quantity) > 0) {
        setTotalCost((Number(quantity) * roundedRate).toFixed(2));
      }
    } else {
      setRatePerUnit('');
    }

    setShowSuggestions(false);
  };

  // 2-Way Reactive Calculation: Quantity × Rate = Total Cost
  const handleQuantityChange = (val) => {
    setQuantity(val);
    const q = Number(val);
    const r = Number(ratePerUnit);
    if (q > 0 && r > 0) {
      setTotalCost((Math.round(q * r * 100) / 100).toFixed(2));
    }
  };

  const handleRateChange = (val) => {
    setRatePerUnit(val);
    const r = Number(val);
    const q = Number(quantity);
    if (r > 0 && q > 0) {
      setTotalCost((Math.round(q * r * 100) / 100).toFixed(2));
    }
  };

  const handleTotalCostChange = (val) => {
    setTotalCost(val);
    const tc = Number(val);
    const q = Number(quantity);
    if (tc > 0 && q > 0) {
      setRatePerUnit(Math.round((tc / q) * 10000) / 10000);
    }
  };

  // ⚖️ Live Auto-Calculated Rate Breakdown (e.g. 1 piece rate, 1 ml rate, 1 gm rate)
  const rateBreakdown = useMemo(() => {
    const q = Number(quantity);
    const tc = Number(totalCost);
    if (!q || q <= 0 || !tc || tc <= 0) return null;

    const rate = tc / q;
    const unitLower = (unit || '').toLowerCase().trim();

    let mainRate = `₹${rate >= 1 ? rate.toFixed(2) : rate.toFixed(4)} per ${unit}`;
    let subRate = null;

    if (unitLower === 'liter' || unitLower === 'liters' || unitLower === 'l') {
      const perMl = rate / 1000;
      subRate = `1 ml ka rate: ₹${perMl.toFixed(4)}/ml`;
    } else if (unitLower === 'kg' || unitLower === 'kilogram') {
      const perGm = rate / 1000;
      subRate = `1 gm ka rate: ₹${perGm.toFixed(4)}/gm`;
    } else if (unitLower === 'gram' || unitLower === 'gm' || unitLower === 'g') {
      const perKg = rate * 1000;
      subRate = `1 gm ka rate: ₹${rate.toFixed(4)}/gm (₹${Math.round(perKg).toLocaleString()}/Kg)`;
    } else if (unitLower === 'ml') {
      const perL = rate * 1000;
      subRate = `1 ml ka rate: ₹${rate.toFixed(4)}/ml (₹${Math.round(perL).toLocaleString()}/Liter)`;
    } else {
      subRate = `1 ${unit} ka rate: ₹${rate.toFixed(2)}`;
    }

    return {
      rate,
      mainRate,
      subRate
    };
  }, [quantity, totalCost, unit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!materialName.trim() || !quantity || !totalCost) return;

    const trimmedName = materialName.trim();
    const matched = findMatchingInventoryItem(trimmedName, inventoryItems);
    const finalName = matched ? matched.materialName : trimmedName;

    const now = new Date();
    const autoDate = now.toISOString().split('T')[0];
    const autoTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const q = Number(quantity);
    const tc = Number(totalCost);
    const calculatedRate = (tc && q) ? (tc / q) : (Number(ratePerUnit) || 0);

    const newEntry = {
      id: `proc-${Date.now()}`,
      materialName: finalName,
      category: category || matched?.category || 'Groceries',
      quantityReceived: q,
      unit: unit || matched?.unit || 'Piece',
      ratePerUnit: Math.round(calculatedRate * 10000) / 10000,
      totalCost: tc,
      supplier: supplier.trim(),
      date: autoDate,
      time: autoTime,
      createdAt: now.toISOString()
    };

    onAddProcurement(newEntry);

    // Reset form
    setMaterialName('');
    setQuantity('');
    setTotalCost('');
    setRatePerUnit('');
    setSupplier('');
    setShowSuggestions(false);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return procurementLogs.filter(p => {
      const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
      const freq = classifyMaterialProcurementType(p.materialName);
      const matchesFreq = frequencyFilter === 'ALL' || freq === frequencyFilter;
      const matchesSearch = !searchFilter || String(p?.materialName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
                            (p?.supplier && String(p.supplier).toLowerCase().includes(searchFilter.toLowerCase()));
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
                  {m.defaultRate > 0 && (
                    <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-1.5 py-0.2 rounded font-black border border-emerald-500/30">
                      ₹{m.defaultRate}/{m.unit}
                    </span>
                  )}
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
            
            {/* 1. Material Name (Click to select from Stock) */}
            <div className="relative sm:col-span-2" ref={suggestionsRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  1. Raw Material Chuniye (Stock Se) *
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
                  placeholder="Click here to select stock item (e.g. Cooking Oil, Cheese, Pizza Box)..."
                  className={`w-full px-3.5 py-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900 transition-all ${
                    exactMatch
                      ? 'bg-emerald-50/40 border border-emerald-300'
                      : 'bg-stone-50 border border-stone-300'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Exact Stock Match Indicator */}
              {exactMatch && (
                exactMatch.currentStock < 0 ? (
                  <div className="mt-1.5 text-[11px] text-purple-800 font-bold flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                    <span>
                      Deficit Stock: <strong className="underline">{exactMatch.currentStock} {exactMatch.unit}</strong> (Minus me chal raha hai) • Purchase log karte hi yeh automatic adjust ho jayega!
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Existing Stock Item: <strong>{exactMatch.currentStock} {exactMatch.unit}</strong> in stock</span>
                  </div>
                )
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-stone-100">
                  <div className="p-2 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Aapki Inventory Me Se Chuniye ({suggestions.length}):</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  </div>
                  {suggestions.map((item) => {
                    const itemRate = item.defaultRate || item.unitCost || 0;
                    const isDeficit = item.currentStock < 0;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => handleSelectMaterial(item)}
                        className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-amber-50/70 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <span className="font-bold text-stone-900 group-hover:text-amber-900">{item.name}</span>
                          <span className="text-[10px] text-stone-400 ml-1.5 font-medium">({item.category})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {itemRate > 0 && (
                            <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                              Rate: ₹{itemRate}/{item.unit}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isDeficit
                              ? 'text-purple-800 bg-purple-50 border-purple-300'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}>
                            {isDeficit ? `Deficit: ${item.currentStock}` : `${item.currentStock}`} {item.unit}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Previous Rate Suggestion Banner */}
              {previousRateInfo && (
                <div className="mt-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300/90 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <div>
                      <span className="text-stone-700 font-medium">
                        Pichhla Rate: <strong className="text-amber-950 font-black text-sm">₹{previousRateInfo.rate} per {previousRateInfo.unit}</strong>
                      </span>
                      {previousRateInfo.date && (
                        <span className="text-[10px] text-stone-500 ml-1.5">
                          ({previousRateInfo.source}: {previousRateInfo.date})
                        </span>
                      )}
                    </div>
                  </div>

                  {quantity && Number(quantity) > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-600 font-semibold">
                        {quantity} {previousRateInfo.unit} × ₹{previousRateInfo.rate} = <strong className="text-emerald-800 font-black">₹{(Number(quantity) * previousRateInfo.rate).toFixed(2)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRatePerUnit(previousRateInfo.rate);
                          setTotalCost((Number(quantity) * previousRateInfo.rate).toFixed(2));
                        }}
                        className="text-[10px] font-black px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg cursor-pointer shadow-2xs transition-colors"
                      >
                        Auto Apply ₹{(Number(quantity) * previousRateInfo.rate).toFixed(2)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Category (Auto) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                2. Category (Auto)
              </label>
              <div className="px-3.5 py-2.5 text-xs font-bold bg-stone-100/90 border border-stone-200 rounded-xl text-stone-800 flex items-center justify-between">
                <span>{category || 'Groceries'}</span>
                <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-extrabold">Auto</span>
              </div>
            </div>

            {/* 3. Unit (Auto) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                3. Stock Unit (Auto)
              </label>
              <div className="px-3.5 py-2.5 text-xs font-bold bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between">
                <span>{unit || 'Piece'}</span>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-extrabold">Auto</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start pt-2 border-t border-stone-100">

            {/* 4. Kitna Maal Kharida (Quantity) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                4. Kitna Maal Kharida ({unit || 'Unit'}) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder={`Kitne ${unit || 'Piece'} kharide?`}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-extrabold text-stone-900"
                />
              </div>
            </div>

            {/* 5. 1 Unit Ka Rate (Auto-Suggested & 2-Way Synced) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  5. 1 {unit || 'Piece'} Ka Rate (₹)
                </label>
                {previousRateInfo && (
                  <span className="text-[10px] text-amber-800 font-black bg-amber-100 px-1.5 py-0.2 rounded">
                    Pichhla: ₹{previousRateInfo.rate}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="any"
                  value={ratePerUnit}
                  onChange={(e) => handleRateChange(e.target.value)}
                  placeholder={previousRateInfo ? `Pichhla: ${previousRateInfo.rate}` : `Rate per ${unit || 'Piece'}`}
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-extrabold bg-white border border-amber-300/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-900"
                />
              </div>
            </div>

            {/* 6. Total Bill Amount (₹) - Auto-Calculated */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  6. Kitne Ka Aaya Total (₹) *
                </label>
                <span className="text-[10px] text-stone-400 font-semibold">(Qty × Rate)</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-amber-900 font-bold text-xs">₹</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={totalCost}
                  onChange={(e) => handleTotalCostChange(e.target.value)}
                  placeholder="Total amount"
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-black bg-amber-50 border-2 border-amber-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-amber-950"
                />
              </div>
            </div>

            {/* 7. Supplier / Vendor Name (Optional) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-500" />
                <span>Supplier / Dukaan</span>
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. D-Mart, Vendor"
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl focus:outline-none"
              />
            </div>

            {/* 8. Submit Button */}
            <div className="space-y-1">
              <div className="text-[10px] text-stone-500 font-semibold flex items-center justify-between mb-1">
                <span>⏱️ Live Auto Time</span>
                <span className="text-emerald-700 font-bold">Auto</span>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Stock</span>
              </button>
            </div>

          </div>

          {/* ⚖️ LIVE AUTO-CALCULATED RATE BREAKDOWN CARD */}
          {rateBreakdown && (
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚖️</span>
                <div>
                  <span className="font-bold text-emerald-950 block">
                    Auto-Calculated Rate: <strong>{rateBreakdown.mainRate}</strong>
                  </span>
                  {rateBreakdown.subRate && (
                    <span className="text-[11px] font-black text-emerald-800">
                      🎯 {rateBreakdown.subRate}
                    </span>
                  )}
                </div>
              </div>

              {previousRateInfo && previousRateInfo.rate > 0 && rateBreakdown.rate > 0 ? (
                <div className="text-[11px] font-bold">
                  {Math.abs(rateBreakdown.rate - previousRateInfo.rate) < 0.01 ? (
                    <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300">
                      ✓ Pichhle rate (₹{previousRateInfo.rate}) ke barabar hai
                    </span>
                  ) : rateBreakdown.rate > previousRateInfo.rate ? (
                    <span className="text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-lg border border-rose-300">
                      ▲ Pichhle rate (₹{previousRateInfo.rate}) se ₹{(rateBreakdown.rate - previousRateInfo.rate).toFixed(2)} mehenga
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300">
                      ▼ Pichhle rate (₹{previousRateInfo.rate}) se ₹{(previousRateInfo.rate - rateBreakdown.rate).toFixed(2)} sasta
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-100/60 px-2 py-1 rounded-lg">
                  Stock me yahi rate auto-save hoga
                </span>
              )}
            </div>
          )}

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
                        <td className="py-3 px-4 text-xs font-semibold text-stone-500">
                          <div>{proc.date}</div>
                          {proc.time && <div className="text-[10px] text-stone-400 font-normal">{proc.time}</div>}
                        </td>
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
                        <span>{proc.date} {proc.time && <span className="text-[10px] text-stone-400">({proc.time})</span>}</span>
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
