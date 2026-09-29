import React, { useState } from 'react';
import { Utensils, Plus, Trash2, DollarSign, PieChart, Layers, Tag, Box } from 'lucide-react';
import { calculateRecipeFinancials } from '../utils/inventoryEngine';

export default function RecipeBOMManager({
  menuItems,
  recipesMap,
  subRecipesMap,
  inventoryMaster,
  onSaveRecipe
}) {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(menuItems[0]?.id || '');
  
  // Ingredient addition form state
  const [selectedIngredientId, setSelectedIngredientId] = useState(inventoryMaster[0]?.id || '');
  const [quantityNeeded, setQuantityNeeded] = useState('');

  const selectedMenuItem = menuItems.find(m => m.id === selectedMenuItemId) || menuItems[0];
  const inventoryMap = {};
  inventoryMaster.forEach(i => { inventoryMap[i.id] = i; });

  const currentRecipeList = recipesMap[selectedMenuItemId] || [];

  // Calculate live recipe financials
  const financials = calculateRecipeFinancials(
    selectedMenuItem || { sellingPrice: 0 },
    recipesMap,
    subRecipesMap,
    inventoryMap
  );

  const handleAddIngredientToRecipe = (e) => {
    e.preventDefault();
    if (!selectedMenuItem || !selectedIngredientId || !quantityNeeded || Number(quantityNeeded) <= 0) return;

    const invItem = inventoryMap[selectedIngredientId];
    if (!invItem) return;

    const newIngredient = {
      ingredientId: invItem.id,
      name: invItem.materialName,
      quantity: Number(quantityNeeded),
      unit: invItem.consumptionUnit || invItem.unit || 'GRAM',
      isSubRecipe: false
    };

    // Remove if already exists, then add
    const updatedRecipe = [
      ...currentRecipeList.filter(i => i.ingredientId !== invItem.id),
      newIngredient
    ];

    onSaveRecipe(selectedMenuItemId, updatedRecipe);
    setQuantityNeeded('');
  };

  const handleRemoveIngredient = (ingredientId) => {
    const updatedRecipe = currentRecipeList.filter(i => i.ingredientId !== ingredientId);
    onSaveRecipe(selectedMenuItemId, updatedRecipe);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Menu Item Selector & Financial Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              Bill of Materials (BOM) & Recipe Costing
            </h3>
            <p className="text-xs text-stone-500">
              Map ingredients & packaging items to menu products for automatic POS stock deduction and food cost analysis.
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">Select Menu Item</label>
            <select
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} — Selling Price: ₹{item.sellingPrice}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Recipe Summary Banner */}
        {selectedMenuItem && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-stone-200">
            
            <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-100">
              <span className="text-xs text-stone-500 block font-semibold">Selling Price</span>
              <span className="text-2xl font-extrabold text-amber-900">₹{selectedMenuItem.sellingPrice}</span>
            </div>

            <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200">
              <span className="text-xs text-stone-500 block font-semibold">Calculated Recipe Cost</span>
              <span className="text-2xl font-extrabold text-stone-900">₹{financials.recipeCost}</span>
            </div>

            <div className={`rounded-xl p-3.5 border ${
              financials.foodCostPercent <= 35 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <span className="text-xs block font-semibold">Food Cost %</span>
              <span className="text-2xl font-extrabold">{financials.foodCostPercent}%</span>
            </div>

            <div className="bg-emerald-900 text-white rounded-xl p-3.5 border border-emerald-950">
              <span className="text-xs text-emerald-200 block font-semibold">Gross Profit per Item</span>
              <span className="text-2xl font-extrabold">₹{financials.grossProfit}</span>
            </div>

          </div>
        )}
      </div>

      {/* Add Ingredient to Recipe & Ingredients List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Ingredient Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Add Ingredient / Packaging
          </h4>

          <form onSubmit={handleAddIngredientToRecipe} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Raw Material or Packaging *
              </label>
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
              >
                {inventoryMaster.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.materialName} ({inv.category}) — {inv.consumptionUnit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Consumption Quantity per Dish *
              </label>
              <input
                type="number"
                step="any"
                required
                min="0.001"
                value={quantityNeeded}
                onChange={(e) => setQuantityNeeded(e.target.value)}
                placeholder="e.g. 80 (g), 250 (ml), 1 (pc)"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              + Add to Recipe BOM
            </button>
          </form>
        </div>

        {/* Recipe BOM Ingredients Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
            Recipe BOM Ingredients Breakdown for "{selectedMenuItem?.name}"
          </h4>

          {financials.ingredients.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">No ingredients or packaging mapped to this item yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Ingredient / Packaging Item</th>
                    <th className="py-3 px-4 text-center">Qty Consumed</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Ingredient Cost</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  {financials.ingredients.map(ing => {
                    const lineCost = Math.round(ing.quantity * ing.unitCost * 100) / 100;
                    return (
                      <tr key={ing.ingredientId} className="hover:bg-amber-50/40">
                        <td className="py-3 px-4 font-bold text-stone-900">
                          {ing.name}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-stone-900">
                          {ing.quantity} <span className="text-xs text-stone-500 font-normal">{ing.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-stone-500">
                          ₹{Math.round(ing.unitCost * 100) / 100} / {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-amber-900">
                          ₹{lineCost}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleRemoveIngredient(ing.ingredientId)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove ingredient"
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
          )}
        </div>

      </div>

    </div>
  );
}
