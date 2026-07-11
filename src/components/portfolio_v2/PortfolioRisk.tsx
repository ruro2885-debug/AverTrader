import React from 'react';
import { ShieldCheck, Flame, ShieldAlert, BarChart2 } from 'lucide-react';

interface RiskGauge {
  label: string;
  score: number;
  max: number;
  unit: string;
  level: string;
  color: string;
  bgGradient: string;
}

export default function PortfolioRisk({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  const gauges: RiskGauge[] = [
    {
      label: 'Portfolio Risk Score',
      score: 48,
      max: 100,
      unit: '/100',
      level: 'MODERATE-LOW',
      color: 'from-amber-400 to-orange-500',
      bgGradient: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      label: 'System Volatility Rate',
      score: 18.4,
      max: 100,
      unit: '%',
      level: 'OPTIMIZED',
      color: 'from-cyan-400 to-blue-500',
      bgGradient: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      label: 'Market Exposure Score',
      score: 95,
      max: 100,
      unit: '%',
      level: 'HIGH BETA',
      color: 'from-indigo-400 to-purple-500',
      bgGradient: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      label: 'Diversification Rating',
      score: 94,
      max: 100,
      unit: '%',
      level: 'OUTSTANDING',
      color: 'from-emerald-400 to-teal-500',
      bgGradient: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      label: 'Slippage Liquidity Score',
      score: 85,
      max: 100,
      unit: '%',
      level: 'EXCELLENT',
      color: 'from-teal-400 to-emerald-500',
      bgGradient: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    }
  ];

  return (
    <div className="w-[96%] mx-auto bg-gradient-to-br from-[#0c0d16] to-[#08080c] border border-white/5 rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">Risk Analysis</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Algorithmic risk evaluation across critical portfolio pressure points.</p>
        </div>
        <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded text-[10px] text-amber-400 font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3 text-amber-400" />
          <span>Macro Stable</span>
        </div>
      </div>

      {/* Grid of 5 Professional Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {gauges.map((g, i) => {
          const pct = (g.score / g.max) * 100;
          return (
            <div 
              key={i} 
              className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Semicircular SVG dial gauge */}
              <div className="relative w-28 h-16 flex items-center justify-center">
                <svg className="w-28 h-28 absolute top-0">
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="276"
                    strokeDashoffset="138" // half circle
                    transform="rotate(-180, 56, 56)"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="url(#riskGrad)"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="276"
                    // Map score ratio to the half-circle stroke dashoffset
                    strokeDashoffset={276 - (138 * pct) / 100}
                    transform="rotate(-180, 56, 56)"
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Internal text readout */}
                <div className="absolute bottom-0 text-center">
                  <span className="text-sm font-black text-white font-mono leading-none">
                    {g.score}{g.unit}
                  </span>
                </div>
              </div>

              {/* Description tags */}
              <span className="text-[10px] font-bold text-slate-400 mt-3 block uppercase tracking-wider">
                {g.label}
              </span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-2 inline-block ${g.bgGradient}`}>
                {g.level}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
