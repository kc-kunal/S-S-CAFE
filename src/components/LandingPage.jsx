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
  FileSpreadsheet
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function LandingPage({
  onOpenLogin,
  onOpenSignup,
  onLaunchDemo
}) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950 overflow-x-hidden">
      
      {/* 🌟 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <a href="#" className="cursor-pointer">
            <BrandLogo size="md" showText={true} textLight={true} />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold text-stone-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">Software Features</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">Plans & Pricing</a>
            <a href="#aggregator" className="hover:text-amber-400 transition-colors">Swiggy & Zomato</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">FAQs</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Demo Button */}
            <button
              type="button"
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-950/30"
              title="Test the complete POS live with sample data"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline sm:inline">Live Demo</span>
              <span className="xs:hidden sm:hidden">Demo</span>
            </button>

            {/* Sign In Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>

            {/* Start Free Trial Button */}
            <button
              type="button"
              onClick={() => onOpenSignup()}
              className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 fill-stone-950 text-stone-950" />
              <span className="hidden sm:inline">Register Cafe</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </div>

        </div>
      </header>

      {/* 🚀 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Cloud POS & Kitchen ERP for Modern Cafes & QSRs</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-serif-title tracking-tight text-stone-100 max-w-4xl mx-auto leading-[1.15]">
            Apne Cafe Ka Har Ek Paisa, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
              Payout & Stock Track Karein
            </span>
            — Bina Kisi Confusion Ke.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Multi-Item Counter Orders, Swiggy & Zomato Weekly Settlements, Recipe-Linked Raw Material Stock, Table QR Contactless Ordering aur Real Net Profit — sab kuch ek hi dashboard par live chalayein.
          </p>

          {/* Hero CTA Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onOpenSignup()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform transform hover:scale-105 active:scale-95"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={onLaunchDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-500/40 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform transform hover:scale-105"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          <p className="mt-3 text-[11px] text-stone-500">
            No credit card needed • Instant 1-minute setup • Cloud sync enabled
          </p>

          {/* ⚡ Highlights / Trust Badges Bar */}
          <div className="mt-14 pt-8 border-t border-stone-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="bg-stone-900/60 border border-stone-800/90 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">10-Sec POS Billing</h4>
                <p className="text-[11px] text-stone-400">Cash, UPI & Token numbers</p>
              </div>
            </div>

            <div className="bg-stone-900/60 border border-stone-800/90 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">Swiggy & Zomato Payout</h4>
                <p className="text-[11px] text-stone-400">Commission & Bank Ledger</p>
              </div>
            </div>

            <div className="bg-stone-900/60 border border-stone-800/90 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">Recipe Inventory BOM</h4>
                <p className="text-[11px] text-stone-400">Gram-level stock deduction</p>
              </div>
            </div>

            <div className="bg-stone-900/60 border border-stone-800/90 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-200">Multi-Device Live Sync</h4>
                <p className="text-[11px] text-stone-400">Mobile, Tablet & PC ready</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 📦 3. SOFTWARE FEATURES & JANKARI SECTION */}
      <section id="features" className="py-20 bg-stone-900/40 border-y border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Complete POS & ERP Ecosystem
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-title text-stone-100 mt-3">
              Cafe Chalane Ke Liye Jo Kuch Chahiye — Sab In-Built Hai
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-2">
              Bina kisi technical knowledge ke, counter rush hour me bhi bina ruke sales aur stock control karein.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Multi-Item Counter POS Station</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Counter par ek customer agar 3 alag items leta hai, toh ek hi Order ID aur Token me punch karein. Cash (Emerald Green) aur UPI (Sky Blue) ke dynamic visual themes.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Token & Daily Order Sequence</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Category-Wise Visual Menu Cards</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> 1-Tap Cash & UPI Quick Punch</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div id="aggregator" className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-rose-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Swiggy & Zomato Payout Ledger</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Aggregators kitna commission kaat rahe hain aur bank account me pending kitna bacha hai? Exact ₹160 gross vs ₹140 net payout transparency dashboard.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-400" /> Platform Order ID & Offer Discounts</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-400" /> Weekly Settlement Reconciliation</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-rose-400" /> Swiggy Orange & Zomato Red Modes</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Recipe-Linked Inventory BOM</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Margarita Pizza sell hote hi Pizza Base, 50g Mozzarella Cheese aur 25g Sauce inventory se auto-deduct hoti hai. Stock khatam hone par automatic alert!
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Gram & Liter Level Consumption</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Automated Telegram / WhatsApp Alert</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Low Stock Reorder Notifications</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-amber-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Contactless QR Table Ordering</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Har table par apna QR code rakhein. Customer table par baithe-baithe order punch karega aur counter par chime sound ke saath live notification aayega.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Table-Wise Unique Ordering Link</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> Kitchen Buzzer Sound Chime</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400" /> 1-Tap Bill Settlement to Daily Sales</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-purple-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Daily P&L, Spoilage & Bills</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Dukan ka kiraya, bijli bill, cylinder, staff salary aur phata hua doodh (wastage) track karke real Net Profit calculate karein.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Overhead Bills & Expenses Tracker</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Raw Material Wastage Logs</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400" /> Accurate Daily & Monthly Profit/Loss</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-stone-900/70 border border-stone-800 p-6 rounded-3xl hover:border-sky-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">Multi-Outlet & Multi-Device Sync</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Ek hi account ke andar Branch 1 aur Branch 2 switch karein. Phone par baith kar dukan ki live counter sales dekhein.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> 1-Click Outlet / Branch Switcher</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Multi-Tenant Cloud Encrypted Data</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sky-400" /> Weekly / Monthly Excel (.xlsx) Reports</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 🚀 4. INTERACTIVE LIVE DEMO CALLOUT BANNER */}
      <section className="py-14 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-stone-900/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Live Playground</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-serif-title">
            Bina Account Banaye Software Test Karna Chahte Hain?
          </h3>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-xl mx-auto">
            1-Click me live demo open karein. Sample pizzas, burgers, daily sales logs aur stock deduction abhi explore karein!
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={onLaunchDemo}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/30 inline-flex items-center gap-2 cursor-pointer transition-transform transform hover:scale-105"
            >
              <Eye className="w-4 h-4 stroke-[2.5]" />
              <span>Launch Live Interactive Demo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 💳 5. SUBSCRIPTION PLANS & PRICING */}
      <section id="pricing" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Affordable & Simple Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-serif-title text-stone-100 mt-3">
              Chhote Se Lekar Bade Cafe Tak — Sahi Plan Chunein
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-2">
              Har plan me 14-Day Free Trial shaamil hai. Jab pasand aaye tabhi continue karein.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-6 inline-flex items-center p-1 bg-stone-900 border border-stone-800 rounded-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-extrabold border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Plan 1: Starter */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-7 flex flex-col justify-between hover:border-stone-700 transition-all">
              <div>
                <h3 className="text-lg font-bold text-stone-200">Starter Kiosk Plan</h3>
                <p className="text-xs text-stone-400 mt-1">Single counter chai/coffee outlets aur street stalls ke liye.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-stone-100">
                    {billingCycle === 'monthly' ? '₹499' : '₹399'}
                  </span>
                  <span className="text-xs text-stone-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-800 space-y-3 text-xs text-stone-300">
                  <p className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">What's included:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Fast Counter POS Punching</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Cash & UPI Payment Modes</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Menu Catalog & Recipes</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Basic Inventory Tracker</div>
                  <div className="flex items-center gap-2.5 text-stone-500"><XCircleIcon /> Swiggy/Zomato Ledger</div>
                  <div className="flex items-center gap-2.5 text-stone-500"><XCircleIcon /> Multi-Device Cloud Sync</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Starter Kiosk')}
                className="mt-8 w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-stone-700"
              >
                Start Starter Trial
              </button>
            </div>

            {/* Plan 2: Pro Growth (POPULAR) */}
            <div className="bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500 rounded-3xl p-7 flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-extrabold text-[11px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                ⭐ Most Popular Choice
              </div>

              <div>
                <h3 className="text-xl font-bold text-amber-200">Pro Cafe Growth Plan</h3>
                <p className="text-xs text-stone-400 mt-1">Busy cafes, restaurants aur cloud kitchens ke liye best.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-amber-400">
                    {billingCycle === 'monthly' ? '₹999' : '₹799'}
                  </span>
                  <span className="text-xs text-stone-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-800 space-y-3 text-xs text-stone-200">
                  <p className="font-semibold text-amber-300 uppercase tracking-wider text-[10px]">Everything in Starter, plus:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Swiggy & Zomato Payout Dashboard</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Recipe BOM Real-Time Stock Deduction</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Contactless Table QR Ordering & Chime</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Devices Live Cloud Sync</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Daily Overhead Bills & Spoilage Tracker</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Weekly & Monthly Excel (.xlsx) Reports</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Pro Growth')}
                className="mt-8 w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/30 transition-transform transform hover:scale-102 cursor-pointer"
              >
                Start 14-Day Free Pro Trial
              </button>
            </div>

            {/* Plan 3: Enterprise Multi-Outlet */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-7 flex flex-col justify-between hover:border-stone-700 transition-all">
              <div>
                <h3 className="text-lg font-bold text-stone-200">Enterprise Multi-Outlet</h3>
                <p className="text-xs text-stone-400 mt-1">Multi-branch cafe chains aur franchise businesses ke liye.</p>
                
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-stone-100">
                    {billingCycle === 'monthly' ? '₹1,999' : '₹1,599'}
                  </span>
                  <span className="text-xs text-stone-500">/ month</span>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-800 space-y-3 text-xs text-stone-300">
                  <p className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">Everything in Pro, plus:</p>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Unlimited Branch / Outlets Switcher</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Central Warehouse Procurement & Raw Stock</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Cross-Branch Consolidated Financials</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Priority WhatsApp & Call Support 24x7</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Custom Menu & Recipe Setup Assistance</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenSignup('Enterprise')}
                className="mt-8 w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition-all cursor-pointer border border-stone-700"
              >
                Choose Enterprise
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ❓ 6. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-16 bg-stone-900/30 border-t border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-serif-title text-center text-stone-100 mb-8">
            Frequently Asked Questions (Aksar Puchhe Jane Wale Sawal)
          </h2>

          <div className="space-y-4">
            <div className="bg-stone-900/80 border border-stone-800 p-4 sm:p-5 rounded-2xl">
              <h4 className="text-sm font-bold text-amber-300">Kya yeh software phone ya tablet par chalega?</h4>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                Haan! CafePulse 100% cloud aur responsive hai. Aap counter par laptop, billing tablet ya staff ke kisi bhi Android/iPhone se ise bina kisi app installation ke open kar sakte hain.
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 p-4 sm:p-5 rounded-2xl">
              <h4 className="text-sm font-bold text-amber-300">Agar counter par internet chala jaye toh?</h4>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                CafePulse me built-in multi-tab offline persistence cache hai. Offline hone par bhi counter sales punch hoti hain aur internet aate hi automatic cloud me sync ho jati hain.
              </p>
            </div>

            <div className="bg-stone-900/80 border border-stone-800 p-4 sm:p-5 rounded-2xl">
              <h4 className="text-sm font-bold text-amber-300">Mere paas 2 cafe branches hain, kya main dono manage kar sakta hoon?</h4>
              <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                Bilkul! Hamare Multi-Outlet feature ke zariye aap ek hi login se Branch 1 aur Branch 2 ke beech 1-click me switch kar sakte hain. Har branch ka data bilkul alag rahega.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 7. FOOTER */}
      <footer className="bg-stone-950 text-stone-500 py-10 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={true} textLight={true} />
            <span className="text-stone-600 hidden sm:inline">|</span>
            <span className="text-[11px] text-stone-500">
              India's Premier All-in-One Cafe Operating System
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button type="button" onClick={onLaunchDemo} className="hover:text-amber-400 cursor-pointer">Live Demo</button>
            <button type="button" onClick={onOpenLogin} className="hover:text-amber-400 cursor-pointer">Sign In</button>
            <button type="button" onClick={() => onOpenSignup()} className="hover:text-amber-400 cursor-pointer text-amber-400 font-semibold">Register Cafe</button>
          </div>

          <p className="text-stone-600 text-[11px]">
            © {new Date().getFullYear()} CafePulse POS. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}

function XCircleIcon() {
  return (
    <span className="w-4 h-4 rounded-full bg-stone-800 flex items-center justify-center text-[10px] text-stone-600 font-bold shrink-0">
      ✕
    </span>
  );
}
