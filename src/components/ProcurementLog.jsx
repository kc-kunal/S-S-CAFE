import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, PackageCheck, Trash2, Tag, Truck, Calculator, Check, Search, TrendingUp, IndianRupee, Layers, AlertCircle, Calendar, UtensilsCrossed } from 'lucide-react';
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
  
  // 👨‍🍳 Recipe Linker inside Purchase Form
  const [showRecipeLinker, setShowRecipeLinker] = useState(false);
  const [recipeLinkedItemIds, setRecipeLinkedItemIds] = useState([]);
  const [recipeQuantity, setRecipeQuantity] = useState('1');
  const [recipeItemQuantities, setRecipeItemQuantities] = useState({});
  const [recipeUnit, setRecipeUnit] = useState('Piece');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('ALL');

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

  // Menu categories and filtered menu items for Recipe linking
  const menuCategories = useMemo(() => {
    const cats = new Set();
    (menuItems || []).forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [menuItems]);

  const filteredRecipeMenuItems = useMemo(() => {
    return (menuItems || []).filter(item => {
      const q = recipeSearch.trim().toLowerCase();
      const matchesSearch = !q || 
        (item.name || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      const matchesCat = recipeCategory === 'ALL' || item.category === recipeCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, recipeSearch, recipeCategory]);

  const handleRecipeItemQtyChange = (itemId, val) => {
    setRecipeItemQuantities(prev => {
      const next = { ...prev };
      if (val === '' || val === undefined) {
        delete next[itemId];
      } else {
        next[itemId] = val;
      }
      return next;
    });
  };

  const handleCommonRecipeQtyChange = (newQty) => {
    const oldDefault = recipeQuantity;
    setRecipeQuantity(newQty);
    setRecipeItemQuantities(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        if (next[id] === oldDefault || next[id] === '' || !next[id]) {
          delete next[id];
        }
      });
      return next;
    });
  };

  const handleApplyCommonQtyToAll = () => {
    setRecipeItemQuantities({});
  };

  const toggleRecipeLinkedItem = (itemId) => {
    setRecipeLinkedItemIds(prev => {
      const isSelected = prev.includes(itemId);
      if (isSelected) {
        setRecipeItemQuantities(qPrev => {
          const next = { ...qPrev };
          delete next[itemId];
          return next;
        });
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSelectAllFilteredRecipe = () => {
    const current = new Set(recipeLinkedItemIds);
    const allFilteredSelected = filteredRecipeMenuItems.length > 0 &&
      filteredRecipeMenuItems.every(item => current.has(item.id));

    if (allFilteredSelected) {
      const filteredIds = new Set(filteredRecipeMenuItems.map(m => m.id));
      setRecipeItemQuantities(qPrev => {
        const next = { ...qPrev };
        filteredRecipeMenuItems.forEach(m => delete next[m.id]);
        return next;
      });
      setRecipeLinkedItemIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      filteredRecipeMenuItems.forEach(item => current.add(item.id));
      setRecipeLinkedItemIds(Array.from(current));
    }
  };

  // Auto-detect and pre-fill recipe links if existing menu items already have this ingredient
  useEffect(() => {
    if (!materialName || !materialName.trim()) return;
    const q = materialName.toLowerCase().trim();
    const existingIds = [];
    const existingQtys = {};
    let foundUnit = '';

    (menuItems || []).forEach(m => {
      if (Array.isArray(m.recipe)) {
        const r = m.recipe.find(rec => (rec?.name || '').toLowerCase().trim() === q);
        if (r) {
          existingIds.push(m.id);
          if (r.quantity !== undefined) existingQtys[m.id] = String(r.quantity);
          if (r.unit && !foundUnit) foundUnit = r.unit;
        }
      }
    });

    if (existingIds.length > 0) {
      setRecipeLinkedItemIds(prev => prev.length === 0 ? existingIds : prev);
      setRecipeItemQuantities(prev => ({ ...existingQtys, ...prev }));
      if (foundUnit) setRecipeUnit(foundUnit);
    }
  }, [materialName, menuItems]);

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

    const resolvedItemQuantities = {};
    (recipeLinkedItemIds || []).forEach(id => {
      const custom = recipeItemQuantities?.[id];
      resolvedItemQuantities[id] = (custom !== undefined && custom !== '')
        ? custom
        : (recipeQuantity || '1');
    });

    const recipeLinkInfo = showRecipeLinker && recipeLinkedItemIds.length > 0 ? {
      itemIds: recipeLinkedItemIds,
      quantity: Number(recipeQuantity) || 1,
      unit: recipeUnit || unit || 'Piece',
      itemQuantities: resolvedItemQuantities
    } : null;

    onAddProcurement(newEntry, recipeLinkInfo);

    // Reset form
    setMaterialName('');
    setQuantity('');
    setTotalCost('');
    setRatePerUnit('');
    setSupplier('');
    setShowSuggestions(false);
    setShowRecipeLinker(false);
    setRecipeLinkedItemIds([]);
    setRecipeItemQuantities({});
    setRecipeSearch('');
  };

  // Filtered Logs - sorted so most recent purchases appear at the top
  const filteredLogs = useMemo(() => {
    const list = procurementLogs.filter(p => {
      const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
      const freq = classifyMaterialProcurementType(p.materialName);
      const matchesFreq = frequencyFilter === 'ALL' || freq === frequencyFilter;
      const matchesSearch = !searchFilter || String(p?.materialName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
                            (p?.supplier && String(p.supplier).toLowerCase().includes(searchFilter.toLowerCase()));
      return matchesCat && matchesFreq && matchesSearch;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || `${a.date || ''} ${a.time || '00:00'}`).getTime();
      const timeB = new Date(b.createdAt || `${b.date || ''} ${b.time || '00:00'}`).getTime();
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;

      const dateA = String(a.date || '');
      const dateB = String(b.date || '');
      if (dateA !== dateB) return dateB.localeCompare(dateA);

      const numA = Number(String(a.id || '').replace(/\D/g, '')) || 0;
      const numB = Number(String(b.id || '').replace(/\D/g, '')) || 0;
      if (numA !== numB) return numB - numA;

      return String(b.id || '').localeCompare(String(a.id || ''));
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

          {/* 👨‍🍳 SMART RECIPE AUTO-LINK (Optional Recipe Mapper) */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowRecipeLinker(!showRecipeLinker)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-3.5 py-2 rounded-xl border border-amber-300 transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {showRecipeLinker ? '▲ Hide Recipe Linker' : `👨‍🍳 Menu Recipe me Link Karein (${recipeLinkedItemIds.length > 0 ? `${recipeLinkedItemIds.length} Linked` : 'Optional - e.g. Pizza Base'})`}
              </span>
            </button>

            {showRecipeLinker && (
              <div className="mt-3 bg-amber-50/70 border border-amber-300/80 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80">
                  <span className="text-lg">👨‍🍳</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Smart Recipe Auto-Link (Menu Recipe me Add Karein)
                    </h4>
                    <p className="text-[10px] text-amber-800">
                      Chunein ki yeh khareeda hua maal kis menu item ki recipe me kitna lagega (jaise Pizza Base sabhi Pizzas me)
                    </p>
                  </div>
                </div>

                {/* 1. Portion per order */}
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200/90 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-[11px] font-black text-stone-800 uppercase">
                      1. Default Portion (Starting Common Matra) *
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                      Neeche har item ki alag quantity bhi set kar sakte hain
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-stone-500 font-semibold block">Common Quantity:</span>
                        {recipeLinkedItemIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleApplyCommonQtyToAll}
                            className="text-[9px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                            title="Sabhi selected items me yehi common quantity set karein"
                          >
                            Sabhi me lagayein
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        value={recipeQuantity}
                        onChange={(e) => handleCommonRecipeQtyChange(e.target.value)}
                        placeholder="e.g. 1 (Base/Bun) ya 25 (Gram)"
                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-extrabold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-0.5">Unit (Ikai):</span>
                      <select
                        value={recipeUnit}
                        onChange={(e) => setRecipeUnit(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {['Gram', 'Kg', 'ml', 'Liters', 'Piece', 'Slice', 'Portion', 'Packets', 'Box'].map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    💡 <strong>Alag-Alag Quantity Tip:</strong> Neeche list me kisi bhi item par tick karte hi uska <strong>Qty</strong> box samne aa jayega, jise aap item ke mutabiq badal sakte hain (jaise Margherita: 25g, Farmhouse: 40g, Double Cheese: 70g)!
                  </p>
                </div>

                {/* 2. Menu Items Search & Checkboxes */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div>
                      <label className="block text-[11px] font-black text-stone-800 uppercase">
                        2. Kin Menu Items Ki Recipe Me Judega?
                      </label>
                      <span className="text-[10px] font-bold text-amber-900">
                        {recipeLinkedItemIds.length} items selected
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {filteredRecipeMenuItems.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllFilteredRecipe}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 cursor-pointer shadow-2xs transition-colors"
                        >
                          {filteredRecipeMenuItems.every(m => recipeLinkedItemIds.includes(m.id))
                            ? 'Deselect Shown'
                            : 'Select Shown'}
                        </button>
                      )}
                      {recipeLinkedItemIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRecipeLinkedItemIds([])}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-bold hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter & Search */}
                  <div className="bg-white/80 p-2 rounded-xl border border-stone-200/90 space-y-2 mb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                        placeholder="Search menu item (e.g. Pizza, Burger, Coffee)..."
                        className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
                      />
                      {recipeSearch && (
                        <button
                          type="button"
                          onClick={() => setRecipeSearch('')}
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
                          onClick={() => setRecipeCategory('ALL')}
                          className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                            recipeCategory === 'ALL'
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
                              onClick={() => setRecipeCategory(cat)}
                              className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors cursor-pointer ${
                                recipeCategory === cat
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

                  {/* List with Per-Item Quantity Inputs */}
                  <div className="bg-white border border-stone-200 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1.5">
                    {filteredRecipeMenuItems.length === 0 ? (
                      <p className="text-[11px] text-stone-400 text-center py-4">
                        {menuItems.length === 0 ? 'Menu me koi items nahi hain.' : 'Koi matching item nahi mila.'}
                      </p>
                    ) : (
                      filteredRecipeMenuItems.map(item => {
                        const isSelected = recipeLinkedItemIds.includes(item.id);
                        const isCustom = recipeItemQuantities?.[item.id] !== undefined && recipeItemQuantities[item.id] !== '';
                        const itemQty = isCustom
                          ? recipeItemQuantities[item.id]
                          : (recipeQuantity || '');

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                              isSelected ? 'bg-amber-100/90 text-stone-950 border border-amber-300 shadow-2xs' : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                            }`}
                          >
                            <label className="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRecipeLinkedItem(item.id)}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold truncate text-xs">{item.name}</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                                  <span>₹{item.price}</span>
                                  <span>•</span>
                                  <span className="bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded font-semibold text-[9px]">{item.category}</span>
                                </div>
                              </div>
                            </label>

                            {/* Per-Item Custom Quantity Input */}
                            {isSelected && (
                              <div className="flex items-center gap-1 shrink-0 ml-2 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-2xs">
                                <span className="text-[10px] text-stone-500 font-bold">Qty:</span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0.0001"
                                  value={itemQty}
                                  onChange={(e) => handleRecipeItemQtyChange(item.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={recipeQuantity || 'Qty'}
                                  className="w-14 px-1.5 py-0.5 text-center font-black text-xs text-amber-950 bg-amber-50/70 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-[10px] font-black text-stone-700">{recipeUnit || unit || 'Piece'}</span>
                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRecipeItemQtyChange(item.id, '');
                                    }}
                                    className="text-[9px] text-stone-400 hover:text-amber-800 font-bold underline cursor-pointer ml-0.5"
                                    title="Wapas common default quantity lagayein"
                                  >
                                    Auto
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Items summary tags with individual quantities */}
                  {recipeLinkedItemIds.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <span className="text-[9px] font-bold text-stone-500 uppercase">Selected:</span>
                      {recipeLinkedItemIds.slice(0, 6).map(id => {
                        const found = menuItems.find(m => m.id === id);
                        if (!found) return null;
                        const specificQty = recipeItemQuantities?.[id] !== undefined
                          ? recipeItemQuantities[id]
                          : (recipeQuantity || '1');
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-amber-200 text-[10px] font-semibold text-stone-800 shadow-2xs"
                          >
                            <span className="max-w-[120px] truncate">{found.name} (<strong>{specificQty} {recipeUnit || unit || 'Piece'}</strong>)</span>
                            <button
                              type="button"
                              onClick={() => toggleRecipeLinkedItem(id)}
                              className="text-stone-400 hover:text-rose-600 text-[10px] font-black cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                      {recipeLinkedItemIds.length > 6 && (
                        <span className="text-[10px] font-bold text-amber-800">
                          +{recipeLinkedItemIds.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-stone-500 mt-1.5 leading-snug">
                    💡 <strong>Auto Recipe Link:</strong> Purchase save hote hi yeh maal in selected items ki recipe me jud jayega!
                  </p>
                </div>
              </div>
            )}
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
