import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Bike, 
  IndianRupee, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Building2, 
  ShoppingBag, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Search,
  RotateCcw,
  Tag,
  Wand2,
  Check
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
  onUpdateSale,
  onAddExpense
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('Swiggy');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'settle'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single-input settlement state
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAmountReceived, setBankAmountReceived] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sync initial platform when opening
  useEffect(() => {
    if (isOpen) {
      if (initialPlatform && (initialPlatform === 'Swiggy' || initialPlatform === 'Zomato')) {
        setSelectedPlatform(initialPlatform);
      }
      setSearchQuery('');
      setFormError('');
      setFormSuccess('');
      setBankAmountReceived('');
    }
  }, [isOpen, initialPlatform]);

  // Overall Ledger calculation
  const ledger = useMemo(() => {
    return calculateAggregatorLedger(salesLogs, settlements);
  }, [salesLogs, settlements]);

  const platLedger = ledger[selectedPlatform] || { 
    totalMenuValue: 0,
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

  // Filtered sales list for the active platform (newest first)
  const platSales = useMemo(() => {
    return salesLogs
      .filter(s => (s.paymentMethod || '').toLowerCase() === selectedPlatform.toLowerCase())
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [salesLogs, selectedPlatform]);

  // Compute settled vs pending status for each sale accurately
  const salesWithSettledStatus = useMemo(() => {
    let remainingSettled = Number(platLedger.totalSettledGross) || 0;
    const isAllSettled = platLedger.pendingUnsettled === 0 && platLedger.totalSettledGross > 0;

    // Process from oldest to newest to match settlement consumption, then reverse back to newest first
    return [...platSales].reverse().map(sale => {
      const rev = Number(sale.totalRevenue) || 0;
      let isSettled = false;
      if (isAllSettled) {
        isSettled = true;
      } else if (remainingSettled >= rev && rev > 0) {
        isSettled = true;
        remainingSettled -= rev;
      }
      return { ...sale, isSettled };
    }).reverse();
  }, [platSales, platLedger.totalSettledGross, platLedger.pendingUnsettled]);

  // Filtered sales matching search query
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return salesWithSettledStatus;
    const q = searchQuery.toLowerCase().trim();
    return salesWithSettledStatus.filter(s => 
      (s.itemName && s.itemName.toLowerCase().includes(q)) ||
      (s.platformOrderId && s.platformOrderId.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q))
    );
  }, [salesWithSettledStatus, searchQuery]);

  // Filtered settlements for active platform
  const platSettlements = useMemo(() => {
    return settlements
      .filter(s => (s.platform || '').toLowerCase() === selectedPlatform.toLowerCase())
      .sort((a, b) => new Date(b.settlementDate || b.createdAt) - new Date(a.settlementDate || a.createdAt));
  }, [settlements, selectedPlatform]);

  // Auto calculate commission deductions: Pending Gross - Net Bank Received
  const calculatedCommission = useMemo(() => {
    const gross = platLedger.pendingUnsettled;
    const net = Number(bankAmountReceived) || 0;
    if (gross > 0 && net >= 0) {
      return Math.max(0, gross - net);
    }
    return 0;
  }, [platLedger.pendingUnsettled, bankAmountReceived]);

  const commissionPct = useMemo(() => {
    const gross = platLedger.pendingUnsettled;
    if (gross > 0 && calculatedCommission > 0) {
      return ((calculatedCommission / gross) * 100).toFixed(1);
    }
    return '0.0';
  }, [platLedger.pendingUnsettled, calculatedCommission]);

  // Submit Settlement - USER ONLY ENTERS BANK AMOUNT!
  const handleSubmitSettlement = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const gross = platLedger.pendingUnsettled;
    const net = Number(bankAmountReceived);

    if (gross <= 0) {
      setFormError('Settle karne ke liye koi pending balance nahi hai.');
      return;
    }

    if (net === undefined || net === '' || isNaN(net) || net < 0) {
      setFormError('Kripya bank account me aaya hua actual paisa bharein.');
      return;
    }

    if (net > gross) {
      setFormError(`Bank me aaya paisa pending order bill (₹${gross}) se zyada nahi ho sakta!`);
      return;
    }

    const newSettlement = {
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      platform: selectedPlatform,
      settlementDate: settlementDate || new Date().toISOString().split('T')[0],
      grossAmount: gross,
      commissionDeducted: calculatedCommission,
      bankAmountReceived: net,
      referenceNo: `Bank Credit - ${settlementDate}`,
      notes: `${selectedPlatform} Weekly Payout Settled`,
      expenseLogged: calculatedCommission > 0,
      createdAt: new Date().toISOString()
    };

    if (onAddSettlement) {
      onAddSettlement(newSettlement);
    }

    // Auto-log commission cut into Cafe Expenses
    if (calculatedCommission > 0 && onAddExpense) {
      onAddExpense({
        id: `exp-comm-${Date.now()}`,
        title: `${selectedPlatform} Commission Cut`,
        category: 'Platform Commission',
        amount: calculatedCommission,
        date: settlementDate || new Date().toISOString().split('T')[0],
        paymentMode: 'Online',
        paidTo: selectedPlatform,
        notes: `Platform cut for ₹${gross} orders. Rate: ~${commissionPct}%`
      });
    }

    setFormSuccess(`✅ ₹${net.toLocaleString()} Bank me jama ho gaya! Sabhi orders settle ho gaye.`);
    setBankAmountReceived('');
    setTimeout(() => {
      setFormSuccess('');
      setActiveTab('orders');
    }, 1500);
  };

  // Helper to remove offer discount and restore full price (e.g. fix 140 back to 160)
  const handleFixDiscount = (sale, fullPrice) => {
    if (!onUpdateSale) return;
    const target = fullPrice || ((Number(sale.sellingPrice) || 0) * (Number(sale.quantitySold) || 1));
    const updated = {
      ...sale,
      discountAmount: 0,
      totalRevenue: target
    };
    onUpdateSale(updated);
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
                  {selectedPlatform} Payouts & Orders
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Live Status
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Punched orders, offer details aur bank settlement ledger
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

        {/* Big Clean 2-Platform Switcher */}
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
                {ledger.Swiggy.totalOrdersCount} orders • ₹{ledger.Swiggy.pendingUnsettled.toLocaleString()}
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
                {ledger.Zomato.totalOrdersCount} orders • ₹{ledger.Zomato.pendingUnsettled.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Simple Metric Cards */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          
          {/* Card 1: Pending Bank Payout */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 rounded-2xl border-2 border-amber-400 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Bank Me Aana Baki:</span>
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                Pending
              </span>
            </div>
            <div className="my-1.5">
              <div className="text-2xl sm:text-3xl font-black text-amber-700">
                ₹{platLedger.pendingUnsettled.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-900/90 font-semibold mt-0.5">
                {platLedger.pendingUnsettled > 0 ? 'Paisa bank me aana baki hai' : '✅ Sabhi payouts bank me jama ho chuke hain'}
              </div>
            </div>
          </div>

          {/* Card 2: Total Items Sold */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wide flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-stone-400" />
              <span>Kul Beche Gaye Orders:</span>
            </span>
            <div className="my-1.5">
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                ₹{platLedger.totalGross.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                {platSales.length} orders ({platLedger.totalUnitsSold} items beche)
              </div>
            </div>
          </div>

          {/* Card 3: Already Deposited in Bank */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Bank Me Deposit Hua (Settled):</span>
            </span>
            <div className="my-1.5">
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                ₹{platLedger.totalBankReceived.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                {platSettlements.length} settlements bank me jama hue
              </div>
            </div>
          </div>

        </div>

        {/* 2 Clean Views: Orders List vs Bank Settle */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-stone-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-amber-100 text-amber-900 font-extrabold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>📦 Beche Gaye Orders ({platSales.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settle');
                setFormError('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settle'
                  ? 'bg-emerald-100 text-emerald-900 font-extrabold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏦 Bank Me Paisa Aagaya? Settle Karein</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: ORDERS LIST */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              
              {/* Header with Search and Quick Settle Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <span>{selectedPlatform === 'Swiggy' ? '🟠 Swiggy' : '🔴 Zomato'} Par Beche Gaye Orders</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Aapke beche gaye sabhi orders aur unka live bank status
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search order/item..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
                    />
                  </div>

                  {platLedger.pendingUnsettled > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settle')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>Bank Me Settle Karein</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

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
                    Sales screen par upar "🛵 Punch Online Order" button se Swiggy ya Zomato ke orders punch karein.
                  </p>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="py-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 text-xs">
                  "{searchQuery}" se match karta hua koi item nahi mila.
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {filteredSales.map((sale, idx) => {
                    const menuRate = Number(sale.sellingPrice) || 0;
                    const qty = Number(sale.quantitySold) || 1;
                    const expectedTotal = menuRate * qty;
                    const actualTotal = Number(sale.totalRevenue) || 0;
                    const recordedDiscount = Number(sale.discountAmount) || 0;
                    const calculatedDiscount = Math.max(0, expectedTotal - actualTotal);
                    const discountAmt = recordedDiscount > 0 ? recordedDiscount : calculatedDiscount;
                    const isDiscounted = discountAmt > 0 || (expectedTotal > actualTotal);
                    const isSettled = Boolean(sale.isSettled);

                    return (
                      <div 
                        key={sale.id || idx} 
                        className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDiscounted ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-rose-500' : 'hover:bg-stone-50'
                        }`}
                      >
                        {/* Left: Item Details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5 shadow-xs ${
                            selectedPlatform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'
                          }`}>
                            {qty}x
                          </div>
                          
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                {sale.itemName}
                              </span>
                              {sale.platformOrderId && (
                                <span className="text-[10px] font-mono bg-stone-100 text-stone-700 font-bold px-1.5 py-0.2 rounded border border-stone-200">
                                  {sale.platformOrderId}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-stone-500 flex items-center gap-2 flex-wrap">
                              <span>📅 {sale.date}</span>
                              <span>•</span>
                              <span>{qty} items × ₹{menuRate} = <strong>₹{expectedTotal}</strong></span>
                            </div>

                            {/* PROMINENT OFFER / DISCOUNT BANNER ON THIS SPECIFIC ITEM */}
                            {isDiscounted && (
                              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md text-[11px] font-extrabold">
                                  <Tag className="w-3 h-3 text-rose-600" />
                                  <span>🏷️ Is Item Par Offer Laga Tha: -₹{discountAmt} OFF</span>
                                </span>
                                <span className="text-[11px] text-rose-700 font-medium">
                                  (Menu: ₹{expectedTotal} − Offer: ₹{discountAmt} = Net: ₹{actualTotal})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Price & Real-time Settled / Pending Status */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                          
                          {/* 1-Click Fix Button to restore full price if user didn't want discount */}
                          {isDiscounted && onUpdateSale && (
                            <button
                              type="button"
                              onClick={() => handleFixDiscount(sale, expectedTotal)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              title="Offer discount hata kar poora rate karein"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>⚡ Offer Hatao (₹{expectedTotal} Banao)</span>
                            </button>
                          )}

                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black text-stone-900">
                              ₹{actualTotal.toLocaleString()}
                            </div>
                            
                            {/* DYNAMIC LIVE SETTLED VS PENDING STATUS */}
                            <div className="mt-0.5">
                              {isSettled ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>✅ Bank Me Aa Chuka (Settled)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>⏳ Bank Me Aana Baki (Pending)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Order Button */}
                          {onDeleteSale && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Kya aap "${sale.itemName}" (${sale.platformOrderId || 'Order'}) ko delete karna chahte hain? Stock wapas add ho jayega.`)) {
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
                    );
                  })}

                  {/* Summary Bar */}
                  <div className="p-3 bg-stone-50 text-xs text-stone-600 font-semibold flex items-center justify-between">
                    <span>
                      Kul <strong>{filteredSales.length}</strong> orders dikh rahe hain
                    </span>
                    <span className="font-bold text-stone-900">
                      Total: ₹{filteredSales.reduce((s, i) => s + (Number(i.totalRevenue) || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: BANK SETTLEMENT (1 SINGLE INPUT ONLY!) */}
          {activeTab === 'settle' && (
            <div className="space-y-4">
              
              {/* Clean Settle Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>{selectedPlatform} Se Bank Me Paisa Aaya? (Payout Settle Karein)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Aapke <strong>₹{platLedger.pendingUnsettled.toLocaleString()}</strong> ke orders pending hain. Swiggy ne jitna paisa aapke bank account me transfer kiya hai, bas wo amount yahan enter karein.
                  </p>
                </div>

                <form onSubmit={handleSubmitSettlement} className="space-y-3 pt-1">
                  
                  {/* Single Clean Input: Bank me kitna aaya */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                        Bank Account Me Kitna Paisa Aaya? (Net Credit) (₹):
                      </label>
                      {platLedger.pendingUnsettled > 0 && (
                        <button
                          type="button"
                          onClick={() => setBankAmountReceived(String(platLedger.pendingUnsettled))}
                          className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Poora ₹{platLedger.pendingUnsettled} Aaya
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-lg">₹</span>
                      <input
                        type="number"
                        placeholder={`e.g. ${platLedger.pendingUnsettled}`}
                        value={bankAmountReceived}
                        onChange={(e) => setBankAmountReceived(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-emerald-50/40 border border-emerald-300 rounded-xl text-base font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Live Commission Calculation Feedback */}
                    {platLedger.pendingUnsettled > 0 && bankAmountReceived !== '' && (
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          Pending: <strong>₹{platLedger.pendingUnsettled}</strong> − Bank: <strong>₹{bankAmountReceived || 0}</strong>
                        </span>
                        <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {selectedPlatform} Commission Cut: ₹{calculatedCommission} ({commissionPct}%)
                        </span>
                      </div>
                    )}
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
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settle Karein (Paisa Bank Me Aa Gaya)</span>
                  </button>

                </form>
              </div>

              {/* Past Settlements History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-700 uppercase">
                    Past Settled Payouts ({platSettlements.length})
                  </h4>

                  {platSettlements.length > 0 && onClearAllSettlements && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Kya aap sabhi settlement history clear karna chahte hain?')) {
                          onClearAllSettlements();
                        }
                      }}
                      className="text-[11px] text-stone-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear History</span>
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
                            Gross Settle: ₹{set.grossAmount} • Commission Cut: -₹{set.commissionDeducted}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-700">
                              +₹{set.bankAmountReceived.toLocaleString()} in Bank
                            </div>
                          </div>

                          {onDeleteSettlement && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Kya aap is settlement record ko delete karna chahte hain?`)) {
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
