import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PackageCheck, ShoppingBag, Calendar, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FinancialDashboard({ salesLogs, procurementLogs, menuItems, inventoryItems = [] }) {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly', 'all'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Date filtering logic
  const filteredData = useMemo(() => {
    const now = new Date();
    
    let sales = [];
    let procurement = [];

    if (timeframe === 'daily') {
      sales = salesLogs.filter(s => s.date === selectedDate);
      procurement = procurementLogs.filter(p => p.date === selectedDate);
    } else if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const minDateStr = sevenDaysAgo.toISOString().split('T')[0];
      
      sales = salesLogs.filter(s => s.date >= minDateStr);
      procurement = procurementLogs.filter(p => p.date >= minDateStr);
    } else if (timeframe === 'monthly') {
      const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM
      sales = salesLogs.filter(s => s.date.startsWith(currentYearMonth));
      procurement = procurementLogs.filter(p => p.date.startsWith(currentYearMonth));
    } else {
      sales = salesLogs;
      procurement = procurementLogs;
    }

    // Calculations
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
    const cashRevenue = sales.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? 0 : Number(s.totalRevenue)), 0);
    const onlineRevenue = sales.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? Number(s.totalRevenue) : 0), 0);
    
    // Actual Raw Material Consumed (COGS) based on Recipe / Item Cost Price
    const actualMaterialConsumed = sales.reduce((sum, s) => {
      const matchedItem = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const costPerUnit = matchedItem && matchedItem.costPrice !== undefined ? Number(matchedItem.costPrice) : (Number(s.costPrice) || 0);
      return sum + (costPerUnit * (Number(s.quantitySold) || 1));
    }, 0);

    // Total Raw Material Procurement (Purchases / Cash Outflow)
    const totalRawMaterialCost = procurement.reduce((sum, p) => sum + Number(p.totalCost), 0);
    const totalUnitsSold = sales.reduce((sum, s) => sum + Number(s.quantitySold), 0);

    // 1. True Operating Profit = Sales Revenue - Actual Material Consumed (COGS)
    const actualProfit = totalRevenue - actualMaterialConsumed;
    const actualMargin = totalRevenue > 0 ? ((actualProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 2. Net Cash Flow = Revenue Inflow - Procurement Purchases Outflow
    const netCashFlow = totalRevenue - totalRawMaterialCost;

    // 3. Current Stock Valuation (Asset in storage)
    const inventoryValuation = inventoryItems.reduce((sum, item) => sum + (Number(item.currentStock) * (Number(item.unitCost) || 0)), 0);

    // Item sales breakdown
    const itemBreakdownMap = {};
    sales.forEach(s => {
      if (!itemBreakdownMap[s.itemName]) {
        itemBreakdownMap[s.itemName] = { name: s.itemName, qty: 0, revenue: 0, profit: 0 };
      }
      const matchedItem = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const costPerUnit = matchedItem && matchedItem.costPrice !== undefined ? Number(matchedItem.costPrice) : (Number(s.costPrice) || 0);
      const itemCostTotal = costPerUnit * Number(s.quantitySold);

      itemBreakdownMap[s.itemName].qty += Number(s.quantitySold);
      itemBreakdownMap[s.itemName].revenue += Number(s.totalRevenue);
      itemBreakdownMap[s.itemName].profit += (Number(s.totalRevenue) - itemCostTotal);
    });

    const topItems = Object.values(itemBreakdownMap).sort((a, b) => b.revenue - a.revenue);

    return {
      sales,
      procurement,
      totalRevenue,
      cashRevenue,
      onlineRevenue,
      actualMaterialConsumed,
      totalRawMaterialCost,
      totalUnitsSold,
      actualProfit,
      actualMargin,
      netCashFlow,
      inventoryValuation,
      topItems
    };
  }, [salesLogs, procurementLogs, menuItems, inventoryItems, timeframe, selectedDate]);

  return (
    <div className="space-y-6">
      
      {/* Timeframe & Date Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-600" />
            Financial P&L & Stock Control Summary
          </h3>
          <p className="text-xs text-stone-500">
            Real profit calculated from <strong>Actual Recipe Consumption (COGS)</strong> vs <strong>Purchases & Cash Flow</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {timeframe === 'daily' && (
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              <Calendar className="w-4 h-4 text-stone-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
              />
            </div>
          )}

          {/* Timeframe selector tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'daily' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'weekly' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'monthly' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeframe === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Sales Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-stone-900 mt-2">
            ₹{filteredData.totalRevenue.toLocaleString()}
          </h3>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 text-[11px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">💵 Cash: ₹{filteredData.cashRevenue.toLocaleString()}</span>
            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">📱 Online: ₹{filteredData.onlineRevenue.toLocaleString()}</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
        </div>

        {/* Actual Material Consumed (COGS) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">Material Consumed (COGS)</span>
              <span className="text-[10px] text-amber-700 font-bold">From Recipe Usage</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-amber-800 mt-2">
            ₹{filteredData.actualMaterialConsumed.toLocaleString()}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Raw material used for {filteredData.totalUnitsSold} items sold
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        </div>

        {/* 🏆 True Operating Profit */}
        <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${
          filteredData.actualProfit >= 0
            ? 'bg-emerald-950 text-white border-emerald-900'
            : 'bg-rose-950 text-white border-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Actual Operating Profit
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              filteredData.actualProfit >= 0 ? 'bg-emerald-800 text-emerald-200' : 'bg-rose-800 text-rose-200'
            }`}>
              {filteredData.actualProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <h3 className="text-3xl font-extrabold mt-2">
            ₹{Math.abs(filteredData.actualProfit).toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-200/80 mt-1">
            Revenue − Consumed Material ({filteredData.actualMargin}% Margin)
          </p>
        </div>

        {/* Purchases & Cash Flow Card */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 border border-stone-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Purchases & Cash Flow</span>
            <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Purchases:</span>
              <span className="font-bold text-rose-300">₹{filteredData.totalRawMaterialCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Net Cash Flow:</span>
              <span className={`font-extrabold ${filteredData.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {filteredData.netCashFlow >= 0 ? '+' : ''}₹{filteredData.netCashFlow.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-800">
              <span className="text-stone-400">Stock in Storage:</span>
              <span className="font-extrabold text-amber-300">₹{Math.round(filteredData.inventoryValuation).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Detailed Tables & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Sold Items Ranking */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            Sales Revenue by Item ({timeframe})
          </h4>

          {filteredData.topItems.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No sales logged for this timeframe.</p>
          ) : (
            <div className="space-y-3">
              {filteredData.topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-amber-200 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-stone-900">{item.name}</h5>
                      <span className="text-xs text-stone-500">{item.qty} units sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-900">₹{item.revenue.toLocaleString()}</span>
                    <span className="block text-[11px] text-emerald-700 font-semibold">Margin: ₹{item.profit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Procurement Expense Summary */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-amber-600" />
            Raw Material Purchases ({timeframe})
          </h4>

          {filteredData.procurement.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No raw material procurements logged for this timeframe.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredData.procurement.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <h5 className="text-sm font-bold text-stone-900">{p.materialName}</h5>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-semibold text-[10px]">{p.category}</span>
                      <span>Qty: {p.quantityReceived} {p.unit}</span>
                      {p.supplier && <span>• {p.supplier}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-700">₹{Number(p.totalCost).toLocaleString()}</span>
                    <span className="block text-[10px] text-stone-400">{p.date}</span>
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
