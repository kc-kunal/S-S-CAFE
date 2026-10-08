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
  Phone
} from 'lucide-react';
import { playOrderChime } from '../utils/audioAlert';
import { generateCustomerEBillLink } from '../utils/whatsappAlert';

export default function DiningManager({
  diningOrders = [],
  currentCafe,
  onUpdateOrderStatus,
  onSettleOrderToSales,
  onDeleteOrder,
  onPreviewCustomerView
}) {
  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' or 'qrcodes'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'pending', 'preparing', 'served', 'billed', 'all'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // QR Code generator settings
  const [tableCount, setTableCount] = useState(8);
  const [qrBaseUrl, setQrBaseUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://ss-cafe.netlify.app'
  );
  const [generatedQrs, setGeneratedQrs] = useState([]); // [{ tableNumber, dataUrl, url }]
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Settlement dialog state
  const [settlingOrder, setSettlingOrder] = useState(null);
  const [settlePaymentMode, setSettlePaymentMode] = useState('Cash'); // 'Cash' or 'Online'
  const [settleCustomerPhone, setSettleCustomerPhone] = useState('');

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

  // Active orders count for badge
  const pendingCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'pending').length;
  }, [diningOrders]);

  const activeTotalCount = useMemo(() => {
    return diningOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'served').length;
  }, [diningOrders]);

  // Settle order into POS Sales
  const handleConfirmSettle = (sendWhatsApp = false) => {
    if (!settlingOrder) return;
    if (onSettleOrderToSales) {
      onSettleOrderToSales(settlingOrder, settlePaymentMode);
    }

    if (sendWhatsApp) {
      let phone = settleCustomerPhone.trim() || settlingOrder.customerPhone || '';
      if (!phone) {
        phone = window.prompt('Customer ka 10-digit WhatsApp number darj karein:', '');
      }
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const url = generateCustomerEBillLink({
          cafeName: currentCafe?.cafeName || 'S&S Cafe',
          cafeCity: currentCafe?.city || '',
          cafePhone: currentCafe?.phone || '',
          tokenOrBillNo: `Table #${settlingOrder.tableNumber}`,
          date: settlingOrder.date,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items: settlingOrder.items || [],
          subtotal: settlingOrder.totalAmount,
          discount: 0,
          totalAmount: settlingOrder.totalAmount,
          paymentMethod: settlePaymentMode,
          customerPhone: cleanPhone,
          customerName: settlingOrder.customerName || ''
        });
        window.open(url, '_blank');
      }
    }

    setSettlingOrder(null);
    setSettleCustomerPhone('');
  };

  // Print all QR cards
  const handlePrintQrCards = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Header & Sub-Navigation */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                <span>Dine-In QR Ordering & Kitchen Screen</span>
                {pendingCount > 0 && (
                  <span className="text-xs bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} New
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500">
                Customers scan table QR code to order directly • Instant counter & Telegram alerts
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Sound Alert Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playOrderChime();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title="Toggle Kitchen Bell Sound for Incoming Orders"
          >
            {soundEnabled ? <Bell className="w-4 h-4 text-amber-600" /> : <BellOff className="w-4 h-4 text-stone-400" />}
            <span>{soundEnabled ? 'Bell Alert: ON' : 'Bell: Muted'}</span>
          </button>

          {/* Test Chime Button */}
          <button
            onClick={playOrderChime}
            className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Test Audio Chime Sound"
          >
            🔔 Test Sound
          </button>

          {/* Customer View Preview Button */}
          {onPreviewCustomerView && (
            <button
              onClick={() => onPreviewCustomerView('1')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-bold rounded-xl border border-stone-800 transition-all cursor-pointer shadow-sm"
              title="Preview Customer Mobile Menu for Table 1"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Preview Customer View</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center justify-between bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Live Table Orders</span>
            {activeTotalCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                pendingCount > 0 ? 'bg-red-500 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {activeTotalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('qrcodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'qrcodes'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Table QR Codes & Print Stands</span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: LIVE TABLE ORDERS (KITCHEN & COUNTER DISPLAY) */}
      {/* ========================================================================= */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Status Filter Bar */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'active', label: 'Active Orders', count: activeTotalCount },
              { id: 'pending', label: 'Pending (New)', count: pendingCount },
              { id: 'preparing', label: 'In Kitchen', count: diningOrders.filter(o => o.status === 'preparing').length },
              { id: 'served', label: 'Served', count: diningOrders.filter(o => o.status === 'served').length },
              { id: 'billed', label: 'Billed / Completed', count: diningOrders.filter(o => o.status === 'billed').length },
              { id: 'all', label: 'All Orders', count: diningOrders.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  statusFilter === tab.id ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <Utensils className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-stone-900">No Orders in this Status</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When customers scan the table QR code and tap "Place Order", new orders will appear here automatically with bell chime sound!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                const isPending = order.status === 'pending';
                const isPreparing = order.status === 'preparing';
                const isServed = order.status === 'served';
                const isBilled = order.status === 'billed';

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden ${
                      isPending 
                        ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-amber-500/10'
                        : isPreparing
                          ? 'border-blue-300'
                          : isServed
                            ? 'border-purple-300'
                            : 'border-stone-200 opacity-75'
                    }`}
                  >
                    {/* Top Order Badge & Table */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100">
                        <div className="flex items-center space-x-2">
                          <span className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-600/20">
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
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : isPreparing
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : isServed
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isPending ? '🟡 New Order' : isPreparing ? '🔵 In Kitchen' : isServed ? '🟣 Served' : '🟢 Billed & Paid'}
                          </span>
                        </div>
                      </div>

                      {/* Customer Note if any */}
                      {order.customerNotes && (
                        <div className="my-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                          <strong className="text-[10px] uppercase font-bold text-amber-800 block">Customer Request:</strong>
                          "{order.customerNotes}"
                        </div>
                      )}

                      {/* Items Ordered List */}
                      <div className="py-3 space-y-2 border-b border-stone-100 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-stone-800">
                            <span className="font-semibold">
                              <span className="inline-block w-5 text-amber-700 font-extrabold">{item.quantity}x</span>
                              {item.name}
                            </span>
                            <span className="font-bold text-stone-700">₹{item.total || (item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total Amount */}
                      <div className="flex items-center justify-between py-2 text-xs">
                        <span className="font-bold text-stone-500">Total Bill Amount:</span>
                        <span className="text-base font-black text-amber-700">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-stone-100 space-y-2">
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Prepare (Kitchen)</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => onUpdateOrderStatus(order.id, 'served')}
                            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Mark Served</span>
                          </button>
                        )}

                        {!isBilled && (
                          <button
                            onClick={() => setSettlingOrder(order)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Punch Bill (₹{order.totalAmount})</span>
                          </button>
                        )}

                        {isBilled && (
                          <div className="w-full text-center py-1.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Billed & Deducted from Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Cancel / Delete Button */}
                      {!isBilled && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (confirm(`Table #${order.tableNumber} ka ye order cancel/delete karna chahte hain?`)) {
                                onDeleteOrder(order.id);
                              }
                            }}
                            className="text-[11px] text-stone-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancel Order</span>
                          </button>
                        </div>
                      )}
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
        <div className="space-y-6">
          
          {/* Settings Bar */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">Number of Tables</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tableCount}
                    onChange={(e) => setTableCount(e.target.value)}
                    className="w-20 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 text-center focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs text-stone-500 font-semibold">tables in cafe</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1">Cafe Website / Host URL</label>
                <input
                  type="text"
                  value={qrBaseUrl}
                  onChange={(e) => setQrBaseUrl(e.target.value)}
                  placeholder="https://yourcafe.com"
                  className="w-64 bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={handlePrintQrCards}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 border border-amber-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table QR Stand Cards</span>
              </button>
            </div>

          </div>

          {/* QR Cards Grid (Formatted for both screen preview & high-quality printing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-2 print:gap-6" id="printable-qr-grid">
            {generatedQrs.map((item) => (
              <div
                key={item.tableNumber}
                className="bg-white rounded-3xl p-5 border-2 border-stone-300 shadow-md text-center flex flex-col items-center justify-between space-y-3 relative group hover:border-amber-500 transition-all print:border-2 print:border-black print:shadow-none print:break-inside-avoid"
              >
                {/* Header */}
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <img src="/logo.jpg" alt="Logo" className="w-6 h-6 rounded-full" onError={(e) => e.target.style.display = 'none'} />
                    <span className="font-serif-title font-bold text-sm tracking-tight text-stone-900">S&S Cafe</span>
                  </div>
                  <div className="inline-block bg-stone-900 text-amber-300 text-xs font-black uppercase px-3 py-1 rounded-full shadow-sm">
                    TABLE #{item.tableNumber}
                  </div>
                </div>

                {/* QR Code Image */}
                <div className="w-44 h-44 bg-white p-2 rounded-2xl border border-stone-200 flex items-center justify-center shadow-inner">
                  {item.dataUrl && (
                    <img 
                      src={item.dataUrl} 
                      alt={`Table ${item.tableNumber} QR`} 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Instructions */}
                <div className="w-full space-y-1">
                  <div className="text-[11px] font-extrabold text-stone-900 flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Scan with Mobile Camera</span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    View Digital Menu & Place Dine-In Order
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
                    <span>Download PNG</span>
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

            {/* Optional Customer WhatsApp Phone */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Customer WhatsApp No. (E-Bill ke liye)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-stone-400">+91</span>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="10-digit mobile number"
                  value={settleCustomerPhone}
                  onChange={(e) => setSettleCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-xs font-bold text-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="font-bold text-stone-800">What happens next:</div>
              <div>• Sale is committed into Daily Sales & P&L.</div>
              <div>• Raw material stock is deducted automatically via recipe BOM.</div>
              <div>• Order is marked as completed & receipt sent on WhatsApp.</div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSettlingOrder(null);
                  setSettleCustomerPhone('');
                }}
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
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                title="Settle bill aur Customer ke WhatsApp par E-Bill bhejein"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                <span>📱 Settle & WhatsApp Bill</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
