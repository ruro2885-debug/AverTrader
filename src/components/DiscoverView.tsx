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

// Institutional-grade AI Strategies Dataset with Advisor Insights
const AI_STRATEGIES = [
  {
    id: 'quantum-momentum',
    name: "Quantum Momentum AI",
    badge: "HFT Quantitative",
    tagline: "Micro-Arbitrage & Trend Acceleration Engine",
    description: "Executes micro-arbitrage and high-frequency trend-following using neural sentiment analysis across Tier-1 CEX order books and DEX liquidity pools.",
    recommendationSummary: "Strongly recommended for your portfolio due to high current momentum in Tier-1 order books and optimal volatility compression.",
    personalizedRecommendation: "Based on your $5,000 deposit target and moderate risk appetite, this strategy captures short-term upward acceleration without excessive leverage.",
    marketSuitability: {
      status: "Excellent",
      reason: "High orderbook depth and upward volume skew make this ideal for trend continuation capture."
    },
    whenToUse: [
      "Bullish trend breakouts with sustained volume",
      "Low volatility compression before sharp expansion",
      "Active institutional accumulation sessions"
    ],
    whenToAvoid: [
      "Choppy sideways ranging markets",
      "Low volume weekend trading hours",
      "High-impact macroeconomic news release windows"
    ],
    compatibilityCheck: {
      status: "Optimal",
      advice: "Your current risk tolerance matches this strategy's medium volatility profile. No configuration adjustments needed."
    },
    configImpact: {
      frequency: "High (~140 trades/day)",
      riskExposure: "Moderate (5/10)",
      positionSizing: "15% per trade allocation",
      stopLoss: "Dynamic trailing stop @ 1.5%",
      capitalAllocation: "80% active trading / 20% cash buffer"
    },
    activityEstimate: {
      tradesPerDay: "120 - 150 trades",
      avgDuration: "4.2 hours",
      preferredAssets: ["BTC", "ETH", "SOL"]
    },
    comparisonWithActive: {
      advantages: "Captures rapid breakout gains significantly faster than macro swing models.",
      disadvantages: "Higher trade frequency incurs slightly higher gas and exchange routing fees."
    },
    simulations: {
      normal: "+42.8% APY (+$2,140 / yr)",
      bullish: "+68.4% APY (+$3,420 / yr)",
      bearish: "+12.2% APY (+$610 / yr)"
    },
    apy: "+42.8%",
    risk: "Medium",
    riskScore: 5,
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
    recommendationSummary: "Recommended if you prefer steady, low-risk yield generation with zero directional market exposure.",
    personalizedRecommendation: "Tailored for conservative risk profiles seeking consistent returns regardless of overall market direction.",
    marketSuitability: {
      status: "Good",
      reason: "Persistent price spreads across decentralized and centralized venues provide reliable arbitrage opportunities."
    },
    whenToUse: [
      "High volatility periods with venue price discrepancies",
      "Sideways or uncertain macroeconomic sentiment",
      "Capital preservation phases"
    ],
    whenToAvoid: [
      "Extreme low volatility with tight uniform spreads",
      "Periods of severe cross-exchange network congestion"
    ],
    compatibilityCheck: {
      status: "Compatible",
      advice: "Recommended to increase cash buffer to 30% to maximize delta-neutral margin efficiency."
    },
    configImpact: {
      frequency: "Very High (~320 trades/day)",
      riskExposure: "Low (2/10)",
      positionSizing: "10% per spread execution",
      stopLoss: "Instant convergence stop",
      capitalAllocation: "90% active / 10% reserve"
    },
    activityEstimate: {
      tradesPerDay: "300 - 350 trades",
      avgDuration: "18 minutes",
      preferredAssets: ["BTC", "ETH", "SOL", "AVAX"]
    },
    comparisonWithActive: {
      advantages: "Virtually eliminates directional risk and drawdowns.",
      disadvantages: "Lower absolute yield ceiling during explosive bull runs."
    },
    simulations: {
      normal: "+35.2% APY (+$1,760 / yr)",
      bullish: "+38.5% APY (+$1,925 / yr)",
      bearish: "+34.1% APY (+$1,705 / yr)"
    },
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
    recommendationSummary: "Recommended for yield maximization if you are comfortable with higher protocol and impermanent loss exposure.",
    personalizedRecommendation: "Suited for investors looking to compound DeFi farming yields using automated predictive tick rebalancing.",
    marketSuitability: {
      status: "Neutral",
      reason: "Current DEX trading fee volume is stable, offering moderate fee APRs with manageable impermanent loss risk."
    },
    whenToUse: [
      "High volume trading ranges with strong fee generation",
      "Expanding DeFi lending and staking yields"
    ],
    whenToAvoid: [
      "One-sided directional token breakouts causing severe impermanent loss",
      "Low fee-tier liquidity pools"
    ],
    compatibilityCheck: {
      status: "Review Required",
      advice: "Ensure your selected assets include stablepair or correlated pairs to minimize impermanent loss."
    },
    configImpact: {
      frequency: "Automated Rebalance (~12/day)",
      riskExposure: "High (8/10)",
      positionSizing: "25% per pool range",
      stopLoss: "Automated out-of-range exit",
      capitalAllocation: "75% liquidity / 25% safety"
    },
    activityEstimate: {
      tradesPerDay: "10 - 15 rebalances",
      avgDuration: "2.5 days",
      preferredAssets: ["ETH", "SOL", "USDC"]
    },
    comparisonWithActive: {
      advantages: "Higher peak yields via automated fee compounding.",
      disadvantages: "Higher exposure to impermanent loss during sudden market trends."
    },
    simulations: {
      normal: "+51.5% APY (+$2,575 / yr)",
      bullish: "+82.0% APY (+$4,100 / yr)",
      bearish: "+18.4% APY (+$920 / yr)"
    },
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
    recommendationSummary: "Recommended ahead of major economic data releases and high volatility breakout windows.",
    personalizedRecommendation: "Ideal for growth-oriented portfolios looking to capitalize on derivatives mispricing and liquidations.",
    marketSuitability: {
      status: "Good",
      reason: "Derivatives funding rates and put/call skews indicate impending volatility expansion."
    },
    whenToUse: [
      "Upcoming macroeconomic releases (CPI, FOMC)",
      "Derivative open interest expansion near resistance levels"
    ],
    whenToAvoid: [
      "Dead summer quiet periods with low derivatives volume"
    ],
    compatibilityCheck: {
      status: "Optimal",
      advice: "Your portfolio balance is well-suited for options skew and liquidation hunting."
    },
    configImpact: {
      frequency: "Moderate (~25 trades/day)",
      riskExposure: "Medium-High (7/10)",
      positionSizing: "20% per volatility burst",
      stopLoss: "Trailing volatility stop @ 2.5%",
      capitalAllocation: "70% active / 30% reserve"
    },
    activityEstimate: {
      tradesPerDay: "20 - 30 trades",
      avgDuration: "12.0 hours",
      preferredAssets: ["BTC", "ETH"]
    },
    comparisonWithActive: {
      advantages: "Excellent capture of explosive macro trend movements.",
      disadvantages: "Occasional whipsaws during false breakout triggers."
    },
    simulations: {
      normal: "+48.2% APY (+$2,410 / yr)",
      bullish: "+94.5% APY (+$4,725 / yr)",
      bearish: "+5.1% APY (+$255 / yr)"
    },
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
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
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

        {/* Institutional AI Strategies Summary Card */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Bot className="w-5 h-5 mr-2 text-emerald-500" />
              Institutional AI Strategies
            </h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
              Professional Suite
            </span>
          </div>

          <div className={`rounded-[20px] p-4 sm:p-5 relative overflow-hidden transition-all duration-300 ${cardClasses} border border-emerald-500/20`}>
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3">
              
              {/* Header: Icon, Title & Button */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`font-black text-base ${textPrimary} tracking-tight`}>Algorithmic Trading Command</h4>
                    <p className={`text-[10px] font-semibold text-emerald-400`}>Multi-Venue Quantitative & Sentiment Engines</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsExplorerOpen(true)}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  <span>Explore Strategies</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-950" />
                </button>
              </div>

              {/* Description */}
              <p className={`text-xs ${textSecondary} leading-relaxed max-w-2xl`}>
                Professional AI models for quantitative execution and risk optimization, tailored to your portfolio.
              </p>

              {/* Mini Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                  Trend Detection & Skew
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                  Conservative to High-Growth
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                  BTC, ETH, SOL & DeFi
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400`}>
                  <Bot className="w-3 h-3" />
                  4 Professional Models
                </div>
              </div>
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
      
      {/* INSTITUTIONAL STRATEGY ANALYSIS & ADVISOR MODAL */}
      <AnimatePresence>
        {isModalVisible && selectedStrategy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 relative shadow-2xl border ${
                isDark ? 'bg-slate-900/98 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
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
              <div className="flex items-center space-x-3.5 mb-6 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <selectedStrategy.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black tracking-tight">{selectedStrategy.name}</h3>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {selectedStrategy.badge}
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>{selectedStrategy.tagline}</p>
                </div>
              </div>

              {/* 1. AI Recommendation Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">AI Recommendation Insight</h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {selectedStrategy.recommendationSummary}
                  </p>
                </div>
              </div>

              {/* 2. Why this strategy is recommended for you */}
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" />
                    Why This Strategy Is Recommended For You
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedStrategy.personalizedRecommendation}
                  </p>
                </div>

                {/* 3. Live Market Suitability */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Live Market Suitability</span>
                    <p className="text-xs text-slate-200">{selectedStrategy.marketSuitability.reason}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    selectedStrategy.marketSuitability.status === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedStrategy.marketSuitability.status === 'Good' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedStrategy.marketSuitability.status}
                  </span>
                </div>
              </div>

              {/* 4. When should I use / avoid it */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> When Should I Use It?
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedStrategy.whenToUse.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> When Should I Avoid It?
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedStrategy.whenToAvoid.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. AI Compatibility Check & Configuration Impact */}
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" /> AI Compatibility Check
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                      {selectedStrategy.compatibilityCheck.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{selectedStrategy.compatibilityCheck.advice}</p>
                </div>

                {/* Configuration Impact Preview */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Impact on Your AI Configuration</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Trade Frequency</span>
                      <strong className="text-white">{selectedStrategy.configImpact.frequency}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Risk Exposure</span>
                      <strong className="text-white">{selectedStrategy.configImpact.riskExposure}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Position Sizing</span>
                      <strong className="text-white">{selectedStrategy.configImpact.positionSizing}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Stop-Loss Behavior</span>
                      <strong className="text-white">{selectedStrategy.configImpact.stopLoss}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Capital Allocation</span>
                      <strong className="text-white">{selectedStrategy.configImpact.capitalAllocation}</strong>
                    </div>
                  </div>
                </div>

                {/* Expected Trading Activity */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Est. Trades</span>
                    <strong className="text-white">{selectedStrategy.activityEstimate.tradesPerDay}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Holding Duration</span>
                    <strong className="text-white">{selectedStrategy.activityEstimate.avgDuration}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Preferred Assets</span>
                    <strong className="text-emerald-400">{selectedStrategy.activityEstimate.preferredAssets.join(', ')}</strong>
                  </div>
                </div>
              </div>

              {/* 6. Strategy Comparison */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 mb-6 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Comparison with Your Active Strategy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-400 font-bold block mb-0.5">Advantages:</span>
                    <p className="text-slate-300">{selectedStrategy.comparisonWithActive.advantages}</p>
                  </div>
                  <div>
                    <span className="text-rose-400 font-bold block mb-0.5">Disadvantages:</span>
                    <p className="text-slate-300">{selectedStrategy.comparisonWithActive.disadvantages}</p>
                  </div>
                </div>
              </div>

              {/* 7. Interactive Strategy Simulator */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Interactive Capital Simulation</span>
                  <span className="text-base font-black text-emerald-400">${simulatedAllocation.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="25000" 
                  step="500"
                  value={simulatedAllocation}
                  onChange={(e) => setSimulatedAllocation(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-700/50 rounded-lg appearance-none cursor-pointer"
                />
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-emerald-500/20 text-xs text-center font-mono">
                  <div className="p-2 rounded-xl bg-black/20">
                    <span className="text-slate-400 block text-[10px]">NORMAL</span>
                    <strong className="text-emerald-400">{selectedStrategy.simulations.normal}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/20">
                    <span className="text-slate-400 block text-[10px]">BULLISH</span>
                    <strong className="text-emerald-400">{selectedStrategy.simulations.bullish}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/20">
                    <span className="text-slate-400 block text-[10px]">BEARISH</span>
                    <strong className="text-amber-400">{selectedStrategy.simulations.bearish}</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsModalVisible(false)}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Deploy Strategy & Activate AI Advisor</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STRATEGY EXPLORER MODAL */}
      <AnimatePresence>
        {isExplorerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 relative shadow-2xl border ${
                isDark ? 'bg-slate-900/98 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

              {/* Close Button */}
              <button 
                onClick={() => setIsExplorerOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3.5 mb-6 pr-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Institutional AI Strategy Explorer</h3>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>Browse professional quantitative models, review advisor insights, and simulate portfolio allocations.</p>
                </div>
              </div>

              {/* Strategies List */}
              <div className="space-y-4 mb-6">
                {AI_STRATEGIES.map((strat) => {
                  const StratIcon = strat.icon;
                  return (
                    <div 
                      key={strat.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDark ? 'bg-white/[0.03] border-white/5 hover:border-emerald-500/30' : 'bg-slate-50 border-slate-200 hover:border-emerald-500/30'
                      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <StratIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-black text-base ${textPrimary}`}>{strat.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {strat.badge}
                            </span>
                          </div>
                          <p className={`text-xs ${textSecondary} line-clamp-1`}>{strat.tagline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block">Est. APY</span>
                          <strong className="text-emerald-400 text-sm font-black">{strat.apy}</strong>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStrategy(strat);
                            setIsExplorerOpen(false);
                            setIsModalVisible(true);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <span>Advisor Deep-Dive</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setIsExplorerOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
                >
                  Close Explorer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
