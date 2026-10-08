import React from 'react';
import { Plus, Sparkles, FileSpreadsheet, Store, LogIn, ChevronDown, LogOut, Eye, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Navbar({
  onOpenAddModal,
  totalItems,
  isCloudConnected,
  onOpenCloudModal,
  onOpenExportModal,
  currentCafe,
  currentUser,
  isDemoMode = false,
  onOpenAuthModal,
  onOpenCafeProfileModal,
  onExitDemo,
  onLogout
}) {
  const cafeName = currentCafe?.cafeName || 'S&S Cafe';
  const ownerName = currentCafe?.ownerName || currentUser?.displayName || 'Owner';

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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">

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
                onClick={onOpenCafeProfileModal}
                className="flex items-center gap-1 text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors shrink-0 cursor-pointer"
                title="Switch Outlet / View Cafe Profile"
              >
                <span>{currentCafe?.city || 'Main'}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-indigo-400 inline" />
              <span>{ownerName}'s Cafe POS</span>
              <span className="text-slate-700">•</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {isDemoMode ? 'Demo Active' : 'Live Sync'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">

          {/* User Cafe Profile Button (Visible when logged in or in demo) */}
          {(currentUser || isDemoMode) && (
            <button
              type="button"
              onClick={onOpenCafeProfileModal}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Cafe Profile, Branches & Account Settings"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">
                {(cafeName || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left -space-y-0.5">
                <span className="max-w-[100px] truncate text-[11px] font-bold text-slate-200">{ownerName}</span>
                <span className="text-[9px] text-indigo-400 font-medium">
                  {isDemoMode ? 'Demo User' : 'Pro Plan'}
                </span>
              </div>
              <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            </button>
          )}

          {/* Quick Exit / Logout Button */}
          {currentUser ? (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 sm:px-2.5 sm:py-2 bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Log Out to CafePulse Home Page"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : isDemoMode ? (
            <button
              type="button"
              onClick={onExitDemo}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              title="Exit Demo Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Demo</span>
            </button>
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

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Download Weekly / Monthly Excel (.xlsx) Reports"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Add New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:from-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 border border-indigo-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Item</span>
          </button>
        </div>

      </div>
    </header>
  );
}
