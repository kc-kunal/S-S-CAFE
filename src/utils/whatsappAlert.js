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

// Retrieve configuration
export const getAlertConfig = () => {
  try {
    const raw = localStorage.getItem(ALERT_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
    // Backward compatibility for v1
    const legacy = localStorage.getItem('ss_cafe_whatsapp_alert_config_v1');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return {
        ...DEFAULT_CONFIG,
        ownerPhone: parsed.ownerPhone || '',
        vendorPhone: parsed.vendorPhone || ''
      };
    }
  } catch (e) {
    console.error('Error loading alert config:', e);
  }
  return DEFAULT_CONFIG;
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
