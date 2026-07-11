import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, TrendingUp, TrendingDown, PackageOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Holding } from '../../types';

interface PortfolioHoldingsProps {
  theme: 'light' | 'dark';
  selectedTicker?: string | null;
  onSelectTicker?: (ticker: string) => void;
}

export default function PortfolioHoldings({ theme, selectedTicker, onSelectTicker }: PortfolioHoldingsProps) {
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const holdingsData: Holding[] = user?.holdings || [];

  const toggleRow = (ticker: string) => {
    setExpandedTicker(prev => prev === ticker ? null : ticker);
    if (onSelectTicker) {
      onSelectTicker(ticker);
    }
  };

  const formatVal = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (holdingsData.length === 0) {
    return (
      <div className={`p-12 rounded-[24px] border flex flex-col items-center justify-center text-center ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200'}`}>
        <PackageOpen className="w-12 h-12 text-slate-500 mb-4 opacity-20" />
        <h3 className="text-white font-bold mb-1">No Assets Found</h3>
        <p className="text-xs text-slate-400">Initialize your portfolio by making your first deposit or trade.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-white/[0.03] border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center space-x-2 mb-2">
        <PackageOpen className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-black tracking-tight text-white">Asset Allocation</h2>
      </div>
      <div className="mb-6">
        <p className="text-xs text-slate-400">Detailed breakdown of your current portfolio distribution and individual asset performance.</p>
      </div>

      <div className="space-y-4">
        {holdingsData.map((h) => {
          const isExpanded = expandedTicker === h.ticker;
          const isHighlighted = selectedTicker === h.ticker;
          const isUp = h.change24H >= 0;
          const logoColorClass = h.logoColor;

          return (
            <div 
              key={h.ticker} 
              className={`flex flex-col rounded-2xl border transition-all cursor-pointer ${isHighlighted || isExpanded ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
            >
              {/* Asset Card Header */}
              <div 
                className="flex justify-between items-center p-4 sm:p-5"
                onClick={() => toggleRow(h.ticker)}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${logoColorClass} flex items-center justify-center font-bold text-white shadow-md text-lg`}>
                    {h.logoText}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{h.name}</div>
                    <div className="text-[11px] text-slate-400 font-bold font-mono uppercase tracking-wider">{h.ticker}</div>
                  </div>
                </div>

                {/* Center/Right: Price & P/L */}
                <div className="flex items-center space-x-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-black text-white">${formatVal(h.currentPrice)}</div>
                    <div className={`text-[11px] font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end`}>
                      {isUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                      {isUp ? '+' : ''}{h.change24H}%
                    </div>
                  </div>

                  {/* Allocation Badge */}
                  <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-black tracking-wide font-mono">
                    {h.allocationPct}%
                  </div>
                  
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Expandable Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 border-t border-white/5 bg-black/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                          
                          {/* Metrics */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Position Valuation</span>
                            <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                              <span className="text-slate-400">Total Quantity:</span>
                              <span className="font-mono text-white font-bold">{h.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} {h.ticker}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/[0.02]">
                              <span className="text-slate-400">Market Value:</span>
                              <span className="font-mono text-white font-bold">${formatVal(h.marketValue)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-slate-400">Unrealized P/L:</span>
                              <span className={`font-mono font-bold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {h.pnl >= 0 ? '+' : ''}${formatVal(h.pnl)}
                              </span>
                            </div>
                          </div>

                          {/* AI Analysis */}
                          <div className="lg:col-span-2 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-1.5 text-emerald-400 mb-2">
                                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] uppercase font-black tracking-wider">AverNox AI Deep Analytics</span>
                              </div>
                              <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
                                "{h.aiDetails}"
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-3 pt-4">
                              <button 
                                onClick={(e) => { e.stopPropagation(); alert(`Buy order interface opened for ${h.ticker}.`); }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black py-2.5 rounded-xl text-center active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                              >
                                Buy {h.ticker}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); alert(`Sell order interface opened for ${h.ticker}.`); }}
                                className="flex-1 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl text-center active:scale-95 transition-all cursor-pointer"
                              >
                                Sell {h.ticker}
                              </button>
                            </div>
                          </div>

                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          );
        })}
      </div>
    </div>
  );
}
