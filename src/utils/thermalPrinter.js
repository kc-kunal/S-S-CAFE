/**
 * Thermal Bill & KOT Receipt Printing Engine
 * Supports 58mm (2-inch) and 80mm (3-inch) ESC/POS Thermal Printers
 * Supports Browser window.print, Invisible Iframe Print, and Plain Text Formatting
 */

/**
 * Normalize order data into a standard receipt payload
 */
export const normalizeReceiptData = (orderData, cafeProfile = {}) => {
  if (!orderData) return null;

  // Extract items array
  let rawItems = [];
  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    rawItems = orderData.items;
  } else if (orderData.itemName) {
    rawItems = [{
      name: orderData.itemName,
      qty: Number(orderData.quantitySold) || 1,
      price: Number(orderData.sellingPrice) || Number(orderData.totalRevenue) || 0,
      total: Number(orderData.totalRevenue) || 0
    }];
  }

  const items = rawItems.map((it, idx) => {
    const name = it.name || it.itemName || it.item?.name || `Item ${idx + 1}`;
    const qty = Number(it.qty || it.quantity || it.quantitySold || 1);
    const price = Number(it.price || it.sellingPrice || it.rate || it.item?.sellingPrice || 0);
    const total = Number(it.total || it.totalRevenue || (price * qty));
    const notes = it.notes || it.customization || '';
    return { name, qty, price, total, notes };
  });

  const subtotal = Number(orderData.subtotal || orderData.grossTotal || items.reduce((s, i) => s + (i.price * i.qty), 0));
  const discount = Number(orderData.discount || orderData.discountAmount || 0);
  const tax = Number(orderData.tax || orderData.taxAmount || 0);
  const packaging = Number(orderData.packaging || orderData.packagingCharge || 0);
  const totalAmount = Number(orderData.totalAmount || orderData.bill || orderData.totalRevenue || Math.max(0, subtotal - discount + tax + packaging));

  const billNo = orderData.tokenOrBillNo || orderData.token || orderData.platformOrderId || orderData.billNo || `#${Math.floor(1000 + Math.random() * 9000)}`;
  const tableNumber = orderData.tableNumber || orderData.table || (orderData.notes?.match(/table\s*#?(\d+)/i)?.[1]) || '';
  const orderType = orderData.orderType || (tableNumber ? 'Dine-In' : (orderData.channel || orderData.platform || 'Takeaway / Counter'));
  
  const paymentMethod = orderData.paymentMethod || orderData.channel || 'Cash';
  const cashTendered = Number(orderData.cashTendered || 0);
  const changeDue = Number(orderData.changeDue || (cashTendered > totalAmount ? cashTendered - totalAmount : 0));

  const date = orderData.date || new Date().toISOString().split('T')[0];
  const time = orderData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    billNo,
    tableNumber,
    orderType,
    date,
    time,
    customerName: orderData.customerName || orderData.customer || '',
    customerPhone: orderData.customerPhone || orderData.phone || '',
    items,
    subtotal,
    discount,
    tax,
    packaging,
    totalAmount,
    paymentMethod,
    cashTendered,
    changeDue,
    notes: orderData.notes || '',
    cafe: {
      cafeName: cafeProfile.cafeName || 'S&S Cafe',
      ownerName: cafeProfile.ownerName || '',
      phone: cafeProfile.phone || '',
      city: cafeProfile.city || '',
      address: cafeProfile.address || '',
      fssai: cafeProfile.fssai || '',
      gstin: cafeProfile.gstin || '',
      upiId: cafeProfile.upiId || '',
      footerNote: cafeProfile.billFooterNote || 'Thank you! Please visit again.'
    }
  };
};

/**
 * Generate UPI QR Code URL for direct scan & pay on receipt
 */
export const getUpiPaymentQrUrl = (upiId, cafeName, amount, billNo) => {
  if (!upiId) return '';
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent((cafeName || 'Cafe').trim());
  const cleanNote = encodeURIComponent(`Bill ${billNo}`);
  const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amount}&cu=INR&tn=${cleanNote}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(upiUri)}`;
};

/**
 * Generate Complete HTML for 58mm / 80mm Thermal Paper Receipt
 */
export const generateThermalReceiptHtml = (data, options = {}) => {
  const {
    paperWidth = '58mm', // '58mm' or '80mm'
    isKot = false, // Kitchen Order Ticket mode
    showUpiQr = true,
    showGst = true
  } = options;

  if (!data) return '';

  const is58mm = paperWidth === '58mm';
  const widthPx = is58mm ? '210px' : '300px';
  const fontSize = is58mm ? '11px' : '13px';
  const titleSize = is58mm ? '15px' : '18px';
  const subTitleSize = is58mm ? '10px' : '12px';

  const upiQrUrl = (!isKot && showUpiQr && data.cafe.upiId && data.totalAmount > 0)
    ? getUpiPaymentQrUrl(data.cafe.upiId, data.cafe.cafeName, data.totalAmount, data.billNo)
    : '';

  if (isKot) {
    // ==========================================
    // 🍳 KITCHEN ORDER TICKET (KOT) LAYOUT
    // ==========================================
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>KOT - ${data.billNo}</title>
  <style>
    @page {
      margin: 0;
      size: ${paperWidth} auto;
    }
    body {
      margin: 0;
      padding: 6px 8px 18px 8px;
      font-family: 'Courier New', Courier, monospace, system-ui;
      font-size: ${fontSize};
      color: #000;
      background: #fff;
      width: ${widthPx};
      line-height: 1.25;
      text-transform: uppercase;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 900; }
    .header-title { font-size: ${titleSize}; letter-spacing: 0.5px; margin: 0; }
    .tag { font-size: ${subTitleSize}; margin-top: 2px; }
    .dashed { border-top: 1.5px dashed #000; margin: 6px 0; }
    .double { border-top: 2px solid #000; margin: 6px 0; }
    .meta-row { display: flex; justify-content: space-between; font-size: ${subTitleSize}; margin: 2px 0; }
    .big-token { font-size: 18px; font-weight: 900; text-align: center; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { border-bottom: 1px dashed #000; font-size: ${subTitleSize}; padding: 3px 0; }
    td { padding: 4px 0; font-size: ${fontSize}; vertical-align: top; }
    .qty-cell { font-size: 14px; font-weight: 900; width: 42px; text-align: center; }
    .note-row { font-size: 10px; font-style: italic; color: #222; padding-left: 4px; }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="header-title bold">*** K.O.T ***</div>
    <div class="tag bold">KITCHEN ORDER TICKET</div>
  </div>

  <div class="dashed"></div>

  <div class="big-token">
    ${data.tableNumber ? `TABLE #${data.tableNumber}` : data.billNo}
  </div>

  <div class="meta-row">
    <span>TYPE: <span class="bold">${data.orderType}</span></span>
    <span>TOKEN: <span class="bold">${data.billNo}</span></span>
  </div>
  <div class="meta-row">
    <span>DATE: ${data.date}</span>
    <span>TIME: ${data.time}</span>
  </div>

  ${data.notes ? `<div class="dashed"></div><div class="bold" style="font-size: 11px;">NOTE: ${data.notes}</div>` : ''}

  <div class="double"></div>

  <table>
    <thead>
      <tr>
        <th class="qty-cell">QTY</th>
        <th style="text-align: left;">ITEM NAME</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(it => `
        <tr>
          <td class="qty-cell bold">[${it.qty}]</td>
          <td class="bold">
            ${it.name}
            ${it.notes ? `<div class="note-row">* ${it.notes}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="dashed"></div>
  <div class="meta-row bold">
    <span>TOTAL ITEMS:</span>
    <span>${data.items.reduce((s, i) => s + i.qty, 0)} QTY</span>
  </div>
  <div class="double"></div>
  <div class="text-center tag bold" style="margin-top: 8px;">
    -- KITCHEN COPY --
  </div>
</body>
</html>
    `;
  }

  // ==========================================
  // 🧾 CUSTOMER BILL / TAX INVOICE LAYOUT
  // ==========================================
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill - ${data.billNo}</title>
  <style>
    @page {
      margin: 0;
      size: ${paperWidth} auto;
    }
    body {
      margin: 0;
      padding: 6px 8px 18px 8px;
      font-family: 'Courier New', Courier, monospace, system-ui;
      font-size: ${fontSize};
      color: #000;
      background: #fff;
      width: ${widthPx};
      line-height: 1.25;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: 800; }
    .cafe-name { font-size: ${titleSize}; font-weight: 900; letter-spacing: 0.5px; margin: 0; }
    .cafe-sub { font-size: ${subTitleSize}; margin: 1px 0; }
    .dashed { border-top: 1px dashed #000; margin: 5px 0; }
    .double { border-top: 1.5px solid #000; margin: 5px 0; }
    .meta-row { display: flex; justify-content: space-between; font-size: ${subTitleSize}; margin: 1.5px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 3px; }
    th { border-bottom: 1px dashed #000; font-size: ${subTitleSize}; padding: 3px 0; font-weight: 800; }
    td { padding: 3px 0; font-size: ${fontSize}; vertical-align: top; }
    .grand-total { font-size: 15px; font-weight: 900; margin: 4px 0; }
    .qr-container { text-align: center; margin: 8px 0; }
    .qr-container img { width: 100px; height: 100px; display: inline-block; }
    .footer-note { font-size: ${subTitleSize}; text-align: center; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="text-center">
    <h1 class="cafe-name bold">${data.cafe.cafeName}</h1>
    ${data.cafe.address ? `<div class="cafe-sub">${data.cafe.address}</div>` : ''}
    ${data.cafe.city ? `<div class="cafe-sub">${data.cafe.city}</div>` : ''}
    ${data.cafe.phone ? `<div class="cafe-sub">Ph: ${data.cafe.phone}</div>` : ''}
    ${showGst && data.cafe.gstin ? `<div class="cafe-sub">GSTIN: ${data.cafe.gstin}</div>` : ''}
    ${data.cafe.fssai ? `<div class="cafe-sub">FSSAI: ${data.cafe.fssai}</div>` : ''}
  </div>

  <div class="dashed"></div>

  <div class="meta-row">
    <span>Bill/Token: <strong class="bold">${data.billNo}</strong></span>
    <span>${data.orderType}${data.tableNumber ? ` (T-${data.tableNumber})` : ''}</span>
  </div>
  <div class="meta-row">
    <span>Date: ${data.date}</span>
    <span>Time: ${data.time}</span>
  </div>
  ${data.customerPhone ? `
    <div class="meta-row">
      <span>Customer: ${data.customerName || 'Guest'}</span>
      <span>Ph: ${data.customerPhone}</span>
    </div>
  ` : ''}

  <div class="dashed"></div>

  <table>
    <thead>
      <tr>
        <th class="text-left" style="width: 50%;">ITEM</th>
        <th class="text-right" style="width: 15%;">QTY</th>
        <th class="text-right" style="width: 15%;">RATE</th>
        <th class="text-right" style="width: 20%;">AMT</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(it => `
        <tr>
          <td class="text-left bold">
            ${it.name}
            ${it.notes ? `<div style="font-size: 9px; font-weight: normal;">* ${it.notes}</div>` : ''}
          </td>
          <td class="text-right bold">${it.qty}</td>
          <td class="text-right">${it.price}</td>
          <td class="text-right bold">${it.total}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="dashed"></div>

  <div class="meta-row">
    <span>Item Subtotal:</span>
    <span class="bold">₹${data.subtotal.toFixed(2)}</span>
  </div>

  ${data.discount > 0 ? `
    <div class="meta-row" style="color: #000;">
      <span>Discount:</span>
      <span class="bold">-₹${data.discount.toFixed(2)}</span>
    </div>
  ` : ''}

  ${data.packaging > 0 ? `
    <div class="meta-row">
      <span>Packaging Chg:</span>
      <span class="bold">+₹${data.packaging.toFixed(2)}</span>
    </div>
  ` : ''}

  ${data.tax > 0 ? `
    <div class="meta-row">
      <span>GST / Taxes:</span>
      <span class="bold">+₹${data.tax.toFixed(2)}</span>
    </div>
  ` : ''}

  <div class="double"></div>

  <div class="meta-row grand-total">
    <span>NET TOTAL:</span>
    <span>₹${data.totalAmount.toFixed(2)}</span>
  </div>

  <div class="double"></div>

  <div class="meta-row">
    <span>Payment Mode:</span>
    <span class="bold">${data.paymentMethod}</span>
  </div>

  ${data.cashTendered > 0 ? `
    <div class="meta-row">
      <span>Cash Tendered:</span>
      <span>₹${data.cashTendered}</span>
    </div>
    <div class="meta-row">
      <span>Change Return:</span>
      <span class="bold">₹${data.changeDue}</span>
    </div>
  ` : ''}

  ${upiQrUrl ? `
    <div class="dashed"></div>
    <div class="qr-container">
      <div style="font-size: 10px; font-weight: bold; margin-bottom: 2px;">SCAN TO PAY VIA UPI (₹${data.totalAmount})</div>
      <img src="${upiQrUrl}" alt="UPI QR" />
      <div style="font-size: 9px; margin-top: 2px;">${data.cafe.upiId}</div>
    </div>
  ` : ''}

  <div class="dashed"></div>

  <div class="footer-note">
    <div class="bold">${data.cafe.footerNote}</div>
    <div style="font-size: 9px; margin-top: 3px; color: #444;">Software: S&S Cafe Enterprise POS</div>
  </div>
</body>
</html>
  `;
};

/**
 * 🖨️ Direct Silent Iframe Printer
 * Triggers native thermal printer dialog without disrupting the UI
 */
export const printThermalReceiptDirectly = (orderData, cafeProfile = {}, options = {}) => {
  return new Promise((resolve) => {
    try {
      const data = normalizeReceiptData(orderData, cafeProfile);
      if (!data) {
        resolve(false);
        return;
      }

      const html = generateThermalReceiptHtml(data, options);

      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow.focus();

      // Small delay to allow CSS & QR images to render
      setTimeout(() => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          console.error('Print trigger error:', e);
        }

        // Clean up iframe after print
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch (e) {}
          resolve(true);
        }, 1000);
      }, 350);

    } catch (err) {
      console.error('Failed to trigger print:', err);
      resolve(false);
    }
  });
};

/**
 * Generate plain-text formatted receipt (for WhatsApp / SMS / ClipBoard)
 */
export const generatePlainTextReceipt = (orderData, cafeProfile = {}) => {
  const data = normalizeReceiptData(orderData, cafeProfile);
  if (!data) return '';

  const sep = '--------------------------------';
  const lines = [
    `*${data.cafe.cafeName.toUpperCase()}*`,
    data.cafe.phone ? `Ph: ${data.cafe.phone}` : '',
    data.cafe.city ? `${data.cafe.city}` : '',
    sep,
    `Bill: *${data.billNo}* | ${data.orderType}`,
    `Date: ${data.date} ${data.time}`,
    sep,
    ...data.items.map(it => `${it.qty}x ${it.name} = ₹${it.total}`),
    sep,
    `Subtotal: ₹${data.subtotal}`,
    data.discount > 0 ? `Discount: -₹${data.discount}` : '',
    data.tax > 0 ? `Tax: +₹${data.tax}` : '',
    sep,
    `*NET TOTAL: ₹${data.totalAmount}*`,
    `Payment: ${data.paymentMethod}`,
    sep,
    data.cafe.footerNote,
    `Powered by S&S Cafe POS`
  ].filter(Boolean);

  return lines.join('\n');
};
