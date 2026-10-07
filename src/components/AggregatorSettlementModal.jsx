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
  Wand2
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
  
  // Settlement input state
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [grossAmount, setGrossAmount] = useState('');
  const [bankAmountReceived, setBankAmountReceived] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
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

    const gross = Number(grossAmount) || platLedger.pendingUnsettled;
    const net = Number(bankAmountReceived);

    if (!gross || gross <= 0) {
      setFormError('Settle karne ke liye koi pending order amount nahi hai.');
      return;
    }

    if (net === undefined || net === '' || net < 0) {
      setFormError('Kripya bank me aaya hua actual paisa (Net Credit) bharein.');
      return;
    }

    if (net > gross) {
      setFormError('Bank me aaya paisa order bill se zyada nahi ho sakta!');
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
      notes: `Weekly ${selectedPlatform} Payout`,
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

    setFormSuccess(`✅ ₹${net.toLocaleString()} Bank me jama ho gaya! Pending balance clear ho gaya.`);
    setGrossAmount('');
    setBankAmountReceived('');
    setReferenceNo('');
    setTimeout(() => {
      setFormSuccess('');
      setActiveTab('orders');
    }, 2000);
  };

  // Helper to remove accidental discount and restore full price (e.g. fix 140 back to 160)
  const handleFixDiscount = (sale) => {
    if (!onUpdateSale) return;
    const fullPrice = (Number(sale.sellingPrice) || 0) * (Number(sale.quantitySold) || 1);
    const updated = {
      ...sale,
      discountAmount: 0,
      totalRevenue: fullPrice
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
                  Aapka Paisa
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Swiggy aur Zomato par beche gaye orders aur bank me aane wala paisa
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

        {/* 3 Simple Metric Cards (Crystal Clear) */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          
          {/* Card 1: Pending Bank Payout (PROMINENT HIGHLIGHT) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 rounded-2xl border-2 border-amber-400 shadow-sm flex flex-col justify-between sm:col-span-1">
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
                Yeh paisa {selectedPlatform} ke paas hai (Weekly transfer hoga)
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
              <span>Bank Me Received (Settled):</span>
            </span>
            <div className="my-1.5">
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                ₹{platLedger.totalBankReceived.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                {platSettlements.length} weekly payouts bank me deposit hue
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
                handleQuickFillPending();
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

          {/* TAB 1: ORDERS LIST (WHERE USER SEES THEIR ITEMS) */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              
              {/* Header with Search and Quick CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-stone-800 flex items-center gap-1.5">
                    <span>{selectedPlatform === 'Swiggy' ? '🟠 Swiggy' : '🔴 Zomato'} Par Beche Gaye Orders</span>
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Aapke punch kiye gaye har order ki live list
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
                      onClick={() => {
                        setActiveTab('settle');
                        handleQuickFillPending();
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span>Bank Me Settle Karein</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notice Banner if any discount exists */}
              {platLedger.totalDiscountGiven > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-extrabold text-amber-950 block">
                      💡 Notice: Order me ₹{platLedger.totalDiscountGiven} ka Promo Discount laga hua hai!
                    </span>
                    <span className="text-[11px] text-amber-900/90 leading-relaxed block mt-0.5">
                      Menu rate <strong>₹{platLedger.totalMenuValue || (platLedger.totalGross + platLedger.totalDiscountGiven)}</strong> tha, lekin punch karte waqt <strong>-₹{platLedger.totalDiscountGiven}</strong> discount lagne se net bill <strong>₹{platLedger.totalGross}</strong> bana. Agar galti se discount lag gaya tha, to aap niche item ke aage <strong>"⚡ Discount Hata Kar Poora Price Banao"</strong> daba kar direct theek kar sakte hain!
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
                    const originalPrice = (Number(sale.sellingPrice) || 0) * (Number(sale.quantitySold) || 1);
                    const hasDiscount = sale.discountAmount > 0;

                    return (
                      <div 
                        key={sale.id || idx} 
                        className="p-3 sm:p-3.5 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                              <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                {sale.itemName}
                              </span>
                              {sale.platformOrderId && (
                                <span className="text-[10px] font-mono bg-stone-100 text-stone-700 font-bold px-1.5 py-0.2 rounded border border-stone-200">
                                  {sale.platformOrderId}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>📅 {sale.date}</span>
                              <span>•</span>
                              <span>{sale.quantitySold} items × ₹{sale.sellingPrice} = ₹{originalPrice}</span>
                              {hasDiscount && (
                                <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  -₹{sale.discountAmount} Offer Discount
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Price & Quick Fix / Delete Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-11 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
                          
                          {/* If has accidental discount, provide 1-click fix button */}
                          {hasDiscount && onUpdateSale && (
                            <button
                              type="button"
                              onClick={() => handleFixDiscount(sale)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Discount hata kar poora menu price karein"
                            >
                              <Wand2 className="w-3 h-3 text-amber-600" />
                              <span>Fix to ₹{originalPrice}</span>
                            </button>
                          )}

                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black text-stone-900">
                              ₹{(sale.totalRevenue || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-700 font-bold">
                              ⏳ Bank Me Aana Baki
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

          {/* TAB 2: BANK SETTLEMENT (HOW USER CLEARS PENDING BALANCE) */}
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
                    Jab {selectedPlatform} hafte me aapke bank account me paisa credit kare, bas yahan enter karein. Pending balance clear ho jayega aur platform ka commission cut apne aap cafe expenses me shamil ho jayega.
                  </p>
                </div>

                <form onSubmit={handleSubmitSettlement} className="space-y-3 pt-1">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Gross Pending Amount */}
                    <div className="bg-white p-3 rounded-xl border border-stone-200">
                      <span className="text-[11px] font-bold text-stone-500 block mb-1">
                        1. Orders Settle Amount (Gross):
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="e.g. 160"
                          value={grossAmount}
                          onChange={(e) => setGrossAmount(e.target.value)}
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none"
                          required
                        />
                        {platLedger.pendingUnsettled > 0 && (
                          <button
                            type="button"
                            onClick={handleQuickFillPending}
                            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                          >
                            Fill ₹{platLedger.pendingUnsettled}
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Pending: ₹{platLedger.pendingUnsettled}
                      </span>
                    </div>

                    {/* Actual Bank Received */}
                    <div className="bg-white p-3 rounded-xl border-2 border-emerald-300">
                      <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                        2. Actual Bank Me Kitna Paisa Aaya? (Net Credit):
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 135"
                        value={bankAmountReceived}
                        onChange={(e) => setBankAmountReceived(e.target.value)}
                        className="w-full px-3 py-1.5 bg-emerald-50/40 border border-emerald-300 rounded-lg text-xs font-black text-emerald-900 focus:outline-none"
                        required
                      />
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        Aapke bank account me transfer hua net amount
                      </span>
                    </div>

                  </div>

                  {/* Calculated Platform Cut Summary Box */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-700 block">
                        Platform Cut (Commission & Taxes):
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Gross (₹{grossAmount || platLedger.pendingUnsettled}) − Bank (₹{bankAmountReceived || 0})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-rose-600">
                        ₹{calculatedCommission.toLocaleString()}
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                        {commissionPct}% Cut
                      </span>
                    </div>
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
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Settlement & Clear Pending</span>
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
                            Gross: ₹{set.grossAmount} • Commission: -₹{set.commissionDeducted}
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
