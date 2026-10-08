// S&S Cafe Automated Alert System
// Supports: Official Telegram Bot (100% Free, Silent Background, Zero Clicks) & Direct WhatsApp Links

const ALERT_CONFIG_KEY = 'ss_cafe_alert_config_v2';
const ALERT_HISTORY_KEY = 'ss_cafe_alert_history_v2';

// Default configuration with environment variables support
const DEFAULT_CONFIG = {
  isEnabled: true,
  // Telegram Bot Settings (Official & 100% Reliable Background Alerts)
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  telegramChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
  // WhatsApp Settings (For optional 1-click links)
  ownerPhone: import.meta.env.VITE_OWNER_WHATSAPP_PHONE || '',
  vendorPhone: import.meta.env.VITE_VENDOR_WHATSAPP_PHONE || '',
  reorderQuantity: 20
};

// Retrieve configuration with priority to .env variables
export const getAlertConfig = () => {
  const envBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  const envChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
  const envOwnerPhone = import.meta.env.VITE_OWNER_WHATSAPP_PHONE || '';
  const envVendorPhone = import.meta.env.VITE_VENDOR_WHATSAPP_PHONE || '';

  try {
    const raw = localStorage.getItem(ALERT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        // Environment variables take precedence whenever configured
        telegramBotToken: envBotToken || parsed.telegramBotToken || '',
        telegramChatId: envChatId || parsed.telegramChatId || '',
        ownerPhone: envOwnerPhone || parsed.ownerPhone || '',
        vendorPhone: envVendorPhone || parsed.vendorPhone || '',
        isEnabled: true
      };
    }
  } catch (e) {
    console.error('Error loading alert config:', e);
  }
  return {
    ...DEFAULT_CONFIG,
    telegramBotToken: envBotToken,
    telegramChatId: envChatId,
    ownerPhone: envOwnerPhone,
    vendorPhone: envVendorPhone,
    isEnabled: true
  };
};

// Save configuration
export const saveAlertConfig = (config) => {
  try {
    localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving alert config:', e);
  }
};

// Clean phone number with country code (defaults to 91 for India)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

// Anti-Spam Check: Ensure we don't alert the owner multiple times within 4 hours for the same item at the same stock level
const canAlertItem = (itemId, currentStock) => {
  try {
    const raw = localStorage.getItem(ALERT_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    const lastAlert = history[itemId];

    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;

    if (lastAlert && (now - lastAlert.timestamp < fourHours) && lastAlert.stock === currentStock) {
      return false; // Already alerted recently
    }

    return true;
  } catch {
    return true;
  }
};

const recordAlertSent = (itemId, currentStock) => {
  try {
    const raw = localStorage.getItem(ALERT_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    history[itemId] = {
      timestamp: Date.now(),
      stock: currentStock
    };
    localStorage.setItem(ALERT_HISTORY_KEY, JSON.stringify(history));
  } catch {}
};

/**
 * Send silent background alert to Owner via Official Telegram Bot API
 * Zero clicks by counter staff, 100% reliable, official CORS-enabled API.
 */
export const sendTelegramAlert = async (botToken, chatId, message) => {
  if (!botToken || !chatId) {
    return { success: false, error: 'Bot Token ya Chat ID missing hai' };
  }

  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true };
    }
    return { success: false, error: data.description || 'Telegram API Error' };
  } catch (err) {
    console.error('Telegram notification error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Core background evaluator: Automatically triggers when item stock <= reorderLevel
 * Fired during POS sales with zero button clicks required from counter staff.
 */
export const triggerAutomaticStockAlerts = async (inventoryItems = []) => {
  const config = getAlertConfig();
  if (!config.isEnabled || !config.telegramBotToken || !config.telegramChatId) {
    return []; // Auto alerts not configured or disabled
  }

  const lowStockItems = inventoryItems.filter(item => {
    const threshold = Number(item.reorderLevel) || 5;
    return Number(item.currentStock) <= threshold && canAlertItem(item.id, item.currentStock);
  });

  if (lowStockItems.length === 0) return [];

  const sentAlerts = [];

  for (const item of lowStockItems) {
    const alertMessage = 
      `🚨 <b>S&S CAFE — LOW STOCK ALERT!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>${item.materialName}</b> khatam hone wala hai!\n` +
      `• <b>Current Stock Left:</b> ${item.currentStock} ${item.unit || 'Piece'}\n` +
      `• <b>Reorder Limit:</b> ${item.reorderLevel || 5} ${item.unit || 'Piece'}\n` +
      `• <b>Category:</b> ${item.category || 'General'}\n` +
      `• <b>Status:</b> Urgent Purchase Needed!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>S&S Cafe Automated ERP (Zero-Click Alert)</i>`;

    const res = await sendTelegramAlert(config.telegramBotToken, config.telegramChatId, alertMessage);
    if (res.success) {
      recordAlertSent(item.id, item.currentStock);
      sentAlerts.push(item);
    }
  }

  return sentAlerts;
};

// Generate direct 1-tap WhatsApp message link for Owner
export const generateOwnerStockAlertLink = (item, ownerPhone = '') => {
  const phone = formatPhoneNumber(ownerPhone);
  const text =
    `🚨 *S&S CAFE — LOW STOCK ALERT!*\n` +
    `--------------------------------\n` +
    `⚠️ *${item.materialName}* khatam hone wala hai!\n` +
    `• *Current Stock Left:* ${item.currentStock} ${item.unit || 'Piece'}\n` +
    `• *Reorder Limit:* ${item.reorderLevel || 5} ${item.unit || 'Piece'}\n` +
    `• *Urgency:* Kripya jaldi naya stock arrange karein!\n` +
    `--------------------------------\n` +
    `_S&S Cafe Inventory System_`;

  const encoded = encodeURIComponent(text);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};

// Generate direct WhatsApp Vendor Purchase Order link
export const generateVendorOrderLink = (item, orderQty = 20, vendorPhone = '') => {
  const phone = formatPhoneNumber(vendorPhone);
  const qty = orderQty || 20;

  const orderText = `📦 *PURCHASE ORDER — S&S CAFE*\n` +
    `--------------------------------\n` +
    `*Material:* ${item.materialName}\n` +
    `*Quantity Required:* ${qty} ${item.unit || 'Piece'}\n` +
    `*Category:* ${item.category || 'General'}\n` +
    `*Current Stock Left:* ${item.currentStock} ${item.unit || 'Piece'}\n` +
    `*Urgency:* Urgent Delivery Needed!\n` +
    `*Delivery To:* S&S Cafe Counter\n` +
    `--------------------------------\n` +
    `Kripya confirm karein aur jaldi dispatch karein. Dhanyawad!`;

  const encoded = encodeURIComponent(orderText);
  if (phone) {
    return `https://wa.me/${phone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Send silent instant Telegram notification when a customer places a QR Table order
 */
export const sendTelegramNewOrderAlert = async (order) => {
  const config = getAlertConfig();
  if (!config.telegramBotToken || !config.telegramChatId) {
    return { success: false, reason: 'Telegram not configured' };
  }

  const itemsList = (order.items || []).map(i => `• <b>${i.quantity}x ${i.name}</b> — ₹${i.price * i.quantity}`).join('\n');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const message = 
    `🔔 <b>NEW DINE-IN ORDER RECEIVED!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🪑 <b>Table:</b> ${order.tableNumber || 'Table'}\n` +
    `🆔 <b>Order ID:</b> #${order.id ? order.id.slice(-6).toUpperCase() : 'ORD'}\n` +
    `🕒 <b>Time:</b> ${timeStr}\n` +
    `💰 <b>Total Bill:</b> ₹${order.totalAmount}\n` +
    (order.customerNotes ? `📝 <b>Special Note:</b> <i>"${order.customerNotes}"</i>\n` : '') +
    (order.customerName ? `👤 <b>Customer:</b> ${order.customerName}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Dishes Ordered:</b>\n${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Check POS Counter screen to Accept & Prepare!</i>`;

  return sendTelegramAlert(config.telegramBotToken, config.telegramChatId, message);
};

/**
 * Generate WhatsApp message link for customer order confirmation
 */
export const generateCustomerWhatsAppOrderLink = (order, cafePhone = '') => {
  const phone = formatPhoneNumber(cafePhone || getAlertConfig().ownerPhone);
  const itemsText = (order.items || []).map(i => `• ${i.quantity}x ${i.name} (₹${i.price * i.quantity})`).join('\n');
  const text = 
    `👋 *NEW DINE-IN ORDER — S&S CAFE*\n` +
    `--------------------------------\n` +
    `🪑 *Table:* ${order.tableNumber || 'Dine-In'}\n` +
    `💰 *Total Amount:* ₹${order.totalAmount}\n` +
    (order.customerNotes ? `📝 *Note:* ${order.customerNotes}\n` : '') +
    `--------------------------------\n` +
    `*Items:*\n${itemsText}\n` +
    `--------------------------------\n` +
    `Kripya hamara order confirm karein!`;
  const encoded = encodeURIComponent(text);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};

/**
 * Generate 1-Click WhatsApp Digital Tax/E-Bill Invoice Link for Customers
 * 100% Free, Zero Meta API Charges, Zero Paper Receipt Costs!
 */
export const generateCustomerEBillLink = ({
  cafeName = 'S&S Cafe',
  cafeCity = '',
  cafePhone = '',
  tokenOrBillNo = '',
  date = '',
  time = '',
  items = [],
  subtotal = 0,
  discount = 0,
  totalAmount = 0,
  paymentMethod = 'Cash',
  customerPhone = '',
  customerName = ''
}) => {
  const phone = formatPhoneNumber(customerPhone);
  const itemsText = items.map(i => {
    const qty = i.qty || i.quantitySold || i.quantity || 1;
    const name = i.name || i.itemName || 'Dish';
    const price = i.price || i.sellingPrice || 0;
    return `• ${qty}x ${name}  ₹${price * qty}`;
  }).join('\n');

  const now = new Date();
  const dateFormatted = date || now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFormatted = time || now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const billMessage =
    `🧾 *${cafeName.toUpperCase()} — DIGITAL E-BILL*\n` +
    (cafeCity ? `📍 ${cafeCity}\n` : '') +
    (cafePhone ? `📞 Contact: ${cafePhone}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    (customerName ? `👤 *Customer:* ${customerName}\n` : '') +
    `🔖 *Token / Bill:* ${tokenOrBillNo || '#BILL'}\n` +
    `📅 *Date:* ${dateFormatted} • ${timeFormatted}\n` +
    `💳 *Payment Mode:* ${paymentMethod} (PAID)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*ITEMS ORDERED:*\n` +
    `${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    (discount > 0 ? `Subtotal: ₹${subtotal}\n` + `Discount: -₹${discount}\n` : '') +
    `💰 *TOTAL PAID:* *₹${totalAmount}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🙏 *Thank you for dining with us!*\n` +
    `Save this digital receipt for your records. Visit again soon! ✨`;

  const encoded = encodeURIComponent(billMessage);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};
