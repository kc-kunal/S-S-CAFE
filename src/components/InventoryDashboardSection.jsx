import React from 'react';
import { Package, AlertTriangle, XCircle, TrendingDown, ShoppingBag, PackageCheck, History, DollarSign } from 'lucide-react';

export default function InventoryDashboardSection({
  inventoryMaster,
  stockLedger,
  wastageLogs,
  procurementLogs
}) {
  const totalValuation = inventoryMaster.reduce((sum, i) => sum + (i.currentStock * (i.unitCost || (i.purchaseRate / (i.conversionFactor || 1)) || 0)), 0);
  const lowStockItems = inventoryMaster.filter(i => i.currentStock > 0 && i.currentStock <= (i.minimumStock || 0));
  const outOfStockItems = inventoryMaster.filter(i => i.currentStock <= 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayConsumption = stockLedger
    .filter(l => l.date === todayStr && (l.transactionType === 'POS_SALE' || l.transactionType === 'WASTAGE'))
    .reduce((sum, l) => sum + (l.totalValue || 0), 0);

  const todayPurchases = procurementLogs
    .filter(p => p.date === todayStr)
    .reduce((sum, p) => sum + Number(p.totalCost), 0);

  const todayWastageCost = wastageLogs
    .filter(w => w.date === todayStr)
    .reduce((sum, w) => sum + (w.costValue || 0), 0);

  const recentMovements = stockLedger.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase">Total Stock Valuation</span>
          <h3 className="text-3xl font-extrabold text-stone-900 mt-1">₹{Math.round(totalValuation).toLocaleString()}</h3>
          <p className="text-xs text-stone-500 mt-1">{inventoryMaster.length} inventory items</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase">Low Stock Alerts</span>
          <h3 className="text-3xl font-extrabold text-amber-700 mt-1">{lowStockItems.length}</h3>
          <p className="text-xs text-stone-500 mt-1">Below minimum threshold</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-400 uppercase">Out of Stock Alerts</span>
          <h3 className="text-3xl font-extrabold text-rose-700 mt-1">{outOfStockItems.length}</h3>
          <p className="text-xs text-stone-500 mt-1">Items at 0 balance</p>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-2xl p-5 border border-amber-600 shadow-sm">
          <span className="text-xs font-bold text-amber-200 uppercase">Today's Consumption Value</span>
          <h3 className="text-3xl font-extrabold mt-1">₹{Math.round(todayConsumption).toLocaleString()}</h3>
          <p className="text-xs text-amber-200 mt-1">Purchases: ₹{todayPurchases} • Wastage: ₹{todayWastageCost}</p>
        </div>

      </div>

      {/* Grid: Low Stock Alert List & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Low Stock Items List */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Low & Out of Stock Alert Items
          </h4>

          {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">All inventory items are currently at healthy stock levels!</p>
          ) : (
            <div className="space-y-3">
              {[...outOfStockItems, ...lowStockItems].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div>
                    <h5 className="text-sm font-bold text-stone-900">{item.materialName}</h5>
                    <span className="text-xs text-stone-500">Category: {item.category} • Min Threshold: {item.minimumStock} {item.consumptionUnit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-stone-900 block">{item.currentStock} {item.consumptionUnit}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.currentStock <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {item.currentStock <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Ledger Movements */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            Recent Stock Movements (Ledger)
          </h4>

          {recentMovements.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No recent stock movements recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentMovements.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 block">{m.ingredientName}</span>
                    <span className="text-stone-400">{m.date} • Ref: {m.transactionId}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${m.stockIn > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.stockIn > 0 ? `+${m.stockIn}` : `-${m.stockOut || m.wastage || 0}`}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800">{m.transactionType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
