import React from 'react';

export default function AverLogo({ theme = 'dark', size = 32 }: { theme?: 'light' | 'dark'; size?: number }) {
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center gap-3 font-display select-none">
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-2 shadow-lg shadow-emerald-500/20"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-slate-950 stroke-current stroke-[2.5]">
          <path d="M12 2L3 19h18L12 2z" strokeLinejoin="round" />
          <path d="M12 8v7" strokeLinecap="round" />
          <path d="M9 13l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className={`font-black tracking-tight text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
        AVER<span className="text-emerald-400">.</span>
      </span>
    </div>
  );
}
