import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Send, 
  ArrowLeft, 
  ChevronRight, 
  MessageSquare, 
  AlertTriangle,
  Flame,
  UtensilsCrossed
} from 'lucide-react';
import { checkItemStock } from '../utils/storage';
import { generateCustomerWhatsAppOrderLink } from '../utils/whatsappAlert';

export default function CustomerMenuOrderView({
  tableNumber = '1',
  menuItems = [],
  inventoryItems = [],
  onSubmitOrder,
  onSwitchToAdmin
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({}); // { [itemId]: quantity }
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null); // stores placed order details
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    menuItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.isAvailable) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Check inventory stock status for each item
  const getItemStockInfo = (item) => {
    return checkItemStock(item, inventoryItems);
  };

  // Cart operations
  const updateQuantity = (item, delta) => {
    const currentQty = cart[item.id] || 0;
    const nextQty = Math.max(0, currentQty + delta);

    if (delta > 0) {
      const stockInfo = getItemStockInfo(item);
      if (stockInfo.isOutOfStock) return;
      if (stockInfo.maxPortions < nextQty) return;
    }

    if (nextQty === 0) {
      const copy = { ...cart };
      delete copy[item.id];
      setCart(copy);
    } else {
      setCart({ ...cart, [item.id]: nextQty });
    }
  };

  // Cart totals
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    const itemsList = [];

    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      if (item && qty > 0) {
        totalItems += qty;
        totalAmount += item.sellingPrice * qty;
        itemsList.push({
          id: item.id,
          name: item.name,
          price: item.sellingPrice,
          costPrice: item.costPrice || 0,
          category: item.category,
          quantity: qty,
          total: item.sellingPrice * qty
        });
      }
    });

    return { totalItems, totalAmount, itemsList };
  }, [cart, menuItems]);

  // Handle final order submission
  const handlePlaceOrder = async () => {
    if (cartSummary.itemsList.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    const orderPayload = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tableNumber: String(tableNumber || '1').replace(/^table\s*/i, ''),
      items: cartSummary.itemsList,
      totalAmount: cartSummary.totalAmount,
      customerNotes: customerNotes.trim(),
      customerName: customerName.trim(),
      status: 'pending', // 'pending' -> 'preparing' -> 'served' -> 'billed'
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      if (onSubmitOrder) {
        await onSubmitOrder(orderPayload);
      }
      setOrderPlaced(orderPayload);
      setCart({});
      setCustomerNotes('');
      setIsReviewOpen(false);
    } catch (err) {
      console.error('Order placement error:', err);
      alert('Order could not be submitted. Please ask counter staff!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully placed, show Confirmation screen
  if (orderPlaced) {
    const waLink = generateCustomerWhatsAppOrderLink(orderPlaced);

    return (
      <div className="min-h-screen bg-stone-950 text-amber-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Order Confirmed & Sent to Kitchen
            </span>
            <h2 className="text-2xl font-bold font-serif-title text-amber-100 mt-2">
              Thank You!
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Your order is being freshly prepared for <span className="text-amber-400 font-bold">Table #{orderPlaced.tableNumber}</span>.
            </p>
          </div>

          {/* Order Details Receipt Box */}
          <div className="bg-stone-950/80 rounded-2xl p-4 border border-stone-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-stone-400">
              <span>Order ID: <strong className="text-amber-200">#{orderPlaced.id.slice(-6).toUpperCase()}</strong></span>
              <span>Table <strong className="text-amber-300">#{orderPlaced.tableNumber}</strong></span>
            </div>

            <div className="space-y-1.5 py-1 max-h-40 overflow-y-auto">
              {orderPlaced.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-stone-200">
                  <span>
                    <strong className="text-amber-400">{item.quantity}x</strong> {item.name}
                  </span>
                  <span className="font-semibold">₹{item.total}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-between items-center font-bold text-sm text-amber-300">
              <span>Total Bill:</span>
              <span>₹{orderPlaced.totalAmount}</span>
            </div>

            {orderPlaced.customerNotes && (
              <div className="text-[11px] text-stone-400 italic pt-1">
                Note: "{orderPlaced.customerNotes}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send Order Confirmation on WhatsApp</span>
            </a>

            <button
              onClick={() => setOrderPlaced(null)}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 active:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl border border-stone-700 transition-colors cursor-pointer"
            >
              Order More Items for Table #{orderPlaced.tableNumber}
            </button>
          </div>

          <div className="pt-2 text-[10px] text-stone-500">
            S&S Cafe — Crafted with passion. Need help? Call counter staff anytime!
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-28">

      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 px-4 py-3.5 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-amber-500/50 shadow-md">
              <img src="/logo.jpg" alt="S&S Cafe" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-serif-title text-amber-100">S&S Cafe</h1>
                <span className="text-[10px] bg-amber-500 text-stone-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Dine-In
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Fresh artisanal coffee & food</p>
            </div>
          </div>

          {/* Table Badge */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white px-3.5 py-1.5 rounded-2xl shadow-lg shadow-amber-950/40 border border-amber-400/30 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider block opacity-90">Table</span>
            <span className="text-base font-extrabold leading-none">#{tableNumber}</span>
          </div>

        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coffee, pizza, burgers, shakes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="max-w-2xl mx-auto mt-3 flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Items List */}
      <main className="max-w-2xl w-full mx-auto px-4 py-4 flex-1 space-y-3">
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-stone-900/50 rounded-3xl border border-stone-800/80 p-8">
            <UtensilsCrossed className="w-10 h-10 text-stone-600 mx-auto" />
            <h3 className="text-base font-bold text-stone-300">No items found</h3>
            <p className="text-xs text-stone-500">Try searching for something else or pick another category.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const qtyInCart = cart[item.id] || 0;
            const stockInfo = getItemStockInfo(item);
            const isOut = stockInfo.isOutOfStock;

            return (
              <div
                key={item.id}
                className={`bg-stone-900/90 rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                  isOut 
                    ? 'border-stone-800/50 opacity-60' 
                    : qtyInCart > 0 
                      ? 'border-amber-500/50 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/20' 
                      : 'border-stone-800/80 hover:border-stone-700'
                }`}
              >
                {/* Item Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-100 truncate">
                      {item.name}
                    </h3>
                    {item.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 font-semibold shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-extrabold text-amber-400">
                      ₹{item.sellingPrice}
                    </span>

                    {isOut ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                        Out of Stock
                      </span>
                    ) : stockInfo.maxPortions <= 5 && stockInfo.maxPortions > 0 ? (
                      <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        Only {stockInfo.maxPortions} left!
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Add / Stepper Button */}
                <div className="shrink-0">
                  {isOut ? (
                    <button
                      disabled
                      className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-500 text-xs font-bold cursor-not-allowed"
                    >
                      Sold Out
                    </button>
                  ) : qtyInCart === 0 ? (
                    <button
                      onClick={() => updateQuantity(item, 1)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-stone-950 text-xs font-extrabold rounded-xl shadow-md shadow-amber-950/40 transition-all cursor-pointer transform hover:scale-105"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-stone-800 rounded-xl p-1 border border-stone-700">
                      <button
                        onClick={() => updateQuantity(item, -1)}
                        className="w-7 h-7 rounded-lg bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center font-extrabold transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-amber-300">
                        {qtyInCart}
                      </span>
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center font-extrabold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {cartSummary.totalItems > 0 && (
        <div className="fixed bottom-3 left-0 right-0 z-40 px-4">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center font-extrabold">
                <ShoppingBag className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-100">
                  {cartSummary.totalItems} {cartSummary.totalItems === 1 ? 'item' : 'items'} in Cart
                </div>
                <div className="text-base font-extrabold text-white">
                  ₹{cartSummary.totalAmount}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReviewOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-stone-950 hover:bg-stone-900 active:bg-black text-amber-200 font-extrabold text-xs rounded-xl shadow-lg border border-amber-500/40 transition-all cursor-pointer transform hover:scale-105"
            >
              <span>View Order</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* Order Review & Place Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Table #{tableNumber} — Order Summary
                </h3>
                <p className="text-[11px] text-stone-400">Review dishes before placing to kitchen</p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Items List */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
              <div className="space-y-2">
                {cartSummary.itemsList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-950/60 p-3 rounded-xl border border-stone-800">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-100 truncate">{item.name}</div>
                      <div className="text-[11px] text-amber-400 font-semibold">₹{item.price} each</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item, -1)}
                        className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-4 text-center text-xs font-bold text-amber-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <span className="w-12 text-right text-xs font-extrabold text-stone-200">
                        ₹{item.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cooking Instructions / Special Requests */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-stone-400 block mb-1">
                  Special Cooking Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, Extra crispy, No onion..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 block mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Total Calculation */}
              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-1 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({cartSummary.totalItems} items):</span>
                  <span>₹{cartSummary.totalAmount}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Taxes & Service:</span>
                  <span className="text-emerald-400">₹0 (Included)</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-amber-300 pt-2 border-t border-stone-800">
                  <span>Grand Total to Pay:</span>
                  <span>₹{cartSummary.totalAmount}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer Place Button */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm & Place Order (₹{cartSummary.totalAmount})</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin Switcher Footer for testing */}
      {onSwitchToAdmin && (
        <div className="mt-8 text-center">
          <button
            onClick={onSwitchToAdmin}
            className="text-[11px] text-stone-500 hover:text-amber-400 underline transition-colors cursor-pointer"
          >
            ← Switch to S&S Cafe POS Admin Mode
          </button>
        </div>
      )}

    </div>
  );
}
