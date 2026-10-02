import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Database,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Activity,
  Layers
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
  testFirestoreHealth
} from '../utils/firebase';
import {
  uploadAllLocalToCloud,
  exportCafeDataToJson,
  COLLECTIONS
} from '../utils/cloudSync';

export default function CloudConfigModal({
  isOpen,
  onClose,
  currentMenu = [],
  currentInventory = [],
  currentSales = [],
  currentProcurement = [],
  currentExpenses = [],
  currentWastage = [],
  onConnected,
  onRestoreData
}) {
  const [configText, setConfigText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [appId, setAppId] = useState('');

  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('config'); // 'config' | 'rules' | 'backup'

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
    } catch {
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

    // Auto-test health
    setIsTesting(true);
    const health = await testFirestoreHealth(config);
    setIsTesting(false);

    if (health.success) {
      setStatusMsg({
        type: 'success',
        text: '🎉 Firebase Connected & Verified! Real-time production collections ready hain.'
      });
    } else {
      setStatusMsg({
        type: 'error',
        text: health.message
      });
    }

    if (onConnected) {
      onConnected();
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setStatusMsg(null);
    const testConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim()
    };
    const health = await testFirestoreHealth(testConfig);
    setIsTesting(false);

    if (health.success) {
      setStatusMsg({ type: 'success', text: health.message });
    } else {
      setStatusMsg({ type: 'error', text: health.message });
      if (health.code === 'permission-denied') {
        setActiveSubTab('rules');
      }
    }
  };

  const handleUploadLocalData = async () => {
    setIsUploading(true);
    try {
      await uploadAllLocalToCloud(
        currentMenu,
        currentInventory,
        currentSales,
        currentProcurement,
        currentExpenses,
        currentWastage
      );
      setStatusMsg({
        type: 'success',
        text: `✓ Success! Menu (${currentMenu.length}), Stock (${currentInventory.length}), Sales (${currentSales.length}) cloud par batch upload ho gaye!`
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

  const handleExportBackup = () => {
    exportCafeDataToJson({
      menu: currentMenu,
      inventory: currentInventory,
      sales: currentSales,
      procurement: currentProcurement,
      expenses: currentExpenses,
      wastage: currentWastage
    });
    setStatusMsg({ type: 'success', text: '✓ Backup JSON file downloaded successfully!' });
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const data = parsed.data || parsed;
        if (onRestoreData) {
          onRestoreData(data);
          setStatusMsg({ type: 'success', text: '✓ Backup restored successfully from JSON file!' });
        }
      } catch (err) {
        setStatusMsg({ type: 'error', text: `Invalid Backup JSON file: ${err.message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const securityRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // S&S Cafe POS Read & Write permissions
      allow read, write: if true;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(securityRulesSnippet);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="bg-stone-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif-title text-amber-100 flex items-center gap-2">
                <span>Enterprise Cloud Database</span>
                {isConnected ? (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Live Sync Active
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-stone-700 text-stone-300">
                    Local Only Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">Firebase Firestore multi-device live sync & automatic offline cache</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`pb-2.5 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer ${activeSubTab === 'config'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
          >
            ⚙️ Firebase Credentials
          </button>
          <button
            onClick={() => setActiveSubTab('rules')}
            className={`pb-2.5 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer ${activeSubTab === 'rules'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
          >
            🛡️ Security Rules
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`pb-2.5 text-xs font-bold px-3 border-b-2 transition-all cursor-pointer ${activeSubTab === 'backup'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
          >
            💾 Offline Backup & Restore
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-sm text-stone-700">

          {/* Status Alert Banner */}
          {statusMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : statusMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-300'
                  : 'bg-stone-100 text-stone-800 border border-stone-300'
              }`}>
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button onClick={() => setStatusMsg(null)} className="text-stone-400 hover:text-stone-700 font-extrabold cursor-pointer">✕</button>
            </div>
          )}

          {/* TAB 1: CONFIGURATION */}
          {activeSubTab === 'config' && (
            <>
              {/* Data Counters Pill */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Menu</div>
                  <div className="font-extrabold text-stone-900">{currentMenu.length}</div>
                </div>
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Stock</div>
                  <div className="font-extrabold text-stone-900">{currentInventory.length}</div>
                </div>
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Sales</div>
                  <div className="font-extrabold text-stone-900">{currentSales.length}</div>
                </div>
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Purchases</div>
                  <div className="font-extrabold text-stone-900">{currentProcurement.length}</div>
                </div>
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Expenses</div>
                  <div className="font-extrabold text-stone-900">{currentExpenses.length}</div>
                </div>
                <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="text-[10px] text-stone-500 font-bold uppercase">Wastage</div>
                  <div className="font-extrabold text-stone-900">{currentWastage.length}</div>
                </div>
              </div>

              {/* Step by Step Setup Instructions */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-2">
                <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Firebase Free Database Setup Guide (2 Mins)</span>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-bold text-[11px] underline"
                  >
                    <span>Open Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </h4>
                <ol className="text-xs text-stone-600 list-decimal list-inside space-y-1 font-medium">
                  <li><strong className="text-stone-900">console.firebase.google.com</strong> par <strong>"Create Project"</strong> karein (jaise: <code>cafe-kunal</code>).</li>
                  <li>Left panel me <strong>Build &gt; Firestore Database</strong> par click karein aur <strong>Create Database</strong> karein.</li>
                  <li>Project Settings (⚙️) &gt; <strong>General</strong> &gt; <strong>Web app (&lt;/&gt;)</strong> create karein.</li>
                  <li>Neeche diye box me <code>firebaseConfig</code> paste kar dein.</li>
                </ol>
              </div>

              {/* Paste Snippet / JSON Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Direct Paste Firebase Config Code
                </label>
                <textarea
                  rows={2}
                  value={configText}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder='Paste code here: const firebaseConfig = { apiKey: "AIza...", projectId: "cafe-123", ... };'
                  className="w-full px-3.5 py-2 font-mono text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800"
                />
              </div>

              {/* Or Manual Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </>
          )}

          {/* TAB 2: FIRESTORE SECURITY RULES */}
          {activeSubTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-1.5">
                <p className="font-bold text-stone-900">🛡️ Permission Denied Error Fix:</p>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  By default, Firebase Firestore production mode me read/write block kar deta hai.
                  Firebase Console me jaakar <strong>Firestore Database &gt; Rules tab</strong> me ye code paste karke <strong>"Publish"</strong> karein:
                </p>
              </div>

              <div className="relative">
                <pre className="p-3.5 bg-stone-950 text-amber-200 text-xs font-mono rounded-2xl overflow-x-auto leading-relaxed border border-stone-800">
                  {securityRulesSnippet}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="absolute top-2.5 right-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  {copiedRules ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: OFFLINE BACKUP & RESTORE */}
          {activeSubTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Data Safety & Offline Backup</span>
                </p>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Aapka cafe data hamesha surakshit rahe iske liye aap 1-click me complete database ko JSON file ke roop me download kar sakte hain, aur zarurat padne par kabhi bhi restore kar sakte hain.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="p-4 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-300 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all group"
                >
                  <div className="p-3 rounded-full bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Download JSON Backup</div>
                    <div className="text-[10px] text-stone-500">Menu, Stock, Sales, Expenses sabhi ka snapshot</div>
                  </div>
                </button>

                <label className="p-4 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-xs">Restore from Backup</div>
                    <div className="text-[10px] text-stone-500">Pahle se download ki gayi JSON file upload karein</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons Bar */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={isTesting}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save & Connect</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !apiKey.trim()}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
              >
                <Activity className={`w-3.5 h-3.5 text-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
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
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Syncing...' : 'Sync Local Data to Cloud (1-Click)'}</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
