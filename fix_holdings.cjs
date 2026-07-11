const fs = require('fs');
let code = fs.readFileSync('src/components/portfolio_v2/PortfolioHoldings.tsx', 'utf8');

// The replacement code:
const replacement = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, TrendingUp, TrendingDown, PackageOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface HoldingData {
  ticker: string;
  name: string;
  quantity: number;
  avgEntry: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  change24H: number;
  allocationPct: number;
  logoColor: string;
  logoText: string;
  aiDetails: string;
  trend: number[];
}

interface PortfolioHoldingsProps {
  theme: 'light' | 'dark';
  selectedTicker?: string | null;
  onSelectTicker?: (ticker: string) => void;
}

export default function PortfolioHoldings({ theme, selectedTicker, onSelectTicker }: PortfolioHoldingsProps) {
  const isDark = theme === 'dark';
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  // Mock Data mimicking a diverse portfolio
  const holdingsData: HoldingData[] = [
    { ticker: 'BTC', name: 'Bitcoin', quantity: 0.842, avgEntry: 51200, currentPrice: 55000, marketValue: 46310, pnl: 3200, change24H: 2.4, allocationPct: 42.5, logoColor: 'from-amber-500 to-orange-600', logoText: '₿', aiDetails: "BTC momentum is shifting positively. Accumulation phase observed in whale wallets. Support established at 53k.", trend: [40, 42, 41, 45, 48, 47, 50] },
    { ticker: 'ETH', name: 'Ethereum', quantity: 12.5, avgEntry: 2850, currentPrice: 2900, marketValue: 36250, pnl: 625, change24H: 1.1, allocationPct: 33.2, logoColor: 'from-slate-400 to-slate-600', logoText: 'Ξ', aiDetails: "ETH gas fees stabilizing. Upcoming EIP upgrade may act as a bullish catalyst. Watch resistance at 3.1k.", trend: [30, 31, 29, 33, 34, 32, 35] },
    { ticker: 'SOL', name: 'Solana', quantity: 154, avgEntry: 110, currentPrice: 105, marketValue: 16170, pnl: -770, change24H: -3.5, allocationPct: 14.8, logoColor: 'from-purple-500 to-teal-500', logoText: 'S', aiDetails: "SOL network activity high but facing macro headwinds. Technical retracement underway. Key support at $98.", trend: [50, 48, 45, 42, 44, 40, 38] },
    { ticker: 'AVR', name: 'Aver Utility', quantity: 25000, avgEntry: 0.35, currentPrice: 0.42, marketValue: 10500, pnl: 1750, change24H: 12.4, allocationPct: 9.6, logoColor: 'from-emerald-400 to-emerald-600', logoText: 'A', aiDetails: "Aver utility token shows massive divergence from broader market. Exchange volume up 300%. Strong buy.", trend: [20, 25, 22, 30, 35, 40, 45] },
  ];

  const toggleRow = (ticker: string) => {
    setExpandedTicker(prev => prev === ticker ? null : ticker);
    if (onSelectTicker) {
      onSelectTicker(ticker);
    }
  };

  const formatVal = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className={\`p-6 rounded-[24px] border \${isDark ? 'bg-white/[0.03] border-white/5 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'}\`}>
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
              className={\`flex flex-col rounded-2xl border transition-all cursor-pointer \${isHighlighted || isExpanded ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}\`}
            >
              {/* Asset Card Header */}
              <div 
                className="flex justify-between items-center p-4 sm:p-5"
                onClick={() => toggleRow(h.ticker)}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center space-x-4">
                  <div className={\`w-10 h-10 rounded-full bg-gradient-to-br \${logoColorClass} flex items-center justify-center font-bold text-white shadow-md text-lg\`}>
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
                    <div className="text-sm font-black text-white">\${formatVal(h.currentPrice)}</div>
                    <div className={\`text-[11px] font-bold font-mono \${isUp ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end\`}>
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
                              <span className="font-mono text-white font-bold">\${formatVal(h.marketValue)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-slate-400">Unrealized P/L:</span>
                              <span className={\`font-mono font-bold \${h.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
                                {h.pnl >= 0 ? '+' : ''}\${formatVal(h.pnl)}
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
                                onClick={(e) => { e.stopPropagation(); alert(\`Buy order interface opened for \${h.ticker}.\`); }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black py-2.5 rounded-xl text-center active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                              >
                                Buy {h.ticker}
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); alert(\`Sell order interface opened for \${h.ticker}.\`); }}
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
`;

fs.writeFileSync('src/components/portfolio_v2/PortfolioHoldings.tsx', replacement);
