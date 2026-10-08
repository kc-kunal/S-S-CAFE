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
    setFeedback('');

    try {
      const updated = await updateCafeDetails(cafeId, {
        cafeName: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim(),
        address: editAddress.trim()
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
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
