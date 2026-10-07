import React, { useState, useMemo } from 'react';
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
  Calendar, 
  FileText,
  IndianRupee,
  Layers,
  Sparkles
} from 'lucide-react';
import { checkItemStock } from '../utils/storage';

export default function OnlineOrderPunchModal({
  isOpen,
  onClose,
  menuItems = [],
  inventoryItems = [],
  onAddSale
}) {
  const [platform, setPlatform] = useState('Swiggy'); // 'Swiggy' or 'Zomato'
  const [orderId, setOrderId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [packagingCharge, setPackagingCharge] = useState('0');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Selected Item details
  const selectedItem = useMemo(() => {
    return menuItems.find(m => m.id === selectedItemId);
  }, [menuItems, selectedItemId]);

  // When item changes, set default price
  const handleItemSelect = (itemId) => {
    setSelectedItemId(itemId);
    const item = menuItems.find(m => m.id === itemId);
    if (item) {
      // Default to item selling price or let user edit marked up aggregator price
      setCustomPrice(String(item.sellingPrice));
    }
  };

  // Stock check
  const stockStatus = useMemo(() => {
    if (!selectedItem) return { isOutOfStock: false, maxPortions: 999 };
    return checkItemStock(selectedItem, inventoryItems);
  }, [selectedItem, inventoryItems]);

  // Calculated Net Revenue
  const calculatedTotalRevenue = useMemo(() => {
    const price = Number(customPrice) || 0;
    const qty = Number(quantity) || 1;
    const disc = Number(discountAmount) || 0;
    const pack = Number(packagingCharge) || 0;
    const gross = price * qty;
    return Math.max(0, gross - disc + pack);
  }, [customPrice, quantity, discountAmount, packagingCharge]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedItem) {
      setFormError('Kripya menu item select karein!');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setFormError('Quantity 1 ya usse zyada honi chahiye.');
      return;
    }

    if (stockStatus.isOutOfStock) {
      setFormError(`"${selectedItem.name}" Out of Stock hai! Raw material uplabdh nahi hai.`);
      return;
    }

    if (stockStatus.maxPortions < qty) {
      setFormError(`Stock kam hai! Sirf ${stockStatus.maxPortions} portions ban sakte hain.`);
      return;
    }

    const unitSellingPrice = Number(customPrice) || selectedItem.sellingPrice;
    const unitCostPrice = selectedItem.costPrice || 0;
    const disc = Number(discountAmount) || 0;
    const pack = Number(packagingCharge) || 0;

    const newSale = {
      id: `sale-online-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      category: selectedItem.category || 'General',
      quantitySold: qty,
      sellingPrice: unitSellingPrice,
      costPrice: unitCostPrice,
      totalRevenue: calculatedTotalRevenue,
      totalCost: unitCostPrice * qty,
      paymentMethod: platform, // 'Swiggy' or 'Zomato'
      platformOrderId: orderId.trim() || undefined,
      discountAmount: disc > 0 ? disc : undefined,
      packagingCharge: pack > 0 ? pack : undefined,
      notes: notes.trim() || undefined,
      date: saleDate,
      createdAt: new Date().toISOString()
    };

    onAddSale(newSale);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`text-white p-5 flex items-center justify-between shrink-0 ${
          platform === 'Swiggy' ? 'bg-gradient-to-r from-orange-600 to-amber-700' : 'bg-gradient-to-r from-rose-600 to-red-700'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Punch {platform} Online Order
              </h2>
              <p className="text-xs text-white/80">
                Log online delivery order with custom price & discount offers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Platform Toggle */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Select Delivery Platform:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('Swiggy')}
                className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  platform === 'Swiggy'
                    ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#f48c06]"></span>
                <span>🟠 Swiggy Order</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('Zomato')}
                className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  platform === 'Zomato'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm'
                    : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef233c]"></span>
                <span>🔴 Zomato Order</span>
              </button>
            </div>
          </div>

          {/* Order ID & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Order ID / Token # (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. #4829"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Order Date:
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Menu Item Selection */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Select Menu Item:
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">-- Choose Item from Menu --</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) - Menu: ₹{item.sellingPrice}
                </option>
              ))}
            </select>

            {selectedItem && (
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {stockStatus.isOutOfStock ? (
                  <span className="text-rose-600 font-extrabold">🚫 Out of Stock (Raw materials finished)</span>
                ) : (
                  <span className="text-emerald-700 font-bold">✓ {stockStatus.maxPortions} portions can be made</span>
                )}
                <span className="text-stone-500">Food Cost: ₹{selectedItem.costPrice || 0}/pc</span>
              </div>
            )}
          </div>

          {/* Pricing, Quantity & Platform Rate */}
          <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Platform Item Price (₹):
              </label>
              <input
                type="number"
                step="any"
                placeholder="Item rate"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                (Swiggy/Zomato menu price)
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Quantity:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-12 text-center py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Offers & Discounts / Packaging */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1 mb-1">
                <Tag className="w-3.5 h-3.5 text-rose-500" />
                <span>Discount / Offer (₹):</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                e.g. ₹50 off coupon
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Packaging Charge (₹):
              </label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={packagingCharge}
                onChange={(e) => setPackagingCharge(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Container charge
              </span>
            </div>
          </div>

          {/* Net Customer Bill Summary Box */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white p-3.5 rounded-2xl flex items-center justify-between border border-stone-800">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">
                Final Bill Punched into {platform}:
              </span>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">
                ₹{calculatedTotalRevenue}
              </div>
            </div>
            <div className="text-right text-[10px] text-stone-400">
              <div>Subtotal: ₹{(Number(customPrice) || 0) * quantity}</div>
              {Number(discountAmount) > 0 && <div className="text-rose-400">-₹{discountAmount} Discount</div>}
              {Number(packagingCharge) > 0 && <div>+₹{packagingCharge} Packaging</div>}
            </div>
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Rider / Customer Instructions (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Rider pickup, extra ketchup sachets"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
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
            disabled={stockStatus.isOutOfStock}
            className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              stockStatus.isOutOfStock
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : platform === 'Swiggy'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-600/30'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Punch {platform} Order & Deduct Kitchen Stock</span>
          </button>

        </form>

      </div>
    </div>
  );
}
