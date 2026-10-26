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
import { calculateAggregatorLedger, classifySalePaymentMethod } from '../utils/storage';

export default function AggregatorSettlementModal({
  isOpen,
  onClose,
  salesLogs = [],
  settlements = [],
  initialPlatform = 'Swiggy',
  initialTab = 'orders',
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
  const [customGross, setCustomGross] = useState('');
  const [isEditingGross, setIsEditingGross] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Sync initial platform and tab when opening
  useEffect(() => {
    if (isOpen) {
      if (initialPlatform && (initialPlatform === 'Swiggy' || initialPlatform === 'Zomato')) {
        setSelectedPlatform(initialPlatform);
      }
      if (initialTab && (initialTab === 'orders' || initialTab === 'settle')) {
        setActiveTab(initialTab);
      }
      setSearchQuery('');
      setFormError('');
      setFormSuccess('');
      setBankAmountReceived('');
      setCustomGross('');
      setIsEditingGross(false);
    }
  }, [isOpen, initialPlatform, initialTab]);

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
    pendingOrdersCount: 0,
    settlementsCount: 0 
  };

  // Filtered sales list for the active platform (newest first)
  const platSales = useMemo(() => {
    return salesLogs
      .filter(s => classifySalePaymentMethod(s) === selectedPlatform.toLowerCase())
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [salesLogs, selectedPlatform]);

  // Compute settled vs pending status for each sale accurately
  const salesWithSettledStatus = useMemo(() => {
    const settledSet = new Set(platLedger.settledSaleIds || []);
    return platSales.map(sale => ({
      ...sale,
      isSettled: settledSet.has(sale.id)
    }));
  }, [platSales, platLedger.settledSaleIds]);

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

  // Active gross amount being settled (defaults to full pending balance)
  const activeGross = useMemo(() => {
    const g = Number(customGross);
    if (!isNaN(g) && g > 0) return g;
    return platLedger.pendingUnsettled;
  }, [customGross, platLedger.pendingUnsettled]);

  // Auto calculate commission deductions: Active Gross - Net Bank Received
  const calculatedCommission = useMemo(() => {
    const net = Number(bankAmountReceived) || 0;
    if (activeGross > 0 && net >= 0) {
      return Math.max(0, activeGross - net);
    }
    return 0;
  }, [activeGross, bankAmountReceived]);

  const commissionPct = useMemo(() => {
    if (activeGross > 0 && calculatedCommission > 0) {
      return ((calculatedCommission / activeGross) * 100).toFixed(1);
    }
    return '0.0';
  }, [activeGross, calculatedCommission]);

  // Submit Settlement - USER ONLY ENTERS BANK AMOUNT!
  const handleSubmitSettlement = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const targetGross = activeGross;
    const net = Number(bankAmountReceived);

    if (targetGross <= 0) {
      setFormError('Settle karne ke liye koi pending balance nahi hai.');
      return;
    }

    if (net === undefined || net === '' || isNaN(net) || net < 0) {
      setFormError('Kripya bank account me aaya hua actual paisa bharein.');
      return;
    }

    if (net > targetGross) {
      setFormError(`Bank me aaya paisa order bill (₹${targetGross}) se zyada nahi ho sakta!`);
      return;
    }

    const commDeducted = Math.max(0, targetGross - net);

    // Identify sales covered by this settlement (oldest first)
    const settledSet = new Set(platLedger.settledSaleIds || []);
    let remainingToCover = targetGross;
    const newlySettledSaleIds = [];

    // platSales is newest first, so reverse to cover oldest first
    const chronologicalSales = [...platSales].reverse();
    for (const sale of chronologicalSales) {
      if (remainingToCover <= 0) break;
      if (!settledSet.has(sale.id)) {
        newlySettledSaleIds.push(sale.id);
        remainingToCover -= (Number(sale.totalRevenue) || 0);
      }
    }

    const newSettlement = {
      id: `settle-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      platform: selectedPlatform,
      settlementDate: settlementDate || new Date().toISOString().split('T')[0],
      grossAmount: targetGross,
      commissionDeducted: commDeducted,
      bankAmountReceived: net,
      referenceNo: `Bank Credit - ${settlementDate}`,
      notes: `${selectedPlatform} Weekly Payout Settled`,
      settledSaleIds: newlySettledSaleIds,
      expenseLogged: commDeducted > 0,
      createdAt: new Date().toISOString()
    };

    if (onAddSettlement) {
      onAddSettlement(newSettlement);
    }

    // Auto-log commission cut into Cafe Expenses
    if (commDeducted > 0 && onAddExpense) {
      onAddExpense({
        id: `exp-comm-${Date.now()}`,
        title: `${selectedPlatform} Commission Cut`,
        category: 'Platform Commission',
        amount: commDeducted,
        date: settlementDate || new Date().toISOString().split('T')[0],
        paymentMode: 'Online',
        paidTo: selectedPlatform,
        notes: `Platform cut for ₹${targetGross} orders. Rate: ~${commissionPct}%`
      });
    }

    setFormSuccess(`✅ ₹${net.toLocaleString()} Bank me jama ho gaya! ₹${commDeducted.toLocaleString()} ${selectedPlatform} charges/tax cut darj ho gaya.`);
    setBankAmountReceived('');
    setCustomGross('');
    setIsEditingGross(false);
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
              
              {/* How it works banner */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-950 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Simple Online Payout Bank Settlement</span>
                </div>
                <p className="text-[12px] text-stone-700 leading-relaxed">
                  Menu rate par punched orders <strong>{selectedPlatform} Account</strong> me jama rahte hain (Bank me aana baaki). Jab weekly bank payout transfer aaye, bas bank credit amount enter karein.
                </p>
                <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200 font-medium text-[11px] text-stone-800 space-y-1">
                  <div className="font-bold text-amber-900">💡 Udaharan (Example):</div>
                  <div>• Maan lijiye <strong>₹1,000</strong> ki sell hui aur Bank account me <strong>₹800</strong> credit hue.</div>
                  <div>• Yahan sirf <strong>₹800</strong> enter karein.</div>
                  <div>• Bache huye <strong>₹200</strong> apne aap <strong>{selectedPlatform} Tax, Charges & Commission Cut</strong> me darj ho jayenge aur pending balance <strong>₹0</strong> ho jayega.</div>
                </div>
              </div>

              {/* Clean Settle Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>{selectedPlatform} Se Bank Me Paisa Aaya? (Payout Settle Karein)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {selectedPlatform} ne jitna actual paisa aapke bank account me bheja hai, bas wo amount yahan enter karein.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-500 font-semibold">Date:</span>
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <form onSubmit={handleSubmitSettlement} className="space-y-3 pt-1">
                  
                  {/* Gross Amount Info / Optional Edit */}
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wide block">
                        {selectedPlatform} Account me Jama (Pending Sales):
                      </span>
                      <span className="text-lg font-black text-amber-700">
                        ₹{activeGross.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-stone-500 ml-2">
                        ({platLedger.pendingOrdersCount} orders pending)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditingGross ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingGross(true);
                            setCustomGross(String(platLedger.pendingUnsettled));
                          }}
                          className="text-[11px] text-amber-800 bg-amber-100 hover:bg-amber-200 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          ✏️ Change Gross Bill
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-600">₹</span>
                          <input
                            type="number"
                            value={customGross}
                            onChange={(e) => setCustomGross(e.target.value)}
                            placeholder={String(platLedger.pendingUnsettled)}
                            className="w-24 px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingGross(false);
                              setCustomGross('');
                            }}
                            className="text-[10px] bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold px-2 py-1 rounded-lg cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Single Clean Input: Bank me kitna aaya */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-emerald-400 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                        Bank Account Me Kitna Paisa Credit Hua? (Net Transfer) (₹):
                      </label>
                      {activeGross > 0 && (
                        <button
                          type="button"
                          onClick={() => setBankAmountReceived(String(activeGross))}
                          className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Poora ₹{activeGross} Aaya
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-700 text-lg">₹</span>
                      <input
                        type="number"
                        placeholder={`e.g. ${activeGross > 0 ? (activeGross * 0.8).toFixed(0) : '0'}`}
                        value={bankAmountReceived}
                        onChange={(e) => setBankAmountReceived(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-emerald-50/40 border border-emerald-300 rounded-xl text-base font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Live Commission Calculation Feedback */}
                    {activeGross > 0 && bankAmountReceived !== '' && (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs space-y-2 mt-2">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Settlement Calculation Preview:</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">Gross Orders:</span>
                            <span className="text-sm font-black text-stone-900">₹{activeGross.toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 block uppercase font-bold">Bank me Jama:</span>
                            <span className="text-sm font-black text-emerald-700">₹{Number(bankAmountReceived || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-rose-600 block uppercase font-bold">Commission Cut:</span>
                            <span className="text-sm font-black text-rose-600">₹{calculatedCommission.toLocaleString()} ({commissionPct}%)</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">Baki Aana Baaki:</span>
                            <span className="text-sm font-black text-amber-700">₹{Math.max(0, platLedger.pendingUnsettled - activeGross).toLocaleString()}</span>
                          </div>
                        </div>
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
                    disabled={activeGross <= 0}
                    className={`w-full py-3 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 ${
                      activeGross <= 0
                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/20 cursor-pointer active:scale-98'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {activeGross <= 0
                        ? 'Sabhi Payouts Settled Hain (Koi Pending Nahi)'
                        : `Settle Karein (${selectedPlatform} Payout Bank me Aa Gaya)`}
                    </span>
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
