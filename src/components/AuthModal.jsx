import React, { useState } from 'react';
import {
  Coffee,
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { registerCafeOwner, loginCafeOwner, sendResetPassword } from '../utils/auth';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  isMandatory = false
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cafeName, setCafeName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [seedStarterData, setSeedStarterData] = useState(true);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSwitchTab = (tab) => {
    resetForm();
    setActiveTab(tab);
  };

  const getFriendlyErrorMessage = (err) => {
    const code = err?.code || '';
    const msg = err?.message || '';
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'Kripya ek valid email address enter karein.';
    }
    if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
      return 'Yeh email registered nahi hai. Kripya pehle "Register Cafe" karein.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || msg.includes('invalid-credential')) {
      return 'Email ya Password galat hai. Kripya dobara check karein.';
    }
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'Yeh email pehle se registered hai! Kripya "Sign In" karein.';
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return 'Password kam se kam 6 characters ka hona chahiye.';
    }
    if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
      return 'Internet connection check karein (Network timeout).';
    }
    return msg || 'Kuch gadbad hui. Kripya dobara try karein.';
  };

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Email aur Password dono required hain!');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCafeOwner(email, password);
      setSuccessMsg(`Swagat hai, ${res.cafe?.cafeName || 'Cafe Owner'}! Logged in successfully.`);
      setTimeout(() => {
        onAuthSuccess(res);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!cafeName.trim()) {
      setErrorMsg('Apne Cafe ka naam daalein!');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Apna naam (Owner Name) enter karein!');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg('Email aur Password enter karein!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password kam se kam 6 characters ka hona chahiye!');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords match nahi kar rahe hain!');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCafeOwner({
        email,
        password,
        cafeName,
        ownerName,
        phone,
        city
      });

      setSuccessMsg(`🎉 Badhai ho! "${cafeName}" successfully create ho gaya.`);
      setTimeout(() => {
        onAuthSuccess(res);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Apna registered email address enter karein!');
      return;
    }

    setLoading(true);
    try {
      await sendResetPassword(email);
      setSuccessMsg('✅ Password reset link aapke email par bhej diya gaya hai! Inbox check karein.');
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl shadow-stone-950/80 overflow-hidden my-auto">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 p-6 text-white relative">
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-amber-200/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight font-serif-title">S&S Cafe Multi-Tenant POS</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/30">
                  SaaS
                </span>
              </div>
              <p className="text-xs text-amber-100/80 mt-0.5">
                Multi-Cafe Cloud Management & Live Real-Time Multi-Device Sync
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-stone-950/40 p-1 rounded-xl mt-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-amber-100/70 hover:text-white'
              }`}
            >
              Sign In (Login)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-amber-100/70 hover:text-white'
              }`}
            >
              Register New Cafe
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('forgot')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-amber-100/70 hover:text-white'
              }`}
            >
              Reset Password
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">

          {/* Alert / Feedback message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* 1. SIGN IN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@mycafe.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Cloud Encrypted Session
                </span>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('forgot')}
                  className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-800 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In to POS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-xs text-stone-500">
                  Naye Cafe Owner hain?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className="text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Apna Cafe Register Karein
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. REGISTER NEW CAFE TAB */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Cafe Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="e.g. S&S Cafe - Branch 2"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Owner / Manager Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Kunal Sharma"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Contact / WhatsApp No.
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    City / Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Indore"
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address (Owner Login) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kunal@cafe.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Starter Pack Checkbox */}
              <label className="flex items-start gap-2 text-xs text-stone-300 bg-stone-950/40 p-2.5 rounded-xl border border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedStarterData}
                  onChange={(e) => setSeedStarterData(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-0 bg-stone-800 border-stone-700"
                />
                <div>
                  <span className="font-semibold text-amber-300">Starter Menu Catalog Shuru Karein</span>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Pizzas, Burgers, Cold Coffee & Recipes automatically aapke naye cafe me pre-load ho jayenge.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-800 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up Cafe Tenant...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create & Launch My Cafe</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-stone-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('login')}
                    className="text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD TAB */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-stone-400 leading-relaxed">
                Apna registered email address enter karein. Hum aapko password reset karne ka link bhejenge:
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@mycafe.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950/70 border border-stone-800 focus:border-amber-500 rounded-xl text-sm text-stone-100 placeholder-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    <span>Send Reset Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('login')}
                  className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  ← Wapas Login Par Jayein
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
