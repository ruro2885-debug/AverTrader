import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Activity, Bell, X, RefreshCw, ZoomIn, 
  ZoomOut, ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, 
  ChevronUp, Shield, Landmark, PieChart, Coins, ExternalLink, 
  Sparkles, Sliders, Play, Share2, FileText, ChevronRight, MessageSquare,
  Search, SlidersHorizontal, Layers, Zap, Info, Clock, Lock, ArrowRightLeft,
  ArrowUpRight, ArrowDownRight, BarChart3, Wallet, Menu, Vault, KeyRound,
  ShieldAlert
} from 'lucide-react';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useFinancials } from '../../hooks/useFinancials';
import { TradingEngineContext } from '../../contexts/TradingEngineContext';
import { 
  generateChartData, 
  initialWatchlistData, 
  WatchlistItem 
} from '../../utils/portfolioHelpers';
import AverLogo from '../AverLogo';
import CoinLogo from '../CoinLogo';
import VaultScreen from './VaultScreen';
import AssetStatsScreen from './AssetStatsScreen';

interface PortfolioViewV2Props {
  theme: 'light' | 'dark';
  onBack: () => void;
  onNavigate?: (tab: string) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onViewModeChange?: (viewMode: 'portfolio' | 'vault' | 'asset-stats') => void;
}

interface HoverData {
  open: number;
  high: number;
  low: number;
  close: number;
}

// --- DYNAMIC AI COMMENTARY GENERATION ENGINE ---
function generateCatherineCommentary(
  totalValue: number, 
  holdings: WatchlistItem[], 
  livePrices: Record<string, number>
) {
  const btcPrice = livePrices['BTC'] || holdings.find(h => h.ticker === 'BTC')?.price || 64000;
  const ethPrice = livePrices['ETH'] || holdings.find(h => h.ticker === 'ETH')?.price || 3450;
  const solPrice = livePrices['SOL'] || holdings.find(h => h.ticker === 'SOL')?.price || 145;

  const btcVal = btcPrice * 0.85;
  const ethVal = ethPrice * 12.0;
  const solVal = solPrice * 120.0;
  const cryptoTotalVal = btcVal + ethVal + solVal;
  
  const cashVal = Math.max(25000, totalValue - cryptoTotalVal);
  const cryptoPercent = ((cryptoTotalVal / totalValue) * 100).toFixed(1);
  const cashPercent = ((cashVal / totalValue) * 100).toFixed(1);

  const sortedByChange = [...holdings].sort((a, b) => b.change - a.change);
  const topAsset = sortedByChange[0]?.ticker || 'BTC';
  const topAssetChange = sortedByChange[0]?.change?.toFixed(2) || '2.45';
  const topAssetPrice = (livePrices[topAsset] || sortedByChange[0]?.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const worstAsset = sortedByChange[sortedByChange.length - 1]?.ticker || 'SOL';
  const worstAssetChange = Math.abs(sortedByChange[sortedByChange.length - 1]?.change || 0.52).toFixed(2);

  const commentaries = [
    {
      topic: 'Strategic Position Balance',
      text: `Sovereign Vault I is currently positioned with a highly resilient ${cashPercent}% cash reserve and ${cryptoPercent}% exposure in premier crypto positions. This conservative posture minimizes overall portfolio Beta to 0.85, effectively insulating core capital from systemic market drawdowns while maintaining an active upside hedge through our ${topAsset} position.`
    },
    {
      topic: 'Staking Velocity & Asset Yields',
      text: `Our active staking positions are capitalizing on network velocity. Staking yields on Ethereum remain optimized at 4.2% APY, while our ${topAsset} holdings (+${topAssetChange}%) continue to act as a core performance driver. Given current market momentum, maintaining this exposure with a high AI Health Score of 98/100 is recommended.`
    },
    {
      topic: 'Tactical Profit Reallocation',
      text: `The portfolio is showing strong concentration gains as ${topAsset} trades near $${topAssetPrice} (+${topAssetChange}% today). Our algorithmic indicators suggest capturing partial profits at this key near-term resistance level, reallocating those yields back into our stable compounding Sovereign Vaults to secure our high-water marks.`
    },
    {
      topic: 'Buy-The-Dip Accumulation Window',
      text: `With today's minor retracement in ${worstAsset} (-${worstAssetChange}%), we are seeing a valuable accumulation window. Thanks to our disciplined risk framework, our core portfolio value remains protected. The liquid cash reserve of $${Math.round(cashVal).toLocaleString()} is positioned to scale into these high-liquidity zones over the next 72 hours.`
    },
    {
      topic: 'Systemic Diversification Evaluation',
      text: `An analysis of our asset allocation matrix confirms optimal diversification across core store-of-value assets and smart-contract utility platforms. With Solana DeFi velocity exceeding expectations, our overall cryptocurrency exposure within custody holdings provides an exceptional asymmetric return profile.`
    }
  ];

  const hour = new Date().getHours();
  const index = hour % commentaries.length;
  return commentaries[index];
}

// --- TRADINGVIEW LIGHTWEIGHT CHART COMPONENT WITH HOVER CAPABILITIES ---
function AverPortfolioChart({ 
  data, 
  isDark,
  onHover,
  executionEvents
}: { 
  data: { time: string; open: number; high: number; low: number; close: number; }[], 
  isDark: boolean,
  onHover: (hoverData: HoverData | null) => void,
  executionEvents: any[]
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 320;
    const height = 260; // Mobile optimized compact height

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.01)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.01)' },
      },
      crosshair: {
        vertLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.12)',
          style: 2, // Dotted
        },
        horzLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.12)',
          style: 2, // Dotted
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.04)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.04)',
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00D09C',
      downColor: '#FF6B6B',
      borderUpColor: '#00D09C',
      borderDownColor: '#FF6B6B',
      wickUpColor: '#00D09C',
      wickDownColor: '#FF6B6B',
    });

    candleSeries.setData(data);

    if (executionEvents && executionEvents.length > 0) {
      const markers = executionEvents.map(evt => ({
        time: evt.timestamp,
        position: evt.markerPosition === 'aboveBar' ? 'aboveBar' : 'belowBar',
        color: evt.color,
        shape: evt.markerShape,
        text: evt.label,
        id: evt.id
      }));
      createSeriesMarkers(candleSeries, markers as any);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    // Crosshair subscription updates OHLC state
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const seriesData = param.seriesData.get(candleSeries);
        if (seriesData) {
          onHover({
            open: (seriesData as any).open,
            high: (seriesData as any).high,
            low: (seriesData as any).low,
            close: (seriesData as any).close,
          });
          return;
        }
      }
      onHover(null);
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, isDark]);

  return <div ref={containerRef} className="w-full h-[260px] relative z-10" />;
}

interface RadarAsset {
  symbol: string;
  name: string;
  baseConfidence: number;
  category?: string;
}

interface RadarCategory {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  dotColor: string;
  assets: RadarAsset[];
}

export default function PortfolioViewV2({ 
  theme, 
  onBack, 
  onNavigate, 
  onOpenDeposit, 
  onOpenWithdraw,
  onViewModeChange
}: PortfolioViewV2Props) {
  const { user, updateProfile } = useAuth();
  const { positions, trades, config } = useContext(TradingEngineContext);
  const { 
    totalNetBalance, 
    activeTradingBalance, 
    vaultBalance, 
    updateVaultBalance, 
    activeBalanceOffset,
    updateActiveBalanceOffset 
  } = useFinancials();

  const scrollPositionRef = useRef<number>(0);
  const { formatCurrency } = usePreferences();

  // State to hold hover indicators
  const [hoveredOHLC, setHoveredOHLC] = useState<HoverData | null>(null);

  // Navigation mode to switch full-screen pages
  const [viewMode, setViewMode] = useState<'portfolio' | 'vault' | 'asset-stats'>('portfolio');

  useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, onViewModeChange]);

  useEffect(() => {
    if (viewMode === 'portfolio') {
      const timer = setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'auto'
        });
      }, 50);
      return () => clearTimeout(timer);
    } else {
      scrollPositionRef.current = window.scrollY;
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
    }
  }, [viewMode]);

  // Dynamic theme support matching the Aver luxury aesthetic
  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  // Real-time fluctuating asset tick simulation state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlistData);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({
    BTC: 64230.00,
    ETH: 3450.20,
    SOL: 145.60,
    AAPL: 172.50,
    Gold: 2035.00,
    ETFs: 450.00
  });

  const [tickTracker, setTickTracker] = useState(0);

  // Real-time AI Opinion / Radar state
  const [radarAssets, setRadarAssets] = useState<RadarAsset[]>([
    { symbol: 'BTC', name: 'Bitcoin', baseConfidence: 96, category: 'high_conviction' },
    { symbol: 'ETH', name: 'Ethereum', baseConfidence: 89, category: 'preparing_entry' },
    { symbol: 'SOL', name: 'Solana', baseConfidence: 79, category: 'watching' },
    { symbol: 'NVDA', name: 'NVIDIA', baseConfidence: 73, category: 'watching' },
    { symbol: 'XRP', name: 'Ripple', baseConfidence: 65, category: 'preparing_entry' },
    { symbol: 'Gold', name: 'Gold Spot', baseConfidence: 95, category: 'high_conviction' },
    { symbol: 'DOGE', name: 'Dogecoin', baseConfidence: 18, category: 'avoiding' },
    { symbol: 'PEPE', name: 'Pepe', baseConfidence: 11, category: 'avoiding' },
  ]);

  const radarCategories = useMemo<RadarCategory[]>(() => [
    {
      key: 'watching',
      label: 'Watching',
      subtitle: 'Assets currently being monitored.',
      icon: '👁',
      dotColor: 'bg-sky-400',
      assets: radarAssets.filter(a => a.category === 'watching')
    },
    {
      key: 'preparing_entry',
      label: 'Preparing Entry',
      subtitle: 'Assets approaching AI entry conditions.',
      icon: '🟡',
      dotColor: 'bg-amber-400',
      assets: radarAssets.filter(a => a.category === 'preparing_entry')
    },
    {
      key: 'high_conviction',
      label: 'High Conviction',
      subtitle: 'Assets with the highest confidence score.',
      icon: '🟢',
      dotColor: 'bg-emerald-400',
      assets: radarAssets.filter(a => a.category === 'high_conviction')
    },
    {
      key: 'avoiding',
      label: 'Avoiding',
      subtitle: 'Assets intentionally ignored by the AI.',
      icon: '🔴',
      dotColor: 'bg-rose-500',
      assets: radarAssets.filter(a => a.category === 'avoiding')
    }
  ], [radarAssets]);

  const [allocations, setAllocations] = useState<any[]>([
    { ticker: 'BTC', name: 'Bitcoin', color: '#f59e0b', icon: '₿', quantity: 0.85 },
    { ticker: 'ETH', name: 'Ethereum', color: '#6366f1', icon: 'Ξ', quantity: 12.0 },
    { ticker: 'SOL', name: 'Solana', color: '#a855f7', icon: 'S', quantity: 120.0 },
    { ticker: 'Cash', name: 'USD Cash', color: '#10b981', icon: '$', quantity: 169200 },
    { ticker: 'AAPL', name: 'Apple Inc.', color: '#3b82f6', icon: '', quantity: 820 },
    { ticker: 'ETFs', name: 'S&P 500 ETF', color: '#ec4899', icon: 'E', quantity: 240 },
    { ticker: 'Gold', name: 'Gold Spot', color: '#eab308', icon: 'G', quantity: 50 },
  ]);

  useEffect(() => {
    setAllocations(prev => {
      return prev.map(a => {
        if (a.ticker === 'Cash' && user?.availableBalance !== undefined) {
          return { ...a, quantity: user.availableBalance };
        }
        if (user?.holdings && user.holdings.length > 0) {
          const match = user.holdings.find(h => h.ticker === a.ticker);
          if (match) {
            return { ...a, quantity: match.quantity };
          }
        }
        return a;
      });
    });
  }, [user?.holdings, user?.availableBalance]);

  const liveAllocations = useMemo(() => {
    const vals = allocations.map(a => {
      let price = 1;
      if (a.ticker === 'BTC') price = livePrices['BTC'] || 64230;
      else if (a.ticker === 'ETH') price = livePrices['ETH'] || 3450.20;
      else if (a.ticker === 'SOL') price = livePrices['SOL'] || 145.60;
      else if (a.ticker === 'AAPL') price = livePrices['AAPL'] || 172.50;
      else if (a.ticker === 'Gold') price = livePrices['Gold'] || 2035.00;
      else if (a.ticker === 'ETFs') price = livePrices['ETFs'] || 450.00;
      
      const valuation = price * a.quantity;
      return { ...a, price, valuation };
    });

    const sum = vals.reduce((acc, curr) => acc + curr.valuation, 0);
    return vals.map(v => ({
      ...v,
      percentage: sum > 0 ? (v.valuation / sum) * 100 : 0
    }));
  }, [allocations, livePrices]);

  const liveWatchlist = useMemo(() => {
    return watchlist.map(w => {
      const livePrice = livePrices[w.ticker] || w.price;
      const allocObj = liveAllocations.find(la => la.ticker === w.ticker);
      return {
        ...w,
        price: livePrice,
        allocation: allocObj ? allocObj.percentage : w.allocation
      };
    });
  }, [watchlist, livePrices, liveAllocations]);

  // Dynamic Portfolio Calculations

  // Lead analyst Catherine Vance state
  const [analystCommentary, setAnalystCommentary] = useState({
    topic: 'Strategic Position Balance',
    text: 'Loading real-time asset insights...'
  });
  const [lastCommentaryUpdate, setLastCommentaryUpdate] = useState<Date>(new Date());
  const [isRefreshingCommentary, setIsRefreshingCommentary] = useState(false);

  // Updates analyst advice dynamically based on hourly rotation or live changes
  const updateAnalystAdvice = (force = false) => {
    if (force) setIsRefreshingCommentary(true);
    setTimeout(() => {
      const freshCommentary = generateCatherineCommentary(totalNetBalance, watchlist, livePrices);
      setAnalystCommentary(freshCommentary);
      setLastCommentaryUpdate(new Date());
      setIsRefreshingCommentary(false);
      if (force) {
        showNotification('AI Analyst advice refreshed using live asset metrics.');
      }
    }, force ? 600 : 0);
  };

  // Run update on mount
  useEffect(() => {
    updateAnalystAdvice();
  }, [totalNetBalance]);

  // High-end real photos for asset representation
  const assetImages = useMemo<Record<string, string>>(() => ({
    BTC: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&q=80&w=200',
    ETH: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=200',
    SOL: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=200'
  }), []);

  // --- CHART STATE MANAGEMENT ---
  const [timeframe, setTimeframe] = useState<string>('1D');

  // Search & sorting for holdings table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'ticker' | 'value' | 'change'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Action Drawer Dialog Toggles
  const [activeDialog, setActiveDialog] = useState<'vault' | 'trade' | null>(null);

  // Vault Savings System States
  // Vault state is now fully synchronized with unified useFinancials

  const [isVaultOnboarded, setIsVaultOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('vault_onboarded') === 'true';
  });

  const [vaultPasscode, setVaultPasscode] = useState<string>(() => {
    return localStorage.getItem('vault_passcode') || '';
  });

  const [vaultState, setVaultState] = useState<'closed' | 'setup' | 'locked' | 'unlocked'>('closed');
  const [vaultSetupStep, setVaultSetupStep] = useState<number | null>(null);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeConfirm, setPasscodeConfirm] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isPasscodeConfirming, setIsPasscodeConfirming] = useState<boolean>(false);
  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);

  // Deposit/Withdraw parameters
  const [vaultActionType, setVaultActionType] = useState<'deposit' | 'withdraw' | null>(null);
  const [vaultActionAsset, setVaultActionAsset] = useState<string>('BTC');
  const [vaultActionAmount, setVaultActionAmount] = useState<string>('');
  const [vaultGoalName, setVaultGoalName] = useState<string>('');
  const [vaultTargetDate, setVaultTargetDate] = useState<string>('');
  const [vaultNotes, setVaultNotes] = useState<string>('');
  const [showWithdrawPasscodeVerify, setShowWithdrawPasscodeVerify] = useState<boolean>(false);
  const [withdrawVerifyInput, setWithdrawVerifyInput] = useState<string>('');

  // Asset Statistics states
  const [isAssetStatsExpanded, setIsAssetStatsExpanded] = useState<boolean>(false);
  const [hoveredAllocIndex, setHoveredAllocIndex] = useState<number | null>(null);

  // Selected Execution Event state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Trade Executor Modal Parameters
  const [tradeAsset, setTradeAsset] = useState<string>('BTC');
  const [tradeAmount, setTradeAmount] = useState<string>('0.05');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  // Sync animations
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // --- DERIVED CHART DATA MAPPED TO TV LIGHTWEIGHT CHARTS (Aggregated Portfolio Value) ---
  const tvChartData = useMemo(() => {
    const helperTimeframe = timeframe === '1H' ? '1D' : timeframe === '1D' ? '5D' : timeframe === '1W' ? '1M' : '3M';
    const rawData = generateChartData(helperTimeframe, 'Bitcoin');
    
    // Scale the raw data so it is centered around 1,410,000 USD (Aggregated total portfolio equity value)
    const scaleFactor = 1410000 / 64230;
    
    return rawData.map((d, idx) => {
      const date = new Date(2026, 6, 12);
      date.setDate(date.getDate() - (rawData.length - idx));
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const timeStr = `${yyyy}-${mm}-${dd}`;
      
      return {
        time: timeStr,
        open: Math.round((d.open || 64100) * scaleFactor),
        high: Math.round((d.high || 64300) * scaleFactor),
        low: Math.round((d.low || 63900) * scaleFactor),
        close: Math.round((d.close || 64200) * scaleFactor),
      };
    });
  }, [timeframe]);

  // Live execution events mapped directly to timestamps in tvChartData
  const executionEvents = useMemo(() => {
    if (tvChartData.length < 8) return [];
    
    const btcPrice = livePrices['BTC'] || 64230;
    const ethPrice = livePrices['ETH'] || 3450.20;
    const solPrice = livePrices['SOL'] || 145.60;
    const aaplPrice = livePrices['AAPL'] || 172.50;

    const eventsData = [
      {
        id: 'evt-1',
        asset: 'BTC',
        action: 'Take Profit',
        label: 'BTC TP',
        pnl: `+$${((btcPrice * 0.065)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlType: 'gain',
        price: formatCurrency(btcPrice),
        confidence: `${(96.5 + Math.sin(tickTracker * 0.05) * 0.5).toFixed(1)}%`,
        color: '#00D09C',
        textColor: 'text-[#00D09C]',
        bgColor: 'bg-[#00D09C]/10',
        dotColor: 'bg-[#00D09C]',
        markerShape: 'arrowDown',
        markerPosition: 'aboveBar',
        indexOffset: 0.15,
        timestamp: '',
        fullTime: '10:15 UTC'
      },
      {
        id: 'evt-2',
        asset: 'BTC',
        action: 'Stop Loss',
        label: 'BTC SL',
        pnl: `-$${((btcPrice * 0.019)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlType: 'loss',
        price: formatCurrency(btcPrice * 0.91),
        confidence: `${(91.2 + Math.cos(tickTracker * 0.04) * 0.3).toFixed(1)}%`,
        color: '#FF6B6B',
        textColor: 'text-[#FF6B6B]',
        bgColor: 'bg-[#FF6B6B]/10',
        dotColor: 'bg-[#FF6B6B]',
        markerShape: 'arrowUp',
        markerPosition: 'belowBar',
        indexOffset: 0.35,
        timestamp: '',
        fullTime: '14:20 UTC'
      },
      {
        id: 'evt-3',
        asset: 'ETH',
        action: 'Take Profit',
        label: 'ETH TP',
        pnl: `+$${((ethPrice * 0.63)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlType: 'gain',
        price: formatCurrency(ethPrice),
        confidence: `${(94.1 + Math.sin(tickTracker * 0.06) * 0.4).toFixed(1)}%`,
        color: '#00D09C',
        textColor: 'text-[#00D09C]',
        bgColor: 'bg-[#00D09C]/10',
        dotColor: 'bg-[#00D09C]',
        markerShape: 'arrowDown',
        markerPosition: 'aboveBar',
        indexOffset: 0.50,
        timestamp: '',
        fullTime: '18:45 UTC'
      },
      {
        id: 'evt-4',
        asset: 'SOL',
        action: 'Rebalance',
        label: 'SOL REBAL',
        pnl: `+$${((solPrice * 2.8)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlType: 'gain',
        price: formatCurrency(solPrice),
        confidence: `${(89.4 + Math.cos(tickTracker * 0.07) * 0.5).toFixed(1)}%`,
        color: '#EAB308',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        dotColor: 'bg-amber-400',
        markerShape: 'circle',
        markerPosition: 'aboveBar',
        indexOffset: 0.65,
        timestamp: '',
        fullTime: '01:10 UTC'
      },
      {
        id: 'evt-5',
        asset: 'XRP',
        action: 'Entry Buy',
        label: 'XRP BUY',
        pnl: 'Active',
        pnlType: 'neutral',
        price: '$0.58',
        confidence: `${(86.0 + Math.sin(tickTracker * 0.08) * 0.6).toFixed(1)}%`,
        color: '#3B82F6',
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        dotColor: 'bg-blue-400',
        markerShape: 'arrowUp',
        markerPosition: 'belowBar',
        indexOffset: 0.78,
        timestamp: '',
        fullTime: '05:30 UTC'
      },
      {
        id: 'evt-6',
        asset: 'AAPL',
        action: 'Closed Position',
        label: 'AAPL SELL',
        pnl: `+$${((aaplPrice * 18.5)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnlType: 'gain',
        price: formatCurrency(aaplPrice),
        confidence: `${(98.2 + Math.sin(tickTracker * 0.03) * 0.2).toFixed(1)}%`,
        color: '#FF6B6B',
        textColor: 'text-[#FF6B6B]',
        bgColor: 'bg-[#FF6B6B]/10',
        dotColor: 'bg-[#FF6B6B]',
        markerShape: 'arrowDown',
        markerPosition: 'aboveBar',
        indexOffset: 0.90,
        timestamp: '',
        fullTime: '09:05 UTC'
      }
    ];
    
    return eventsData.map(evt => {
      const idx = Math.min(
        tvChartData.length - 1,
        Math.floor(tvChartData.length * evt.indexOffset)
      );
      const dPoint = tvChartData[idx];
      return {
        ...evt,
        timestamp: dPoint?.time || '',
      };
    });
  }, [tvChartData, livePrices, tickTracker, formatCurrency]);

  // Real-time simulated price feed WebSocket/Ticks simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next: Record<string, number> = { ...prev };
        watchlist.forEach(w => {
          const currentPrice = prev[w.ticker] || w.price;
          const fluctuation = currentPrice * (Math.random() - 0.495) * 0.0008;
          next[w.ticker] = +(currentPrice + fluctuation).toFixed(2);
        });
        return next;
      });
      setTickTracker(prev => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [watchlist]);

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      updateAnalystAdvice();
      showNotification('Compounding assets synced. Direct price-feed verified.');
    }, 900);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sort and Filter Holdings
  const filteredHoldings = useMemo(() => {
    return watchlist
      .filter(h => 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        h.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'ticker') {
          return sortOrder === 'asc' ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
        }
        if (sortBy === 'value') {
          valA = (livePrices[a.ticker] || a.price) * a.quantity;
          valB = (livePrices[b.ticker] || b.price) * b.quantity;
        } else if (sortBy === 'change') {
          valA = a.change;
          valB = b.change;
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [watchlist, searchQuery, sortBy, sortOrder, livePrices]);

  const change24hPercent = useMemo(() => {
    const btcLive = livePrices['BTC'] || 64230;
    const ethLive = livePrices['ETH'] || 3450.20;
    const solLive = livePrices['SOL'] || 145.60;
    
    const btcPrev = btcLive / 1.0245;
    const ethPrev = ethLive / 1.0182;
    const solPrev = solLive / 0.9948;

    const currentTotal = btcLive * 0.85 + ethLive * 12.0 + solLive * 120.0;
    const prevTotal = btcPrev * 0.85 + ethPrev * 12.0 + solPrev * 120.0;

    return ((currentTotal - prevTotal) / prevTotal) * 100;
  }, [livePrices]);

  const getDynamicConfidence = (base: number, symbol: string) => {
    const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    const offset = Math.sin(tickTracker * 0.15 + seed) * 1.5;
    const val = base + offset;
    return Math.min(100, Math.max(0, val)).toFixed(1);
  };

  const dynamicExposure = useMemo(() => {
    const btcOffset = Math.sin(tickTracker * 0.08) * 0.4;
    const ethOffset = Math.cos(tickTracker * 0.1) * 0.3;
    
    // Base values: Crypto 48%, Stocks 27%, Commodities 15%, Cash 10%
    const crypto = 48 + btcOffset;
    const stocks = 27 + ethOffset;
    const commodities = 15 - (btcOffset + ethOffset) * 0.5;
    const cash = 10 - (btcOffset + ethOffset) * 0.5;

    // Risk: Low 41%, Medium 36%, High 23%
    const lowRisk = 41 + btcOffset * 0.8;
    const medRisk = 36 - ethOffset * 0.5;
    const highRisk = 23 - (btcOffset * 0.8 - ethOffset * 0.5);

    // Largest: Weight 28%, Confidence 96%
    const weight = 28 + btcOffset * 0.3;
    const confidence = 96 + Math.sin(tickTracker * 0.12) * 0.6;

    return {
      allocations: [
        { name: 'Crypto', value: crypto, color: '#00D09C', textBg: 'bg-[#00D09C]/10' },
        { name: 'Stocks', value: stocks, color: '#3b82f6', textBg: 'bg-blue-500/10' },
        { name: 'Commodities', value: commodities, color: '#eab308', textBg: 'bg-amber-500/10' },
        { name: 'Cash Reserve', value: cash, color: '#64748b', textBg: 'bg-slate-500/10' },
      ],
      risks: [
        { name: 'Low Risk', value: lowRisk, color: '#10b981', dotColor: 'bg-emerald-400' },
        { name: 'Medium Risk', value: medRisk, color: '#f59e0b', dotColor: 'bg-amber-400' },
        { name: 'High Risk', value: highRisk, color: '#ef4444', dotColor: 'bg-rose-500' },
      ],
      largest: {
        name: 'Bitcoin',
        weight: weight,
        confidence: confidence
      }
    };
  }, [tickTracker]);

  const executeTradeOrder = () => {
    showNotification(`Tactical order block filled: ${tradeType} ${tradeAmount} ${tradeAsset}.`);
    setActiveDialog(null);
  };

  return (
    <AnimatePresence>
      {viewMode === 'vault' && (
        <VaultScreen 
          key="vault"
          theme={theme}
          onBack={() => setViewMode('portfolio')}
          activeTradingBalance={activeTradingBalance}
          showNotification={showNotification}
          vaultBalance={vaultBalance}
          setVaultBalance={updateVaultBalance}
          activeBalanceOffset={activeBalanceOffset}
          setActiveBalanceOffset={updateActiveBalanceOffset}
        />
      )}

      {viewMode === 'asset-stats' && (
        <AssetStatsScreen 
          key="asset-stats"
          theme={theme}
          onBack={() => setViewMode('portfolio')}
          activeTradingBalance={activeTradingBalance}
          allocations={liveAllocations}
        />
      )}

      {viewMode === 'portfolio' && (
        <motion.div 
          key="portfolio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`pt-[73px] text-slate-200 font-sans antialiased relative flex flex-col justify-start flex-1 min-h-screen`}
        >
      {/* Toast HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="fixed top-18 left-4 right-4 z-50 flex items-center space-x-2.5 px-4 py-3 bg-[#0E1320]/95 border border-white/[0.06] text-slate-100 text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-[#00D09C] animate-pulse" />
            <span className="flex-1 font-sans text-[10px] uppercase tracking-wider">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* 1. FIXED HEADER */}
      <header className={`fixed top-0 left-0 lg:left-64 right-0 z-40 backdrop-blur-xl ${isDark ? 'bg-black/90' : 'bg-white/90'} border-b ${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center box-border`}>
        <div>
          <h1 className={`text-xl font-black ${textPrimary}`}>Portfolio</h1>
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D09C] animate-pulse" />
            Track your trades and assets
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={triggerSync}
            className={`transition-all hover:opacity-80 cursor-pointer ${textSecondary}`}
            title="Refresh positions"
          >
            <RefreshCw size={20} className={`${isSyncing ? 'animate-spin text-[#00D09C]' : ''}`} />
          </button>
        </div>
      </header>
 
      {/* --- SCROLLABLE LAYOUT WRAPPER --- */}
      <main className="w-full space-y-6 flex-grow flex flex-col mt-4 px-4 sm:px-6 lg:max-w-5xl lg:mx-auto">
        
        {/* --- 2. THE TOTAL MANAGED ASSET VALUE DISPLAY --- */}
        <div 
          className={`${cardClasses} p-6 rounded-[24px] space-y-4 relative overflow-hidden`}
        >
          {/* Main Top Header: Active Trading Capital */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00D09C] rounded-full animate-pulse" />
              Active Trading Capital
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3.5xl font-extrabold text-white tracking-tight">
                ${Math.max(0, activeTradingBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">USD</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Actively rotated and balanced across positions by Aver AI engine.
            </p>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-white/[0.05]">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Protected Savings
              </span>
              <div className="text-sm font-bold text-slate-100 font-mono">
                ${vaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full" />
                Total Assets (AUM)
              </span>
              <div className="text-sm font-bold text-white font-mono">
                ${totalNetBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Return Info Footing */}
          <div className="flex justify-between items-center pt-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${change24hPercent >= 0 ? 'bg-[#00D09C]/10 text-[#00D09C]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'}`}>
                {change24hPercent >= 0 ? '▲ +' : '▼ '}{change24hPercent.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">24h Return</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">
              Live Price Feed Active
            </div>
          </div>
        </div>

        {/* --- 3. THE PORTFOLIO NAV CHART PANEL --- */}
        <div 
          className={`${cardClasses} rounded-[24px] p-5 space-y-4`}
        >
          <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#00D09C]" />
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-white font-sans">
                  Equity Performance
                </h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Historical balance track</p>
              </div>
            </div>

            {/* Timeframe Selectors */}
            <div className="flex bg-[#080B11]/80 p-0.5 rounded-lg border border-white/[0.05]">
              {['1D', '1W', '1M'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1 rounded-md text-[10px] font-semibold tracking-wider transition-all cursor-pointer touch-manipulation ${
                    timeframe === t ? 'bg-[#00D09C] text-black shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Stage */}
          <div className="bg-[#080B11]/40 p-2 border border-white/[0.04] rounded-2xl relative overflow-hidden">
            <AverPortfolioChart 
              data={tvChartData} 
              isDark={isDark} 
              onHover={(data) => setHoveredOHLC(data)} 
              executionEvents={executionEvents}
            />

            {/* Live Interactive Overlay Tooltip for Selected Event */}
            <AnimatePresence>
              {selectedEventId && (() => {
                const activeEvt = executionEvents.find(e => e.id === selectedEventId);
                if (!activeEvt) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-4 left-4 right-4 z-20 p-3 bg-[#080B11]/95 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-xl space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${activeEvt.dotColor} animate-pulse`} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-sans">
                          {activeEvt.asset} — {activeEvt.action}
                        </span>
                      </div>
                      <button 
                        onClick={() => setSelectedEventId(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-medium font-sans bg-black/40 p-2 rounded-lg border border-white/[0.04]">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Execution Price</span>
                        <span className="text-white font-mono font-bold text-xs">{activeEvt.price}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Profit / Loss</span>
                        <span className={`font-mono font-bold text-xs ${activeEvt.pnlType === 'gain' ? 'text-[#00D09C]' : activeEvt.pnlType === 'loss' ? 'text-[#FF6B6B]' : 'text-slate-200'}`}>
                          {activeEvt.pnl}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Confidence</span>
                        <span className="text-[#00D09C] font-mono font-bold text-xs">{activeEvt.confidence}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono px-0.5">
                      <span>Timeline Sync: {activeEvt.timestamp}</span>
                      <span>Execution Time: {activeEvt.fullTime}</span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Clickable Timeline Execution Indicators */}
          <div className="space-y-2 pt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
              Live AI Executions Feed
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
              {executionEvents.map(evt => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(selectedEventId === evt.id ? null : evt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-bold font-sans uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer touch-manipulation whitespace-nowrap border ${
                    selectedEventId === evt.id 
                      ? 'bg-[#00D09C]/10 border-[#00D09C]/30 text-[#00D09C] shadow-md shadow-[#00D09C]/5' 
                      : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${evt.dotColor}`} />
                  <span>{evt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic OHLC Output Grid */}
          <div className="grid grid-cols-4 gap-2 bg-[#080B11]/60 p-3 border border-white/[0.04] rounded-2xl font-sans text-[10px] text-center">
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold mb-0.5 tracking-wider">Open</div>
              <strong className="text-slate-200 font-semibold block font-mono">
                {hoveredOHLC ? `$${Math.round(hoveredOHLC.open).toLocaleString()}` : '--'}
              </strong>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold mb-0.5 tracking-wider">High</div>
              <strong className="text-[#00D09C] font-semibold block font-mono">
                {hoveredOHLC ? `$${Math.round(hoveredOHLC.high).toLocaleString()}` : '--'}
              </strong>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold mb-0.5 tracking-wider">Low</div>
              <strong className="text-[#FF6B6B] font-semibold block font-mono">
                {hoveredOHLC ? `$${Math.round(hoveredOHLC.low).toLocaleString()}` : '--'}
              </strong>
            </div>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-semibold mb-0.5 tracking-wider">Close</div>
              <strong className={`font-semibold block font-mono ${hoveredOHLC ? (hoveredOHLC.close >= hoveredOHLC.open ? 'text-[#00D09C]' : 'text-[#FF6B6B]') : 'text-slate-200'}`}>
                {hoveredOHLC ? `$${Math.round(hoveredOHLC.close).toLocaleString()}` : '--'}
              </strong>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 font-medium tracking-wide text-center">
            Drag across the chart to view historical details or tap a feed event to locate
          </div>
        </div>

        {/* --- 4. PORTFOLIO TOOLS --- */}
        <div className="space-y-3.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
            Portfolio Tools
          </span>

          {/* VAULT CARD - Premium Solid Style */}
          <motion.button 
            layoutId="vault-card-container"
            onClick={() => {
              setViewMode('vault');
            }}
            className={`w-full ${cardClasses} rounded-[24px] p-5 flex items-center space-x-4 relative overflow-hidden group hover:opacity-90 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#00D09C]/30 min-h-[96px] touch-manipulation`}
          >
            <motion.div 
              layoutId="vault-icon-bg"
              className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 flex-shrink-0 flex items-center justify-center transition-all group-hover:scale-105"
            >
              <Vault className="w-5 h-5 text-[#00D09C]" />
            </motion.div>

            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <motion.h4 
                  layoutId="vault-title"
                  className="text-base font-bold text-white tracking-tight"
                >
                  Vault
                </motion.h4>
              </div>
              <p className="text-slate-400 text-xs font-normal leading-relaxed">
                Secure savings system excluded from active AI trading
              </p>
            </div>
          </motion.button>

          {/* ASSET STATISTICS - Premium Solid Style */}
          <motion.button 
            layoutId="stats-card-container"
            onClick={() => {
              setViewMode('asset-stats');
            }}
            className={`w-full ${cardClasses} rounded-[24px] p-5 flex items-center space-x-4 relative overflow-hidden group hover:opacity-90 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#00D09C]/30 min-h-[96px] touch-manipulation`}
          >
            <motion.div 
              layoutId="stats-icon-bg"
              className="w-12 h-12 rounded-2xl bg-[#00D09C]/10 flex-shrink-0 flex items-center justify-center transition-all group-hover:scale-105"
            >
              <PieChart className="w-5 h-5 text-[#00D09C]" />
            </motion.div>

            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <motion.h4 
                  layoutId="stats-title"
                  className="text-base font-bold text-white tracking-tight"
                >
                  Asset Statistics
                </motion.h4>
              </div>
              <p className="text-slate-400 text-xs font-normal leading-relaxed">
                Interactive capital allocation and diversification metrics
              </p>
            </div>
          </motion.button>
        </div>

        {/* --- 5. LEAD ANALYST AI COMMENTARY (Broadcast Style) --- */}
        <div 
          className={`${cardClasses} rounded-[24px] p-5 space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 relative">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" 
                  alt="Dr. Catherine Vance" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00D09C] rounded-full border-2 border-[#0E1320]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dr. Catherine Vance</h4>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block font-sans">
                  Lead Strategist
                </span>
              </div>
            </div>

            <button 
              onClick={() => updateAnalystAdvice(true)}
              disabled={isRefreshingCommentary}
              className="w-8 h-8 bg-[#080B11] hover:bg-black/40 border border-white/[0.05] text-slate-400 hover:text-[#00D09C] rounded-xl transition-all flex items-center justify-center cursor-pointer touch-manipulation"
              title="Force re-evaluate metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCommentary ? 'animate-spin text-[#00D09C]' : ''}`} />
            </button>
          </div>

          <div className="bg-[#080B11]/50 p-4 rounded-2xl border border-white/[0.04] space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-semibold text-[#00D09C] uppercase tracking-wider">
                {analystCommentary.topic}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed italic font-medium">
              "{analystCommentary.text}"
            </p>
            <div className="text-[9px] text-slate-500 font-medium font-sans text-right pt-2 border-t border-white/[0.03]">
              Evaluated: {lastCommentaryUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>

        {/* --- 6. AI MARKET INTELLIGENCE --- */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#00D09C]" />
            <h3 className="text-xs font-bold tracking-wider text-slate-400 font-sans uppercase">
              AI Market Intelligence
            </h3>
          </div>

          <div className="space-y-5">
            {/* LEFT CARD — AI MARKET RADAR */}
            <div className={`${cardClasses} rounded-[24px] p-5 space-y-4`}>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white tracking-tight">AI Market Radar</h4>
                <p className="text-xs text-slate-400 font-normal leading-relaxed">Assets currently monitored by the AI engine.</p>
              </div>

              <div className="space-y-4 pt-1">
                {radarCategories.map(cat => (
                  <div key={cat.key} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/[0.03] pb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs">{cat.icon}</span>
                        <span className="text-xs font-bold text-white">{cat.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium font-sans uppercase tracking-wider">{cat.subtitle}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 pl-2">
                      {cat.assets.map(asset => {
                        const dynConf = getDynamicConfidence(asset.baseConfidence, asset.symbol);
                        return (
                          <div 
                            key={asset.symbol} 
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.03] transition-all"
                          >
                            <div className="flex items-center space-x-2.5">
                              <CoinLogo symbol={asset.symbol} size={24} className="rounded-full overflow-hidden" />
                              <div>
                                <div className="text-xs font-bold text-white">{asset.symbol}</div>
                                <div className="text-[10px] text-slate-400 leading-tight">{asset.name}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-sans">Confidence</span>
                                <span className="text-xs font-bold text-[#00D09C] font-mono">
                                  {dynConf}%
                                </span>
                              </div>
                              <span className={`w-2 h-2 rounded-full ${cat.dotColor} animate-pulse`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CARD — MARKET EXPOSURE */}
            <div className={`${cardClasses} rounded-[24px] p-5 space-y-5`}>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white tracking-tight">Market Exposure</h4>
                <p className="text-xs text-slate-400 font-normal leading-relaxed">Current capital distribution managed by the AI.</p>
              </div>

              {/* Animated Allocation Bars */}
              <div className="space-y-3 pt-2">
                {dynamicExposure.allocations.map(alloc => (
                  <div key={alloc.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">{alloc.name}</span>
                      <span className="font-mono font-bold text-[#00D09C]">{alloc.value.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${alloc.value}%` }}
                        transition={{ type: 'spring', damping: 15 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: alloc.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Distribution */}
              <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Distribution</h5>
                <div className="space-y-3">
                  {dynamicExposure.risks.map(risk => (
                    <div key={risk.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${risk.dotColor}`} />
                          <span className="font-semibold text-slate-300">{risk.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{risk.value.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.value}%` }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: risk.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Largest Exposure details */}
              <div className="bg-[#080B11]/60 p-4 border border-white/[0.04] rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Largest Exposure</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#00D09C]/10 text-[#00D09C] text-[9px] font-bold uppercase tracking-wider">Top Asset</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h6 className="text-base font-black text-white tracking-tight">{dynamicExposure.largest.name}</h6>
                    <span className="text-[9px] text-slate-500 font-mono font-semibold uppercase tracking-wider block">Portfolio Weight</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white font-mono block">
                      {dynamicExposure.largest.weight.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* --- DRAWERS AND ACTION SHEETS (Android Portals) --- */}
      <AnimatePresence>
        {activeDialog && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4">
            
            {/* Dark background click handler */}
            <div className="absolute inset-0" onClick={() => {
              setActiveDialog(null);
              setVaultState('closed');
              setVaultActionType(null);
              setShowWithdrawPasscodeVerify(false);
            }} />

            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#0E1320] border-t sm:border border-white/[0.08] rounded-t-[32px] sm:rounded-[24px] w-full max-w-sm p-6 space-y-5 shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-[#00D09C]/10 text-[#00D09C] rounded-xl">
                    {activeDialog === 'trade' ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Vault className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight uppercase font-sans">
                    {activeDialog === 'trade' ? 'Liquidity Swap' : 'Secure Savings Vault'}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setActiveDialog(null);
                    setVaultState('closed');
                    setVaultActionType(null);
                    setShowWithdrawPasscodeVerify(false);
                  }}
                  className="p-1.5 bg-[#080B11] hover:bg-black/40 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer touch-manipulation min-w-[36px] min-h-[36px] border border-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Trade Form Drawer */}
              {activeDialog === 'trade' && (
                <div className="space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-2 gap-2 bg-[#080B11]/60 p-1 border border-white/[0.04] rounded-xl text-center">
                    <button 
                      onClick={() => setTradeType('BUY')}
                      className={`py-2 rounded-lg font-semibold transition-all cursor-pointer touch-manipulation ${tradeType === 'BUY' ? 'bg-[#00D09C] text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => setTradeType('SELL')}
                      className={`py-2 rounded-lg font-semibold transition-all cursor-pointer touch-manipulation ${tradeType === 'SELL' ? 'bg-[#FF6B6B] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      SELL
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Select Asset</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['BTC', 'ETH', 'SOL'].map(a => (
                        <button 
                          key={a}
                          onClick={() => setTradeAsset(a)}
                          className={`py-2 border rounded-xl font-mono text-xs cursor-pointer touch-manipulation transition-all ${tradeAsset === a ? 'bg-[#00D09C]/10 border-[#00D09C]/30 text-[#00D09C] font-semibold' : 'bg-[#080B11]/40 border-white/[0.04] text-slate-400 hover:text-white'}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                      <span>Order Size</span>
                      <span className="font-sans text-slate-400 font-medium">Avail: ${activeTradingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} Active</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full bg-[#080B11]/50 border border-white/[0.05] rounded-xl p-3 text-white outline-none font-semibold text-sm focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]/20 transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#00D09C] font-semibold font-mono">{tradeAsset}</span>
                    </div>
                  </div>

                  <button 
                    onClick={executeTradeOrder}
                    className="w-full bg-[#00D09C] hover:bg-[#00b084] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider transition-all mt-2 touch-manipulation min-h-[44px] shadow-md"
                  >
                    Confirm {tradeType} Order
                  </button>
                </div>
              )}

              {/* SECURE VAULT FLOWS */}
              {activeDialog === 'vault' && (
                <div className="space-y-4">
                  
                  {/* STEP 1: ONBOARDING WELCOME */}
                  {vaultState === 'setup' && vaultSetupStep === 1 && (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 bg-[#00D09C]/10 rounded-full flex items-center justify-center mx-auto">
                        <Vault className="w-7 h-7 text-[#00D09C]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white tracking-tight">Welcome to Private Vault</h4>
                        <p className="text-slate-400 text-xs font-normal leading-relaxed">
                          Securely stores your capital outside of active AI rotation. Assets placed here are 100% protected and excluded from automated trading runs until you withdraw them.
                        </p>
                      </div>
                      <div className="bg-[#080B11]/50 p-3 rounded-xl border border-white/[0.04] text-[10px] text-[#00D09C] font-semibold flex items-center gap-2 text-left leading-relaxed">
                        <Shield className="w-4 h-4 flex-shrink-0" />
                        <span>Sovereign security passcode will be generated to decrypt and access savings.</span>
                      </div>
                      <button 
                        onClick={() => setVaultSetupStep(2)}
                        className="w-full py-3 bg-[#00D09C] hover:bg-[#00b084] text-black text-xs font-bold rounded-xl uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Create Security Passcode
                      </button>
                    </div>
                  )}

                  {/* STEP 2: ONBOARDING PIN SETUP */}
                  {vaultState === 'setup' && vaultSetupStep === 2 && (
                    <div className="space-y-4 text-center">
                      <h4 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">
                        {!isPasscodeConfirming ? 'Create 6-Digit PIN' : 'Verify Security PIN'}
                      </h4>
                      <p className="text-slate-400 text-xs leading-tight">
                        {!isPasscodeConfirming 
                          ? 'Enter 6 numbers to lock your protected Vault.' 
                          : 'Re-enter your 6-digit passcode to authorize security sync.'}
                      </p>

                      {/* Dot Pin indicators */}
                      <div className={`flex justify-center space-x-3.5 py-2.5 ${shakeTrigger ? 'animate-bounce' : ''}`}>
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const digits = !isPasscodeConfirming ? passcodeInput : passcodeConfirm;
                          const isActive = idx < digits.length;
                          return (
                            <div 
                              key={idx}
                              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                                isActive 
                                  ? 'bg-[#00D09C] border-[#00D09C] scale-110 shadow-sm shadow-[#00D09C]/50' 
                                  : 'border-white/10 bg-white/5'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {passcodeError && (
                        <p className="text-[#FF6B6B] text-[11px] font-semibold leading-relaxed">
                          {passcodeError}
                        </p>
                      )}

                      {/* Custom numerical secure keypad */}
                      <div className="grid grid-cols-3 gap-2 pt-2 max-w-[240px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              const digits = !isPasscodeConfirming ? passcodeInput : passcodeConfirm;
                              if (digits.length < 6) {
                                const val = num.toString();
                                if (!isPasscodeConfirming) {
                                  const next = passcodeInput + val;
                                  setPasscodeInput(next);
                                  if (next.length === 6) {
                                    setTimeout(() => {
                                      setIsPasscodeConfirming(true);
                                      setPasscodeError(null);
                                    }, 200);
                                  }
                                } else {
                                  const next = passcodeConfirm + val;
                                  setPasscodeConfirm(next);
                                  if (next.length === 6) {
                                    setTimeout(() => {
                                      if (passcodeInput === next) {
                                        setVaultPasscode(passcodeInput);
                                        localStorage.setItem('vault_passcode', passcodeInput);
                                        setVaultSetupStep(3);
                                      } else {
                                        setPasscodeConfirm('');
                                        setPasscodeError("Passcodes do not match. Re-enter confirm PIN.");
                                        setShakeTrigger(true);
                                        setTimeout(() => setShakeTrigger(false), 500);
                                      }
                                    }, 350);
                                  }
                                }
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            if (!isPasscodeConfirming) {
                              setPasscodeInput('');
                            } else {
                              setPasscodeConfirm('');
                            }
                          }}
                          className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          CLEAR
                        </button>
                        <button
                          onClick={() => {
                            const digits = !isPasscodeConfirming ? passcodeInput : passcodeConfirm;
                            if (digits.length < 6) {
                              const val = '0';
                              if (!isPasscodeConfirming) {
                                const next = passcodeInput + val;
                                setPasscodeInput(next);
                                if (next.length === 6) {
                                  setTimeout(() => {
                                    setIsPasscodeConfirming(true);
                                    setPasscodeError(null);
                                  }, 200);
                                }
                              } else {
                                const next = passcodeConfirm + val;
                                setPasscodeConfirm(next);
                                if (next.length === 6) {
                                  setTimeout(() => {
                                    if (passcodeInput === next) {
                                      setVaultPasscode(passcodeInput);
                                      localStorage.setItem('vault_passcode', passcodeInput);
                                      setVaultSetupStep(3);
                                    } else {
                                      setPasscodeConfirm('');
                                      setPasscodeError("Passcodes do not match. Re-enter confirm PIN.");
                                      setShakeTrigger(true);
                                      setTimeout(() => setShakeTrigger(false), 500);
                                    }
                                  }, 350);
                                }
                              }
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                        >
                          0
                        </button>
                        <button
                          onClick={() => {
                            if (!isPasscodeConfirming) {
                              setPasscodeInput(prev => prev.slice(0, -1));
                            } else {
                              setPasscodeConfirm(prev => prev.slice(0, -1));
                            }
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          ⌫
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SUCCESS ONBOARDING */}
                  {vaultState === 'setup' && vaultSetupStep === 3 && (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 bg-[#00D09C]/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <CheckCircle2 className="w-8 h-8 text-[#00D09C]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white tracking-tight">Security Vault Active</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Your sovereign crypto savings system has been secured with private bank-grade encryption algorithms. Excluded from AI trading pool.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsVaultOnboarded(true);
                          localStorage.setItem('vault_onboarded', 'true');
                          setVaultState('unlocked');
                          setPasscodeInput('');
                          setPasscodeConfirm('');
                        }}
                        className="w-full py-3 bg-[#00D09C] hover:bg-[#00b084] text-black text-xs font-bold rounded-xl uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Open Secure Vault
                      </button>
                    </div>
                  )}

                  {/* VAULT ACCESS PIN LOCKSCREEN */}
                  {vaultState === 'locked' && (
                    <div className="space-y-4 text-center">
                      <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Authorize Decryption</h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Enter your private 6-digit secure key to open.
                        </p>
                      </div>

                      {/* Pin dots */}
                      <div className={`flex justify-center space-x-3.5 py-1.5 ${shakeTrigger ? 'animate-bounce' : ''}`}>
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const isActive = idx < passcodeInput.length;
                          return (
                            <div 
                              key={idx}
                              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                                isActive 
                                  ? 'bg-[#00D09C] border-[#00D09C] scale-110 shadow-sm shadow-[#00D09C]/50' 
                                  : 'border-white/10 bg-white/5'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {passcodeError && (
                        <p className="text-[#FF6B6B] text-[11px] font-semibold">
                          {passcodeError}
                        </p>
                      )}

                      {/* Secure numeric keypad */}
                      <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              if (passcodeInput.length < 6) {
                                const val = num.toString();
                                const next = passcodeInput + val;
                                setPasscodeInput(next);
                                if (next.length === 6) {
                                  setTimeout(() => {
                                    if (next === vaultPasscode) {
                                      setVaultState('unlocked');
                                      setPasscodeInput('');
                                      setPasscodeError(null);
                                    } else {
                                      setPasscodeInput('');
                                      setPasscodeError("Incorrect PIN. Access denied.");
                                      setShakeTrigger(true);
                                      setTimeout(() => setShakeTrigger(false), 500);
                                    }
                                  }, 250);
                                }
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => setPasscodeInput('')}
                          className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          CLEAR
                        </button>
                        <button
                          onClick={() => {
                            if (passcodeInput.length < 6) {
                              const val = '0';
                              const next = passcodeInput + val;
                              setPasscodeInput(next);
                              if (next.length === 6) {
                                setTimeout(() => {
                                  if (next === vaultPasscode) {
                                    setVaultState('unlocked');
                                    setPasscodeInput('');
                                    setPasscodeError(null);
                                  } else {
                                    setPasscodeInput('');
                                    setPasscodeError("Incorrect PIN. Access denied.");
                                    setShakeTrigger(true);
                                    setTimeout(() => setShakeTrigger(false), 500);
                                  }
                                }, 250);
                              }
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                        >
                          0
                        </button>
                        <button
                          onClick={() => setPasscodeInput(prev => prev.slice(0, -1))}
                          className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          ⌫
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/[0.03]">
                        <button
                          onClick={() => {
                            if (confirm("Reset Vault? This will clear your passcode and existing vault data.")) {
                              setVaultPasscode('');
                              setIsVaultOnboarded(false);
                              updateVaultBalance(150000);
                              updateActiveBalanceOffset(0);
                              localStorage.removeItem('vault_passcode');
                              localStorage.removeItem('vault_onboarded');
                              localStorage.removeItem('portfolio_vault_balance');
                              localStorage.removeItem('portfolio_active_offset');
                              setVaultState('setup');
                              setVaultSetupStep(1);
                              setPasscodeInput('');
                            }
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#FF6B6B] transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Forgot PIN? Reset Vault
                        </button>
                      </div>
                    </div>
                  )}

                  {/* UNLOCKED VAULT HOME PANEL */}
                  {vaultState === 'unlocked' && vaultActionType === null && (
                    <div className="space-y-4 font-medium text-xs">
                      
                      {/* Secure metrics panel */}
                      <div className="bg-[#080B11]/80 border border-white/[0.06] p-4 rounded-2xl space-y-3.5 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Protected Savings Pool</span>
                          <span className="text-[8px] bg-[#00D09C]/10 text-[#00D09C] px-2 py-0.5 rounded-md font-bold tracking-widest uppercase animate-pulse flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            Multi-Sig Active
                          </span>
                        </div>
                        <div className="space-y-0.5 text-center py-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Total Vault Balance</span>
                          <strong className="text-2xl font-bold text-white tracking-tight font-mono">
                            ${vaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        
                        {/* Core features listing */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-white/[0.04]">
                          <div className="bg-white/[0.01] p-2 border border-white/[0.02] rounded-xl">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Annual APY Lock</span>
                            <span className="text-[#00D09C] font-bold font-mono">5.82% compounded</span>
                          </div>
                          <div className="bg-white/[0.01] p-2 border border-white/[0.02] rounded-xl">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider mb-0.5">Sovereign Space</span>
                            <span className="text-white font-bold font-sans">Unlimited</span>
                          </div>
                        </div>

                        {/* Goal Progress Bar */}
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-semibold">Long-term Savings Goal</span>
                            <span className="text-white font-mono font-bold">{Math.round((vaultBalance / 500000) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/[0.03] border border-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-[#00D09C] rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (vaultBalance / 500000) * 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                            <span>Goal: $500,000.00</span>
                            <span>Remaining: ${(500000 - vaultBalance > 0 ? 500000 - vaultBalance : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Locked Assets List Overview */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Locked Assets Allocation</span>
                        <div className="space-y-1.5 pr-1">
                          {[
                            { name: 'Bitcoin Stable Reserves', ticker: 'BTC', qty: `${(vaultBalance * 0.5 / 64000).toFixed(4)} BTC`, value: vaultBalance * 0.5, color: '#f59e0b' },
                            { name: 'Ethereum Gas locked', ticker: 'ETH', qty: `${(vaultBalance * 0.35 / 3400).toFixed(4)} ETH`, value: vaultBalance * 0.35, color: '#6366f1' },
                            { name: 'USDC Reserve', ticker: 'USDC', qty: `$${(vaultBalance * 0.15).toLocaleString()} USDC`, value: vaultBalance * 0.15, color: '#10b981' },
                          ].map(asset => (
                            <div key={asset.ticker} className="flex justify-between items-center bg-[#080B11]/40 border border-white/[0.03] p-2 rounded-xl text-[10px]">
                              <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: asset.color }} />
                                <div>
                                  <span className="text-white font-bold block">{asset.ticker}</span>
                                  <span className="text-slate-400 block text-[8px]">{asset.name}</span>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-white font-bold block">${Math.round(asset.value).toLocaleString()}</span>
                                <span className="text-slate-400 block text-[8px]">{asset.qty}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3.5 pt-2">
                        <button 
                          onClick={() => {
                            setVaultActionType('deposit');
                            setVaultActionAsset('BTC');
                            setVaultActionAmount('');
                            setVaultGoalName('');
                            setVaultTargetDate('');
                            setVaultNotes('');
                          }}
                          className="py-3 bg-[#00D09C] hover:bg-[#00b084] text-black text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md text-center"
                        >
                          Deposit Funds
                        </button>
                        <button 
                          onClick={() => {
                            setShowWithdrawPasscodeVerify(true);
                            setWithdrawVerifyInput('');
                            setPasscodeError(null);
                          }}
                          className="py-3 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.05] text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md text-center"
                        >
                          Withdraw Savings
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WITHDRAW PIN VERIFICATION FIRST */}
                  {vaultState === 'unlocked' && showWithdrawPasscodeVerify && (
                    <div className="space-y-4 text-center">
                      <div className="w-12 h-12 bg-amber-400/10 border border-amber-400/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Verify Savings PIN</h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Re-enter your secure PIN to authorize withdrawals.
                        </p>
                      </div>

                      {/* Dots */}
                      <div className={`flex justify-center space-x-3.5 py-1.5 ${shakeTrigger ? 'animate-bounce' : ''}`}>
                        {Array.from({ length: 6 }).map((_, idx) => {
                          const isActive = idx < withdrawVerifyInput.length;
                          return (
                            <div 
                              key={idx}
                              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                                isActive 
                                  ? 'bg-[#00D09C] border-[#00D09C] scale-110 shadow-sm shadow-[#00D09C]/50' 
                                  : 'border-white/10 bg-white/5'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {passcodeError && (
                        <p className="text-[#FF6B6B] text-[11px] font-semibold">
                          {passcodeError}
                        </p>
                      )}

                      {/* Secure numeric keypad */}
                      <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            onClick={() => {
                              if (withdrawVerifyInput.length < 6) {
                                const val = num.toString();
                                const next = withdrawVerifyInput + val;
                                setWithdrawVerifyInput(next);
                                if (next.length === 6) {
                                  setTimeout(() => {
                                    if (next === vaultPasscode) {
                                      setShowWithdrawPasscodeVerify(false);
                                      setVaultActionType('withdraw');
                                      setVaultActionAsset('BTC');
                                      setVaultActionAmount('');
                                      setWithdrawVerifyInput('');
                                      setPasscodeError(null);
                                    } else {
                                      setWithdrawVerifyInput('');
                                      setPasscodeError("Security verification PIN mismatch.");
                                      setShakeTrigger(true);
                                      setTimeout(() => setShakeTrigger(false), 500);
                                    }
                                  }, 250);
                                }
                              }
                            }}
                            className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          onClick={() => setWithdrawVerifyInput('')}
                          className="text-[9px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          CLEAR
                        </button>
                        <button
                          onClick={() => {
                            if (withdrawVerifyInput.length < 6) {
                              const val = '0';
                              const next = withdrawVerifyInput + val;
                              setWithdrawVerifyInput(next);
                              if (next.length === 6) {
                                setTimeout(() => {
                                  if (next === vaultPasscode) {
                                    setShowWithdrawPasscodeVerify(false);
                                    setVaultActionType('withdraw');
                                    setVaultActionAsset('BTC');
                                    setVaultActionAmount('');
                                    setWithdrawVerifyInput('');
                                    setPasscodeError(null);
                                  } else {
                                    setWithdrawVerifyInput('');
                                    setPasscodeError("Security PIN failed.");
                                    setShakeTrigger(true);
                                    setTimeout(() => setShakeTrigger(false), 500);
                                  }
                                }, 250);
                              }
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white/[0.02] hover:bg-white/[0.08] active:bg-white/[0.12] text-white text-sm font-bold flex items-center justify-center cursor-pointer border border-white/[0.04] transition-all"
                        >
                          0
                        </button>
                        <button
                          onClick={() => setWithdrawVerifyInput(prev => prev.slice(0, -1))}
                          className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
                        >
                          ⌫
                        </button>
                      </div>

                      <button
                        onClick={() => setShowWithdrawPasscodeVerify(false)}
                        className="w-full mt-2 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* DEPOSIT FORM PANEL */}
                  {vaultState === 'unlocked' && vaultActionType === 'deposit' && (
                    <div className="space-y-4 font-medium text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                        <span className="text-white font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-[#00D09C]">
                          <ArrowUpRight className="w-4 h-4" />
                          Deposit Capital to Vault
                        </span>
                        <button 
                          onClick={() => setVaultActionType(null)}
                          className="text-slate-400 hover:text-white text-[10px] font-bold"
                        >
                          Back
                        </button>
                      </div>

                      {/* Select Asset */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Select Source Asset</label>
                        <div className="grid grid-cols-3 gap-1.5 font-mono">
                          {['BTC', 'ETH', 'Cash', 'SOL', 'Gold', 'AAPL'].map(a => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setVaultActionAsset(a)}
                              className={`py-2 border rounded-xl text-xs font-bold cursor-pointer transition-all ${vaultActionAsset === a ? 'bg-[#00D09C]/10 border-[#00D09C]/30 text-[#00D09C]' : 'bg-[#080B11]/40 border-white/[0.04] text-slate-400'}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                          <span>Deposit Amount (USD)</span>
                          <span className="font-mono">Avail: ${activeTradingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={vaultActionAmount}
                            onChange={(e) => setVaultActionAmount(e.target.value)}
                            className="w-full bg-[#080B11]/50 border border-white/[0.05] rounded-xl p-3 text-white outline-none font-semibold text-sm focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]/20 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setVaultActionAmount(Math.round(activeTradingBalance * 0.5).toString())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-[#00D09C]/10 text-[#00D09C] px-2 py-1 rounded-md uppercase cursor-pointer"
                          >
                            50% Max
                          </button>
                        </div>
                      </div>

                      {/* Savings Goal Name */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Goal Category / Label (Optional)</label>
                        <input 
                          type="text"
                          placeholder="e.g. BTC Bull Peak, Tax Reserve, Real Estate"
                          value={vaultGoalName}
                          onChange={(e) => setVaultGoalName(e.target.value)}
                          className="w-full bg-[#080B11]/50 border border-white/[0.05] rounded-xl p-3 text-white outline-none text-xs focus:border-[#00D09C] transition-all"
                        />
                      </div>

                      {/* Live Math Summary */}
                      {vaultActionAmount && !isNaN(parseFloat(vaultActionAmount)) && (
                        <div className="bg-[#080B11]/70 p-3 rounded-xl border border-white/[0.04] space-y-1.5 font-mono text-[10px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Active Trading Capital:</span>
                            <span>${activeTradingBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#FF6B6B]">
                            <span>Deduct to Savings:</span>
                            <span>-${parseFloat(vaultActionAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#00D09C] font-bold pt-1 border-t border-white/[0.03]">
                            <span>Remaining Active Pool:</span>
                            <span>${(activeTradingBalance - parseFloat(vaultActionAmount)).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          const amt = parseFloat(vaultActionAmount);
                          if (isNaN(amt) || amt <= 0) {
                            showNotification("Please enter a valid deposit amount.");
                            return;
                          }
                          const activeCap = activeTradingBalance;
                          if (amt > activeCap) {
                            showNotification("Insufficient active capital available for deposit.");
                            return;
                          }
                          const nextBal = vaultBalance + amt;
                          updateVaultBalance(nextBal);
                          const nextOffset = activeBalanceOffset - amt;
                          updateActiveBalanceOffset(nextOffset);
                          showNotification(`Successfully protected $${amt.toLocaleString()} inside Vault.`);
                          setVaultActionType(null);
                          setVaultActionAmount('');
                          setVaultGoalName('');
                        }}
                        className="w-full bg-[#00D09C] hover:bg-[#00b084] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-[44px] shadow-md text-center"
                      >
                        Confirm Safe Deposit
                      </button>
                    </div>
                  )}

                  {/* WITHDRAW FORM PANEL */}
                  {vaultState === 'unlocked' && vaultActionType === 'withdraw' && (
                    <div className="space-y-4 font-medium text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                        <span className="text-white font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-amber-400">
                          <ArrowDownRight className="w-4 h-4" />
                          Withdraw Savings to Active Pool
                        </span>
                        <button 
                          onClick={() => setVaultActionType(null)}
                          className="text-slate-400 hover:text-white text-[10px] font-bold"
                        >
                          Back
                        </button>
                      </div>

                      {/* Select Asset */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Select Asset to Unlock</label>
                        <div className="grid grid-cols-3 gap-1.5 font-mono">
                          {['BTC', 'ETH', 'USDC'].map(a => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setVaultActionAsset(a)}
                              className={`py-2 border rounded-xl text-xs font-bold cursor-pointer transition-all ${vaultActionAsset === a ? 'bg-[#00D09C]/10 border-[#00D09C]/30 text-[#00D09C]' : 'bg-[#080B11]/40 border-white/[0.04] text-slate-400'}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Field */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                          <span>Amount to Unlock (USD)</span>
                          <span className="font-mono">Vault Max: ${vaultBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={vaultActionAmount}
                            onChange={(e) => setVaultActionAmount(e.target.value)}
                            className="w-full bg-[#080B11]/50 border border-white/[0.05] rounded-xl p-3 text-white outline-none font-semibold text-sm focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]/20 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setVaultActionAmount(vaultBalance.toString())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-[#00D09C]/10 text-[#00D09C] px-2 py-1 rounded-md uppercase cursor-pointer"
                          >
                            100% MAX
                          </button>
                        </div>
                      </div>

                      {/* Math Preview */}
                      {vaultActionAmount && !isNaN(parseFloat(vaultActionAmount)) && (
                        <div className="bg-[#080B11]/70 p-3 rounded-xl border border-white/[0.04] space-y-1.5 font-mono text-[10px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Vault Balance:</span>
                            <span>${vaultBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#FF6B6B]">
                            <span>Deduct Savings:</span>
                            <span>-${parseFloat(vaultActionAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#00D09C] font-bold pt-1 border-t border-white/[0.03]">
                            <span>Restored Active Pool:</span>
                            <span>+${(activeTradingBalance + parseFloat(vaultActionAmount)).toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          const amt = parseFloat(vaultActionAmount);
                          if (isNaN(amt) || amt <= 0) {
                            showNotification("Please enter a valid withdrawal amount.");
                            return;
                          }
                          if (amt > vaultBalance) {
                            showNotification("Withdrawal exceeds current protected savings balance.");
                            return;
                          }
                          const nextBal = vaultBalance - amt;
                          updateVaultBalance(nextBal);
                          const nextOffset = activeBalanceOffset + amt;
                          updateActiveBalanceOffset(nextOffset);
                          showNotification(`Successfully unlocked $${amt.toLocaleString()} back to Active Pool.`);
                          setVaultActionType(null);
                          setVaultActionAmount('');
                        }}
                        className="w-full bg-[#00D09C] hover:bg-[#00b084] text-black font-semibold py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer touch-manipulation min-h-[44px] shadow-md text-center"
                      >
                        Confirm Withdrawal
                      </button>
                    </div>
                  )}

                </div>
              )}

              <button 
                onClick={() => {
                  setActiveDialog(null);
                  setVaultState('closed');
                  setVaultActionType(null);
                  setShowWithdrawPasscodeVerify(false);
                }}
                className="w-full py-2.5 bg-[#080B11]/80 hover:bg-black/40 border border-white/[0.05] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer touch-manipulation min-h-[44px]"
              >
                Close Secure Panel
              </button>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </motion.div>
    )}
    </AnimatePresence>
  );
}
