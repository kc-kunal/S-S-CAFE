import * as XLSX from 'xlsx';

/**
 * Filter data by timeframe
 * @param {Array} list - List of items with a 'date' property (YYYY-MM-DD)
 * @param {string} timeframe - 'weekly', 'monthly', 'last_month', 'custom', 'all'
 * @param {string} customStartDate - YYYY-MM-DD
 * @param {string} customEndDate - YYYY-MM-DD
 */
export function filterRecordsByTimeframe(list = [], timeframe = 'monthly', customStartDate = '', customEndDate = '') {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!Array.isArray(list)) return [];

  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const minDateStr = sevenDaysAgo.toISOString().split('T')[0];
    return list.filter(item => (item.date || '') >= minDateStr && (item.date || '') <= todayStr);
  }

  if (timeframe === 'monthly') {
    const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM
    return list.filter(item => (item.date || '').startsWith(currentYearMonth));
  }

  if (timeframe === 'last_month') {
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = prevMonthDate.toISOString().slice(0, 7);
    return list.filter(item => (item.date || '').startsWith(prevYearMonth));
  }

  if (timeframe === 'custom') {
    return list.filter(item => {
      const d = item.date || '';
      if (!d) return false;
      const afterStart = customStartDate ? d >= customStartDate : true;
      const beforeEnd = customEndDate ? d <= customEndDate : true;
      return afterStart && beforeEnd;
    });
  }

  // 'all' or default
  return list;
}

/**
 * Get human-readable timeframe label
 */
export function getTimeframeLabel(timeframe, customStartDate, customEndDate) {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (timeframe === 'weekly') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return `Weekly (${sevenDaysAgo.toLocaleDateString()} to ${now.toLocaleDateString()})`;
  }
  if (timeframe === 'monthly') {
    return `Monthly (${monthNames[now.getMonth()]} ${now.getFullYear()})`;
  }
  if (timeframe === 'last_month') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `Last Month (${monthNames[prev.getMonth()]} ${prev.getFullYear()})`;
  }
  if (timeframe === 'custom') {
    return `Custom Period (${customStartDate || 'Start'} to ${customEndDate || 'End'})`;
  }
  return 'All-Time Complete History';
}

/**
 * Format numeric value rounded to 2 decimal places
 */
const fmt = (num) => Math.round((Number(num) || 0) * 100) / 100;

/**
 * Helper to calculate percentage safely
 */
const fmtPct = (part, total) => {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t === 0) return '0.0%';
  return ((p / t) * 100).toFixed(1) + '%';
};

/**
 * Auto-calculate column widths dynamically so no text is truncated or shows ###
 */
function setAutoColumnWidths(ws, rows, minWidth = 12) {
  const colWidths = [];
  rows.forEach(row => {
    if (!Array.isArray(row)) return;
    row.forEach((val, colIdx) => {
      const len = val !== null && val !== undefined ? String(val).length : 0;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || minWidth, len + 3);
    });
  });
  ws['!cols'] = colWidths.map(w => ({ wch: Math.min(Math.max(w, minWidth), 50) }));
}

/**
 * Main Excel Export Function
 */
export function exportCafeDataToExcel({
  timeframe = 'monthly',
  customStartDate = '',
  customEndDate = '',
  reportType = 'all', // 'all', 'sales', 'procurement', 'expenses', 'inventory', 'pnl'
  salesLogs = [],
  procurementLogs = [],
  expenses = [],
  wastageLogs = [],
  inventoryItems = [],
  menuItems = []
}) {
  const wb = XLSX.utils.book_new();
  const label = getTimeframeLabel(timeframe, customStartDate, customEndDate);
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0];
  const generatedTimestamp = `${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

  // Filter datasets according to timeframe
  const filteredSales = filterRecordsByTimeframe(salesLogs, timeframe, customStartDate, customEndDate);
  const filteredProcurement = filterRecordsByTimeframe(procurementLogs, timeframe, customStartDate, customEndDate);
  const filteredExpenses = filterRecordsByTimeframe(expenses, timeframe, customStartDate, customEndDate);
  const filteredWastage = filterRecordsByTimeframe(wastageLogs, timeframe, customStartDate, customEndDate);

  // -------------------------------------------------------------
  // 1. FINANCIAL P&L STATEMENT SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'pnl') {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);
    const cashRevenue = filteredSales.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? 0 : Number(s.totalRevenue || 0)), 0);
    const onlineRevenue = filteredSales.reduce((sum, s) => sum + (s.paymentMethod === 'Online' ? Number(s.totalRevenue || 0) : 0), 0);
    const totalUnitsSold = filteredSales.reduce((sum, s) => sum + (Number(s.quantitySold) || 0), 0);

    // COGS based on recipe/cost price
    const cogsTotal = filteredSales.reduce((sum, s) => {
      const matched = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const cp = matched && matched.costPrice !== undefined ? Number(matched.costPrice) : (Number(s.costPrice) || 0);
      return sum + (cp * (Number(s.quantitySold) || 1));
    }, 0);

    const grossProfit = totalRevenue - cogsTotal;
    const grossMarginPct = fmtPct(grossProfit, totalRevenue);

    // Overhead expenses breakdown
    const totalOverhead = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const expenseCategoryMap = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Other Overheads';
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + (Number(e.amount) || 0);
    });

    const totalWastageLoss = filteredWastage.reduce((sum, w) => sum + (Number(w.costValue) || 0), 0);
    const totalProcurementSpent = filteredProcurement.reduce((sum, p) => sum + (Number(p.totalCost) || 0), 0);

    // Asli Bachat (Net Profit)
    const trueNetProfit = totalRevenue - cogsTotal - totalOverhead - totalWastageLoss;
    const trueNetMarginPct = fmtPct(trueNetProfit, totalRevenue);

    const stockValuation = inventoryItems.reduce((sum, item) => sum + (Number(item.currentStock || 0) * (Number(item.unitCost) || 0)), 0);

    const pnlRows = [
      ['☕ S&S CAFE - FINANCIAL P&L & PERFORMANCE STATEMENT', '', ''],
      ['Report Period:', label, ''],
      ['Generated On:', generatedTimestamp, ''],
      ['Currency:', 'INR (₹)', ''],
      ['', '', ''],
      ['FINANCIAL METRIC & BREAKDOWN', 'AMOUNT (₹)', '% OF REVENUE'],
      ['-------------------------------------------------------', '-------------', '-----------'],
      ['1. REVENUE & COUNTER SALES (AAMDANI)', '', ''],
      ['   Total Gross Sales Revenue (+)', fmt(totalRevenue), '100.0%'],
      ['     - Cash Counter Collection', fmt(cashRevenue), fmtPct(cashRevenue, totalRevenue)],
      ['     - Online / UPI Collection', fmt(onlineRevenue), fmtPct(onlineRevenue, totalRevenue)],
      ['   Total Food Portions / Items Sold', totalUnitsSold, '—'],
      ['', '', ''],
      ['2. COST OF GOODS SOLD (COGS / RAW MATERIAL KHARCHA)', '', ''],
      ['   Raw Material Consumed (via Recipes) (-)', fmt(cogsTotal), fmtPct(cogsTotal, totalRevenue)],
      ['   GROSS PROFIT (Sales Revenue - COGS)', fmt(grossProfit), grossMarginPct],
      ['', '', ''],
      ['3. OPERATING OVERHEAD EXPENSES (BIJLI / RENT / SALARY)', '', '']
    ];

    // Append individual expense categories
    Object.entries(expenseCategoryMap).forEach(([cat, amt]) => {
      pnlRows.push([`     - ${cat}`, fmt(amt), fmtPct(amt, totalRevenue)]);
    });

    pnlRows.push(
      ['   Total Operating Expenses (-)', fmt(totalOverhead), fmtPct(totalOverhead, totalRevenue)],
      ['', '', ''],
      ['4. FOOD WASTAGE & SPOILAGE LOSS (KHARAB MAAL)', '', ''],
      ['   Total Food Wastage Loss (-)', fmt(totalWastageLoss), fmtPct(totalWastageLoss, totalRevenue)],
      ['', '', ''],
      ['=======================================================', '============= ', '==========='],
      ['5. TRUE NET IN-HAND PROFIT (ASLI NET BACHAT)', fmt(trueNetProfit), trueNetMarginPct],
      ['=======================================================', '============= ', '==========='],
      ['', '', ''],
      ['6. CASH FLOW & INVENTORY ASSET STATUS', '', ''],
      ['   Total Raw Material Purchases (Cash Outflow)', fmt(totalProcurementSpent), 'Supplier Purchases'],
      ['   Current Stock Valuation (Asset in Storage)', fmt(stockValuation), 'Physical Storage Asset'],
      ['   Total Active Menu Items', menuItems.length, 'Dishes on Menu'],
      ['   Total Raw Material SKUs in Inventory', inventoryItems.length, 'Ingredients Tracked']
    );

    const wsPnL = XLSX.utils.aoa_to_sheet(pnlRows);
    setAutoColumnWidths(wsPnL, pnlRows, 15);
    XLSX.utils.book_append_sheet(wb, wsPnL, 'P&L Statement');
  }

  // -------------------------------------------------------------
  // 2. DAILY SALES ORDERS SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'sales') {
    const salesHeaderMeta = [
      ['☕ S&S CAFE - DAILY SALES ORDERS REPORT', '', '', '', '', '', '', '', '', '', '', ''],
      ['Report Period:', label, '', '', '', '', '', '', '', '', '', ''],
      ['Generated On:', generatedTimestamp, '', '', '', '', '', '', '', '', '', ''],
      ['Total Orders Recorded:', filteredSales.length, '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '']
    ];

    const salesColumns = [
      'S.No',
      'Date',
      'Time',
      'Item Name',
      'Category',
      'Qty Sold',
      'Unit Price (₹)',
      'Total Revenue (₹)',
      'Unit Cost (₹)',
      'Total Cost (₹)',
      'Gross Profit (₹)',
      'Profit Margin %',
      'Payment Mode'
    ];

    let totalSalesQty = 0;
    let totalSalesRev = 0;
    let totalSalesCost = 0;
    let totalSalesProfit = 0;

    const salesDataRows = filteredSales.map((s, index) => {
      const qty = Number(s.quantitySold) || 0;
      const rev = Number(s.totalRevenue) || 0;
      const sp = Number(s.sellingPrice) || (qty > 0 ? rev / qty : 0);

      const matched = menuItems.find(m => m.id === s.itemId || m.name === s.itemName);
      const cpUnit = matched && matched.costPrice !== undefined ? Number(matched.costPrice) : (Number(s.costPrice) || 0);
      const totalCost = cpUnit * qty;
      const profit = rev - totalCost;
      const marginPct = rev > 0 ? ((profit / rev) * 100).toFixed(1) + '%' : '0.0%';

      totalSalesQty += qty;
      totalSalesRev += rev;
      totalSalesCost += totalCost;
      totalSalesProfit += profit;

      let timePart = '';
      if (s.createdAt) {
        try {
          timePart = new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
          timePart = '';
        }
      }

      return [
        index + 1,
        s.date || '',
        timePart,
        s.itemName || 'Item',
        s.category || 'General',
        qty,
        fmt(sp),
        fmt(rev),
        fmt(cpUnit),
        fmt(totalCost),
        fmt(profit),
        marginPct,
        s.paymentMethod || 'Cash'
      ];
    });

    const overallMarginPct = totalSalesRev > 0 ? ((totalSalesProfit / totalSalesRev) * 100).toFixed(1) + '%' : '0.0%';

    // Summary row at bottom
    const salesSummaryRow = [
      'GRAND TOTAL',
      '',
      '',
      '',
      '',
      totalSalesQty,
      '',
      fmt(totalSalesRev),
      '',
      fmt(totalSalesCost),
      fmt(totalSalesProfit),
      overallMarginPct,
      ''
    ];

    const allSalesRows = [...salesHeaderMeta, salesColumns, ...salesDataRows, salesSummaryRow];
    const wsSales = XLSX.utils.aoa_to_sheet(allSalesRows);
    setAutoColumnWidths(wsSales, allSalesRows, 12);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Orders');
  }

  // -------------------------------------------------------------
  // 3. PURCHASES & PROCUREMENT SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'procurement') {
    const procHeaderMeta = [
      ['☕ S&S CAFE - RAW MATERIAL PURCHASES & PROCUREMENT LOG', '', '', '', '', '', '', '', '', ''],
      ['Report Period:', label, '', '', '', '', '', '', '', ''],
      ['Generated On:', generatedTimestamp, '', '', '', '', '', '', '', ''],
      ['Total Purchase Entries:', filteredProcurement.length, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '']
    ];

    const procColumns = [
      'S.No',
      'Date',
      'Raw Material Name',
      'Category',
      'Quantity Purchased',
      'Unit',
      'Rate Per Unit (₹)',
      'Total Amount (₹)',
      'Supplier / Vendor',
      'Invoice / Remarks'
    ];

    let totalProcSpent = 0;
    const procDataRows = filteredProcurement.map((p, index) => {
      const qty = Number(p.quantityReceived) || 0;
      const total = Number(p.totalCost) || 0;
      const rate = Number(p.ratePerUnit) || (qty > 0 ? total / qty : 0);
      totalProcSpent += total;

      return [
        index + 1,
        p.date || '',
        p.materialName || '',
        p.category || 'Groceries',
        qty,
        p.unit || 'Piece',
        fmt(rate),
        fmt(total),
        p.vendor || 'Local Vendor',
        p.notes || p.invoiceNo || ''
      ];
    });

    const procSummaryRow = [
      'GRAND TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      fmt(totalProcSpent),
      '',
      ''
    ];

    const allProcRows = [...procHeaderMeta, procColumns, ...procDataRows, procSummaryRow];
    const wsProc = XLSX.utils.aoa_to_sheet(allProcRows);
    setAutoColumnWidths(wsProc, allProcRows, 12);
    XLSX.utils.book_append_sheet(wb, wsProc, 'Purchases & Stock In');
  }

  // -------------------------------------------------------------
  // 4. BILLS & OVERHEAD EXPENSES SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'expenses') {
    const expHeaderMeta = [
      ['☕ S&S CAFE - OPERATING EXPENSES & OVERHEADS LOG', '', '', '', '', '', ''],
      ['Report Period:', label, '', '', '', '', ''],
      ['Generated On:', generatedTimestamp, '', '', '', '', ''],
      ['Total Expense Entries:', filteredExpenses.length, '', '', '', '', ''],
      ['', '', '', '', '', '', '']
    ];

    const expColumns = [
      'S.No',
      'Date',
      'Expense Title',
      'Category (Rent/Bills/Salary)',
      'Amount (₹)',
      'Payment Mode',
      'Notes / Remarks'
    ];

    let totalExpSum = 0;
    const expDataRows = filteredExpenses.map((e, index) => {
      const amt = Number(e.amount) || 0;
      totalExpSum += amt;

      return [
        index + 1,
        e.date || '',
        e.title || 'Expense',
        e.category || 'General',
        fmt(amt),
        e.paymentMode || 'Cash',
        e.notes || ''
      ];
    });

    const expSummaryRow = [
      'GRAND TOTAL',
      '',
      '',
      '',
      fmt(totalExpSum),
      '',
      ''
    ];

    const allExpRows = [...expHeaderMeta, expColumns, ...expDataRows, expSummaryRow];
    const wsExp = XLSX.utils.aoa_to_sheet(allExpRows);
    setAutoColumnWidths(wsExp, allExpRows, 12);
    XLSX.utils.book_append_sheet(wb, wsExp, 'Operating Expenses');
  }

  // -------------------------------------------------------------
  // 5. WASTAGE & SPOILAGE SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'expenses') {
    const wasteHeaderMeta = [
      ['☕ S&S CAFE - FOOD WASTAGE & INGREDIENT SPOILAGE LOG (KHARAB MAAL)', '', '', '', '', '', ''],
      ['Report Period:', label, '', '', '', '', ''],
      ['Generated On:', generatedTimestamp, '', '', '', '', ''],
      ['Total Wastage Incidents:', filteredWastage.length, '', '', '', '', ''],
      ['', '', '', '', '', '', '']
    ];

    const wasteColumns = [
      'S.No',
      'Date',
      'Raw Material / Ingredient',
      'Spoiled Quantity',
      'Unit',
      'Direct Financial Loss (₹)',
      'Reason / Spoilage Details'
    ];

    let totalWasteLoss = 0;
    const wasteDataRows = filteredWastage.map((w, index) => {
      const loss = Number(w.costValue) || 0;
      totalWasteLoss += loss;

      return [
        index + 1,
        w.date || '',
        w.ingredientName || 'Ingredient',
        Number(w.quantity) || 0,
        w.unit || '',
        fmt(loss),
        w.reason || 'Spoiled / Expired'
      ];
    });

    const wasteSummaryRow = [
      'TOTAL LOSS',
      '',
      '',
      '',
      '',
      fmt(totalWasteLoss),
      ''
    ];

    const allWasteRows = [...wasteHeaderMeta, wasteColumns, ...wasteDataRows, wasteSummaryRow];
    const wsWaste = XLSX.utils.aoa_to_sheet(allWasteRows);
    setAutoColumnWidths(wsWaste, allWasteRows, 12);
    XLSX.utils.book_append_sheet(wb, wsWaste, 'Food Wastage & Loss');
  }

  // -------------------------------------------------------------
  // 6. CURRENT INVENTORY STATUS SHEET
  // -------------------------------------------------------------
  if (reportType === 'all' || reportType === 'inventory') {
    const invHeaderMeta = [
      ['☕ S&S CAFE - CURRENT RAW MATERIAL INVENTORY & STOCK VALUATION', '', '', '', '', '', '', '', '', ''],
      ['Generated On:', generatedTimestamp, '', '', '', '', '', '', '', ''],
      ['Total Raw Material Items:', inventoryItems.length, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '']
    ];

    const invColumns = [
      'S.No',
      'Raw Material Name',
      'Category',
      'Current Stock',
      'Unit',
      'Unit Cost (₹)',
      'Total Value (₹)',
      'Reorder Alert Level',
      'Stock Health Status',
      'Last Updated'
    ];

    let totalInvValuation = 0;
    const invDataRows = inventoryItems.map((item, index) => {
      const stock = Number(item.currentStock) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const reorder = Number(item.reorderLevel) || 0;
      const totalVal = stock * unitCost;
      totalInvValuation += totalVal;

      let status = 'Sufficient';
      if (stock <= 0) {
        status = 'OUT OF STOCK';
      } else if (stock <= reorder) {
        status = 'LOW STOCK ALERT';
      }

      return [
        index + 1,
        item.materialName || '',
        item.category || 'General',
        stock,
        item.unit || '',
        fmt(unitCost),
        fmt(totalVal),
        reorder,
        status,
        item.lastUpdated || ''
      ];
    });

    const invSummaryRow = [
      'GRAND TOTAL VALUATION',
      '',
      '',
      '',
      '',
      '',
      fmt(totalInvValuation),
      '',
      '',
      ''
    ];

    const allInvRows = [...invHeaderMeta, invColumns, ...invDataRows, invSummaryRow];
    const wsInv = XLSX.utils.aoa_to_sheet(allInvRows);
    setAutoColumnWidths(wsInv, allInvRows, 12);
    XLSX.utils.book_append_sheet(wb, wsInv, 'Current Stock Status');
  }

  // Generate File Name based on options
  const sanitizedLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `SS_Cafe_${sanitizedLabel}_${dateStamp}.xlsx`;

  // Trigger browser direct download
  XLSX.writeFile(wb, filename);

  return {
    success: true,
    filename,
    recordsCount: {
      sales: filteredSales.length,
      procurement: filteredProcurement.length,
      expenses: filteredExpenses.length,
      wastage: filteredWastage.length
    }
  };
}
