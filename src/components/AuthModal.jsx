import React, { useState } from 'react';
import {
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
import BrandLogo from './BrandLogo';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  isMandatory = false,
  initialTab = 'login',
  selectedPlan = ''
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'login');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'login');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialTab]);
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
      return 'Kripya sahi email address enter karein.';
    }
    if (code === 'auth/user-not-found' || msg.includes('user-not-found')) {
      return 'Yeh email registered nahi hai. Naye cafe ke liye Register karein.';
    }
    if (code === 'auth/wrong-password' || msg.includes('invalid-credential')) {
      return 'Galat password ya email! Dobara check karein.';
    }
    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'Yeh email pehle se registered hai! Kripya Sign In karein.';
    }
    if (code === 'auth/weak-password') {
      return 'Password kam se kam 6 characters ka hona chahiye.';
    }
    return msg || 'Kuch dikkat aayi, kripya dobara try karein.';
  };

  // 1. Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Email aur Password dono bharein!');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCafeOwner(email, password);
      setSuccessMsg('🎉 Swagatam! Login successful.');
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

  // 2. Handle Register
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col gap-2">
            <BrandLogo size="lg" showText={true} textLight={true} />
            {selectedPlan && activeTab === 'signup' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl text-xs font-bold mt-1 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selected Plan: {selectedPlan} (14-Day Free Trial)</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl mt-5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In (Login)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Register New Cafe
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('forgot')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
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
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed font-medium">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* 1. SIGN IN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@mycafe.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Cloud Encrypted Session
                </span>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('forgot')}
                  className="text-indigo-600 hover:underline font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm"
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
                <p className="text-xs text-slate-500">
                  Naye Cafe Owner hain?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className="text-indigo-600 hover:underline font-bold cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cafe Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="e.g. Chai Junction"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner / Manager Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Kunal Sharma"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact / WhatsApp No.
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Indore"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Owner Login) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kunal@cafe.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Starter Pack Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedStarterData}
                  onChange={(e) => setSeedStarterData(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold text-slate-900">Starter Menu Catalog Shuru Karein</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pizzas, Burgers, Cold Coffee & Recipes automatically aapke naye cafe me pre-load ho jayenge.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up Cafe Tenant...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Create & Launch My Cafe</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('login')}
                    className="text-indigo-600 hover:underline font-bold cursor-pointer"
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
              <p className="text-xs text-slate-600 leading-relaxed">
                Apna registered email address enter karein. Hum aapko password reset karne ka link bhejenge:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@mycafe.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-sm"
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
                  className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
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
