import React from 'react';
import { Plus, RotateCcw, Sparkles, Cloud } from 'lucide-react';

export default function Navbar({ onOpenAddModal, onResetData, totalItems, isCloudConnected, onOpenCloudModal }) {
  return (
    <header className="bg-stone-950 text-amber-50 sticky top-0 z-30 shadow-xl border-b border-stone-800/80 backdrop-blur-md bg-stone-950/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105 duration-200">
              <img
                src="/logo.jpg"
                alt="S&S Cafe Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-stone-950 ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} title={isCloudConnected ? 'Cloud Live Sync' : 'Local Storage'}></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-serif-title tracking-tight text-amber-100 flex items-center gap-2">
                S&S Cafe
              </h1>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Menu Manager
              </span>
            </div>
            <p className="text-xs text-amber-200/60 hidden sm:flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-400 inline" />
              Artisanal Coffee & Delights Dashboard
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Cloud Database Connection Button */}
          <button
            type="button"
            onClick={onOpenCloudModal}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isCloudConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
                : 'bg-stone-900 text-amber-300 border-amber-500/40 hover:bg-stone-850 hover:text-amber-200'
            }`}
            title="Free Cloud Database Settings (Firebase Firestore)"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isCloudConnected ? 'Cloud Synced' : 'Connect Cloud DB'}
            </span>
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </button>

          {/* Add New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-amber-600/25 border border-amber-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>

      </div>
    </header>
  );
}
