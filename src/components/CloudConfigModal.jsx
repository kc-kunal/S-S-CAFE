import React, { useState, useEffect } from 'react';
import { X, Cloud, Database, Check, AlertCircle, Sparkles, ExternalLink, RefreshCw, UploadCloud, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getActiveFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, isFirebaseConfigured } from '../utils/firebase';
import { uploadAllLocalToCloud } from '../utils/cloudSync';

export default function CloudConfigModal({
  isOpen,
  onClose,
  currentMenu = [],
  currentInventory = [],
  currentSales = [],
  currentProcurement = [],
  onConnected
}) {
  const [configText, setConfigText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [appId, setAppId] = useState('');
  
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveFirebaseConfig();
      if (active && active.apiKey && active.projectId) {
        setIsConnected(true);
        setApiKey(active.apiKey || '');
        setProjectId(active.projectId || '');
        setAuthDomain(active.authDomain || '');
        setStorageBucket(active.storageBucket || '');
        setAppId(active.appId || '');
      } else {
        setIsConnected(false);
      }
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Auto-parse pasted Firebase config snippet or JSON
  const handleParseSnippet = (text) => {
    setConfigText(text);
    if (!text.trim()) return;

    try {
      // 1. Try standard JSON
      const parsed = JSON.parse(text);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.appId) setAppId(parsed.appId);
      setStatusMsg({ type: 'success', text: '✓ Config auto-detected from JSON!' });
      return;
    } catch (e) {
      // Not pure JSON, parse JS object regex
    }

    const extractField = (fieldName) => {
      const regex = new RegExp(`${fieldName}['"\\s]*:['"\\s]*([^'"\\s,;]+)`, 'i');
      const match = text.match(regex);
      return match ? match[1].replace(/['",;]/g, '').trim() : '';
    };

    const foundApiKey = extractField('apiKey');
    const foundProjectId = extractField('projectId');
    const foundAuthDomain = extractField('authDomain');
    const foundStorageBucket = extractField('storageBucket');
    const foundAppId = extractField('appId');

    if (foundApiKey && foundProjectId) {
      setApiKey(foundApiKey);
      setProjectId(foundProjectId);
      if (foundAuthDomain) setAuthDomain(foundAuthDomain);
      if (foundStorageBucket) setStorageBucket(foundStorageBucket);
      if (foundAppId) setAppId(foundAppId);
      setStatusMsg({ type: 'success', text: '✓ Firebase config snippet parsed successfully!' });
    }
  };

  const handleSaveAndConnect = async () => {
    if (!apiKey.trim() || !projectId.trim()) {
      setStatusMsg({ type: 'error', text: 'API Key aur Project ID zaroori hain!' });
      return;
    }

    const config = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim()
    };

    saveFirebaseConfig(config);
    setIsConnected(true);
    setStatusMsg({ type: 'success', text: '🎉 Firebase Connected! Ab aapka data cloud me sync hoga.' });

    if (onConnected) {
      onConnected();
    }
  };

  const handleUploadLocalData = async () => {
    setIsUploading(true);
    try {
      await uploadAllLocalToCloud(currentMenu, currentInventory, currentSales, currentProcurement);
      setStatusMsg({
        type: 'success',
        text: `✓ Success! ${currentMenu.length} items, ${currentInventory.length} raw materials aur sales Firestore cloud par upload ho gaye!`
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Upload error: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDisconnect = () => {
    clearFirebaseConfig();
    setIsConnected(false);
    setApiKey('');
    setProjectId('');
    setAuthDomain('');
    setStorageBucket('');
    setAppId('');
    setConfigText('');
    setStatusMsg({ type: 'info', text: 'Disconnected from cloud. LocalStorage mode active.' });
    if (onConnected) onConnected();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-title text-amber-100 flex items-center gap-2">
                <span>Free Cloud Database (Firebase Firestore)</span>
                {isConnected ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Live Cloud Sync
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-stone-700 text-stone-300">
                    Offline / Local Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">Netlify par deploy karne ke baad sabhi devices par live data sync rakhein</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-stone-700">
          
          {/* Status Alert Banner */}
          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-300'
                : 'bg-stone-100 text-stone-800 border border-stone-300'
            }`}>
              <span>{statusMsg.text}</span>
              <button onClick={() => setStatusMsg(null)} className="text-stone-400 hover:text-stone-700 font-extrabold">✕</button>
            </div>
          )}

          {/* Quick Explanation */}
          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 space-y-1">
              <p className="font-bold text-amber-950">
                Kyu zaroori hai Cloud Database?
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                LocalStorage sirf aapke computer ke browser me rehta hai. Jab aap Netlify par app daalenge ya mobile se open karenge, to <strong>Firebase Firestore</strong> ki madad se mobile, tablet aur laptop sabhi jagah <strong>live stock aur sales ek sath sync</strong> rahenge!
              </p>
            </div>
          </div>

          {/* Step by Step Setup Instructions */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
            <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center justify-between">
              <span>Firebase Free Database Kaise Banayein (2 Minutes Setup)</span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 hover:text-amber-850 flex items-center gap-1 font-bold text-[11px] underline"
              >
                <span>Open Firebase Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <ol className="text-xs text-stone-600 list-decimal list-inside space-y-1 font-medium">
              <li><strong className="text-stone-900">console.firebase.google.com</strong> par jaakar <strong>"Add Project"</strong> karein (jaise: <code>cafe-kunal</code>).</li>
              <li>Left menu me <strong>Build &gt; Firestore Database</strong> par click karke <strong>"Create Database"</strong> karein (Start in Test Mode).</li>
              <li>Project Settings (Gear icon ⚙️) me jakar <strong>Web app (&lt;/&gt;)</strong> banayein.</li>
              <li>Niche diye gaye box me wahan ka <strong>firebaseConfig</strong> paste kar dein ya direct fields bhar dein!</li>
            </ol>
          </div>

          {/* Paste Snippet / JSON Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Paste Firebase Config Code (Direct Paste)
            </label>
            <textarea
              rows={3}
              value={configText}
              onChange={(e) => handleParseSnippet(e.target.value)}
              placeholder='Paste firebaseConfig code here: const firebaseConfig = { apiKey: "AIza...", projectId: "cafe-123", ... };'
              className="w-full px-3.5 py-2 font-mono text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800"
            />
            <p className="text-[10px] text-stone-500">Firebase se pura code copy karke yahan paste karein, fields automatically fill ho jayenge.</p>
          </div>

          {/* Or Manual Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                API Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-cafe-project"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Cloud Action Buttons */}
          <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveAndConnect}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save & Connect Cloud</span>
              </button>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-bold rounded-xl border border-stone-200 cursor-pointer transition-all"
                  title="Disconnect and use local mode"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* 1-Click Upload Local Data to Cloud */}
            {isConnected && (
              <button
                type="button"
                onClick={handleUploadLocalData}
                disabled={isUploading}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Uploading...' : 'Sync Local Data to Cloud (1-Click)'}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
