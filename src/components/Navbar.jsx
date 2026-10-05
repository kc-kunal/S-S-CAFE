import React from 'react';
import { Plus, Sparkles, FileSpreadsheet, Cloud } from 'lucide-react';

export default function Navbar({ onOpenAddModal, onResetData, totalItems, isCloudConnected, onOpenCloudModal, onOpenExportModal }) {
  return (
    <header className="bg-stone-950 text-amber-50 sticky top-0 z-30 shadow-xl border-b border-stone-800/80 backdrop-blur-md bg-stone-950/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <button
            type="button"
            onClick={onOpenCloudModal}
            className="relative group shrink-0 text-left cursor-pointer"
            title={isCloudConnected ? 'Cloud Sync Active (Click to configure)' : 'Local Storage Mode (Click to configure Cloud)'}
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105 duration-200">
              <img
                src="/logo.jpg"
                alt="S&S Cafe Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-stone-950 ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-2xl font-bold font-serif-title tracking-tight text-amber-100 truncate">
                S&S Cafe
              </h1>
              <span className="text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                POS
              </span>
            </div>
            <p className="text-[11px] text-amber-200/60 hidden sm:flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-400 inline" />
              Artisanal Coffee & Delights Dashboard
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-emerald-950/20 border border-emerald-400/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            title="Download Weekly / Monthly Excel (.xlsx) Reports"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200 stroke-[2.2]" />
            <span className="hidden xs:inline sm:inline">Export Excel</span>
            <span className="xs:hidden sm:hidden">Excel</span>
          </button>

          {/* Cloud Config Button */}
          {/* <button
            type="button"
            onClick={onOpenCloudModal}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isCloudConnected 
                ? 'bg-stone-900 text-emerald-400 border-emerald-500/30 hover:bg-stone-800'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
            }`}
            title="Cloud Sync Database Settings"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isCloudConnected ? 'Cloud Sync' : 'Offline'}</span>
          </button> */}

          {/* Add New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:from-amber-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-amber-600/25 border border-amber-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Add Item</span>
            <span className="xs:hidden sm:hidden">Item</span>
          </button>
        </div>

      </div>
    </header>
  );
}
