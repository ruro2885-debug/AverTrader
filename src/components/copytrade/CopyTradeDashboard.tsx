import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, TrendingUp, TrendingDown, ChevronRight, Search, Sliders, X, 
  Brain, ShieldCheck, Trophy, Sparkles, Star, Zap, Eye, Cpu, BookOpen,
  ArrowUpRight, ArrowDownRight, Clock, DollarSign, CheckCircle2, UserCheck, Play
} from 'lucide-react';
import { generateAvatarSvg } from '../../utils/avatarGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { aiTradingService } from '../../services/aiTradingService';
import { Timestamp } from 'firebase/firestore';
import { AiConfiguration, TradingSchedule, RiskControls, RecommendationRules } from '../../types/aiTrading';

interface Trader {
  id: string;
  username: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  verified: boolean;
  return30D: number;
  winRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  style: 'SCALPING' | 'DAY_TRADING' | 'SWING_TRADING';
  preferredMarkets: string[];
  followers: number;
  status: 'Trading' | 'Analyzing' | 'Online' | 'Offline';
  bio: string;
  avatarSeed: string;
  strategyName: string;
  pnlHistory30D: number[]; // 10 points for sparkline
  avgTradeDuration: string;
  wins: number;
  losses: number;
  schedule: TradingSchedule;
  riskControls: RiskControls;
  recommendationRules: RecommendationRules;
  advancedBehavior: {
    enableDeepAnalysis: boolean;
    useSentimentGrounding: boolean;
    neuralConfidenceThreshold: number;
  };
  strategyExplanation: string;
  recentTrades: {
    id: string;
    asset: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice?: number;
    pnlPercent?: number;
    status: 'OPEN' | 'CLOSED';
    timestamp: string;
  }[];
}

const INITIAL_TRADERS: Trader[] = [
  {
    id: 'trader_ariazen',
    username: 'AriaZen',
    tier: 'Platinum',
    verified: true,
    return30D: 214.78,
    winRate: 88.4,
    riskLevel: 'HIGH',
    style: 'SCALPING',
    preferredMarkets: ['BTC', 'ETH', 'SOL'],
    followers: 18650,
    status: 'Trading',
    bio: 'Quantitative researcher specializing in neural network-driven momentum scalp setups with high capital efficiency.',
    avatarSeed: 'AriaZen_illust',
    strategyName: 'Neural Momentum Scalper v4',
    pnlHistory30D: [5, 12, 10, 24, 45, 68, 110, 145, 182, 214.78],
    avgTradeDuration: '14 minutes',
    wins: 342,
    losses: 45,
    schedule: {
      sessions: [{ start: '08:00', end: '16:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 15,
      maxSimultaneousPositions: 4,
      exposureLimit: 60,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 2.5
    },
    recommendationRules: {
      minConfidence: 82,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['RSI', 'MACD', 'EMA_CROSS', 'BOLL_BREAKOUT']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 85
    },
    strategyExplanation: 'Deploys a sub-minute multi-layer neural network on Binance Spot & Futures feeds to capture micro-divergences during high liquidity European & US trading hours.',
    recentTrades: [
      { id: 't1', asset: 'SOL', type: 'BUY', entryPrice: 142.15, exitPrice: 145.42, pnlPercent: 2.3, status: 'CLOSED', timestamp: '5 mins ago' },
      { id: 't2', asset: 'BTC', type: 'BUY', entryPrice: 64120, exitPrice: 64510, pnlPercent: 0.61, status: 'CLOSED', timestamp: '18 mins ago' },
      { id: 't3', asset: 'ETH', type: 'BUY', entryPrice: 3420, status: 'OPEN', timestamp: 'Just now' }
    ]
  },
  {
    id: 'trader_novastrike',
    username: 'NovaStrike',
    tier: 'Gold',
    verified: true,
    return30D: 176.32,
    winRate: 83.1,
    riskLevel: 'HIGH',
    style: 'SWING_TRADING',
    preferredMarkets: ['SOL', 'AVR', 'ETH'],
    followers: 14210,
    status: 'Trading',
    bio: 'Multi-indicator swing system taking advantage of market breakouts and high beta narrative runners.',
    avatarSeed: 'NovaStrike_vector',
    strategyName: 'Quantum Swing Breakout',
    pnlHistory30D: [8, 15, 30, 25, 60, 95, 80, 120, 150, 176.32],
    avgTradeDuration: '2.4 days',
    wins: 114,
    losses: 23,
    schedule: {
      sessions: [{ start: '00:00', end: '24:00' }],
      weekdays: true,
      weekends: true,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: false
    },
    riskControls: {
      maxPositionSize: 20,
      maxSimultaneousPositions: 3,
      exposureLimit: 50,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 5.0
    },
    recommendationRules: {
      minConfidence: 75,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['ATR_BAND', 'OBV_DIVERGENCE', 'RSI_REVERSAL']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 78
    },
    strategyExplanation: 'A systematic medium-term strategy targeting dynamic liquidity sweep areas and volatility contraction break-outs in high beta altcoins.',
    recentTrades: [
      { id: 't4', asset: 'AVR', type: 'BUY', entryPrice: 1.10, exitPrice: 1.25, pnlPercent: 13.6, status: 'CLOSED', timestamp: '2 hours ago' },
      { id: 't5', asset: 'SOL', type: 'BUY', entryPrice: 138.50, exitPrice: 144.10, pnlPercent: 4.04, status: 'CLOSED', timestamp: '1 day ago' }
    ]
  },
  {
    id: 'trader_lucatrades',
    username: 'LucaTrades',
    tier: 'Gold',
    verified: false,
    return30D: 152.66,
    winRate: 79.5,
    riskLevel: 'MEDIUM',
    style: 'DAY_TRADING',
    preferredMarkets: ['BTC', 'ETH', 'XRP'],
    followers: 12840,
    status: 'Analyzing',
    bio: 'Algorithmic day trader capturing intraday micro-reversals in high-cap assets with high leverage protection limits.',
    avatarSeed: 'LucaTrades_toon',
    strategyName: 'AI Trend Hunter V2',
    pnlHistory30D: [12, 10, 25, 48, 42, 75, 98, 110, 134, 152.66],
    avgTradeDuration: '2.5 hours',
    wins: 215,
    losses: 55,
    schedule: {
      sessions: [{ start: '07:00', end: '19:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 10,
      maxSimultaneousPositions: 5,
      exposureLimit: 40,
      positionSizingPreference: 'FIXED',
      lossLimit: 1.5
    },
    recommendationRules: {
      minConfidence: 80,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['VWAP', 'RSI_OVERBOUGHT_OVERSOLD', 'MACD']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: false,
      neuralConfidenceThreshold: 80
    },
    strategyExplanation: 'Leverages statistical arbitrage and order book imbalances to execute low-drawdown scalp and reversion trades in deep liquidity markets.',
    recentTrades: [
      { id: 't6', asset: 'ETH', type: 'SELL', entryPrice: 3450, exitPrice: 3415, pnlPercent: 1.01, status: 'CLOSED', timestamp: '4 hours ago' },
      { id: 't7', asset: 'XRP', type: 'BUY', entryPrice: 0.585, exitPrice: 0.602, pnlPercent: 2.9, status: 'CLOSED', timestamp: '12 hours ago' }
    ]
  },
  {
    id: 'trader_cipherx',
    username: 'CipherX',
    tier: 'Gold',
    verified: true,
    return30D: 128.97,
    winRate: 81.2,
    riskLevel: 'MEDIUM',
    style: 'SCALPING',
    preferredMarkets: ['SOL', 'FET', 'AVR'],
    followers: 9730,
    status: 'Online',
    bio: 'High-frequency grid algorithm designed to capture price action fluctuations in volatile sideways regimes.',
    avatarSeed: 'CipherX_avatar',
    strategyName: 'Smart Scalper Grid Pro',
    pnlHistory30D: [4, 15, 22, 38, 55, 68, 88, 102, 115, 128.97],
    avgTradeDuration: '4 minutes',
    wins: 512,
    losses: 118,
    schedule: {
      sessions: [{ start: '00:00', end: '24:00' }],
      weekdays: true,
      weekends: true,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: false
    },
    riskControls: {
      maxPositionSize: 5,
      maxSimultaneousPositions: 12,
      exposureLimit: 50,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 1.0
    },
    recommendationRules: {
      minConfidence: 70,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['STOCH_RSI', 'VOLUME_FLOW_INDEX', 'SUPPORT_RESIST']
    },
    advancedBehavior: {
      enableDeepAnalysis: false,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 72
    },
    strategyExplanation: 'A rapid neural grid system that programmatically establishes buy and sell orders in custom bands to farm consolidations in high momentum mid-caps.',
    recentTrades: [
      { id: 't8', asset: 'FET', type: 'BUY', entryPrice: 2.12, exitPrice: 2.18, pnlPercent: 2.83, status: 'CLOSED', timestamp: '1 hour ago' },
      { id: 't9', asset: 'AVR', type: 'BUY', entryPrice: 1.22, exitPrice: 1.25, pnlPercent: 2.45, status: 'CLOSED', timestamp: '3 hours ago' }
    ]
  },
  {
    id: 'trader_zenithflow',
    username: 'ZenithFlow',
    tier: 'Gold',
    verified: false,
    return30D: 112.35,
    winRate: 76.8,
    riskLevel: 'MEDIUM',
    style: 'SWING_TRADING',
    preferredMarkets: ['BTC', 'AVR', 'SOL'],
    followers: 8910,
    status: 'Offline',
    bio: 'Trend following specialist targeting clean macro shifts on weekly/daily candles with minimal leverage.',
    avatarSeed: 'ZenithFlow_figma',
    strategyName: 'AI Breakout Edge',
    pnlHistory30D: [2, 10, 8, 25, 45, 60, 52, 85, 98, 112.35],
    avgTradeDuration: '4.8 days',
    wins: 48,
    losses: 14,
    schedule: {
      sessions: [{ start: '09:00', end: '17:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'GMT+1',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 15,
      maxSimultaneousPositions: 2,
      exposureLimit: 30,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 3.5
    },
    recommendationRules: {
      minConfidence: 80,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['EMA_200', 'MACD_CROSSOVER', 'CHAIKIN_MONEY']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 80
    },
    strategyExplanation: 'Identifies massive multi-month accumulation ranges and places strategic orders right at the boundary breakout vector, keeping drawdowns to an absolute minimum.',
    recentTrades: [
      { id: 't10', asset: 'BTC', type: 'BUY', entryPrice: 62500, exitPrice: 64800, pnlPercent: 3.68, status: 'CLOSED', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'trader_kaioshin',
    username: 'Kaioshin',
    tier: 'Gold',
    verified: true,
    return30D: 98.61,
    winRate: 74.2,
    riskLevel: 'HIGH',
    style: 'DAY_TRADING',
    preferredMarkets: ['FET', 'ETH', 'SOL'],
    followers: 7120,
    status: 'Trading',
    bio: 'Aggressive multi-factor intraday momentum breakouts optimized for high volatility altcoin regimes.',
    avatarSeed: 'Kaioshin_duo',
    strategyName: 'Volatility Master Pro',
    pnlHistory30D: [5, 22, -4, 18, 44, 38, 70, 92, 80, 98.61],
    avgTradeDuration: '1.2 hours',
    wins: 182,
    losses: 63,
    schedule: {
      sessions: [{ start: '02:00', end: '22:00' }],
      weekdays: true,
      weekends: true,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: false
    },
    riskControls: {
      maxPositionSize: 25,
      maxSimultaneousPositions: 4,
      exposureLimit: 80,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 4.0
    },
    recommendationRules: {
      minConfidence: 72,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['ATR', 'ADX_STRENGTH', 'VOLUME_SPIKE']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: false,
      neuralConfidenceThreshold: 75
    },
    strategyExplanation: 'A momentum continuation model that enters positions when standard deviation expands past 3-day bands, exiting rapidly as volatility returns to standard values.',
    recentTrades: [
      { id: 't11', asset: 'FET', type: 'BUY', entryPrice: 1.95, exitPrice: 2.15, pnlPercent: 10.25, status: 'CLOSED', timestamp: '3 hours ago' }
    ]
  },
  {
    id: 'trader_alphavortex',
    username: 'AlphaVortex',
    tier: 'Silver',
    verified: false,
    return30D: 89.12,
    winRate: 71.5,
    riskLevel: 'LOW',
    style: 'SWING_TRADING',
    preferredMarkets: ['BTC', 'ETH'],
    followers: 5410,
    status: 'Online',
    bio: 'Low-risk swing strategy aiming for stable compounded growth using highly liquid bluechip assets.',
    avatarSeed: 'AlphaVortex_coin',
    strategyName: 'Vortex Capital Preserver',
    pnlHistory30D: [2, 10, 18, 28, 40, 52, 65, 75, 82, 89.12],
    avgTradeDuration: '6.5 days',
    wins: 54,
    losses: 21,
    schedule: {
      sessions: [{ start: '09:00', end: '17:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 8,
      maxSimultaneousPositions: 2,
      exposureLimit: 15,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 2.0
    },
    recommendationRules: {
      minConfidence: 85,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['EMA_CROSS_50_200', 'RSI_SLOW']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 88
    },
    strategyExplanation: 'Enforces strict capital preservation guidelines. Positions are scaled in increments during major support tests and exited when target profit bounds are hit.',
    recentTrades: [
      { id: 't12', asset: 'BTC', type: 'BUY', entryPrice: 63800, exitPrice: 64900, pnlPercent: 1.72, status: 'CLOSED', timestamp: '3 days ago' }
    ]
  },
  {
    id: 'trader_chronosquant',
    username: 'ChronosQuant',
    tier: 'Platinum',
    verified: true,
    return30D: 85.45,
    winRate: 91.2,
    riskLevel: 'LOW',
    style: 'DAY_TRADING',
    preferredMarkets: ['BTC', 'ETH', 'SOL'],
    followers: 4980,
    status: 'Analyzing',
    bio: 'Ultra-high accuracy statistical math models executing tight risk distribution grids on leading liquid assets.',
    avatarSeed: 'ChronosQuant_revo',
    strategyName: 'Chronos High Precision V1',
    pnlHistory30D: [5, 15, 24, 32, 41, 50, 62, 70, 78, 85.45],
    avgTradeDuration: '1.8 hours',
    wins: 412,
    losses: 39,
    schedule: {
      sessions: [{ start: '00:00', end: '24:00' }],
      weekdays: true,
      weekends: true,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: false
    },
    riskControls: {
      maxPositionSize: 4,
      maxSimultaneousPositions: 8,
      exposureLimit: 25,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 0.8
    },
    recommendationRules: {
      minConfidence: 90,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['VWAP_ZSCORE', 'ORDER_FLOW_IMBALANCE']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 90
    },
    strategyExplanation: 'A sophisticated quantitative model that calculates live standard deviation bands on VWAP, capturing micro price-reversals with extremely high accuracy.',
    recentTrades: [
      { id: 't13', asset: 'BTC', type: 'BUY', entryPrice: 64150, exitPrice: 64320, pnlPercent: 0.26, status: 'CLOSED', timestamp: '30 mins ago' },
      { id: 't14', asset: 'ETH', type: 'BUY', entryPrice: 3418, exitPrice: 3432, pnlPercent: 0.41, status: 'CLOSED', timestamp: '1 hour ago' }
    ]
  },
  {
    id: 'trader_matrixscalper',
    username: 'MatrixScalper',
    tier: 'Silver',
    verified: false,
    return30D: 78.19,
    winRate: 68.4,
    riskLevel: 'HIGH',
    style: 'SCALPING',
    preferredMarkets: ['SOL', 'XRP', 'AVR'],
    followers: 3950,
    status: 'Offline',
    bio: 'Highly active scalper seeking alpha in micro momentum squeezes using algorithmic standard deviation filters.',
    avatarSeed: 'Matrix_duo',
    strategyName: 'Matrix Momentum Grid',
    pnlHistory30D: [12, -8, 14, 28, 18, 48, 62, 50, 72, 78.19],
    avgTradeDuration: '8 minutes',
    wins: 342,
    losses: 158,
    schedule: {
      sessions: [{ start: '08:00', end: '16:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 15,
      maxSimultaneousPositions: 6,
      exposureLimit: 75,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 3.0
    },
    recommendationRules: {
      minConfidence: 68,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['MOMENTUM_INDEX', 'OBV']
    },
    advancedBehavior: {
      enableDeepAnalysis: false,
      useSentimentGrounding: false,
      neuralConfidenceThreshold: 70
    },
    strategyExplanation: 'Farms volatility swings in mid-cap tokens during peak hours by automatically aligning with directional volume bursts.',
    recentTrades: [
      { id: 't15', asset: 'XRP', type: 'BUY', entryPrice: 0.590, exitPrice: 0.598, pnlPercent: 1.35, status: 'CLOSED', timestamp: '2 days ago' }
    ]
  },
  {
    id: 'trader_apexalpha',
    username: 'ApexAlpha',
    tier: 'Gold',
    verified: true,
    return30D: 72.88,
    winRate: 75.0,
    riskLevel: 'LOW',
    style: 'SWING_TRADING',
    preferredMarkets: ['BTC', 'SOL'],
    followers: 3120,
    status: 'Trading',
    bio: 'Conservative day and swing models designed for institutional capital and low exposure volatility curves.',
    avatarSeed: 'ApexAlpha_fig',
    strategyName: 'Apex Alpha Reversal',
    pnlHistory30D: [2, 10, 15, 28, 35, 42, 50, 58, 65, 72.88],
    avgTradeDuration: '3.1 days',
    wins: 62,
    losses: 21,
    schedule: {
      sessions: [{ start: '08:00', end: '18:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    },
    riskControls: {
      maxPositionSize: 8,
      maxSimultaneousPositions: 2,
      exposureLimit: 20,
      positionSizingPreference: 'PERCENTAGE',
      lossLimit: 1.5
    },
    recommendationRules: {
      minConfidence: 82,
      allowedAssetClasses: ['CRYPTO'],
      indicators: ['RSI', 'FIB_RETRACEMENT', 'MACD']
    },
    advancedBehavior: {
      enableDeepAnalysis: true,
      useSentimentGrounding: true,
      neuralConfidenceThreshold: 82
    },
    strategyExplanation: 'A classic mathematical reversal system that utilizes Fibonacci levels and volume confirmations to establish precise swings in major coins.',
    recentTrades: [
      { id: 't16', asset: 'BTC', type: 'BUY', entryPrice: 63500, exitPrice: 64200, pnlPercent: 1.1, status: 'CLOSED', timestamp: '1 day ago' }
    ]
  }
];

export default function CopyTradeDashboard({ theme, onBack, initialSelectedTraderId }: { theme: 'light' | 'dark', onBack: () => void, initialSelectedTraderId?: string | null }) {
  const { user, addNotification } = useAuth();
  const { preferences, formatCurrency } = usePreferences();
  const isDark = theme === 'dark';

  const [traders, setTraders] = useState<Trader[]>(() => {
    const saved = localStorage.getItem('aver_copytraders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TRADERS;
      }
    }
    return INITIAL_TRADERS;
  });

  const [activeTab, setActiveTab] = useState<'top10' | 'all' | 'gold' | 'silver' | 'platinum'>('top10');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Advanced filters state
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [styleFilter, setStyleFilter] = useState<'ALL' | 'SCALPING' | 'DAY_TRADING' | 'SWING_TRADING'>('ALL');

  // Copy success animation trigger
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  // Profile view sub-tab
  const [profileSubTab, setProfileSubTab] = useState<'stats' | 'strategy' | 'activity'>('stats');
  const [chartTimeline, setChartTimeline] = useState<'monthly' | 'yearly'>('monthly');

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/60 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-lg";

  // Persist traders state so follow states or random fluctuations are preserved
  useEffect(() => {
    localStorage.setItem('aver_copytraders', JSON.stringify(traders));
  }, [traders]);

  // Handle initialSelectedTraderId
  useEffect(() => {
    if (initialSelectedTraderId) {
      const match = traders.find(t => t.id === initialSelectedTraderId);
      if (match) {
        setSelectedTrader(match);
      }
    }
  }, [initialSelectedTraderId, traders]);

  // Realistic dynamic updates over time based on platform performance
  useEffect(() => {
    const interval = setInterval(() => {
      setTraders(prev => {
        // Randomly choose 1-3 traders to fluctuate
        const copy = [...prev];
        const numToChange = Math.floor(Math.random() * 3) + 1;
        const indexesToChange = new Set<number>();
        
        while (indexesToChange.size < numToChange) {
          indexesToChange.add(Math.floor(Math.random() * copy.length));
        }

        indexesToChange.forEach(idx => {
          const t = { ...copy[idx] };
          const delta = (Math.random() - 0.5) * 2.5; // +/- 1.25% fluctuation
          const newReturn = parseFloat((t.return30D + delta).toFixed(2));
          t.return30D = Math.max(10, Math.min(450, newReturn)); // clamp returns between 10% and 450%
          
          // Modify followers slightly
          const followerDelta = Math.floor((Math.random() - 0.4) * 8); // slightly positive bias
          t.followers = Math.max(1000, t.followers + followerDelta);

          // Update sparkline pnlHistory
          const history = [...t.pnlHistory30D];
          history.shift();
          history.push(t.return30D);
          t.pnlHistory30D = history;

          // Occasionally shift trading status
          if (Math.random() < 0.15) {
            const statuses: ('Trading' | 'Analyzing' | 'Online' | 'Offline')[] = ['Trading', 'Analyzing', 'Online', 'Offline'];
            t.status = statuses[Math.floor(Math.random() * statuses.length)];
          }

          copy[idx] = t;
        });

        // Always re-sort dynamically by return30D descending
        return copy.sort((a, b) => b.return30D - a.return30D);
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Filter & Search computation
  const filteredTraders = traders.filter(t => {
    // Search match
    const matchesSearch = t.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.style.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab match
    let matchesTab = true;
    if (activeTab === 'top10') {
      // Just handled by slicing the first 10, but keep basic filter active
      matchesTab = true; 
    } else if (activeTab === 'gold') {
      matchesTab = t.tier === 'Gold';
    } else if (activeTab === 'silver') {
      matchesTab = t.tier === 'Silver';
    } else if (activeTab === 'platinum') {
      matchesTab = t.tier === 'Platinum';
    }

    // Advanced filters
    const matchesRisk = riskFilter === 'ALL' || t.riskLevel === riskFilter;
    const matchesStyle = styleFilter === 'ALL' || t.style === styleFilter;

    return matchesSearch && matchesTab && matchesRisk && matchesStyle;
  });

  // Final rendering list: slice top 10 if on top 10 tab
  const displayList = activeTab === 'top10' ? filteredTraders.slice(0, 10) : filteredTraders;

  // Render first three traders for the Live Leaderboard Hero Cards
  const firstPlace = traders[0];
  const secondPlace = traders[1];
  const thirdPlace = traders[2];

  // Helper to trigger configuration clone to user center
  const handleCopyConfiguration = async (trader: Trader) => {
    if (!user) {
      alert("Please log in to copy AI configurations.");
      return;
    }
    
    setIsCopying(true);
    setCopySuccess(null);

    try {
      // Create clone configuration document structure
      const newConfigId = `cfg_copy_${Math.random().toString(36).substring(2, 11)}`;
      const clonedConfig: AiConfiguration = {
        id: newConfigId,
        ownerId: user.uid,
        name: `Cloned: ${trader.username} - ${trader.strategyName.split(' ').slice(0, 2).join(' ')}`,
        description: `Procedurally duplicated directly from copy-trading profile of ${trader.username}. Built for ${trader.style.replace('_', ' ')} execution on ${trader.preferredMarkets.join('/')}. Original performance: +${trader.return30D}% APY.`,
        version: 1,
        createdAt: Timestamp.now(),
        lastModified: Timestamp.now(),
        status: 'INACTIVE', // default standby mode
        markets: [...trader.preferredMarkets],
        schedule: { ...trader.schedule },
        strategy: trader.strategyName.includes('Momentum') ? 'NEURAL_MOMENTUM' : 
                  trader.strategyName.includes('Swing') ? 'VOLATILITY_BREAKOUT' : 
                  trader.strategyName.includes('Grid') ? 'QUANT_GRID' : 'MEAN_REVERSION',
        riskControls: { ...trader.riskControls },
        recommendationRules: { ...trader.recommendationRules },
        notificationPreferences: {
          newRecommendations: true,
          tradeExecutions: true,
          marketAlerts: false
        },
        advancedBehavior: { ...trader.advancedBehavior }
      };

      // Save using AI trading service directly into User's subcollection
      await aiTradingService.saveConfiguration(user.uid, clonedConfig);

      // Trigger beautiful UI feedback
      setCopySuccess(newConfigId);
      
      // Increment follower count locally for feedback loop
      setTraders(prev => prev.map(t => {
        if (t.id === trader.id) {
          return { ...t, followers: t.followers + 1 };
        }
        return t;
      }));

      // Update selected trader local stats too
      if (selectedTrader && selectedTrader.id === trader.id) {
        setSelectedTrader(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
      }

      // Add actual workspace notification
      if (addNotification) {
        await addNotification(
          'signals',
          'high',
          'AI Configuration Copied Successfully',
          `You have successfully cloned ${trader.username}'s active neural profile. Configuration '${clonedConfig.name}' is now loaded into your Neural Workspace standby deck.`
        );
      }
    } catch (e: any) {
      console.error("Error cloning configuration:", e);
      alert("Failed to replicate configuration: " + e?.message);
    } finally {
      setIsCopying(false);
    }
  };

  // Custom high-quality mock SVG data generator for trader profile chart
  const renderInteractiveChart = (trader: Trader, timeline: 'monthly' | 'yearly') => {
    const isMonthly = timeline === 'monthly';
    const dataPoints = isMonthly 
      ? [10, 22, 18, 42, 60, 52, 98, 120, 114, 150, 182, trader.return30D]
      : [5, 20, 48, 85, 120, trader.return30D * 1.5, trader.return30D * 2.2];

    const labels = isMonthly 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['2021', '2022', '2023', '2024', '2025', '2026', 'YTD'];

    const width = 600;
    const height = 180;
    const padding = 25;
    
    // Scale maths
    const maxVal = Math.max(...dataPoints) * 1.15;
    const minVal = Math.min(0, ...dataPoints);
    const range = maxVal - minVal;

    const points = dataPoints.map((val, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative">
        <svg className="w-full h-44 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10B981" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

          {/* Fill Area */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

          {/* Data Nodes */}
          {points.map((p, i) => (
            <g key={i} className="group/node cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#0D0E14" stroke="#10B981" strokeWidth="2.5" />
              <circle cx={p.x} cy={p.y} r="10" fill="#10B981" fillOpacity="0.0" className="hover:fill-opacity-10 transition-all duration-200" />
              {/* Floating micro tooltip on hover */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#10B981" className="text-[10px] font-bold font-mono bg-black opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none">
                +{p.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          {labels.map((lbl, i) => {
            const x = padding + (i / (labels.length - 1)) * (width - padding * 2);
            return (
              <text key={i} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" className="text-[9px] font-mono font-bold tracking-wider uppercase">
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedTrader ? (
          // ==================== DASHBOARD LEADERBOARD HOME ====================
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Header section with back navigators */}
            <div className="flex justify-between items-center">
              <div>
                <button 
                  onClick={onBack}
                  className="group mb-2 flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                  <span>Discover Feed</span>
                </button>
                <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${textPrimary}`}>
                  <Users className="w-6 h-6 text-emerald-400" /> Copy Trade
                </h2>
                <p className={`text-xs ${textSecondary} mt-1`}>
                  Follow elite quantitative traders. Duplicate their production AI configurations. Grow in synergy.
                </p>
              </div>
            </div>

            {/* LIVE LEADERBOARD HERO HIGHLIGHTS */}
            <div className={`p-6 rounded-[28px] ${cardClasses} relative overflow-hidden border border-emerald-500/10`}>
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-44 h-44 bg-sky-500/5 blur-[50px] rounded-full pointer-events-none" />

              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className={`text-sm font-black tracking-wider uppercase text-slate-200`}>Live Leaderboard</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('all')} 
                  className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Traders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* THREE HEROES PODIUM COLUMN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* 2nd PLACE COLUMN */}
                {secondPlace && (
                  <motion.div 
                    layoutId={`hero_card_${secondPlace.id}`}
                    onClick={() => setSelectedTrader(secondPlace)}
                    className="relative order-2 md:order-1 rounded-2xl bg-white/[0.02] border border-white/5 p-5 flex flex-col items-center justify-between hover:bg-white/[0.04] transition-all duration-300 hover:scale-[1.03] group cursor-pointer"
                  >
                    <span className="absolute top-3 left-4 text-xs font-black font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">#2</span>
                    <div className="relative mt-2">
                      <div className="w-16 h-16 rounded-full border-2 border-sky-400 p-0.5 overflow-hidden flex items-center justify-center bg-black/40">
                        <div className="w-full h-full rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: generateAvatarSvg(secondPlace.avatarSeed) }} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-sky-500 text-black rounded-full p-0.5 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 fill-black text-sky-400" />
                      </div>
                    </div>
                    
                    <div className="text-center mt-3">
                      <h4 className="text-sm font-black text-white flex items-center justify-center gap-1">
                        {secondPlace.username}
                        {secondPlace.verified && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-black" />}
                      </h4>
                      <span className="text-[9px] font-mono font-black text-gray-400 tracking-wider uppercase px-2 py-0.5 bg-white/5 rounded-full mt-1 inline-block">
                        {secondPlace.strategyName.split(' ')[0]}
                      </span>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">+{secondPlace.return30D.toFixed(2)}%</span>
                      <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-0.5">30D RETURN</p>
                    </div>
                  </motion.div>
                )}

                {/* 1st PLACE COLUMN (GLOWING / CROWNED) */}
                {firstPlace && (
                  <motion.div 
                    layoutId={`hero_card_${firstPlace.id}`}
                    onClick={() => setSelectedTrader(firstPlace)}
                    className="relative order-1 md:order-2 rounded-2xl bg-emerald-500/[0.02] border-2 border-emerald-500/30 p-6 flex flex-col items-center justify-between hover:bg-emerald-500/[0.04] transition-all duration-300 hover:scale-[1.04] group cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                  >
                    {/* Top status indicator flag */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full text-[9px] font-black text-black tracking-widest uppercase flex items-center gap-1 shadow-lg">
                      <Trophy className="w-3 h-3" /> CHAMPION
                    </div>
                    <span className="absolute top-3 left-4 text-xs font-black font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">#1</span>
                    
                    <div className="relative mt-4">
                      <div className="w-20 h-20 rounded-full border-2 border-yellow-500 p-0.5 overflow-hidden flex items-center justify-center bg-black/40 shadow-lg shadow-yellow-500/10">
                        <div className="w-full h-full rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: generateAvatarSvg(firstPlace.avatarSeed) }} />
                      </div>
                      <div className="absolute -top-2 -right-1.5 bg-yellow-500 text-black rounded-full p-1 shadow-md">
                        <Trophy className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    
                    <div className="text-center mt-3">
                      <h4 className="text-base font-black text-white flex items-center justify-center gap-1">
                        {firstPlace.username}
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      </h4>
                      <span className="text-[10px] font-mono font-black text-yellow-500 tracking-wider uppercase px-2.5 py-0.5 bg-yellow-500/10 rounded-full border border-yellow-500/10 mt-1 inline-block">
                        {firstPlace.strategyName.split(' ')[0]}
                      </span>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">+{firstPlace.return30D.toFixed(2)}%</span>
                      <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mt-0.5">30D RETURN</p>
                    </div>
                  </motion.div>
                )}

                {/* 3rd PLACE COLUMN */}
                {thirdPlace && (
                  <motion.div 
                    layoutId={`hero_card_${thirdPlace.id}`}
                    onClick={() => setSelectedTrader(thirdPlace)}
                    className="relative order-3 rounded-2xl bg-white/[0.02] border border-white/5 p-5 flex flex-col items-center justify-between hover:bg-white/[0.04] transition-all duration-300 hover:scale-[1.03] group cursor-pointer"
                  >
                    <span className="absolute top-3 left-4 text-xs font-black font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">#3</span>
                    <div className="relative mt-2">
                      <div className="w-16 h-16 rounded-full border-2 border-amber-600 p-0.5 overflow-hidden flex items-center justify-center bg-black/40">
                        <div className="w-full h-full rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: generateAvatarSvg(thirdPlace.avatarSeed) }} />
                      </div>
                    </div>
                    
                    <div className="text-center mt-3">
                      <h4 className="text-sm font-black text-white flex items-center justify-center gap-1">
                        {thirdPlace.username}
                      </h4>
                      <span className="text-[9px] font-mono font-black text-gray-400 tracking-wider uppercase px-2 py-0.5 bg-white/5 rounded-full mt-1 inline-block">
                        {thirdPlace.strategyName.split(' ')[0]}
                      </span>
                    </div>

                    <div className="mt-4 text-center">
                      <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">+{thirdPlace.return30D.toFixed(2)}%</span>
                      <p className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-0.5">30D RETURN</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* TAB SELECTORS AND FILTER/SEARCH ROW */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                {/* Category tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {[
                    { id: 'top10', name: 'Top 10', icon: Trophy },
                    { id: 'all', name: 'All Traders', icon: Users },
                    { id: 'platinum', name: 'Platinum', icon: Sparkles },
                    { id: 'gold', name: 'Gold 👑', icon: null },
                    { id: 'silver', name: 'Silver 🛡️', icon: null }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setSearchQuery('');
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border ${
                          isActive 
                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/15' 
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-transparent'
                        }`}
                      >
                        {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Filters Trigger */}
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    showFilterDropdown || riskFilter !== 'ALL' || styleFilter !== 'ALL'
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Filter {riskFilter !== 'ALL' || styleFilter !== 'ALL' ? '(Active)' : ''}</span>
                </button>
              </div>

              {/* SEARCH BAR ROW */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search traders by name, neural strategy, style, or asset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-black/15 dark:bg-white/5 border border-white/5 rounded-2xl text-xs outline-none focus:border-emerald-500/40 transition-all ${textPrimary}`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* ADVANCED MULTI-FILTER DROPDOWN ACCORDION */}
              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4 space-y-4`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Risk controls */}
                      <div>
                        <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block mb-2">Risk Level</span>
                        <div className="flex flex-wrap gap-2">
                          {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setRiskFilter(lvl)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                riskFilter === lvl 
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                                  : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Trading style */}
                      <div>
                        <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block mb-2">Trading Style</span>
                        <div className="flex flex-wrap gap-2">
                          {(['ALL', 'SCALPING', 'DAY_TRADING', 'SWING_TRADING'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => setStyleFilter(style)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                styleFilter === style 
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                                  : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              {style.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reset button */}
                    <div className="flex justify-end pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setRiskFilter('ALL');
                          setStyleFilter('ALL');
                        }}
                        className="text-xs font-black text-gray-400 hover:text-white transition-colors"
                      >
                        Reset Advanced Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* LEADERBOARD DETAILED LIST TABLE */}
            <div className={`rounded-3xl border border-white/5 bg-black/10 overflow-hidden`}>
              {/* Header Titles */}
              <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-white/[0.02] border-b border-white/5 text-[10px] font-mono font-black uppercase tracking-wider text-gray-400">
                <div className="col-span-2 sm:col-span-1">Rank</div>
                <div className="col-span-6 sm:col-span-5">Trader</div>
                <div className="col-span-4 sm:col-span-3 text-right">30D Return</div>
                <div className="col-span-3 hidden sm:block text-right">Followers</div>
                <div className="col-span-1"></div>
              </div>

              {/* Dynamic list rows */}
              <div className="divide-y divide-white/5">
                {displayList.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className={`text-sm font-bold ${textPrimary}`}>No elite traders matching parameters.</p>
                    <p className="text-xs text-gray-500 mt-1">Try broadening your search or resetting active filters.</p>
                  </div>
                ) : (
                  displayList.map((trader, idx) => {
                    // Find actual overall rank from global traders list
                    const rank = traders.findIndex(t => t.id === trader.id) + 1;
                    return (
                      <motion.div
                        layout
                        key={trader.id}
                        onClick={() => setSelectedTrader(trader)}
                        className={`grid grid-cols-12 gap-3 px-6 py-4 items-center cursor-pointer transition-all hover:bg-white/[0.02]`}
                      >
                        {/* Rank */}
                        <div className="col-span-2 sm:col-span-1 flex items-center font-mono font-black text-sm">
                          {rank === 1 ? (
                            <span className="w-6 h-6 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center text-xs">1</span>
                          ) : rank === 2 ? (
                            <span className="w-6 h-6 bg-slate-400/15 border border-slate-400/20 text-slate-300 rounded-full flex items-center justify-center text-xs">2</span>
                          ) : rank === 3 ? (
                            <span className="w-6 h-6 bg-amber-600/15 border border-amber-600/20 text-amber-500 rounded-full flex items-center justify-center text-xs">3</span>
                          ) : (
                            <span className="text-gray-500 px-2">{rank}</span>
                          )}
                        </div>

                        {/* Trader Information */}
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-black/30">
                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: generateAvatarSvg(trader.avatarSeed) }} />
                            {/* Live Status indicator */}
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#090A0E] ${
                              trader.status === 'Trading' ? 'bg-emerald-500' :
                              trader.status === 'Analyzing' ? 'bg-sky-500' :
                              trader.status === 'Online' ? 'bg-teal-500' : 'bg-gray-600'
                            }`} />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-black text-white hover:text-emerald-400 transition-colors truncate`}>{trader.username}</span>
                              {trader.verified && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-black flex-shrink-0" />}
                              <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                                trader.tier === 'Platinum' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                trader.tier === 'Gold' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                'bg-slate-400/10 text-slate-400 border border-slate-400/20'
                              }`}>
                                {trader.tier}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] ${textSecondary} truncate`}>{trader.strategyName}</span>
                              <span className={`text-[8px] font-mono font-bold px-1.5 rounded-full ${
                                trader.riskLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400' :
                                trader.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {trader.riskLevel} RISK
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 30D Return & Sparkline */}
                        <div className="col-span-4 sm:col-span-3 flex flex-col items-end justify-center">
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            +{trader.return30D.toFixed(2)}%
                          </span>
                          
                          {/* Mini Sparkline graph */}
                          <div className="w-16 h-5 mt-1 opacity-80 hidden xs:block">
                            <svg className="w-full h-full" viewBox="0 0 50 15">
                              <path 
                                d={trader.pnlHistory30D.reduce((acc, val, i) => {
                                  const x = (i / (trader.pnlHistory30D.length - 1)) * 50;
                                  const y = 13 - ((val / 250) * 11); // scale to fit height 15
                                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                                }, '')}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Followers */}
                        <div className="col-span-3 hidden sm:flex flex-col items-end">
                          <span className={`text-xs font-black ${textPrimary}`}>
                            {(trader.followers / 1000).toFixed(1)}K
                          </span>
                          <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-0.5">FOLLOWERS</span>
                        </div>

                        {/* Right arrow link */}
                        <div className="col-span-1 flex justify-end text-gray-600 group-hover:text-white">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          // ==================== PREMIUM TRADER PROFILE VIEW ====================
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Back Navigators Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => {
                  setSelectedTrader(null);
                  setProfileSubTab('stats');
                  setCopySuccess(null);
                }}
                className="group flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Leaderboard</span>
              </button>

              <span className={`text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full ${
                selectedTrader.status === 'Trading' ? 'text-emerald-400' :
                selectedTrader.status === 'Analyzing' ? 'text-sky-400' : 'text-gray-400'
              } flex items-center gap-1.5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedTrader.status === 'Trading' ? 'bg-emerald-400 animate-pulse' :
                  selectedTrader.status === 'Analyzing' ? 'bg-sky-400 animate-pulse' : 'bg-gray-500'
                }`} />
                {selectedTrader.status === 'Trading' ? 'Currently Deploying' : selectedTrader.status}
              </span>
            </div>

            {/* HERO PROFILE SUMMARY CARD */}
            <div className={`p-6 sm:p-8 rounded-[32px] ${cardClasses} relative overflow-hidden border border-white/5 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />
              
              {/* Dynamic Animated Avatar */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.02, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut"
                }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-emerald-500/30 p-0.5 overflow-hidden flex items-center justify-center bg-black/40 shadow-xl flex-shrink-0"
              >
                <div className="w-full h-full rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedTrader.avatarSeed) }} />
                {selectedTrader.tier === 'Platinum' && (
                  <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-1 shadow-md border border-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
              </motion.div>

              {/* Identity descriptions */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl font-black tracking-tight text-white">{selectedTrader.username}</h3>
                  {selectedTrader.verified && <CheckCircle2 className="w-5 h-5 text-sky-400 fill-black" />}
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                    selectedTrader.tier === 'Platinum' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                    selectedTrader.tier === 'Gold' ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-500/20' :
                    'bg-slate-400/15 text-slate-400 border border-slate-400/20'
                  }`}>
                    {selectedTrader.tier} Tier Trader
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                  {selectedTrader.bio}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span><strong className="text-white">{selectedTrader.followers.toLocaleString()}</strong> followers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Risk Rating: <strong className="text-white">{selectedTrader.riskLevel}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span>Preferred Style: <strong className="text-white">{selectedTrader.style.replace('_', ' ')}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB PROFILE SECTIONS SELECTOR */}
            <div className="flex border-b border-white/5 pb-1 gap-2 overflow-x-auto">
              {[
                { id: 'stats', name: 'Performance Indicators', icon: Trophy },
                { id: 'strategy', name: 'Strategy & Engine Controls', icon: Brain },
                { id: 'activity', name: 'Recent Activity Logs', icon: Clock }
              ].map((subTab) => {
                const isActive = profileSubTab === subTab.id;
                const SubIcon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setProfileSubTab(subTab.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                      isActive 
                        ? 'text-emerald-400 border-emerald-500 bg-white/[0.02]' 
                        : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5" />
                    <span>{subTab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* PROFILE SUB-TAB CONTENTS */}
            <AnimatePresence mode="wait">
              {profileSubTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* METRIC CARD BOX GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-2xl ${cardClasses} border border-white/5 text-center`}>
                      <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">30D Performance</p>
                      <h4 className="text-xl font-black text-emerald-500 mt-1 font-mono">+{selectedTrader.return30D.toFixed(2)}%</h4>
                    </div>
                    <div className={`p-4 rounded-2xl ${cardClasses} border border-white/5 text-center`}>
                      <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Win Rate Percentage</p>
                      <h4 className="text-xl font-black text-white mt-1 font-mono">{selectedTrader.winRate}%</h4>
                    </div>
                    <div className={`p-4 rounded-2xl ${cardClasses} border border-white/5 text-center`}>
                      <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Total Positions Placed</p>
                      <h4 className="text-xl font-black text-white mt-1 font-mono">{selectedTrader.wins + selectedTrader.losses}</h4>
                    </div>
                    <div className={`p-4 rounded-2xl ${cardClasses} border border-white/5 text-center`}>
                      <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest font-sans">Avg Trade Duration</p>
                      <h4 className="text-xl font-black text-white mt-1">{selectedTrader.avgTradeDuration}</h4>
                    </div>
                  </div>

                  {/* INTERACTIVE PREMIUM GROWTH CHART */}
                  <div className={`p-6 rounded-3xl ${cardClasses} border border-white/5`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                      <div>
                        <h4 className="text-sm font-black text-white">Dynamic Equity Curve</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Replicating cumulative performance timeline across major seasons.</p>
                      </div>
                      <div className="flex rounded-lg bg-black/40 border border-white/5 p-1 gap-1">
                        <button 
                          onClick={() => setChartTimeline('monthly')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                            chartTimeline === 'monthly' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Monthly (12M)
                        </button>
                        <button 
                          onClick={() => setChartTimeline('yearly')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                            chartTimeline === 'yearly' ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Yearly Growth
                        </button>
                      </div>
                    </div>

                    {renderInteractiveChart(selectedTrader, chartTimeline)}
                  </div>

                  {/* PREFERRED MARKETS & RISK INFO BOX */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Markets */}
                    <div className={`p-5 rounded-2xl ${cardClasses} border border-white/5 space-y-3`}>
                      <h4 className="text-xs font-black text-gray-400 tracking-wider uppercase">Preferred Markets & Allocation</h4>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedTrader.preferredMarkets.map((mkt) => (
                          <div key={mkt} className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-white">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {mkt}/USDT
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed pt-1">
                        AI routing allocates high priority depth index to {selectedTrader.preferredMarkets.join(', ')} due to lower spread variance and optimized volatility vectors.
                      </p>
                    </div>

                    {/* Wins Losses */}
                    <div className={`p-5 rounded-2xl ${cardClasses} border border-white/5 flex flex-col justify-between`}>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-400 tracking-wider uppercase">Win / Loss Ratio Spectrum</h4>
                        <div className="flex justify-between text-xs font-mono font-bold text-gray-400 pt-2">
                          <span className="text-emerald-500">{selectedTrader.wins} Wins</span>
                          <span className="text-rose-500">{selectedTrader.losses} Losses</span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-rose-500/20 rounded-full overflow-hidden mt-3 mb-3 flex">
                        <div 
                          style={{ width: `${(selectedTrader.wins / (selectedTrader.wins + selectedTrader.losses)) * 100}%` }} 
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        />
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed">
                        Compounding an accurate {selectedTrader.winRate}% win rate index across {selectedTrader.wins + selectedTrader.losses} total autonomous cycles. Average drawdowns remain strictly bounded.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {profileSubTab === 'strategy' && (
                <motion.div
                  key="strategy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Strategy Description Info Box */}
                  <div className={`p-5 rounded-2xl ${cardClasses} border border-white/5 space-y-2`}>
                    <h4 className="text-xs font-black text-gray-400 tracking-wider uppercase">AI Neural Strategy Deployment</h4>
                    <span className="text-base font-black text-emerald-400 font-mono inline-block py-1">
                      {selectedTrader.strategyName}
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed pt-1">
                      {selectedTrader.strategyExplanation}
                    </p>
                  </div>

                  {/* DYNAMIC CONFIGURATION SUMMARY COMPONENT */}
                  <div className={`p-6 rounded-3xl ${cardClasses} border border-white/5 space-y-4`}>
                    <h4 className="text-xs font-black text-gray-400 tracking-wider uppercase border-b border-white/5 pb-2">Central Risk & Sizing Controls</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Position Sizing Preference</span>
                        <p className="text-sm font-black text-white">{selectedTrader.riskControls.positionSizingPreference}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Max Capital Sizing / Trade</span>
                        <p className="text-sm font-black text-white">{selectedTrader.riskControls.maxPositionSize}%</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Max Simultaneous Positions</span>
                        <p className="text-sm font-black text-white">{selectedTrader.riskControls.maxSimultaneousPositions} concurrent max</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Neural Stop Limit threshold</span>
                        <p className="text-sm font-black text-rose-400 font-mono">-{selectedTrader.riskControls.lossLimit}%</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Net Portfolio Exposure Limit</span>
                        <p className="text-sm font-black text-white">{selectedTrader.riskControls.exposureLimit}% Cap</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block">AI Sentiment Grounding</span>
                        <p className={`text-sm font-black ${selectedTrader.advancedBehavior.useSentimentGrounding ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {selectedTrader.advancedBehavior.useSentimentGrounding ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-black">Trading Schedule:</span>
                        <p className="text-gray-300 mt-1">Weekdays active, timezone {selectedTrader.schedule.timezone}. Sessions: {selectedTrader.schedule.sessions.map(s => `${s.start}-${s.end}`).join(', ')}.</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-black">Confidence Threshold:</span>
                        <p className="text-emerald-400 font-mono font-black mt-1">Min {selectedTrader.recommendationRules.minConfidence}% Signal Index</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {profileSubTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <h4 className="text-xs font-black text-gray-400 tracking-wider uppercase mb-2">Recent Order executions</h4>
                  
                  <div className="divide-y divide-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    {selectedTrader.recentTrades.map((t, idx) => (
                      <div key={t.id} className="p-4 bg-white/[0.01] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {t.type === 'BUY' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-white font-mono">{t.asset}/USDT - {t.type}</p>
                            <span className="text-[10px] text-gray-500">{t.timestamp}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-white font-mono">Entry: ${t.entryPrice.toLocaleString()}</p>
                          {t.status === 'CLOSED' ? (
                            <span className="text-emerald-500 font-bold font-mono">
                              Closed +{t.pnlPercent}%
                            </span>
                          ) : (
                            <span className="text-sky-400 font-bold font-mono flex items-center justify-end gap-1">
                              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
                              Active Execution
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING ACTION BOTTOM BAR FOR COPY WORKSPACE CONFIGURATION */}
            <div className={`p-4 sm:p-5 rounded-3xl ${cardClasses} border border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 mt-6`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
              
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1">
                  <Brain className="w-4 h-4 text-emerald-400 animate-pulse" /> Replicate AI Neural Model
                </h4>
                <p className="text-xs text-gray-400">
                  Duplicate {selectedTrader.username}’s active config settings into your local workspace standalone deck.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {copySuccess ? (
                  <div className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20">
                    <UserCheck className="w-4 h-4" />
                    <span>Config Copied! Loaded in Standby</span>
                  </div>
                ) : (
                  <button
                    disabled={isCopying}
                    onClick={() => handleCopyConfiguration(selectedTrader)}
                    className="w-full sm:w-auto py-3 px-6 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isCopying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Synchronising Config...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Copy Trader Configuration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
