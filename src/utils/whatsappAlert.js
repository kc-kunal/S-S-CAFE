// Utility for Automatic Background WhatsApp Stock Alerts & Vendor Order Links

const ALERT_CONFIG_KEY = 'ss_cafe_whatsapp_alert_config_v1';
const ALERT_HISTORY_KEY = 'ss_cafe_alert_history_v1';

// Default configuration
const DEFAULT_CONFIG = {
  isEnabled: true,
  ownerPhone: '',      // e.g. "919876543210"
  vendorPhone: '',     // e.g. "919876543211"
  callmebotApiKey: '', // Free CallMeBot API key
  reorderQuantity: 20  // Default reorder suggested amount
};

// Retrieve alert configuration
export const getAlertConfig = () => {
  try {
    const raw = localStorage.getItem(ALERT_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading alert config:', e);
  }
  return DEFAULT_CONFIG;
};

// Save alert configuration
export const saveAlertConfig = (config) => {
  try {
    localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving alert config:', e);
  }
};

// Clean and format phone number with country code (defaults to India 91 if 10 digits)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
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

// Anti-Spam Check: Ensure we don't alert the owner multiple times within 12 hours for the same item
const canAlertItem = (itemId, currentStock) => {
  try {
    const raw = localStorage.getItem(ALERT_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    const lastAlert = history[itemId];

    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;

    if (lastAlert && (now - lastAlert.timestamp < twelveHours) && lastAlert.stock === currentStock) {
      return false; // Already alerted for this stock level recently
    }

    return true;
  } catch (e) {
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
  } catch (e) {}
};

// Send direct silent background WhatsApp message to Owner via CallMeBot API
export const sendSilentWhatsAppToOwner = async (phone, apiKey, message) => {
  const cleanPhone = formatPhoneNumber(phone);
  if (!cleanPhone || !apiKey) {
    return { success: false, error: 'Phone or API key missing' };
  }

  // CallMeBot Free WhatsApp API endpoint
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey.trim()}`;

  try {
    // Mode no-cors avoids CORS blocking when calling third-party API from browser
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (err) {
    console.error('CallMeBot notification failed:', err);
    return { success: false, error: err.message };
  }
};

// Core background evaluator: Automatically triggers when item stock <= reorderLevel
export const triggerAutomaticStockAlerts = async (inventoryItems = []) => {
  const config = getAlertConfig();
  if (!config.isEnabled || !config.ownerPhone || !config.callmebotApiKey) {
    return []; // Alerts disabled or not configured
  }

  const lowStockItems = inventoryItems.filter(item => {
    const threshold = Number(item.reorderLevel) || 5;
    return Number(item.currentStock) <= threshold && canAlertItem(item.id, item.currentStock);
  });

  if (lowStockItems.length === 0) return [];

  const sentAlerts = [];

  for (const item of lowStockItems) {
    const targetVendorPhone = item.supplierPhone || config.vendorPhone;
    const vendorLink = generateVendorOrderLink(item, config.reorderQuantity || 20, targetVendorPhone);

    const alertMessage = 
      `🚨 *S&S CAFE — AUTO STOCK ALERT!*\n` +
      `--------------------------------\n` +
      `⚠️ *${item.materialName}* khatam hone wala hai!\n` +
      `• *Current Stock:* ${item.currentStock} ${item.unit}\n` +
      `• *Reorder Limit:* ${item.reorderLevel} ${item.unit}\n\n` +
      `Agar vendor ko Purchase Order bhejna hai to niche link par click karein:\n` +
      `👉 ${vendorLink}\n\n` +
      `_(S&S Cafe Smart Automation System)_`;

    await sendSilentWhatsAppToOwner(config.ownerPhone, config.callmebotApiKey, alertMessage);
    recordAlertSent(item.id, item.currentStock);
    sentAlerts.push(item);
  }

  return sentAlerts;
};
