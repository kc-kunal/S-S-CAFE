import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Bell, 
  BellOff, 
  QrCode, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Utensils, 
  Receipt, 
  X, 
  Eye, 
  Trash2, 
  Flame, 
  Send,
  Sparkles,
  Smartphone,
  Phone,
  Volume2,
  VolumeX,
  Settings2,
  Megaphone
} from 'lucide-react';
import { 
  playOrderChime, 
  playDineInOrderAlert, 
  getDineInAlertSettings, 
  saveDineInAlertSettings, 
  testDineInAlert 
} from '../utils/audioAlert';

export default function DiningManager({
  diningOrders = [],
  currentCafe,
  onUpdateOrderStatus,
  onSettleOrderToSales,
  onDeleteOrder,
  onPreviewCustomerView,
  onOpenAlertSettings,
  onOpenReceiptPrinter,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' or 'qrcodes'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'pending', 'preparing', 'served', 'billed', 'all'
  const [alertSettings, setAlertSettings] = useState(() => getDineInAlertSettings());
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // QR Code generator settings (15 tables for Hotel/Restaurant, 8 for Cafe)
  const [tableCount, setTableCount] = useState(() => {
    return (currentCafe?.businessType === 'restaurant' || (currentCafe?.ownerEmail || '').toLowerCase() === 'kc@gmail.com') ? 15 : 8;
  });
  const [qrBaseUrl, setQrBaseUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://ss-cafe.netlify.app'
  );
  const [generatedQrs, setGeneratedQrs] = useState([]); // [{ tableNumber, dataUrl, url }]
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Settlement dialog state
  const [settlingOrder, setSettlingOrder] = useState(null);
  const [settlePaymentMode, setSettlePaymentMode] = useState('Cash'); // 'Cash' or 'Online'

  // Generate QR codes for all tables
  useEffect(() => {
    let isCancelled = false;

    const generateAllQrs = async () => {
      setIsGeneratingQr(true);
      const count = Math.min(Math.max(1, Number(tableCount) || 1), 30);
      const results = [];

      for (let i = 1; i <= count; i++) {
        const orderUrl = `${qrBaseUrl.replace(/\/$/, '')}/?table=${i}`;
        try {
          const dataUrl = await QRCode.toDataURL(orderUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#1c1917', // stone-900
              light: '#ffffff'
            }
          });
          results.push({
            tableNumber: i,
            url: orderUrl,
            dataUrl
          });
        } catch (err) {
          console.error(`Error generating QR for table ${i}:`, err);
        }
      }

      if (!isCancelled) {
        setGeneratedQrs(results);
        setIsGeneratingQr(false);
      }
    };

    generateAllQrs();

    return () => {
      isCancelled = true;
    };
  }, [tableCount, qrBaseUrl]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return diningOrders.filter(order => {
      if (statusFilter === 'active') {
        return order.status === 'pending' || order.status === 'preparing' || order.status === 'served';
      }
      if (statusFilter === 'all') return true;
      return order.status === statusFilter;
    });
  }, [diningOrders, statusFilter]);

  // Active orders counts & revenue for badges & KPI ribbon
  const pendingCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'pending').length;
  }, [diningOrders]);

  const preparingCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'preparing').length;
  }, [diningOrders]);

  const servedCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'served').length;
  }, [diningOrders]);

  const billedCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'billed').length;
  }, [diningOrders]);

  const activeTotalCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'served').length;
  }, [diningOrders]);

  const dineInRevenue = useMemo(() => {
    return diningOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [diningOrders]);

  // Meesho Order Alert controls
  const handleToggleSound = () => {
    const nextEnabled = !alertSettings.enabled;
    const updated = saveDineInAlertSettings({ enabled: nextEnabled });
    setAlertSettings(updated);
    if (nextEnabled) {
      testDineInAlert('1');
      if (showToast) showToast('🔊 Meesho Voice Alert: ON ("Dine-in ka order aaya hai, check karein")');
    } else {
      if (showToast) showToast('🔇 Order Alert Muted');
    }
  };

  const handleTestAlert = () => {
    testDineInAlert('1');
    if (showToast) showToast('🗣️ Testing Meesho Alert: "Dine-in ka order aaya hai, Table #1, check karein"');
  };

  const handleUpdateAlertSettings = (partial) => {
    const updated = saveDineInAlertSettings(partial);
    setAlertSettings(updated);
  };

  // Settle order into POS Sales
  const handleConfirmSettle = (printBill = false) => {
    if (!settlingOrder) return;
    const currentSettling = { ...settlingOrder };
    const currentMode = settlePaymentMode;

    if (onSettleOrderToSales) {
      onSettleOrderToSales(currentSettling, currentMode);
    }

    if (printBill && onOpenReceiptPrinter) {
      onOpenReceiptPrinter({
        ...currentSettling,
        tokenOrBillNo: `Table #${currentSettling.tableNumber}`,
        tableNumber: currentSettling.tableNumber,
        orderType: 'Dine-In',
        paymentMethod: currentMode,
        customerPhone: currentSettling.customerPhone || ''
      }, 'bill');
    }

    if (showToast) {
      showToast(`⚡ Table #${currentSettling.tableNumber} Settled Successfully (${currentMode})!`);
    }

    setSettlingOrder(null);
  };

  // Print all QR cards
  const handlePrintQrCards = () => {
    window.print();
  };

  return (
    <div className="space-y-3.5">

      {/* 🛎️ TOP CONTROL & ACTION HEADER */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Title & Sub-tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900">Dine-In & Tables</h2>
                {pendingCount > 0 ? (
                  <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    {pendingCount} New
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {activeTotalCount} Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Table QR ordering & real-time counter / kitchen display
              </p>
            </div>
          </div>

          {/* Sub-Tabs: Live Orders vs Table QR Stands */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'orders'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Orders ({activeTotalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('qrcodes')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'qrcodes'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Table QR Stands</span>
            </button>
          </div>
        </div>

        {/* Right: Quick Alert Controls & Preview */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Meesho Voice Alert Pill */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              alertSettings.enabled
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
            }`}
            title="Toggle Voice Order Alert"
          >
            {alertSettings.enabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="text-[11px]">Voice Alert: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[11px]">Alert: OFF</span>
              </>
            )}
          </button>

          {/* Test Voice Alert */}
          <button
            type="button"
            onClick={handleTestAlert}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Test Voice Announcement"
          >
            <Megaphone className="w-3 h-3 text-amber-200" />
            <span>Test Sound</span>
          </button>

          {/* Alert Settings */}
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer border border-stone-200"
            title="Configure Alert Settings"
          >
            <Settings2 className="w-3.5 h-3.5 text-stone-600" />
          </button>

          {/* Customer Preview */}
          {onPreviewCustomerView && (
            <button
              onClick={() => onPreviewCustomerView('1')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 text-[11px] font-bold rounded-xl border border-stone-800 transition-all cursor-pointer shadow-xs"
              title="Preview Customer Mobile Menu for Table 1"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              <span>Mobile Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LIVE TABLE ORDERS (KITCHEN & COUNTER DISPLAY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-3.5">
          
          {/* 📊 KPI METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div 
              onClick={() => setStatusFilter('active')}
              className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-all"
            >
              <p className="text-[10px] font-bold text-stone-400 uppercase">Active Tables</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xl font-black text-stone-900">{activeTotalCount}</span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs">
                  🍽️
                </span>
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('pending')}
              className={`bg-white rounded-2xl p-3 border shadow-2xs cursor-pointer transition-all ${
                pendingCount > 0 ? 'border-red-300 ring-2 ring-red-400/20 bg-red-50/30' : 'border-stone-200 hover:border-amber-400'
              }`}
            >
              <p className="text-[10px] font-bold text-stone-400 uppercase">New / Pending</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className={`text-xl font-black ${pendingCount > 0 ? 'text-red-600' : 'text-stone-900'}`}>{pendingCount}</span>
                <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                  🔔
                </span>
              </div>
            </div>

            <div 
              onClick={() => setStatusFilter('preparing')}
              className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs cursor-pointer hover:border-blue-400 transition-all"
            >
              <p className="text-[10px] font-bold text-stone-400 uppercase">In Kitchen</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xl font-black text-blue-700">{preparingCount}</span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                  👨‍🍳
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs">
              <p className="text-[10px] font-bold text-stone-400 uppercase">Table Revenue</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xl font-black text-emerald-700">₹{dineInRevenue.toLocaleString()}</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  ₹
                </span>
              </div>
            </div>
          </div>

          {/* 🔍 FILTER PILLS BAR */}
          <div className="bg-white rounded-2xl p-2.5 border border-stone-200 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'active', label: 'Active Orders', count: activeTotalCount },
              { id: 'pending', label: '🟡 New Orders', count: pendingCount },
              { id: 'preparing', label: '🔵 In Kitchen', count: preparingCount },
              { id: 'served', label: '🟣 Served', count: servedCount },
              { id: 'billed', label: '🟢 Billed & Paid', count: billedCount },
              { id: 'all', label: 'All Orders', count: diningOrders.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  statusFilter === tab.id ? 'bg-amber-700 text-white' : 'bg-stone-200/80 text-stone-700 font-bold'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* 🍽️ ORDERS GRID */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 shadow-2xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-xl">
                🍽️
              </div>
              <h3 className="text-sm font-bold text-stone-900">No Orders in this Status</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Customers scan the table QR code and tap "Place Order" to submit orders directly here with instant alert sound!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
              {filteredOrders.map(order => {
                const isPending = order.status === 'pending';
                const isPreparing = order.status === 'preparing';
                const isServed = order.status === 'served';
                const isBilled = order.status === 'billed';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between shadow-xs relative overflow-hidden ${
                      isPending 
                        ? 'border-amber-400 ring-2 ring-amber-400/25 shadow-amber-500/10'
                        : isPreparing
                          ? 'border-blue-300 ring-1 ring-blue-300/40'
                          : isServed
                            ? 'border-purple-300'
                            : 'border-stone-200 opacity-80'
                    }`}
                  >
                    {/* Top Row: Table Badge & Status */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shadow-xs ${
                            isPending 
                              ? 'bg-amber-500 text-stone-950 font-black' 
                              : isPreparing
                              ? 'bg-blue-600 text-white'
                              : isServed
                              ? 'bg-purple-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            #{order.tableNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-stone-900">Table #{order.tableNumber}</span>
                            <div className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              : isPreparing
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : isServed
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isPending ? '🟡 New Order' : isPreparing ? '🔵 In Kitchen' : isServed ? '🟣 Served' : '🟢 Billed'}
                          </span>
                        </div>
                      </div>

                      {/* Customer Note if any */}
                      {order.customerNotes && (
                        <div className="my-2 p-2 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                          <strong className="text-[10px] uppercase font-bold text-amber-800 block">Customer Request:</strong>
                          "{order.customerNotes}"
                        </div>
                      )}

                      {/* Items Ordered List */}
                      <div className="py-2.5 space-y-1.5 border-b border-stone-100 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-stone-800">
                            <span className="font-semibold flex items-center gap-1.5">
                              <span className="inline-block px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] rounded font-extrabold">{item.quantity}x</span>
                              <span className="truncate max-w-[180px]">{item.name}</span>
                            </span>
                            <span className="font-bold text-stone-700">₹{item.total || (item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total Amount */}
                      <div className="flex items-center justify-between py-2 text-xs">
                        <span className="font-bold text-stone-500">Bill Amount:</span>
                        <span className="text-sm font-black text-amber-700">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 border-t border-stone-100 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                            className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Prepare in Kitchen</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'served')}
                            className="flex-1 py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Mark Served</span>
                          </button>
                        )}

                        {!isBilled && (
                          <button
                            onClick={() => setSettlingOrder(order)}
                            className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Punch Bill (₹{order.totalAmount})</span>
                          </button>
                        )}

                        {isBilled && (
                          <div className="w-full text-center py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Billed & Stock Deducted</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Print & Cancel Row */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenReceiptPrinter && onOpenReceiptPrinter(order, 'kot')}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Print Kitchen Order Ticket (KOT)"
                          >
                            <ChefHat className="w-3 h-3 text-amber-700" />
                            <span>KOT</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReceiptPrinter && onOpenReceiptPrinter(order, 'bill')}
                            className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Print Thermal Bill Slip"
                          >
                            <Printer className="w-3 h-3 text-stone-700" />
                            <span>Bill Slip</span>
                          </button>
                        </div>

                        {!isBilled && (
                          <button
                            onClick={() => {
                              if (confirm(`Table #${order.tableNumber} ka order cancel/delete karna chahte hain?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="text-[10px] text-stone-400 hover:text-red-600 flex items-center gap-0.5 cursor-pointer"
                            title="Cancel Order"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TABLE QR CODE GENERATOR & PRINT STANDS */}
      {/* ========================================================================= */}
      {activeSubTab === 'qrcodes' && (
        <div className="space-y-3.5">
          
          {/* Settings Bar */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1">Number of Tables</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tableCount}
                    onChange={(e) => setTableCount(e.target.value)}
                    className="w-18 bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-stone-900 text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs text-stone-500 font-semibold">tables</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-stone-500 block mb-1">Cafe Website / Host URL</label>
                <input
                  type="text"
                  value={qrBaseUrl}
                  onChange={(e) => setQrBaseUrl(e.target.value)}
                  placeholder="https://yourcafe.com"
                  className="w-60 sm:w-72 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handlePrintQrCards}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 border border-amber-500/30 transition-all cursor-pointer transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Stand Cards</span>
              </button>
            </div>

          </div>

          {/* QR Cards Grid (Formatted for both screen preview & high-quality printing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 print:grid-cols-2 print:gap-6" id="printable-qr-grid">
            {generatedQrs.map((item) => (
              <div
                key={item.tableNumber}
                className="bg-white rounded-2xl p-4 border-2 border-stone-200 shadow-xs text-center flex flex-col items-center justify-between space-y-2.5 relative group hover:border-amber-500 transition-all print:border-2 print:border-black print:shadow-none print:break-inside-avoid"
              >
                {/* Header */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <img src="/logo.jpg" alt="Logo" className="w-5 h-5 rounded-full" onError={(e) => e.target.style.display = 'none'} />
                    <span className="font-bold text-xs tracking-tight text-stone-900">{currentCafe?.cafeName || 'S&S Cafe'}</span>
                  </div>
                  <div className="inline-block bg-stone-950 text-amber-300 text-xs font-black uppercase px-3 py-0.5 rounded-full shadow-2xs">
                    TABLE #{item.tableNumber}
                  </div>
                </div>

                {/* QR Code Image */}
                <div className="w-40 h-40 bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-center shadow-inner">
                  {item.dataUrl && (
                    <img 
                      src={item.dataUrl} 
                      alt={`Table ${item.tableNumber} QR`} 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Instructions */}
                <div className="w-full space-y-0.5">
                  <div className="text-[11px] font-black text-stone-900 flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Scan with Mobile Camera</span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    View Digital Menu & Place Order
                  </p>
                </div>

                {/* Download Button (hidden during print) */}
                <div className="w-full pt-2 border-t border-stone-100 flex items-center justify-between text-xs print:hidden">
                  <a
                    href={item.dataUrl}
                    download={`SS_Cafe_Table_${item.tableNumber}_QR.png`}
                    className="text-[11px] text-stone-600 hover:text-amber-600 font-bold flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>PNG</span>
                  </a>

                  {onPreviewCustomerView && (
                    <button
                      onClick={() => onPreviewCustomerView(String(item.tableNumber))}
                      className="text-[11px] text-amber-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Test Menu</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Settle Bill Modal */}
      {settlingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Punch Bill & Settle Order</h3>
                  <p className="text-xs text-stone-500">Table #{settlingOrder.tableNumber} • Total: ₹{settlingOrder.totalAmount}</p>
                </div>
              </div>
              <button
                onClick={() => setSettlingOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
                Select Customer Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlePaymentMode('Cash')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    settlePaymentMode === 'Cash'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  💵 Cash Payment
                </button>
                <button
                  type="button"
                  onClick={() => setSettlePaymentMode('Online')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    settlePaymentMode === 'Online'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  📱 Online / UPI / QR
                </button>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="font-bold text-stone-800">What happens next:</div>
              <div>• Sale is committed into Daily Sales & P&L.</div>
              <div>• Raw material stock is deducted automatically via recipe BOM.</div>
              <div>• Table is freed and ready for next customer.</div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSettlingOrder(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSettle(false)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Settle
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSettle(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                title="Settle bill aur Thermal Printer par slip print karein"
              >
                <Printer className="w-3.5 h-3.5 text-amber-200" />
                <span>🖨️ Settle & Print Bill</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🗣️ Meesho / Soundbox Voice Alert Settings Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-inner">
                  <Megaphone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Meesho Order Alert Settings</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border border-amber-400/20">
                      Voice + Chime
                    </span>
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    "Dine-in ka order aaya hai, check karein" soundbox alert
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Jab bhi customer table par QR code scan karke order punch karega, ye app Meesho/Soundbox jaisa <strong>upbeat tone bajayega</strong> aur clear <strong>Hindi voice me bol kar alert karega</strong>.
                </p>
              </div>

              {/* Master Alert Switch */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-stone-900">Master Sound Alert</p>
                  <p className="text-[11px] text-stone-500">Incoming order aane par sound bajana hai ya nahi</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateAlertSettings({ enabled: !alertSettings.enabled })}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    alertSettings.enabled ? 'bg-amber-600 justify-end' : 'bg-stone-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Spoken Voice Announcement Switch */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-stone-900">Hindi Voice Announcement</p>
                  <p className="text-[11px] text-stone-500">
                    Bolega: <em>"Dine-in ka order aaya hai, check karein"</em>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateAlertSettings({ voiceEnabled: !alertSettings.voiceEnabled })}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    alertSettings.voiceEnabled ? 'bg-amber-600 justify-end' : 'bg-stone-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Table Number in Voice Switch */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-stone-900">Announce Table Number</p>
                  <p className="text-[11px] text-stone-500">
                    Bol kar bataye: <em>"Table number 3 ka dine-in order..."</em>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateAlertSettings({ announceTable: !alertSettings.announceTable })}
                  className={`w-12 h-6.5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    alertSettings.announceTable ? 'bg-amber-600 justify-end' : 'bg-stone-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Tone Style Chooser */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-stone-800 block">Alert Tone Style</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateAlertSettings({ soundType: 'meesho' })}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      alertSettings.soundType === 'meesho'
                        ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-stone-900">🎵 Meesho Upbeat</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">High-energy merchant fanfare jingle</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateAlertSettings({ soundType: 'classic' })}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      alertSettings.soundType === 'classic'
                        ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-stone-900">🔔 Classic Cafe Bell</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Gentle 3-tone service chime</p>
                  </button>
                </div>
              </div>

              {/* Live Test Bar */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-xs font-bold text-stone-900 block">Live Sound & Voice Test</span>
                  <span className="text-[11px] text-stone-600 block">Apne device ke speakers par abhi suniye</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestAlert}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>🗣️ Test Alert Now</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
