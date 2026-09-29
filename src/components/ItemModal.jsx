import React, { useState, useEffect } from 'react';
import { X, Check, Coffee, Tag, Plus, Trash2, Layers, Calculator, Sparkles, AlertTriangle } from 'lucide-react';

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

export default function ItemModal({ isOpen, onClose, onSave, editingItem, existingCategories = [], inventoryItems = [] }) {
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
        isAvailable: true
      });
      setRecipe([]);
      setIsCustomCat(false);
      setCustomCategory('');
    }
    setErrors({});
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Recipe helpers
  const handleAddRecipeIngredient = () => {
    const defaultInv = inventoryItems[0];
    const newIngredient = {
      ingredientId: defaultInv ? defaultInv.id : `custom-${Date.now()}`,
      name: defaultInv ? defaultInv.materialName : '',
      quantity: 1,
      unit: defaultInv ? defaultInv.unit : 'Piece',
      isCustom: !defaultInv
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
          isCustom: true
        };
      } else {
        const selectedInv = inventoryItems.find(i => i.id === value);
        if (selectedInv) {
          updated[index] = {
            ...updated[index],
            ingredientId: selectedInv.id,
            name: selectedInv.materialName,
            unit: selectedInv.unit,
            isCustom: false
          };
        }
      }
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

  // Compute live recipe cost
  const totalRecipeCost = recipe.reduce((sum, item) => {
    const matchedInv = inventoryItems.find(i => i.id === item.ingredientId || i.materialName.toLowerCase() === (item.name || '').toLowerCase());
    const unitRate = matchedInv ? (Number(matchedInv.unitCost) || 0) : 0;
    return sum + (Number(item.quantity) || 0) * unitRate;
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

    // Filter valid recipe ingredients
    const cleanedRecipe = recipe
      .filter(r => r.name && r.name.trim() && Number(r.quantity) > 0)
      .map(r => ({
        ingredientId: r.ingredientId || `custom-${Date.now()}`,
        name: r.name.trim(),
        quantity: Number(r.quantity),
        unit: r.unit || 'Piece'
      }));

    const itemToSave = {
      id: editingItem ? editingItem.id : undefined,
      name: formData.name.trim(),
      category: finalCategory,
      sellingPrice: Number(formData.sellingPrice),
      costPrice: Number(formData.costPrice),
      unit: formData.unit.trim(),
      isAvailable: formData.isAvailable,
      recipe: cleanedRecipe
    };

    onSave(itemToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-stone-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-amber-100">
                {editingItem ? 'Edit Menu Item & Recipe' : 'Add New Menu Item & Recipe'}
              </h2>
              <p className="text-xs text-stone-400">Configure item details and raw material consumption</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
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

          {/* 🥘 RECIPE / RAW MATERIAL INGREDIENTS SECTION */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Recipe Ingredients (Raw Material Auto-Deduction)</span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Whenever this item is sold, these raw materials are automatically deducted from stock.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRecipeIngredient}
                className="self-start sm:self-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Ingredient</span>
              </button>
            </div>

            {/* Ingredients Table / Empty State */}
            {recipe.length === 0 ? (
              <div className="p-4 text-center text-xs bg-amber-50/70 rounded-2xl border-2 border-dashed border-amber-300/80 space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Recipe Ingredients Add Nahi Hain</span>
                </div>
                <p className="text-[11px] text-stone-600 max-w-md mx-auto">
                  ⚠️ <strong>Zaroori:</strong> Bina recipe raw material ke ye item <strong>Out of Stock</strong> dikhega. Kripya niche button par click karke raw material add karein (jaise: 1 Burger Bun, 1 Patty).
                </p>
                <button
                  type="button"
                  onClick={handleAddRecipeIngredient}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-amber-500 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Raw Material Ingredient</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recipe.map((ing, idx) => {
                  const matchedInv = inventoryItems.find(
                    i => i.id === ing.ingredientId || (i.materialName && ing.name && i.materialName.toLowerCase() === ing.name.toLowerCase())
                  );
                  const ingUnitCost = matchedInv ? (Number(matchedInv.unitCost) || 0) : 0;
                  const lineCost = Math.round((Number(ing.quantity) || 0) * ingUnitCost * 100) / 100;

                  return (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                      
                      {/* Select Raw Material or Custom Name */}
                      <div className="flex-1 min-w-[150px]">
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
                                className="text-[10px] text-stone-600 hover:text-stone-900 px-1.5 py-1 bg-stone-100 rounded border border-stone-200 shrink-0 cursor-pointer"
                                title="Choose from existing inventory"
                              >
                                List
                              </button>
                            )}
                          </div>
                        ) : (
                          <select
                            value={ing.ingredientId || ''}
                            onChange={(e) => handleUpdateRecipeIngredient(idx, 'ingredientId', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none text-stone-800"
                          >
                            <option value="">Select Raw Material</option>
                            {inventoryItems.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.materialName} ({inv.currentStock} {inv.unit} in stock • ₹{inv.unitCost}/{inv.unit})
                              </option>
                            ))}
                            <option value="custom">➕ Type New Raw Material Name...</option>
                          </select>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-24 shrink-0">
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
                      <div className="w-24 shrink-0">
                        <select
                          value={ing.unit || 'Piece'}
                          onChange={(e) => handleUpdateRecipeIngredient(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none text-stone-700"
                        >
                          {INGREDIENT_UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Subtotal Cost */}
                      <div className="w-20 shrink-0 text-right pr-1">
                        <span className="text-xs font-extrabold text-stone-700">₹{lineCost}</span>
                      </div>

                      {/* Delete Ingredient */}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipeIngredient(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

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
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Save Item & Recipe' : `Add Item to ${formData.category}`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}



