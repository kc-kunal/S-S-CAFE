import React, { useState, useMemo } from 'react';
import { Plus, ShoppingBag, Trash2, Search, Zap, CheckCircle2, TrendingUp, IndianRupee, Layers, Tag, Banknote, Smartphone } from 'lucide-react';
import { checkItemStock } from '../utils/storage';

export default function SalesTracker({ menuItems, salesLogs, inventoryItems = [], onAddSale, onUpdateSale, onDeleteSale }) {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' or 'Online'
  const [filterDate, setFilterDate] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [warningMessage, setWarningMessage] = useState(null);

  const showWarning = (msg) => {
    setWarningMessage(msg);
    setTimeout(() => setWarningMessage(null), 4000);
  };

  // Check if an item has sufficient raw materials in inventory
  const getRecipeStockStatus = (item) => {
    return checkItemStock(item, inventoryItems);
  };

  // Fast One-Click Sale Recorder with Stock Check
  const handleQuickAddSale = (item, qtyToAdd = 1) => {
    const qty = Number(qtyToAdd) || 1;
    if (qty <= 0) return;

    const stockStatus = getRecipeStockStatus(item);
    if (stockStatus.isOutOfStock) {
      const missingList = stockStatus.missing.map(m => `${m.name} (${m.available} ${m.unit} in stock)`).join(', ');
      showWarning(`❌ "${item.name}" Out of Stock hai! Raw material khatam hai: ${missingList || 'No stock'}. Kripya pehle raw material purchase karein.`);
      return;
    }

    if (stockStatus.maxPortions < qty) {
      showWarning(`⚠️ Stock kam hai! "${item.name}" ke sirf ${stockStatus.maxPortions} portions ban sakte hain.`);
      return;
    }

    const newSale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      itemId: item.id,
      itemName: item.name,
      category: item.category || 'General',
      quantitySold: qty,
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      totalRevenue: item.sellingPrice * qty,
      totalCost: item.costPrice * qty,
      paymentMethod: paymentMode, // 'Cash' or 'Online'
      date: saleDate,
      createdAt: new Date().toISOString()
    };

    onAddSale(newSale);
  };

  // Quick Remove/Deduct 1 Sale Entry
  const handleQuickRemoveSale = (item) => {
    const matchingSale = salesLogs.find(
      s => (s.itemId === item.id || s.itemName === item.name) && s.date === saleDate && s.paymentMethod === paymentMode
    ) || salesLogs.find(
      s => (s.itemId === item.id || s.itemName === item.name) && s.date === saleDate
    );

    if (!matchingSale) return;

    if (matchingSale.quantitySold > 1) {
      const updatedQty = matchingSale.quantitySold - 1;
      const updatedSale = {
        ...matchingSale,
        quantitySold: updatedQty,
        totalRevenue: updatedQty * matchingSale.sellingPrice,
        totalCost: updatedQty * matchingSale.costPrice
      };
      if (onUpdateSale) {
        onUpdateSale(updatedSale);
      } else {
        onDeleteSale(matchingSale.id);
        onAddSale(updatedSale);
      }
    } else {
      onDeleteSale(matchingSale.id);
    }
  };

  // Calculate Sales Summary for selected date (defaults to saleDate)
  const summaryDate = filterDate || saleDate;
  
  const dailySummary = useMemo(() => {
    const logs = salesLogs.filter(s => s.date === summaryDate);
    const totalRevenue = logs.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    const cashRevenue = logs.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? 0 : (Number(s.totalRevenue) || 0)), 0);
    const onlineRevenue = logs.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? (Number(s.totalRevenue) || 0) : 0), 0);
    
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

    return { totalRevenue, cashRevenue, onlineRevenue, totalCost, totalQty, netProfit, margin, topItem, count: logs.length };
  }, [salesLogs, summaryDate]);

  // Extract unique categories from menu items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(i => i.category || 'General')));
    return ['All', ...cats];
  }, [menuItems]);

  // Group menu items category-wise
  const groupedMenuItems = useMemo(() => {
    const groups = {};
    menuItems.forEach(item => {
      const cat = item.category || 'General';
      if (selectedCategory !== 'All' && cat !== selectedCategory) return;
      if (searchItem && !item.name.toLowerCase().includes(searchItem.toLowerCase())) return;

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems, selectedCategory, searchItem]);

  const filteredLogs = salesLogs.filter(s => {
    const matchesDate = !filterDate || s.date === filterDate;
    const matchesSearch = !searchItem || s.itemName.toLowerCase().includes(searchItem.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* 📊 DAILY SALES SUMMARY SECTION */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-950 text-white rounded-3xl p-6 shadow-xl border border-stone-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-amber-100 flex items-center justify-center font-extrabold shadow-lg shadow-amber-600/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-title text-amber-100">Daily Sales Summary</h2>
              <p className="text-xs text-stone-400">Overview of revenue, cash vs online breakdown for <span className="text-amber-400 font-bold">{summaryDate}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-1.5 rounded-2xl border border-stone-700/80">
            <span className="text-xs font-bold text-amber-300/80 uppercase">Date:</span>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          
          {/* Total Revenue */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Sales</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">
              ₹{dailySummary.totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-stone-400 mt-1">{dailySummary.count} sales logged</span>
          </div>

          {/* Cash Sales */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-emerald-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">💵 Cash Sales</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-1">
              ₹{dailySummary.cashRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-400/70 mt-1">Cash received</span>
          </div>

          {/* Online Sales */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-sky-900/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">📱 Online / UPI</span>
            </div>
            <div className="text-2xl font-extrabold text-sky-300 mt-1">
              ₹{dailySummary.onlineRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-sky-400/70 mt-1">UPI & Card pay</span>
          </div>

          {/* Quantity Sold */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Items Sold</span>
            <div className="text-2xl font-extrabold text-stone-100 mt-1">
              {dailySummary.totalQty} <span className="text-xs font-semibold text-stone-400">pcs</span>
            </div>
            <span className="text-[11px] text-stone-400 mt-1">Total quantity</span>
          </div>

          {/* Daily Net Profit */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700/50 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Daily Net Profit</span>
            <div className={`text-2xl font-extrabold mt-1 ${dailySummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{dailySummary.netProfit.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-300/80 mt-1">{dailySummary.margin}% margin</span>
          </div>

        </div>
      </div>

      {/* 🏷️ CATEGORY-WISE SELECTION & SALES LOGGER */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-6">
        
        {/* Header, Payment Mode Toggle & Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600 fill-amber-600" />
              <span>Select Item to Log Sale (Category-Wise)</span>
            </h3>
            <p className="text-xs text-stone-500">Select payment mode and tap item buttons to log sales.</p>
          </div>

          {/* PAYMENT MODE SELECTOR (CASH VS ONLINE) */}
          <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
            <span className="text-xs font-extrabold text-stone-500 uppercase px-2">Payment Mode:</span>
            
            <button
              type="button"
              onClick={() => setPaymentMode('Cash')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentMode === 'Cash'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>💵 Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('Online')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentMode === 'Online'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-500'
                  : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 Online / UPI</span>
            </button>
          </div>

          <div className="w-full md:w-56 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1 mr-1 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Warning Notification Banner */}
        {warningMessage && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
              <span>⚠️</span>
              <span>{warningMessage}</span>
            </div>
            <button
              onClick={() => setWarningMessage(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Category-Wise Menu Items Section */}
        {Object.keys(groupedMenuItems).length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No menu items found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMenuItems).map(([category, items]) => (
              <div key={category} className="space-y-3">
                
                {/* Category Header */}
                <div className="flex items-center space-x-2 border-b border-stone-200/80 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h4 className="text-sm font-extrabold text-stone-900 tracking-wide uppercase">
                    {category} <span className="text-xs text-stone-400 font-normal">({items.length})</span>
                  </h4>
                </div>

                {/* Items Grid for this Category - Ultra Compact Mini Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {items.map((item) => {
                    const itemLogs = salesLogs.filter(s => (s.itemId === item.id || s.itemName === item.name) && s.date === saleDate);
                    const todayQtySold = itemLogs.reduce((acc, curr) => acc + Number(curr.quantitySold), 0);
                    const stockStatus = getRecipeStockStatus(item);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-2.5 border transition-all shadow-sm flex flex-col justify-between group ${
                          stockStatus.isOutOfStock
                            ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                            : 'bg-white hover:bg-amber-50/50 border-stone-200/90 hover:border-amber-400'
                        }`}
                      >
                        {/* Top: Name & Price */}
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h5
                              className={`text-xs font-bold line-clamp-1 leading-tight ${
                                stockStatus.isOutOfStock ? 'text-stone-600' : 'text-stone-900 group-hover:text-amber-900'
                              }`}
                              title={item.name}
                            >
                              {item.name}
                            </h5>
                            <span className="text-xs font-black text-amber-900 shrink-0">
                              ₹{item.sellingPrice}
                            </span>
                          </div>

                          {/* Stock Status Badge */}
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] mt-1">
                            {stockStatus.isOutOfStock ? (
                              <span className="font-extrabold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                                🚫 Out of Stock
                              </span>
                            ) : stockStatus.maxPortions <= 5 ? (
                              <span className="font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚡ Only {stockStatus.maxPortions} left
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                ✓ {stockStatus.maxPortions} in stock
                              </span>
                            )}

                            {todayQtySold > 0 && (
                              <span className="font-extrabold text-stone-600 bg-stone-100 px-1 rounded">
                                {todayQtySold} sold
                              </span>
                            )}
                          </div>

                          {/* Missing Raw Materials Hint */}
                          {stockStatus.isOutOfStock && stockStatus.missing && stockStatus.missing.length > 0 && (
                            <p
                              className="text-[9px] font-bold text-rose-600 mt-1 truncate"
                              title={stockStatus.missing.map(m => `${m.name}: ${m.available}/${m.needed} ${m.unit}`).join(', ')}
                            >
                              Missing: {stockStatus.missing.map(m => m.name).join(', ')}
                            </p>
                          )}
                        </div>

                        {/* Quick Key Buttons: Remove (-1) & Add (+1, +2, +5) */}
                        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickRemoveSale(item)}
                            disabled={todayQtySold === 0}
                            className={`px-2 py-1 text-[11px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                              todayQtySold > 0
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 active:scale-95'
                                : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                            }`}
                            title="Quick Remove (-1)"
                          >
                            -1
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAddSale(item, 1)}
                            disabled={stockStatus.isOutOfStock}
                            className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg shadow-sm transition-all flex items-center justify-center gap-0.5 ${
                              stockStatus.isOutOfStock
                                ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                                : paymentMode === 'Online'
                                ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer active:scale-95'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                            }`}
                            title={stockStatus.isOutOfStock ? `Out of Stock: Raw material khatam hai` : `Add 1 (${paymentMode})`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>+1</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAddSale(item, 2)}
                            disabled={stockStatus.isOutOfStock || stockStatus.maxPortions < 2}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              stockStatus.isOutOfStock || stockStatus.maxPortions < 2
                                ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                                : 'bg-stone-100 hover:bg-amber-100 text-stone-800 border-stone-200 cursor-pointer active:scale-95'
                            }`}
                            title="Add 2"
                          >
                            +2
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAddSale(item, 5)}
                            disabled={stockStatus.isOutOfStock || stockStatus.maxPortions < 5}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              stockStatus.isOutOfStock || stockStatus.maxPortions < 5
                                ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                                : 'bg-stone-100 hover:bg-amber-100 text-stone-800 border-stone-200 cursor-pointer active:scale-95'
                            }`}
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

      {/* 📜 SALES LOGS HISTORY TABLE WITH PAYMENT BADGES */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-base font-bold text-stone-900">Logged Sales History</h3>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search sale log..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="text-xs text-rose-600 font-bold">Clear Filter</button>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-stone-400 py-8 text-center">No sales logged for the selected filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-950 text-amber-100 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Payment Mode</th>
                  <th className="py-3.5 px-4 text-center">Qty Sold</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">Total Revenue</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-700">
                {filteredLogs.map((sale) => (
                  <tr key={sale.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-stone-500">{sale.date}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{sale.itemName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-100 font-semibold text-xs text-stone-700">
                        {sale.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        sale.paymentMethod === 'Online'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {sale.paymentMethod === 'Online' ? '📱 Online / UPI' : '💵 Cash'}
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
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete sale log entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}


