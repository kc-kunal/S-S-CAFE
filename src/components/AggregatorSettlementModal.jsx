import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bike, 
  IndianRupee, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  TrendingDown, 
  HelpCircle, 
  Building2, 
  FileText, 
  AlertCircle,
  Percent,
  Receipt,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { calculateAggregatorLedger } from '../utils/storage';

export default function AggregatorSettlementModal({
  isOpen,
  onClose,
  salesLogs = [],
  settlements = [],
  onAddSettlement,
  onDeleteSettlement,
  onAddExpense
}) {
  const [activeTab, setActiveTab] = useState('record'); // 'record', 'history', 'guide'
  const [selectedPlatform, setSelectedPlatform] = useState('Swiggy'); // 'Swiggy' or 'Zomato'
  
  // Ledger calculations
  const ledger = useMemo(() => {
    return calculateAggregatorLedger(salesLogs, settlements);
  }, [salesLogs, settlements]);

  const platLedger = ledger[selectedPlatform] || { totalGross: 0, totalSettledGross: 0, pendingUnsettled: 0 };

  // Settlement Form State
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [grossAmount, setGrossAmount] = useState('');
  const [bankAmountReceived, setBankAmountReceived] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [autoLogExpense, setAutoLogExpense] = useState(true);
  const [formError, setFormError] = useState('');

  // Quick fill gross amount with current pending amount
  const handleQuickFillPending = () => {
    if (platLedger.pendingUnsettled > 0) {
      setGrossAmount(String(platLedger.pendingUnsettled));
    }
  };

  // Auto calculate commission deductions: Gross - Net Bank Received
  const calculatedCommission = useMemo(() => {
    const gross = Number(grossAmount) || 0;
    const net = Number(bankAmountReceived) || 0;
    if (gross > 0 && net >= 0) {
      return Math.max(0, gross - net);
    }
    return 0;
  }, [grossAmount, bankAmountReceived]);

  const commissionPct = useMemo(() => {
    const gross = Number(grossAmount) || 0;
    if (gross > 0 && calculatedCommission > 0) {
      return ((calculatedCommission / gross) * 100).toFixed(1);
    }
    return '0.0';
  }, [grossAmount, calculatedCommission]);

  // Submit Settlement
  const handleSubmitSettlement = (e) => {
    e.preventDefault();
    setFormError('');

    const gross = Number(grossAmount);
    const net = Number(bankAmountReceived);

    if (!gross || gross <= 0) {
      setFormError('Kripya valid Gross Order Amount bharein jo is payout me settle ho raha hai.');
      return;
    }

    if (net === undefined || net === '' || net < 0) {
      setFormError('Kripya bank me aaya hua actual paisa (Net Bank Credit) bharein.');
      return;
    }

    if (net > gross) {
      setFormError('Bank amount gross order value se zyada nahi ho sakti!');
      return;
    }

    const newSettlement = {
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      platform: selectedPlatform,
      settlementDate: settlementDate || new Date().toISOString().split('T')[0],
      grossAmount: gross,
      commissionDeducted: calculatedCommission,
      bankAmountReceived: net,
      referenceNo: referenceNo.trim() || 'N/A',
      notes: notes.trim() || `Weekly ${selectedPlatform} Payout`,
      expenseLogged: autoLogExpense && calculatedCommission > 0,
      createdAt: new Date().toISOString()
    };

    onAddSettlement(newSettlement);

    // If user wants to auto-log the platform cut into Cafe Operational Expenses
    if (autoLogExpense && calculatedCommission > 0 && onAddExpense) {
      onAddExpense({
        id: `exp-comm-${Date.now()}`,
        title: `${selectedPlatform} Payout Commission & Deductions`,
        category: 'Platform Commission',
        amount: calculatedCommission,
        date: settlementDate || new Date().toISOString().split('T')[0],
        paymentMode: 'Online',
        paidTo: selectedPlatform,
        notes: `Platform cut for ₹${gross} gross orders (Bank UTR: ${referenceNo || 'None'}). Commission rate ~${commissionPct}%`
      });
    }

    // Reset Form
    setGrossAmount('');
    setBankAmountReceived('');
    setReferenceNo('');
    setNotes('');
    setActiveTab('history');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Bike className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif-title text-amber-100">
                  Swiggy & Zomato Payouts & Settlement
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Weekly Ledger
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Manage online aggregator orders, weekly bank payouts & auto-deduct commission fees
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Status Cards: Swiggy vs Zomato Live Pending */}
        <div className="p-4 sm:p-5 bg-stone-50 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Swiggy Card */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-orange-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#e85d04] uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f48c06]"></span>
                🟠 Swiggy
              </span>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                {ledger.Swiggy.totalOrdersCount} orders
              </span>
            </div>
            
            <div className="my-2">
              <div className="text-[11px] text-stone-500 font-semibold">Pending Unsettled Payout:</div>
              <div className="text-xl font-black text-stone-900 flex items-center">
                ₹{ledger.Swiggy.pendingUnsettled.toLocaleString()}
              </div>
            </div>

            <div className="text-[10px] text-stone-500 flex justify-between border-t border-stone-100 pt-1.5 mt-1">
              <span>Gross: ₹{ledger.Swiggy.totalGross.toLocaleString()}</span>
              <span>Bank: ₹{ledger.Swiggy.totalBankReceived.toLocaleString()}</span>
            </div>
          </div>

          {/* Zomato Card */}
          <div className="bg-white p-3.5 rounded-2xl border-2 border-rose-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#d90429] uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef233c]"></span>
                🔴 Zomato
              </span>
              <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                {ledger.Zomato.totalOrdersCount} orders
              </span>
            </div>

            <div className="my-2">
              <div className="text-[11px] text-stone-500 font-semibold">Pending Unsettled Payout:</div>
              <div className="text-xl font-black text-stone-900 flex items-center">
                ₹{ledger.Zomato.pendingUnsettled.toLocaleString()}
              </div>
            </div>

            <div className="text-[10px] text-stone-500 flex justify-between border-t border-stone-100 pt-1.5 mt-1">
              <span>Gross: ₹{ledger.Zomato.totalGross.toLocaleString()}</span>
              <span>Bank: ₹{ledger.Zomato.totalBankReceived.toLocaleString()}</span>
            </div>
          </div>

          {/* Combined Health Card */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                🏦 Total Pending Bank Payout
              </span>
              <Clock className="w-4 h-4 text-amber-200" />
            </div>

            <div className="my-1.5">
              <div className="text-2xl font-black text-white">
                ₹{ledger.overall.pendingUnsettled.toLocaleString()}
              </div>
              <p className="text-[10px] text-amber-100/90 mt-0.5">
                Paisa platforms ke paas hai (Hafte me transfer hoga)
              </p>
            </div>

            <div className="text-[10px] text-amber-100/80 border-t border-amber-500/40 pt-1 flex justify-between">
              <span>Total Cut: ₹{ledger.overall.totalCommission.toLocaleString()}</span>
              <span>Deposited: ₹{ledger.overall.totalBankReceived.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-stone-200 bg-white">
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'record'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ➕ Record Weekly Settlement
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>📜 Settlement Ledger</span>
            <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px]">
              {settlements.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
              activeTab === 'guide'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Kaise Kaam Karta Hai? (Guide)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* TAB 1: RECORD SETTLEMENT */}
          {activeTab === 'record' && (
            <form onSubmit={handleSubmitSettlement} className="space-y-4">
              
              {/* Platform Selector */}
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                  1. Kis Platform Ka Payout Aaya Hai?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedPlatform('Swiggy'); setFormError(''); }}
                    className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedPlatform === 'Swiggy'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md ring-2 ring-orange-400/30'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#f48c06]"></span>
                    <span>🟠 Swiggy (Pending: ₹{ledger.Swiggy.pendingUnsettled.toLocaleString()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSelectedPlatform('Zomato'); setFormError(''); }}
                    className={`py-3 px-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedPlatform === 'Zomato'
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-md ring-2 ring-rose-400/30'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#e5383b]"></span>
                    <span>🔴 Zomato (Pending: ₹{ledger.Zomato.pendingUnsettled.toLocaleString()})</span>
                  </button>
                </div>
              </div>

              {/* Settlement Date & Quick Fill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Payout / Bank Credit Date:
                  </label>
                  <input
                    type="date"
                    value={settlementDate}
                    onChange={(e) => setSettlementDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Gross Order Amount (₹):
                    </label>
                    {platLedger.pendingUnsettled > 0 && (
                      <button
                        type="button"
                        onClick={handleQuickFillPending}
                        className="text-[10px] text-amber-700 font-extrabold hover:underline cursor-pointer"
                      >
                        Fill Pending (₹{platLedger.pendingUnsettled})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5000"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Kul kitne rupaye ke orders is settlement me clear hue
                  </p>
                </div>
              </div>

              {/* Bank Credit & Auto Computed Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-emerald-800 block mb-1">
                    💵 Actual Bank Me Kitna Paisa Aaya? (Net Credit):
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3900"
                    value={bankAmountReceived}
                    onChange={(e) => setBankAmountReceived(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-emerald-700 mt-1">
                    Bank SMS ya passbook me aaya hua net credit amount
                  </p>
                </div>

                {/* Auto Calculated Commission Box */}
                <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-600">
                      Platform Commission & Taxes Cut:
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.5 rounded">
                      {commissionPct}% Cut
                    </span>
                  </div>
                  <div className="text-xl font-black text-rose-700 mt-1">
                    ₹{calculatedCommission.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-stone-500">
                    Gross (₹{grossAmount || 0}) - Bank (₹{bankAmountReceived || 0})
                  </span>
                </div>
              </div>

              {/* UTR Reference & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Bank UTR / Transaction Reference (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SWG-UTR-908123"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Notes / Remarks (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly settlement for Oct week 1"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Auto Log Expense Checkbox */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoLogExp"
                  checked={autoLogExpense}
                  onChange={(e) => setAutoLogExpense(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="autoLogExp" className="text-xs text-stone-700 cursor-pointer">
                  <span className="font-extrabold text-stone-900 block">
                    Auto-record Commission (₹{calculatedCommission}) in Cafe Expenses
                  </span>
                  Isse aapka P&L Dashboard 100% accurate rahega aur Swiggy/Zomato commission apne aap cafe ke kharchon me shamil ho jayega.
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Weekly Settlement & Clear Pending Balance</span>
              </button>

            </form>
          )}

          {/* TAB 2: SETTLEMENT HISTORY LEDGER */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-700 uppercase">
                  Past Settled Payouts Ledger ({settlements.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('record')}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  ➕ Record New Settlement
                </button>
              </div>

              {settlements.length === 0 ? (
                <div className="py-12 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Abhi tak koi payout settle nahi kiya gaya hai.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                  {settlements.map((set) => (
                    <div key={set.id} className="p-3.5 sm:p-4 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-sm ${
                          set.platform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'
                        }`}>
                          {set.platform === 'Swiggy' ? 'SW' : 'ZM'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                              {set.platform} Weekly Settlement
                            </span>
                            <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded">
                              {set.settlementDate}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>Ref: <strong className="text-stone-700">{set.referenceNo || 'N/A'}</strong></span>
                            {set.notes && <span>• {set.notes}</span>}
                            {set.expenseLogged && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded">
                                ✓ Commission Logged in Expenses
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-black text-emerald-700">
                            +₹{set.bankAmountReceived.toLocaleString()} <span className="text-[10px] font-semibold text-emerald-600">in Bank</span>
                          </div>
                          <div className="text-[10px] text-stone-500">
                            Gross: ₹{set.grossAmount} • Cut: <span className="text-rose-600 font-bold">-₹{set.commissionDeducted}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Kya aap is ${set.platform} settlement record ko delete karna chahte hain?`)) {
                              onDeleteSettlement(set.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete settlement record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: USER GUIDE (IN HINDI / HINGLISH) */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200">
              <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Swiggy & Zomato Accounting Samajhne Ke Niyam (Rules):</span>
              </h4>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <h5 className="font-bold text-stone-900 mb-1">1. Daily Sales vs Bank Cash Flow</h5>
                  <p>
                    Rozana shaam ko apne cash drawer me sirf **Counter Cash** check karein. Swiggy aur Zomato ka paisa alag bucket ("Pending Payout") me jama hota rehta hai, kyonki platforms har hafte (usually Tuesday/Thursday) bank transfer karte hain.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <h5 className="font-bold text-stone-900 mb-1">2. Menu Price & Offers (Discounts) Ka Funda</h5>
                  <p>
                    Aggregators par cafe 20% se 25% price zyada rakhte hain taaki commission cover ho. Jab bhi aap koi custom order ya discount offer lagate hain (e.g. ₹50 flat promo), to <strong>"🛵 Punch Online Order"</strong> button ka use karein taaki exact net bill record ho.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <h5 className="font-bold text-stone-900 mb-1">3. Jab Hafte Baad Bank Me Payout Aaye</h5>
                  <p>
                    Jab Swiggy/Zomato se payout ka email/SMS aaye (e.g. <em>"₹3,900 credited for ₹5,000 orders"</em>), tab is modal me aakar <strong>"Record Weekly Settlement"</strong> karein:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-600">
                    <li>Gross Order Amount: ₹5,000</li>
                    <li>Net Bank Received: ₹3,900</li>
                    <li>Platform Commission: Apne aap ₹1,100 calculate hokar cafe expenses me add ho jayegi!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
