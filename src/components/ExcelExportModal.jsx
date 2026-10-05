import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  ShoppingBag, 
  PackageCheck, 
  Receipt, 
  Boxes 
} from 'lucide-react';
import { exportCafeDataToExcel, filterRecordsByTimeframe, getTimeframeLabel } from '../utils/excelExporter';

export default function ExcelExportModal({
  isOpen,
  onClose,
  salesLogs = [],
  procurementLogs = [],
  expenses = [],
  wastageLogs = [],
  inventoryItems = [],
  menuItems = [],
  onExportSuccess
}) {
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly', 'monthly', 'last_month', 'custom', 'all'
  const [reportType, setReportType] = useState('all'); // 'all', 'sales', 'procurement', 'expenses', 'inventory'

  // Custom date range state
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(firstOfMonth);
  const [customEndDate, setCustomEndDate] = useState(today);

  // Live preview counts based on selected timeframe
  const preview = useMemo(() => {
    const s = filterRecordsByTimeframe(salesLogs, timeframe, customStartDate, customEndDate);
    const p = filterRecordsByTimeframe(procurementLogs, timeframe, customStartDate, customEndDate);
    const e = filterRecordsByTimeframe(expenses, timeframe, customStartDate, customEndDate);
    const w = filterRecordsByTimeframe(wastageLogs, timeframe, customStartDate, customEndDate);

    const totalRev = s.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);
    const totalProc = p.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const totalExp = e.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return {
      salesCount: s.length,
      procCount: p.length,
      expCount: e.length,
      wasteCount: w.length,
      totalRev,
      totalProc,
      totalExp
    };
  }, [salesLogs, procurementLogs, expenses, wastageLogs, timeframe, customStartDate, customEndDate]);

  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      const result = exportCafeDataToExcel({
        timeframe,
        customStartDate,
        customEndDate,
        reportType,
        salesLogs,
        procurementLogs,
        expenses,
        wastageLogs,
        inventoryItems,
        menuItems
      });

      if (onExportSuccess) {
        onExportSuccess(`✅ Excel file "${result.filename}" downloaded successfully!`);
      }
      onClose();
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Error generating Excel file: ' + err.message);
    }
  };

  const currentLabel = getTimeframeLabel(timeframe, customStartDate, customEndDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shadow-emerald-950/30">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Export to Excel (.xlsx)
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Download Monthly, Weekly or Custom Cafe Reports in real Excel format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* 1. Timeframe Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              1. Select Timeframe (Duration)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>⚡ This Week</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Last 7 days data</div>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>📅 This Month</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Current month</div>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('last_month')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  timeframe === 'last_month'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🗓️ Last Month</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Previous full month</div>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('custom')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  timeframe === 'custom'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom Dates</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">Select start & end</div>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-2 ${
                  timeframe === 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>🌐 All-Time Full Backup</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">All historical records in database</div>
              </button>
            </div>

            {/* Custom Date Range Picker */}
            {timeframe === 'custom' && (
              <div className="mt-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:flex-1">
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">From Date (Start)</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="w-full sm:flex-1">
                  <label className="text-[11px] font-bold text-stone-500 block mb-1">To Date (End)</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Report Content Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              2. Select Report Scope
            </label>
            <div className="space-y-2">
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  reportType === 'all'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="all"
                  checked={reportType === 'all'}
                  onChange={() => setReportType('all')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>📊 Complete Cafe Workbook (Multi-Sheet Excel)</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Includes 6 dedicated Excel sheets: P&L Summary, Daily Sales, Purchases, Operating Overheads, Wastage (Kharab Maal), and Current Inventory Stock.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  reportType === 'sales'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="sales"
                  checked={reportType === 'sales'}
                  onChange={() => setReportType('sales')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    🛒 Daily Sales Orders Only
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Itemized list of orders with selling price, unit cost, profit margin, and payment modes.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  reportType === 'procurement'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="procurement"
                  checked={reportType === 'procurement'}
                  onChange={() => setReportType('procurement')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    📦 Raw Material Purchases (Procurement) Only
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Supplier purchases, raw material quantities, unit rates, and vendor invoices.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  reportType === 'expenses'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="expenses"
                  checked={reportType === 'expenses'}
                  onChange={() => setReportType('expenses')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    💸 Operating Expenses & Wastage Loss Only
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Electricity, rent, salaries, maintenance, and food spoilage losses.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Live Preview Card */}
          <div className="bg-stone-900 text-stone-100 p-4 rounded-2xl border border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Period Preview: {currentLabel}
              </span>
              <span className="text-[10px] text-stone-400">Excel .xlsx Ready</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800 text-center">
              <div className="bg-stone-800/60 p-2 rounded-xl">
                <div className="text-xs text-stone-400">Sales Orders</div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">{preview.salesCount}</div>
                <div className="text-[10px] text-stone-500">₹{Math.round(preview.totalRev).toLocaleString()}</div>
              </div>
              <div className="bg-stone-800/60 p-2 rounded-xl">
                <div className="text-xs text-stone-400">Purchases</div>
                <div className="text-base font-extrabold text-blue-400 mt-0.5">{preview.procCount}</div>
                <div className="text-[10px] text-stone-500">₹{Math.round(preview.totalProc).toLocaleString()}</div>
              </div>
              <div className="bg-stone-800/60 p-2 rounded-xl">
                <div className="text-xs text-stone-400">Bills & Exp.</div>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">{preview.expCount}</div>
                <div className="text-[10px] text-stone-500">₹{Math.round(preview.totalExp).toLocaleString()}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:from-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-700/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
