import React, { useState, useEffect } from 'react';
import { 
  X, Send, Check, AlertCircle, ExternalLink, ShieldCheck, Zap, Bot, 
  Sparkles, CheckCircle2, Eye, EyeOff, MessageSquare, Bell, ArrowRight
} from 'lucide-react';
import { 
  getAlertConfig, 
  saveAlertConfig, 
  sendTelegramAlert 
} from '../utils/telegramAlert';

export default function StockAlertSettingsModal({ isOpen, onClose, showToast, currentCafe }) {
  const cafeId = currentCafe?.cafeId || 'default';
  const cafeName = currentCafe?.cafeName || 'Current Cafe';
  
  const [config, setConfig] = useState(() => getAlertConfig(cafeId));
  const [showToken, setShowToken] = useState(false);
  
  // Telegram testing state
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [testTgResult, setTestTgResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getAlertConfig(cafeId);
      setConfig(current);
      setTestTgResult(null);
    }
  }, [isOpen, cafeId]);

  if (!isOpen) return null;

  const isTgConfigured = !!(config.telegramBotToken?.trim() && config.telegramChatId?.trim());

  const handleSave = (e) => {
    e?.preventDefault();
    const updated = {
      ...config,
      telegramBotToken: config.telegramBotToken?.trim() || '',
      telegramChatId: config.telegramChatId?.trim() || '',
      isEnabled: config.isEnabled !== false
    };
    saveAlertConfig(updated, cafeId);
    if (showToast) {
      showToast(`✅ "${cafeName}" Telegram Alert Settings Saved!`);
    }
    onClose();
  };

  const handleTestTelegram = async () => {
    if (!config.telegramBotToken?.trim() || !config.telegramChatId?.trim()) {
      setTestTgResult({
        type: 'error',
        text: 'Kripya Telegram Bot Token aur Chat ID dono darj karein!'
      });
      return;
    }

    setIsTestingTg(true);
    setTestTgResult(null);

    const testMsg = 
      `🎉 <b>TELEGRAM ALERT SYSTEM ACTIVE!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏢 <b>Cafe:</b> ${cafeName}\n` +
      `⚡ <b>Status:</b> Connected & Multi-Tenant Verified!\n` +
      `📢 <b>Alerts Enabled:</b>\n` +
      ` • 🚨 Low Raw Material Stock Alert\n` +
      ` • 🔔 Live QR Table Order Notification\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <i>Ab stock khatam hone par yaha automatic message aayega!</i>`;

    const res = await sendTelegramAlert(
      config.telegramBotToken.trim(),
      config.telegramChatId.trim(),
      testMsg
    );

    setIsTestingTg(false);
    if (res.success) {
      setTestTgResult({
        type: 'success',
        text: '✅ Test Message Telegram par bhej diya gaya hai! Apna Telegram check karein.'
      });
      if (showToast) showToast('Telegram Test Alert Sent Successfully!');
    } else {
      setTestTgResult({
        type: 'error',
        text: `❌ Telegram Send Failed: ${res.error || 'Check Bot Token/Chat ID. Make sure you clicked START on your bot!'}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Telegram Automated Alerts
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  100% Free & Unlimited
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configured specifically for: <strong className="text-amber-400">{cafeName}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isTgConfigured && config.isEnabled 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isTgConfigured && config.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <div>
                <p className="text-sm font-semibold text-white">
                  {isTgConfigured && config.isEnabled 
                    ? 'Active: Real-time Stock & Order Alerts Online' 
                    : 'Setup Incomplete: Telegram bot details required'}
                </p>
                <p className="text-xs text-slate-300">
                  {isTgConfigured 
                    ? 'POS me stock reorder limit se niche jate hi instant Telegram push aayega.' 
                    : 'Niche diye 3 aasan steps follow karke apna bot connect karein.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={config.isEnabled !== false} 
                onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 bg-slate-800/40 border border-slate-700/60 p-5 rounded-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" /> Telegram Bot Credentials ({cafeName})
            </h3>

            {/* Bot Token */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Telegram Bot Token <span className="text-red-400">*</span>
                </label>
                <a 
                  href="https://t.me/BotFather" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                >
                  Create bot on @BotFather <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.telegramBotToken || ''}
                  onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                  placeholder="e.g. 7123456789:AAFlq... (from @BotFather)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Ye token sirf iss cafe ke liye secure save hota hai.
              </p>
            </div>

            {/* Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Your Telegram Chat ID (User ID ya Group ID) <span className="text-red-400">*</span>
                </label>
                <a 
                  href="https://t.me/userinfobot" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
                >
                  Get ID from @userinfobot <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={config.telegramChatId || ''}
                onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                placeholder="e.g. 182736452 (Personal) ya -1001928374 (Staff Group)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Cafe ke staff ka Telegram group banakar bot ko group me add karke group Chat ID bhi daal sakte ho!
              </p>
            </div>

            {/* Test Button & Result */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTg || !config.telegramBotToken?.trim() || !config.telegramChatId?.trim()}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30"
              >
                {isTestingTg ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Telegram Alert Bhej Raha Hai...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    🧪 Test Alert Bhejein (Verify Connection)
                  </>
                )}
              </button>

              {testTgResult && (
                <div className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testTgResult.type === 'success' 
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                }`}>
                  {testTgResult.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testTgResult.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Step Setup Guide */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 2-Minute Easy Setup Guide:
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold mb-1.5">
                    Step 1
                  </span>
                  <p className="font-semibold text-white">Bot Create Karein</p>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Telegram par <b>@BotFather</b> search karein, <code className="text-sky-300">/newbot</code> bhejein aur Bot Token copy karein.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold mb-1.5">
                    Step 2
                  </span>
                  <p className="font-semibold text-white">Chat ID Nikalein</p>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Telegram par <b>@userinfobot</b> ko start karein. Wo aapko aapka number Chat ID de dega.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold mb-1.5">
                    Step 3
                  </span>
                  <p className="font-semibold text-white">Bot Ko START Karein</p>
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Apne banaye hue Bot ko Telegram me open karke <b>START</b> dabayein, phir upar Test button dabayein!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Feature Box */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Kyu Telegram Alert Best Hai?
            </p>
            <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-0.5 pl-1">
              <li><b>100% Free:</b> Kabhi koi monthly charge ya per-message fees nahi lagti.</li>
              <li><b>Zero Redirects:</b> Screen redirect nahi hoti, background me instant push notification aati hai.</li>
              <li><b>Multi-Staff Group:</b> Cafe owner, kitchen manager, sabko ek sath group me alert mil sakte hain.</li>
              <li><b>Multi-Tenant Safe:</b> Har cafe ka apna alag Bot/Chat ID hota hai, data mix nahi hota.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Tenant: <span className="font-mono text-slate-300">{cafeId}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-lg shadow-lg shadow-sky-900/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
