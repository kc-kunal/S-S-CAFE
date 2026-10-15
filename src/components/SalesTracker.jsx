import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Check,
  Phone,
  Send,
  MessageSquare,
  Printer,
  BookOpen,
  Moon,
  Lock
} from 'lucide-react';
import { checkItemStock, calculateAggregatorLedger } from '../utils/storage';
import OnlineOrderPunchModal from './OnlineOrderPunchModal';
import AggregatorSettlementModal from './AggregatorSettlementModal';

// 🔢 Helper to extract integer token number from token string (e.g. "#C-103" -> 103, "SWG-102" -> 102, "101" -> 101)
export const extractTokenNumber = (tokenStr) => {
  if (!tokenStr) return null;
  const str = String(tokenStr).trim();
  const cMatch = str.match(/(?:C|SWG|ZOM)-?(\d+)/i);
  if (cMatch && cMatch[1]) {
    const num = parseInt(cMatch[1], 10);
    if (!isNaN(num)) return num;
  }
  const anyNum = str.match(/(\d+)/);
  if (anyNum && anyNum[1]) {
    const num = parseInt(anyNum[1], 10);
    if (!isNaN(num)) return num;
  }
  return null;
};

// 🎫 Calculate next Counter Token for selected date based on punched salesLogs + localStorage
export const getNextCounterTokenInfo = (salesLogs = [], targetDate = '') => {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  let maxPunched = 0;

  if (Array.isArray(salesLogs)) {
    salesLogs.forEach(s => {
      if (s.date === dateStr && s.platformOrderId) {
        const isCounterOrder = !s.paymentMethod || 
          ['cash', 'online', 'upi', 'khata', 'udhar'].includes(String(s.paymentMethod).toLowerCase()) ||
          /C-/i.test(s.platformOrderId);
          
        if (isCounterOrder) {
          const num = extractTokenNumber(s.platformOrderId);
          if (num !== null && num > maxPunched && num < 100000) {
            maxPunched = num;
          }
        }
      }
    });
  }

  let storedNext = 0;
  try {
    const stored = localStorage.getItem(`cafe_counter_token_${dateStr}`);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
        storedNext = parsed;
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }

  let nextNum = 101;
  if (maxPunched > 0) {
    nextNum = Math.max(maxPunched + 1, storedNext);
  } else if (storedNext > 0) {
    nextNum = storedNext;
  }

  return {
    nextNum,
    tokenStr: `C-${nextNum}`
  };
};

// 🛵 Calculate next Online Token for selected date & platform
export const getNextOnlineTokenInfo = (salesLogs = [], targetDate = '', platform = 'Swiggy') => {
  const dateStr = targetDate || new Date().toISOString().split('T')[0];
  const prefix = platform === 'Swiggy' ? 'SWG' : 'ZOM';
  let maxPunched = 0;

  if (Array.isArray(salesLogs)) {
    salesLogs.forEach(s => {
      if (s.date === dateStr && s.platformOrderId) {
        const isPlatform = s.paymentMethod && 
          String(s.paymentMethod).toLowerCase() === platform.toLowerCase();
        const hasPrefix = new RegExp(prefix, 'i').test(s.platformOrderId);

        if (isPlatform || hasPrefix) {
          const num = extractTokenNumber(s.platformOrderId);
          if (num !== null && num > maxPunched && num < 100000) {
            maxPunched = num;
          }
        }
      }
    });
  }

  let storedNext = 0;
  try {
    const stored = localStorage.getItem(`cafe_online_token_${platform}_${dateStr}`);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
        storedNext = parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  let nextNum = 101;
  if (maxPunched > 0) {
    nextNum = Math.max(maxPunched + 1, storedNext);
  } else if (storedNext > 0) {
    nextNum = storedNext;
  }

  return {
    nextNum,
    tokenStr: `${prefix}-${nextNum}`
  };
};

export default function SalesTracker({ 
  menuItems = [], 
  salesLogs = [], 
  inventoryItems = [], 
  settlements = [],
  currentCafe,
  onAddSale, 
  onAddBatchSales,
  onUpdateSale, 
  onDeleteSale, 
  onOpenExportModal,
  onAddSettlement,
  onDeleteSettlement,
  onClearAllSettlements,
  onAddExpense,
  onOpenAlertSettings,
  onOpenReceiptPrinter,
  showToast,
  khataLedger = [],
  onAddKhataTransaction,
  onOpenKhataModal,
  onOpenDayClosingModal,
  isStaffMode = false,
  onPromptUnlockStaffMode
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
  const [counterPaymentMode, setCounterPaymentMode] = useState('Cash'); // 'Cash', 'Online' (Counter UPI), or 'Khata' (Udhar)
  const [khataCustomerName, setKhataCustomerName] = useState('');
  const [khataCustomerPhone, setKhataCustomerPhone] = useState('');
  const [counterTokenNum, setCounterTokenNum] = useState(() => {
    return getNextCounterTokenInfo(salesLogs, new Date().toISOString().split('T')[0]).nextNum;
  });
  const [counterToken, setCounterToken] = useState(() => {
    return getNextCounterTokenInfo(salesLogs, new Date().toISOString().split('T')[0]).tokenStr;
  });
  const [counterNotes, setCounterNotes] = useState('');
  const [counterDiscount, setCounterDiscount] = useState(0);
  const [counterCart, setCounterCart] = useState({}); // { [itemId]: { item, qty, price } }
  const [cashTendered, setCashTendered] = useState(''); // Cash Given by Customer for Change Return

  // 🛵 Online Aggregator (Swiggy / Zomato) State
  const [onlinePlatform, setOnlinePlatform] = useState('Swiggy'); // 'Swiggy' or 'Zomato'
  const [onlineTokenNum, setOnlineTokenNum] = useState(() => {
    return getNextOnlineTokenInfo(salesLogs, new Date().toISOString().split('T')[0], 'Swiggy').nextNum;
  });
  const [onlineToken, setOnlineToken] = useState(() => {
    return getNextOnlineTokenInfo(salesLogs, new Date().toISOString().split('T')[0], 'Swiggy').tokenStr;
  });
  const [onlineRiderNotes, setOnlineRiderNotes] = useState('');
  const [onlineDiscountType, setOnlineDiscountType] = useState('none');
  const [onlineCustomDiscount, setOnlineCustomDiscount] = useState('');
  const [onlinePackaging, setOnlinePackaging] = useState(0);
  const [onlineCart, setOnlineCart] = useState({}); // { [itemId]: { item, qty, price } }

  // 🔄 Sync Counter Token automatically with today's punched orders & localStorage
  const lastCounterDateRef = useRef(saleDate);
  useEffect(() => {
    const dateChanged = lastCounterDateRef.current !== saleDate;
    lastCounterDateRef.current = saleDate;

    const info = getNextCounterTokenInfo(salesLogs, saleDate);
    if (dateChanged || counterTokenNum < info.nextNum) {
      setCounterTokenNum(info.nextNum);
      setCounterToken(info.tokenStr);
    }
  }, [salesLogs, saleDate]);

  // 🔄 Sync Online Token automatically with today's punched online orders & localStorage
  const lastOnlineKeyRef = useRef(`${saleDate}_${onlinePlatform}`);
  useEffect(() => {
    const key = `${saleDate}_${onlinePlatform}`;
    const keyChanged = lastOnlineKeyRef.current !== key;
    lastOnlineKeyRef.current = key;

    const info = getNextOnlineTokenInfo(salesLogs, saleDate, onlinePlatform);
    if (keyChanged || onlineTokenNum < info.nextNum) {
      setOnlineTokenNum(info.nextNum);
      setOnlineToken(info.tokenStr);
    }
  }, [salesLogs, saleDate, onlinePlatform]);

  // Live session punch history
  const [sessionPunchedOrders, setSessionPunchedOrders] = useState([]);

  // 🎨 Dynamic theme colors for payment channels (Cash=Green, UPI=Sky Blue, Khata=Amber, Swiggy=Orange, Zomato=Red)
  const currentTheme = useMemo(() => {
    if (punchTab === 'counter') {
      if (counterPaymentMode === 'Cash') {
        return {
          id: 'cash',
          name: 'Cash',
          tabActive: 'bg-gradient-to-r from-emerald-950/80 to-stone-900 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/40',
          tabIcon: 'bg-emerald-600 text-white',
          tabBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          cartQtyPill: 'bg-emerald-500 text-stone-950',
          pillActive: 'bg-emerald-600 text-white shadow-sm',
          dot: 'bg-emerald-500',
          cardActive: 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs',
          inCartBadge: 'bg-emerald-600 text-white',
          addBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs',
          padIcon: 'bg-emerald-600 text-white',
          padBadge: 'bg-emerald-100 text-emerald-800',
          padQtyBtn: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800',
          totalText: 'text-emerald-700',
          punchBtn: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50',
          emptyIconText: 'text-emerald-600',
          focusRing: 'focus:ring-emerald-500/30'
        };
      } else if (counterPaymentMode === 'Khata') {
        // Counter Khata / Udhar (Amber / Golden Orange)
        return {
          id: 'khata',
          name: 'Khata (Udhar)',
          tabActive: 'bg-gradient-to-r from-amber-950/80 to-stone-900 border-amber-500 shadow-lg shadow-amber-950/50 ring-2 ring-amber-500/40',
          tabIcon: 'bg-amber-600 text-white',
          tabBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          cartQtyPill: 'bg-amber-500 text-stone-950',
          pillActive: 'bg-amber-600 text-white shadow-sm',
          dot: 'bg-amber-500',
          cardActive: 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs',
          inCartBadge: 'bg-amber-600 text-white',
          addBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs',
          padIcon: 'bg-amber-600 text-white',
          padBadge: 'bg-amber-100 text-amber-800',
          padQtyBtn: 'bg-amber-100 hover:bg-amber-200 text-amber-800',
          totalText: 'text-amber-700',
          punchBtn: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30 ring-2 ring-amber-500/50',
          emptyIconText: 'text-amber-600',
          focusRing: 'focus:ring-amber-500/30'
        };
      } else {
        // Counter UPI (Sky Blue / Cyan)
        return {
          id: 'upi',
          name: 'Counter UPI',
          tabActive: 'bg-gradient-to-r from-sky-950/80 to-stone-900 border-sky-500 shadow-lg shadow-sky-950/50 ring-2 ring-sky-500/40',
          tabIcon: 'bg-sky-600 text-white',
          tabBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          cartQtyPill: 'bg-sky-500 text-stone-950',
          pillActive: 'bg-sky-600 text-white shadow-sm',
          dot: 'bg-sky-500',
          cardActive: 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-400/40 shadow-xs',
          inCartBadge: 'bg-sky-600 text-white',
          addBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs',
          padIcon: 'bg-sky-600 text-white',
          padBadge: 'bg-sky-100 text-sky-800',
          padQtyBtn: 'bg-sky-100 hover:bg-sky-200 text-sky-800',
          totalText: 'text-sky-700',
          punchBtn: 'bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/30 ring-2 ring-sky-500/50',
          emptyIconText: 'text-sky-600',
          focusRing: 'focus:ring-sky-500/30'
        };
      }
    } else {
      if (onlinePlatform === 'Swiggy') {
        return {
          id: 'swiggy',
          name: 'Swiggy',
          tabActive: 'bg-gradient-to-r from-orange-950/80 to-stone-900 border-orange-500 shadow-lg shadow-orange-950/50 ring-2 ring-orange-500/40',
          tabIcon: 'bg-[#f48c06] text-white',
          tabBadge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          cartQtyPill: 'bg-orange-500 text-stone-950',
          pillActive: 'bg-[#f48c06] text-white shadow-sm',
          dot: 'bg-[#f48c06]',
          cardActive: 'bg-orange-50/70 border-orange-400 ring-2 ring-orange-400/40 shadow-xs',
          inCartBadge: 'bg-[#f48c06] text-white',
          addBtn: 'bg-[#f48c06] hover:bg-[#e85d04] text-white shadow-xs',
          padIcon: 'bg-[#f48c06] text-white',
          padBadge: 'bg-orange-100 text-orange-900',
          padQtyBtn: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
          totalText: 'text-orange-700',
          punchBtn: 'bg-gradient-to-r from-[#f48c06] via-orange-600 to-amber-600 hover:from-[#e85d04] hover:to-orange-500 text-white shadow-orange-600/30 ring-2 ring-orange-500/50',
          emptyIconText: 'text-orange-600',
          focusRing: 'focus:ring-orange-500/30'
        };
      } else {
        // Zomato (Red / Crimson)
        return {
          id: 'zomato',
          name: 'Zomato',
          tabActive: 'bg-gradient-to-r from-rose-950/80 to-stone-900 border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40',
          tabIcon: 'bg-[#e5383b] text-white',
          tabBadge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          cartQtyPill: 'bg-rose-500 text-stone-950',
          pillActive: 'bg-[#e5383b] text-white shadow-sm',
          dot: 'bg-[#e5383b]',
          cardActive: 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/40 shadow-xs',
          inCartBadge: 'bg-[#e5383b] text-white',
          addBtn: 'bg-[#e5383b] hover:bg-[#d90429] text-white shadow-xs',
          padIcon: 'bg-[#e5383b] text-white',
          padBadge: 'bg-rose-100 text-rose-900',
          padQtyBtn: 'bg-rose-100 hover:bg-rose-200 text-rose-800',
          totalText: 'text-rose-700',
          punchBtn: 'bg-gradient-to-r from-[#e5383b] via-rose-600 to-red-700 hover:from-[#d90429] hover:to-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-500/50',
          emptyIconText: 'text-rose-600',
          focusRing: 'focus:ring-rose-500/30'
        };
      }
    }
  }, [punchTab, counterPaymentMode, onlinePlatform]);

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
    setCashTendered('');
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

  const handlePunchCounterOrder = (printBill = false) => {
    const itemsInCart = Object.values(counterCart);
    if (itemsInCart.length === 0) {
      showWarning('Kripya kam se kam 1 item cart me add karein!');
      return;
    }

    if (counterPaymentMode === 'Khata' && !khataCustomerName.trim()) {
      showWarning('Kripya Customer ka Naam dalein (Khata / Udhar ke liye zaroori hai)!');
      return;
    }

    const rawToken = counterToken.trim() || `C-${counterTokenNum}`;
    const token = rawToken.startsWith('#') ? rawToken : `#${rawToken}`;
    const totalGross = counterSubtotal;
    const discTotal = Number(counterDiscount || 0);
    const orderFinalBill = counterFinalBill;

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
        paymentMethod: counterPaymentMode, // 'Cash', 'Online' (Counter UPI), or 'Khata'
        customerName: counterPaymentMode === 'Khata' ? khataCustomerName.trim() : undefined,
        customerPhone: counterPaymentMode === 'Khata' && khataCustomerPhone.trim() ? khataCustomerPhone.trim() : undefined,
        platformOrderId: token,
        discountAmount: itemDiscShare > 0 ? itemDiscShare : undefined,
        notes: counterNotes.trim() || undefined,
        date: saleDate,
        createdAt: new Date().toISOString()
      };
    });

    // 1. COMMIT ORDER TO SALES & DEDUCT RAW MATERIALS (DATA SAVED IMMEDIATELY!)
    if (onAddBatchSales) {
      const success = onAddBatchSales(salesBatch);
      if (!success) return;
    } else if (onAddSale) {
      salesBatch.forEach(s => onAddSale(s));
    }

    // 2. IF KHATA / UDHAR, RECORD IN KHATA LEDGER
    if (counterPaymentMode === 'Khata' && onAddKhataTransaction) {
      const khataEntry = {
        id: `khata-dr-${Date.now()}`,
        type: 'debit',
        customerName: khataCustomerName.trim(),
        customerPhone: khataCustomerPhone.trim() || undefined,
        amount: orderFinalBill,
        orderToken: token,
        itemsSummary: itemsInCart.map(e => `${e.qty}x ${e.item.name}`).join(', '),
        date: saleDate,
        createdAt: new Date().toISOString(),
        notes: counterNotes.trim() || undefined,
        isSettled: false
      };
      onAddKhataTransaction(khataEntry);
    }

    const sessionOrderData = {
      id: `session-${Date.now()}`,
      token,
      channel: counterPaymentMode === 'Cash' ? 'Cash' : counterPaymentMode === 'Khata' ? 'Khata (Udhar)' : 'Counter UPI',
      customerName: counterPaymentMode === 'Khata' ? khataCustomerName.trim() : undefined,
      itemsCount: counterTotalUnits,
      summary: itemsInCart.map(e => `${e.qty}x ${e.item.name}`).join(', '),
      items: itemsInCart.map(e => ({
        name: e.item.name,
        qty: e.qty,
        price: e.price,
        total: e.price * e.qty
      })),
      subtotal: totalGross,
      discount: discTotal,
      bill: orderFinalBill,
      date: saleDate,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Add to live session log tray
    setSessionPunchedOrders(prev => [sessionOrderData, ...prev]);

    // 🖨️ Direct Thermal Bill Print Station Trigger
    if (printBill && onOpenReceiptPrinter) {
      onOpenReceiptPrinter({
        ...sessionOrderData,
        tokenOrBillNo: token,
        orderType: counterPaymentMode === 'Cash' 
          ? 'Counter (Cash)' 
          : counterPaymentMode === 'Khata' 
          ? `Khata (${khataCustomerName.trim()})` 
          : 'Counter (UPI)',
        subtotal: totalGross,
        discount: discTotal,
        totalAmount: orderFinalBill,
        paymentMethod: counterPaymentMode,
        cashTendered: Number(cashTendered || 0),
        notes: counterNotes.trim()
      }, 'bill');
    }

    // Reset Cart & advance Token immediately so cashier is instantly ready for next order
    setCounterCart({});
    setCounterNotes('');
    setCounterDiscount(0);
    setCashTendered('');
    setKhataCustomerName('');
    setKhataCustomerPhone('');
    const nextTokenNum = counterTokenNum + 1;
    setCounterTokenNum(nextTokenNum);
    setCounterToken(`C-${nextTokenNum}`);
    try {
      localStorage.setItem(`cafe_counter_token_${saleDate}`, String(nextTokenNum));
    } catch (e) {}

    if (showToast) {
      showToast(`⚡ Order ${token} Punched (₹${orderFinalBill})!`);
    }
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
      // Include packaging fee on first item of order so total batch revenue strictly equals onlineFinalBill
      const packagingToAdd = idx === 0 && onlinePackaging > 0 ? Number(onlinePackaging) : 0;

      return {
        id: `sale-online-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        itemId: entry.item.id,
        itemName: entry.item.name,
        category: entry.item.category || 'General',
        quantitySold: entry.qty,
        sellingPrice: entry.price,
        costPrice: entry.item.costPrice || 0,
        totalRevenue: itemNet + packagingToAdd,
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
    try {
      localStorage.setItem(`cafe_online_token_${onlinePlatform}_${saleDate}`, String(nextTokenNum));
    } catch (e) {}
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

    const khataRevenue = logs.reduce((sum, s) => {
      const mode = (s.paymentMethod || '').toLowerCase();
      return sum + (mode === 'khata' || mode === 'udhar' ? (Number(s.totalRevenue) || 0) : 0);
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
      khataRevenue,
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
      else if (filterPaymentMode === 'Khata') matchesMode = mode === 'khata' || mode === 'udhar';
    }

    return matchesDate && matchesSearch && matchesMode;
  });

  // View mode for Sales History: 'tokens' (grouped by order token with item list & punch time) vs 'items' (individual line items)
  const [historyViewMode, setHistoryViewMode] = useState('tokens');

  // 🎫 Grouped Token Orders for History (Showing all items in token & exact punch time)
  const groupedTokenOrders = useMemo(() => {
    const map = new Map();

    filteredLogs.forEach(sale => {
      // Group key: platformOrderId if available, or unique fallback for single punches
      const tokenKey = sale.platformOrderId ? `${sale.date}_${sale.platformOrderId}` : `single_${sale.id}`;

      let formattedTime = '—';
      if (sale.createdAt) {
        try {
          formattedTime = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          formattedTime = '—';
        }
      }

      if (!map.has(tokenKey)) {
        map.set(tokenKey, {
          orderKey: tokenKey,
          token: sale.platformOrderId || `#ORD-${sale.id.slice(-4).toUpperCase()}`,
          date: sale.date,
          time: formattedTime,
          createdAt: sale.createdAt,
          paymentMethod: sale.paymentMethod || 'Cash',
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          notes: sale.notes,
          items: [],
          totalRevenue: 0,
          totalUnits: 0,
          saleIds: []
        });
      }

      const order = map.get(tokenKey);
      order.items.push({
        saleId: sale.id,
        name: sale.itemName,
        qty: Number(sale.quantitySold) || 1,
        price: Number(sale.sellingPrice) || 0,
        total: Number(sale.totalRevenue) || 0,
        category: sale.category || 'General'
      });
      order.totalRevenue += (Number(sale.totalRevenue) || 0);
      order.totalUnits += (Number(sale.quantitySold) || 1);
      order.saleIds.push(sale.id);
      if (order.time === '—' && formattedTime !== '—') {
        order.time = formattedTime;
      }
    });

    return Array.from(map.values());
  }, [filteredLogs]);

  // Handler to delete an entire Token Order and restore raw material stock for all its items
  const handleDeleteTokenOrder = (order) => {
    if (window.confirm(`Kya aap Token "${order.token}" (${order.items.length} items • ₹${order.totalRevenue}) ko delete karna chahte hain? Sabhi raw materials wapas stock me add ho jayenge.`)) {
      order.saleIds.forEach(id => onDeleteSale(id));
      if (showToast) {
        showToast(`Token Order ${order.token} successfully deleted`);
      }
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* ⚡ UNIFIED STREAMLINED POS ORDER PUNCH STATION */}
      <div id="pos-order-punch-station" className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden scroll-mt-4">
        
        {/* Top Header Bar: Channel Tabs (Left) + Integrated Utilities (Date, Payouts, Closing, Khata, Excel) (Right) */}
        <div className="bg-stone-900 text-white px-3 sm:px-4 py-2 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Left: Quick Channel Switcher (Counter vs Delivery) */}
          <div className="flex items-center gap-1.5 bg-stone-800/90 p-1 rounded-xl border border-stone-700/80">
            {/* Tab 1: Counter Walk-in */}
            <button
              type="button"
              onClick={() => setPunchTab('counter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                punchTab === 'counter'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>💵 Counter Walk-in</span>
              {counterTotalUnits > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-stone-950 text-amber-300 rounded-full text-[10px] font-black">
                  {counterTotalUnits} in Cart
                </span>
              )}
            </button>

            {/* Tab 2: Swiggy / Zomato */}
            <button
              type="button"
              onClick={() => setPunchTab('online')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                punchTab === 'online'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>🛵 Swiggy / Zomato</span>
              {onlineTotalUnits > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-stone-950 text-orange-300 rounded-full text-[10px] font-black">
                  {onlineTotalUnits} in Cart
                </span>
              )}
            </button>
          </div>

          {/* Right: Integrated POS Utilities (Date, Payouts, Day Closing, Khata, Excel) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Date Picker */}
            <div className="flex items-center gap-1 bg-stone-800 px-2 py-1 rounded-lg border border-stone-700 text-[11px] font-bold text-stone-300">
              <span className="text-[10px] uppercase text-stone-400 font-bold">Date:</span>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Day Closing */}
            {onOpenDayClosingModal && (
              <button
                type="button"
                onClick={onOpenDayClosingModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold transition-all border border-amber-500/30 cursor-pointer"
                title="Shift & Day-End Cash Drawer Reconciliation (Z-Report)"
              >
                <Moon className="w-3 h-3 text-amber-400" />
                <span>Day Closing</span>
              </button>
            )}
          </div>
        </div>

        {/* Slim Controls Strip: Payment Mode / Platform, Token ID & Notes */}
        <div className="bg-stone-100/90 border-b border-stone-200 px-3 sm:px-4 py-2">
          {punchTab === 'counter' ? (
            /* COUNTER CONTROLS */
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wide">Pay Mode:</span>
                
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setCounterPaymentMode('Cash')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    counterPaymentMode === 'Cash'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>💵 Cash</span>
                </button>

                {/* Counter UPI */}
                <button
                  type="button"
                  onClick={() => setCounterPaymentMode('Online')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    counterPaymentMode === 'Online'
                      ? 'bg-sky-600 text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 UPI</span>
                </button>

                {/* Khata (Udhar) */}
                <button
                  type="button"
                  onClick={() => setCounterPaymentMode('Khata')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    counterPaymentMode === 'Khata'
                      ? 'bg-amber-600 text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📒 Khata</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Token ID */}
                <div className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Token:</span>
                  <input
                    type="text"
                    value={counterToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCounterToken(val);
                      const parsed = extractTokenNumber(val);
                      if (parsed) {
                        setCounterTokenNum(parsed);
                        try {
                          localStorage.setItem(`cafe_counter_token_${saleDate}`, String(parsed));
                        } catch (err) {}
                      }
                    }}
                    className="w-16 text-xs font-black text-stone-900 focus:outline-none uppercase"
                    placeholder="C-101"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = counterTokenNum + 1;
                      setCounterTokenNum(next);
                      setCounterToken(`C-${next}`);
                      try {
                        localStorage.setItem(`cafe_counter_token_${saleDate}`, String(next));
                      } catch (err) {}
                    }}
                    className="text-[10px] font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 px-1 py-0.2 rounded cursor-pointer"
                    title="Next Token"
                  >
                    +1
                  </button>
                </div>

                {/* Table / Customer Name (Optional) */}
                <input
                  type="text"
                  placeholder="Table # / Notes..."
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="w-36 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Customer Khata Info Bar (Active when Khata selected) */}
              {counterPaymentMode === 'Khata' && (
                <div className="w-full flex flex-wrap items-center gap-2 bg-amber-50 border border-amber-200 p-2 rounded-xl animate-in fade-in">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Customer:</span>
                  </div>
                  <input
                    type="text"
                    list="khata-customer-names-list"
                    value={khataCustomerName}
                    onChange={(e) => {
                      setKhataCustomerName(e.target.value);
                      const found = khataLedger.find(k => k.customerName && k.customerName.toLowerCase() === e.target.value.toLowerCase());
                      if (found && found.customerPhone) setKhataCustomerPhone(found.customerPhone);
                    }}
                    placeholder="Customer Name (e.g. Rahul Sharma) *"
                    className="flex-1 min-w-[140px] px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <datalist id="khata-customer-names-list">
                    {Array.from(new Set(khataLedger.map(k => k.customerName).filter(Boolean))).map((name, i) => (
                      <option key={i} value={name} />
                    ))}
                  </datalist>
                  <input
                    type="tel"
                    value={khataCustomerPhone}
                    onChange={(e) => setKhataCustomerPhone(e.target.value)}
                    placeholder="Mobile No. (Optional)"
                    className="w-32 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          ) : (
            /* ONLINE CONTROLS */
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-stone-500 uppercase tracking-wide">Platform:</span>
                
                {/* Swiggy */}
                <button
                  type="button"
                  onClick={() => {
                    setOnlinePlatform('Swiggy');
                    const info = getNextOnlineTokenInfo(salesLogs, saleDate, 'Swiggy');
                    setOnlineTokenNum(info.nextNum);
                    setOnlineToken(info.tokenStr);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    onlinePlatform === 'Swiggy'
                      ? 'bg-[#f48c06] text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <span>🟠 Swiggy</span>
                </button>

                {/* Zomato */}
                <button
                  type="button"
                  onClick={() => {
                    setOnlinePlatform('Zomato');
                    const info = getNextOnlineTokenInfo(salesLogs, saleDate, 'Zomato');
                    setOnlineTokenNum(info.nextNum);
                    setOnlineToken(info.tokenStr);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    onlinePlatform === 'Zomato'
                      ? 'bg-[#e5383b] text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <span>🔴 Zomato</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Aggregator Order ID */}
                <div className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  <span className="text-[10px] font-extrabold text-stone-500 uppercase">Order ID:</span>
                  <input
                    type="text"
                    value={onlineToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOnlineToken(val);
                      const parsed = extractTokenNumber(val);
                      if (parsed) {
                        setOnlineTokenNum(parsed);
                        try {
                          localStorage.setItem(`cafe_online_token_${onlinePlatform}_${saleDate}`, String(parsed));
                        } catch (err) {}
                      }
                    }}
                    className="w-20 text-xs font-black text-stone-900 focus:outline-none uppercase"
                    placeholder="5894"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = onlineTokenNum + 1;
                      setOnlineTokenNum(next);
                      setOnlineToken(String(next));
                      try {
                        localStorage.setItem(`cafe_online_token_${onlinePlatform}_${saleDate}`, String(next));
                      } catch (err) {}
                    }}
                    className="text-[10px] font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-700 px-1 py-0.2 rounded cursor-pointer"
                    title="Next Token"
                  >
                    +1
                  </button>
                </div>

                {/* Rider Note */}
                <input
                  type="text"
                  placeholder="Rider / Order Note..."
                  value={onlineRiderNotes}
                  onChange={(e) => setOnlineRiderNotes(e.target.value)}
                  className="w-40 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* WORKSPACE: LEFT (TOUCH MENU) + RIGHT (LIVE ORDER PAD / CART) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          
          {/* LEFT COLUMN: TOUCH MENU (7 cols on lg, 8 on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 p-3 sm:p-3.5 space-y-2.5">
            
            {/* Search & Category Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? currentTheme.pillActive
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* POS Menu Search */}
              <div className="w-full sm:w-52 relative shrink-0">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search dish to add..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Warning Banner */}
            {warningMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between animate-in fade-in">
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
            <div className="max-h-[460px] lg:max-h-[490px] overflow-y-auto pr-1">
              {Object.keys(groupedMenuItems).length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 opacity-40" />
                  <p className="text-xs font-semibold">No menu items found for this filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMenuItems).map(([category, items]) => (
                    <div key={category} className="space-y-2.5">
                      <div className="flex items-center space-x-2 border-b border-stone-100 pb-1.5">
                        <span className={`w-2 h-2 rounded-full ${currentTheme.dot}`}></span>
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
                                  ? currentTheme.cardActive
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
                                    <span className={`font-black px-2 py-0.5 rounded-full text-white ${currentTheme.inCartBadge}`}>
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
                                      : `${currentTheme.addBtn} active:scale-95`
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
          <div className="lg:col-span-5 xl:col-span-4 p-3 sm:p-3.5 bg-stone-50/70 flex flex-col justify-between">
            
            {punchTab === 'counter' ? (
              /* ========================================================== */
              /* 💵 COUNTER ORDER PAD (CASH & UPI)                         */
              /* ========================================================== */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${currentTheme.padIcon} flex items-center justify-center font-bold shadow-xs`}>
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-stone-900">Current Order Pad</h4>
                          <span className={`text-[11px] font-black ${currentTheme.padBadge} px-1.5 py-0.2 rounded border`}>
                            #{counterToken}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Channel: <span className={`font-bold ${currentTheme.totalText}`}>{counterPaymentMode === 'Cash' ? '💵 Cash' : counterPaymentMode === 'Khata' ? '📒 Khata' : '📱 UPI'}</span>
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
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="py-1">
                    {counterTotalUnits === 0 ? (
                      <div className="py-3.5 px-3 text-center text-stone-400 bg-white rounded-xl border border-dashed border-stone-300">
                        <p className="text-xs font-bold text-stone-600 flex items-center justify-center gap-1.5">
                          <ShoppingBag className={`w-4 h-4 opacity-50 ${currentTheme.emptyIconText}`} />
                          <span>Cart Khali Hai — Tap menu items</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Ek customer ke multiple items ek token me punch karein
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                        {Object.values(counterCart).map((entry) => (
                          <div 
                            key={entry.item.id}
                            className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <h6 className="text-xs font-bold text-stone-900 truncate">{entry.item.name}</h6>
                              <div className="text-[11px] text-stone-500 font-semibold">
                                ₹{entry.price} × {entry.qty} = <span className={`font-bold ${currentTheme.totalText}`}>₹{entry.price * entry.qty}</span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, -1)}
                                className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-5 text-center text-xs font-black text-stone-900">
                                {entry.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, 1)}
                                className={`w-5 h-5 rounded ${currentTheme.padQtyBtn} flex items-center justify-center font-bold text-xs cursor-pointer`}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCounterCartQty(entry.item.id, -entry.qty)}
                                className="p-0.5 text-stone-300 hover:text-rose-600 rounded transition-colors ml-0.5 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Counter Financials & Punch Button */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  {/* Optional Counter Discount */}
                  {counterTotalUnits > 0 && (
                    <div className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-stone-200">
                      <span className="font-bold text-stone-600 flex items-center gap-1 text-[11px]">
                        <Tag className="w-3 h-3 text-amber-600" />
                        <span>Discount / Offer (₹):</span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={counterDiscount || ''}
                        onChange={(e) => setCounterDiscount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-16 px-1.5 py-0.5 text-right font-bold text-rose-600 border border-stone-200 rounded text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Bill Summary */}
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 space-y-1 shadow-2xs">
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

                    <div className="border-t border-stone-100 pt-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Total Bill:
                      </span>
                      <span className={`text-lg font-black ${currentTheme.totalText}`}>
                        ₹{counterFinalBill}
                      </span>
                    </div>

                    {/* 💵 Cash Tendered & Change Return Helper */}
                    {counterPaymentMode === 'Cash' && counterTotalUnits > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-stone-100 bg-emerald-50/70 -mx-2.5 -mb-2.5 p-2 rounded-b-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 text-[11px]">
                            💵 Cash Received:
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-700 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              placeholder={String(counterFinalBill)}
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-right font-black text-emerald-950 bg-white border border-emerald-300 rounded text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {Number(cashTendered) > 0 && (
                          <div className="flex items-center justify-between pt-0.5 border-t border-emerald-200/60 font-bold text-[11px]">
                            <span className={Number(cashTendered) >= counterFinalBill ? 'text-emerald-800' : 'text-rose-700'}>
                              {Number(cashTendered) >= counterFinalBill ? '🤝 Change Return:' : '⚠️ Short Cash:'}
                            </span>
                            <span className={`text-xs font-black ${Number(cashTendered) >= counterFinalBill ? 'text-emerald-700' : 'text-rose-600'}`}>
                              ₹{Math.abs(Number(cashTendered) - counterFinalBill)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Punch Buttons */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handlePunchCounterOrder(true)}
                      disabled={counterTotalUnits === 0}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Punch Order aur Thermal Printer par Bill Print Karein (58mm / 80mm)"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-200" />
                      <span>🖨️ Punch & Print Bill (₹{counterFinalBill})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePunchCounterOrder(false)}
                      disabled={counterTotalUnits === 0}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        counterTotalUnits === 0
                          ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                          : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 shadow-xs active:scale-98'
                      }`}
                      title="Silent Fast Punch without printing"
                    >
                      <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>⚡ Quick Punch Only</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================== */
              /* 🛵 ONLINE ORDER PAD (SWIGGY & ZOMATO)                     */
              /* ========================================================== */
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Cart Header */}
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold ${currentTheme.padIcon} shadow-xs`}>
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-stone-900">{onlinePlatform} Order Pad</h4>
                          <span className={`text-[11px] font-black ${currentTheme.padBadge} px-1.5 py-0.2 rounded border`}>
                            #{onlineToken}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500">
                          Channel: <span className="font-bold text-stone-800">{onlinePlatform} Delivery</span>
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
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="py-1">
                    {onlineTotalUnits === 0 ? (
                      <div className="py-3.5 px-3 text-center text-stone-400 bg-white rounded-xl border border-dashed border-stone-300">
                        <p className="text-xs font-bold text-stone-600 flex items-center justify-center gap-1.5">
                          <ShoppingBag className={`w-4 h-4 opacity-50 ${currentTheme.emptyIconText}`} />
                          <span>Online Cart Khali Hai — Tap menu items</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          {onlinePlatform} delivery order me multiple items punch karein
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {Object.values(onlineCart).map((entry) => (
                          <div 
                            key={entry.item.id}
                            className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <h6 className="text-xs font-bold text-stone-900 truncate">{entry.item.name}</h6>
                              <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                                <span>Rate: ₹</span>
                                <input
                                  type="number"
                                  value={entry.price}
                                  onChange={(e) => handleUpdateOnlineCartPrice(entry.item.id, e.target.value)}
                                  className="w-12 px-1 py-0.2 bg-stone-50 border border-stone-200 rounded font-bold text-stone-800 focus:outline-none"
                                />
                                <span>× {entry.qty} = <strong className={currentTheme.totalText}>₹{entry.price * entry.qty}</strong></span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, -1)}
                                className="w-5 h-5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-5 text-center text-xs font-black text-stone-900">
                                {entry.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, 1)}
                                className={`w-5 h-5 rounded ${currentTheme.padQtyBtn} flex items-center justify-center font-bold text-xs cursor-pointer`}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOnlineCartQty(entry.item.id, -entry.qty)}
                                className="p-0.5 text-stone-300 hover:text-rose-600 rounded transition-colors ml-0.5 cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Aggregator Offers, Packaging & Punch Button */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  {onlineTotalUnits > 0 && (
                    <>
                      {/* Offer / Discount Pills */}
                      <div className="bg-white p-2 rounded-lg border border-stone-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-stone-600 uppercase flex items-center gap-1">
                          <Tag className="w-3 h-3 text-rose-500" />
                          <span>Platform Offer:</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'none', label: 'No Offer' },
                            { id: 'flat20', label: '₹20' },
                            { id: 'flat50', label: '₹50' },
                            { id: 'flat100', label: '₹100' },
                            { id: 'pct20', label: '20%' },
                            { id: 'custom', label: 'Custom' }
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setOnlineDiscountType(d.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
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
                            className="w-full px-2 py-0.5 text-xs border border-stone-200 rounded focus:outline-none font-bold text-rose-600"
                          />
                        )}
                      </div>

                      {/* Packaging Charge Pills */}
                      <div className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-stone-600 uppercase">Packaging:</span>
                        <div className="flex gap-1">
                          {[0, 10, 15, 20].map((pkg) => (
                            <button
                              key={pkg}
                              type="button"
                              onClick={() => setOnlinePackaging(pkg)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
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
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200 space-y-1 shadow-2xs">
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

                    <div className="border-t border-stone-100 pt-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Payable Total:
                      </span>
                      <span className={`text-lg font-black ${currentTheme.totalText}`}>
                        ₹{onlineFinalBill}
                      </span>
                    </div>
                  </div>

                  {/* Punch Button */}
                  <button
                    type="button"
                    onClick={handlePunchOnlineOrder}
                    disabled={onlineTotalUnits === 0}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      onlineTotalUnits === 0
                        ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed shadow-none'
                        : `${currentTheme.punchBtn} active:scale-98`
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
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
              {sessionPunchedOrders.slice(0, 4).map((ord) => {
                let badgeColor = 'text-emerald-400 border-emerald-500/30';
                if (ord.channel === 'Counter UPI') badgeColor = 'text-sky-400 border-sky-500/30';
                else if (ord.channel === 'Swiggy') badgeColor = 'text-orange-400 border-orange-500/30';
                else if (ord.channel === 'Zomato') badgeColor = 'text-rose-400 border-rose-500/30';

                return (
                  <div 
                    key={ord.id} 
                    className={`bg-stone-800 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${badgeColor} flex items-center gap-2 shrink-0 shadow-2xs`}
                  >
                    <span className="font-extrabold text-amber-400">{ord.token}</span>
                    <span className="text-stone-400">({ord.channel})</span>
                    <span className="text-white font-bold">₹{ord.bill}</span>
                    <span className="text-stone-300 text-[10px]">✓ {ord.itemsCount} items</span>
                    <button
                      type="button"
                      onClick={() => onOpenReceiptPrinter && onOpenReceiptPrinter(ord, 'bill')}
                      className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-amber-500/30"
                      title="Thermal Bill Print Karein (58mm / 80mm)"
                    >
                      <Printer className="w-2.5 h-2.5" />
                      <span>Print</span>
                    </button>
                    <span className="text-stone-500 text-[10px]">{ord.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 📜 SALES LOGS & TOKEN ORDERS HISTORY */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-sm space-y-4">
        
        {/* Header & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-stone-900">Order & Sales History</h3>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                  {groupedTokenOrders.length} Token Orders • {filteredLogs.length} Items
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Har token order ke items aur punch hone ka exact time
              </p>
            </div>
          </div>

          {/* View Mode Toggle: Tokens vs Item-wise */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl self-start md:self-auto border border-stone-200">
            <button
              type="button"
              onClick={() => setHistoryViewMode('tokens')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                historyViewMode === 'tokens'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>🎫 Token Orders ({groupedTokenOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setHistoryViewMode('items')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                historyViewMode === 'items'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <span>📋 Item-wise ({filteredLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
              <option value="Khata">📒 Khata (Udhar)</option>
            </select>

            <input
              type="text"
              placeholder="Search token / item..."
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
            
            {(filterDate || filterPaymentMode !== 'All' || searchItem) && (
              <button 
                onClick={() => { setFilterDate(''); setFilterPaymentMode('All'); setSearchItem(''); }} 
                className="text-xs text-rose-600 font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 1. TOKEN ORDERS VIEW (GROUPED WITH ITEMS & TIME) */}
        {historyViewMode === 'tokens' ? (
          groupedTokenOrders.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">No token orders logged for the selected filter.</p>
          ) : (
            <div className="space-y-3">
              {groupedTokenOrders.map((order) => {
                const mode = (order.paymentMethod || '').toLowerCase();
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                let badgeLabel = '💵 Cash';

                if (mode === 'online' || mode === 'upi') {
                  badgeClass = 'bg-sky-100 text-sky-800 border-sky-200';
                  badgeLabel = '📱 Counter UPI';
                } else if (mode === 'khata' || mode === 'udhar') {
                  badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                  badgeLabel = order.customerName ? `📒 Khata (${order.customerName})` : '📒 Khata';
                } else if (mode === 'swiggy') {
                  badgeClass = 'bg-orange-100 text-orange-900 border-orange-300 font-black';
                  badgeLabel = '🟠 Swiggy';
                } else if (mode === 'zomato') {
                  badgeClass = 'bg-rose-100 text-rose-900 border-rose-300 font-black';
                  badgeLabel = '🔴 Zomato';
                }

                return (
                  <div
                    key={order.orderKey}
                    className="bg-stone-50/70 hover:bg-stone-50 border border-stone-200 hover:border-amber-400/60 rounded-2xl p-3.5 sm:p-4 transition-all shadow-2xs space-y-2.5"
                  >
                    {/* Token Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-stone-900 bg-white px-2.5 py-1 rounded-xl border border-stone-300 shadow-2xs tracking-tight">
                          🎫 {order.token}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        {order.notes && (
                          <span className="text-[11px] text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                            Note: {order.notes}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* 🕒 TIME OF PUNCH (Showing both exact punch time and date) */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-stone-900 font-black">{order.time}</span>
                          <span className="text-stone-300 font-normal">•</span>
                          <span className="text-stone-500 font-medium">{order.date}</span>
                        </div>

                        {/* Bill Amount */}
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-emerald-700">
                            ₹{order.totalRevenue}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items List in this Token Order */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                        Order Items ({order.totalUnits} items):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.map((it, idx) => (
                          <div
                            key={`${it.saleId}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center text-[11px] font-black">
                              {it.qty}
                            </span>
                            <span>{it.name}</span>
                            <span className="text-stone-400 font-normal text-[11px]">
                              (@₹{it.price}) = <strong className="text-stone-700">₹{it.total}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 text-xs">
                      <span className="text-[11px] text-stone-400">
                        {order.items.length} dishes in this token
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenReceiptPrinter) {
                              onOpenReceiptPrinter({
                                tokenOrBillNo: order.token,
                                orderType: order.paymentMethod,
                                items: order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, total: i.total })),
                                subtotal: order.totalRevenue,
                                totalAmount: order.totalRevenue,
                                paymentMethod: order.paymentMethod,
                                customerName: order.customerName,
                                notes: order.notes,
                                date: order.date,
                                time: order.time
                              }, 'bill');
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
                          title="Thermal Receipt Print Karein (58mm / 80mm)"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-700" />
                          <span>Print Bill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTokenOrder(order)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold cursor-pointer transition-colors"
                          title="Delete this order and restore stock"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* 2. ITEM-WISE TABLE VIEW (NOW INCLUDES EXACT PUNCH TIME COLUMN!) */
          filteredLogs.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">No sales logged for the selected filter.</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-3">Date</th>
                      <th className="py-3.5 px-3">Time</th>
                      <th className="py-3.5 px-3">Token</th>
                      <th className="py-3.5 px-4">Item Name</th>
                      <th className="py-3.5 px-3">Category</th>
                      <th className="py-3.5 px-3 text-center">Channel</th>
                      <th className="py-3.5 px-3 text-center">Qty</th>
                      <th className="py-3.5 px-3 text-right">Price</th>
                      <th className="py-3.5 px-4 text-right">Revenue</th>
                      <th className="py-3.5 px-3 text-center">Action</th>
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
                      } else if (mode === 'khata' || mode === 'udhar') {
                        badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                        badgeLabel = sale.customerName ? `📒 Khata (${sale.customerName})` : '📒 Khata';
                      } else if (mode === 'swiggy') {
                        badgeClass = 'bg-orange-100 text-orange-900 border-orange-300 font-black';
                        badgeLabel = '🟠 Swiggy';
                      } else if (mode === 'zomato') {
                        badgeClass = 'bg-rose-100 text-rose-900 border-rose-300 font-black';
                        badgeLabel = '🔴 Zomato';
                      }

                      let saleTime = '—';
                      if (sale.createdAt) {
                        try {
                          saleTime = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        } catch (e) {
                          saleTime = '—';
                        }
                      }

                      return (
                        <tr key={sale.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-3 text-xs font-semibold text-stone-500 whitespace-nowrap">{sale.date}</td>
                          <td className="py-3 px-3 text-xs font-bold text-stone-800 whitespace-nowrap">
                            <span className="flex items-center gap-1 text-stone-700">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{saleTime}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-xs">
                              {sale.platformOrderId || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">{sale.itemName}</div>
                            {sale.notes && <div className="text-[10px] text-stone-400">{sale.notes}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 font-semibold text-xs text-stone-700">
                              {sale.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${badgeClass}`}>
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-stone-900">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                              {sale.quantitySold}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-stone-600 font-medium">₹{sale.sellingPrice}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-700">₹{sale.totalRevenue}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenReceiptPrinter && onOpenReceiptPrinter(sale, 'bill')}
                                className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Thermal Bill Print Karein (58mm / 80mm)"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-600" />
                              </button>
                              <button
                                onClick={() => onDeleteSale(sale.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete sale log entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                  } else if (mode === 'khata' || mode === 'udhar') {
                    badgeClass = 'bg-amber-100 text-amber-900 border border-amber-300';
                    badgeLabel = sale.customerName ? `📒 Khata (${sale.customerName})` : '📒 Khata';
                  } else if (mode === 'swiggy') {
                    badgeClass = 'bg-orange-100 text-orange-900';
                    badgeLabel = '🟠 Swiggy';
                  } else if (mode === 'zomato') {
                    badgeClass = 'bg-rose-100 text-rose-900';
                    badgeLabel = '🔴 Zomato';
                  }

                  let saleTime = '—';
                  if (sale.createdAt) {
                    try {
                      saleTime = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch (e) {
                      saleTime = '—';
                    }
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
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1 flex-wrap">
                          <span className="font-bold text-stone-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {saleTime}
                          </span>
                          <span>•</span>
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

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="font-black text-emerald-700 text-sm sm:text-base">₹{sale.totalRevenue}</div>
                          <span className="text-[10px] text-stone-500">{sale.quantitySold} × ₹{sale.sellingPrice}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenReceiptPrinter && onOpenReceiptPrinter(sale, 'bill')}
                            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            title="Thermal Bill Print Karein"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            onClick={() => onDeleteSale(sale.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete sale log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
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
