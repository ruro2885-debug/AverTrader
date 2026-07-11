import React from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle,
  Lightbulb,
  Cpu,
  BookmarkCheck
} from 'lucide-react';

export default function PortfolioAIInsights({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  const confidenceScore = 94;

  const highlights = [
    {
      title: 'Current Portfolio Strengths',
      desc: 'Highly robust core exposure with 65% in Tier-1 flagship bluechips (BTC & ETH). Delivers outstanding price resilience and downside protection during volatile structural liquidations.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/5 border-emerald-500/10'
    },
    {
      title: 'Identified Portfolio Vulnerabilities',
      desc: 'BNB holding represents moderate regulatory cross-exposure. Stablecoin dry powder (USDT) is currently limited to 5%, reducing your rapid dip-purchasing power during flash liquidations.',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/5 border-amber-500/10'
    },
    {
      title: 'System Recommended Actions',
      desc: 'Rotate 5% of Solana/Others capital gains into USDT reserves upon the next resistance breakout. This increases your tactical buffer while locking high-yield yield mining allocations.',
      icon: Lightbulb,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/5 border-indigo-500/10'
    }
  ];

  return (
    <div className="w-[96%] mx-auto bg-gradient-to-br from-[#0c0d16] via-[#090b13] to-[#08080c] border border-emerald-500/10 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Decorative scanning line or glowing background bubble */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <BrainCircuit className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center">
              AverNox AI Portfolio Intelligence
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 ml-1.5 animate-bounce" />
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-1">Institutional quantitative diagnostics and algorithmic allocation audit.</p>
          </div>
        </div>

        {/* Confidence Score Gauge */}
        <div className="flex items-center space-x-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">AI Conviction Score</span>
            <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">{confidenceScore}%</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center relative">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="#10b981"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray="100"
                strokeDashoffset={100 - confidenceScore}
                className="transition-all duration-1000"
              />
            </svg>
            <Cpu className="w-3.5 h-3.5 text-emerald-400 absolute inset-0 m-auto" />
          </div>
        </div>
      </div>

      {/* Structured Institutional Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {highlights.map((h, i) => {
          const Icon = h.icon;
          return (
            <div key={i} className={`p-5 rounded-xl border ${h.bgColor} flex flex-col justify-between space-y-3`}>
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${h.iconColor}`} />
                <span className="text-xs font-extrabold text-white tracking-tight">{h.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {h.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quantitative Allocation Insights */}
      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">AI Deep Portfolio Diagnostics Matrix</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono">
          <div className="border-r border-white/5 pr-4">
            <span className="text-slate-500 block">Market Exposure</span>
            <span className="text-white font-bold mt-1 block">95% High-Beta Tokens</span>
          </div>
          <div className="border-r border-white/5 px-2 md:px-4">
            <span className="text-slate-500 block">Diversification Rating</span>
            <span className="text-emerald-400 font-bold mt-1 block">High (Beta Balanced)</span>
          </div>
          <div className="border-r border-white/5 px-2 md:px-4">
            <span className="text-slate-500 block">Strongest Holding Conviction</span>
            <span className="text-amber-400 font-bold mt-1 block">BTC (Accumulate)</span>
          </div>
          <div className="pl-2 md:pl-4">
            <span className="text-slate-500 block">Weakest Holding Conviction</span>
            <span className="text-rose-400 font-bold mt-1 block">BNB (Consolidate)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
