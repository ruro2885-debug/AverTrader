import React from 'react';

const exposure = [
  { category: 'Bitcoin', pct: 40 },
  { category: 'Ethereum', pct: 30 },
  { category: 'DeFi', pct: 20 },
  { category: 'Stablecoins', pct: 10 },
];

export default function PortfolioExposure({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-slate-200'}`}>
      <h3 className={`font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Market Exposure</h3>
      <div className="space-y-3">
        {exposure.map((e, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span>{e.category}</span>
              <span>{e.pct}%</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${e.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
