import React, { useState } from 'react';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Check,
  Copy,
  LogOut,
  Sparkles,
  QrCode,
  ChevronRight,
  ShieldCheck,
  Trash2,
  Lock,
  Printer,
  Receipt,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Server,
  KeyRound,
  FileCheck2,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';
import { updateCafeDetails, createAdditionalCafeOutlet } from '../utils/auth';

export default function CafeProfilePage({
  currentCafe,
  currentUser,
  allCafes = [],
  menuCount = 0,
  inventoryCount = 0,
  onSwitchCafe,
  onLogout,
  onUpdateCafe,
  onBackToPos,
  onResetToCleanSlate,
  onLoadCatalogPreset,
  showToast
}) {
  const cafeId = currentCafe?.cafeId || 'default';
  const ownerEmail = currentUser?.email || currentCafe?.ownerEmail || 'owner@cafepulse.in';
  const phone = currentCafe?.phone || '9826012345';

  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Editable fields
  const [editName, setEditName] = useState(currentCafe?.cafeName || '');
  const [editCity, setEditCity] = useState(currentCafe?.city || '');
  const [editAddress, setEditAddress] = useState(currentCafe?.address || '');
  const [editBusinessType, setEditBusinessType] = useState(
    currentCafe?.businessType || (currentCafe?.ownerEmail === 'kc@gmail.com' ? 'restaurant' : 'cafe')
  );
  const [editUpiId, setEditUpiId] = useState(currentCafe?.upiId || '');
  const [editFssai, setEditFssai] = useState(currentCafe?.fssai || '');
  const [editGstin, setEditGstin] = useState(currentCafe?.gstin || '');
  const [editFooterNote, setEditFooterNote] = useState(
    currentCafe?.billFooterNote || 'Thank you! Please visit again.'
  );

  // New Outlet Creation State
  const [isAddingOutlet, setIsAddingOutlet] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletCity, setNewOutletCity] = useState('');
  const [newOutletPhone, setNewOutletPhone] = useState('');

  // Clean Slate Confirmation
  const [isConfirmingCleanSlate, setIsConfirmingCleanSlate] = useState(false);
  const [cleanOptions, setCleanOptions] = useState({
    clearMenu: true,
    clearInventory: true,
    clearPurchases: true,
    clearWastage: true,
    clearSales: false
  });

  const customerQrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?cafe=${cafeId}&table=1`
    : '';

  const copyToClipboard = (text, type) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      // Note: phone and email are strictly non-editable, preserving verified credentials
      const updated = await updateCafeDetails(cafeId, {
        cafeName: editName.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        businessType: editBusinessType,
        upiId: editUpiId.trim(),
        fssai: editFssai.trim(),
        gstin: editGstin.trim(),
        billFooterNote: editFooterNote.trim()
      });

      if (onUpdateCafe && updated) {
        onUpdateCafe(updated);
      }
      setFeedback({ type: 'success', message: 'Profile & thermal billing configuration updated successfully!' });
      if (showToast) showToast('Profile details saved successfully');
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Update failed: ' + (err?.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;

    setLoading(true);
    try {
      const newOutlet = await createAdditionalCafeOutlet({
        cafeName: newOutletName.trim(),
        city: newOutletCity.trim(),
        phone: newOutletPhone.trim()
      });

      setFeedback({ type: 'success', message: `New branch outlet "${newOutlet.cafeName}" created successfully!` });
      setIsAddingOutlet(false);
      setNewOutletName('');
      setNewOutletCity('');
      setNewOutletPhone('');

      if (onSwitchCafe) {
        onSwitchCafe(newOutlet);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to create branch: ' + (err?.message || 'Error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* 🧭 Top Navigation & Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToPos}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 shadow-2xs"
            title="Return to POS Order Punching Station"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back to POS</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Cafe & Restaurant Profile
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage enterprise business credentials, thermal print settings, and branch outlets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={onBackToPos}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Open Punching Station</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 🌟 Profile Overview Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 p-0.5 shadow-2xl flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center font-black text-2xl sm:text-3xl text-indigo-300">
                {(editName || currentCafe?.cafeName || 'C').charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentCafe?.cafeName || 'Cafe Name'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs">
                  Pro Plan Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {currentCafe?.ownerName || currentUser?.displayName || 'Owner'}
                </span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {currentCafe?.city || 'Indore'}
                </span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cloud Synced
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Menu Items</div>
              <div className="text-lg font-black text-white">{menuCount}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Raw Stock</div>
              <div className="text-lg font-black text-white">{inventoryCount} items</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-300 font-semibold uppercase">Branch Outlets</div>
              <div className="text-lg font-black text-white">{allCafes?.length || 1} Total</div>
            </div>
          </div>
        </div>

        {/* Tenant ID & QR Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between bg-black/30 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 truncate mr-2">
              <KeyRound className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-300 font-semibold">Tenant ID:</span>
              <span className="font-mono text-indigo-200 font-bold truncate">{cafeId}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(cafeId, 'id')}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-black/30 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 truncate mr-2">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-semibold truncate">Table QR Order Link</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(customerQrUrl, 'url')}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shrink-0"
            >
              {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Edit Form + Right Outlets & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Form: Profile Settings (2 Columns on lg) */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
            
            {/* 1. General Business Profile */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Store className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  1. Business Identification
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cafe / Restaurant / Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="e.g. KC Grand Hotel & Restaurant"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This name appears on the top navbar, customer receipts, and digital KOTs.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Establishment Business Type
                  </label>
                  <select
                    value={editBusinessType}
                    onChange={(e) => setEditBusinessType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  >
                    <option value="restaurant">🍽️ Hotel & Family Restaurant (Dine-in, Handi, Tandoor & Thali)</option>
                    <option value="cafe">☕ Fast Food Cafe & Coffee Bar (Pizza, Burger, Shakes)</option>
                    <option value="bistro">🍸 Bistro, Lounge & Dhaba</option>
                    <option value="cloud_kitchen">🛵 Cloud Kitchen & Takeaway</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Customizes the POS layout, default recipe units, and thermal print formats.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Indore"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Commercial Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. Shop #4, Commercial Ring Road, Indore"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. Registered Owner Security Credentials (NON-EDITABLE) */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    2. Registered Security Credentials
                  </h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                  🔒 Locked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Non-editable Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Registered Mobile Number</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Non-editable
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      readOnly
                      disabled
                      aria-readonly="true"
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 font-mono font-bold cursor-not-allowed select-none opacity-90"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
                      Verified
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Primary mobile number registered with your CafePulse account. Cannot be modified directly.
                  </p>
                </div>

                {/* Non-editable Email */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Email Address</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Non-editable
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={ownerEmail}
                      readOnly
                      disabled
                      aria-readonly="true"
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 font-mono font-bold cursor-not-allowed select-none opacity-90"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      Primary ID
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Owner cloud authentication identity and secure database tenant partition key.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Thermal Receipt Printer, Taxes & UPI Settings */}
            <div className="pt-2">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Printer className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  3. Thermal Bill Printer, UPI & Tax Settings
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cafe UPI ID (Dynamic Scan-and-Pay QR)
                  </label>
                  <input
                    type="text"
                    value={editUpiId}
                    onChange={(e) => setEditUpiId(e.target.value)}
                    placeholder="e.g. 9826012345@upi or cafe@okaxis"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Generates a dynamic scan-and-pay UPI QR code at the bottom of thermal customer bills.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    FSSAI Food License Number
                  </label>
                  <input
                    type="text"
                    value={editFssai}
                    onChange={(e) => setEditFssai(e.target.value)}
                    placeholder="e.g. 11424850000123"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Printed prominently on customer invoices for legal food safety compliance.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    GSTIN (Tax Identification)
                  </label>
                  <input
                    type="text"
                    value={editGstin}
                    onChange={(e) => setEditGstin(e.target.value)}
                    placeholder="e.g. 23AABCK9988C1Z4"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Optional. Required if you are GST registered.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bill Footer Custom Message
                  </label>
                  <input
                    type="text"
                    value={editFooterNote}
                    onChange={(e) => setEditFooterNote(e.target.value)}
                    placeholder="e.g. Thank you! Visit again with family."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Custom thank-you message printed at the footer of customer receipts.</p>
                </div>
              </div>
            </div>

            {/* Save Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBackToPos}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Discard / Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>

          {/* 🍽️ Business Catalog Presets: Hotel & Restaurant vs Cafe */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Business Catalog Starter Packs
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1-Click starter packs for instant menu categories, recipes, and raw material stock.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Load Hotel & Family Restaurant starter pack? (25+ authentic Indian dishes, recipes, tandoori items & raw materials)')) {
                    onLoadCatalogPreset('hotel');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  (currentCafe?.businessType === 'restaurant' || (currentCafe?.ownerEmail || '').toLowerCase() === 'kc@gmail.com')
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      🍽️ Hotel & Family Restaurant
                    </span>
                    {(currentCafe?.businessType === 'restaurant' || (currentCafe?.ownerEmail || '').toLowerCase() === 'kc@gmail.com') && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Paneer Butter Masala, Dal Tadka, Tandoori Roti, Biryani, Thalis with complete gram recipes & raw materials.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 hover:underline">
                  Load Restaurant Catalog →
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Load Fast Food Cafe starter pack? (Pizzas, burgers, cold coffee, fries & beverages)')) {
                    onLoadCatalogPreset('cafe');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  (currentCafe?.businessType === 'cafe' && (currentCafe?.ownerEmail || '').toLowerCase() !== 'kc@gmail.com')
                    ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      ☕ Fast Food Cafe & Coffee Bar
                    </span>
                    {(currentCafe?.businessType === 'cafe' && (currentCafe?.ownerEmail || '').toLowerCase() !== 'kc@gmail.com') && (
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Margherita Pizza, Veg Cheese Burger, Thick Cold Coffee, French Fries with sauce recipes and cheese stock.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 hover:underline">
                  Load Cafe Catalog →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Outlets + Enterprise Infrastructure Badge */}
        <div className="space-y-5">
          
          {/* Branch Outlets Management */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Branch Outlets ({allCafes?.length || 1})
                </h4>
              </div>

              {!isAddingOutlet && (
                <button
                  type="button"
                  onClick={() => setIsAddingOutlet(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Branch</span>
                </button>
              )}
            </div>

            {/* Branch creation form */}
            {isAddingOutlet && (
              <form onSubmit={handleCreateOutlet} className="p-3 bg-slate-50 border border-indigo-200 rounded-2xl space-y-2.5 text-xs animate-in fade-in">
                <div className="font-bold text-slate-800">Add New Branch Outlet</div>
                <input
                  type="text"
                  placeholder="Branch Name (e.g. Branch 2 / Food Court)"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Contact No."
                    value={newOutletPhone}
                    onChange={(e) => setNewOutletPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Save Branch
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingOutlet(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Outlets List */}
            <div className="space-y-2">
              {(allCafes && allCafes.length > 0 ? allCafes : [currentCafe]).map((c, i) => {
                const isActive = (c.cafeId || c.id) === cafeId;
                return (
                  <button
                    key={c.cafeId || c.id || i}
                    type="button"
                    onClick={() => {
                      if (!isActive && onSwitchCafe) {
                        onSwitchCafe(c);
                        if (showToast) showToast(`Switched to: ${c.cafeName}`);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">{c.cafeName}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {c.city || 'Main Outlet'} • ID: {c.cafeId || c.id}
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="text-[10px] font-bold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-indigo-600 font-bold flex items-center gap-0.5 shrink-0 hover:underline">
                        Switch <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🏢 Enterprise Product-Level Security & Infrastructure Status */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Cloud Infrastructure
                </h4>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  ● Multi-Tenant Isolated DB
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3 h-3 text-indigo-400" />
                    Partition Isolation
                  </span>
                  <span className="text-emerald-400">Zero-Leakage</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Tenant records are segregated at the database schema layer with authenticated owner tokens.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-indigo-400" />
                    Encryption Standard
                  </span>
                  <span className="text-indigo-300 font-mono">AES-256</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Real-time sales receipts, cash ledger and procurement synced with end-to-end transport layer security.
                </p>
              </div>
            </div>
          </div>

          {/* 🧹 Clear Demo Data (Clean Slate Option) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Production Onboarding (Reset Data)
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If you tested with sample pizzas or burgers, you can clear demo items to start fresh with your original menu and recipe catalog.
            </p>

            {!isConfirmingCleanSlate ? (
              <button
                type="button"
                onClick={() => setIsConfirmingCleanSlate(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Wipe Demo Data (Clean Slate)</span>
              </button>
            ) : (
              <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-3 text-xs animate-in fade-in">
                <div className="font-bold text-amber-950">Confirm Data Reset</div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[11px] text-amber-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearMenu}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearMenu: e.target.checked }))}
                      className="rounded text-amber-600"
                    />
                    <span>Wipe Menu Items & Categories</span>
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-amber-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearInventory}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearInventory: e.target.checked }))}
                      className="rounded text-amber-600"
                    />
                    <span>Wipe Raw Material Inventory</span>
                  </label>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onResetToCleanSlate) {
                        onResetToCleanSlate(cleanOptions);
                        setIsConfirmingCleanSlate(false);
                      }
                    }}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Confirm Wipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingCleanSlate(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session Logout Action */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-600 truncate mr-2">
              <span>Account: </span>
              <strong className="text-slate-900 font-mono">{ownerEmail}</strong>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
