import { getCurrentCafeId } from './storage';

/**
 * S&S Cafe Automated Telegram Alert Engine
 * Multi-Tenant Scoped: Low stock alerts & live Dine-In table orders sent directly to Cafe Owner's Telegram.
 * 100% Free, Official Telegram Bot API, Instant Push Notifications, No redirects.
 */

const ALERT_CONFIG_KEY = 'ss_cafe_telegram_alert_config_v3';
const ALERT_HISTORY_KEY = 'ss_cafe_telegram_alert_history_v3';

// Default configuration with environment variables support
const DEFAULT_CONFIG = {
  isEnabled: true,
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '',
  telegramChatId: import.meta.env.VITE_TELEGRAM_CHAT_ID || '',
  ownerPhone: import.meta.env.VITE_OWNER_PHONE || '',
  reorderQuantity: 20
};

// Retrieve configuration with multi-tenant isolation per cafe
export const getAlertConfig = (cafeId) => {
  const activeId = cafeId || (typeof getCurrentCafeId === 'function' ? getCurrentCafeId() : 'default');
  const scopedKey = `${ALERT_CONFIG_KEY}_${activeId}`;

  const envBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
  const envChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
  const envOwnerPhone = import.meta.env.VITE_OWNER_PHONE || '';

  try {
    let raw = localStorage.getItem(scopedKey);
    if (!raw && activeId !== 'default') {
      raw = localStorage.getItem(ALERT_CONFIG_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        telegramBotToken: parsed.telegramBotToken || envBotToken || '',
        telegramChatId: parsed.telegramChatId || envChatId || '',
        ownerPhone: parsed.ownerPhone || envOwnerPhone || '',
        isEnabled: parsed.isEnabled !== false
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
    isEnabled: true
  };
};

// Save configuration with multi-tenant isolation per cafe
export const saveAlertConfig = (config, cafeId) => {
  const activeId = cafeId || (typeof getCurrentCafeId === 'function' ? getCurrentCafeId() : 'default');
  const scopedKey = `${ALERT_CONFIG_KEY}_${activeId}`;
  try {
    localStorage.setItem(scopedKey, JSON.stringify(config));
    if (activeId === 'default') {
      localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Error saving alert config:', e);
  }
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
 * Send background alert to Cafe Owner via Official Telegram Bot API
 * 100% reliable, official CORS-enabled API, Zero-Redirect.
 */
export const sendTelegramAlert = async (botToken, chatId, message) => {
  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram Bot Token ya Chat ID missing hai' };
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
export const triggerAutomaticStockAlerts = async (inventoryItems = [], cafeId = null) => {
  const config = getAlertConfig(cafeId);
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
      `🚨 <b>CAFE STOCK ALERT!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>${item.materialName}</b> khatam hone wala hai!\n` +
      `• <b>Current Stock Left:</b> ${item.currentStock} ${item.unit || 'Piece'}\n` +
      `• <b>Reorder Limit:</b> ${item.reorderLevel || 5} ${item.unit || 'Piece'}\n` +
      `• <b>Category:</b> ${item.category || 'General'}\n` +
      `• <b>Status:</b> Urgent Purchase Needed!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Automated ERP Alert</i>`;

    const res = await sendTelegramAlert(config.telegramBotToken, config.telegramChatId, alertMessage);
    if (res.success) {
      recordAlertSent(item.id, item.currentStock);
      sentAlerts.push(item);
    }
  }

  return sentAlerts;
};

/**
 * Send silent instant Telegram notification when a customer places a QR Table order
 */
export const sendTelegramNewOrderAlert = async (order, cafeId = null) => {
  const config = getAlertConfig(cafeId);
  if (!config.telegramBotToken || !config.telegramChatId) {
    return { success: false, reason: 'Telegram not configured' };
  }

  const itemsList = (order.items || []).map(i => `• <b>${i.quantity || i.qty}x ${i.name || i.itemName}</b> — ₹${(i.price || 0) * (i.quantity || i.qty || 1)}`).join('\n');
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const message = 
    `🔔 <b>NEW DINE-IN ORDER RECEIVED!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🪑 <b>Table:</b> ${order.tableNumber ? `Table #${order.tableNumber}` : 'Dine-In'}\n` +
    `🆔 <b>Order ID:</b> #${order.id ? String(order.id).slice(-6).toUpperCase() : 'ORD'}\n` +
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

// Safe compatibility stubs
export const formatPhoneNumber = (phone) => '';
export const generateOwnerStockAlertLink = () => '';
export const generateVendorOrderLink = () => '';
export const generateCustomerWhatsAppOrderLink = () => '';
export const generateCustomerEBillLink = () => '';
export const formatCustomerEBillText = () => '';
export const sendBackgroundWhatsAppEBill = async () => ({ success: false, disabled: true });
export const sendTestWhatsAppMessage = async () => ({ success: false, disabled: true });
export const testCustomWebhookEndpoint = async () => ({ success: false, disabled: true });
