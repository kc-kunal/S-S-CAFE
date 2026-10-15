import React, { useState, useMemo } from 'react';
import { 
  X, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  IndianRupee, 
  Printer, 
  Share2, 
  History, 
  Coins, 
  Calculator, 
  Check, 
  Copy, 
  Calendar,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { getTodayDateString, classifySalePaymentMethod } from '../utils/storage';

export default function DayClosingModal({
  isOpen,
  onClose,
  salesLogs = [],
  expenses = [],
  procurementLogs = [],
  khataLedger = [],
  closingHistory = [],
  onSaveDayClosing,
  currentCafe,
  showToast
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString(0));
  const [activeTab, setActiveTab] = useState('closing'); // 'closing' | 'history'
  const [closedBy, setClosedBy] = useState(currentCafe?.ownerName || 'Manager');
  const [openingFloat, setOpeningFloat] = useState(1000); // Default drawer cash float
  const [closingNotes, setClosingNotes] = useState('');
  const [copied, setCopied] = useState(false);

  // Denominations Breakdown Counter
  const [denominations, setDenominations] = useState({
    500: '',
    200: '',
    100: '',
    50: '',
    20: '',
    10: '',
    coins: ''
  });
  const [showDenominationDetail, setShowDenominationDetail] = useState(false);
  const [manualActualCash, setManualActualCash] = useState('');

  // 1. Calculate Day Sales Breakdown
  const daySalesMetrics = useMemo(() => {
    const logs = salesLogs.filter(s => s.date === selectedDate);
    
    let cashSales = 0;
    let upiSales = 0;
    let swiggySales = 0;
    let zomatoSales = 0;
    let khataSales = 0;
    let totalRevenue = 0;

    logs.forEach(s => {
      const rev = Number(s.totalRevenue) || 0;
      totalRevenue += rev;
      const method = classifySalePaymentMethod(s);
      if (method === 'cash') cashSales += rev;
      else if (method === 'upi') upiSales += rev;
      else if (method === 'swiggy') swiggySales += rev;
      else if (method === 'zomato') zomatoSales += rev;
      else if (method === 'khata') khataSales += rev;
      else cashSales += rev; // fallback
    });

    return {
      totalRevenue,
      cashSales,
      upiSales,
      swiggySales,
      zomatoSales,
      khataSales,
      orderCount: logs.length
    };
  }, [salesLogs, selectedDate]);

  // 2. Cash Expenses for selected date
  const dayCashExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date === selectedDate && (e.paymentMode || '').toLowerCase() === 'cash')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, selectedDate]);

  // 3. Cash Procurement / Raw Material purchases for selected date
  const dayCashPurchases = useMemo(() => {
    return procurementLogs
      .filter(p => p.date === selectedDate && (p.paymentMode || '').toLowerCase() === 'cash')
      .reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);
  }, [procurementLogs, selectedDate]);

  // 4. Cash recovered from Khata/Udhar today
  const dayKhataCashRecovered = useMemo(() => {
    return khataLedger
      .filter(k => k.date === selectedDate && k.type === 'credit' && (k.paymentMode || '').toLowerCase() === 'cash')
      .reduce((sum, k) => sum + (Number(k.amount) || 0), 0);
  }, [khataLedger, selectedDate]);

  // 5. Total Expected Cash in Drawer
  const expectedCashInTill = useMemo(() => {
    const float = Number(openingFloat) || 0;
    return float + daySalesMetrics.cashSales + dayKhataCashRecovered - dayCashExpenses - dayCashPurchases;
  }, [openingFloat, daySalesMetrics.cashSales, dayKhataCashRecovered, dayCashExpenses, dayCashPurchases]);

  // 6. Denominations Total
  const calculatedDenominationsTotal = useMemo(() => {
    const d500 = (Number(denominations[500]) || 0) * 500;
    const d200 = (Number(denominations[200]) || 0) * 200;
    const d100 = (Number(denominations[100]) || 0) * 100;
    const d50 = (Number(denominations[50]) || 0) * 50;
    const d20 = (Number(denominations[20]) || 0) * 20;
    const d10 = (Number(denominations[10]) || 0) * 10;
    const coins = Number(denominations.coins) || 0;
    return d500 + d200 + d100 + d50 + d20 + d10 + coins;
  }, [denominations]);

  // Effective actual cash counted
  const effectiveActualCash = useMemo(() => {
    if (showDenominationDetail && calculatedDenominationsTotal > 0) {
      return calculatedDenominationsTotal;
    }
    return manualActualCash !== '' ? Number(manualActualCash) : expectedCashInTill;
  }, [showDenominationDetail, calculatedDenominationsTotal, manualActualCash, expectedCashInTill]);

  // Discrepancy
  const discrepancy = effectiveActualCash - expectedCashInTill;

  if (!isOpen) return null;

  const handleSaveClosing = () => {
    const closingRecord = {
      id: `close-${Date.now()}`,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      closedBy: closedBy.trim() || 'Owner',
      openingFloat: Number(openingFloat) || 0,
      cashSales: daySalesMetrics.cashSales,
      cashExpenses: dayCashExpenses,
      cashPurchases: dayCashPurchases,
      cashKhataCollected: dayKhataCashRecovered,
      expectedCash: expectedCashInTill,
      actualCash: effectiveActualCash,
      difference: discrepancy,
      status: discrepancy === 0 ? 'matched' : discrepancy > 0 ? 'surplus' : 'shortage',
      notes: closingNotes.trim() || undefined,
      denominations: showDenominationDetail ? denominations : undefined,
      totalDaySales: daySalesMetrics.totalRevenue,
      salesBreakdown: {
        cash: daySalesMetrics.cashSales,
        upi: daySalesMetrics.upiSales,
        swiggy: daySalesMetrics.swiggySales,
        zomato: daySalesMetrics.zomatoSales,
        khata: daySalesMetrics.khataSales
      },
      orderCount: daySalesMetrics.orderCount
    };

    if (onSaveDayClosing) {
      onSaveDayClosing(closingRecord);
    }

    if (showToast) {
      showToast('✅ Day-End Cash Closing Hisab Safaltapoorvak Save Ho Gaya!');
    }
  };

  const getSummaryShareText = () => {
    const cafeName = currentCafe?.cafeName || 'S&S Cafe';
    return `🌙 *${cafeName} - DAY-END CASH CLOSING REPORT*\n` +
      `📅 *Date:* ${selectedDate}\n` +
      `👤 *Closed By:* ${closedBy}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Opening Float:* ₹${openingFloat}\n` +
      `🛒 *Cash Sales Today:* +₹${daySalesMetrics.cashSales}\n` +
      `📒 *Khata Cash Recovered:* +₹${dayKhataCashRecovered}\n` +
      `💸 *Cash Expenses Paid:* -₹${dayCashExpenses}\n` +
      `📦 *Cash Purchases Paid:* -₹${dayCashPurchases}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *Expected Cash in Till:* ₹${expectedCashInTill}\n` +
      `💰 *Actual Cash Counted:* ₹${effectiveActualCash}\n` +
      `⚖️ *Discrepancy (Farq):* ${discrepancy === 0 ? '₹0 (100% Matched! ✅)' : discrepancy > 0 ? `+₹${discrepancy} (Surplus 🟢)` : `-₹${Math.abs(discrepancy)} (Shortage 🔴)`}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📊 *Total Day Sales:* ₹${daySalesMetrics.totalRevenue} (${daySalesMetrics.orderCount} orders)\n` +
      `• Cash: ₹${daySalesMetrics.cashSales}\n` +
      `• UPI: ₹${daySalesMetrics.upiSales}\n` +
      `• Swiggy: ₹${daySalesMetrics.swiggySales}\n` +
      `• Zomato: ₹${daySalesMetrics.zomatoSales}\n` +
      `• Khata (Udhar): ₹${daySalesMetrics.khataSales}\n` +
      `${closingNotes ? `\n📝 *Notes:* ${closingNotes}` : ''}`;
  };

  const handleCopySummary = () => {
    const text = getSummaryShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (showToast) showToast('📋 Day-End Summary copied to clipboard!');
  };

  const handlePrintSlip = () => {
    const slipHtml = `
      <html>
        <head>
          <title>Day End Z-Report - ${selectedDate}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; width: 280px; margin: 0 auto; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 15px;">${currentCafe?.cafeName || 'S&S CAFE'}</div>
          <div class="center">DAY-END CASH RECONCILIATION</div>
          <div class="center" style="font-size: 11px;">SHIFT Z-REPORT</div>
          <div class="line"></div>
          <div class="row"><span>Date:</span><span>${selectedDate}</span></div>
          <div class="row"><span>Time:</span><span>${new Date().toLocaleTimeString()}</span></div>
          <div class="row"><span>Closed By:</span><span>${closedBy}</span></div>
          <div class="line"></div>
          <div class="row"><span>Opening Cash:</span><span>₹${openingFloat}</span></div>
          <div class="row"><span>Cash Sales:</span><span>+₹${daySalesMetrics.cashSales}</span></div>
          <div class="row"><span>Khata Recovered:</span><span>+₹${dayKhataCashRecovered}</span></div>
          <div class="row"><span>Cash Expenses:</span><span>-₹${dayCashExpenses}</span></div>
          <div class="row"><span>Cash Raw Materials:</span><span>-₹${dayCashPurchases}</span></div>
          <div class="line"></div>
          <div class="row bold"><span>EXPECTED TILL CASH:</span><span>₹${expectedCashInTill}</span></div>
          <div class="row bold"><span>ACTUAL COUNTED:</span><span>₹${effectiveActualCash}</span></div>
          <div class="row bold"><span>DISCREPANCY:</span><span>${discrepancy >= 0 ? '+' : ''}₹${discrepancy}</span></div>
          <div class="line"></div>
          <div class="bold center">ALL CHANNELS SUMMARY</div>
          <div class="row"><span>Cash Sales:</span><span>₹${daySalesMetrics.cashSales}</span></div>
          <div class="row"><span>UPI Sales:</span><span>₹${daySalesMetrics.upiSales}</span></div>
          <div class="row"><span>Swiggy Sales:</span><span>₹${daySalesMetrics.swiggySales}</span></div>
          <div class="row"><span>Zomato Sales:</span><span>₹${daySalesMetrics.zomatoSales}</span></div>
          <div class="row"><span>Khata (Udhar):</span><span>₹${daySalesMetrics.khataSales}</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size: 14px;"><span>TOTAL SALES:</span><span>₹${daySalesMetrics.totalRevenue}</span></div>
          <div class="row"><span>Total Orders:</span><span>${daySalesMetrics.orderCount}</span></div>
          <div class="line"></div>
          <div class="center" style="margin-top: 15px; font-size: 11px;">Verified & Closed by Owner</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(slipHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden text-white flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif-title text-slate-100">
                  Day-End Cash Closing (Z-Report)
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Galla Hisab
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Match drawer cash, calculate shortage/surplus, and print night closing slip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Today's Closing vs Past History */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('closing')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'closing'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Shift Cash Closing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Closings History ({closingHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Day Closing Reconciliation Form */}
        {activeTab === 'closing' ? (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            
            {/* Date and Closed By Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-850/70 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Closing Date
                </label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent focus:outline-none w-full text-white cursor-pointer font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Closed By (Manager / Owner)
                </label>
                <input
                  type="text"
                  value={closedBy}
                  onChange={(e) => setClosedBy(e.target.value)}
                  placeholder="Manager Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Reconciliation Math Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Cash Flow Breakdown (Galla Hisab)</span>
              </h4>

              <div className="bg-slate-950/60 rounded-2xl border border-slate-800/90 divide-y divide-slate-800/80 text-xs">
                
                {/* 1. Opening Cash Float */}
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-slate-200">Opening Cash Float</span>
                      <p className="text-[10px] text-slate-500">Subah shift start par galle me cash</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-xl">
                    <span className="text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      value={openingFloat}
                      onChange={(e) => setOpeningFloat(e.target.value)}
                      className="w-20 text-right bg-transparent text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Today's Cash Sales */}
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                      +
                    </span>
                    <div>
                      <span className="font-bold text-slate-200">Today's Cash Sales</span>
                      <p className="text-[10px] text-emerald-400 font-medium">Customer cash collected</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +₹{daySalesMetrics.cashSales}
                  </span>
                </div>

                {/* 3. Khata Cash Recovered */}
                {dayKhataCashRecovered > 0 && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                        +
                      </span>
                      <div>
                        <span className="font-bold text-slate-200">Khata (Udhar) Cash Received</span>
                        <p className="text-[10px] text-teal-400 font-medium">Old dues paid in cash today</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-teal-400 text-sm">
                      +₹{dayKhataCashRecovered}
                    </span>
                  </div>
                )}

                {/* 4. Cash Expenses */}
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-xs">
                      -
                    </span>
                    <div>
                      <span className="font-bold text-slate-200">Cash Expenses</span>
                      <p className="text-[10px] text-rose-400 font-medium">Daily milk, gas, ice, wages paid from till</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    -₹{dayCashExpenses}
                  </span>
                </div>

                {/* 5. Cash Raw Material Purchases */}
                {dayCashPurchases > 0 && (
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                        -
                      </span>
                      <div>
                        <span className="font-bold text-slate-200">Cash Stock Purchases</span>
                        <p className="text-[10px] text-amber-400 font-medium">Vegetables, bread, cheese vendor cash</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      -₹{dayCashPurchases}
                    </span>
                  </div>
                )}

                {/* Expected Cash in Drawer */}
                <div className="p-3.5 bg-slate-900/90 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                      Expected Cash in Drawer
                    </span>
                    <p className="text-[10px] text-slate-400">Galle me itna cash hona chahiye</p>
                  </div>
                  <span className="font-mono text-base font-black text-amber-400">
                    ₹{expectedCashInTill}
                  </span>
                </div>

              </div>
            </div>

            {/* Actual Physical Cash Counted */}
            <div className="bg-slate-850/80 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Actual Cash Counted in Drawer</h4>
                  <p className="text-[11px] text-slate-400">Physical count kitna nikla?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDenominationDetail(!showDenominationDetail)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  {showDenominationDetail ? 'Hide Note Count' : 'Count by Notes (₹500, ₹200...)'}
                </button>
              </div>

              {!showDenominationDetail ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-lg font-bold">₹</span>
                  <input
                    type="number"
                    value={manualActualCash}
                    onChange={(e) => setManualActualCash(e.target.value)}
                    placeholder={String(expectedCashInTill)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              ) : (
                /* Denomination Note Counter */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[500, 200, 100, 50, 20, 10].map(note => (
                    <div key={note} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-300">₹{note} ×</span>
                      <input
                        type="number"
                        min="0"
                        value={denominations[note]}
                        onChange={(e) => setDenominations(prev => ({ ...prev, [note]: e.target.value }))}
                        placeholder="0"
                        className="w-14 bg-slate-800 rounded-lg px-1.5 py-1 text-center font-mono text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300">Coins / Sikka:</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations.coins}
                      onChange={(e) => setDenominations(prev => ({ ...prev, coins: e.target.value }))}
                      placeholder="₹ Coins Total"
                      className="w-24 bg-slate-800 rounded-lg px-2 py-1 text-right font-mono text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4 text-right text-xs font-mono font-bold text-amber-400">
                    Denominations Total: ₹{calculatedDenominationsTotal}
                  </div>
                </div>
              )}
            </div>

            {/* ⚖️ Discrepancy Status Card */}
            <div className={`p-4 rounded-2xl border text-left transition-all ${
              discrepancy === 0
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : discrepancy > 0
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {discrepancy === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : discrepancy > 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wide">
                      {discrepancy === 0
                        ? 'Hisab Exact Match! (100% Barabar)'
                        : discrepancy > 0
                        ? `Surplus Cash (+₹${discrepancy} Extra)`
                        : `Shortage (Cash Kam) (-₹${Math.abs(discrepancy)} Missing)`}
                    </h4>
                    <p className="text-[11px] opacity-80">
                      Expected: ₹{expectedCashInTill} • Actual Count: ₹{effectiveActualCash}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-black">
                    {discrepancy >= 0 ? '+' : ''}₹{discrepancy}
                  </span>
                </div>
              </div>
            </div>

            {/* Closing Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Closing Remarks / Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Raat ka hisab complete, galla band..."
                rows={2}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSaveClosing}
                className="flex-1 min-w-[140px] py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Day Closing</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSlip}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                title="Print Thermal Shift Receipt"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Z-Report</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
                title="Copy formatted text to send on WhatsApp / Telegram"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-sky-400" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>

          </div>
        ) : (
          /* Tab 2: Past Closings History */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
            {closingHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <History className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-sm font-semibold">Abhi koi day-end closing record nahi hai.</p>
                <p className="text-xs">Aaj ka hisab save karte hi yahan history dikhegi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {closingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{item.date}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'matched'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'surplus'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {item.status === 'matched' ? 'Matched' : item.status === 'surplus' ? `+₹${item.difference} Surplus` : `-₹${Math.abs(item.difference)} Shortage`}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        By {item.closedBy || 'Owner'} • Expected: <span className="font-mono text-slate-200">₹{item.expectedCash}</span> • Actual: <span className="font-mono text-slate-200">₹{item.actualCash}</span>
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{item.notes}"</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Day Sales</div>
                      <div className="font-mono text-sm font-bold text-amber-400">
                        ₹{item.totalDaySales || 0}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {item.orderCount || 0} orders
                      </div>
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
