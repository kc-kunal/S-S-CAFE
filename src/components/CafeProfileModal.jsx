import React, { useState } from 'react';
import {
  Store,
  User,
  Phone,
  MapPin,
  Plus,
  Check,
  Copy,
  LogOut,
  X,
  Sparkles,
  QrCode,
  ChevronRight,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Lock,
  Printer,
  Receipt,
  UtensilsCrossed,
  Coffee,
  CheckCircle2
} from 'lucide-react';
import { updateCafeDetails, createAdditionalCafeOutlet } from '../utils/auth';

export default function CafeProfileModal({
  isOpen,
  onClose,
  currentCafe,
  currentUser,
  allCafes = [],
  menuCount = 0,
  inventoryCount = 0,
  onSwitchCafe,
  onLogout,
  onUpdateCafe,
  onResetToCleanSlate,
  onLoadCatalogPreset
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingOutlet, setIsAddingOutlet] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Clean Slate State
  const [isConfirmingCleanSlate, setIsConfirmingCleanSlate] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanOptions, setCleanOptions] = useState({
    clearMenu: true,
    clearInventory: true,
    clearPurchases: true,
    clearWastage: true,
    clearSales: false
  });

  // Edit fields
  const [editName, setEditName] = useState(currentCafe?.cafeName || '');
  const [editPhone, setEditPhone] = useState(currentCafe?.phone || '');
  const [editCity, setEditCity] = useState(currentCafe?.city || '');
  const [editAddress, setEditAddress] = useState(currentCafe?.address || '');
  const [editBusinessType, setEditBusinessType] = useState(
    currentCafe?.businessType || (currentCafe?.ownerEmail === 'kc@gmail.com' ? 'restaurant' : 'cafe')
  );
  const [editUpiId, setEditUpiId] = useState(currentCafe?.upiId || '');
  const [editFssai, setEditFssai] = useState(currentCafe?.fssai || '');
  const [editGstin, setEditGstin] = useState(currentCafe?.gstin || '');
  const [editFooterNote, setEditFooterNote] = useState(currentCafe?.billFooterNote || 'Thank you! Please visit again.');
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  // New outlet fields
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletCity, setNewOutletCity] = useState('');
  const [newOutletPhone, setNewOutletPhone] = useState('');

  if (!isOpen) return null;

  const cafeId = currentCafe?.cafeId || 'default';
  const customerQrUrl = `${window.location.origin}${window.location.pathname}?cafe=${cafeId}&table=1`;

  const copyToClipboard = (text, type) => {
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
    setFeedback('');

    try {
      const updated = await updateCafeDetails(cafeId, {
        cafeName: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        businessType: editBusinessType,
        upiId: editUpiId.trim(),
        fssai: editFssai.trim(),
        gstin: editGstin.trim(),
        billFooterNote: editFooterNote.trim()
      });

      if (onUpdateCafe) onUpdateCafe(updated);
      setFeedback('✅ Cafe details kamiyabi se update ho gayi!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setFeedback('❌ Update karne me dikkat aayi: ' + (err?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;

    setLoading(true);
    setFeedback('');

    try {
      const newOutlet = await createAdditionalCafeOutlet({
        cafeName: newOutletName.trim(),
        city: newOutletCity.trim(),
        phone: newOutletPhone.trim()
      });

      setFeedback(`🎉 Naya branch "${newOutlet.cafeName}" add ho gaya!`);
      setIsAddingOutlet(false);
      setNewOutletName('');
      setNewOutletCity('');
      setNewOutletPhone('');

      if (onSwitchCafe) {
        onSwitchCafe(newOutlet);
      }
    } catch (err) {
      console.error(err);
      setFeedback('❌ Branch banane me dikkat: ' + (err?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {currentCafe?.cafeName || 'My Cafe'}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active Multi-Tenant Cafe Profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="m-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-semibold text-center">
            {feedback}
          </div>
        )}

        <div className="p-6 space-y-6">

          {/* Current Cafe Quick Info Card */}
          {!isEditing ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentCafe?.cafeName}</h3>
                  <p className="text-xs text-slate-500">
                    Owner: {currentCafe?.ownerName || currentUser?.displayName || 'Owner'} ({currentUser?.email || currentCafe?.ownerEmail})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer transition-colors shadow-xs"
                >
                  Edit Info
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{currentCafe?.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{currentCafe?.city || 'No city set'}</span>
                </div>
              </div>

              {/* Bill & Tax Settings Preview */}
              {(currentCafe?.upiId || currentCafe?.fssai || currentCafe?.gstin) && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
                  {currentCafe?.upiId && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-700">UPI QR:</span>
                      <span className="truncate text-indigo-700 font-mono font-medium">{currentCafe.upiId}</span>
                    </div>
                  )}
                  {currentCafe?.fssai && (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-700">FSSAI:</span>
                      <span className="truncate text-slate-800">{currentCafe.fssai}</span>
                    </div>
                  )}
                  {currentCafe?.gstin && (
                    <div className="flex items-center gap-1.5 truncate col-span-2">
                      <span className="font-semibold text-slate-700">GSTIN:</span>
                      <span className="truncate text-slate-800">{currentCafe.gstin}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Cafe ID & QR Code link */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate mr-2">
                    <span className="font-semibold text-slate-700 shrink-0">Cafe ID:</span>
                    <span className="font-mono text-[11px] text-indigo-600 font-bold truncate">{cafeId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cafeId, 'id')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 truncate mr-2">
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate text-slate-700 font-medium">Customer Table Ordering Link</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customerQrUrl, 'url')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Edit Cafe Profile</h4>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cafe / Brand Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Business Establishment Type</label>
                <select
                  value={editBusinessType}
                  onChange={(e) => setEditBusinessType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="restaurant">🍽️ Hotel & Family Restaurant (Dine-in, Handi, Tandoor & Thali)</option>
                  <option value="cafe">☕ Fast Food Cafe & Coffee Bar (Pizza, Burger, Shakes)</option>
                  <option value="bistro">🍸 Bistro, Lounge & Dhaba</option>
                  <option value="cloud_kitchen">🛵 Cloud Kitchen & Takeaway</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">Optimizes your bill headers, KOT format and POS experience</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Thermal Bill Printer & UPI Settings */}
              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Thermal Bill Printer & UPI Settings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cafe UPI ID (Bill QR Code)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. cafe@okaxis or 9876543210@upi"
                      value={editUpiId}
                      onChange={(e) => setEditUpiId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Prints dynamic UPI scan & pay QR on bills</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      FSSAI License No.
                    </label>
                    <input
                      type="text"
                      placeholder="14-digit FSSAI Lic. No."
                      value={editFssai}
                      onChange={(e) => setEditFssai(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bill Footer Message
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thank you! Visit Again."
                      value={editFooterNote}
                      onChange={(e) => setEditFooterNote(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* 🍽️ Business Catalog Presets: Hotel & Restaurant vs Cafe */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-blue-50/40 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">
                      Business Type & Starter Catalog Presets
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (currentCafe?.businessType === 'restaurant' || currentCafe?.ownerEmail === 'kc@gmail.com')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                    }`}>
                      {(currentCafe?.businessType === 'restaurant' || currentCafe?.ownerEmail === 'kc@gmail.com') ? '🍽️ Hotel & Restaurant Active' : '☕ Fast Food Cafe Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Ye software Cafe ke sath sath Hotel aur Family Dine-in Restaurants ke liye bhi poori tarah ready hai! Aap 1-click me restaurant ka ready-made menu, recipes aur raw material stock load kar sakte hain.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Catalog Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-indigo-100">
              <button
                type="button"
                disabled={isApplyingPreset}
                onClick={async () => {
                  if (window.confirm('Kya aap Hotel & Family Restaurant Starter Pack load karna chahte hain? Isme Paneer Butter Masala, Dal Makhani, Tandoori Breads, Dum Biryani, Thali, Recipes aur Raw Material Stock set ho jayega.')) {
                    setIsApplyingPreset(true);
                    try {
                      if (onLoadCatalogPreset) {
                        await onLoadCatalogPreset('hotel');
                      }
                      setFeedback('🍽️ Hotel & Family Restaurant Catalog (25+ Dishes, Recipes & Stock) successfully load ho gaya!');
                    } catch (e) {
                      setFeedback('❌ Error loading preset: ' + e.message);
                    } finally {
                      setIsApplyingPreset(false);
                    }
                  }
                }}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Load Hotel & Restaurant Pack</span>
              </button>

              <button
                type="button"
                disabled={isApplyingPreset}
                onClick={async () => {
                  if (window.confirm('Kya aap Fast Food Cafe Starter Pack load karna chahte hain? Isme Pizzas, Burgers, Fries, Cold Coffee aur Cafe Raw Materials set ho jayenge.')) {
                    setIsApplyingPreset(true);
                    try {
                      if (onLoadCatalogPreset) {
                        await onLoadCatalogPreset('cafe');
                      }
                      setFeedback('☕ Fast Food Cafe Catalog (Pizzas, Burgers & Shakes) successfully load ho gaya!');
                    } catch (e) {
                      setFeedback('❌ Error loading preset: ' + e.message);
                    } finally {
                      setIsApplyingPreset(false);
                    }
                  }
                }}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50"
              >
                <Coffee className="w-4 h-4" />
                <span>Load Fast Food Cafe Pack</span>
              </button>
            </div>
          </div>

          {/* 🧹 Production Clean Slate / Clear Demo Data Card */}
          <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/50 to-amber-50/40 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">
                      Production Clean Slate (Remove Demo Data)
                    </h4>
                    <span className="text-[10px] bg-amber-200/90 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Real Cafe Testing
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Agar aap apne dost ke cafe ke liye real testing kar rahe hain, toh sample demo stock aur starter recipes yahan se 1-click me remove karke blank slate shuru karein.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats: Menu items & Inventory items count */}
            <div className="grid grid-cols-2 gap-2 bg-white/90 border border-amber-200/70 rounded-xl p-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] text-slate-500 font-medium">Menu Catalog:</span>
                <span className="font-bold text-slate-900 font-mono">{menuCount} items</span>
              </div>
              <div className="flex items-center justify-between px-2 border-l border-amber-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Raw Materials:</span>
                <span className="font-bold text-slate-900 font-mono">{inventoryCount} items</span>
              </div>
            </div>

            {!isConfirmingCleanSlate ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/50">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Aapka account data 100% isolated aur private hai</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfirmingCleanSlate(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clean Slate Shuru Karein</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-amber-300 rounded-xl p-3.5 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Kripya select karein kya kya remove karna hai:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearMenu}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearMenu: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold">Demo Menu & Recipes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearInventory}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearInventory: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold">Demo Stock / Raw Materials</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearPurchases}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearPurchases: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold">Demo Purchases & Wastage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={cleanOptions.clearSales}
                      onChange={(e) => setCleanOptions(prev => ({ ...prev, clearSales: e.target.checked }))}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold">Clear Sales History Too</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={cleanLoading}
                    onClick={async () => {
                      setCleanLoading(true);
                      try {
                        if (onResetToCleanSlate) {
                          await onResetToCleanSlate(cleanOptions);
                        }
                        setIsConfirmingCleanSlate(false);
                        setFeedback('🎉 Clean Slate successful! Saara demo stock aur recipes hat gaye. Ab aap apna original menu aur stock daal sakte hain.');
                      } catch (err) {
                        setFeedback('❌ Error resetting demo data: ' + (err?.message || 'Error'));
                      } finally {
                        setCleanLoading(false);
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {cleanLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{cleanLoading ? 'Wiping Demo Items...' : 'Haan, Demo Data Hata Kar Blank Slate Karein'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={cleanLoading}
                    onClick={() => setIsConfirmingCleanSlate(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Outlets & Multi-Cafe Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Aapke Cafes & Branches ({allCafes.length || 1})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Switch karne ke liye branch par click karein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingOutlet(!isAddingOutlet)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Naya Branch Add Karein</span>
              </button>
            </div>

            {/* Add Outlet Form */}
            {isAddingOutlet && (
              <form onSubmit={handleCreateOutlet} className="bg-slate-50 border border-indigo-200 rounded-2xl p-4 mb-3 space-y-3 animate-fadeIn">
                <h5 className="text-xs font-bold text-indigo-700">Naye Outlet / Branch Ki Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Branch Name (e.g. Branch 2)"
                    required
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <input
                    type="text"
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="City / Area"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <input
                    type="tel"
                    value={newOutletPhone}
                    onChange={(e) => setNewOutletPhone(e.target.value)}
                    placeholder="Contact Number"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Branch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingOutlet(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Outlets */}
            <div className="space-y-2">
              {allCafes.map((c) => {
                const isActive = (c.cafeId || c.id) === cafeId;
                return (
                  <button
                    key={c.cafeId || c.id || Math.random()}
                    type="button"
                    onClick={() => {
                      if (!isActive && onSwitchCafe) {
                        onSwitchCafe(c);
                        onClose();
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{c.cafeName}</span>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {c.city ? `${c.city} • ` : ''}ID: {c.cafeId || c.id}
                        </p>
                      </div>
                    </div>

                    {!isActive && (
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5">
                        Switch <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🛡️ Data Privacy & Free Trial Guarantee Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950">Data Security & Free Trial Guarantee</span>
                <span className="text-[10px] bg-emerald-200/90 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  100% Private
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/85 leading-relaxed">
                Aapke account (<span className="font-semibold text-emerald-950 font-mono">{currentUser?.email || currentCafe?.ownerEmail || 'kc9998008@gmail.com'}</span>) ka data kisi dusre cafe ya user ke paas <strong>kabhi nahi jata</strong>. Multi-tenant architecture me har cafe ka storage aur cloud database completely isolated hota hai. Free trial me data <strong>kahi delete ya expire nahi hota</strong>, hamesha safe rehta hai.
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Logged in as: <strong className="text-slate-800">{currentUser?.email || 'Cafe Admin'}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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
