import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, CheckCircle2, X, RefreshCw } from 'lucide-react';

export default function StaffPinModal({
  isOpen,
  onClose,
  onSuccessUnlock,
  currentPin = '1234',
  onUpdatePin,
  title = 'Enter Owner PIN to Unlock',
  subtitle = 'Sensitive financial reports, margins, and settings are locked in Staff Mode.'
}) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('unlock'); // 'unlock' | 'changePin'

  // Change PIN states
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setActiveTab('unlock');
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setChangeSuccess('');
    }
  }, [isOpen]);

  // Support physical keyboard 0-9, Backspace, Enter
  useEffect(() => {
    if (!isOpen || activeTab !== 'unlock') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 4) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinInput, activeTab]);

  if (!isOpen) return null;

  const handleDigitPress = (digit) => {
    setErrorMsg('');
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 4) {
        // Auto-validate on 4th digit
        if (next === currentPin) {
          onSuccessUnlock();
        } else {
          setErrorMsg('Galat PIN! Kripya sahi 4-digit PIN dalein.');
          // Auto clear after brief delay
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPinInput('');
  };

  const handleChangePinSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setChangeSuccess('');

    if (oldPin !== currentPin) {
      setErrorMsg('Purana PIN galat hai!');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('Naya PIN sirf 4 digits ka hona chahiye (e.g. 5678)');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('Naya PIN aur confirm PIN match nahi kar rahe!');
      return;
    }

    if (onUpdatePin) {
      onUpdatePin(newPin);
      setChangeSuccess('PIN safaltapoorvak badal diya gaya!');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-white flex flex-col">
        
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              {activeTab === 'unlock' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-serif-title">
                {activeTab === 'unlock' ? 'Staff PIN Lock' : 'Change Owner PIN'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'unlock' ? 'Owner Authorization Required' : 'Update Security PIN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers (Unlock vs Change PIN) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => { setActiveTab('unlock'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'unlock'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unlock Mode
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('changePin'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'changePin'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Change PIN
          </button>
        </div>

        {/* Body Content */}
        {activeTab === 'unlock' ? (
          <div className="p-6 flex flex-col items-center">
            
            <p className="text-xs text-center text-slate-400 mb-5 max-w-xs leading-relaxed">
              {subtitle}
            </p>

            {/* PIN Bubble Indicators */}
            <div className="flex items-center space-x-4 mb-6">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-indigo-400 ring-4 ring-indigo-500/30 scale-110'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg ? (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-3 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mb-3">
                Default PIN: <span className="font-mono text-indigo-400 font-bold">1234</span>
              </p>
            )}

            {/* Numeric Numpad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(String(digit))}
                  className="h-13 bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-slate-100 active:text-white rounded-2xl font-mono text-xl font-bold border border-slate-700/60 shadow-xs transition-all cursor-pointer flex items-center justify-center transform active:scale-95"
                >
                  {digit}
                </button>
              ))}
              
              <button
                type="button"
                onClick={handleClear}
                className="h-13 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl text-xs font-bold border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>
              
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-13 bg-slate-800/80 hover:bg-slate-700 active:bg-indigo-600 text-slate-100 active:text-white rounded-2xl font-mono text-xl font-bold border border-slate-700/60 shadow-xs transition-all cursor-pointer flex items-center justify-center transform active:scale-95"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-13 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-2xl text-xs font-bold border border-slate-800 shadow-xs transition-all cursor-pointer flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            <div className="mt-5 text-center">
              <span className="text-[11px] text-slate-500">
                Tip: Keyboard se direct 0-9 type kar sakte hain
              </span>
            </div>

          </div>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="p-6 space-y-4">
            
            {changeSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Purana 4-digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Purana PIN dalein"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Naya 4-digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="e.g. 5678"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Naya PIN Confirm Karein
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder="Confirm naya PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
              >
                Naya PIN Save Karein
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
