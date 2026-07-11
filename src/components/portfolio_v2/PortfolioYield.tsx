import React from 'react';
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Lock, Unlock } from 'lucide-react';

interface PortfolioYieldProps {
  theme: 'light' | 'dark';
}

const YIELD_OPPORTUNITIES = [
  {
    asset: 'USDT',
    product: 'Flexible Savings',
    apy: '8.45%',
    type: 'flexible',
    risk: 'Low Risk',
    color: 'emerald'
  },
  {
    asset: 'ETH',
    product: 'Liquid Staking',
    apy: '3.80%',
    type: 'flexible',
    risk: 'Low Risk',
    color: 'blue'
  },
  {
    asset: 'SOL',
    product: 'Locked Staking (30D)',
    apy: '7.25%',
    type: 'locked',
    risk: 'Low Risk',
    color: 'purple'
  },
  {
    asset: 'BTC',
    product: 'Dual Investment',
    apy: 'Up to 24.5%',
    type: 'structured',
    risk: 'Medium Risk',
    color: 'amber'
  }
];

export default function PortfolioYield({ theme }: PortfolioYieldProps) {
  const isDark = theme === 'dark';
  
  const bgClasses = isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/60 border-slate-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';

  return (
    <div className={`w-[96%] mx-auto rounded-xl border ${bgClasses} p-6 overflow-hidden relative`}>
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className={`text-xl font-bold tracking-tight ${textPrimary}`}>Earn & Yield</h2>
          </div>
          <p className={`text-sm ${textSecondary}`}>Put your idle assets to work. Discover high-yield opportunities curated for your portfolio.</p>
        </div>
        
        <div className={`flex flex-col items-end p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100/50'} border ${isDark ? 'border-white/5' : 'border-slate-200'} shrink-0`}>
          <span className={`text-xs ${textSecondary} font-medium mb-1 uppercase tracking-wider`}>Total Earned (30D)</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${textPrimary}`}>+$428.15</span>
            <span className="text-emerald-500 text-sm font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              1.2%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {YIELD_OPPORTUNITIES.map((opp, idx) => (
          <div key={idx} className={`p-5 rounded-xl border ${isDark ? 'border-white/5 bg-slate-800/40' : 'border-slate-200 bg-white'} ${hoverClass} transition-all cursor-pointer group`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-${opp.color}-500/20 text-${opp.color}-500`}>
                  {opp.asset}
                </div>
                <div>
                  <div className={`font-bold ${textPrimary}`}>{opp.asset}</div>
                  <div className={`text-xs ${textSecondary}`}>{opp.product}</div>
                </div>
              </div>
              <div className={`p-1.5 rounded-md ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {opp.type === 'flexible' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </div>
            </div>
            
            <div className="mb-4">
              <div className={`text-2xl font-bold font-mono text-emerald-500`}>{opp.apy}</div>
              <div className={`text-xs ${textSecondary} mt-1 uppercase tracking-wider font-medium`}>Est. APY</div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-white/5">
              <span className={`text-xs flex items-center ${opp.risk.includes('Low') ? 'text-emerald-500' : 'text-amber-500'}`}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {opp.risk}
              </span>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500 text-black group-hover:scale-110 transition-transform`}>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
