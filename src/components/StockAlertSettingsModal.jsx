import React, { useState, useEffect } from 'react';
import { 
  X, Send, Check, AlertCircle, ExternalLink, ShieldCheck, Zap, Bot, 
  Sparkles, Phone, MessageSquare, Globe, QrCode, Key, Radio, CheckCircle2 
} from 'lucide-react';
import { 
  getAlertConfig, 
  saveAlertConfig, 
  sendTelegramAlert, 
  sendTestWhatsAppMessage 
} from '../utils/whatsappAlert';

export default function StockAlertSettingsModal({ isOpen, onClose, showToast }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'telegram'
  const [config, setConfig] = useState(getAlertConfig());
  
  // WhatsApp testing state
  const [testPhone, setTestPhone] = useState('');
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [testWaResult, setTestWaResult] = useState(null);

  // Telegram testing state
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [testTgResult, setTestTgResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getAlertConfig();
      setConfig(current);
      setTestPhone(current.ownerPhone || '');
      setTestWaResult(null);
      setTestTgResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWaConfigured = !!(config.whatsappToken?.trim() || config.whatsappWebhookUrl?.trim());
  const isTgConfigured = !!(config.telegramBotToken?.trim() && config.telegramChatId?.trim());

  const handleSave = (e) => {
    e?.preventDefault();
    const updated = {
      ...config,
      telegramBotToken: config.telegramBotToken?.trim() || '',
      telegramChatId: config.telegramChatId?.trim() || '',
      whatsappToken: config.whatsappToken?.trim() || '',
      whatsappPhoneId: config.whatsappPhoneId?.trim() || '',
      whatsappInstanceId: config.whatsappInstanceId?.trim() || '',
      whatsappWebhookUrl: config.whatsappWebhookUrl?.trim() || '',
      ownerPhone: config.ownerPhone?.trim() || '',
      vendorPhone: config.vendorPhone?.trim() || '',
      isEnabled: true
    };
    saveAlertConfig(updated);
    if (showToast) {
      showToast('✅ Communication & WhatsApp Gateway Settings Saved Successfully!');
    }
    onClose();
  };

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      setTestWaResult({
        type: 'error',
        text: 'Kripya test ke liye apna 10-digit WhatsApp number darj karein!'
      });
      return;
    }

    if (!config.whatsappToken?.trim() && !config.whatsappWebhookUrl?.trim()) {
      setTestWaResult({
        type: 'error',
        text: 'Kripya pehle Gateway Token ya Instance ID bharein!'
      });
      return;
    }

    setIsTestingWa(true);
    setTestWaResult(null);

    const res = await sendTestWhatsAppMessage(config, testPhone.trim());
    setIsTestingWa(false);

    if (res.success) {
      setTestWaResult({
        type: 'success',
        text: `✓ Test WhatsApp Bill successfully bhej diya gaya to +91 ${testPhone.trim()}! Apne phone par WhatsApp check karein.`
      });
    } else {
      setTestWaResult({
        type: 'error',
        text: `Error: ${res.reason || 'WhatsApp Gateway connect nahi ho paya'}. Kripya Instance ID / Token verify karein.`
      });
    }
  };

  const handleTestTelegram = async () => {
    if (!config.telegramBotToken?.trim() || !config.telegramChatId?.trim()) {
      setTestTgResult({
        type: 'error',
        text: 'Kripya pehle Telegram Bot Token aur Chat ID bharein!'
      });
      return;
    }

    setIsTestingTg(true);
    setTestTgResult(null);

    const testMessage = 
      `🚨 <b>S&S CAFE — TEST AUTO ALERT!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎉 <b>Badhai ho!</b> Aapka Telegram Auto Stock Alert 100% active ho gaya hai!\n` +
      `Ab POS par staff normal sale karega aur stock kam hote hi bina kisi button dabaye aapko direct alert mil jayega.`;

    const res = await sendTelegramAlert(config.telegramBotToken, config.telegramChatId, testMessage);
    setIsTestingTg(false);

    if (res.success) {
      setTestTgResult({
        type: 'success',
        text: '✓ Test Alert bhej diya gaya hai! Apne phone par Telegram app check karein.'
      });
    } else {
      setTestTgResult({
        type: 'error',
        text: `Error: ${res.error}. Kripya Token ya Chat ID verify karein (Bot ko pehle /start karna zaroori hai).`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-950 text-amber-50 px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-title text-amber-100">
                  Communications & WhatsApp Gateway
                </h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isWaConfigured 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isWaConfigured ? '🟢 Zero-Redirect Active' : '🟡 Setup Ready'}
                </span>
              </div>
              <p className="text-xs text-stone-400">Silent background messaging — Staff stays on POS screen with zero redirects</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-stone-100 px-4 sm:px-6 py-2.5 border-b border-stone-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>📱 WhatsApp Silent E-Bill Gateway</span>
            {isWaConfigured && <CheckCircle2 className="w-3 h-3 text-emerald-200" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'telegram'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-700/20'
                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 Telegram Stock & Order Alerts</span>
            {isTgConfigured && <CheckCircle2 className="w-3 h-3 text-sky-200" />}
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm text-stone-700">
          
          {/* ============================================================== */}
          {/* TAB 1: WHATSAPP SILENT GATEWAY (ZERO REDIRECT POS BILLING)     */}
          {/* ============================================================== */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              
              {/* Notice Banner */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Zero-Redirect POS: Screen Chode Bina WhatsApp Par Bill!</span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Jab cashier <strong>"Punch & WhatsApp Bill"</strong> dabayega, software browser ko kisi naye WhatsApp tab par 
                  <strong> redirect nahi karega</strong>. Order data turant save ho jayega aur bill background me seedhe customer ko chala jayega.
                </p>
              </div>

              {/* Status Alert Banner */}
              {testWaResult && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                  testWaResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  <span>{testWaResult.text}</span>
                  <button type="button" onClick={() => setTestWaResult(null)} className="text-stone-400 hover:text-stone-700 font-extrabold cursor-pointer">✕</button>
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-extrabold text-stone-700 uppercase tracking-wider mb-2">
                  Choose WhatsApp Gateway Provider:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ultramsg', title: 'UltraMsg', subtitle: '⚡ QR Scan (Best)', badge: 'Recommended' },
                    { id: 'greenapi', title: 'Green-API', subtitle: '🟢 QR Scan', badge: 'Free Tier' },
                    { id: 'meta', title: 'Meta Cloud', subtitle: '☁️ Official Graph', badge: '1K Free/Mo' },
                    { id: 'webhook', title: 'Custom Webhook', subtitle: '🔗 Node / n8n', badge: 'Advanced' }
                  ].map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setConfig({ ...config, whatsappProvider: prov.id })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        config.whatsappProvider === prov.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-extrabold">{prov.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                          config.whatsappProvider === prov.id ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {prov.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500">{prov.subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Specific Configuration Box */}
              <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 space-y-3.5">
                
                {/* ULTRAMSG */}
                {config.whatsappProvider === 'ultramsg' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>UltraMsg Setup (Scan QR Code Once)</span>
                      </span>
                      <a
                        href="https://ultramsg.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1"
                      >
                        <span>ultramsg.com kholein</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      UltraMsg par account banayein, apna phone ka WhatsApp QR scan karein, aur Instance ID & Token yahan daalein:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">Instance ID *</label>
                        <input
                          type="text"
                          value={config.whatsappInstanceId || ''}
                          onChange={(e) => setConfig({ ...config, whatsappInstanceId: e.target.value })}
                          placeholder="e.g. instance102938"
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">Token *</label>
                        <input
                          type="text"
                          value={config.whatsappToken || ''}
                          onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                          placeholder="e.g. a1b2c3d4e5f6..."
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* GREEN-API */}
                {config.whatsappProvider === 'greenapi' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Green-API Setup (Developer Free Tier)</span>
                      </span>
                      <a
                        href="https://green-api.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1"
                      >
                        <span>green-api.com kholein</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">idInstance *</label>
                        <input
                          type="text"
                          value={config.whatsappInstanceId || ''}
                          onChange={(e) => setConfig({ ...config, whatsappInstanceId: e.target.value })}
                          placeholder="e.g. 110182394"
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">apiTokenInstance *</label>
                        <input
                          type="text"
                          value={config.whatsappToken || ''}
                          onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                          placeholder="e.g. c78912ef..."
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* META CLOUD API */}
                {config.whatsappProvider === 'meta' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Meta WhatsApp Cloud API (Official Facebook Graph API)</span>
                      </span>
                      <a
                        href="https://developers.facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center gap-1"
                      >
                        <span>developers.facebook.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">Phone Number ID *</label>
                        <input
                          type="text"
                          value={config.whatsappPhoneId || ''}
                          onChange={(e) => setConfig({ ...config, whatsappPhoneId: e.target.value })}
                          placeholder="e.g. 1049283749284"
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-300 mb-1">Permanent Access Token *</label>
                        <input
                          type="text"
                          value={config.whatsappToken || ''}
                          onChange={(e) => setConfig({ ...config, whatsappToken: e.target.value })}
                          placeholder="e.g. EAA..."
                          className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOM WEBHOOK */}
                {config.whatsappProvider === 'webhook' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Custom Webhook / Local Server Bridge</span>
                      </span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-300 mb-1">Endpoint URL *</label>
                      <input
                        type="url"
                        value={config.whatsappWebhookUrl || ''}
                        onChange={(e) => setConfig({ ...config, whatsappWebhookUrl: e.target.value })}
                        placeholder="e.g. http://localhost:3000/api/send-whatsapp or https://your-server.com/send"
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Test WhatsApp E-Bill Section */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>🧪 Test Gateway Connectivity (Real Message Send)</span>
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 flex-1">
                    <span className="text-xs font-bold text-stone-400">+91</span>
                    <input
                      type="tel"
                      maxLength="10"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile"
                      className="w-full text-xs font-bold text-stone-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={isTestingWa}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40 shrink-0 shadow-xs"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingWa ? 'animate-bounce' : ''}`} />
                    <span>{isTestingWa ? 'Sending...' : 'Send Test Bill'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: TELEGRAM BOT (AUTO STOCK ALERTS & DINE-IN ORDERS)      */}
          {/* ============================================================== */}
          {activeTab === 'telegram' && (
            <div className="space-y-4">
              
              {/* Quick Notice */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs text-sky-950 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 text-sky-800">
                  <Bot className="w-4 h-4 text-sky-600" />
                  <span>Telegram Bot (100% Free & Zero-Clicks)</span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Jaise hi koi raw material (Cheese, Milk, etc.) khatam hone lagega, Telegram bot seedhe Owner ke mobile par loud push alert bhej dega.
                </p>
              </div>

              {/* Status Alert Banner */}
              {testTgResult && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                  testTgResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}>
                  <span>{testTgResult.text}</span>
                  <button type="button" onClick={() => setTestTgResult(null)} className="text-stone-400 hover:text-stone-700 font-extrabold cursor-pointer">✕</button>
                </div>
              )}

              {/* Quick 1-Min Guide */}
              <div className="p-4 bg-stone-900 text-stone-200 rounded-2xl border border-stone-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Telegram Bot Kaise Banayein (1-Min)</span>
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">Free</span>
                </div>
                <p className="text-stone-300 text-[11px]">
                  1. Telegram me <strong>@BotFather</strong> ko <code>/newbot</code> bhejein aur token copy karein.<br />
                  2. Apne bot me jakar <strong>"START"</strong> dabayein.<br />
                  3. <strong>@userinfobot</strong> se apni Chat ID nikalen.
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-sky-600" />
                    <span>Telegram Bot Token</span>
                  </label>
                  <input
                    type="text"
                    value={config.telegramBotToken || ''}
                    onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                    placeholder="e.g. 7891234567:AAHk..."
                    className="w-full px-4 py-2.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Telegram Chat ID</span>
                  </label>
                  <input
                    type="text"
                    value={config.telegramChatId || ''}
                    onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                    placeholder="e.g. 1234567890"
                    className="w-full px-4 py-2.5 text-xs font-mono bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTg || !config.telegramBotToken?.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
                >
                  <Send className={`w-3.5 h-3.5 text-sky-600 ${isTestingTg ? 'animate-bounce' : ''}`} />
                  <span>{isTestingTg ? 'Sending Alert...' : '🧪 Send Test Alert to Telegram'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 font-semibold">
              Settings are saved automatically in cafe storage.
            </span>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl shadow-md shadow-emerald-700/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save & Activate Settings</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
