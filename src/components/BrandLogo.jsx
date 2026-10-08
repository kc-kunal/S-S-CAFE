import React from 'react';

export default function BrandLogo({ size = 'md', showText = true, textLight = true }) {
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
      <div className={`relative ${sizeMap[size] || sizeMap.md} rounded-2xl p-1.5 bg-gradient-to-br from-stone-900 via-amber-950/80 to-stone-950 border border-amber-500/40 shadow-lg shadow-amber-500/20 flex items-center justify-center group overflow-hidden`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 opacity-80 group-hover:opacity-100 transition-opacity" />
        
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md"
        >
          {/* Steam / Aroma Sparkles */}
          <path
            d="M17 10C17 7.5 19 6 19 6C19 6 18 8 18 9.5C18 11 19.5 12 19.5 12"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M24 8C24 5.5 26.5 4 26.5 4C26.5 4 25.5 6.5 25.5 8C25.5 9.5 27 10.5 27 10.5"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M31 10C31 7.5 33 6 33 6C33 6 32 8 32 9.5C32 11 33.5 12 33.5 12"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Coffee Cup Outline */}
          <path
            d="M10 16H36C36 16 37 32 24 32C11 32 12 16 12 16H10Z"
            fill="url(#cupGrad)"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Cup Handle */}
          <path
            d="M36 19C39.5 19 41.5 21 41.5 24C41.5 27 39.5 28.5 35 28.5"
            stroke="#FBBF24"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Pulse / Heartbeat Line inside Cup (Symbol of CafePulse) */}
          <path
            d="M15 24H19L21.5 20L24.5 28L27.5 22L29.5 24H33"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Base Saucer Plate */}
          <path
            d="M9 36C15 38.5 33 38.5 39 36"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="cupGrad" x1="12" y1="16" x2="36" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#292524" />
              <stop offset="1" stopColor="#1C1917" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight font-serif-title ${textLight ? 'text-stone-100' : 'text-stone-900'}`}>
              Cafe<span className="text-amber-500">Pulse</span>
            </span>
            <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-400 border border-amber-500/30">
              Cloud POS
            </span>
          </div>
          <span className="text-[10px] text-stone-400 -mt-0.5 tracking-wide hidden sm:block">
            Smart Operating System for Cafes
          </span>
        </div>
      )}
    </div>
  );
}
