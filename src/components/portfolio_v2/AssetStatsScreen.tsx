import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, PieChart, TrendingUp, TrendingDown, Layers, BarChart3, 
  Activity, Sliders, Calendar, ArrowRight, ArrowRightLeft, Target, ShieldCheck
} from 'lucide-react';

interface AssetStatsScreenProps {
  key?: React.Key;
  theme: 'light' | 'dark';
  onBack: () => void;
  activeTradingBalance: number;
  allocations: Array<{
    ticker: string;
    name: string;
    percentage: number;
    color: string;
  }>;
}

export default function AssetStatsScreen({
  theme,
  onBack,
  activeTradingBalance,
  allocations
}: AssetStatsScreenProps) {
  const isDark = theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'allocation' | 'exposure' | 'ai-history'>('allocation');

  // Dynamic Exposure By Asset Class derived from actual allocations
  const exposures = useMemo(() => {
    let cryptoValue = 0;
    let equityValue = 0;
    let metalsValue = 0;
    let cashValue = 0;

    allocations.forEach(a => {
      const val = (a as any).valuation || (activeTradingBalance * (a.percentage / 100));
      if (['BTC', 'ETH', 'SOL'].includes(a.ticker)) {
        cryptoValue += val;
      } else if (['AAPL', 'ETFs'].includes(a.ticker)) {
        equityValue += val;
      } else if (['Gold', 'GLD'].includes(a.ticker)) {
        metalsValue += val;
      } else if (['Cash', 'USDC'].includes(a.ticker)) {
        cashValue += val;
      }
    });

    const totalCalculated = cryptoValue + equityValue + metalsValue + cashValue;
    const finalTotal = totalCalculated > 0 ? totalCalculated : activeTradingBalance;

    const cryptoPct = finalTotal > 0 ? (cryptoValue / finalTotal) * 100 : 0;
    const equityPct = finalTotal > 0 ? (equityValue / finalTotal) * 100 : 0;
    const metalsPct = finalTotal > 0 ? (metalsValue / finalTotal) * 100 : 0;
    const cashPct = finalTotal > 0 ? (cashValue / finalTotal) * 100 : 0;

    return [
      { name: 'Cryptocurrencies', percentage: Math.round(cryptoPct), color: '#00D09C', value: cryptoValue },
      { name: 'Equities / Stocks', percentage: Math.round(equityPct), color: '#3b82f6', value: equityValue },
      { name: 'Precious Metals', percentage: Math.round(metalsPct), color: '#eab308', value: metalsValue },
      { name: 'Cash Reserves', percentage: Math.round(cashPct), color: '#6b7280', value: cashValue },
    ].sort((a, b) => b.percentage - a.percentage);
  }, [allocations, activeTradingBalance]);

  // Dynamic Performance metrics derived from actual allocations
  const performanceList = useMemo(() => {
    return allocations.map(a => {
      let roiPct = 0;
      if (a.ticker === 'BTC') roiPct = 42.5;
      else if (a.ticker === 'ETH') roiPct = 18.2;
      else if (a.ticker === 'SOL') roiPct = 112.4;
      else if (a.ticker === 'AAPL') roiPct = 8.4;
      else if (a.ticker === 'ETFs') roiPct = 5.2;
      else if (a.ticker === 'Gold') roiPct = 3.1;
      else roiPct = 0.0;

      const val = (a as any).valuation || (activeTradingBalance * (a.percentage / 100));
      const pnlAmount = val * (roiPct / 100);
      const roiSign = roiPct > 0 ? '+' : '';
      const pnlSign = pnlAmount > 0 ? '+$' : pnlAmount < 0 ? '-$' : '$';
      
      return {
        ticker: a.ticker === 'Gold' ? 'GLD' : a.ticker,
        name: a.name,
        roi: `${roiSign}${roiPct.toFixed(1)}%`,
        pnl: `${pnlSign}${Math.round(pnlAmount).toLocaleString()}`,
        status: roiPct > 0 ? 'gain' : roiPct < 0 ? 'loss' : 'flat'
      };
    });
  }, [allocations, activeTradingBalance]);

  // Simulated Closed Positions
  const closedPositions = [
    { ticker: 'SOL', name: 'Solana Swing Buy', pnl: '+$8,150.00', win: true, date: 'Jul 11, 2026' },
    { ticker: 'BTC', name: 'Tactical Hedge Short', pnl: '+$3,400.00', win: true, date: 'Jul 08, 2026' },
    { ticker: 'ETH', name: 'Gas Scalp Long', pnl: '-$1,200.00', win: false, date: 'Jul 04, 2026' },
    { ticker: 'AAPL', name: 'Pre-Earnings Accumulation', pnl: '+$5,900.00', win: true, date: 'Jun 28, 2026' },
  ];

  // Simulated AI Rebalancing Logs (Capital shift)
  const aiRebalanceLog = [
    { date: 'Jul 12, 2026', action: 'Rotated 5% ETH gains into Cash reserves', reason: 'Systemic volatility index crossed warning threshold (38.5%)' },
    { date: 'Jul 08, 2026', action: 'Increased Solana (SOL) weight by 4.2%', reason: 'Network throughput metrics indicated high ecosystem volume' },
    { date: 'Jul 03, 2026', action: 'Rebalanced 3% BTC capital into Precious Metals', reason: 'Correlative risk parity optimization model completed run' },
    { date: 'Jun 28, 2026', action: 'Swept $15,000 USDC into Private Protection Vault', reason: 'Scheduled automated savings profit sweep run triggered' },
  ];

  // SVG Donut Setup
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark 
    ? "bg-[#0E1320] border border-white/[0.05]" 
    : "bg-white border border-slate-200/60";

  return (
    <motion.div 
      layoutId="stats-card-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen pt-[135px] pb-12 ${isDark ? 'bg-[#000000]' : 'bg-slate-50'} ${isDark ? 'text-slate-100' : 'text-slate-800'} font-sans relative flex flex-col justify-start`}
    >
      {/* HEADER BAR AND TABS */}
      <div className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b ${isDark ? 'bg-[#000000]/80 border-white/5' : 'bg-slate-50/80 border-slate-200'} flex flex-col`}>
        <header className="px-4 lg:px-8 h-[60px] flex justify-between items-center border-b border-white/[0.03]">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className={`p-1.5 bg-white/[0.02] hover:bg-white/[0.06] border ${isDark ? 'border-white/[0.05]' : 'border-slate-200'} text-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]`}
            >
              <ArrowLeft className={`w-4 h-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`} />
            </button>
            <div>
              <motion.h1 
                layoutId="stats-title"
                className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}
              >
                <PieChart className="w-4 h-4 text-[#00D09C]" />
                Portfolio Statistics
              </motion.h1>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block leading-none">
                Institutional Capital Analytics
              </span>
            </div>
          </div>
        </header>

        {/* TABS HEADER */}
        <div className="px-4 pt-3.5">
          <div className="flex space-x-2 max-w-md mx-auto">
            {(['allocation', 'exposure', 'ai-history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'border-[#00D09C] text-[#00D09C]' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'allocation' && 'Asset Allocation'}
                {tab === 'exposure' && 'Sector Exposure'}
                {tab === 'ai-history' && 'AI Shifts'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE */}
      <main className="w-full flex-grow flex flex-col px-4 sm:px-6 lg:max-w-5xl lg:mx-auto">
        <div className="w-full py-5 flex flex-col justify-start space-y-6">
        
        {/* TAB 1: ALLOCATION */}
        {activeTab === 'allocation' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* SVG DONUT & STATS HUD */}
            <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} shadow-xl`}>
              <div className="grid grid-cols-1 gap-5 items-center justify-center">
                
                {/* SVG DONUT CHART */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      let localCumulativePercent = 0;
                      return allocations.map((alloc, idx) => {
                        const pct = typeof alloc.percentage === 'number' && !isNaN(alloc.percentage) ? alloc.percentage : 0;
                        const strokeDash = (pct / 100) * circumference;
                        const strokeOffset = circumference - (localCumulativePercent / 100) * circumference;
                        localCumulativePercent += pct;
                        
                        const isHovered = hoveredIndex === idx;
                        
                        return (
                          <circle
                            key={alloc.ticker}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={alloc.color}
                            strokeWidth={isHovered ? "10" : "7.5"}
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                              filter: isHovered ? `drop-shadow(0 0 6px ${alloc.color}75)` : 'none',
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>

                  {/* Middle Central HUD */}
                  <div className="absolute inset-2 flex flex-col items-center justify-center text-center p-3 bg-[#080B11]/85 border border-white/[0.04] rounded-full backdrop-blur-md pointer-events-none">
                    {hoveredIndex !== null ? (
                      <>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">{allocations[hoveredIndex].name}</span>
                        <span className="text-xl font-extrabold text-white font-mono">{allocations[hoveredIndex].percentage}%</span>
                        <span className="text-[9px] text-[#00D09C] font-mono">${Math.round(activeTradingBalance * (allocations[hoveredIndex].percentage / 100)).toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">AUM Capital</span>
                        <span className="text-sm font-extrabold text-white">${activeTradingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        <span className="text-[8px] text-[#00D09C] uppercase font-bold tracking-widest mt-0.5">8 Asset Pairs</span>
                      </>
                    )}
                  </div>
                </div>

                {/* ALLOCATION MATRIX */}
                <div className="space-y-2 pt-2">
                  {allocations.map((alloc, idx) => {
                    const isHovered = hoveredIndex === idx;
                    const value = Math.round(activeTradingBalance * (alloc.percentage / 100));
                    
                    return (
                      <div 
                        key={alloc.ticker}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`flex flex-col space-y-1 p-2 rounded-xl transition-all ${isHovered ? 'bg-white/[0.04]' : ''}`}
                      >
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: alloc.color }}
                            />
                            <span className="text-white font-mono font-bold uppercase tracking-wider">{alloc.ticker}</span>
                            <span className="text-slate-400 font-medium text-[10px]">{alloc.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-slate-400 text-[10px]">${value.toLocaleString()}</span>
                            <span className="text-white font-bold">{alloc.percentage}%</span>
                          </div>
                        </div>
                        
                        {/* Interactive mini balance progress bar */}
                        <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ backgroundColor: alloc.color, width: `${alloc.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* PERFORMANCE ANALYSIS LIST */}
            <div className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
              <div className="flex items-center space-x-2 border-b border-white/[0.03] pb-2">
                <Activity className="w-4 h-4 text-[#00D09C]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Net ROI by Asset</h4>
              </div>
              <div className="space-y-3">
                {performanceList.map(item => (
                  <div key={item.ticker} className="flex justify-between items-center text-xs font-medium">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-white/[0.03] border border-white/[0.05] flex items-center justify-center rounded-lg font-mono font-bold text-[10px]">
                        {item.ticker}
                      </div>
                      <div>
                        <span className="text-white block font-bold">{item.name}</span>
                        <span className="text-[9px] text-slate-400 leading-none block uppercase">Direct Exposure</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${item.status === 'gain' ? 'text-[#00D09C]' : 'text-slate-400'}`}>
                        {item.roi}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold font-mono block leading-none">
                        {item.pnl}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: EXPOSURE */}
        {activeTab === 'exposure' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* PORTFOLIO DIVERSIFICATION SCORE */}
            <div className={`p-5 rounded-[24px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-4 shadow-xl text-center`}>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Diversification Rating</span>
                <h3 className="text-2xl font-extrabold text-[#00D09C] tracking-tight">78% Sovereign Grade</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Capital is diversified across multi-class assets to absorb macro-economic shocks while keeping beta downside optimized.
                </p>
              </div>

              {/* GAUGE STATS GRID */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.04] text-left">
                <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xl space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-semibold block leading-none">Beta Coefficient</span>
                  <span className="text-xs font-bold text-white font-mono">0.64 (Optimized)</span>
                </div>
                <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xl space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-semibold block leading-none">Sharpe Ratio</span>
                  <span className="text-xs font-bold text-[#00D09C] font-mono">2.85 (High Yield)</span>
                </div>
              </div>
            </div>

            {/* SECTOR EXPOSURE MATRIX */}
            <div className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-3.5 shadow-sm`}>
              <div className="flex items-center space-x-2 border-b border-white/[0.03] pb-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Capital Sector Weights</h4>
              </div>
              <div className="space-y-4">
                {exposures.map(sector => (
                  <div key={sector.name} className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs font-semibold">
                      <span className="text-slate-200">{sector.name}</span>
                      <div className="space-x-1.5 font-mono">
                        <span className="text-slate-400 text-[10px]">${Math.round(sector.value).toLocaleString()}</span>
                        <span className="text-white font-extrabold">{sector.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ backgroundColor: sector.color, width: `${sector.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CLOSED POSITIONS (WIN / LOSS RECORDS) */}
            <div className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Closed Positions</h4>
                </div>
                <span className="text-[9px] bg-[#00D09C]/10 text-[#00D09C] font-bold px-2 py-0.5 rounded-md font-mono">75.0% Win Rate</span>
              </div>
              <div className="space-y-3">
                {closedPositions.map((pos, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-medium">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[9px] ${pos.win ? 'bg-[#00D09C]/10 text-[#00D09C]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'}`}>
                        {pos.ticker}
                      </div>
                      <div>
                        <span className="text-white block font-bold">{pos.name}</span>
                        <span className="text-[9px] text-slate-500 font-sans block leading-none mt-0.5">{pos.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${pos.win ? 'text-[#00D09C]' : 'text-[#FF6B6B]'}`}>
                        {pos.pnl}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold block leading-none">
                        {pos.win ? 'Trade Profit' : 'Trade Drawdown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: AI HISTORY SHIFTS */}
        {activeTab === 'ai-history' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* AI ALLOCATION GUARDIAN CARD */}
            <div className={`p-5 rounded-[24px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-4 shadow-xl`}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#00D09C]/10 border border-[#00D09C]/20 text-[#00D09C] rounded-2xl flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">Aver Rotating Allocation Engine</h4>
                  <p className="text-slate-400 text-xs leading-normal">
                    The engine continually monitors cross-chain liquidity metrics, market correlation indexes, and macroeconomic sentiment to shift capital dynamically.
                  </p>
                </div>
              </div>
            </div>

            {/* AI SHIFT TIMELINE */}
            <div className={`p-4 rounded-[20px] border ${isDark ? 'bg-[#0E1320] border-white/[0.05]' : 'bg-white border-slate-200'} space-y-3 shadow-sm`}>
              <div className="flex items-center space-x-2 border-b border-white/[0.03] pb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent AI Capital Shifts</h4>
              </div>
              <div className="relative border-l border-white/5 pl-4 ml-2.5 space-y-5 pt-1">
                {aiRebalanceLog.map((log, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#00D09C] border-2 border-[#080B11] shadow-[0_0_4px_#00D09C]" />
                    
                    <span className="text-[9px] text-[#00D09C] font-semibold font-mono block leading-none">
                      {log.date}
                    </span>
                    <h5 className="text-xs font-bold text-white tracking-tight leading-snug">
                      {log.action}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                      {log.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        </div>
      </main>
    </motion.div>
  );
}
