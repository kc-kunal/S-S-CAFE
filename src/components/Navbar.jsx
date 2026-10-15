import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Store,
  LogIn,
  ChevronDown,
  LogOut,
  Eye,
  ShieldCheck,
  Bot,
  Lock,
  Unlock,
  User
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({
  currentCafe,
  currentUser,
  isDemoMode = false,
  onOpenAuthModal,
  onOpenCafeProfileModal,
  onOpenProfilePage,
  onOpenAlertSettings,
  onExitDemo,
  onLogout,
  isStaffMode = false,
  onLockToStaffMode,
  onPromptUnlockStaffMode
}) {
  const cafeName = currentCafe?.cafeName || 'S&S Cafe';
  const ownerName = currentCafe?.ownerName || currentUser?.displayName || 'Owner';
  const ownerEmail = currentUser?.email || currentCafe?.ownerEmail || 'owner@cafepulse.in';

  // State for Profile Dropdown (opens on hover and click)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(false);
    if (onOpenProfilePage) {
      onOpenProfilePage();
    } else if (onOpenCafeProfileModal) {
      onOpenCafeProfileModal();
    }
  };

  const handleTelegramClick = () => {
    setDropdownOpen(false);
    if (onOpenAlertSettings) {
      onOpenAlertSettings();
    }
  };

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    if (currentUser) {
      if (onLogout) onLogout();
    } else if (isDemoMode) {
      if (onExitDemo) onExitDemo();
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 sticky top-0 z-30 shadow-md border-b border-slate-800 backdrop-blur-md bg-slate-900/95">
      
      {/* ⚠️ Demo Mode Notice Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1 text-center text-xs font-extrabold flex items-center justify-center gap-2 shadow-inner">
          <Eye className="w-3.5 h-3.5" />
          <span>Interactive Live Demo Mode — Exploring with sample cafe data.</span>
          <button
            type="button"
            onClick={() => onOpenAuthModal && onOpenAuthModal('signup')}
            className="ml-2 underline font-black hover:text-white cursor-pointer"
          >
            Create Real Cafe Account
          </button>
          <span className="opacity-60">•</span>
          <button
            type="button"
            onClick={onExitDemo}
            className="text-[11px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            Exit Demo
          </button>
        </div>
      )}

      <div className="w-full px-2.5 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">

        {/* Brand Logo & Active Cafe Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          
          {/* Software Logo */}
          <div className="shrink-0">
            <BrandLogo size="sm" showText={false} textLight={true} />
          </div>

          <div className="h-6 w-px bg-slate-800 hidden xs:block" />

          {/* Active Cafe Brand */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                {cafeName}
              </h1>
              
              {/* Outlet / Branch Switcher Badge */}
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex items-center gap-1 text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors shrink-0 cursor-pointer"
                title="Switch Outlet / View Cafe Profile"
              >
                <span>{currentCafe?.city || 'Main'}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-indigo-400 inline" />
              <span>
                {ownerName}'s {(currentCafe?.businessType === 'restaurant' || (currentCafe?.ownerEmail || '').toLowerCase() === 'kc@gmail.com') ? 'Hotel & Restaurant POS' : 'Cafe POS'}
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isDemoMode ? 'Demo Active' : 'Live Sync'}
              </span>
            </p>
          </div>
        </div>

        {/* Clean Header Right: Staff Toggle + Profile Dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">

          {/* 🔒 Staff Mode / Owner Mode Toggle */}
          <button
            type="button"
            onClick={isStaffMode ? onPromptUnlockStaffMode : onLockToStaffMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              isStaffMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isStaffMode ? 'Staff Mode Active (Profit & Owner Data Locked). Click to unlock with PIN.' : 'Owner Mode Active. Click to lock counter boy to Staff Mode.'}
          >
            {isStaffMode ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isStaffMode ? 'Staff Mode' : 'Owner'}</span>
          </button>

          {/* 👤 Profile Badge with Hover / Click Dropdown (Profile, Telegram Setting, Logout) */}
          {(currentUser || isDemoMode) ? (
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {/* Trigger Button with "Pro Plan" / "Demo User" */}
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/90 hover:bg-slate-700/90 active:bg-slate-800 text-slate-200 border border-slate-700 hover:border-indigo-500/60 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs group"
                title="Account, Profile, Telegram Alerts & Logout"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white font-black flex items-center justify-center text-[11px] shrink-0 shadow-inner">
                  {(cafeName || 'C').charAt(0).toUpperCase()}
                </div>

                <div className="hidden sm:flex flex-col text-left -space-y-0.5">
                  <span className="max-w-[110px] truncate text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors">
                    {ownerName}
                  </span>
                  <span className="text-[9px] text-indigo-400 font-extrabold tracking-wide">
                    {isDemoMode ? 'Demo User' : 'Pro Plan'}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-400' : ''}`} />
              </button>

              {/* Sleek Enterprise Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Dropdown Header Info */}
                  <div className="px-3 py-2.5 border-b border-slate-800/90 mb-1 bg-slate-800/40 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white truncate">{cafeName}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shrink-0">
                        {isDemoMode ? 'Demo' : 'Pro Plan'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      {ownerEmail}
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="space-y-0.5">
                    
                    {/* 1. Profile Page Button */}
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/20 active:bg-indigo-600/30 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          Profile
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Edit Cafe profile & settings
                        </div>
                      </div>
                    </button>

                    {/* 2. Telegram Setting Button */}
                    <button
                      type="button"
                      onClick={handleTelegramClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-sky-500/20 active:bg-sky-500/30 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30 group-hover:scale-105 transition-transform">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                          Telegram Setting
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Automated alerts & bot setup
                        </div>
                      </div>
                    </button>

                    <div className="h-px bg-slate-800 my-1" />

                    {/* 3. Logout Button */}
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 active:bg-rose-500/30 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 group-hover:scale-105 transition-transform">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-rose-300 group-hover:text-rose-200 transition-colors">
                          Logout
                        </div>
                        <div className="text-[10px] text-rose-400/70 truncate">
                          {isDemoMode ? 'Exit Demo Session' : 'Sign out of this session'}
                        </div>
                      </div>
                    </button>

                  </div>

                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
