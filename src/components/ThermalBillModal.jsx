import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Utensils,
  Check,
  Copy,
  QrCode,
  Share2,
  Phone,
  Settings,
  Sparkles,
  Download
} from 'lucide-react';
import {
  normalizeReceiptData,
  printThermalReceiptDirectly,
  generatePlainTextReceipt,
  getUpiPaymentQrUrl
} from '../utils/thermalPrinter';

export default function ThermalBillModal({
  isOpen,
  onClose,
  orderData,
  cafeProfile,
  initialMode = 'bill', // 'bill' or 'kot'
  showToast
}) {
  const [paperWidth, setPaperWidth] = useState('58mm'); // '58mm' or '80mm'
  const [slipType, setSlipType] = useState(initialMode); // 'bill' or 'kot'
  const [showUpiQr, setShowUpiQr] = useState(true);
  const [showGst, setShowGst] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (initialMode) setSlipType(initialMode);
  }, [initialMode, orderData]);

  if (!isOpen || !orderData) return null;

  const data = normalizeReceiptData(orderData, cafeProfile || {});
  if (!data) return null;

  const upiQrUrl = (slipType === 'bill' && showUpiQr && data.cafe.upiId && data.totalAmount > 0)
    ? getUpiPaymentQrUrl(data.cafe.upiId, data.cafe.cafeName, data.totalAmount, data.billNo)
    : '';

  const handlePrint = async (customKot = null) => {
    setIsPrinting(true);
    const isKotMode = customKot !== null ? customKot : (slipType === 'kot');
    
    await printThermalReceiptDirectly(data, cafeProfile, {
      paperWidth,
      isKot: isKotMode,
      showUpiQr,
      showGst
    });

    setIsPrinting(false);
    if (showToast) {
      showToast(isKotMode ? '🍳 Kitchen Order Ticket (KOT) sent to printer!' : '🖨️ Customer Bill sent to thermal printer!');
    }
  };

  const handleCopyText = () => {
    const text = generatePlainTextReceipt(data, cafeProfile);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (showToast) showToast('📋 Receipt text copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Thermal Bill & KOT Print Station</span>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full uppercase">
                  58mm / 80mm
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                Token: <strong className="text-amber-300">{data.billNo}</strong> • Amount: <strong className="text-emerald-400">₹{data.totalAmount}</strong> • {data.orderType}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="bg-stone-100 p-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {/* Slip Mode Toggle: Bill vs KOT */}
          <div className="flex items-center bg-white border border-stone-300 p-0.5 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setSlipType('bill')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                slipType === 'bill'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Customer Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setSlipType('kot')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                slipType === 'kot'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Kitchen KOT</span>
            </button>
          </div>

          {/* Paper Width Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-500 uppercase text-[10px]">Paper:</span>
            <div className="flex items-center bg-white border border-stone-300 p-0.5 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                  paperWidth === '58mm'
                    ? 'bg-stone-900 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="58mm / 2-inch standard portable roll"
              >
                58mm (2")
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                  paperWidth === '80mm'
                    ? 'bg-stone-900 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="80mm / 3-inch wide desktop POS roll"
              >
                80mm (3")
              </button>
            </div>
          </div>

          {/* Optional Toggles */}
          {slipType === 'bill' && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer text-[11px] font-semibold">
                <input
                  type="checkbox"
                  checked={showUpiQr}
                  onChange={(e) => setShowUpiQr(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>UPI QR</span>
              </label>
              <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer text-[11px] font-semibold">
                <input
                  type="checkbox"
                  checked={showGst}
                  onChange={(e) => setShowGst(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>GST/FSSAI</span>
              </label>
            </div>
          )}
        </div>

        {/* Live Thermal Paper Slip Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-200/80 flex items-center justify-center">
          
          <div
            className={`bg-white text-black p-4 sm:p-5 shadow-2xl border border-stone-300 transition-all font-mono leading-tight ${
              paperWidth === '58mm' ? 'w-[260px] text-[11px]' : 'w-[340px] text-[12px]'
            }`}
            style={{
              filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))',
              backgroundImage: 'radial-gradient(ellipse at top left, #fff, #fafafa)'
            }}
          >
            {slipType === 'kot' ? (
              /* KITCHEN KOT PREVIEW */
              <div className="space-y-2 uppercase">
                <div className="text-center">
                  <div className="text-base font-black tracking-wider">*** K.O.T ***</div>
                  <div className="text-[10px] font-bold mt-0.5">KITCHEN ORDER TICKET</div>
                </div>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="text-center font-black text-lg">
                  {data.tableNumber ? `TABLE #${data.tableNumber}` : data.billNo}
                </div>

                <div className="flex justify-between text-[10px]">
                  <span>TYPE: <strong className="font-black">{data.orderType}</strong></span>
                  <span>TOKEN: <strong className="font-black">{data.billNo}</strong></span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>DATE: {data.date}</span>
                  <span>TIME: {data.time}</span>
                </div>

                {data.notes && (
                  <>
                    <div className="border-t border-dashed border-black my-1"></div>
                    <div className="font-bold text-[10px]">NOTE: {data.notes}</div>
                  </>
                )}

                <div className="border-t-2 border-black my-1.5"></div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-dashed border-black text-[10px]">
                      <th className="py-1 w-12 text-center">QTY</th>
                      <th className="py-1">ITEM NAME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-stone-300">
                    {data.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 text-center font-black text-sm">[{it.qty}]</td>
                        <td className="py-1 font-black">
                          {it.name}
                          {it.notes && <div className="text-[9px] font-normal normal-case italic">* {it.notes}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1.5"></div>
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL ITEMS:</span>
                  <span>{data.items.reduce((s, i) => s + i.qty, 0)} QTY</span>
                </div>
                <div className="border-t-2 border-black my-1.5"></div>
                <div className="text-center text-[10px] font-bold">
                  -- KITCHEN COPY --
                </div>
              </div>
            ) : (
              /* CUSTOMER BILL PREVIEW */
              <div className="space-y-1.5">
                <div className="text-center">
                  <h4 className="text-sm sm:text-base font-black tracking-wide leading-tight">
                    {data.cafe.cafeName.toUpperCase()}
                  </h4>
                  {data.cafe.address && <div className="text-[10px] text-stone-600">{data.cafe.address}</div>}
                  {data.cafe.city && <div className="text-[10px] text-stone-600">{data.cafe.city}</div>}
                  {data.cafe.phone && <div className="text-[10px] text-stone-600">Ph: {data.cafe.phone}</div>}
                  {showGst && data.cafe.gstin && <div className="text-[9px] text-stone-600">GSTIN: {data.cafe.gstin}</div>}
                  {data.cafe.fssai && <div className="text-[9px] text-stone-600">FSSAI: {data.cafe.fssai}</div>}
                </div>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="flex justify-between text-[10px]">
                  <span>Bill/Token: <strong className="font-black">{data.billNo}</strong></span>
                  <span>{data.orderType}{data.tableNumber ? ` (T-${data.tableNumber})` : ''}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Date: {data.date}</span>
                  <span>Time: {data.time}</span>
                </div>
                {data.customerPhone && (
                  <div className="flex justify-between text-[10px]">
                    <span>Guest: {data.customerName || 'Customer'}</span>
                    <span>Ph: {data.customerPhone}</span>
                  </div>
                )}

                <div className="border-t border-dashed border-black my-1.5"></div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-dashed border-black text-[10px]">
                      <th className="py-1 text-left">ITEM</th>
                      <th className="py-1 text-right">QTY</th>
                      <th className="py-1 text-right">RATE</th>
                      <th className="py-1 text-right">AMT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1 font-bold text-left">
                          {it.name}
                          {it.notes && <div className="text-[9px] font-normal italic">* {it.notes}</div>}
                        </td>
                        <td className="py-1 text-right font-bold">{it.qty}</td>
                        <td className="py-1 text-right">{it.price}</td>
                        <td className="py-1 text-right font-black">₹{it.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="flex justify-between text-[11px]">
                  <span>Item Subtotal:</span>
                  <span className="font-bold">₹{data.subtotal.toFixed(2)}</span>
                </div>

                {data.discount > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>Discount:</span>
                    <span className="font-bold">-₹{data.discount.toFixed(2)}</span>
                  </div>
                )}

                {data.packaging > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>Packaging Charge:</span>
                    <span className="font-bold">+₹{data.packaging.toFixed(2)}</span>
                  </div>
                )}

                {data.tax > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span>GST / Taxes:</span>
                    <span className="font-bold">+₹{data.tax.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="flex justify-between text-sm sm:text-base font-black">
                  <span>NET TOTAL:</span>
                  <span>₹{data.totalAmount.toFixed(2)}</span>
                </div>

                <div className="border-t-2 border-black my-1.5"></div>

                <div className="flex justify-between text-[10px]">
                  <span>Payment Mode:</span>
                  <span className="font-black">{data.paymentMethod}</span>
                </div>

                {data.cashTendered > 0 && (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>Cash Received:</span>
                      <span>₹{data.cashTendered}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Change Return:</span>
                      <span className="font-black">₹{data.changeDue}</span>
                    </div>
                  </>
                )}

                {upiQrUrl && (
                  <div className="text-center pt-2">
                    <div className="border-t border-dashed border-black my-1.5"></div>
                    <div className="text-[9px] font-bold mb-1">SCAN QR TO PAY (₹{data.totalAmount})</div>
                    <img src={upiQrUrl} alt="UPI QR" className="w-24 h-24 mx-auto border border-stone-200" />
                    <div className="text-[8px] text-stone-500 mt-1">{data.cafe.upiId}</div>
                  </div>
                )}

                <div className="border-t border-dashed border-black my-2"></div>

                <div className="text-center text-[10px] space-y-0.5">
                  <div className="font-bold">{data.cafe.footerNote}</div>
                  <div className="text-[8px] text-stone-500">Software: S&S Cafe Enterprise POS</div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              title="Copy Receipt Text"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
            </button>

            {slipType === 'bill' && (
              <button
                type="button"
                onClick={() => handlePrint(true)}
                className="hidden xs:flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                title="Kitchen Order Ticket (KOT) print karein"
              >
                <Utensils className="w-4 h-4 text-orange-600" />
                <span>Print KOT</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => handlePrint()}
              disabled={isPrinting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black rounded-xl shadow-lg shadow-orange-600/30 cursor-pointer transition-all transform active:scale-98 disabled:opacity-50"
            >
              {isPrinting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>{isPrinting ? 'Printing...' : `Print ${slipType === 'kot' ? 'KOT' : 'Bill'} Now (🖨️)`}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
