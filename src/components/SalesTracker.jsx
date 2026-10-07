import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Minus,
  ShoppingBag, 
  Trash2, 
  Search, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  IndianRupee, 
  Layers, 
  Tag, 
  Banknote, 
  Smartphone, 
  FileSpreadsheet,
  Bike,
  Percent,
  Clock,
  Sparkles,
  Filter,
  RotateCcw,
  Receipt,
  ArrowRight,
  Check
} from 'lucide-react';
import { checkItemStock, calculateAggregatorLedger } from '../utils/storage';
import OnlineOrderPunchModal from './OnlineOrderPunchModal';
import AggregatorSettlementModal from './AggregatorSettlementModal';

export default function SalesTracker({ 
  menuItems = [], 
  salesLogs = [], 
  inventoryItems = [], 
  settlements = [],
  onAddSale, 
  onAddBatchSales,
  onUpdateSale, 
  onDeleteSale, 
  onOpenExportModal,
  onAddSettlement,
  onDeleteSettlement,
  onClearAllSettlements,
  onAddExpense
}) {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash', 'Online', 'Swiggy', 'Zomato'
  const [filterDate, setFilterDate] = useState('');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All');
  const [searchItem, setSearchItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posSearch, setPosSearch] = useState('');
  const [warningMessage, setWarningMessage] = useState(null);

  // ⚡ POS Terminal Mode: 'counter' (Cash & UPI) vs 'online' (Swiggy & Zomato)
  const [punchTab, setPunchTab] = useState('counter');

  // 💵 Counter Orders State (Multi-Item Cart + Token)
  const [counterPaymentMode, setCounterPaymentMode] = useState('Cash'); // 'Cash' or 'Online' (Counter UPI)
  const [counterTokenNum, setCounterTokenNum] = useState(101);
  const [counterToken, setCounterToken] = useState('C-101');
  const [counterNotes, setCounterNotes] = useState('');
  const [counterDiscount, setCounterDiscount] = useState(0);
  const [counterCart, setCounterCart] = useState({}); // { [itemId]: { item, qty, price } }

  // 🛵 Online Aggregator (Swiggy / Zomato) State
  const [onlinePlatform, setOnlinePlatform] = useState('Swiggy'); // 'Swiggy' or 'Zomato'
  const [onlineTokenNum, setOnlineTokenNum] = useState(101);
  const [onlineToken, setOnlineToken] = useState('SWG-101');
  const [onlineRiderNotes, setOnlineRiderNotes] = useState('');
  const [onlineDiscountType, setOnlineDiscountType] = useState('none');
  const [onlineCustomDiscount, setOnlineCustomDiscount] = useState('');
  const [onlinePackaging, setOnlinePackaging] = useState(0);
  const [onlineCart, setOnlineCart] = useState({}); // { [itemId]: { item, qty, price } }

  // Live session punch history
  const [sessionPunchedOrders, setSessionPunchedOrders] = useState([]);

  // Modals state
  const [isOnlinePunchOpen, setIsOnlinePunchOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementPlatform, setSettlementPlatform] = useState('Swiggy');

  const showWarning = (msg) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  // Check if an item has sufficient raw materials in inventory
  const getRecipeStockStatus = (item) => {
    return checkItemStock(item, inventoryItems);
  };

  // Helper to smoothly scroll to POS punch terminal
  const scrollToPos = (tab) => {
    setPunchTab(tab);
    const el = document.getElementById('pos-order-punch-station');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ========================
  // 💵 COUNTER CART HANDLERS
  // ========================
  const handleAddToCounterCart = (item, qtyToAdd = 1) => {
    const stockStatus = getRecipeStockStatus(item);
    if (stockStatus.isOutOfStock) {
      showWarning(`❌ "${item.name}" Out of Stock hai! Raw material uplabdh nahi hai.`);
      return;
    }
    const currentQty = counterCart[item.id]?.qty || 0;
    const newQty = currentQty + qtyToAdd;

    if (stockStatus.maxPortions < newQty) {
      showWarning(`⚠️ Stock limit: "${item.name}" ke sirf ${stockStatus.maxPortions} portions ban sakte hain.`);
      return;
    }

    setCounterCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        qty: newQty,
        price: item.sellingPrice
      }
    }));
  };

  const handleUpdateCounterCartQty = (itemId, delta) => {
    const entry = counterCart[itemId];
    if (!entry) return;
    const newQty = entry.qty + delta;
    if (newQty <= 0) {
      setCounterCart(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    const stockStatus = getRecipeStockStatus(entry.item);
    if (delta > 0 && stockStatus.maxPortions < newQty) {
      showWarning(`⚠️ Stock limit: sirf ${stockStatus.maxPortions} portions bache hain!`);
      return;
    }
    setCounterCart(prev => ({
      ...prev,
      [itemId]: { ...entry, qty: newQty }
    }));
  };

  const handleClearCounterCart = () => {
    setCounterCart({});
    setCounterNotes('');
    setCounterDiscount(0);
  };

  const counterSubtotal = useMemo(() => {
    return Object.values(counterCart).reduce((sum, entry) => sum + (entry.price * entry.qty), 0);
  }, [counterCart]);

  const counterTotalUnits = useMemo(() => {
    return Object.values(counterCart).reduce((sum, entry) => sum + entry.qty, 0);
  }, [counterCart]);

  const counterFinalBill = useMemo(() => {
    return Math.max(0, counterSubtotal - Number(counterDiscount || 0));
  }, [counterSubtotal, counterDiscount]);

  const handlePunchCounterOrder = () => {
    const itemsInCart = Object.values(counterCart);
    if (itemsInCart.length === 0) {
      showWarning('Kripya kam se kam 1 item cart me add karein!');
      return;
    }

    const rawToken = counterToken.trim() || `C-${counterTokenNum}`;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;
    const totalGross = counterSubtotal;
    const discTotal = Number(counterDiscount || 0);

    const salesBatch = itemsInCart.map((entry, idx) => {
      const itemGross = entry.price * entry.qty;
      const itemDiscShare = totalGross > 0 ? Math.round((itemGross / totalGross) * discTotal) : 0;
      const itemNet = Math.max(0, itemGross - itemDiscShare);

      return {
        id: `sale-counter-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        itemId: entry.item.id,
        itemName: entry.item.name,
        category: entry.item.category || 'General',
        quantitySold: entry.qty,
        sellingPrice: entry.price,
        costPrice: entry.item.costPrice || 0,
        totalRevenue: itemNet,
        totalCost: (entry.item.costPrice || 0) * entry.qty,
        paymentMethod: counterPaymentMode, // 'Cash' or 'Online' (Counter UPI)
        platformOrderId: token,
        discountAmount: itemDiscShare > 0 ? itemDiscShare : undefined,
        notes: counterNotes.trim() || undefined,
        date: saleDate,
        createdAt: new Date().toISOString()
      };
    });

    if (onAddBatchSales) {
      const success = onAddBatchSales(salesBatch);
      if (!success) return;
    } else if (onAddSale) {
      salesBatch.forEach(s => onAddSale(s));
    }

    // Add to session log tray
    setSessionPunchedOrders(prev => [
      {
        id: `session-${Date.now()}`,
        token,
        channel: counterPaymentMode === 'Cash' ? 'Cash' : 'Counter UPI',
        itemsCount: counterTotalUnits,
        summary: itemsInCart.map(e => `${e.qty}x ${e.item.name}`).join(', '),
        bill: counterFinalBill,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);

    // Reset Cart & advance Token
    setCounterCart({});
    setCounterNotes('');
    setCounterDiscount(0);
    const nextTokenNum = counterTokenNum + 1;
    setCounterTokenNum(nextTokenNum);
    setCounterToken(`C-${nextTokenNum}`);
  };

  // =======================
  // 🛵 ONLINE CART HANDLERS
  // =======================
  const handleAddToOnlineCart = (item, qtyToAdd = 1) => {
    const stockStatus = getRecipeStockStatus(item);
    if (stockStatus.isOutOfStock) {
      showWarning(`❌ "${item.name}" Out of Stock hai!`);
      return;
    }
    const currentQty = onlineCart[item.id]?.qty || 0;
    const newQty = currentQty + qtyToAdd;

    if (stockStatus.maxPortions < newQty) {
      showWarning(`⚠️ Stock limit: "${item.name}" ke sirf ${stockStatus.maxPortions} portions ban sakte hain.`);
      return;
    }

    setOnlineCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        qty: newQty,
        price: prev[item.id]?.price || item.sellingPrice
      }
    }));
  };

  const handleUpdateOnlineCartQty = (itemId, delta) => {
    const entry = onlineCart[itemId];
    if (!entry) return;
    const newQty = entry.qty + delta;
    if (newQty <= 0) {
      setOnlineCart(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }
    const stockStatus = getRecipeStockStatus(entry.item);
    if (delta > 0 && stockStatus.maxPortions < newQty) {
      showWarning(`⚠️ Stock limit: sirf ${stockStatus.maxPortions} portions bache hain!`);
      return;
    }
    setOnlineCart(prev => ({
      ...prev,
      [itemId]: { ...entry, qty: newQty }
    }));
  };

  const handleUpdateOnlineCartPrice = (itemId, newPrice) => {
    const entry = onlineCart[itemId];
    if (!entry) return;
    setOnlineCart(prev => ({
      ...prev,
      [itemId]: { ...entry, price: Math.max(0, Number(newPrice) || 0) }
    }));
  };

  const handleClearOnlineCart = () => {
    setOnlineCart({});
    setOnlineDiscountType('none');
    setOnlineCustomDiscount('');
    setOnlinePackaging(0);
    setOnlineRiderNotes('');
  };

  const onlineSubtotal = useMemo(() => {
    return Object.values(onlineCart).reduce((sum, entry) => sum + (entry.price * entry.qty), 0);
  }, [onlineCart]);

  const onlineTotalUnits = useMemo(() => {
    return Object.values(onlineCart).reduce((sum, entry) => sum + entry.qty, 0);
  }, [onlineCart]);

  const onlineDiscountValue = useMemo(() => {
    if (onlineDiscountType === 'flat20') return Math.min(onlineSubtotal, 20);
    if (onlineDiscountType === 'flat50') return Math.min(onlineSubtotal, 50);
    if (onlineDiscountType === 'flat100') return Math.min(onlineSubtotal, 100);
    if (onlineDiscountType === 'pct20') return Math.round(onlineSubtotal * 0.20);
    if (onlineDiscountType === 'custom') return Math.min(onlineSubtotal, Number(onlineCustomDiscount) || 0);
    return 0;
  }, [onlineDiscountType, onlineCustomDiscount, onlineSubtotal]);

  const onlineFinalBill = useMemo(() => {
    return Math.max(0, onlineSubtotal - onlineDiscountValue + Number(onlinePackaging || 0));
  }, [onlineSubtotal, onlineDiscountValue, onlinePackaging]);

  const handlePunchOnlineOrder = () => {
    const itemsInCart = Object.values(onlineCart);
    if (itemsInCart.length === 0) {
      showWarning('Kripya kam se kam 1 item cart me add karein!');
      return;
    }

    const defaultPrefix = onlinePlatform === 'Swiggy' ? 'SWG' : 'ZOM';
    const rawToken = onlineToken.trim() || `${defaultPrefix}-${onlineTokenNum}`;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;
    const totalGross = onlineSubtotal;

    const salesBatch = itemsInCart.map((entry, idx) => {
      const itemGross = entry.price * entry.qty;
      const itemDiscShare = totalGross > 0 ? Math.round((itemGross / totalGross) * onlineDiscountValue) : 0;
      const itemNet = Math.max(0, itemGross - itemDiscShare);

      return {
        id: `sale-online-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        itemId: entry.item.id,
        itemName: entry.item.name,
        category: entry.item.category || 'General',
        quantitySold: entry.qty,
        sellingPrice: entry.price,
        costPrice: entry.item.costPrice || 0,
        totalRevenue: itemNet,
        totalCost: (entry.item.costPrice || 0) * entry.qty,
        paymentMethod: onlinePlatform, // 'Swiggy' or 'Zomato'
        platformOrderId: token,
        discountAmount: itemDiscShare > 0 ? itemDiscShare : undefined,
        packagingCharge: idx === 0 && onlinePackaging > 0 ? onlinePackaging : undefined,
        notes: onlineRiderNotes.trim() || undefined,
        date: saleDate,
        createdAt: new Date().toISOString()
      };
    });

    if (onAddBatchSales) {
      const success = onAddBatchSales(salesBatch);
      if (!success) return;
    } else if (onAddSale) {
      salesBatch.forEach(s => onAddSale(s));
    }

    // Add to session log tray
    setSessionPunchedOrders(prev => [
      {
        id: `session-${Date.now()}`,
        token,
        channel: onlinePlatform,
        itemsCount: onlineTotalUnits,
        summary: itemsInCart.map(e => `${e.qty}x ${e.item.name}`).join(', '),
        bill: onlineFinalBill,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);

    // Reset Cart & advance Token
    setOnlineCart({});
    setOnlineDiscountType('none');
    setOnlineCustomDiscount('');
    setOnlinePackaging(0);
    setOnlineRiderNotes('');
    const nextTokenNum = onlineTokenNum + 1;
    setOnlineTokenNum(nextTokenNum);
    const nextPrefix = onlinePlatform === 'Swiggy' ? 'SWG' : 'ZOM';
    setOnlineToken(`${nextPrefix}-${nextTokenNum}`);
  };

  // Backward compatible quick sale helpers
  const handleQuickAddSale = (item, qtyToAdd = 1) => {
    handleAddToCounterCart(item, qtyToAdd);
  };

  const handleQuickRemoveSale = (item) => {
    handleUpdateCounterCartQty(item.id, -1);
  };

  // Aggregator Ledger (Pending payouts, total sales)
  const aggLedger = useMemo(() => {
    return calculateAggregatorLedger(salesLogs, settlements);
  }, [salesLogs, settlements]);

  // Calculate Sales Summary for selected date (defaults to saleDate)
  const summaryDate = filterDate || saleDate;
  
  const dailySummary = useMemo(() => {
    const logs = salesLogs.filter(s => s.date === summaryDate);
    const totalRevenue = logs.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    
    // Breakdown by payment channel
    const cashRevenue = logs.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'cash' ? (Number(s.totalRevenue) || 0) : 0);
    }, 0);

    const upiRevenue = logs.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'online' || mode === 'upi' ? (Number(s.totalRevenue) || 0) : 0);
    }, 0);

    const swiggyRevenue = logs.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'swiggy' ? (Number(s.totalRevenue) || 0) : 0);
    }, 0);

    const zomatoRevenue = logs.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'zomato' ? (Number(s.totalRevenue) || 0) : 0);
    }, 0);
    
    const totalCost = logs.reduce((sum, s) => sum + (Number(s.totalCost) || 0), 0);
    const totalQty = logs.reduce((sum, s) => sum + (Number(s.quantitySold) || 0), 0);
    const netProfit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Top selling item calculation
    const itemMap = {};
    logs.forEach(l => {
      itemMap[l.itemName] = (itemMap[l.itemName] || 0) + (Number(l.quantitySold) || 0);
    });
    let topItem = '-';
    let maxQty = 0;
    Object.entries(itemMap).forEach(([name, qty]) => {
      if (qty > maxQty) { maxQty = qty; topItem = `${name} (${qty})`; }
    });

    return { 
      totalRevenue, 
      cashRevenue, 
      upiRevenue, 
      swiggyRevenue, 
      zomatoRevenue, 
      totalCost, 
      totalQty, 
      netProfit, 
      margin, 
      topItem, 
      count: logs.length 
    };
  }, [salesLogs, summaryDate]);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(i => i.category || 'General')));
    return ['All', ...cats];
  }, [menuItems]);

  // Group menu items category-wise for POS Terminal
  const groupedMenuItems = useMemo(() => {
    const groups = {};
    menuItems.forEach(item => {
      const cat = item.category || 'General';
      if (selectedCategory !== 'All' && cat !== selectedCategory) return;
      if (posSearch && !item.name.toLowerCase().includes(posSearch.toLowerCase()) && !cat.toLowerCase().includes(posSearch.toLowerCase())) return;

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems, selectedCategory, posSearch]);

  const filteredLogs = salesLogs.filter(s => {
    const matchesDate = !filterDate || s.date === filterDate;
    const q = searchItem.toLowerCase();
    const matchesSearch = !searchItem || 
      s.itemName.toLowerCase().includes(q) ||
      (s.platformOrderId && s.platformOrderId.toLowerCase().includes(q)) ||
      (s.notes && s.notes.toLowerCase().includes(q));
    
    let matchesMode = true;
    if (filterPaymentMode !== 'All') {
      const mode = (s.paymentMethod || '').toLowerCase();
      if (filterPaymentMode === 'Cash') matchesMode = mode === 'cash';
      else if (filterPaymentMode === 'Online') matchesMode = mode === 'online' || mode === 'upi';
      else if (filterPaymentMode === 'Swiggy') matchesMode = mode === 'swiggy';
      else if (filterPaymentMode === 'Zomato') matchesMode = mode === 'zomato';
    }

    return matchesDate && matchesSearch && matchesMode;
  });

  return (
    <div className="space-y-6">
      
      {/* 📊 DAILY SALES SUMMARY SECTION */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-800 space-y-4">
        
        {/* Top Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-amber-100 flex items-center justify-center font-extrabold shadow-lg shadow-amber-600/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif-title text-amber-100">Daily Sales & Cash Summary</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {summaryDate}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Separate counter cash, direct UPI & pending weekly payouts (Swiggy / Zomato)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-1.5 rounded-2xl border border-stone-700/80">
              <span className="text-xs font-bold text-amber-300/80 uppercase">Date:</span>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Counter Walk-in Quick Jump Button */}
            <button
              type="button"
              onClick={() => scrollToPos('counter')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-400/30"
              title="Punch Counter Walk-in Order (Cash ya UPI)"
            >
              <Banknote className="w-3.5 h-3.5 text-white" />
              <span>💵 Punch Counter Order</span>
            </button>

            {/* Online Order Punch Modal / Jump Button */}
            <button
              type="button"
              onClick={() => scrollToPos('online')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer border border-orange-400/30"
              title="Punch Swiggy or Zomato order with custom price & promo offers"
            >
              <Bike className="w-3.5 h-3.5 text-white" />
              <span>🛵 Punch Online Order</span>
            </button>

            {/* Aggregator Settlement / Ledger Button */}
            <button
              type="button"
              onClick={() => {
                setSettlementPlatform('Swiggy');
                setIsSettlementModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-amber-300 rounded-2xl text-xs font-bold transition-all border border-amber-500/30 cursor-pointer shadow-md"
              title="Manage Swiggy & Zomato Weekly Payouts & Commission Settlements"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Online Payouts</span>
              {aggLedger.overall.pendingUnsettled > 0 && (
                <span className="bg-amber-500 text-stone-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  ₹{aggLedger.overall.pendingUnsettled.toLocaleString()} Pending
                </span>
              )}
            </button>

            {/* Excel Export Button */}
            {onOpenExportModal && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-500/40"
                title="Export Monthly / Weekly Sales to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden xs:inline">Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Summary Stat Cards (Cash in Hand, UPI, Swiggy, Zomato, Total & Profit) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-1">
          
          {/* Total Revenue */}
          <div className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Sales</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
              ₹{dailySummary.totalRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-400 mt-0.5">{dailySummary.count} sales logged</span>
          </div>

          {/* Cash Sales (Galle Ka Cash) */}
          <div className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-emerald-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider">💵 Cash in Hand</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1">
              ₹{dailySummary.cashRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 font-semibold">Galle ka Cash (Today)</span>
          </div>

          {/* Counter UPI (Direct Bank) */}
          <div className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-sky-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 uppercase tracking-wider">📱 Counter UPI</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-300 mt-1">
              ₹{dailySummary.upiRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-sky-400/80 mt-0.5 font-semibold">Direct Bank QR</span>
          </div>

          {/* Swiggy Orders */}
          <div 
            onClick={() => {
              setSettlementPlatform('Swiggy');
              setIsSettlementModalOpen(true);
            }}
            className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-orange-900/40 hover:border-orange-500/80 transition-all flex flex-col justify-between cursor-pointer group"
            title="Click to manage Swiggy Weekly Settlements & Ledger"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-orange-400 uppercase tracking-wider group-hover:text-orange-300">🟠 Swiggy</span>
              <span className="text-[9px] text-orange-400/70 group-hover:underline">Payouts →</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-orange-300 mt-1">
              ₹{dailySummary.swiggyRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-orange-400/80 mt-0.5 font-semibold">
              Pending: ₹{aggLedger.Swiggy.pendingUnsettled.toLocaleString()}
            </span>
          </div>

          {/* Zomato Orders */}
          <div 
            onClick={() => {
              setSettlementPlatform('Zomato');
              setIsSettlementModalOpen(true);
            }}
            className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-rose-900/40 hover:border-rose-500/80 transition-all flex flex-col justify-between cursor-pointer group"
            title="Click to manage Zomato Weekly Settlements & Ledger"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-wider group-hover:text-rose-300">🔴 Zomato</span>
              <span className="text-[9px] text-rose-400/70 group-hover:underline">Payouts →</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-300 mt-1">
              ₹{dailySummary.zomatoRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-400/80 mt-0.5 font-semibold">
              Pending: ₹{aggLedger.Zomato.pendingUnsettled.toLocaleString()}
            </span>
          </div>

          {/* Daily Net Profit */}
          <div className="bg-stone-800/60 p-3 sm:p-3.5 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider">Net Margin</span>
            <div className={`text-xl sm:text-2xl font-extrabold mt-1 ${dailySummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{dailySummary.netProfit.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-300/80 mt-0.5 font-semibold">{dailySummary.margin}% food margin</span>
          </div>

        </div>
      </div>

      {/* ⚡ UNIFIED MULTI-ITEM POS ORDER PUNCH STATION */}
      <div id="pos-order-punch-station" className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden space-y-0 scroll-mt-6">
        
        {/* Station Top Bar & Mode Tabs (Tab 1: Cash/UPI Counter, Tab 2: Swiggy/Zomato Online) */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white p-4 sm:p-5 border-b border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-serif-title text-amber-100">
                    Quick POS Order Punch Station
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Multi-Item Order
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Ek customer ke multiple items ek hi Order ID / Token me add karein
                </p>
              </div>
            </div>

            {/* Session Stats Badge */}
            {sessionPunchedOrders.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-800/80 border border-stone-700 rounded-2xl text-xs text-stone-300 font-bold self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sessionPunchedOrders.length} Orders Punched Session Me</span>
              </div>
            )}
          </div>

          {/* THE TWO MAIN CHANNELS TABS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* TAB 1: 💵 Counter Orders (Cash & UPI) */}
            <button
              type="button"
              onClick={() => setPunchTab('counter')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                punchTab === 'counter'
                  ? 'bg-gradient-to-r from-emerald-950/80 to-stone-900 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40 text-white'
                  : 'bg-stone-850/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  punchTab === 'counter' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'
                }`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-white">💵 Cash & UPI (Counter Walk-in)</span>
                    {counterTotalUnits > 0 && (
                      <span className="bg-emerald-500 text-stone-950 px-2 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                        {counterTotalUnits} in Cart
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400">Galle ka Cash, Counter UPI QR (Token #{counterToken})</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                  punchTab === 'counter'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-stone-800 text-stone-500 border-stone-700'
                }`}>
                  {punchTab === 'counter' ? 'Active' : 'Select'}
                </span>
              </div>
            </button>

            {/* TAB 2: 🛵 Swiggy & Zomato (Online Orders) */}
            <button
              type="button"
              onClick={() => setPunchTab('online')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                punchTab === 'online'
                  ? 'bg-gradient-to-r from-orange-950/80 to-stone-900 border-orange-500 shadow-lg shadow-orange-950/50 ring-2 ring-orange-500/40 text-white'
                  : 'bg-stone-850/60 border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  punchTab === 'online' ? 'bg-orange-600 text-white' : 'bg-stone-800 text-stone-400'
                }`}>
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-white">🛵 Swiggy & Zomato (Delivery)</span>
                    {onlineTotalUnits > 0 && (
                      <span className="bg-orange-500 text-stone-950 px-2 py-0.2 rounded-full text-[10px] font-black animate-pulse">
                        {onlineTotalUnits} in Cart
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400">Aggregator delivery, custom pricing & offers</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                  punchTab === 'online'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-stone-800 text-stone-500 border-stone-700'
                }`}>
                  {punchTab === 'online' ? 'Active' : 'Select'}
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* CONTROLS STRIP (SUB-HEADER ACCORDING TO ACTIVE TAB) */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-3">
          {punchTab === 'counter' ? (
            /* COUNTER SUB-BAR: Cash/UPI Toggle, Token Number, Customer/Table Note */
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-stone-500 uppercase">Payment Mode:</span>
                
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setCounterPaymentMode('Cash')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    counterPaymentMode === 'Cash'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>💵 Cash (Galla)</span>
                </button>

                {/* Counter UPI */}
                <button
                  type="button"
                  onClick={() => setCounterPaymentMode('Online')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    counterPaymentMode === 'Online'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 Counter UPI (Bank QR)</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Token ID */}
                <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-extrabold text-stone-500 uppercase">Order Token:</span>
                  <input
                    type="text"
                    value={counterToken}
                    onChange={(e) => setCounterToken(e.target.value)}
                    className="w-20 text-xs font-black text-stone-900 focus:outline-none uppercase"
                    placeholder="C-101"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = counterTokenNum + 1;
                      setCounterTokenNum(next);
                      setCounterToken(`C-${next}`);
                    }}
                    className="text-[10px] font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Next Token"
                  >
                    +1
                  </button>
                </div>

                {/* Table / Customer Name (Optional) */}
                <input
                  type="text"
                  placeholder="Table # / Cust. Name (Optional)..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="w-48 px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          ) : (
            /* ONLINE SUB-BAR: Swiggy/Zomato Toggle, Aggregator Order ID, Rider Note */
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-stone-500 uppercase">Platform:</span>
                
                {/* Swiggy */}
                <button
                  type="button"
                  onClick={() => {
                    setOnlinePlatform('Swiggy');
                    if (onlineToken === '101' || onlineToken.startsWith('ZOM-')) {
                      setOnlineToken(`SWG-${onlineTokenNum}`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    onlinePlatform === 'Swiggy'
                      ? 'bg-[#f48c06] text-white shadow-md shadow-orange-600/30 ring-2 ring-orange-500'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <span>🟠 Swiggy</span>
                </button>

                {/* Zomato */}
                <button
                  type="button"
                  onClick={() => {
                    setOnlinePlatform('Zomato');
                    if (onlineToken === '101' || onlineToken.startsWith('SWG-')) {
                      setOnlineToken(`ZOM-${onlineTokenNum}`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    onlinePlatform === 'Zomato'
                      ? 'bg-[#e5383b] text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <span>🔴 Zomato</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Aggregator Order ID */}
                <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-extrabold text-stone-500 uppercase">Order ID:</span>
                  <input
                    type="text"
                    value={onlineToken}
                    onChange={(e) => setOnlineToken(e.target.value)}
                    className="w-24 text-xs font-black text-stone-900 focus:outline-none uppercase"
                    placeholder="e.g. 5894"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = onlineTokenNum + 1;
                      setOnlineTokenNum(next);
                      setOnlineToken(String(next));
                    }}
                    className="text-[10px] font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Next Token"
                  >
                    +1
                  </button>
                </div>

                {/* Rider / Delivery Note */}
                <input
                  type="text"
                  placeholder="Rider / Order Note (Optional)..."
                  value={onlineRiderNotes}
                  onChange={(e) => setOnlineRiderNotes(e.target.value)}
                  className="w-48 px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* WORKSPACE: LEFT (TOUCH MENU) + RIGHT (LIVE ORDER PAD / CART) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          
          {/* LEFT COLUMN: TOUCH MENU (7 cols on lg, 8 on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-5 space-y-4">
            
            {/* Search & Category Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? punchTab === 'counter'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-orange-700 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* POS Menu Search */}
              <div className="w-full sm:w-56 relative shrink-0">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search dish to add..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Warning Banner */}
            {warningMessage && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
                  <span>⚠️</span>
                  <span>{warningMessage}</span>
                </div>
                <button
                  onClick={() => setWarningMessage(null)}
                  className="text-rose-500 hover:text-rose-800 text-xs font-bold cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Touch Grid of Menu Items */}
            <div className="max-h-[580px] overflow-y-auto pr-1">
              {Object.keys(groupedMenuItems).length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No menu items found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMenuItems).map(([category, items]) => (
                    <div key={category} className="space-y-2.5">
                      <div className="flex items-center space-x-2 border-b border-stone-100 pb-1.5">
                        <span className={`w-2 h-2 rounded-full ${punchTab === 'counter' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                        <h4 className="text-xs font-black text-stone-800 uppercase tracking-wider">
                          {category} <span className="text-[11px] text-stone-400 font-normal">({items.length})</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {items.map((item) => {
                          const stockStatus = getRecipeStockStatus(item);
                          const currentCart = punchTab === 'counter' ? counterCart : onlineCart;
                          const inCartQty = currentCart[item.id]?.qty || 0;

                          return (
                            <div
                              key={item.id}
                              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                                stockStatus.isOutOfStock
                                  ? 'bg-rose-50/20 border-rose-200 opacity-60'
                                  : inCartQty > 0
                                  ? punchTab === 'counter'
                                    ? 'bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                                    : 'bg-orange-50/50 border-orange-400 ring-2 ring-orange-400/40 shadow-xs'
                                  : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-amber-400 shadow-2xs'
                              }`}
                            >
                              {/* Top: Name & Price */}
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <h5 className="text-xs font-bold text-stone-900 line-clamp-1 leading-tight" title={item.name}>
                                    {item.name}
                                  </h5>
                                  <span className="text-xs font-black text-stone-900 shrink-0">
                                    ₹{item.sellingPrice}
                                  </span>
                                </div>

                                {/* Badges: Stock & In-Cart */}
                                <div className="flex items-center justify-between gap-1 mt-1.5 text-[10px]">
                                  {stockStatus.isOutOfStock ? (
                                    <span className="font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                      Out of Stock
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      ✓ {stockStatus.maxPortions} left
                                    </span>
                                  )}

                                  {inCartQty > 0 && (
                                    <span className={`font-black px-2 py-0.5 rounded-full text-white ${
                                      punchTab === 'counter' ? 'bg-emerald-600' : 'bg-orange-600'
                                    }`}>
                                      {inCartQty} in Cart
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Quick Add Buttons: [-1] [+Add] [+2] [+5] */}
                              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center gap-1">
                                {inCartQty > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (punchTab === 'counter') handleUpdateCounterCartQty(item.id, -1);
                                      else handleUpdateOnlineCartQty(item.id, -1);
                                    }}
                                    className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95"
                                    title="Decrease Qty"
                                  >
                                    -1
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (punchTab === 'counter') handleAddToCounterCart(item, 1);
                                    else handleAddToOnlineCart(item, 1);
                                  }}
                                  disabled={stockStatus.isOutOfStock}
                                  className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                                    stockStatus.isOutOfStock
                                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                      : punchTab === 'counter'
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>+Add</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (punchTab === 'counter') handleAddToCounterCart(item, 2);
                                    else handleAddToOnlineCart(item, 2);
                                  }}
                                  disabled={stockStatus.isOutOfStock || stockStatus.maxPortions < (inCartQty + 2)}
                                  className="px-2 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Add 2"
                                >
                                  +2
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (punchTab === 'counter') handleAddToCounterCart(item, 5);
                                    else handleAddToOnlineCart(item, 5);
                                  }}
                                  disabled={stockStatus.isOutOfStock || stockStatus.maxPortions < (inCartQty + 5)}
                                  className="px-2 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Add 5"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE ORDER PAD & CART (5 cols on lg, 4 on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 bg-stone-50/70 flex flex-col justify-between">
            
            {punchTab === 'counter' ? (
              /* ========================================================== */
              /* 💵 COUNTER ORDER PAD (CASH & UPI)                         */
              /* ========================================================== */
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-stone-900">Current Order Pad</h4>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            #{counterToken}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Channel: <span className="font-bold text-stone-800">{counterPaymentMode === 'Cash' ? '💵 Cash' : '📱 Counter UPI'}</span>
                        </p>
                      </div>
                    </div>

                    {counterTotalUnits > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCounterCart}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Clear all items in cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="py-3">
                    {counterTotalUnits === 0 ? (
                      <div className="py-12 text-center text-stone-400 bg-white rounded-2xl border border-dashed border-stone-300 p-4">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-600" />
                        <p className="text-xs font-bold text-stone-600">Cart Khali Hai</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Menu me se items tap karein. Ek customer ke 3 alag items ek order me add honge!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {Object.values(counterCart).map((entry) => (
                          <div 
                            key={entry.item.id}
                            className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <h6 className="text-xs font-bold text-stone-900 truncate">{entry.item.name}</h6>
                              <div className="text-[11px] text-stone-500 font-semibold">
                                ₹{entry.price} × {entry.qty} = <span className="font-bold text-emerald-700">₹{entry.price * entry.qty}</span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, -1)}
                                className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-black text-stone-900">
                                {entry.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, 1)}
                                className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, -entry.qty)}
                                className="p-1 text-stone-300 hover:text-rose-600 rounded transition-colors ml-1 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Counter Financials & Punch Button */}
                <div className="space-y-3 pt-3 border-t border-stone-200">
                  {/* Optional Counter Discount */}
                  {counterTotalUnits > 0 && (
                    <div className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-stone-200">
                      <span className="font-bold text-stone-600 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>Discount / Offer (₹):</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={counterDiscount || ''}
                        onChange={(e) => setCounterDiscount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-20 px-2 py-0.5 text-right font-bold text-rose-600 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                      />
                    </div>
                  )}

                  {/* Bill Summary */}
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>Total Items:</span>
                      <span className="font-bold text-stone-800">{counterTotalUnits} units</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>Subtotal:</span>
                      <span className="font-bold text-stone-800">₹{counterSubtotal}</span>
                    </div>

                    {counterDiscount > 0 && (
                      <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
                        <span>Discount:</span>
                        <span>-₹{counterDiscount}</span>
                      </div>
                    )}

                    <div className="border-t border-stone-100 pt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Total Bill:
                      </span>
                      <span className="text-xl font-black text-emerald-700">
                        ₹{counterFinalBill}
                      </span>
                    </div>
                  </div>

                  {/* Punch Button */}
                  <button
                    type="button"
                    onClick={handlePunchCounterOrder}
                    disabled={counterTotalUnits === 0}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      counterTotalUnits === 0
                        ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50 active:scale-98'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>⚡ Punch Counter Order ({counterTotalUnits} Items • ₹{counterFinalBill})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================== */
              /* 🛵 ONLINE ORDER PAD (SWIGGY & ZOMATO)                     */
              /* ========================================================== */
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold ${
                        onlinePlatform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'
                      }`}>
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-stone-900">{onlinePlatform} Order Pad</h4>
                          <span className="text-xs font-black text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                            #{onlineToken}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Delivery order with custom platform pricing
                        </p>
                      </div>
                    </div>

                    {onlineTotalUnits > 0 && (
                      <button
                        type="button"
                        onClick={handleClearOnlineCart}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                        title="Clear all items in cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="py-3">
                    {onlineTotalUnits === 0 ? (
                      <div className="py-12 text-center text-stone-400 bg-white rounded-2xl border border-dashed border-stone-300 p-4">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-orange-600" />
                        <p className="text-xs font-bold text-stone-600">Online Cart Khali Hai</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Menu se dishes tap karein. Swiggy / Zomato ke multiple items ek order me punch karein!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {Object.values(onlineCart).map((entry) => (
                          <div 
                            key={entry.item.id}
                            className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <h6 className="text-xs font-bold text-stone-900 truncate">{entry.item.name}</h6>
                              <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                                <span>Rate: ₹</span>
                                <input
                                  type="number"
                                  value={entry.price}
                                  onChange={(e) => handleUpdateOnlineCartPrice(entry.item.id, e.target.value)}
                                  className="w-14 px-1 py-0.2 bg-stone-50 border border-stone-200 rounded font-bold text-stone-800 focus:outline-none"
                                />
                                <span>× {entry.qty} = <strong className="text-orange-700">₹{entry.price * entry.qty}</strong></span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, -1)}
                                className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-black text-stone-900">
                                {entry.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, 1)}
                                className="w-6 h-6 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, -entry.qty)}
                                className="p-1 text-stone-300 hover:text-rose-600 rounded transition-colors ml-1 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Aggregator Offers, Packaging & Punch Button */}
                <div className="space-y-3 pt-3 border-t border-stone-200">
                  {onlineTotalUnits > 0 && (
                    <>
                      {/* Offer / Discount Pills */}
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                        <span className="text-[11px] font-extrabold text-stone-600 uppercase flex items-center gap-1">
                          <Tag className="w-3 h-3 text-rose-500" />
                          <span>Platform Offer / Discount:</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'none', label: 'No Offer' },
                            { id: 'flat20', label: '₹20 Off' },
                            { id: 'flat50', label: '₹50 Off' },
                            { id: 'flat100', label: '₹100 Off' },
                            { id: 'pct20', label: '20% Off' },
                            { id: 'custom', label: 'Custom' }
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setOnlineDiscountType(d.id)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                onlineDiscountType === d.id
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                        {onlineDiscountType === 'custom' && (
                          <input
                            type="number"
                            placeholder="Enter discount amount (₹)..."
                            value={onlineCustomDiscount}
                            onChange={(e) => setOnlineCustomDiscount(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none font-bold text-rose-600"
                          />
                        )}
                      </div>

                      {/* Packaging Charge Pills */}
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-stone-600 uppercase">Packaging:</span>
                        <div className="flex gap-1">
                          {[0, 10, 15, 20].map((pkg) => (
                            <button
                              key={pkg}
                              type="button"
                              onClick={() => setOnlinePackaging(pkg)}
                              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                onlinePackaging === pkg
                                  ? 'bg-stone-800 text-amber-300'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {pkg === 0 ? '₹0' : `+₹${pkg}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bill Summary */}
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>Total Items:</span>
                      <span className="font-bold text-stone-800">{onlineTotalUnits} units</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>Gross Item Total:</span>
                      <span className="font-bold text-stone-800">₹{onlineSubtotal}</span>
                    </div>

                    {onlineDiscountValue > 0 && (
                      <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
                        <span>Offer Discount:</span>
                        <span>-₹{onlineDiscountValue}</span>
                      </div>
                    )}

                    {onlinePackaging > 0 && (
                      <div className="flex items-center justify-between text-xs text-amber-700 font-bold">
                        <span>Packaging Charge:</span>
                        <span>+₹{onlinePackaging}</span>
                      </div>
                    )}

                    <div className="border-t border-stone-100 pt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Payable Total:
                      </span>
                      <span className="text-xl font-black text-orange-700">
                        ₹{onlineFinalBill}
                      </span>
                    </div>
                  </div>

                  {/* Punch Button */}
                  <button
                    type="button"
                    onClick={handlePunchOnlineOrder}
                    disabled={onlineTotalUnits === 0}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      onlineTotalUnits === 0
                        ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed shadow-none'
                        : onlinePlatform === 'Swiggy'
                        ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/30 ring-2 ring-orange-500/50 active:scale-98'
                        : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 ring-2 ring-rose-500/50 active:scale-98'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>⚡ Punch {onlinePlatform} Order ({onlineTotalUnits} Items • ₹{onlineFinalBill})</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* LIVE SESSION PUNCH HISTORY RIBBON (CONFIRMATION TRAY) */}
        {sessionPunchedOrders.length > 0 && (
          <div className="bg-stone-900 text-stone-200 px-4 py-3 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-200">Just Punched In This Session:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              {sessionPunchedOrders.slice(0, 4).map((ord) => (
                <div 
                  key={ord.id} 
                  className="bg-stone-800 px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-stone-700 flex items-center gap-2 shrink-0 shadow-2xs"
                >
                  <span className="font-extrabold text-amber-400">{ord.token}</span>
                  <span className="text-stone-400">({ord.channel})</span>
                  <span className="text-emerald-400 font-bold">₹{ord.bill}</span>
                  <span className="text-stone-300 text-[10px]">✓ {ord.itemsCount} items</span>
                  <span className="text-stone-500 text-[10px]">{ord.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 📜 SALES LOGS HISTORY TABLE WITH EXTENDED PAYMENT BADGES */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-stone-900">Logged Sales History</h3>
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">
              {filteredLogs.length} entries
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Payment Mode Filter Dropdown */}
            <select
              value={filterPaymentMode}
              onChange={(e) => setFilterPaymentMode(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none"
            >
              <option value="All">All Channels</option>
              <option value="Cash">💵 Cash</option>
              <option value="Online">📱 Counter UPI</option>
              <option value="Swiggy">🟠 Swiggy</option>
              <option value="Zomato">🔴 Zomato</option>
            </select>

            <input
              type="text"
              placeholder="Search sale log..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            />
            
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
            />
            
            {(filterDate || filterPaymentMode !== 'All') && (
              <button 
                onClick={() => { setFilterDate(''); setFilterPaymentMode('All'); }} 
                className="text-xs text-rose-600 font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No sales logged for the selected filter.</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Item Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Order Channel</th>
                    <th className="py-3.5 px-4 text-center">Qty Sold</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-right">Total Revenue</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  {filteredLogs.map((sale) => {
                    const mode = (sale.paymentMethod || '').toLowerCase();
                    
                    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    let badgeLabel = '💵 Cash';

                    if (mode === 'online' || mode === 'upi') {
                      badgeClass = 'bg-sky-100 text-sky-800 border-sky-200';
                      badgeLabel = '📱 Counter UPI';
                    } else if (mode === 'swiggy') {
                      badgeClass = 'bg-orange-100 text-orange-900 border-orange-300 font-black';
                      badgeLabel = '🟠 Swiggy';
                    } else if (mode === 'zomato') {
                      badgeClass = 'bg-rose-100 text-rose-900 border-rose-300 font-black';
                      badgeLabel = '🔴 Zomato';
                    }

                    return (
                      <tr key={sale.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3 px-4 text-xs font-semibold text-stone-500">{sale.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{sale.itemName}</div>
                          {(sale.platformOrderId || sale.discountAmount) && (
                            <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                              {sale.platformOrderId && (
                                <span className="font-semibold text-stone-600 bg-stone-100 px-1 rounded">
                                  {sale.platformOrderId}
                                </span>
                              )}
                              {sale.discountAmount && (
                                <span className="font-extrabold text-rose-600 bg-rose-50 px-1 rounded">
                                  ₹{sale.discountAmount} Off
                                </span>
                              )}
                              {sale.notes && <span>• {sale.notes}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-md bg-stone-100 font-semibold text-xs text-stone-700">
                            {sale.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-stone-900">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                            {sale.quantitySold}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-stone-600 font-medium">₹{sale.sellingPrice}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">₹{sale.totalRevenue}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onDeleteSale(sale.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete sale log entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-2.5">
              {filteredLogs.map((sale) => {
                const mode = (sale.paymentMethod || '').toLowerCase();
                let badgeClass = 'bg-emerald-100 text-emerald-800';
                let badgeLabel = '💵 Cash';

                if (mode === 'online' || mode === 'upi') {
                  badgeClass = 'bg-sky-100 text-sky-800';
                  badgeLabel = '📱 UPI';
                } else if (mode === 'swiggy') {
                  badgeClass = 'bg-orange-100 text-orange-900';
                  badgeLabel = '🟠 Swiggy';
                } else if (mode === 'zomato') {
                  badgeClass = 'bg-rose-100 text-rose-900';
                  badgeLabel = '🔴 Zomato';
                }

                return (
                  <div key={sale.id} className="p-3 bg-stone-50/70 border border-stone-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">{sale.itemName}</h4>
                        <span className="text-[9px] font-semibold text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                          {sale.category || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                        <span>{sale.date}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        {sale.platformOrderId && (
                          <span className="text-[10px] text-stone-600 font-bold bg-stone-200/60 px-1 rounded">
                            {sale.platformOrderId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-emerald-700 text-sm sm:text-base">₹{sale.totalRevenue}</div>
                        <span className="text-[10px] text-stone-500">{sale.quantitySold} × ₹{sale.sellingPrice}</span>
                      </div>
                      <button
                        onClick={() => onDeleteSale(sale.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete sale log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: PUNCH ONLINE ORDER (OFFERS & CUSTOM PRICES) */}
      <OnlineOrderPunchModal
        isOpen={isOnlinePunchOpen}
        onClose={() => setIsOnlinePunchOpen(false)}
        menuItems={menuItems}
        inventoryItems={inventoryItems}
        onAddSale={onAddSale}
        onAddBatchSales={onAddBatchSales}
      />

      {/* MODAL 2: SWIGGY & ZOMATO WEEKLY PAYOUT SETTLEMENTS */}
      <AggregatorSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        salesLogs={salesLogs}
        settlements={settlements}
        initialPlatform={settlementPlatform}
        onAddSettlement={onAddSettlement}
        onDeleteSettlement={onDeleteSettlement}
        onClearAllSettlements={onClearAllSettlements}
        onDeleteSale={onDeleteSale}
        onUpdateSale={onUpdateSale}
        onAddExpense={onAddExpense}
      />

    </div>
  );
}
