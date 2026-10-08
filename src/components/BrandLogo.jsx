import React from 'react';

export default function BrandLogo({ size = 'md', showText = true, textLight = false }) {
  // Sizes: sm (28px), md (38px), lg (48px), xl (64px)
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 select-none">
      {/* Brand Icon SVG Emblem */}
      <div className={`relative ${sizeMap[size] || sizeMap.md} rounded-2xl p-1.5 bg-gradient-to-br from-indigo-600 via-blue-700 to-slate-900 border border-indigo-400/30 shadow-md shadow-indigo-600/20 flex items-center justify-center group overflow-hidden shrink-0`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-emerald-400/20 opacity-90 group-hover:opacity-100 transition-opacity" />
        
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-sm"
        >
          {/* Steam / Aroma Sparkles */}
          <path
            d="M17 10C17 7.5 19 6 19 6C19 6 18 8 18 9.5C18 11 19.5 12 19.5 12"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 8C24 5.5 26.5 4 26.5 4C26.5 4 25.5 6.5 25.5 8C25.5 9.5 27 10.5 27 10.5"
            stroke="#34D399"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M31 10C31 7.5 33 6 33 6C33 6 32 8 32 9.5C32 11 33.5 12 33.5 12"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Coffee Cup Outline */}
          <path
            d="M10 16H36C36 16 37 32 24 32C11 32 12 16 12 16H10Z"
            fill="url(#cupGrad)"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Cup Handle */}
          <path
            d="M36 19C39.5 19 41.5 21 41.5 24C41.5 27 39.5 28.5 35 28.5"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Pulse / Heartbeat Line inside Cup (Symbol of CafePulse) */}
          <path
            d="M15 24H19L21.5 19L24.5 29L27.5 21L29.5 24H33"
            stroke="#10B981"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Base Saucer Plate */}
          <path
            d="M9 36C15 38.5 33 38.5 39 36"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="cupGrad" x1="12" y1="16" x2="36" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E293B" stopOpacity="0.8" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight ${textLight ? 'text-white' : 'text-slate-900'}`}>
              Cafe<span className="text-indigo-600">Pulse</span>
            </span>
            <span className={`text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
              textLight 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' 
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              Cloud POS
            </span>
          </div>
          <span className={`text-[10px] -mt-0.5 tracking-wide hidden sm:block ${textLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Smart Operating System for Cafes
          </span>
        </div>
      )}
    </div>
  );
}
