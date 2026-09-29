import React, { useState } from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle, TrendingUp, Check, X } from 'lucide-react';
import { checkItemStock } from '../utils/storage';

export default function ItemTable({ items, inventoryItems = [], onEdit, onDelete, onToggleStatus, onSaveItem }) {
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [quickPrices, setQuickPrices] = useState({ sellingPrice: '', costPrice: '' });

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">No items found</h3>
        <p className="text-sm text-stone-500 mt-1">
          Try adjusting your search filter or add a new menu item.
        </p>
      </div>
    );
  }

  const handleStartQuickEdit = (item) => {
    setEditingPriceId(item.id);
    setQuickPrices({ sellingPrice: item.sellingPrice, costPrice: item.costPrice });
  };

  const handleSaveQuickPrice = (item) => {
    const newSell = Number(quickPrices.sellingPrice);
    const newCost = Number(quickPrices.costPrice);

    if (isNaN(newSell) || newSell <= 0) return;
    if (isNaN(newCost) || newCost < 0) return;

    if (onSaveItem) {
      onSaveItem({
        ...item,
        sellingPrice: newSell,
        costPrice: newCost
      });
    }
    setEditingPriceId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-900 text-amber-100 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Item Name</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 text-right">Selling Price</th>
              <th className="py-3.5 px-4 text-right">Cost Price</th>
              <th className="py-3.5 px-4 text-right">Margin</th>
              <th className="py-3.5 px-4 text-center">Unit</th>
              <th className="py-3.5 px-4 text-center">Stock Status</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80 text-sm text-stone-700">
            {items.map((item) => {
              const isEditing = editingPriceId === item.id;
              const curSell = isEditing ? Number(quickPrices.sellingPrice) || 0 : item.sellingPrice;
              const curCost = isEditing ? Number(quickPrices.costPrice) || 0 : item.costPrice;
              const profit = curSell - curCost;
              const marginPercent = curSell > 0 ? Math.round((profit / curSell) * 100) : 0;
              const stockStatus = checkItemStock(item, inventoryItems);

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-amber-50/40 transition-colors ${
                    !item.isAvailable ? 'bg-stone-50/80 text-stone-400' : ''
                  }`}
                >
                  {/* Item Name */}
                  <td className="py-3.5 px-4 font-semibold text-stone-900">
                    <div className="flex items-center space-x-2">
                      <span className={!item.isAvailable ? 'line-through text-stone-400' : ''}>
                        {item.name}
                      </span>
                      {(!item.recipe || item.recipe.length === 0) && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          No Recipe
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                      {item.category}
                    </span>
                  </td>

                  {/* Selling Price */}
                  <td className="py-3.5 px-4 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={quickPrices.sellingPrice}
                        onChange={(e) => setQuickPrices({ ...quickPrices, sellingPrice: e.target.value })}
                        className="w-20 px-2 py-1 bg-white border border-amber-500 rounded-lg text-xs font-extrabold text-amber-900 text-right focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-amber-800">₹{item.sellingPrice}</span>
                    )}
                  </td>

                  {/* Cost Price */}
                  <td className="py-3.5 px-4 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={quickPrices.costPrice}
                        onChange={(e) => setQuickPrices({ ...quickPrices, costPrice: e.target.value })}
                        className="w-20 px-2 py-1 bg-white border border-stone-400 rounded-lg text-xs font-semibold text-stone-700 text-right focus:outline-none"
                      />
                    ) : (
                      <span className="text-stone-500 font-medium">₹{item.costPrice}</span>
                    )}
                  </td>

                  {/* Profit Margin */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                        marginPercent >= 50
                          ? 'bg-emerald-100 text-emerald-800'
                          : marginPercent >= 20
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {marginPercent}% (₹{profit})
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="py-3.5 px-4 text-center text-xs text-stone-500">
                    {item.unit}
                  </td>

                  {/* Stock Status */}
                  <td className="py-3.5 px-4 text-center">
                    {stockStatus.isOutOfStock ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"
                        title={stockStatus.missing.map(m => m.name).join(', ')}
                      >
                        🚫 Out of Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ {stockStatus.maxPortions} in stock
                      </span>
                    )}
                  </td>

                  {/* Availability Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onToggleStatus(item.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        item.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                      title={item.isAvailable ? 'Click to Disable' : 'Click to Enable'}
                    >
                      {item.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-stone-500" />
                          <span>Not Available</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleSaveQuickPrice(item)}
                          className="p-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
                          title="Save Prices"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleStartQuickEdit(item)}
                          className="px-2 py-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md cursor-pointer"
                          title="Quick Price Edit"
                        >
                          ✏️ Price
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-100/70 rounded-lg transition-colors"
                          title="Full Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-100/70 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
