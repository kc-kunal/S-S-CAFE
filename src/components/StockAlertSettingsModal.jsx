import React, { useState, useEffect } from 'react';
import { X, Send, Check, AlertCircle, ExternalLink, ShieldCheck, Zap, Bot, BellRing, Sparkles } from 'lucide-react';
import { getAlertConfig, saveAlertConfig, sendTelegramAlert } from '../utils/whatsappAlert';

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
    if (!config.telegramBotToken.trim() || !config.telegramChatId.trim()) {
      setTestResult({
        type: 'error',
        text: 'Kripya Telegram Bot Token aur Chat ID dono enter karein!'
      });
      return;
    }

    const updated = {
      ...config,
      telegramBotToken: config.telegramBotToken.trim(),
      telegramChatId: config.telegramChatId.trim(),
      isEnabled: true
    };
    saveAlertConfig(updated);
    if (showToast) {
      showToast('✅ Telegram Auto Alert Enabled! Counter staff ke bina kisi button dabaye alert aayenge.');
    }
    onClose();
  };

  const handleSendTestMessage = async () => {
    if (!config.telegramBotToken.trim() || !config.telegramChatId.trim()) {
      setTestResult({
        type: 'error',
        text: 'Kripya pehle Bot Token aur Chat ID bharein!'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testMessage = 
      `🚨 <b>S&S CAFE — TEST AUTO STOCK ALERT!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>Mozzarella Cheese (Sample)</b> khatam hone wala hai!\n` +
      `• <b>Current Stock Left:</b> 400 Gram\n` +
      `• <b>Reorder Limit:</b> 500 Gram\n` +
      `• <b>Status:</b> Urgent Purchase Needed!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎉 <b>Badhai ho!</b> Aapka Telegram Auto Stock Alert 100% active ho gaya hai!\n` +
      `Ab counter par staff normal sale karega aur stock kam hote hi bina kisi button dabaye aapko alert mil jayega.`;

    const res = await sendTelegramAlert(config.telegramBotToken, config.telegramChatId, testMessage);
    setIsTesting(false);

    if (res.success) {
      setTestResult({
        type: 'success',
        text: '✓ Test Alert bhej diya gaya hai! Apne phone par Telegram app kholein aur check karein.'
      });
    } else {
      setTestResult({
        type: 'error',
        text: `Error: ${res.error}. Kripya Token ya Chat ID verify karein (Bot ko pehle /start karna zaroori hai).`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-950 text-amber-50 px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif-title text-amber-100 flex items-center gap-2">
                <span>Automatic Stock Alerts (Telegram Bot)</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                  100% Reliable
                </span>
              </h2>
              <p className="text-xs text-stone-400">Zero Clicks: Sale hote hi Owner ke phone par instant push alert</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm text-stone-700">
          
          {/* Status Alert Banner */}
          {testResult && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
              testResult.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-rose-50 text-rose-900 border border-rose-300'
            }`}>
              <span>{testResult.text}</span>
              <button type="button" onClick={() => setTestResult(null)} className="text-stone-400 hover:text-stone-700 font-extrabold cursor-pointer">✕</button>
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs text-sky-950 space-y-1">
            <span className="font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Counter Staff Ko Kuch Bhi Nahi Dabana Padega!</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Staff normal bill banayega. Jaise hi koi item (Cheese, Milk, Bread) reorder limit se kam hoga, Telegram ka official API chup-chap <strong>Owner ke mobile par loud notification bhej dega</strong>.
            </p>
          </div>

          {/* Setup Guide (1 Minute Setup) */}
          <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Telegram Bot Kaise Banayein (1 Minute Guide)</span>
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">Free & Official</span>
            </div>

            <ol className="text-xs text-stone-300 space-y-2 list-decimal pl-4">
              <li>
                Telegram app me <strong>@BotFather</strong> kholein:
                <div className="mt-1">
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>@BotFather Kholein (Telegram)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
              <li>
                BotFather ko <code className="bg-stone-950 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px]">/newbot</code> bhejein, koi bhi naam dein (jaise: <code>SS Cafe Alert</code>), fir username dein (jaise: <code>ss_cafe_alert_bot</code>).
              </li>
              <li>
                BotFather aapko ek <strong>HTTP API Token</strong> dega (jaise: <code>7891234567:AAHk...</code>). Wahi token copy karein!
              </li>
              <li>
                Apne naye bot ke link par click karke wahan <strong>"START"</strong> dabayein.
              </li>
              <li>
                Apni <strong>Chat ID</strong> nikalne ke liye Telegram me <strong>@userinfobot</strong> kholein (wo turant aapki ID e.g. <code>1234567890</code> bata dega):
                <div className="mt-1">
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <span>@userinfobot (Chat ID Kholein)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>
            </ol>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-sky-600" />
                <span>Telegram Bot Token *</span>
              </label>
              <input
                type="text"
                required
                value={config.telegramBotToken}
                onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                placeholder="e.g. 7891234567:AAHk123456789abcdef..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <p className="text-[10px] text-stone-500 mt-1">BotFather se mila hua API Token.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Telegram Chat ID (Owner ID) *</span>
              </label>
              <input
                type="text"
                required
                value={config.telegramChatId}
                onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                placeholder="e.g. 1234567890"
                className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <p className="text-[10px] text-stone-500 mt-1">@userinfobot se mila hua aapka personal Telegram Chat ID.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSendTestMessage}
              disabled={isTesting || !config.telegramBotToken.trim() || !config.telegramChatId.trim()}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
            >
              <Send className={`w-3.5 h-3.5 text-sky-600 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Sending Alert...' : '🧪 Send Test Alert to Telegram'}</span>
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save & Enable Auto Alert</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
