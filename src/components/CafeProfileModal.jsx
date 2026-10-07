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
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { updateCafeDetails, createAdditionalCafeOutlet } from '../utils/auth';

export default function CafeProfileModal({
  isOpen,
  onClose,
  currentCafe,
  currentUser,
  allCafes = [],
  onSwitchCafe,
  onLogout,
  onUpdateCafe
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingOutlet, setIsAddingOutlet] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Edit fields
  const [editName, setEditName] = useState(currentCafe?.cafeName || '');
  const [editPhone, setEditPhone] = useState(currentCafe?.phone || '');
  const [editCity, setEditCity] = useState(currentCafe?.city || '');
  const [editAddress, setEditAddress] = useState(currentCafe?.address || '');

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
    try {
      const updated = await updateCafeDetails(cafeId, {
        cafeName: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        address: editAddress.trim()
      });
      if (updated && onUpdateCafe) {
        onUpdateCafe(updated);
      }
      setIsEditing(false);
      setFeedback('✅ Cafe details updated successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error(err);
      setFeedback('❌ Error updating details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    if (!newOutletName.trim()) return;
    setLoading(true);
    try {
      const newOutlet = await createAdditionalCafeOutlet(currentUser?.uid || cafeId, {
        cafeName: newOutletName,
        city: newOutletCity,
        phone: newOutletPhone
      });
      setFeedback(`🎉 New outlet "${newOutlet.cafeName}" created!`);
      setIsAddingOutlet(false);
      setNewOutletName('');
      setNewOutletCity('');
      setNewOutletPhone('');
      if (onSwitchCafe) {
        onSwitchCafe(newOutlet);
      }
    } catch (err) {
      console.error(err);
      setFeedback('❌ Could not create outlet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl shadow-stone-950/80 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-stone-900 p-6 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight font-serif-title">
                {currentCafe?.cafeName || 'My Cafe'}
              </h2>
              <p className="text-xs text-amber-100/80 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Active Multi-Tenant Cafe Profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-amber-200/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs font-semibold text-center">
            {feedback}
          </div>
        )}

        <div className="p-6 space-y-6">

          {/* Current Cafe Quick Info Card */}
          {!isEditing ? (
            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-amber-200">{currentCafe?.cafeName}</h3>
                  <p className="text-xs text-stone-400">
                    Owner: {currentCafe?.ownerName || currentUser?.displayName || 'Owner'} ({currentUser?.email || currentCafe?.ownerEmail})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl border border-stone-700 cursor-pointer transition-colors"
                >
                  Edit Info
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-stone-400 pt-1 border-t border-stone-800/80">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentCafe?.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentCafe?.city || 'No city set'}</span>
                </div>
              </div>

              {/* Cafe ID & QR Code link */}
              <div className="pt-2 border-t border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between bg-stone-900 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-stone-400 truncate mr-2">
                    <span className="font-semibold text-stone-300 shrink-0">Cafe ID:</span>
                    <span className="font-mono text-[11px] text-amber-300 truncate">{cafeId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cafeId, 'id')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-stone-900 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 text-stone-400 truncate mr-2">
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate text-stone-300">Customer Table Ordering Link</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customerQrUrl, 'url')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Edit Cafe Profile</h4>
              
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">Cafe / Brand Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-400 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-400 mb-1">Full Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Outlets & Multi-Cafe Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  Aapke Cafes & Branches ({allCafes.length || 1})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Switch karne ke liye branch par click karein.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingOutlet(!isAddingOutlet)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Naya Branch Add Karein</span>
              </button>
            </div>

            {/* Add Outlet Form */}
            {isAddingOutlet && (
              <form onSubmit={handleCreateOutlet} className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-4 mb-3 space-y-3 animate-fadeIn">
                <h5 className="text-xs font-bold text-amber-300">Naye Outlet / Branch Ki Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Branch Name (e.g. S&S Cafe 2)"
                    required
                    className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="City / Area"
                    className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    value={newOutletPhone}
                    onChange={(e) => setNewOutletPhone(e.target.value)}
                    placeholder="Contact Number"
                    className="px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Branch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingOutlet(false)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl cursor-pointer"
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
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : 'bg-stone-950/50 border-stone-800/80 hover:bg-stone-800/60 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isActive ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-100">{c.cafeName}</span>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {c.city ? `${c.city} • ` : ''}ID: {c.cafeId || c.id}
                        </p>
                      </div>
                    </div>

                    {!isActive && (
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5">
                        Switch <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Logged in as: <strong className="text-stone-300">{currentUser?.email || 'Cafe Admin'}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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
