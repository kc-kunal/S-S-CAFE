import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  TrendingUp,
  Boxes,
  Receipt,
  UtensilsCrossed,
  Bike,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  LogIn,
  Store,
  Layers,
  Smartphone,
  Cloud,
  Check,
  Clock,
  ChevronRight,
  Headphones,
  FileSpreadsheet,
  Star,
  Award,
  Calculator,
  Bell,
  Flame,
  Percent,
  ChevronDown
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function LandingPage({
  onOpenLogin,
  onOpenSignup,
  onLaunchDemo
}) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [activeFeatureTab, setActiveFeatureTab] = useState('counter');
  const [dailyOrders, setDailyOrders] = useState(60); // for ROI calculator slider

  // Calculations for interactive ROI slider
  const monthlyOrders = dailyOrders * 30;
  const hoursSaved = Math.round((dailyOrders * 1.5 * 30) / 60);
  const aggregatorRecovered = Math.round(monthlyOrders * 0.4 * 18); // ~40% online orders saving ₹18 in missed reconciliations
  const wastageSaved = Math.round(monthlyOrders * 4.5); // ~₹4.5 saved per order via recipe BOM
  const totalSavings = aggregatorRecovered + wastageSaved;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* 🌟 1. STICKY TOP NAVIGATION BAR (Ultra-Clean Glassmorphism) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all shadow-xs">
        {/* Announcement Bar */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white px-3 py-1 text-center text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-2">
          <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Naya Update: Swiggy & Zomato Automatic Bank Reconciliation Engine 2026 Live!</span>
          <span className="hidden md:inline bg-white/20 px-2 py-0.2 rounded-full text-[10px] uppercase font-bold">14-Day Free</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <a href="#" className="cursor-pointer">
            <BrandLogo size="md" showText={true} textLight={false} />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#demo-preview" className="hover:text-indigo-600 transition-colors">POS Simulator</a>
            <a href="#calculator" className="hover:text-indigo-600 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing Plans</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQs</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Demo Button */}
            <button
              type="button"
              onClick={onLaunchDemo}
              className="group flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Test the complete POS live with sample data"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline sm:inline">Live Demo</span>
              <span className="xs:hidden sm:hidden">Demo</span>
            </button>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Login</span>
            </button>

            {/* Start Free Trial Button */}
            <button
              type="button"
              onClick={() => onOpenSignup()}
              className="relative overflow-hidden group flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles className="w-4 h-4 fill-white text-white" />
              <span className="hidden sm:inline">Register Cafe</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </div>

        </div>
      </header>

      {/* 🚀 2. HERO SECTION WITH 3D INTERACTIVE POS MOCKUP */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/60 via-slate-50/80 to-white">
        
        {/* Glow Spheres */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-400/15 via-purple-400/10 to-blue-400/15 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-bold mb-6 shadow-xs hover:border-indigo-400 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold">All-In-One Cloud POS & Restaurant ERP</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal">Made for Indian Cafes & QSRs</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.16]">
            Apne Cafe Ka Har Ek Paisa, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Payout & Recipe Stock Track Karein
            </span>
            — Zero Confusion!
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Multi-Item Counter Billing, Swiggy & Zomato Weekly Payout Transparency, Recipe-Linked Raw Stock Auto-Deduction aur QR Dine-in Ordering — sab kuch ek hi attractive dashboard par.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onOpenSignup()}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-102 active:scale-98"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onLaunchDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform transform hover:scale-102"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1 text-slate-700">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <strong className="ml-1 text-slate-900">4.9/5</strong> from 500+ Cafe Owners
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              No Credit Card Required
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>Instant 1-Minute Launch</span>
          </div>

          {/* 🌟 3D INTERACTIVE POS TERMINAL PREVIEW MOCKUP */}
          <div id="demo-preview" className="mt-12 max-w-5xl mx-auto relative">
            
            {/* Glowing Backdrop Outline */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-3xl blur-lg opacity-30 animate-pulse pointer-events-none" />

            {/* Window Container */}
            <div className="relative bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-left">
              
              {/* Window Title Bar */}
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between text-xs text-slate-300 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  </div>
                  <span className="ml-2 font-mono text-[11px] text-slate-400 hidden sm:inline">
                    CafePulse Cloud Terminal v2.4 • Live Connected
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Cloud Sync Active
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                    Token #48
                  </span>
                </div>
              </div>

              {/* Terminal Inner Content */}
              <div className="p-4 sm:p-6 bg-slate-50/60 grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left 7 Cols: Quick Category & Order Items */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Category Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                    <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl shadow-xs">🍕 Pizzas</span>
                    <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl">☕ Beverages</span>
                    <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl">🍔 Burgers</span>
                    <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl">🥪 Sandwiches</span>
                  </div>

                  {/* Menu Grid Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Chef Special</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-1">Cheese Burst Pizza</h5>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">₹280</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-indigo-400 shadow-xs ring-2 ring-indigo-500/20 bg-indigo-50/20 cursor-pointer">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">In Cart (2x)</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-1">Cold Coffee Thick</h5>
                      <p className="text-xs font-extrabold text-indigo-600 mt-1">₹120</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Quick Bites</span>
                      <h5 className="font-bold text-xs text-slate-800 mt-1">Paneer Tikka Burger</h5>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">₹150</p>
                    </div>
                  </div>

                  {/* Recipe BOM Live Stock Indicator */}
                  <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-700">Auto BOM Deduction:</span>
                      <span className="text-slate-500 text-[11px]">Mozzarella (-50g), Full Cream Milk (-250ml)</span>
                    </div>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Stock Synced
                    </span>
                  </div>

                </div>

                {/* Right 5 Cols: Live Order Summary & Payment Mode */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Current Order #104</h4>
                        <p className="text-[10px] text-slate-400">Counter Token • Dine-in Table 03</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2 py-0.5 rounded-md">
                        Token #48
                      </span>
                    </div>

                    {/* Order Items list */}
                    <div className="py-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">1x Cheese Burst Pizza</span>
                        <span className="font-bold text-slate-900">₹280</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">2x Cold Coffee Thick</span>
                        <span className="font-bold text-slate-900">₹240</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between font-bold text-sm">
                      <span className="text-slate-800">Total Payable:</span>
                      <span className="text-indigo-600 text-base font-extrabold">₹520</span>
                    </div>
                  </div>

                  {/* Payment Buttons with visual highlights */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button type="button" className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>💵 Cash (₹520)</span>
                      </button>
                      <button type="button" className="py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>📱 UPI QR / GPay</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onLaunchDemo}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Click to Test Full POS Dashboard Live</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Floating Live Indicator Badges Around Mockup */}
            <div className="hidden md:flex items-center gap-2 absolute -bottom-5 -left-4 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl shadow-lg text-xs font-bold text-slate-800 animate-bounce">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>🛵 Swiggy: ₹140 Net Payout Settled</span>
            </div>

            <div className="hidden md:flex items-center gap-2 absolute -top-4 -right-4 bg-white border border-slate-200 px-3.5 py-2 rounded-2xl shadow-lg text-xs font-bold text-slate-800">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>🛎️ Table #4: QR Order Received!</span>
            </div>

          </div>

          {/* Highlights Grid Bar */}
          <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-indigo-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">10-Sec POS Billing</h4>
                <p className="text-[11px] text-slate-500">Cash, UPI & Token Numbers</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-rose-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Swiggy & Zomato</h4>
                <p className="text-[11px] text-slate-500">Commission & Bank Ledger</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-emerald-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Recipe Inventory BOM</h4>
                <p className="text-[11px] text-slate-500">Gram-Level Stock Auto-Deduct</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-sky-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Multi-Device Sync</h4>
                <p className="text-[11px] text-slate-500">Mobile, Tablet & PC Ready</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 📦 3. INTERACTIVE FEATURE PLAYGROUND (Tabbed Live Showcase) */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Interactive Feature Tour
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Dukan Ka Har Kaam Aasan Banayein
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Neeche diye gaye tabs par click karke dekhein software kaise kaam karta hai:
            </p>

            {/* Interactive Tab Switcher */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 max-w-3xl mx-auto">
              <button
                type="button"
                onClick={() => setActiveFeatureTab('counter')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  activeFeatureTab === 'counter'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Counter POS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeatureTab('aggregator')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  activeFeatureTab === 'aggregator'
                    ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Swiggy & Zomato</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeatureTab('inventory')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  activeFeatureTab === 'inventory'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Recipe Inventory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeatureTab('qr')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  activeFeatureTab === 'qr'
                    ? 'bg-white text-amber-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>QR Table Orders</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFeatureTab('pnl')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  activeFeatureTab === 'pnl'
                    ? 'bg-white text-purple-600 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Real Net P&L</span>
              </button>
            </div>
          </div>

          {/* Active Tab Detailed View Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
            {activeFeatureTab === 'counter' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-full">
                    ⚡ Fast 10-Second Punching
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                    Multi-Item Customer Orders Ek Hi Token Me
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Counter rush hour me bina ruke 3 alag items ek hi bill me add karein. Cash payment ke liye emerald theme aur UPI ke liye sky blue automatic switch hota hai.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Daily Order & Token Sequence Numbers</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Split Payment (Cash + UPI) Supported</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Instant Thermal Printer / Kitchen KOT Ready</li>
                  </ul>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Token #102 • Counter Order</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Paid: Cash</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between"><span>2x Paneer Pizza</span><strong className="text-slate-900">₹360</strong></div>
                    <div className="flex justify-between"><span>1x Masala Chai</span><strong className="text-slate-900">₹30</strong></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-indigo-600">
                    <span>Grand Total:</span>
                    <span>₹390</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'aggregator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100/70 px-3 py-1 rounded-full">
                    🛵 100% Payout Transparency
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                    Swiggy & Zomato Commission Ka Exact Hisab
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Customer bill ₹160 tha, lekin bank me kitna aana chahiye? CafePulse platform commission aur promo discount deduct karke exact Net Payout ledger maintain karta hai.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-600" /> Gross Order vs Net Bank Settlement</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-600" /> Platform Order ID & Offer Tracking</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-rose-600" /> 1-Click Bank Account Settlement Entry</li>
                  </ul>
                </div>
                <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                    <span className="font-bold text-xs text-rose-700">Zomato Order #8491</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">Gross: ₹200</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between"><span>Offer Discount (20%)</span><span className="text-rose-600">-₹40</span></div>
                    <div className="flex justify-between"><span>Platform Commission (15%)</span><span className="text-rose-600">-₹24</span></div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-emerald-700">
                    <span>Net Bank Due:</span>
                    <span>₹136.00</span>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'inventory' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100/70 px-3 py-1 rounded-full">
                    📦 Recipe BOM Auto-Deduct
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                    Pizza Sell Hote Hi Cheese Auto-Deduct!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Har menu item ke sath raw materials link karein. Margarita Pizza sell hote hi 50g Mozzarella Cheese aur 25g Sauce inventory se automatically kam ho jati hai.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Gram & Liter Level Precise Consumption</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Telegram & WhatsApp Low Stock Alert</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Raw Material Procurement Entry & Supplier Ledger</li>
                  </ul>
                </div>
                <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-xs space-y-3">
                  <h5 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-100">Live Inventory Consumption</h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mozzarella Cheese</span>
                      <strong className="text-emerald-700">2.4 kg remaining</strong>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-3/4" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Full Cream Milk</span>
                      <span className="text-amber-600 font-bold">4.2 L (Reorder soon)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeatureTab === 'qr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-100/70 px-3 py-1 rounded-full">
                    🛎️ Contactless Dining
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                    Table QR Ordering With Kitchen Chime
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Customer apne mobile se table par baith kar QR code scan karega. Order punch hote hi kitchen terminal par sound chime bajti hai.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Har Table Ka Dedicated QR Code</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> Customer Ko App Download Karne Ki Zarurat Nahi</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-600" /> 1-Tap Bill Settlement to Daily Sales</li>
                  </ul>
                </div>
                <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-xs text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Bell className="w-8 h-8 animate-bounce" />
                  </div>
                  <h5 className="font-bold text-sm text-slate-900">New Order Chime Alert!</h5>
                  <p className="text-xs text-slate-500">Table #3 placed an order of ₹450</p>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">
                    Status: Preparing in Kitchen
                  </span>
                </div>
              </div>
            )}

            {activeFeatureTab === 'pnl' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-100/70 px-3 py-1 rounded-full">
                    📊 Accurate Financials
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3">
                    Daily Kiraya, Bijli, Staff & Spoilage Track Karein
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Sirf sales dekhna kafi nahi hai! CafePulse aapke daily overhead bills aur spoilage wastage ko sales me se deduct karke Real Net Profit batata hai.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Daily Overhead Expenses Tracker</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Phata Hua Doodh / Spoilage Wastage Logs</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Weekly & Monthly Excel (.xlsx) Export</li>
                  </ul>
                </div>
                <div className="bg-white border border-purple-200 p-5 rounded-2xl shadow-xs space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600"><span>Daily Gross Sales:</span><strong className="text-slate-900">₹14,500</strong></div>
                  <div className="flex justify-between text-slate-600"><span>Raw Material Purchases:</span><span className="text-rose-600">-₹5,200</span></div>
                  <div className="flex justify-between text-slate-600"><span>Staff & Electricity:</span><span className="text-rose-600">-₹1,800</span></div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-emerald-700">
                    <span>Net Pure Profit:</span>
                    <span>+₹7,500</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 💰 4. INTERACTIVE ROI & SAVINGS CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-50/70 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Smart Savings Calculator
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Apne Cafe Ki Monthly Bachat Calculate Karein
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Slider ko move karein aur dekhein CafePulse use karne par aapka kitna time aur commission ka nuksan bach sakta hai:
          </p>

          <div className="mt-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm text-left">
            
            {/* Slider */}
            <div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 mb-2">
                <span>Aapke Cafe Me Daily Kitne Orders Aate Hain?</span>
                <span className="text-indigo-600 text-lg">{dailyOrders} Orders / Day</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={dailyOrders}
                onChange={(e) => setDailyOrders(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>10 Orders (Kiosk)</span>
                <span>100 Orders (Medium Cafe)</span>
                <span>250 Orders (High Traffic)</span>
              </div>
            </div>

            {/* Calculated Results Grid */}
            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              
              <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl">
                <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-indigo-700">~{hoursSaved} Hours</p>
                <p className="text-xs text-slate-600 mt-0.5">Counter Billing Time Saved / Month</p>
              </div>

              <div className="bg-rose-50/60 border border-rose-100 p-4 rounded-2xl">
                <Bike className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-rose-700">₹{aggregatorRecovered.toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-0.5">Swiggy/Zomato Errors Reconciled</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                <Boxes className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-emerald-700">₹{totalSavings.toLocaleString()}+</p>
                <p className="text-xs text-slate-600 mt-0.5">Total Estimated Monthly Profit Boost</p>
              </div>

            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => onOpenSignup('Pro Growth')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-transform transform hover:scale-102"
              >
                Yeh Bachat Shuru Karein — Start 14-Day Free Trial
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 🚀 5. INTERACTIVE LIVE DEMO CALLOUT BANNER (Executive Dark Card) */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold mb-4">
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Live Playground</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bina Account Banaye Software Test Karna Chahte Hain?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              1-Click me live demo open karein. Sample pizzas, cold coffee, daily sales logs aur stock deduction abhi explore karein!
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={onLaunchDemo}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/30 inline-flex items-center gap-2 cursor-pointer transition-transform transform hover:scale-103"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>Launch Live Interactive Demo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 💳 6. SUBSCRIPTION PLANS & PRICING */}
      <section id="pricing" className="py-20 bg-slate-50/70 border-t border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Affordable & Simple Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Chhote Se Lekar Bade Cafe Tak — Sahi Plan Chunein
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Har plan me 14-Day Free Trial shaamil hai. Jab pasand aaye tabhi continue karein.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-6 inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-extrabold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">

            {/* Plan 1: Starter */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-300 shadow-xs hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Starter Kiosk Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Single counter chai/coffee outlets aur street stalls ke liye.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === 'monthly' ? '₹499' : '₹399'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">What's included:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Fast Counter POS Punching</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Cash & UPI Payment Modes</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Menu Catalog & Recipes</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Basic Inventory Tracker</div>
                  <div className="flex items-center gap-2.5 text-slate-400"><XCircleIcon /> Swiggy/Zomato Ledger</div>
                  <div className="flex items-center gap-2.5 text-slate-400"><XCircleIcon /> Multi-Device Cloud Sync</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Starter Kiosk')}
                className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Start Starter Trial
              </button>
            </div>

            {/* Plan 2: Pro Growth (POPULAR HIGHLIGHTED WITH GLOW BORDER) */}
            <div className="relative bg-white rounded-3xl p-7 flex flex-col justify-between shadow-xl shadow-indigo-600/15 border-2 border-indigo-600">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                ⭐ Most Popular Choice
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Pro Cafe Growth Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Busy cafes, restaurants aur cloud kitchens ke liye best.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-indigo-600">
                    {billingCycle === 'monthly' ? '₹999' : '₹799'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <p className="font-semibold text-indigo-600 uppercase tracking-wider text-[10px]">Everything in Starter, plus:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Swiggy & Zomato Payout Dashboard</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Recipe BOM Real-Time Stock Deduction</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Contactless Table QR Ordering & Chime</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Devices Live Cloud Sync</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Daily Overhead Bills & Spoilage Tracker</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Weekly & Monthly Excel (.xlsx) Reports</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Pro Growth')}
                className="mt-8 w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-transform transform hover:scale-102 cursor-pointer"
              >
                Start 14-Day Free Pro Trial
              </button>
            </div>

            {/* Plan 3: Enterprise Multi-Outlet */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-300 shadow-xs hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enterprise Multi-Outlet</h3>
                <p className="text-xs text-slate-500 mt-1">Multi-branch cafe chains aur franchise businesses ke liye.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {billingCycle === 'monthly' ? '₹1,999' : '₹1,599'}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Everything in Pro, plus:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Unlimited Branch / Outlets Switcher</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Central Warehouse Procurement & Raw Stock</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Cross-Branch Consolidated Financials</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Priority WhatsApp & Call Support 24x7</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" /> Custom Menu & Recipe Setup Assistance</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Enterprise')}
                className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Choose Enterprise
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 💬 7. REAL TESTIMONIALS FROM CAFE OWNERS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Trusted by 500+ Outlets
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Dekhein Dusre Cafe Owners Kya Keh Rahe Hain
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Pehle Swiggy aur Zomato ka commission kitna cut ho raha tha, mujhe andaza hi nahi lagta tha. CafePulse aane ke baad har order ka exact net bank settlement pata chalta hai. Mahine ke ₹7,000+ bach rahe hain!"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  VS
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Vikram Sharma</h5>
                  <p className="text-[11px] text-slate-500">The Chai Lab, Indore (2 Branches)</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Table QR ordering feature best hai! Customer table par baith ke direct order punch kar deta hai aur kitchen me bell bajti hai. Rush hour me waiter ka wait nahi karna padta."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  PP
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Pooja Patil</h5>
                  <p className="text-[11px] text-slate-500">Bean & Brew Cafe, Pune</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Recipe BOM stock deduction feature kamaal ka hai. Pizza bika toh cheese apne aap minus ho jati hai. Dukan ka doodh ya paneer chori hone ya waste hone ka tension khatam!"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  AK
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Ankit Khandelwal</h5>
                  <p className="text-[11px] text-slate-500">Crust & Crumbs, Jaipur</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ❓ 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
            Frequently Asked Questions (Aksar Puchhe Jane Wale Sawal)
          </h2>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
              <h4 className="text-sm font-bold text-slate-900">Kya yeh software phone ya tablet par chalega?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Haan! CafePulse 100% cloud aur responsive hai. Aap counter par laptop, billing tablet ya staff ke kisi bhi Android/iPhone se ise bina kisi app installation ke open kar sakte hain.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
              <h4 className="text-sm font-bold text-slate-900">Agar counter par internet chala jaye toh?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                CafePulse me built-in multi-tab offline persistence cache hai. Offline hone par bhi counter sales punch hoti hain aur internet aate hi automatic cloud me sync ho jati hain.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
              <h4 className="text-sm font-bold text-slate-900">Mere paas 2 cafe branches hain, kya main dono manage kar sakta hoon?</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Bilkul! Hamare Multi-Outlet feature ke zariye aap ek hi login se Branch 1 aur Branch 2 ke beech 1-click me switch kar sakte hain. Har branch ka data bilkul alag rahega.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={true} textLight={true} />
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-400">
              India's Premier All-in-One Cafe Operating System
            </span>
          </div>

          <div className="flex items-center space-x-5 text-[11px]">
            <button type="button" onClick={onLaunchDemo} className="hover:text-white cursor-pointer">Live Demo</button>
            <button type="button" onClick={onOpenLogin} className="hover:text-white cursor-pointer">Sign In</button>
            <button type="button" onClick={() => onOpenSignup()} className="hover:text-white cursor-pointer text-indigo-400 font-semibold">Register Cafe</button>
          </div>

          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} CafePulse Cloud POS. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

function XCircleIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
      ✕
    </span>
  );
}
