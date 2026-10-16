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
  Flame,
  Wallet,
  FileSpreadsheet,
  Bike,
  Clock,
  Sparkles,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Percent,
  Layers,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Smartphone,
  CreditCard,
  BookOpen,
  Target,
  Users
} from 'lucide-react';
import {
  calculateAggregatorLedger,
  getTodayDateString,
  shiftDateStr,
  classifySalePaymentMethod,
  getUniqueOrderCount,
  classifyMaterialProcurementType
} from '../utils/storage';

export default function FinancialDashboard({
  salesLogs = [],
  procurementLogs = [],
  menuItems = [],
  inventoryItems = [],
  expenses = [],
  wastageLogs = [],
  settlements = [],
  onOpenExportModal,
  onOpenSettlementsModal,
  isStaffMode = false,
  onPromptUnlock
}) {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly', 'all'
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString(0));
  const [topItemsSort, setTopItemsSort] = useState('qty'); // 'qty' or 'revenue'
  const [activeBottomTab, setActiveBottomTab] = useState('purchases'); // 'purchases' | 'expenses' | 'wastage'

  // Date Navigation Helpers for Daily View (Timezone-safe calendar math)
  const handlePrevDay = () => {
    setSelectedDate(prev => shiftDateStr(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => shiftDateStr(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString(0));
  };

  const isToday = selectedDate === getTodayDateString(0);

  // Date filtering logic & Calculations
  const filteredData = useMemo(() => {
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
      const minDateStr = shiftDateStr(getTodayDateString(0), -7);
      sales = salesLogs.filter(s => s.date >= minDateStr);
      procurement = procurementLogs.filter(p => p.date >= minDateStr);
      activeExpenses = expenses.filter(e => e.date >= minDateStr);
      activeWastage = wastageLogs.filter(w => w.date >= minDateStr);
    } else if (timeframe === 'monthly') {
      const currentYearMonth = getTodayDateString(0).slice(0, 7); // YYYY-MM
      sales = salesLogs.filter(s => s.date && s.date.startsWith(currentYearMonth));
      procurement = procurementLogs.filter(p => p.date && p.date.startsWith(currentYearMonth));
      activeExpenses = expenses.filter(e => e.date && e.date.startsWith(currentYearMonth));
      activeWastage = wastageLogs.filter(w => w.date && w.date.startsWith(currentYearMonth));
    } else {
      sales = salesLogs;
      procurement = procurementLogs;
      activeExpenses = expenses;
      activeWastage = wastageLogs;
    }

    // Calculations
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const totalOrdersCount = getUniqueOrderCount(sales);
    const totalUnitsSold = sales.reduce((sum, s) => sum + Number(s.quantitySold || 1), 0);
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    // Channel-wise Breakdown (100% Reconciled Across Cash, UPI, Swiggy, Zomato, Khata)
    const cashSales = sales.filter(s => classifySalePaymentMethod(s) === 'cash');
    const cashRevenue = cashSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const cashOrdersCount = getUniqueOrderCount(cashSales);

    const upiSales = sales.filter(s => classifySalePaymentMethod(s) === 'upi');
    const upiRevenue = upiSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const upiOrdersCount = getUniqueOrderCount(upiSales);

    const swiggySales = sales.filter(s => classifySalePaymentMethod(s) === 'swiggy');
    const swiggyRevenue = swiggySales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const swiggyOrdersCount = getUniqueOrderCount(swiggySales);

    const zomatoSales = sales.filter(s => classifySalePaymentMethod(s) === 'zomato');
    const zomatoRevenue = zomatoSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const zomatoOrdersCount = getUniqueOrderCount(zomatoSales);

    const khataSales = sales.filter(s => classifySalePaymentMethod(s) === 'khata');
    const khataRevenue = khataSales.reduce((sum, s) => sum + Number(s.totalRevenue || 0), 0);
    const khataOrdersCount = getUniqueOrderCount(khataSales);

    const onlineRevenue = upiRevenue + swiggyRevenue + zomatoRevenue;
    const aggregatorRevenue = swiggyRevenue + zomatoRevenue;
    const aggregatorOrdersCount = swiggyOrdersCount + zomatoOrdersCount;

    // 1. Actual Raw Material Consumed (COGS) based on Recipe / Item Cost Price
    const actualMaterialConsumed = sales.reduce((sum, s) => {
      const matchedItem = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const costPerUnit = matchedItem && matchedItem.costPrice !== undefined ? Number(matchedItem.costPrice) : (Number(s.costPrice) || 0);
      return sum + (costPerUnit * (Number(s.quantitySold) || 1));
    }, 0);

    // 2. Gross Food Margin
    const grossProfit = totalRevenue - actualMaterialConsumed;
    const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
    const foodCostPercentage = totalRevenue > 0 ? Math.round((actualMaterialConsumed / totalRevenue) * 100) : 0;

    // 3. Operational Overhead Expenses (Electricity, Rent, Staff Salary, Gas, Ice, etc.)
    // REALITY PRINCIPLE: Expenses show ONLY when actually paid by the user!
    const totalOverheadExpenses = activeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const overheadPercentage = totalRevenue > 0 ? Math.round((totalOverheadExpenses / totalRevenue) * 100) : 0;

    // 4. Raw Material Wastage / Spoilage Loss (Kharab Maal)
    const totalWastageLoss = activeWastage.reduce((sum, w) => sum + Number(w.costValue || 0), 0);
    const wastagePercentage = totalRevenue > 0 ? Math.round((totalWastageLoss / totalRevenue) * 100) : 0;

    // 5. 🏆 TRUE NET IN-HAND PROFIT (Asli Bachat)
    // Formula: Revenue - Food Cost - Actual Bills Paid - Wastage Loss
    const trueNetProfit = totalRevenue - actualMaterialConsumed - totalOverheadExpenses - totalWastageLoss;
    const trueNetMargin = totalRevenue > 0 ? ((trueNetProfit / totalRevenue) * 100).toFixed(1) : 0;

    // 6. Procurement & Cash Flow Outflows (Fresh vs Bulk separation)
    const totalRawMaterialCost = procurement.reduce((sum, p) => sum + Number(p.totalCost || 0), 0);
    const netCashFlow = totalRevenue - totalRawMaterialCost - totalOverheadExpenses;

    const dailyFreshProcurement = procurement
      .filter(p => classifyMaterialProcurementType(p.materialName) === 'daily')
      .reduce((sum, p) => sum + Number(p.totalCost || 0), 0);
    const weeklyBulkProcurement = procurement
      .filter(p => classifyMaterialProcurementType(p.materialName) === 'weekly')
      .reduce((sum, p) => sum + Number(p.totalCost || 0), 0);

    // 7. Current Stock Valuation (Asset in storage)
    const inventoryValuation = inventoryItems.reduce((sum, item) => sum + (Number(item.currentStock || 0) * (Number(item.unitCost) || 0)), 0);

    // Category-wise expense breakdown (strictly from entered activeExpenses)
    const expenseBreakdown = {};
    activeExpenses.forEach(e => {
      const cat = e.category || 'Other';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + Number(e.amount || 0);
    });

    // Item sales breakdown
    const itemBreakdownMap = {};
    sales.forEach(s => {
      const itemName = s.itemName || 'Item';
      if (!itemBreakdownMap[itemName]) {
        itemBreakdownMap[itemName] = { name: itemName, qty: 0, revenue: 0, profit: 0, category: s.category || '' };
      }
      const matchedItem = menuItems.find(m => m.id === s.itemId || m.name === itemName);
      const costPerUnit = matchedItem && matchedItem.costPrice !== undefined ? Number(matchedItem.costPrice) : (Number(s.costPrice) || 0);
      const itemCostTotal = costPerUnit * (Number(s.quantitySold) || 1);

      itemBreakdownMap[itemName].qty += (Number(s.quantitySold) || 1);
      itemBreakdownMap[itemName].revenue += Number(s.totalRevenue || 0);
      itemBreakdownMap[itemName].profit += (Number(s.totalRevenue || 0) - itemCostTotal);
      if (!itemBreakdownMap[itemName].category && matchedItem?.category) {
        itemBreakdownMap[itemName].category = matchedItem.category;
      }
    });

    const topItems = Object.values(itemBreakdownMap);

    // 8. Dynamic Daily Sales Target ("Aaj Itna Kamana Padega")
    // REAL DYNAMIC LOGIC:
    // - From 1st of month until major bills (Rent/Light/Staff) are entered: target is based strictly on daily running expenses & food cost.
    // - When owner enters a major bill (e.g. on 6th, ₹25,000 for rent & light bill):
    //   From that day onwards ("tab se"), that bill is spread over the remaining days of the month to set the recovery target!
    let targetDetails = null;

    if (timeframe === 'daily') {
      const parts = (selectedDate || getTodayDateString(0)).split('-').map(Number);
      const selYear = parts[0] || new Date().getFullYear();
      const selMonth = parts[1] || (new Date().getMonth() + 1);
      const selDay = parts[2] || new Date().getDate();

      const daysInMonth = new Date(selYear, selMonth, 0).getDate();
      const remainingDaysInMonth = Math.max(1, daysInMonth - selDay + 1);
      const monthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;

      // All expenses entered in this month up to the selected date
      const monthExpensesUpToDate = expenses.filter(e =>
        e.date &&
        e.date.startsWith(monthPrefix) &&
        e.date <= selectedDate
      );

      // Major bills entered so far (Rent, Electricity, Staff Salary, Gas, Wi-Fi, or any expense >= 1000)
      const majorBillsEntered = monthExpensesUpToDate.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        const amt = Number(e.amount || 0);
        return cat.includes('rent') ||
               cat.includes('elect') ||
               cat.includes('light') ||
               cat.includes('salary') ||
               cat.includes('staff') ||
               cat.includes('gas') ||
               cat.includes('wi-fi') ||
               cat.includes('wifi') ||
               title.includes('rent') ||
               title.includes('light') ||
               title.includes('salary') ||
               title.includes('gas') ||
               amt >= 1000;
      });

      const totalMajorBillsAmount = majorBillsEntered.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Daily recovery share of major bills for remaining days of month
      const dailyMajorBillRecovery = totalMajorBillsAmount > 0
        ? Math.round(totalMajorBillsAmount / remainingDaysInMonth)
        : 0;

      // Routine / minor daily expenses entered today (if not already counted as major bill)
      const minorDailyExpensesToday = activeExpenses
        .filter(e => !majorBillsEntered.some(m => m.id === e.id))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Base operational buffer to ensure target is always realistic (e.g. ₹350 running daily petty buffer)
      const dailyOperationalBuffer = minorDailyExpensesToday > 0 ? minorDailyExpensesToday : 350;

      // Total daily gross profit needed
      const dailyGrossProfitNeeded = dailyMajorBillRecovery + dailyOperationalBuffer + totalWastageLoss;

      // Effective margin ratio (Gross Profit / Revenue)
      const grossMarginRatio = totalRevenue > 0 && grossProfit > 0
        ? (grossProfit / totalRevenue)
        : 0.62;
      const effectiveMargin = Math.max(0.3, Math.min(0.85, grossMarginRatio));

      // Dynamic Target Sales (minimum ₹1,200 baseline for a cafe)
      const targetSales = Math.max(1200, Math.round(dailyGrossProfitNeeded / effectiveMargin));
      const isTargetAchieved = totalRevenue >= targetSales;
      const targetProgressPct = targetSales > 0
        ? Math.min(250, Math.round((totalRevenue / targetSales) * 100))
        : 100;
      const targetShortfall = Math.max(0, targetSales - totalRevenue);

      targetDetails = {
        targetSales,
        isTargetAchieved,
        targetProgressPct,
        targetShortfall,
        totalMajorBillsAmount,
        majorBillsCount: majorBillsEntered.length,
        majorBillsList: majorBillsEntered,
        dailyMajorBillRecovery,
        remainingDaysInMonth,
        minorDailyExpensesToday,
        todayDirectExpenses: totalOverheadExpenses
      };
    }

    return {
      sales,
      procurement,
      activeExpenses,
      activeWastage,
      totalRevenue,
      totalOrdersCount,
      totalUnitsSold,
      avgOrderValue,
      cashRevenue,
      cashOrdersCount,
      upiRevenue,
      upiOrdersCount,
      swiggyRevenue,
      swiggyOrdersCount,
      zomatoRevenue,
      zomatoOrdersCount,
      khataRevenue,
      khataOrdersCount,
      onlineRevenue,
      aggregatorRevenue,
      aggregatorOrdersCount,
      actualMaterialConsumed,
      grossProfit,
      grossMargin,
      foodCostPercentage,
      totalOverheadExpenses,
      overheadPercentage,
      totalWastageLoss,
      wastagePercentage,
      trueNetProfit,
      trueNetMargin,
      totalRawMaterialCost,
      dailyFreshProcurement,
      weeklyBulkProcurement,
      netCashFlow,
      inventoryValuation,
      expenseBreakdown,
      topItems,
      targetDetails
    };
  }, [salesLogs, procurementLogs, menuItems, inventoryItems, expenses, wastageLogs, timeframe, selectedDate]);

  if (isStaffMode) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-xs text-center max-w-md mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-stone-900">🔒 Financial P&L is Locked</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Staff Mode is active. Counter boys and staff are restricted from viewing cafe net profit, revenue breakdown, and food margins.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onPromptUnlock}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
          >
            Enter Owner PIN to Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">

      {/* 🧭 TOP TIMEFRAME & CONTROLS HEADER */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
              P&L Dashboard • Asli Munafa & Hisaab
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Total Kamayi me se Maal ka Kharcha, Dukan Bills & Kharab Maal hata kar Asli Bachat dekhein.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Timeframe Dropdown (Today / Weekly / Monthly / All Time) */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 text-stone-500 pointer-events-none" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="pl-8 pr-8 py-2 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all shadow-2xs appearance-none"
            >
              <option value="daily">📅 Today</option>
              <option value="weekly">📊 Weekly</option>
              <option value="monthly">🗓️ Monthly</option>
              <option value="all">🌐 All Time</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 text-stone-400 pointer-events-none" />
          </div>

          {/* Daily Date Selector with Prev / Today / Next buttons */}
          {timeframe === 'daily' && (
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 hover:bg-stone-200 rounded-lg text-stone-600 cursor-pointer"
                title="Pichhla Din"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 px-1 focus:outline-none cursor-pointer"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 hover:bg-stone-200 rounded-lg text-stone-600 cursor-pointer"
                title="Agla Din"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isToday && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-extrabold rounded-md cursor-pointer ml-1"
                >
                  Aaj
                </button>
              )}
            </div>
          )}

          {/* Export to Excel Button */}
          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              title="Download Excel Report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>


      {/* 🎯 TODAY'S DYNAMIC SALES TARGET GUIDE ("Aaj Itna Kamana Padega") */}
      {timeframe === 'daily' && filteredData.targetDetails && (
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white rounded-3xl border border-stone-800 p-4 sm:p-5 shadow-lg space-y-4 relative overflow-hidden">
          {/* Subtle warm glow background */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    🎯 Roz Ka Sales Target (Bills & Kharcha Nikalna)
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {selectedDate}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {filteredData.targetDetails.totalMajorBillsAmount > 0 ? (
                    <>
                      Is mahine enter kiye gaye <strong className="text-amber-400">₹{filteredData.targetDetails.totalMajorBillsAmount.toLocaleString()}</strong> ke bills (Rent, Bijli, etc.) ko bache huye <strong>{filteredData.targetDetails.remainingDaysInMonth} dinon</strong> me recover karne ke hisaab se target.
                    </>
                  ) : (
                    <>
                      Aaj ke daily kharch aur maal ke hisaab se target. Mahine ka Rent ya Bijli bill jab enter karenge tab se unka hissa target me judega.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                filteredData.targetDetails.isTargetAchieved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {filteredData.targetDetails.isTargetAchieved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target Crossed ({filteredData.targetDetails.targetProgressPct}%)</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>{filteredData.targetDetails.targetProgressPct}% Target Reached</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* 4 Highlights Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            {/* Box 1: Target Sales */}
            <div className="bg-stone-800/70 border border-stone-700/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                🎯 Target Sales (Aaj Ka)
              </span>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  ₹{filteredData.targetDetails.targetSales.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">
                Bills + Maal nikalne ke liye
              </span>
            </div>

            {/* Box 2: Actual Sales */}
            <div className="bg-stone-800/70 border border-stone-700/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                💰 Aaj Ki Kamayi (Ab Tak)
              </span>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-black text-white">
                  ₹{filteredData.totalRevenue.toLocaleString()}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold ${
                filteredData.targetDetails.isTargetAchieved ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {filteredData.totalOrdersCount} orders booked today
              </span>
            </div>

            {/* Box 3: Monthly Bill Recovery Share */}
            <div className="bg-stone-800/70 border border-stone-700/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                📋 Bill Recovery Load
              </span>
              <div className="my-1">
                <span className="text-xl sm:text-2xl font-black text-purple-300">
                  ₹{filteredData.targetDetails.dailyMajorBillRecovery.toLocaleString()}
                  <span className="text-xs text-purple-400 font-bold"> / day</span>
                </span>
              </div>
              <span className="text-[10px] text-purple-400/80 font-medium truncate">
                {filteredData.targetDetails.totalMajorBillsAmount > 0
                  ? `₹${filteredData.targetDetails.totalMajorBillsAmount.toLocaleString()} (${filteredData.targetDetails.majorBillsCount} bills)`
                  : 'Rent/Bijli enter hone par judega'
                }
              </span>
            </div>

            {/* Box 4: Aaj Pay Kiya Gaya Kharcha */}
            <div className="bg-stone-800/70 border border-stone-700/80 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                💵 Aaj Pay Kiya Gaya Kharcha
              </span>
              <div className="my-1">
                <span className={`text-xl sm:text-2xl font-black ${
                  filteredData.totalOverheadExpenses > 0 ? 'text-rose-400' : 'text-stone-300'
                }`}>
                  ₹{filteredData.totalOverheadExpenses.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">
                {filteredData.activeExpenses.length === 0
                  ? 'Aaj koi bill pay nahi hua (₹0)'
                  : `${filteredData.activeExpenses.length} bills paid today`
                }
              </span>
            </div>
          </div>

          {/* Live Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-300 flex items-center gap-1.5">
                <span>Target Progress:</span>
                <span className={filteredData.targetDetails.isTargetAchieved ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'}>
                  ₹{filteredData.totalRevenue.toLocaleString()} / ₹{filteredData.targetDetails.targetSales.toLocaleString()} ({filteredData.targetDetails.targetProgressPct}%)
                </span>
              </span>
              <span className="text-[11px] text-stone-400">
                {filteredData.targetDetails.isTargetAchieved 
                  ? '🎉 Target Crossed! Dukan ke bills aur maal cover ho chuka hai!' 
                  : `₹${filteredData.targetDetails.targetShortfall.toLocaleString()} remaining to hit target`
                }
              </span>
            </div>

            <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden p-0.5 border border-stone-700/80 relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  filteredData.targetDetails.isTargetAchieved
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400'
                }`}
                style={{ width: `${Math.min(100, filteredData.targetDetails.targetProgressPct)}%` }}
              />
            </div>
          </div>

          {/* Status Motivational Box */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 text-xs leading-relaxed ${
            filteredData.targetDetails.isTargetAchieved
              ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-900/30 border-amber-500/30 text-amber-200'
          }`}>
            {filteredData.targetDetails.isTargetAchieved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="flex-1">
              {filteredData.targetDetails.isTargetAchieved ? (
                <>
                  <strong>Shaandaar Kaam! Aaj Cafe ka Sales Target pura ho chuka hai! 🚀</strong>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Aaj ki sale se Dukan ke bills aur maal ka hissa nikal chuka hai! Aaj ka Asli In-Hand Net Profit: <strong>+₹{filteredData.trueNetProfit.toLocaleString()}</strong>! Ab aage aane wale har order se seedha pure munafa badhega!
                  </p>
                </>
              ) : (
                <>
                  <strong>Aaj ka Sales Target abhi baki hai (Baki: ₹{filteredData.targetDetails.targetShortfall.toLocaleString()})</strong>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Dukan ke bills aur maal ka hissa nikaalne ke liye ₹{filteredData.targetDetails.targetShortfall.toLocaleString()} ki aur sale chahiye. Shaam ke orders me thoda aur push karein!
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Entered Bills Chips (if any major bills entered this month) */}
          {filteredData.targetDetails.majorBillsList.length > 0 && (
            <div className="pt-2 border-t border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="font-bold">🗓️ Is Mahine Enter Huye Bills (Recovery Track):</span>
                <span>Total: ₹{filteredData.targetDetails.totalMajorBillsAmount.toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredData.targetDetails.majorBillsList.map(b => (
                  <span key={b.id} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-stone-800/90 text-stone-300 border border-stone-700/80 flex items-center gap-1">
                    <span>{b.title || b.category}:</span>
                    <strong className="text-amber-400">₹{Number(b.amount || 0).toLocaleString()}</strong>
                    <span className="text-stone-500 text-[9px]">({b.date})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 💡 UNIFIED P&L EXECUTIVE MATH BANNER ("Paisa Kahan Kharch Hua?") */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
              <span>📊 P&L Simple Formula: Paisa Kahan Kharch Hua?</span>
            </span>
            <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
              {timeframe === 'daily' ? `Date: ${selectedDate}` : timeframe === 'weekly' ? 'Last 7 Days' : timeframe === 'monthly' ? 'This Month' : 'All Data'}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-stone-500">
            {filteredData.trueNetProfit >= 0 ? (
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Cafe Munafa me hai!
              </span>
            ) : (
              <span className="text-rose-700 font-extrabold flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                Kharcha Sales se zyada hua hai
              </span>
            )}
          </div>
        </div>

        {/* 5-Step Formula Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2.5 text-center">

          {/* Step 1: Total Sales */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 block truncate">
              1. Total Kamayi (Sales)
            </span>
            <div className="my-1">
              <span className="text-base sm:text-xl font-black text-emerald-950 block truncate">
                ₹{filteredData.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 space-y-0.5">
              <div className="truncate">{filteredData.totalOrdersCount} orders ({filteredData.totalUnitsSold} items)</div>
              <div className="text-[9px] text-emerald-600 font-medium truncate">Avg: ₹{filteredData.avgOrderValue}/order</div>
            </div>
          </div>

          {/* Step 2: Food Cost (COGS) with Daily vs Bulk Stock details */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block truncate">
              2. (−) Raw Material Maal
            </span>
            <div className="my-1">
              <span className="text-base sm:text-xl font-black text-amber-950 block truncate">
                -₹{filteredData.actualMaterialConsumed.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] font-bold text-amber-700 space-y-0.5">
              <div className="truncate">{filteredData.foodCostPercentage}% Food Cost (COGS)</div>
              {timeframe === 'daily' ? (
                <div className="text-[9px] text-amber-800 font-semibold truncate" title="Purchased today: Daily Fresh vs Weekly Bulk stock">
                  Fresh: ₹{filteredData.dailyFreshProcurement} • Bulk: ₹{filteredData.weeklyBulkProcurement}
                </div>
              ) : (
                <div className="text-[9px] text-amber-600 font-medium truncate">Gross Profit: ₹{filteredData.grossProfit.toLocaleString()}</div>
              )}
            </div>
          </div>

          {/* Step 3: Dukan Bills & Rent (Shows ACTUAL PAID BILLS ONLY) */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-800 block truncate">
              3. (−) Dukan Bills & Kharch
            </span>
            <div className="my-1">
              <span className="text-base sm:text-xl font-black text-purple-950 block truncate">
                -₹{filteredData.totalOverheadExpenses.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] font-bold text-purple-700 space-y-0.5">
              <div className="truncate">
                {filteredData.totalOverheadExpenses === 0
                  ? 'Aaj koi bill pay nahi hua (₹0)'
                  : `${filteredData.activeExpenses.length} bills paid (${filteredData.overheadPercentage}% of sales)`
                }
              </div>
              <div className="text-[9px] text-purple-600 font-medium truncate">
                {filteredData.totalOverheadExpenses === 0
                  ? 'Bills pay karne par minus honge'
                  : 'Bijli, Rent, Staff, Gas, Ice'
                }
              </div>
            </div>
          </div>

          {/* Step 4: Spoilage / Wastage */}
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-800 block truncate">
              4. (−) Kharab Maal Loss
            </span>
            <div className="my-1">
              <span className="text-base sm:text-xl font-black text-rose-950 block truncate">
                -₹{filteredData.totalWastageLoss.toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] font-bold text-rose-700 space-y-0.5">
              <div className="truncate">{filteredData.activeWastage.length} wastage entries</div>
              <div className="text-[9px] text-rose-600 font-medium truncate">{filteredData.wastagePercentage}% loss on stock</div>
            </div>
          </div>

          {/* Step 5: True Net Profit Result */}
          <div className={`p-3 rounded-xl col-span-2 sm:col-span-1 border flex flex-col justify-between shadow-xs min-w-0 ${
            filteredData.trueNetProfit >= 0
              ? 'bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white border-emerald-600'
              : 'bg-gradient-to-br from-rose-700 via-rose-800 to-red-900 text-white border-rose-600'
          }`}>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/90 block truncate">
              5. (=) ASLI NET MUNAFA
            </span>
            <div className="my-1">
              <span className="text-base sm:text-xl font-black block truncate">
                {filteredData.trueNetProfit < 0 ? '-' : '+'}₹{Math.abs(filteredData.trueNetProfit).toLocaleString()}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-white/95 bg-white/20 px-2 py-0.5 rounded inline-block">
                {filteredData.trueNetMargin}% Net Margin
              </span>
              <div className="text-[9px] text-white/70 truncate">Asli In-Hand Bachat</div>
            </div>
          </div>

        </div>

        {/* 📦 Bottom Asset & Cash Flow Summary Strip */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
              <Wallet className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="text-stone-600 font-semibold text-[11px]">Storage Stock Asset:</span>
              <span className="font-black text-stone-900 text-xs">₹{Math.round(filteredData.inventoryValuation).toLocaleString()}</span>
            </div>

            {timeframe === 'daily' && (
              <div className="flex items-center gap-1.5 bg-amber-50/60 px-3 py-1.5 rounded-xl border border-amber-200 text-[11px] text-stone-600">
                <span>Maal Spent Today:</span>
                <span className="font-bold text-blue-700">🥛 Fresh: ₹{filteredData.dailyFreshProcurement}</span>
                <span>•</span>
                <span className="font-bold text-purple-700">📦 Bulk: ₹{filteredData.weeklyBulkProcurement}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-stone-600 font-semibold text-[11px]">Net Cash Inflow:</span>
            <span className={`font-black text-xs ${filteredData.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {filteredData.netCashFlow >= 0 ? '+' : ''}₹{filteredData.netCashFlow.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 💳 ALL PAYMENT MODES & CHANNELS BREAKDOWN (Cash, UPI, Swiggy, Zomato, Khata) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-2">
                <span>Payment Mode & Channel Wise Hisaab</span>
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.2 rounded-full border border-stone-200">
                  {timeframe === 'daily' ? `Selected Date: ${selectedDate}` : timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'All Time'}
                </span>
              </h4>
              <p className="text-[10px] text-stone-400">
                Cash, Counter UPI, Swiggy, Zomato aur Khata (Udhar) ka exact orders count aur aamdani
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 block uppercase">Reconciled Total</span>
            <span className="text-xs sm:text-sm font-black text-stone-900">
              ₹{filteredData.totalRevenue.toLocaleString()} ({filteredData.totalOrdersCount} Orders)
            </span>
          </div>
        </div>

        {/* 5 Channel Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {/* 1. Cash Card */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col justify-between space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 truncate">
                <span>💵</span>
                <span className="truncate">Counter Cash</span>
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                {filteredData.cashOrdersCount} orders
              </span>
            </div>
            <div>
              <span className="text-lg font-black text-emerald-950 block truncate">
                ₹{filteredData.cashRevenue.toLocaleString()}
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 mt-0.5">
                <span className="truncate">{filteredData.totalRevenue > 0 ? Math.round((filteredData.cashRevenue / filteredData.totalRevenue) * 100) : 0}% of sales</span>
                <span className="text-[9px] bg-emerald-200/60 px-1 rounded shrink-0">In Till (Galla)</span>
              </div>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1 overflow-hidden">
              <div
                className="bg-emerald-600 h-1 rounded-full transition-all"
                style={{ width: `${filteredData.totalRevenue > 0 ? Math.min(100, Math.round((filteredData.cashRevenue / filteredData.totalRevenue) * 100)) : 0}%` }}
              />
            </div>
          </div>

          {/* 2. Counter UPI Card */}
          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/90 flex flex-col justify-between space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-900 flex items-center gap-1.5 truncate">
                <span>📱</span>
                <span className="truncate">Counter UPI</span>
              </span>
              <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded shrink-0">
                {filteredData.upiOrdersCount} orders
              </span>
            </div>
            <div>
              <span className="text-lg font-black text-sky-950 block truncate">
                ₹{filteredData.upiRevenue.toLocaleString()}
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-sky-700 mt-0.5">
                <span className="truncate">{filteredData.totalRevenue > 0 ? Math.round((filteredData.upiRevenue / filteredData.totalRevenue) * 100) : 0}% of sales</span>
                <span className="text-[9px] bg-sky-200/60 px-1 rounded shrink-0">Direct Bank</span>
              </div>
            </div>
            <div className="w-full bg-sky-200/60 rounded-full h-1 overflow-hidden">
              <div
                className="bg-sky-600 h-1 rounded-full transition-all"
                style={{ width: `${filteredData.totalRevenue > 0 ? Math.min(100, Math.round((filteredData.upiRevenue / filteredData.totalRevenue) * 100)) : 0}%` }}
              />
            </div>
          </div>

          {/* 3. Swiggy Online Delivery Card */}
          <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-300 flex flex-col justify-between space-y-2 ring-1 ring-orange-400/30 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-950 flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f48c06] shrink-0"></span>
                <span className="truncate">Swiggy Delivery</span>
              </span>
              <span className="text-[10px] font-extrabold bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded shrink-0">
                {filteredData.swiggyOrdersCount} orders
              </span>
            </div>
            <div>
              <span className="text-lg font-black text-orange-950 block truncate">
                ₹{filteredData.swiggyRevenue.toLocaleString()}
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-orange-800 mt-0.5">
                <span className="truncate">{filteredData.totalRevenue > 0 ? Math.round((filteredData.swiggyRevenue / filteredData.totalRevenue) * 100) : 0}% of sales</span>
                <span className="text-[9px] bg-orange-200/60 px-1 rounded shrink-0">Swiggy Payout</span>
              </div>
            </div>
            <div className="w-full bg-orange-200/60 rounded-full h-1 overflow-hidden">
              <div
                className="bg-[#f48c06] h-1 rounded-full transition-all"
                style={{ width: `${filteredData.totalRevenue > 0 ? Math.min(100, Math.round((filteredData.swiggyRevenue / filteredData.totalRevenue) * 100)) : 0}%` }}
              />
            </div>
          </div>

          {/* 4. Zomato Online Delivery Card */}
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-300 flex flex-col justify-between space-y-2 ring-1 ring-rose-400/30 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-950 flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e5383b] shrink-0"></span>
                <span className="truncate">Zomato Delivery</span>
              </span>
              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded shrink-0">
                {filteredData.zomatoOrdersCount} orders
              </span>
            </div>
            <div>
              <span className="text-lg font-black text-rose-950 block truncate">
                ₹{filteredData.zomatoRevenue.toLocaleString()}
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-rose-800 mt-0.5">
                <span className="truncate">{filteredData.totalRevenue > 0 ? Math.round((filteredData.zomatoRevenue / filteredData.totalRevenue) * 100) : 0}% of sales</span>
                <span className="text-[9px] bg-rose-200/60 px-1 rounded shrink-0">Zomato Payout</span>
              </div>
            </div>
            <div className="w-full bg-rose-200/60 rounded-full h-1 overflow-hidden">
              <div
                className="bg-[#e5383b] h-1 rounded-full transition-all"
                style={{ width: `${filteredData.totalRevenue > 0 ? Math.min(100, Math.round((filteredData.zomatoRevenue / filteredData.totalRevenue) * 100)) : 0}%` }}
              />
            </div>
          </div>

          {/* 5. Khata (Udhar) Card */}
          <div className="p-3 rounded-xl sm:col-span-2 lg:col-span-1 bg-amber-50/70 border border-amber-300 flex flex-col justify-between space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 truncate">
                <span>📒</span>
                <span className="truncate">Khata (Udhar)</span>
              </span>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded shrink-0">
                {filteredData.khataOrdersCount} orders
              </span>
            </div>
            <div>
              <span className="text-lg font-black text-amber-950 block truncate">
                ₹{filteredData.khataRevenue.toLocaleString()}
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 mt-0.5">
                <span className="truncate">{filteredData.totalRevenue > 0 ? Math.round((filteredData.khataRevenue / filteredData.totalRevenue) * 100) : 0}% of sales</span>
                <span className="text-[9px] bg-amber-200/60 px-1 rounded shrink-0">Receivable</span>
              </div>
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-1 overflow-hidden">
              <div
                className="bg-amber-600 h-1 rounded-full transition-all"
                style={{ width: `${filteredData.totalRevenue > 0 ? Math.min(100, Math.round((filteredData.khataRevenue / filteredData.totalRevenue) * 100)) : 0}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 🛵 SWIGGY & ZOMATO AGGREGATOR PAYOUT STATUS */}
      {(() => {
        const aggLedger = calculateAggregatorLedger(salesLogs, settlements);
        const hasAggregatorSales = aggLedger.Swiggy.totalGross > 0 || aggLedger.Zomato.totalGross > 0;

        return (
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-stone-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-100 flex items-center gap-2">
                    <span>Swiggy & Zomato Online Ledger & Bank Payouts</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full font-extrabold">
                      Receivable
                    </span>
                  </h4>
                  <p className="text-[10px] text-stone-400">
                    Gross orders, platform commission deductions, aur bank me aane wala baaki paisa
                  </p>
                </div>
              </div>

              {onOpenSettlementsModal && (
                <button
                  type="button"
                  onClick={onOpenSettlementsModal}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
                >
                  Manage Payouts & Settlements →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Swiggy Box */}
              <div className="bg-stone-800/80 p-3 rounded-xl border border-orange-500/30 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f48c06]"></span>
                    Swiggy
                  </span>
                  <span className="text-[10px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.2 rounded">
                    {timeframe !== 'all' ? `${filteredData.swiggyOrdersCount} ord (${timeframe === 'daily' ? 'Today' : timeframe})` : `${aggLedger.Swiggy.totalOrdersCount} ord total`}
                  </span>
                </div>
                <div>
                  <div className="my-1">
                    <span className="text-[9px] text-stone-400 uppercase font-semibold">Bank me aana baaki hai:</span>
                    <div className="text-xl font-black text-amber-300">
                      ₹{aggLedger.Swiggy.pendingUnsettled.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between border-t border-stone-700/60 pt-1">
                  <span>Gross Orders: ₹{aggLedger.Swiggy.totalGross.toLocaleString()}</span>
                  <span>In Bank: ₹{aggLedger.Swiggy.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

              {/* Zomato Box */}
              <div className="bg-stone-800/80 p-3 rounded-xl border border-rose-500/30 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e5383b]"></span>
                    Zomato
                  </span>
                  <span className="text-[10px] bg-stone-700 text-stone-300 font-bold px-1.5 py-0.2 rounded">
                    {timeframe !== 'all' ? `${filteredData.zomatoOrdersCount} ord (${timeframe === 'daily' ? 'Today' : timeframe})` : `${aggLedger.Zomato.totalOrdersCount} ord total`}
                  </span>
                </div>
                <div>
                  <div className="my-1">
                    <span className="text-[9px] text-stone-400 uppercase font-semibold">Bank me aana baaki hai:</span>
                    <div className="text-xl font-black text-rose-300">
                      ₹{aggLedger.Zomato.pendingUnsettled.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 flex justify-between border-t border-stone-700/60 pt-1">
                  <span>Gross Orders: ₹{aggLedger.Zomato.totalGross.toLocaleString()}</span>
                  <span>In Bank: ₹{aggLedger.Zomato.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

              {/* Total Unsettled Bank Transfer */}
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-300">
                    🏦 Total Online Pending
                  </span>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="my-1.5">
                  <span className="text-[9px] text-amber-200/80 uppercase font-semibold">Awaiting Transfer to Bank:</span>
                  <div className="text-xl font-black text-amber-300">
                    ₹{aggLedger.overall.pendingUnsettled.toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-amber-200/70 flex justify-between border-t border-amber-900/60 pt-1">
                  <span>Commission: ₹{aggLedger.overall.totalCommission.toLocaleString()}</span>
                  <span>In Bank: ₹{aggLedger.overall.totalBankReceived.toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2-COLUMN DETAILED ANALYTICS (TOP SELLERS & EXPENSE BREAKDOWN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">

        {/* Left: Top Selling Items (Best Sellers) */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>🏆 Top Selling Items ({timeframe === 'daily' ? 'Today' : (timeframe === 'weekly' ? 'Weekly' : (timeframe === 'monthly' ? 'Monthly' : 'All Time'))})</span>
              </h4>
              <p className="text-[10px] text-stone-400">Sabse zyada bikne wale aur profit dene wale items</p>
            </div>

            {/* Sort Toggle: Qty vs Revenue */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-[10px] font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTopItemsSort('qty')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${topItemsSort === 'qty'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
                title="Sort by quantity sold"
              >
                🔥 Most Sold
              </button>
              <button
                type="button"
                onClick={() => setTopItemsSort('revenue')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${topItemsSort === 'revenue'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                  }`}
                title="Sort by revenue generated"
              >
                💰 Top Revenue
              </button>
            </div>
          </div>

          {filteredData.topItems.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">Is timeframe me koi sale record nahi hai.</p>
          ) : (
            <div className="space-y-2.5">
              {/* Highlight #1 Star Item */}
              {(() => {
                const sorted = [...filteredData.topItems].sort((a, b) =>
                  topItemsSort === 'qty' ? b.qty - a.qty : b.revenue - a.revenue
                );
                const star = sorted[0];
                if (!star) return null;
                return (
                  <div className="p-2.5 bg-gradient-to-r from-amber-50 via-amber-50/50 to-transparent border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">🥇</span>
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block">
                          #1 Highest Demand Item
                        </span>
                        <h5 className="text-xs sm:text-sm font-black text-stone-900 truncate">
                          {star.name}
                        </h5>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-amber-900">{star.qty} Portions Sold</span>
                      <span className="block text-[10px] font-bold text-emerald-700">₹{star.revenue.toLocaleString()} Sales</span>
                    </div>
                  </div>
                );
              })()}

              {/* Items List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {[...filteredData.topItems]
                  .sort((a, b) => topItemsSort === 'qty' ? b.qty - a.qty : b.revenue - a.revenue)
                  .map((item, idx) => {
                    const contribution = filteredData.totalRevenue > 0
                      ? Math.round((item.revenue / filteredData.totalRevenue) * 100)
                      : 0;

                    return (
                      <div key={item.name} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 hover:bg-amber-50/30 transition-all space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-stone-900 truncate">{item.name}</h5>
                              {item.category && (
                                <span className="text-[9px] text-stone-400 font-medium">
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-stone-900">
                              {topItemsSort === 'qty' ? `${item.qty} units` : `₹${item.revenue.toLocaleString()}`}
                            </span>
                            <span className="block text-[9px] text-stone-500">
                              {topItemsSort === 'qty' ? `₹${item.revenue.toLocaleString()} Sales` : `${item.qty} units`} • Margin: ₹{item.profit}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar of Sales Share */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 bg-stone-200 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-amber-600 h-1 rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(3, contribution))}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-stone-500 shrink-0">
                            {contribution}% of sales
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Dukan Bills & Expenses Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span>📊 Dukan Bills & Kharcha Breakdown</span>
              </h4>
              <p className="text-[10px] text-stone-400">Rent, Bijli, Staff Salary, Gas aur Wi-Fi kharcha</p>
            </div>
            <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              Total: ₹{filteredData.totalOverheadExpenses.toLocaleString()}
            </span>
          </div>

          {Object.keys(filteredData.expenseBreakdown).length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">Is timeframe me koi bill/kharcha log nahi hai.</p>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {Object.entries(filteredData.expenseBreakdown).map(([cat, amount]) => {
                const percentage = filteredData.totalOverheadExpenses > 0
                  ? Math.round((amount / filteredData.totalOverheadExpenses) * 100)
                  : 0;

                return (
                  <div key={cat} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-stone-900">{cat}</span>
                      <span className="text-purple-900 font-black">₹{amount.toLocaleString()} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 📋 BOTTOM SECTION: TABBED PURCHASES & WASTAGE LOGS */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-4 shadow-xs space-y-3">

        {/* Tab Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveBottomTab('purchases')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeBottomTab === 'purchases'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Raw Material Purchases ({filteredData.procurement.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveBottomTab('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeBottomTab === 'expenses'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Dukan Bills & Kharch ({filteredData.activeExpenses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveBottomTab('wastage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeBottomTab === 'wastage'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Kharab Maal / Wastage ({filteredData.activeWastage.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-stone-500 font-semibold">
            {activeBottomTab === 'purchases' && (
              <span>Total Khareed: <strong className="text-amber-900">₹{filteredData.totalRawMaterialCost.toLocaleString()}</strong></span>
            )}
            {activeBottomTab === 'expenses' && (
              <span>Total Bills: <strong className="text-purple-900">₹{filteredData.totalOverheadExpenses.toLocaleString()}</strong></span>
            )}
            {activeBottomTab === 'wastage' && (
              <span>Total Wastage Loss: <strong className="text-rose-700">₹{filteredData.totalWastageLoss.toLocaleString()}</strong></span>
            )}
          </div>
        </div>

        {/* Content 1: Purchases Tab */}
        {activeBottomTab === 'purchases' && (
          <div>
            {filteredData.procurement.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Is timeframe me koi raw material purchase entry nahi hai.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredData.procurement.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-stone-900">{p.materialName}</h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-semibold">{p.category}</span>
                        <span>{p.quantityReceived} {p.unit}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-900">₹{Number(p.totalCost || 0).toLocaleString()}</span>
                      <span className="block text-[9px] text-stone-400">{p.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content 2: Dukan Bills & Kharch Tab */}
        {activeBottomTab === 'expenses' && (
          <div>
            {filteredData.activeExpenses.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-bold text-stone-700">Is timeframe me koi bill ya kharcha enter nahi hua hai (₹0).</p>
                <p className="text-[11px] text-stone-400 max-w-md mx-auto">
                  Owner jab &quot;Bills &amp; Expenses&quot; tab me Rent, Bijli, Staff Salary ya Gas ka kharcha enter karega, tab wo yahan aur P&amp;L me hisaab me judega.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredData.activeExpenses.map((e) => (
                  <div key={e.id} className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-200/70 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <h5 className="text-xs font-bold text-stone-900 truncate">{e.title || 'Expense'}</h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px]">{e.category || 'Other'}</span>
                        {e.paidTo && <span className="truncate">To: {e.paidTo}</span>}
                        {e.paymentMode && <span className="text-stone-400">({e.paymentMode})</span>}
                      </div>
                      {e.notes && <p className="text-[9px] text-stone-400 truncate mt-0.5">{e.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-purple-900">₹{Number(e.amount || 0).toLocaleString()}</span>
                      <span className="block text-[9px] text-stone-400">{e.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content 3: Wastage Tab */}
        {activeBottomTab === 'wastage' && (
          <div>
            {filteredData.activeWastage.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">Bahut badhiya! Is timeframe me koi kharab maal log nahi hua.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredData.activeWastage.map((w) => (
                  <div key={w.id} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200/70 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-stone-900">{w.ingredientName}</h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px]">{w.reason}</span>
                        <span>{w.quantity} {w.unit}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-rose-700">Loss: ₹{Number(w.costValue || 0).toLocaleString()}</span>
                      <span className="block text-[9px] text-stone-400">{w.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
