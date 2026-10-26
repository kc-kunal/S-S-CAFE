import React, { useState, useEffect } from 'react';
import { X, Check, Coffee, Tag, Plus, Trash2, Layers, Calculator, Sparkles, AlertTriangle, Copy } from 'lucide-react';
import { convertQuantity, findMatchingInventoryItem } from '../utils/storage';

const PRESET_CATEGORIES = [
  'Pizza',
  'Burgers',
  'Sandwich',
  'Fries',
  'Garlic Bread',
  'Cold Coffee & Shakes',
  'Wraps',
  'Mocktails',
  'Meal Combos',
  'Add Ons'
];

const PRESET_UNITS = ['Piece', 'Portion', 'Glass', 'Cup', 'Combo', 'Serving', 'Plate', 'Pack'];
const INGREDIENT_UNITS = ['Piece', 'Gram', 'ml', 'Slice', 'Portion', 'Kg', 'Liters'];

export default function ItemModal({ isOpen, onClose, onSave, editingItem, onDuplicate, existingCategories = [], inventoryItems = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Burgers',
    sellingPrice: '',
    costPrice: '',
    unit: 'Piece',
    isAvailable: true
  });

  const [recipe, setRecipe] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [errors, setErrors] = useState({});

  const allCategories = Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories]));

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || '',
        category: editingItem.category || 'Burgers',
        sellingPrice: editingItem.sellingPrice !== undefined ? editingItem.sellingPrice : '',
        costPrice: editingItem.costPrice !== undefined ? editingItem.costPrice : '',
        unit: editingItem.unit || 'Piece',
        imageUrl: editingItem.imageUrl || '',
        isAvailable: editingItem.isAvailable !== undefined ? editingItem.isAvailable : true
      });
      setRecipe(Array.isArray(editingItem.recipe) ? JSON.parse(JSON.stringify(editingItem.recipe)) : []);
      setIsCustomCat(!allCategories.includes(editingItem.category));
      setCustomCategory(!allCategories.includes(editingItem.category) ? editingItem.category : '');
    } else {
      setFormData({
        name: '',
        category: 'Burgers',
        sellingPrice: '',
        costPrice: '',
        unit: 'Piece',
        imageUrl: '',
        isAvailable: true
      });
      setRecipe([]);
      setIsCustomCat(false);
      setCustomCategory('');
    }
    setErrors({});
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Helper to determine compatible recipe units based on raw material's stock unit
  const getCompatibleUnitsForStock = (stockUnit) => {
    const u = (stockUnit || '').trim().toLowerCase();
    if (u === 'kg' || u === 'kilogram' || u === 'kgs' || u === 'gram' || u === 'gm' || u === 'g') {
      return ['Gram', 'Kg'];
    }
    if (u === 'liters' || u === 'liter' || u === 'l' || u === 'ml') {
      return ['ml', 'Liters'];
    }
    return ['Piece', 'Slice', 'Portion', 'Pack', 'Gram', 'Kg', 'ml', 'Liters'];
  };

  // Recipe helpers
  const handleAddRecipeIngredient = () => {
    const newIngredient = {
      ingredientId: '',
      name: '',
      quantity: 1,
      unit: 'Piece',
      isCustom: inventoryItems.length === 0
    };
    setRecipe([...recipe, newIngredient]);
  };

  const handleUpdateRecipeIngredient = (index, field, value) => {
    const updated = [...recipe];
    if (field === 'ingredientId') {
      if (value === 'custom') {
        updated[index] = {
          ...updated[index],
          ingredientId: `custom-${Date.now()}`,
          name: '',
          unit: 'Piece',
          isCustom: true
        };
      } else if (!value) {
        updated[index] = {
          ...updated[index],
          ingredientId: '',
          name: '',
          unit: 'Piece',
          isCustom: false
        };
      } else {
        const selectedInv = inventoryItems.find(i => i.id === value);
        if (selectedInv) {
          const invU = (selectedInv.unit || '').trim().toLowerCase();
          let defaultUnit = selectedInv.unit;
          let defaultQty = updated[index].quantity || 1;

          // Kitchen recipe friendly defaults: Gram for weight, ml for liquid
          if (invU === 'kg' || invU === 'kilogram' || invU === 'kgs') {
            defaultUnit = 'Gram';
            if (Number(defaultQty) < 1 && Number(defaultQty) > 0) {
              defaultQty = Math.round(Number(defaultQty) * 1000);
            } else if (defaultQty === 1) {
              defaultQty = 25; // standard cafe recipe starting amount (e.g. 25g cheese / 15g sauce)
            }
          } else if (invU === 'liters' || invU === 'liter' || invU === 'l') {
            defaultUnit = 'ml';
            if (Number(defaultQty) < 1 && Number(defaultQty) > 0) {
              defaultQty = Math.round(Number(defaultQty) * 1000);
            } else if (defaultQty === 1) {
              defaultQty = 100;
            }
          } else {
            defaultUnit = selectedInv.unit || 'Piece';
          }

          updated[index] = {
            ...updated[index],
            ingredientId: selectedInv.id,
            name: selectedInv.materialName,
            unit: defaultUnit,
            quantity: defaultQty,
            isCustom: false
          };
        }
      }
    } else if (field === 'unit') {
      const oldUnit = (updated[index].unit || '').trim().toLowerCase();
      const newUnit = (value || '').trim().toLowerCase();
      let curQty = Number(updated[index].quantity);

      // Smart auto-convert quantity between Gram and Kg or ml and Liters
      if (!isNaN(curQty) && curQty > 0) {
        if ((oldUnit === 'kg' || oldUnit === 'kilogram' || oldUnit === 'kgs') && (newUnit === 'gram' || newUnit === 'gm' || newUnit === 'g')) {
          curQty = Math.round(curQty * 1000 * 100) / 100;
        } else if ((oldUnit === 'gram' || oldUnit === 'gm' || oldUnit === 'g') && (newUnit === 'kg' || newUnit === 'kilogram' || newUnit === 'kgs')) {
          curQty = Math.round((curQty / 1000) * 10000) / 10000;
        } else if ((oldUnit === 'liters' || oldUnit === 'liter' || oldUnit === 'l') && (newUnit === 'ml')) {
          curQty = Math.round(curQty * 1000 * 100) / 100;
        } else if ((newUnit === 'liters' || newUnit === 'liter' || newUnit === 'l') && (oldUnit === 'ml')) {
          curQty = Math.round((curQty / 1000) * 10000) / 10000;
        }
      }

      updated[index] = {
        ...updated[index],
        unit: value,
        quantity: isNaN(curQty) || curQty <= 0 ? updated[index].quantity : curQty
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setRecipe(updated);
  };

  const handleRemoveRecipeIngredient = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  // Compute live recipe cost with accurate unit conversion
  const totalRecipeCost = recipe.reduce((sum, item) => {
    const matchedInv = findMatchingInventoryItem(item.ingredientId, inventoryItems) ||
                       findMatchingInventoryItem(item.name, inventoryItems);
    if (!matchedInv) return sum;
    const invUnitCost = Number(matchedInv.unitCost) || 0;
    const itemQty = Number(item.quantity) || 0;
    // Convert recipe unit to inventory unit (e.g. 60g -> 0.06kg, or 250ml -> 0.25L, or 1 Piece -> 1 Piece)
    const convertedQty = convertQuantity(itemQty, item.unit || matchedInv.unit, matchedInv.unit);
    return sum + (convertedQty * invUnitCost);
  }, 0);

  const roundedRecipeCost = Math.round(totalRecipeCost * 100) / 100;

  const handleAutoFillCostPrice = () => {
    if (roundedRecipeCost > 0) {
      setFormData(prev => ({ ...prev, costPrice: roundedRecipeCost }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    
    const finalCategory = isCustomCat ? customCategory.trim() : formData.category;
    if (!finalCategory) newErrors.category = 'Category is required';

    if (!formData.sellingPrice || isNaN(formData.sellingPrice) || Number(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Enter a valid selling price (> 0)';
    }

    if (formData.costPrice === '' || isNaN(formData.costPrice) || Number(formData.costPrice) < 0) {
      newErrors.costPrice = 'Enter a valid cost price (≥ 0)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = isCustomCat ? customCategory.trim() : formData.category;

    // Filter valid recipe ingredients and ensure no undefined values
    const cleanedRecipe = recipe
      .filter(r => r && r.name && String(r.name).trim() && Number(r.quantity) > 0)
      .map(r => {
        // Auto-heal ingredientId to matching stock item ID if available
        const matched = findMatchingInventoryItem(r.ingredientId, inventoryItems) ||
                        findMatchingInventoryItem(r.name, inventoryItems);
        return {
          ingredientId: matched ? matched.id : (r.ingredientId || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`),
          name: matched ? matched.materialName : String(r.name).trim(),
          quantity: Number(r.quantity),
          unit: r.unit || (matched ? matched.unit : 'Piece')
        };
      });

    const itemToSave = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: formData.name.trim(),
      category: finalCategory,
      sellingPrice: Number(formData.sellingPrice),
      costPrice: Number(formData.costPrice),
      unit: formData.unit.trim() || 'Piece',
      imageUrl: formData.imageUrl?.trim() || '',
      isAvailable: formData.isAvailable !== false,
      recipe: cleanedRecipe
    };

    onSave(itemToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-stone-950 text-stone-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-600 text-white shadow-sm shrink-0">
              <Coffee className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif-title text-amber-100">
                {editingItem ? 'Edit Menu Item & Recipe' : 'Add New Menu Item & Recipe'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400">Configure item details and raw material consumption</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Margarita Pizza, Classic Cold Coffee..."
              className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-semibold"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Direct Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Select Category <span className="text-rose-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCat(!isCustomCat)}
                className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
              >
                {isCustomCat ? '← Select Preset Category' : '+ Add New Custom Category'}
              </button>
            </div>

            {isCustomCat ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type custom category name..."
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none font-semibold"
              />
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded-2xl max-h-32 overflow-y-auto">
                {allCategories.map((cat) => {
                  const isSelected = formData.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-500'
                          : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span>{cat}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            )}
            {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
          </div>

          {/* Pricing & Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-200/60">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="99"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none font-extrabold text-amber-900"
                />
              </div>
              {errors.sellingPrice && <p className="text-xs text-rose-500 mt-1">{errors.sellingPrice}</p>}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Cost Price (₹) *
                </label>
                {roundedRecipeCost > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFillCostPrice}
                    className="text-[10px] text-amber-700 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                    title="Copy recipe cost to Cost Price"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Sync (₹{roundedRecipeCost})</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="45"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none font-semibold text-stone-700"
                />
              </div>
              {errors.costPrice && <p className="text-xs text-rose-500 mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Menu Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold bg-white border border-stone-300 rounded-xl focus:outline-none"
              >
                {PRESET_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 📸 Item Photo (Optional Image Link) */}
          <div className="bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📸 Item Photo (Optional Image Link)</span>
              </label>
              <span className="text-[10px] text-amber-700 font-semibold">
                Khaali chhodne par automatic photo lagegi
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/... ya custom photo link paste karein"
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none font-semibold text-stone-700"
              />
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-bold border border-rose-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {formData.imageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-300 bg-white shadow-xs shrink-0">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <span className="text-[11px] text-emerald-700 font-bold">
                  ✓ Photo URL preview loaded successfully
                </span>
              </div>
            )}
          </div>

          {/* 🥘 RECIPE / RAW MATERIAL INGREDIENTS SECTION */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Recipe Ingredients (Raw Material Auto-Deduction)</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Pehle Inventory tab me raw material add karein, wahi yahan recipe me select hoga.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-xl shrink-0">
                  📦 {inventoryItems.length} Inventory Items
                </span>
                <button
                  type="button"
                  onClick={handleAddRecipeIngredient}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Ingredient</span>
                </button>
              </div>
            </div>

            {/* If inventory has no items yet */}
            {inventoryItems.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Tip:</strong> Aapke <strong>Stock / Raw Material</strong> tab me abhi koi maal add nahi hai. Wahan maal add karne ke baad wo yahan direct dropdown me select karne ke liye dikhne lagega.
                </span>
              </div>
            )}

            {/* Ingredients Table / Empty State */}
            {recipe.length === 0 ? (
              <div className="p-4 text-center text-xs bg-amber-50/70 rounded-2xl border-2 border-dashed border-amber-300/80 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Recipe Ingredients Add Nahi Hain</span>
                </div>
                <p className="text-[11px] text-stone-600 max-w-md mx-auto">
                  ⚠️ <strong>Zaroori:</strong> Niche button dabakar apne stock se raw material chuniye (jaise 1 Bun, 60g Cheese). Sale hote hi ye maal stock se automatic minus hoga.
                </p>
                <button
                  type="button"
                  onClick={handleAddRecipeIngredient}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-amber-500 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Raw Material from Stock</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recipe.map((ing, idx) => {
                  const matchedInv = findMatchingInventoryItem(ing.ingredientId, inventoryItems) ||
                    findMatchingInventoryItem(ing.name, inventoryItems);
                  const ingUnitCost = matchedInv ? (Number(matchedInv.unitCost) || 0) : 0;
                  const rawQty = Number(ing.quantity) || 0;
                  const recipeUnit = ing.unit || matchedInv?.unit || 'Piece';
                  const stockUnit = matchedInv?.unit || recipeUnit;

                  // Accurate Unit Conversion: 60g @ ₹490/Kg -> 0.060 * 490 = ₹29.40
                  const convertedQty = convertQuantity(rawQty, recipeUnit, stockUnit);
                  const lineCost = Math.round(convertedQty * ingUnitCost * 100) / 100;

                  // Compatible units for this raw material
                  const compatibleUnits = matchedInv ? getCompatibleUnitsForStock(matchedInv.unit) : INGREDIENT_UNITS;

                  // Rate breakdown text & micro-gram check
                  const stockUnitLower = stockUnit.toLowerCase();
                  const recUnitLower = recipeUnit.toLowerCase();
                  let rateInfo = null;
                  let isMicroGramWarning = false;
                  let microGramFixQty = 0;

                  if (matchedInv && ingUnitCost > 0) {
                    if (stockUnitLower === 'kg' || stockUnitLower === 'kilogram' || stockUnitLower === 'kgs') {
                      const perGm = ingUnitCost / 1000;
                      const formattedGmRate = perGm >= 0.01 ? perGm.toFixed(2) : perGm.toFixed(4);
                      if (recUnitLower === 'gram' || recUnitLower === 'gm' || recUnitLower === 'g') {
                        rateInfo = `₹${ingUnitCost}/Kg (₹${formattedGmRate}/gm)`;
                        if (rawQty > 0 && rawQty < 0.5) {
                          isMicroGramWarning = true;
                          microGramFixQty = Math.round(rawQty * 1000);
                        }
                      } else {
                        rateInfo = `₹${ingUnitCost}/Kg`;
                      }
                    } else if (stockUnitLower === 'liters' || stockUnitLower === 'liter' || stockUnitLower === 'l') {
                      const perMl = ingUnitCost / 1000;
                      const formattedMlRate = perMl >= 0.01 ? perMl.toFixed(2) : perMl.toFixed(4);
                      if (recUnitLower === 'ml') {
                        rateInfo = `₹${ingUnitCost}/L (₹${formattedMlRate}/ml)`;
                        if (rawQty > 0 && rawQty < 0.5) {
                          isMicroGramWarning = true;
                          microGramFixQty = Math.round(rawQty * 1000);
                        }
                      } else {
                        rateInfo = `₹${ingUnitCost}/L`;
                      }
                    } else {
                      rateInfo = `₹${ingUnitCost}/${stockUnit}`;
                    }
                  }

                  return (
                    <div key={idx} className="flex flex-col gap-1.5 bg-white p-2.5 sm:p-3 rounded-xl border border-stone-200 shadow-2xs">
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Select Raw Material or Custom Name */}
                        <div className="flex-1 min-w-0">
                          {ing.isCustom ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={ing.name}
                                onChange={(e) => handleUpdateRecipeIngredient(idx, 'name', e.target.value)}
                                placeholder="Ingredient name (e.g. Burger Buns)"
                                className="w-full px-2.5 py-1.5 text-xs font-bold bg-amber-50/50 border border-amber-300 rounded-lg focus:outline-none text-stone-900"
                              />
                              {inventoryItems.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRecipeIngredient(idx, 'ingredientId', inventoryItems[0].id)}
                                  className="text-[10px] text-stone-600 hover:text-stone-900 px-2 py-1.5 bg-stone-100 rounded border border-stone-200 shrink-0 cursor-pointer font-bold"
                                  title="Choose from existing stock list"
                                >
                                  Stock List
                                </button>
                              )}
                            </div>
                          ) : (
                            <select
                              value={matchedInv ? matchedInv.id : (ing.ingredientId || '')}
                              onChange={(e) => handleUpdateRecipeIngredient(idx, 'ingredientId', e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg focus:outline-none transition-all ${
                                !ing.ingredientId && !matchedInv
                                  ? 'bg-amber-50/80 border-2 border-amber-400 text-amber-900' 
                                  : 'bg-stone-50 border border-stone-300 text-stone-800'
                              }`}
                            >
                              <option value="">-- Select Raw Material ({inventoryItems.length} in Stock) --</option>
                              {inventoryItems.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  📦 {inv.materialName} ({inv.currentStock} {inv.unit} in stock • ₹{inv.unitCost}/{inv.unit})
                                </option>
                              ))}
                              <option value="custom">➕ Type New Raw Material Name (Custom)...</option>
                            </select>
                          )}
                        </div>

                        {/* Row for Quantity, Unit, Cost and Delete */}
                        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                          {/* Quantity */}
                          <div className="w-20 sm:w-24 shrink-0">
                            <input
                              type="number"
                              step="any"
                              value={ing.quantity}
                              onChange={(e) => handleUpdateRecipeIngredient(idx, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="w-full px-2.5 py-1.5 text-xs font-bold text-center bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                            />
                          </div>

                          {/* Unit */}
                          <div className="w-20 sm:w-24 shrink-0">
                            <select
                              value={ing.unit || (matchedInv ? matchedInv.unit : 'Piece')}
                              onChange={(e) => handleUpdateRecipeIngredient(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none text-stone-700"
                            >
                              {compatibleUnits.map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>

                          {/* Estimated Subtotal Cost */}
                          <div className="w-16 sm:w-20 shrink-0 text-right pr-1">
                            <span className="text-xs font-extrabold text-stone-800">₹{lineCost}</span>
                          </div>

                          {/* Delete Ingredient */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeIngredient(idx)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Remove ingredient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Helpful Live Rate Breakdown Strip */}
                      {matchedInv && (
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-stone-500 pt-1 border-t border-stone-100 px-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-stone-500">Stock Rate: <strong className="text-stone-700">{rateInfo}</strong></span>
                            {rawQty > 0 && (
                              <span className="text-amber-900 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {rawQty} {recipeUnit} = ₹{lineCost}
                              </span>
                            )}
                          </div>

                          {isMicroGramWarning && microGramFixQty > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateRecipeIngredient(idx, 'quantity', microGramFixQty)}
                              className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 cursor-pointer transition-colors"
                              title={`Click to set ${microGramFixQty} ${recipeUnit}`}
                            >
                              ⚠️ {rawQty} {recipeUnit} bohot kam hai! Click karein: <strong>{microGramFixQty} {recipeUnit}</strong>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Recipe Cost Summary Footer */}
                <div className="flex flex-wrap items-center justify-between pt-2 px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-medium">Calculated Recipe Cost:</span>
                    <span className="font-extrabold text-amber-900 text-sm">₹{roundedRecipeCost}</span>
                  </div>

                  {formData.sellingPrice && Number(formData.sellingPrice) > 0 && (
                    <div className="text-stone-500">
                      Margin: <strong className="text-emerald-700">
                        {Math.round(((Number(formData.sellingPrice) - roundedRecipeCost) / Number(formData.sellingPrice)) * 100)}%
                      </strong>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
            {editingItem && onDuplicate ? (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(editingItem);
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                title="Create a duplicate copy of this item and its recipe"
              >
                <Copy className="w-3.5 h-3.5 text-amber-700" />
                <span>Duplicate as New Item</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{editingItem ? 'Save Item & Recipe' : `Add Item to ${formData.category}`}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}



