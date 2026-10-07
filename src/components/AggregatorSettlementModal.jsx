import React, { useState, useMemo, useEffect } from 'react';
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
  Receipt,
  Sparkles,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { calculateAggregatorLedger } from '../utils/storage';

export default function AggregatorSettlementModal({
  isOpen,
  onClose,
  salesLogs = [],
  settlements = [],
  initialPlatform = 'Swiggy',
  onAddSettlement,
  onDeleteSettlement,
  onClearAllSettlements,
  onDeleteSale,
  onAddExpense
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('Swiggy');
  const [activeSubView, setActiveSubView] = useState('items'); // 'items' or 'settle'
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Sync initial platform when opening
  useEffect(() => {
    if (isOpen) {
      if (initialPlatform && (initialPlatform === 'Swiggy' || initialPlatform === 'Zomato')) {
        setSelectedPlatform(initialPlatform);
      }
      setSearchQuery('');
      setFormError('');
      setFormSuccess('');
    }
  }, [isOpen, initialPlatform]);

  // Overall Ledger calculation
  const ledger = useMemo(() => {
    return calculateAggregatorLedger(salesLogs, settlements);
  }, [salesLogs, settlements]);

  const platLedger = ledger[selectedPlatform] || { 
    totalGross: 0, 
    totalOrdersCount: 0, 
    totalUnitsSold: 0, 
    totalDiscountGiven: 0, 
    totalSettledGross: 0, 
    totalBankReceived: 0, 
    totalCommissionDeducted: 0, 
    pendingUnsettled: 0, 
    settlementsCount: 0 
  };

  // Filtered sales list for the active platform (sorted newest first)
  const platSales = useMemo(() => {
    return salesLogs
      .filter(s => (s.paymentMethod || '').toLowerCase() === selectedPlatform.toLowerCase())
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [salesLogs, selectedPlatform]);

  // Filtered sales matching search query
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return platSales;
    const q = searchQuery.toLowerCase().trim();
    return platSales.filter(s => 
      (s.itemName && s.itemName.toLowerCase().includes(q)) ||
      (s.platformOrderId && s.platformOrderId.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  }, [platSales, searchQuery]);

  // Filtered settlements for active platform
  const platSettlements = useMemo(() => {
    return settlements
      .filter(s => (s.platform || '').toLowerCase() === selectedPlatform.toLowerCase())
      .sort((a, b) => new Date(b.settlementDate || b.createdAt) - new Date(a.settlementDate || a.createdAt));
  }, [settlements, selectedPlatform]);

  // Settlement Form State
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [grossAmount, setGrossAmount] = useState('');
  const [bankAmountReceived, setBankAmountReceived] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [autoLogExpense, setAutoLogExpense] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Quick fill gross amount with current pending amount
  const handleQuickFillPending = () => {
    if (platLedger.pendingUnsettled > 0) {
      setGrossAmount(String(platLedger.pendingUnsettled));
      setFormError('');
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
    setFormSuccess('');

    const gross = Number(grossAmount);
    const net = Number(bankAmountReceived);

    if (!gross || gross <= 0) {
      setFormError('Kripya valid Gross Order Amount bharein jo is settlement me clear hua hai.');
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

    if (onAddSettlement) {
      onAddSettlement(newSettlement);
    }

    // Auto-log commission cut into Cafe Expenses
    if (autoLogExpense && calculatedCommission > 0 && onAddExpense) {
      onAddExpense({
        id: `exp-comm-${Date.now()}`,
        title: `${selectedPlatform} Payout Commission & Deductions`,
        category: 'Platform Commission',
        amount: calculatedCommission,
        date: settlementDate || new Date().toISOString().split('T')[0],
        paymentMode: 'Online',
        paidTo: selectedPlatform,
        notes: `Platform cut for ₹${gross} gross orders (Ref: ${referenceNo || 'None'}). Rate: ~${commissionPct}%`
      });
    }

    // Success state & reset
    setFormSuccess(`₹${net.toLocaleString()} Bank settlement successfully save ho gaya!`);
    setGrossAmount('');
    setBankAmountReceived('');
    setReferenceNo('');
    setNotes('');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Compact Clean Header */}
        <div className="bg-stone-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
              <Bike className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-100 font-serif-title">
                  Online Payout & Order Dashboard
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Live Ledger
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Punched items, pending bank balance aur weekly settlements
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Band Karein"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Switcher (Big & Clear) */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setSelectedPlatform('Swiggy'); setFormError(''); }}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedPlatform === 'Swiggy'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-400'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <span className="text-base">🟠</span>
              <span>Swiggy</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                selectedPlatform === 'Swiggy' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
              }`}>
                {ledger.Swiggy.totalOrdersCount} items • ₹{ledger.Swiggy.pendingUnsettled.toLocaleString()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedPlatform('Zomato'); setFormError(''); }}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedPlatform === 'Zomato'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-400'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <span className="text-base">🔴</span>
              <span>Zomato</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                selectedPlatform === 'Zomato' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {ledger.Zomato.totalOrdersCount} items • ₹{ledger.Zomato.pendingUnsettled.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Clean, Elegant Metric Cards */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          
          {/* 1. Total Punched Sales */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
              <span>Kul Punched Orders</span>
            </span>
            <div className="my-1">
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                ₹{platLedger.totalGross.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                {platLedger.totalDiscountGiven > 0 ? (
                  <span>Menu: ₹{platLedger.totalMenuValue || (platLedger.totalGross + platLedger.totalDiscountGiven)} <strong className="text-rose-600 font-bold">(-₹{platLedger.totalDiscountGiven} Off)</strong></span>
                ) : (
                  <span>{platSales.length} orders ({platLedger.totalUnitsSold} items)</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Pending Bank Payout (PROMINENT HIGHLIGHT) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Bank Me Aana Baki (Pending)</span>
              </span>
              <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-md">
                Unsettled
              </span>
            </div>
            <div className="my-1">
              <div className="text-xl sm:text-2xl font-black text-amber-700">
                ₹{platLedger.pendingUnsettled.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-900/80 font-medium">
                Paisa {selectedPlatform} ke paas hai (Weekly aayega)
              </div>
            </div>
          </div>

          {/* 3. Bank Me Received (Settled) */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bank Me Received (Settled)</span>
            </span>
            <div className="my-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                ₹{platLedger.totalBankReceived.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 font-medium">
                {platSettlements.length} weekly payouts deposited
              </div>
            </div>
          </div>

        </div>

        {/* Clean 2-Tab Navigation Bar */}
        <div className="flex items-center justify-between px-5 pt-2.5 pb-2 border-b border-stone-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView('items')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'items'
                  ? 'bg-amber-100 text-amber-900 font-extrabold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Sold Items List ({platSales.length})</span>
            </button>

            <button
              onClick={() => setActiveSubView('settle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'settle'
                  ? 'bg-amber-100 text-amber-900 font-extrabold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Record Bank Settlement ({platSettlements.length})</span>
            </button>
          </div>

          {/* Quick Guide Toggle */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Kaise Kaam Karta Hai?</span>
            {showGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Mini Guide */}
        {showGuide && (
          <div className="p-3.5 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-950 space-y-1 shrink-0 animate-in fade-in duration-150">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Swiggy & Zomato Accounting Simple Funda:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              • <strong>Daily Sales:</strong> Online orders ka daily cash nahi aata. Yeh 'Pending Bank Payout' me add hota rehta hai.<br />
              • <strong>Weekly Bank Payout:</strong> Har hafte jab Swiggy/Zomato se bank me paisa transfer ho, tab <strong>"Record Bank Settlement"</strong> me jakar gross aur bank net amount save karein.<br />
              • <strong>Commission Auto-Deduct:</strong> Platform cut apne aap cafe expenses me shamil ho jayega!
            </p>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

          {/* VIEW 1: SOLD ITEMS & ORDERS LIST (DEFAULT - SOLVES USER PROBLEM!) */}
          {activeSubView === 'items' && (
            <div className="space-y-3">
              
              {/* Header with Search and Quick CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <span>{selectedPlatform === 'Swiggy' ? '🟠 Swiggy' : '🔴 Zomato'} Par Beche Gaye Items</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                      {platSales.length} Orders
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Niche aapke is platform par punch kiye gaye sabhi orders ki live list hai
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Item name ya order..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
                    />
                  </div>

                  {platLedger.pendingUnsettled > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubView('settle');
                        handleQuickFillPending();
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>Settle Bank Payout</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Discount / Promo Notice Banner if any discount was applied */}
              {platLedger.totalDiscountGiven > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-extrabold text-amber-950 block">
                      💡 Notice: Punched orders me ₹{platLedger.totalDiscountGiven} ka Promo / Offer Discount laga hua hai!
                    </span>
                    <span className="text-[11px] text-amber-900/90 leading-relaxed block mt-0.5">
                      Items ka Menu Rate <strong>₹{platLedger.totalMenuValue || (platLedger.totalGross + platLedger.totalDiscountGiven)}</strong> tha, lekin punch karte waqt <strong>-₹{platLedger.totalDiscountGiven}</strong> offer discount lagne ke karan customer net bill <strong>₹{platLedger.totalGross}</strong> bana. Isliye bank payout me <strong>₹{platLedger.pendingUnsettled}</strong> dikh raha hai. Agar bina discount ke punch karna tha, to aap niche list me se order 🗑️ delete karke dobara punch kar sakte hain.
                    </span>
                  </div>
                </div>
              )}

              {/* Items List */}
              {platSales.length === 0 ? (
                <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 p-6">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-700">
                    Abhi tak koi {selectedPlatform} order punch nahi hua hai
                  </h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                    Sales screen par jakar "🛵 Punch Online Order" button se Swiggy ya Zomato ke orders punch karein, wo turant yahan dikhne lagenge.
                  </p>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 text-xs">
                  "{searchQuery}" se match karta hua koi item nahi mila.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {filteredSales.map((sale, idx) => (
                    <div 
                      key={sale.id || idx} 
                      className="p-3 sm:p-3.5 hover:bg-stone-50 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Left: Item Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-xs ${
                          selectedPlatform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'
                        }`}>
                          {sale.quantitySold}x
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                              {sale.itemName}
                            </span>
                            {sale.platformOrderId && (
                              <span className="text-[10px] font-mono bg-stone-100 text-stone-700 font-bold px-1.5 py-0.2 rounded border border-stone-200">
                                {sale.platformOrderId}
                              </span>
                            )}
                            <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded">
                              {sale.category || 'General'}
                            </span>
                          </div>

                          <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>📅 {sale.date}</span>
                            <span>•</span>
                            <span>Rate: ₹{sale.sellingPrice}</span>
                            {sale.discountAmount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">
                                  -₹{sale.discountAmount} Promo
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Net Total & Status & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-black text-stone-900">
                            ₹{(sale.totalRevenue || 0).toLocaleString()}
                          </div>
                          <div className="mt-0.5">
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending Payout</span>
                            </span>
                          </div>
                        </div>

                        {onDeleteSale && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Kya aap "${sale.itemName}" (${sale.platformOrderId || 'Order'}) ko delete karna chahte hain? Raw material stock wapas restore ho jayega.`)) {
                                onDeleteSale(sale.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Order delete karein"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}

                  {/* Summary Bar at list end */}
                  <div className="p-3 bg-stone-50 text-xs text-stone-600 font-semibold flex items-center justify-between">
                    <span>
                      Kul <strong>{filteredSales.length}</strong> items dikh rahe hain
                    </span>
                    <span className="font-bold text-stone-900">
                      Subtotal: ₹{filteredSales.reduce((s, i) => s + (Number(i.totalRevenue) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 2: RECORD SETTLEMENT & HISTORY */}
          {activeSubView === 'settle' && (
            <div className="space-y-5">
              
              {/* Form Card */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                      <span>🏦 {selectedPlatform} Bank Payout Record Karein</span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Jab weekly payout bank me credit ho, tab yahan entry karke pending balance clear karein
                    </p>
                  </div>

                  {platLedger.pendingUnsettled > 0 && (
                    <button
                      type="button"
                      onClick={handleQuickFillPending}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer"
                    >
                      Fill Pending (₹{platLedger.pendingUnsettled})
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitSettlement} className="space-y-3.5">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Gross Orders Settle Amount */}
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        1. Gross Orders Settle Amount (₹):
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 5000"
                        value={grossAmount}
                        onChange={(e) => setGrossAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Is payout me kitne rupaye ke orders clear ho rahe hain
                      </span>
                    </div>

                    {/* Net Bank Credit Received */}
                    <div>
                      <label className="text-xs font-bold text-emerald-800 block mb-1">
                        2. Actual Bank Me Kitna Paisa Aaya? (Net Credit) (₹):
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 3900"
                        value={bankAmountReceived}
                        onChange={(e) => setBankAmountReceived(e.target.value)}
                        className="w-full px-3 py-2 bg-emerald-50/40 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      <span className="text-[10px] text-emerald-700 mt-0.5 block">
                        Aapke bank account me transfer hua net amount
                      </span>
                    </div>

                  </div>

                  {/* Calculated Platform Cut Summary Box */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stone-600 block">
                        Auto Calculated Platform Commission & Taxes:
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Gross (₹{grossAmount || 0}) − Bank (₹{bankAmountReceived || 0})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-rose-600">
                        ₹{calculatedCommission.toLocaleString()}
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                        {commissionPct}% Cut
                      </span>
                    </div>
                  </div>

                  {/* Date & UTR */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-600 block mb-1">
                        Bank Credit Date:
                      </label>
                      <input
                        type="date"
                        value={settlementDate}
                        onChange={(e) => setSettlementDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-600 block mb-1">
                        Bank UTR / Ref No (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SWG-UTR-908123"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Auto Log Expense Checkbox */}
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="autoLogExp"
                      checked={autoLogExpense}
                      onChange={(e) => setAutoLogExpense(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="autoLogExp" className="text-xs text-stone-700 cursor-pointer">
                      <span className="font-bold text-stone-900">
                        Commission (₹{calculatedCommission}) Cafe Expenses me auto-add karein
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Isse Profit & Loss Dashboard 100% accurate rahega
                      </span>
                    </label>
                  </div>

                  {formError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Bank Settlement & Clear Pending</span>
                  </button>

                </form>
              </div>

              {/* Past Settlements History */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 uppercase">
                    Past Settled Payouts ({platSettlements.length})
                  </h4>

                  {platSettlements.length > 0 && onClearAllSettlements && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Kya aap sabhi settlement history clear karna chahte hain? Real sales par iska asar nahi padega.')) {
                          onClearAllSettlements();
                        }
                      }}
                      className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear All History</span>
                    </button>
                  )}
                </div>

                {platSettlements.length === 0 ? (
                  <div className="py-6 text-center text-stone-400 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                    Abhi tak koi payout settle nahi kiya gaya hai.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-white">
                    {platSettlements.map((set) => (
                      <div key={set.id} className="p-3 hover:bg-stone-50 transition-colors flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-900 text-xs">
                              {set.platform} Payout
                            </span>
                            <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.2 rounded">
                              {set.settlementDate}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Gross: ₹{set.grossAmount} • Ref: {set.referenceNo || 'N/A'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-700">
                              +₹{set.bankAmountReceived.toLocaleString()} in Bank
                            </div>
                            <div className="text-[10px] text-rose-600 font-bold">
                              -₹{set.commissionDeducted} Cut
                            </div>
                          </div>

                          {onDeleteSettlement && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Kya aap is ${set.platform} settlement record ko delete karna chahte hain?`)) {
                                  onDeleteSettlement(set.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
