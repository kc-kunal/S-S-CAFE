import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle, Tag, Coffee, Check, X, DollarSign, AlertCircle } from 'lucide-react';
import { checkItemStock } from '../utils/storage';

export default function ItemCards({ items, inventoryItems = [], onEdit, onDelete, onToggleStatus, onSaveItem }) {
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [quickPrices, setQuickPrices] = useState({ sellingPrice: '', costPrice: '' });

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <Coffee className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">No items found</h3>
        <p className="text-sm text-stone-500 mt-1">
          Try adding a new menu item.
        </p>
      </div>
    );
  }

  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items]);

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
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, catItems]) => (
        <div key={category} className="space-y-3">
          
          {/* Category Section Header */}
          <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <h3 className="text-base font-extrabold text-stone-900 tracking-wide uppercase">
              {category} <span className="text-xs text-stone-400 font-medium">({catItems.length} items)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catItems.map((item) => {
              const isInlineEditing = editingPriceId === item.id;
              const curSell = isInlineEditing ? Number(quickPrices.sellingPrice) || 0 : item.sellingPrice;
              const curCost = isInlineEditing ? Number(quickPrices.costPrice) || 0 : item.costPrice;
              const profit = curSell - curCost;
              const marginPercent = curSell > 0 ? Math.round((profit / curSell) * 100) : 0;
              const stockStatus = checkItemStock(item, inventoryItems);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between shadow-sm hover:shadow-md ${
                    !item.isAvailable
                      ? 'border-stone-200 bg-stone-50/70 opacity-80'
                      : stockStatus.isOutOfStock
                      ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                      : 'border-stone-200/90 hover:border-amber-400/50'
                  }`}
                >
                  <div>
                    {/* Card Header: Category & Stock Badges */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                        <Tag className="w-3 h-3 text-amber-700" />
                        {item.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {stockStatus.isOutOfStock ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200"
                            title={stockStatus.missing.map(m => m.name).join(', ')}
                          >
                            🚫 Out of Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ {stockStatus.maxPortions} in stock
                          </span>
                        )}

                        <button
                          onClick={() => onToggleStatus(item.id)}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                            item.isAvailable
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
                          }`}
                          title={item.isAvailable ? 'Click to Disable' : 'Click to Enable'}
                        >
                          {item.isAvailable ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>

                    {/* Title & Unit */}
                    <div className="mb-2">
                      <h4 className={`text-base font-bold text-stone-900 ${!item.isAvailable ? 'line-through text-stone-400' : ''}`}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Unit: <span className="font-medium text-stone-700">{item.unit}</span>
                      </p>
                    </div>

                    {/* 🥣 Recipe Ingredients Summary or No Recipe Warning */}
                    {item.recipe && item.recipe.length > 0 ? (
                      <div className="mb-3 px-2.5 py-1.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-stone-700">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-amber-900">🥣 Raw Material Recipe:</span>
                          <span className="text-[10px] text-stone-500 font-semibold">{item.recipe.length} ingredients</span>
                        </div>
                        <p className="text-[10px] text-stone-600 font-medium truncate" title={item.recipe.map(r => `${r.quantity} ${r.unit} ${r.name}`).join(' + ')}>
                          {item.recipe.map(r => `${r.quantity} ${r.unit} ${r.name}`).join(' + ')}
                        </p>
                        {stockStatus.isOutOfStock && stockStatus.missing && stockStatus.missing.length > 0 && (
                          <p className="text-[9px] font-extrabold text-rose-600 mt-1 truncate">
                            Missing in stock: {stockStatus.missing.map(m => m.name).join(', ')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                        <span className="font-semibold text-[10px]">⚠️ No Recipe (Out of Stock)</span>
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="text-[10px] font-extrabold text-amber-800 underline hover:text-amber-950 cursor-pointer"
                        >
                          + Add Recipe
                        </button>
                      </div>
                    )}

                    {/* Price Details / Inline Price Editor */}
                    {isInlineEditing ? (
                      <div className="bg-amber-50 rounded-2xl p-3 border-2 border-amber-500 mb-4 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                          <span>✏️ Edit Prices</span>
                          <span className="text-emerald-700 font-extrabold">Profit: ₹{profit}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 uppercase">Selling Price (₹)</label>
                            <input
                              type="number"
                              value={quickPrices.sellingPrice}
                              onChange={(e) => setQuickPrices({ ...quickPrices, sellingPrice: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-sm font-extrabold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              autoFocus
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-stone-600 uppercase">Cost Price (₹)</label>
                            <input
                              type="number"
                              value={quickPrices.costPrice}
                              onChange={(e) => setQuickPrices({ ...quickPrices, costPrice: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-sm font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="px-2.5 py-1 text-xs font-semibold text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveQuickPrice(item)}
                            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Price</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60 mb-4 flex items-center justify-between group hover:border-amber-300 transition-colors">
                        <div>
                          <span className="block text-xs text-stone-500">Selling Price</span>
                          <span className="text-lg font-bold text-amber-900">₹{item.sellingPrice}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs text-stone-500">Cost Price</span>
                          <span className="text-sm font-semibold text-stone-600">₹{item.costPrice}</span>
                        </div>
                        <div className="text-right pl-2 border-l border-amber-200/60">
                          <button
                            onClick={() => handleStartQuickEdit(item)}
                            className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            title="Quick Edit Selling & Cost Price"
                          >
                            ✏️ Edit Price
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => onEdit(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Full Edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ))}
    </div>
  );
}

