import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Bike, 
  Plus, 
  Minus, 
  Tag, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  Search, 
  Trash2, 
  Clock, 
  Layers, 
  Sparkles,
  Zap,
  ArrowRight,
  Package
} from 'lucide-react';
import { checkItemStock } from '../utils/storage';

export default function OnlineOrderPunchModal({
  isOpen,
  onClose,
  menuItems = [],
  inventoryItems = [],
  onAddSale,
  onAddBatchSales
}) {
  const [platform, setPlatform] = useState('Swiggy'); // 'Swiggy' or 'Zomato'
  const [tokenCounter, setTokenCounter] = useState(1);
  const [orderToken, setOrderToken] = useState('101');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart state: { [itemId]: { item, qty, price } }
  const [cart, setCart] = useState({});
  const [discountType, setDiscountType] = useState('none'); // 'none', 'flat20', 'flat50', 'flat100', 'pct20', 'custom'
  const [customDiscount, setCustomDiscount] = useState('');
  const [packagingCharge, setPackagingCharge] = useState(0); // 0, 10, 15, 20
  const [riderNotes, setRiderNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Live session history tray: tracks orders punched in this session
  const [sessionOrders, setSessionOrders] = useState([]);

  // Auto-focus and keyboard shortcut (Enter / Ctrl+Enter to punch)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePunchOrder(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set();
    menuItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  // Filter menu items for quick picker
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Add item to cart
  const handleAddItemToCart = (item) => {
    setFormError('');
    const stockStatus = checkItemStock(item, inventoryItems);
    const existing = cart[item.id];
    const currentQty = existing ? existing.qty : 0;
    const newQty = currentQty + 1;

    if (stockStatus.isOutOfStock) {
      setFormError(`"${item.name}" Out of Stock hai!`);
      return;
    }
    if (stockStatus.maxPortions < newQty) {
      setFormError(`"${item.name}" ke sirf ${stockStatus.maxPortions} portions ban sakte hain!`);
      return;
    }

    setCart({
      ...cart,
      [item.id]: {
        item,
        qty: newQty,
        price: existing ? existing.price : item.sellingPrice
      }
    });
  };

  // Update item quantity in cart
  const handleUpdateQty = (itemId, delta) => {
    setFormError('');
    const entry = cart[itemId];
    if (!entry) return;

    const newQty = entry.qty + delta;
    if (newQty <= 0) {
      const next = { ...cart };
      delete next[itemId];
      setCart(next);
      return;
    }

    const stockStatus = checkItemStock(entry.item, inventoryItems);
    if (delta > 0 && stockStatus.maxPortions < newQty) {
      setFormError(`Stock limit: sirf ${stockStatus.maxPortions} portions bache hain!`);
      return;
    }

    setCart({
      ...cart,
      [itemId]: {
        ...entry,
        qty: newQty
      }
    });
  };

  // Update item custom price (if platform price is marked up)
  const handleUpdatePrice = (itemId, newPrice) => {
    const entry = cart[itemId];
    if (!entry) return;
    setCart({
      ...cart,
      [itemId]: {
        ...entry,
        price: Math.max(0, Number(newPrice) || 0)
      }
    });
  };

  // Cart Subtotal Calculation
  const cartSubtotal = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => {
      return sum + (entry.price * entry.qty);
    }, 0);
  }, [cart]);

  const cartTotalQty = useMemo(() => {
    return Object.values(cart).reduce((sum, entry) => sum + entry.qty, 0);
  }, [cart]);

  // Calculate discount value
  const discountValue = useMemo(() => {
    if (discountType === 'flat20') return Math.min(cartSubtotal, 20);
    if (discountType === 'flat50') return Math.min(cartSubtotal, 50);
    if (discountType === 'flat100') return Math.min(cartSubtotal, 100);
    if (discountType === 'pct20') return Math.round(cartSubtotal * 0.20);
    if (discountType === 'custom') return Math.min(cartSubtotal, Number(customDiscount) || 0);
    return 0;
  }, [discountType, customDiscount, cartSubtotal]);

  // Final Net Payable Bill
  const finalBillAmount = useMemo(() => {
    return Math.max(0, cartSubtotal - discountValue + Number(packagingCharge || 0));
  }, [cartSubtotal, discountValue, packagingCharge]);

  // Core High-Speed Punch Action
  const handlePunchOrder = (stayInModal = true) => {
    setFormError('');
    const itemsInCart = Object.values(cart);

    if (itemsInCart.length === 0) {
      setFormError('Kripya kam se kam ek menu item order me add karein!');
      return;
    }

    const token = orderToken.trim() || String(tokenCounter);
    const saleDate = new Date().toISOString().split('T')[0];

    // Build sale records for each item in the order
    // Pro-rate discount across items proportionally or attach to first item
    const totalGross = cartSubtotal;
    const salesBatch = itemsInCart.map((entry, idx) => {
      const itemGross = entry.price * entry.qty;
      // Pro-rata discount share
      const itemDiscShare = totalGross > 0 ? Math.round((itemGross / totalGross) * discountValue) : 0;
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
        paymentMethod: platform, // 'Swiggy' or 'Zomato'
        platformOrderId: `#${token}`,
        discountAmount: itemDiscShare > 0 ? itemDiscShare : undefined,
        packagingCharge: idx === 0 && packagingCharge > 0 ? packagingCharge : undefined,
        notes: riderNotes.trim() || undefined,
        date: saleDate,
        createdAt: new Date().toISOString()
      };
    });

    // Execute batch addition or multiple calls
    if (onAddBatchSales) {
      const success = onAddBatchSales(salesBatch);
      if (!success) return;
    } else if (onAddSale) {
      salesBatch.forEach(s => onAddSale(s));
    }

    // Add to session log tray
    const sessionEntry = {
      token: `#${token}`,
      platform,
      itemsCount: cartTotalQty,
      bill: finalBillAmount,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSessionOrders([sessionEntry, ...sessionOrders]);

    // Reset Cart for the NEXT order immediately!
    setCart({});
    setDiscountType('none');
    setCustomDiscount('');
    setPackagingCharge(0);
    setRiderNotes('');

    // Auto-increment token number for next order! (e.g. 101 -> 102)
    const nextNum = (parseInt(token.replace(/\D/g, ''), 10) || tokenCounter) + 1;
    setOrderToken(String(nextNum));
    setTokenCounter(prev => prev + 1);

    if (!stayInModal) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-5xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 🚀 TOP COMMAND BAR: Platform Switcher & Token */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-stone-800">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-title text-amber-100">
                  Fast Online POS Station
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ⚡ Rush Hour Ready
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Tap items to punch 10+ Swiggy & Zomato orders continuously without closing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Platform Toggle */}
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-2xl border border-stone-700">
              <button
                type="button"
                onClick={() => setPlatform('Swiggy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  platform === 'Swiggy'
                    ? 'bg-[#f48c06] text-white shadow-md ring-2 ring-orange-400/50'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>🟠 Swiggy</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('Zomato')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  platform === 'Zomato'
                    ? 'bg-[#e5383b] text-white shadow-md ring-2 ring-rose-400/50'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>🔴 Zomato</span>
              </button>
            </div>

            {/* Session Stats Badge */}
            {sessionOrders.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
                <span>⚡ {sessionOrders.length} Punched</span>
                <span className="text-white font-extrabold">
                  (₹{sessionOrders.reduce((sum, o) => sum + o.bill, 0).toLocaleString()})
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close POS Station"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* 🖥️ MAIN TWO-COLUMN WORKSPACE: LEFT (MENU) + RIGHT (ORDER PAD) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-100">
          
          {/* 👈 LEFT PANEL: QUICK MENU ITEM PICKER (TOUCH GRID) */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 bg-white border-r border-stone-200">
            
            {/* Search & Category Pills */}
            <div className="space-y-2.5 mb-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search dish (e.g. Burger, Cold Coffee, Pizza)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-amber-200 shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Fast Touch Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredMenuItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No items found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredMenuItems.map((item) => {
                    const stockStatus = checkItemStock(item, inventoryItems);
                    const inCartQty = cart[item.id]?.qty || 0;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddItemToCart(item)}
                        disabled={stockStatus.isOutOfStock}
                        className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer active:scale-95 min-h-[76px] ${
                          stockStatus.isOutOfStock
                            ? 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-stone-50/60 hover:bg-amber-50/40 border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        {/* Top: Name & In-Cart Badge */}
                        <div className="flex items-start justify-between gap-1 w-full">
                          <span className="text-xs font-bold text-stone-900 line-clamp-1 leading-tight group-hover:text-amber-900">
                            {item.name}
                          </span>
                          {inCartQty > 0 && (
                            <span className="shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                              {inCartQty}
                            </span>
                          )}
                        </div>

                        {/* Bottom: Price & Stock Status */}
                        <div className="flex items-center justify-between mt-1 text-[11px] w-full">
                          <span className="font-extrabold text-stone-900 text-xs">
                            ₹{item.sellingPrice}
                          </span>
                          
                          {stockStatus.isOutOfStock ? (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">Out</span>
                          ) : (
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                              ✓ {stockStatus.maxPortions}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* 👉 RIGHT PANEL: THE HIGH-SPEED ORDER PAD & CART */}
          <div className="w-full lg:w-96 flex flex-col bg-stone-50/90 p-3.5 sm:p-4 shrink-0 overflow-y-auto border-t lg:border-t-0 border-stone-200">
            
            {/* Token / Order ID Quick Input */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2 mb-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase flex items-center gap-1">
                  <span>Order Token / ID:</span>
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  (Auto-increments every punch)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1.5 rounded-xl font-black text-xs text-white ${
                  platform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'
                }`}>
                  #{platform.substring(0, 3).toUpperCase()}
                </span>
                <input
                  type="text"
                  placeholder="e.g. 101 or 482"
                  value={orderToken}
                  onChange={(e) => setOrderToken(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-stone-100 border border-stone-300 rounded-xl text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Live Cart Items List */}
            <div className="flex-1 bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs space-y-2 overflow-y-auto min-h-[140px] max-h-[220px] lg:max-h-none mb-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 text-[11px] font-bold text-stone-500 uppercase">
                <span>Items in Order ({cartTotalQty})</span>
                {cartTotalQty > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart({})}
                    className="text-rose-600 hover:underline cursor-pointer text-[10px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  <p className="text-xs font-medium">Cart is empty.</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Left side se dishes tap karein.</p>
                </div>
              ) : (
                <div className="space-y-2 divide-y divide-stone-100">
                  {Object.entries(cart).map(([itemId, entry]) => (
                    <div key={itemId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {entry.item.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-stone-400">Rate: ₹</span>
                          <input
                            type="number"
                            value={entry.price}
                            onChange={(e) => handleUpdatePrice(itemId, e.target.value)}
                            className="w-12 px-1 py-0.5 bg-stone-50 border border-stone-200 rounded text-[11px] font-bold text-stone-800 text-center"
                            title="Edit platform rate if marked-up on Swiggy"
                          />
                          <span className="text-[10px] font-extrabold text-stone-700">
                            = ₹{entry.price * entry.qty}
                          </span>
                        </div>
                      </div>

                      {/* Qty +/- & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(itemId, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-black flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-stone-900">
                          {entry.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(itemId, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-black flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Offers & Packaging Pills */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5 mb-3 shrink-0">
              
              {/* Discount / Coupon Pills */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-rose-500" />
                    <span>Promo Offer / Discount:</span>
                  </span>
                  {discountValue > 0 && (
                    <span className="text-rose-600 font-extrabold">-₹{discountValue}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'none', label: 'None' },
                    { id: 'flat20', label: '-₹20' },
                    { id: 'flat50', label: '-₹50' },
                    { id: 'flat100', label: '-₹100' },
                    { id: 'pct20', label: '20% Off' },
                    { id: 'custom', label: 'Custom' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDiscountType(d.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        discountType === d.id
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {discountType === 'custom' && (
                  <input
                    type="number"
                    placeholder="Enter custom discount amount ₹"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    className="w-full mt-1.5 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 focus:outline-none"
                  />
                )}
              </div>

              {/* Packaging Surcharge Pills */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-amber-600" />
                    <span>Packaging Charge:</span>
                  </span>
                  {packagingCharge > 0 && (
                    <span className="text-emerald-700 font-extrabold">+₹{packagingCharge}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[0, 10, 15, 20].map(fee => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setPackagingCharge(fee)}
                      className={`flex-1 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        packagingCharge === fee
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {fee === 0 ? '₹0' : `+₹${fee}`}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-2.5 mb-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Total Bill Box & Rapid Action Buttons */}
            <div className="space-y-2 shrink-0">
              
              {/* Big Net Bill Display */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white p-3 rounded-2xl flex items-center justify-between border border-stone-800">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    Net Bill to Punch:
                  </span>
                  <div className="text-2xl font-black text-amber-400 leading-none mt-0.5">
                    ₹{finalBillAmount}
                  </div>
                </div>
                <div className="text-right text-[10px] text-stone-400">
                  <div>Subtotal: ₹{cartSubtotal}</div>
                  {discountValue > 0 && <div className="text-rose-400">-₹{discountValue} Off</div>}
                  {packagingCharge > 0 && <div>+₹{packagingCharge} Pack</div>}
                </div>
              </div>

              {/* ⚡ THE BIG INSTANT "PUNCH & NEXT" BUTTON */}
              <button
                type="button"
                onClick={() => handlePunchOrder(true)}
                disabled={cartTotalQty === 0}
                className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  cartTotalQty === 0
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                    : platform === 'Swiggy'
                    ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 shadow-orange-600/30 active:scale-98'
                    : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 shadow-rose-600/30 active:scale-98'
                }`}
                title="Punches order, deducts stock, clears cart & prepares for next order immediately!"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ Punch Order & Next (10+ Orders Fast)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePunchOrder(false)}
                disabled={cartTotalQty === 0}
                className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 font-bold transition-all text-center cursor-pointer"
              >
                Punch & Close Terminal
              </button>

            </div>

          </div>

        </div>

        {/* 📜 BOTTOM SESSION HISTORY TRAY (Punched Orders Feed) */}
        {sessionOrders.length > 0 && (
          <div className="px-4 py-2 bg-stone-900 border-t border-stone-800 text-stone-300 flex items-center gap-3 overflow-x-auto shrink-0 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-amber-400 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Just Punched ({sessionOrders.length}):</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {sessionOrders.map((ord, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ord.platform === 'Swiggy' ? 'bg-[#f48c06]' : 'bg-[#e5383b]'}`}></span>
                  <span>{ord.token}</span>
                  <span className="text-emerald-400">₹{ord.bill}</span>
                  <span className="text-[9px] text-stone-400">({ord.itemsCount} pcs)</span>
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
