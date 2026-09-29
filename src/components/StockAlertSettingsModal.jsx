import React, { useState, useEffect } from 'react';
import { X, Bell, MessageSquare, ExternalLink, Check, AlertCircle, Sparkles, Send, ShieldCheck, Phone } from 'lucide-react';
import { getAlertConfig, saveAlertConfig, sendSilentWhatsAppToOwner, generateVendorOrderLink, formatPhoneNumber } from '../utils/whatsappAlert';

export default function StockAlertSettingsModal({ isOpen, onClose, showToast }) {
  const [config, setConfig] = useState(getAlertConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getAlertConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e?.preventDefault();
    saveAlertConfig(config);
    if (showToast) {
      showToast('✅ WhatsApp Alert Settings Save Ho Gayi!');
    }
    onClose();
  };

  const handleSendTestMessage = async () => {
    if (!config.ownerPhone || !config.callmebotApiKey) {
      setTestResult({
        type: 'error',
        text: 'Kripya pehle Apna WhatsApp Number aur CallMeBot API Key bharein!'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testItem = {
      materialName: 'Pizza Base (Sample)',
      currentStock: 5,
      reorderLevel: 10,
      unit: 'Piece',
      category: 'Bakery'
    };

    const vendorLink = generateVendorOrderLink(testItem, config.reorderQuantity || 20, config.vendorPhone);
    const testMessage = 
      `🚨 *S&S CAFE — TEST AUTO STOCK ALERT!*\n` +
      `--------------------------------\n` +
      `⚠️ *Pizza Base (Sample)* khatam hone wala hai!\n` +
      `• *Current Stock:* 5 Piece\n` +
      `• *Reorder Limit:* 10 Piece\n\n` +
      `Vendor ko direct order bhejne ke liye niche link par tap karein:\n` +
      `👉 ${vendorLink}\n\n` +
      `_(Agar aapko ye message mil gaya hai to aapka automated system ready hai!)_`;

    try {
      await sendSilentWhatsAppToOwner(config.ownerPhone, config.callmebotApiKey, testMessage);
      setTestResult({
        type: 'success',
        text: `✓ Test message bhej diya gaya hai! Apne WhatsApp (+${formatPhoneNumber(config.ownerPhone)}) par check karein.`
      });
    } catch (err) {
      setTestResult({
        type: 'error',
        text: `Error: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-950 text-amber-50 px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif-title text-amber-100 flex items-center gap-2">
                Automated WhatsApp Stock Alerts
              </h2>
              <p className="text-xs text-stone-400">Stock ≤ 5 hote hi background me Owner ko alert jayega</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Main Enable Switch */}
          <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <div>
              <span className="font-extrabold text-stone-900 text-sm block">Auto WhatsApp Alerts Enable Rakhein</span>
              <p className="text-xs text-stone-600 mt-0.5">Sale punch karte waqt stock limit se kam hote hi bina kisi button ke alert jayega.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Setup Guide (30 Seconds) */}
          <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CallMeBot Free API Key Kaise Milegi? (Sirf 30 Second)</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">100% Free</span>
            </div>
            
            <ol className="text-xs text-stone-300 space-y-1.5 list-decimal pl-4">
              <li>
                Apne WhatsApp se CallMeBot bot ko ek message bhejein:
                <div className="mt-1 font-mono text-[11px] bg-stone-950 p-2 rounded-lg text-emerald-400 border border-stone-800 flex items-center justify-between">
                  <span>I allow callmebot to send me messages</span>
                  <a
                    href="https://wa.me/34644442621?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs font-bold text-sky-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Direct WhatsApp Kholein</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li>CallMeBot aapko reply me ek <strong>API Key</strong> dega (e.g. <code>1234567</code>).</li>
              <li>Wahi API Key aur apna WhatsApp number niche daal dein!</li>
            </ol>
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            
            {/* 1. Owner Phone */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Owner WhatsApp Number (Alert lene ke liye) *</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={config.ownerPhone}
                  onChange={(e) => setConfig({ ...config, ownerPhone: e.target.value })}
                  placeholder="e.g. 9876543210 ya 919876543210"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Is number par bina kisi button ko dabaye automatically alert aayega.</p>
            </div>

            {/* 2. CallMeBot API Key */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>CallMeBot Free API Key *</span>
              </label>
              <input
                type="text"
                required
                value={config.callmebotApiKey}
                onChange={(e) => setConfig({ ...config, callmebotApiKey: e.target.value })}
                placeholder="e.g. 1234567"
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* 3. Vendor / Supplier WhatsApp Number */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Default Vendor / Supplier WhatsApp Number *</span>
              </label>
              <input
                type="text"
                value={config.vendorPhone}
                onChange={(e) => setConfig({ ...config, vendorPhone: e.target.value })}
                placeholder="e.g. 9812345678 (Bakery / Grocery Vendor)"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <p className="text-[11px] text-stone-500 mt-1">Jab Owner alert link par click karega to is Vendor ka WhatsApp khulega.</p>
            </div>

            {/* 4. Default Reorder Quantity */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Default Reorder Quantity (Mangwane ki default matra)
              </label>
              <input
                type="number"
                value={config.reorderQuantity}
                onChange={(e) => setConfig({ ...config, reorderQuantity: Number(e.target.value) || 20 })}
                placeholder="20"
                className="w-full px-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none"
              />
            </div>

          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              testResult.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              {testResult.type === 'success' ? <Check className="w-4 h-4 text-emerald-700 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />}
              <span>{testResult.text}</span>
            </div>
          )}

          {/* Test Message Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSendTestMessage}
              disabled={isTesting}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isTesting ? 'Sending Test WhatsApp...' : '📲 Send Test WhatsApp Alert Now'}</span>
            </button>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              Save Alert Settings
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
