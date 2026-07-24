import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Bot, Users, Sparkles, Flame, Calendar, BookOpen, ChevronRight, 
  PlayCircle, LifeBuoy, Zap, Layers, Cpu, BarChart2, CheckCircle2, ShieldCheck, 
  ArrowUpRight, Clock, Activity, Sliders, X, Radio
} from 'lucide-react';
import CoinLogo from './CoinLogo';
import { usePreferences } from '../contexts/PreferencesContext';
import CopyTradeDashboard from './copytrade/CopyTradeDashboard';

// Institutional-grade AI Strategies Dataset
const AI_STRATEGIES = [
  {
    id: 'quantum-momentum',
    name: "Quantum Momentum AI",
    badge: "HFT Quantitative",
    tagline: "Micro-Arbitrage & Trend Acceleration Engine",
    description: "Executes micro-arbitrage and high-frequency trend-following using neural sentiment analysis across Tier-1 CEX order books and DEX liquidity pools.",
    apy: "+42.8%",
    risk: "Medium",
    riskScore: 5, // out of 10
    users: "12,450",
    tvl: "$18.4M",
    successRate: "94.2%",
    avgHoldTime: "4.2 hrs",
    maxDrawdown: "-3.8%",
    monthlyReturn: "+11.4%",
    sharpeRatio: "3.12",
    executionFreq: "~140 trades/day",
    color: "emerald",
    icon: Zap,
    executionSteps: [
      "Order Book Sentiment Analysis: Scans 20,000+ depth snapshot updates per second.",
      "Dynamic Position Sizing: Adjusts leverage dynamically from 1x to 5x based on order imbalance.",
      "Sub-Second Routing: Routes trades via automated private RPC relays for zero front-running."
    ]
  },
  {
    id: 'arbitrage-alpha',
    name: "Arbitrage Alpha v4",
    badge: "Delta Neutral",
    tagline: "Cross-Venue Delta-Neutral Spread Harvester",
    description: "Captures instant price discrepancies between global exchanges while maintaining dynamic delta-neutral derivative hedges to neutralize market directional risk.",
    apy: "+35.2%",
    risk: "Low",
    riskScore: 2,
    users: "8,920",
    tvl: "$24.1M",
    successRate: "98.7%",
    avgHoldTime: "18 mins",
    maxDrawdown: "-1.1%",
    monthlyReturn: "+8.9%",
    sharpeRatio: "4.28",
    executionFreq: "~320 trades/day",
    color: "cyan",
    icon: Layers,
    executionSteps: [
      "Cross-CEX & DEX Liquidity Scan: Identifies orderbook spread anomalies > 0.15%.",
      "Instant Delta Hedge: Opens offsetting short perps to lock in gross spread risk-free.",
      "Automated Rebalancing: Settles profits into base stablecoins once spread converges."
    ]
  },
  {
    id: 'neural-yield',
    name: "Neural Yield Harvester",
    badge: "DeFi Yield",
    tagline: "Autonomous Concentrated Liquidity Router",
    description: "Dynamically rebalances automated liquidity provision across high-yield DeFi protocols with predictive impermanent loss hedging.",
    apy: "+51.5%",
    risk: "High",
    riskScore: 8,
    users: "15,300",
    tvl: "$31.8M",
    successRate: "89.6%",
    avgHoldTime: "2.5 days",
    maxDrawdown: "-6.9%",
    monthlyReturn: "+14.8%",
    sharpeRatio: "2.65",
    executionFreq: "Auto Rebalance",
    color: "purple",
    icon: Cpu,
    executionSteps: [
      "Predictive Range Fitting: Forecasts price boundaries using GARCH volatility modeling.",
      "Concentrated Rebalancing: Relocates tick range before out-of-range volatility spikes.",
      "Auto-Compounding Rewards: Reinvests farmed tokens back into protocol liquidity pools."
    ]
  },
  {
    id: 'macro-volatility',
    name: "Macro Volatility Pulse",
    badge: "Volatility Arbitrage",
    tagline: "Adaptive Skew & Options Volatility Engine",
    description: "Monitors derivatives skew, macro sentiment, and on-chain whale liquidations to capture explosive directional momentum on major crypto assets.",
    apy: "+48.2%",
    risk: "Medium-High",
    riskScore: 7,
    users: "6,740",
    tvl: "$12.2M",
    successRate: "91.8%",
    avgHoldTime: "12.0 hrs",
    maxDrawdown: "-5.2%",
    monthlyReturn: "+12.9%",
    sharpeRatio: "2.94",
    executionFreq: "~25 trades/day",
    color: "amber",
    icon: BarChart2,
    executionSteps: [
      "Derivatives Skew Monitor: Evaluates put/call ratios and funding rate extremes.",
      "Breakout Signal Generation: Triggers entry on confirmed institutional orderflow bursts.",
      "Trailing Profit Locks: Uses volatility-adaptive trailing stops to lock in top gains."
    ]
  }
];

export default function DiscoverView({ 
  theme, 
  onOpenMarketHighlights, 
  onOpenEventsPromos, 
  onOpenSupportCenter 
}: { 
  theme: 'light' | 'dark', 
  onOpenMarketHighlights: () => void, 
  onOpenEventsPromos: () => void,
  onOpenSupportCenter: () => void
}) {
  const isDark = theme === 'dark';
  const { t } = usePreferences();
  
  const [showCopyTrade, setShowCopyTrade] = useState(false);
  
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  const [trendingAssets, setTrendingAssets] = useState<any[]>([]);
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState<typeof AI_STRATEGIES[0] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [simulatedAllocation, setSimulatedAllocation] = useState(2500);

  const activeStrategy = AI_STRATEGIES[activeStrategyIndex];

  useEffect(() => {
    // Dynamic Trending Assets
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/trending');
        const data = await res.json();
        
        if (data && data.coins) {
          setTrendingAssets(data.coins.slice(0, 3).map((c: any) => ({
            symbol: c.item.symbol,
            name: c.item.name,
            price: `$${c.item.price_btc.toFixed(6)}`,
            change: '+5.0%', // Placeholder
            isPositive: true
          })));
        } else {
          // Fallback if API rate limited
          setTrendingAssets([
            { symbol: 'SOL', name: 'Solana', price: '$143.20', change: '+5.4%', isPositive: true },
            { symbol: 'AVAX', name: 'Avalanche', price: '$35.12', change: '+2.1%', isPositive: true },
            { symbol: 'INJ', name: 'Injective', price: '$28.40', change: '-1.2%', isPositive: false }
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch trending:", e);
        // Fallback
        setTrendingAssets([
          { symbol: 'SOL', name: 'Solana', price: '$143.20', change: '+5.4%', isPositive: true },
          { symbol: 'AVAX', name: 'Avalanche', price: '$35.12', change: '+2.1%', isPositive: true },
          { symbol: 'INJ', name: 'Injective', price: '$28.40', change: '-1.2%', isPositive: false }
        ]);
      }
    };
    fetchTrending();
  }, []);

  if (showCopyTrade) {
    return (
      <CopyTradeDashboard 
        theme={theme} 
        onBack={() => setShowCopyTrade(false)} 
      />
    );
  }

  // Get color styles based on strategy theme
  const getStrategyColors = (color: string) => {
    switch(color) {
      case 'cyan':
        return {
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
          glow: 'from-cyan-500/10 via-transparent to-transparent',
          borderHover: 'hover:border-cyan-500/40',
          accentText: 'text-cyan-400',
          btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20',
        };
      case 'purple':
        return {
          badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          iconBg: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
          glow: 'from-purple-500/10 via-transparent to-transparent',
          borderHover: 'hover:border-purple-500/40',
          accentText: 'text-purple-400',
          btnBg: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/20',
        };
      case 'amber':
        return {
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
          glow: 'from-amber-500/10 via-transparent to-transparent',
          borderHover: 'hover:border-amber-500/40',
          accentText: 'text-amber-400',
          btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/20',
        };
      case 'emerald':
      default:
        return {
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]',
          glow: 'from-emerald-500/10 via-transparent to-transparent',
          borderHover: 'hover:border-emerald-500/40',
          accentText: 'text-emerald-400',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/20',
        };
    }
  };

  const colors = getStrategyColors(activeStrategy.color);
  const StrategyIcon = activeStrategy.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-6"
    >
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${textPrimary}`}>{t('common.discover_title')}</h2>
          <p className={`text-sm ${textSecondary} mt-1`}>{t('common.discover_subtitle')}</p>
        </div>
      </div>

      {/* Featured Banner with High-End Real Photo background */}
      <div 
        className="rounded-[24px] overflow-hidden relative p-6 sm:p-8 text-white shadow-lg min-h-[220px] flex items-center bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('/src/assets/images/trading_desk_banner_1784189632740.jpg')` }}
      >
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-[10px] font-extrabold uppercase tracking-widest mb-3 border border-emerald-500/30">
            Platform Update
          </span>
          <h3 className="text-xl sm:text-2xl font-black mb-1 text-slate-100 tracking-tight">AverNoxTrader v2.0 is Almost Here</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-5 leading-relaxed">A major upgrade is on the way with smarter AI trading, improved copy trading, faster performance, and exciting new features. Stay tuned for the official release.</p>
          <button disabled className="px-5 py-2 rounded-xl bg-white/10 text-white/50 font-bold text-xs cursor-not-allowed border border-white/10 transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      {/* Dynamic Grid: Trending & AI Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Col: Trending Assets (4 Cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                <Flame className="w-5 h-5 mr-2 text-orange-500" />
                {t('common.trending_assets')}
              </h3>
              <button className={`text-xs font-bold text-orange-500 hover:text-orange-400`}>{t('common.view_all')}</button>
            </div>
            <div className={`rounded-[24px] overflow-hidden ${cardClasses} divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {trendingAssets.map((asset, i) => (
                <div key={`${asset.symbol}-${i}`} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center space-x-3">
                    <CoinLogo symbol={asset.symbol} size={38} />
                    <div>
                      <p className={`font-bold text-sm ${textPrimary}`}>{asset.symbol}</p>
                      <p className={`text-[11px] ${textSecondary}`}>{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${textPrimary}`}>{asset.price}</p>
                    <p className={`text-[11px] font-semibold flex items-center justify-end mt-0.5 ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {asset.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Market Insights Mini-Card */}
          <div className={`mt-4 p-4 rounded-[20px] ${isDark ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-100'} flex items-start space-x-3`}>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className={`text-xs font-bold ${textPrimary}`}>AI Market Pulse</p>
              <p className={`text-[11px] ${textSecondary} mt-0.5 leading-relaxed`}>
                Orderbook depth skew indicates institutional accumulation in SOL & AVAX derivatives. High-frequency arbitrage yields elevated by +1.4%.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Institutional-Grade Featured AI Strategies (7 Cols on lg) */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Bot className="w-5 h-5 mr-2 text-emerald-500" />
              Institutional AI Strategies
            </h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Live Neural Models
            </span>
          </div>

          {/* Institutional Strategy Container Card */}
          <div className={`rounded-[24px] p-5 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardClasses} ${colors.borderHover} flex flex-col justify-between min-h-[440px]`}>
            
            {/* Ambient Background Gradient Glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${colors.glow} blur-[60px] rounded-full pointer-events-none`} />

            {/* Subtle Abstract Neural Wave Background SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none">
              <defs>
                <linearGradient id="aiGraphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="waveLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <pattern id="gridPattern" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" className={isDark ? "text-slate-700/30" : "text-slate-300/40"} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />
              <path 
                d="M 0 160 Q 100 60, 200 120 T 400 80 T 600 140 L 600 300 L 0 300 Z" 
                fill="url(#aiGraphGrad)" 
              />
              <path 
                d="M 0 160 Q 100 60, 200 120 T 400 80 T 600 140" 
                fill="none" 
                stroke="url(#waveLine)" 
                strokeWidth="2.5" 
                strokeDasharray="4 2" 
              />
              <circle cx="200" cy="120" r="4" fill="#10b981" />
              <circle cx="400" cy="80" r="4" fill="#06b6d4" />
            </svg>

            {/* Card Content Stack */}
            <div className="relative z-10 space-y-5">
              
              {/* Strategy Switcher Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5 pb-3">
                {AI_STRATEGIES.map((strat, idx) => {
                  const isActive = idx === activeStrategyIndex;
                  return (
                    <button
                      key={strat.id}
                      onClick={() => setActiveStrategyIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isActive
                          ? (isDark ? 'bg-white/10 text-white border border-white/15 shadow-md' : 'bg-slate-900 text-white')
                          : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100')
                      }`}
                    >
                      <strat.icon className={`w-3.5 h-3.5 ${isActive ? colors.accentText : 'text-slate-400'}`} />
                      <span>{strat.name.split(' ')[0]} {strat.name.split(' ')[1] || ''}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Strategy Header & Icon */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeStrategy.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      {/* Logo Icon with Halo */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors.iconBg} backdrop-blur-md flex-shrink-0`}>
                        <StrategyIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-black text-lg ${textPrimary} tracking-tight`}>{activeStrategy.name}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${colors.badgeBg} uppercase tracking-wider`}>
                            {activeStrategy.badge}
                          </span>
                        </div>
                        <p className={`text-xs font-semibold ${colors.accentText}`}>{activeStrategy.tagline}</p>
                      </div>
                    </div>

                    {/* APY Hero Pill */}
                    <div className="text-right flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-2xl backdrop-blur-md">
                      <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Est. APY</p>
                      <p className="text-lg font-black text-emerald-400 tracking-tight">{activeStrategy.apy}</p>
                    </div>
                  </div>

                  {/* Concise Professional Explanation */}
                  <p className={`text-xs ${textSecondary} leading-relaxed`}>
                    {activeStrategy.description}
                  </p>

                  {/* Key Metrics Stat Chips Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {/* Stat 1: Win Rate */}
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] font-medium ${textSecondary} block`}>Success Rate</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className={`text-xs font-black ${textPrimary}`}>{activeStrategy.successRate}</span>
                      </div>
                    </div>

                    {/* Stat 2: Risk Profile */}
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] font-medium ${textSecondary} block`}>Risk Profile</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs font-black ${
                          activeStrategy.risk === 'Low' ? 'text-emerald-400' :
                          activeStrategy.risk === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {activeStrategy.risk}
                        </span>
                        {/* 5-bar risk meter */}
                        <div className="flex items-center gap-0.5">
                          {[2, 4, 6, 8, 10].map(val => (
                            <span 
                              key={val} 
                              className={`w-1 h-2 rounded-full ${
                                val <= activeStrategy.riskScore 
                                  ? (activeStrategy.riskScore <= 3 ? 'bg-emerald-400' : activeStrategy.riskScore <= 6 ? 'bg-amber-400' : 'bg-rose-400')
                                  : 'bg-slate-700/40'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stat 3: Avg Hold Time */}
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] font-medium ${textSecondary} block`}>Avg Duration</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span className={`text-xs font-black ${textPrimary}`}>{activeStrategy.avgHoldTime}</span>
                      </div>
                    </div>

                    {/* Stat 4: TVL / Active Users */}
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/60'}`}>
                      <span className={`text-[10px] font-medium ${textSecondary} block`}>Vault TVL</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span className={`text-xs font-black ${textPrimary}`}>{activeStrategy.tvl}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Premium CTA Controls */}
            <div className="relative z-10 pt-4 mt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-2.5">
              <button 
                onClick={() => {
                  setSelectedStrategy(activeStrategy);
                  setIsModalVisible(true);
                }}
                className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white transition-all transform active:scale-[0.98] shadow-md flex items-center justify-center gap-2 ${colors.btnBg}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze Strategy Deep-Dive</span>
              </button>

              <button
                onClick={() => {
                  setSelectedStrategy(activeStrategy);
                  setIsModalVisible(true);
                }}
                className={`w-full sm:w-auto py-3 px-4 rounded-xl text-xs font-bold transition-colors border ${
                  isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
                } flex items-center justify-center gap-1.5`}
              >
                <span>Full Spec</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* PREMIUM COPY TRADE LAUNCHER CARD */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            Copy Trade
          </h3>
        </div>
        
        <button 
          onClick={() => setShowCopyTrade(true)}
          className={`w-full p-5 rounded-[24px] ${cardClasses} transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-blue-500/30 flex items-center justify-between text-left group relative overflow-hidden`}
        >
          {/* Subtle blue gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[30px] rounded-full" />
          
          <div className="flex items-center space-x-4 z-10">
            <Users className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div>
              <h4 className={`font-black text-base ${textPrimary}`}>Top Traders</h4>
              <p className={`text-xs ${textSecondary} mt-0.5`}>Replicate institutional-grade neural configurations from high-performance traders.</p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors z-10 gap-1">
            <span>Explore</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>

      {/* Dynamic Grid: Secondary sections */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { title: 'Market Highlights', icon: Sparkles, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5', onClick: onOpenMarketHighlights },
          { title: 'Events & Promos', icon: Calendar, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5', onClick: onOpenEventsPromos },
          { title: 'Support Center', icon: LifeBuoy, color: 'text-emerald-500', bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5', onClick: onOpenSupportCenter },
        ].map((item, i) => (
          <motion.button 
            key={`${item.title}-${i}`} 
            onClick={item.onClick}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-[24px] ${cardClasses} flex flex-col items-start text-left group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-white/20`}
          >
            {/* Texture/Graphics Effect */}
            <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent pointer-events-none`}></div>
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.bg} backdrop-blur-sm border border-white/5 shadow-inner`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <h4 className={`font-black text-base ${textPrimary} mb-1 tracking-tight`}>{item.title}</h4>
            <div className={`flex items-center text-xs font-bold ${textSecondary} group-hover:text-white transition-colors`}>
              Access Now <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>
        ))}
      </motion.div>
      
      {/* INSTITUTIONAL STRATEGY ANALYSIS MODAL */}
      <AnimatePresence>
        {isModalVisible && selectedStrategy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl border ${
                isDark ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

              {/* Close Button */}
              <button 
                onClick={() => setIsModalVisible(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center space-x-3.5 mb-5 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <selectedStrategy.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight">{selectedStrategy.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedStrategy.badge}
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>{selectedStrategy.tagline}</p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 mb-5 text-center">
                <div>
                  <p className={`text-[10px] ${textSecondary}`}>Est. APY</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">{selectedStrategy.apy}</p>
                </div>
                <div>
                  <p className={`text-[10px] ${textSecondary}`}>Sharpe</p>
                  <p className="text-sm font-black text-cyan-400 mt-0.5">{selectedStrategy.sharpeRatio}</p>
                </div>
                <div>
                  <p className={`text-[10px] ${textSecondary}`}>Win Rate</p>
                  <p className="text-sm font-black text-purple-400 mt-0.5">{selectedStrategy.successRate}</p>
                </div>
                <div>
                  <p className={`text-[10px] ${textSecondary}`}>Max DD</p>
                  <p className="text-sm font-black text-rose-400 mt-0.5">{selectedStrategy.maxDrawdown}</p>
                </div>
              </div>

              {/* Algorithm Mechanism Breakdown */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Execution Logic & Rules
                </h4>
                <div className="space-y-2">
                  {selectedStrategy.executionSteps.map((step, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start space-x-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className={`${textSecondary} leading-relaxed`}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yield Calculator Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300">Simulated Allocation</span>
                  <span className="text-sm font-black text-emerald-400">${simulatedAllocation.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="10000" 
                  step="250"
                  value={simulatedAllocation}
                  onChange={(e) => setSimulatedAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-emerald-500/20 text-xs">
                  <span className="text-slate-400">Projected 1-Year Net Gain:</span>
                  <span className="font-black text-emerald-400 text-sm">
                    +${Math.round(simulatedAllocation * (parseFloat(selectedStrategy.apy) / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Deploy Strategy to AI Session</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
