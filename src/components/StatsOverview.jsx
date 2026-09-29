import React from 'react';
import { Package, CheckCircle2, Layers, TrendingUp } from 'lucide-react';

export default function StatsOverview({ items }) {
  const totalItems = items.length;
  const availableItems = items.filter(i => i.isAvailable).length;
  const unavailableItems = totalItems - availableItems;
  
  const categories = [...new Set(items.map(i => i.category))].length;

  const avgProfitMargin = items.length > 0
    ? Math.round(
        items.reduce((acc, curr) => {
          const margin = curr.sellingPrice > 0 ? ((curr.sellingPrice - curr.costPrice) / curr.sellingPrice) * 100 : 0;
          return acc + margin;
        }, 0) / items.length
      )
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Total Items */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Items</p>
          <h3 className="text-2xl font-extrabold text-stone-900 mt-1 group-hover:text-amber-700 transition-colors">{totalItems}</h3>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center shadow-inner">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* Available Items */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Available Status</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-extrabold text-emerald-700">{availableItems}</h3>
            {unavailableItems > 0 && (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                {unavailableItems} Disabled
              </span>
            )}
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* Categories Count */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Menu Categories</p>
          <h3 className="text-2xl font-extrabold text-stone-900 mt-1">{categories}</h3>
        </div>
        <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center shadow-inner">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* Average Profit Margin */}
      <div className="bg-white rounded-2xl p-4 border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
        <div>
          <p className="text-[11px] font-bold text-amber-800/70 uppercase tracking-wider">Avg Profit Margin</p>
          <h3 className="text-2xl font-extrabold text-amber-900 mt-1">{avgProfitMargin}%</h3>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
}
