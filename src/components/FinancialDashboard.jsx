import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PackageCheck, 
  ShoppingBag, 
  Calendar, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt,
  AlertOctagon,
  Zap,
  Home,
  Users,
  Flame,
  Wallet,
  FileSpreadsheet,
  Bike,
  Clock,
  Sparkles
} from 'lucide-react';
import { calculateAggregatorLedger } from '../utils/storage';

export default function FinancialDashboard({ 
  salesLogs = [], 
  procurementLogs = [], 
  menuItems = [], 
  inventoryItems = [],
  expenses = [],
  wastageLogs = [],
  settlements = [],
  onOpenExportModal,
  onOpenSettlementsModal
}) {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly', 'all'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Date filtering logic
  const filteredData = useMemo(() => {
    const now = new Date();
    
    let sales = [];
    let procurement = [];
    let activeExpenses = [];
    let activeWastage = [];

    if (timeframe === 'daily') {
      sales = salesLogs.filter(s => s.date === selectedDate);
      procurement = procurementLogs.filter(p => p.date === selectedDate);
      activeExpenses = expenses.filter(e => e.date === selectedDate);
      activeWastage = wastageLogs.filter(w => w.date === selectedDate);
    } else if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const minDateStr = sevenDaysAgo.toISOString().split('T')[0];
      
      sales = salesLogs.filter(s => s.date >= minDateStr);
      procurement = procurementLogs.filter(p => p.date >= minDateStr);
      activeExpenses = expenses.filter(e => e.date >= minDateStr);
      activeWastage = wastageLogs.filter(w => w.date >= minDateStr);
    } else if (timeframe === 'monthly') {
      const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM
      sales = salesLogs.filter(s => s.date.startsWith(currentYearMonth));
      procurement = procurementLogs.filter(p => p.date.startsWith(currentYearMonth));
      activeExpenses = expenses.filter(e => e.date && e.date.startsWith(currentYearMonth));
      activeWastage = wastageLogs.filter(w => w.date && w.date.startsWith(currentYearMonth));
    } else {
      sales = salesLogs;
      procurement = procurementLogs;
      activeExpenses = expenses;
      activeWastage = wastageLogs;
    }

    // Calculations
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalRevenue), 0);
    const cashRevenue = sales.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'cash' ? Number(s.totalRevenue) : 0);
    }, 0);
    const upiRevenue = sales.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'online' || mode === 'upi' ? Number(s.totalRevenue) : 0);
    }, 0);
    const swiggyRevenue = sales.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'swiggy' ? Number(s.totalRevenue) : 0);
    }, 0);
    const zomatoRevenue = sales.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'zomato' ? Number(s.totalRevenue) : 0);
    }, 0);
    const onlineRevenue = upiRevenue + swiggyRevenue + zomatoRevenue;
    
    // 1. Actual Raw Material Consumed (COGS) based on Recipe / Item Cost Price
    const actualMaterialConsumed = sales.reduce((sum, s) => {
      const matchedItem = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const costPerUnit = matchedItem && matchedItem.costPrice !== undefined ? Number(matchedItem.costPrice) : (Number(s.costPrice) || 0);
      return sum + (costPerUnit * (Number(s.quantitySold) || 1));
    }, 0);

    // 2. Gross Food Margin
    const grossProfit = totalRevenue - actualMaterialConsumed;
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 3. Operational Overhead Expenses (Electricity, Rent, Staff Salary, Gas, etc.)
    const totalOverheadExpenses = activeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 4. Raw Material Wastage / Spoilage Loss (Kharab Maal)
    const totalWastageLoss = activeWastage.reduce((sum, w) => sum + Number(w.costValue || 0), 0);

    // 5. 🏆 TRUE NET IN-HAND PROFIT (Asli Bachat)
    // Formula: Revenue - Food Cost - Overheads (Rent, Light, Salaries) - Wastage Loss
    const trueNetProfit = totalRevenue - actualMaterialConsumed - totalOverheadExpenses - totalWastageLoss;
    const trueNetMargin = totalRevenue > 0 ? ((trueNetProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 6. Procurement & Cash Flow Outflows
    const totalRawMaterialCost = procurement.reduce((sum, p) => sum + Number(p.totalCost), 0);
    const totalUnitsSold = sales.reduce((sum, s) => sum + Number(s.quantitySold), 0);
    const netCashFlow = totalRevenue - totalRawMaterialCost - totalOverheadExpenses;

    // 7. Current Stock Valuation (Asset in storage)
    const inventoryValuation = inventoryItems.reduce((sum, item) => sum + (Number(item.currentStock) * (Number(item.unitCost) || 0)), 0);

    // Category-wise expense breakdown
    const expenseBreakdown = {};
    activeExpenses.forEach(e => {
      const cat = e.category || 'Other';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + Number(e.amount || 0);
    });

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
      activeExpenses,
      activeWastage,
      totalRevenue,
      cashRevenue,
      upiRevenue,
      swiggyRevenue,
      zomatoRevenue,
      onlineRevenue,
      actualMaterialConsumed,
      grossProfit,
      grossMargin,
      totalOverheadExpenses,
      totalWastageLoss,
      trueNetProfit,
      trueNetMargin,
      totalRawMaterialCost,
      totalUnitsSold,
      netCashFlow,
      inventoryValuation,
      expenseBreakdown,
      topItems
    };
  }, [salesLogs, procurementLogs, menuItems, inventoryItems, expenses, wastageLogs, timeframe, selectedDate]);

  return (
    <div className="space-y-6">
      
      {/* Timeframe & Date Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-600" />
            Financial P&L, Bills & Profitability Summary
          </h3>
          <p className="text-xs text-stone-500">
            Real Net Profit = Sales Revenue − Raw Material COGS − Cafe Bills & Rent − Kharab Maal (Wastage).
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
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'daily' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'weekly' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'monthly' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Export to Excel Trigger */}
          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm border border-emerald-500/40 transition-all cursor-pointer shrink-0"
              title="Download Monthly / Weekly Excel Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Financial Metric Cards (6 Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Total Sales Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Sales Revenue (+)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-stone-900 mt-2">
            ₹{filteredData.totalRevenue.toLocaleString()}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-stone-100 text-[10px] font-bold">
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">💵 Cash: ₹{filteredData.cashRevenue.toLocaleString()}</span>
            <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">📱 UPI: ₹{filteredData.upiRevenue.toLocaleString()}</span>
            <span className="text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">🟠 Swiggy: ₹{filteredData.swiggyRevenue.toLocaleString()}</span>
            <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">🔴 Zomato: ₹{filteredData.zomatoRevenue.toLocaleString()}</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
        </div>

        {/* 2. Actual Material Consumed (COGS) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">Food Cost (COGS) (−)</span>
              <span className="text-[10px] text-amber-700 font-bold">From Recipe Ingredients</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-amber-800 mt-2">
            ₹{filteredData.actualMaterialConsumed.toLocaleString()}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Raw materials used for {filteredData.totalUnitsSold} items sold
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
        </div>

        {/* 3. Cafe Overheads & Bills (Rent, Light, Salaries) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">Bills & Rent (−)</span>
              <span className="text-[10px] text-purple-700 font-bold">Light, Rent, Salary, Gas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-purple-900 mt-2">
            ₹{filteredData.totalOverheadExpenses.toLocaleString()}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Total {filteredData.activeExpenses.length} expense/bill entries logged
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
        </div>

        {/* 4. Spoilage / Wastage Loss (Kharab Maal) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">Kharab Maal Loss (−)</span>
              <span className="text-[10px] text-rose-700 font-bold">Expired, Burnt, Spoiled</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-rose-700 mt-2">
            ₹{filteredData.totalWastageLoss.toLocaleString()}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Deducted from stock & recorded as loss
          </p>
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
        </div>

        {/* 5. 🏆 TRUE NET IN-HAND PROFIT (Asli Bachat) */}
        <div className={`rounded-2xl p-5 border shadow-md relative overflow-hidden ${
          filteredData.trueNetProfit >= 0
            ? 'bg-gradient-to-br from-emerald-950 to-stone-950 text-white border-emerald-800'
            : 'bg-gradient-to-br from-rose-950 to-stone-950 text-white border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              🏆 True Net Profit (Asli Munafa)
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              filteredData.trueNetProfit >= 0 ? 'bg-emerald-800 text-emerald-200' : 'bg-rose-800 text-rose-200'
            }`}>
              {filteredData.trueNetProfit >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <h3 className="text-3xl font-extrabold mt-2">
            {filteredData.trueNetProfit < 0 ? '-' : ''}₹{Math.abs(filteredData.trueNetProfit).toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-200/90 mt-1">
            After Food Cost, Bills, Rent & Wastage ({filteredData.trueNetMargin}% Net Margin)
          </p>
          <div className={`absolute top-0 right-0 w-2 h-full ${filteredData.trueNetProfit >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
        </div>

        {/* 6. Cash Flow & Storage Valuation */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-5 border border-stone-800 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Net Cash Flow & Assets</span>
            <div className="w-10 h-10 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Net Cash Inflow:</span>
              <span className={`font-extrabold ${filteredData.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {filteredData.netCashFlow >= 0 ? '+' : ''}₹{filteredData.netCashFlow.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Stock in Storage:</span>
              <span className="font-extrabold text-amber-300">₹{Math.round(filteredData.inventoryValuation).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-800">
              <span className="text-stone-400">Purchases:</span>
              <span className="font-bold text-stone-300">₹{filteredData.totalRawMaterialCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 🛵 AGGREGATOR (SWIGGY & ZOMATO) PAYOUT STATUS SECTION */}
      {(() => {
        const aggLedger = calculateAggregatorLedger(salesLogs, settlements);
        return (
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold shadow-lg shadow-amber-500/10">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-100 flex items-center gap-2">
                    <span>Swiggy & Zomato Online Ledger & Weekly Payouts</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-extrabold">
                      Receivable
                    </span>
                  </h4>
                  <p className="text-xs text-stone-400">
                    Track gross orders, commissions deducted & pending bank payouts
                  </p>
                </div>
              </div>

              {onOpenSettlementsModal && (
                <button
                  type="button"
                  onClick={onOpenSettlementsModal}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  Manage Payouts & Settlements
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Swiggy Box */}
              <div className="bg-stone-800/70 p-3.5 rounded-2xl border border-orange-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-orange-400 uppercase flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f48c06]"></span>
                    🟠 Swiggy
                  </span>
                  <span className="text-[10px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.5 rounded">
                    {aggLedger.Swiggy.totalOrdersCount} orders
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Pending Unsettled:</span>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    ₹{aggLedger.Swiggy.pendingUnsettled.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between border-t border-stone-700/60 pt-1.5">
                  <span>Gross: ₹{aggLedger.Swiggy.totalGross.toLocaleString()}</span>
                  <span>Bank Recd: ₹{aggLedger.Swiggy.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

              {/* Zomato Box */}
              <div className="bg-stone-800/70 p-3.5 rounded-2xl border border-rose-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-400 uppercase flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e5383b]"></span>
                    🔴 Zomato
                  </span>
                  <span className="text-[10px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.5 rounded">
                    {aggLedger.Zomato.totalOrdersCount} orders
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Pending Unsettled:</span>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    ₹{aggLedger.Zomato.pendingUnsettled.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between border-t border-stone-700/60 pt-1.5">
                  <span>Gross: ₹{aggLedger.Zomato.totalGross.toLocaleString()}</span>
                  <span>Bank Recd: ₹{aggLedger.Zomato.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

              {/* Total Pending with Aggregators */}
              <div className="bg-amber-950/40 p-3.5 rounded-2xl border border-amber-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-300 uppercase">
                    🏦 Total Unsettled Online
                  </span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="text-[10px] text-amber-200/80 uppercase font-semibold">Awaiting Bank Transfer:</span>
                  <div className="text-2xl font-black text-amber-300 mt-0.5">
                    ₹{aggLedger.overall.pendingUnsettled.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-amber-200/70 flex justify-between border-t border-amber-900/60 pt-1.5">
                  <span>Total Deductions: ₹{aggLedger.overall.totalCommission.toLocaleString()}</span>
                  <span>In Bank: ₹{aggLedger.overall.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}


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

        {/* Expense Category Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600" />
            Bills & Expenses Breakdown ({timeframe})
          </h4>

          {Object.keys(filteredData.expenseBreakdown).length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No bills or operational expenses logged for this timeframe.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(filteredData.expenseBreakdown).map(([cat, amount]) => {
                const percentage = filteredData.totalOverheadExpenses > 0
                  ? Math.round((amount / filteredData.totalOverheadExpenses) * 100)
                  : 0;

                return (
                  <div key={cat} className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-900">{cat}</span>
                      <span className="text-purple-900 font-extrabold">₹{amount.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Procurement Purchases */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-amber-600" />
            Raw Material Purchases ({timeframe})
          </h4>

          {filteredData.procurement.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No raw material purchases logged for this timeframe.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredData.procurement.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div>
                    <h5 className="text-sm font-bold text-stone-900">{p.materialName}</h5>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 font-semibold text-[10px]">{p.category}</span>
                      <span>Qty: {p.quantityReceived} {p.unit}</span>
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

        {/* Recent Spoilage / Wastage Log */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            Kharab Maal / Wastage Records ({timeframe})
          </h4>

          {filteredData.activeWastage.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">No wastage logged for this timeframe. Great job!</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {filteredData.activeWastage.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div>
                    <h5 className="text-sm font-bold text-stone-900">{w.ingredientName}</h5>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">{w.reason}</span>
                      <span>{w.quantity} {w.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-700">Loss: ₹{Number(w.costValue || 0).toLocaleString()}</span>
                    <span className="block text-[10px] text-stone-400">{w.date}</span>
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
