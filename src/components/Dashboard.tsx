import React, { useState, useContext, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  Brain, Activity, Star, Newspaper, Zap, ArrowRightLeft, 
  Copy, History, CreditCard, ChevronRight, Bell, X, ShieldCheck,
  Award, AlertCircle, CheckCircle2, Lock, Flame
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import CoinLogo from './CoinLogo';
import ProfileView from './ProfileView';
import MarketsPage from './MarketsPage';
import DiscoverView from './DiscoverView';
import CoinDetailsPage from './CoinDetailsPage';
import PortfolioViewV2 from './portfolio_v2/PortfolioViewV2';
import AiTradingModule from './AiTradingModule';
import CopyTrading from './CopyTrading/CopyTrading';

import { NotificationCenter } from './NotificationCenter';
import EventsPromosPage from './EventsPromosPage';
import SupportCenterPage from './SupportCenterPage';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import UserAvatar from './UserAvatar';
import AverLogo from './AverLogo';
import { DashboardIcon, WalletIcon, TradesIcon, AnalyticsIcon } from './CustomIcons';
import { TradingEngineContext } from '../contexts/TradingEngineContext';









import { useFinancials } from '../hooks/useFinancials';
import { safeStorage } from '../utils/storage';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService, WalletData } from '../services/walletService';

export default function Dashboard({ theme, onNavigate }: { theme: 'light' | 'dark', onNavigate: (view: 'referral-centre' | 'preferences' | 'bonus-center' | 'market-highlights' | 'events-promos') => void }) {
  const { user, loading: authLoading, notifications, addDeposit, addWithdrawal, clearNotifications } = useAuth();
  const { preferences, t, formatCurrency } = usePreferences();
  const { activity, trades, liveTradePrices, session } = useContext(TradingEngineContext);
  const isDark = preferences.theme === 'dark';
  
  const enrichedActiveTrades = useMemo(() => trades.filter(t => t.status === 'OPEN').map(trade => {
    const livePrice = liveTradePrices[trade.id] || trade.currentPrice || trade.entry;
    return { ...trade, pnl: (livePrice - trade.entry) * trade.quantity };
  }), [trades, liveTradePrices]);

  const totalFloatingPnl = useMemo(() => enrichedActiveTrades.reduce((sum, t) => sum + (t.pnl || 0), 0), [enrichedActiveTrades]);

  const [activeTab, setActiveTab] = useState(() => {
    return safeStorage.getItem('aver_dashboard_tab') || 'home';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [portfolioViewMode, setPortfolioViewMode] = useState<any>('overview');

  React.useEffect(() => {
    const checkTab = () => {
      const savedTab = safeStorage.getItem('aver_dashboard_tab');
      if (savedTab) {
        setActiveTab(savedTab);
        safeStorage.removeItem('aver_dashboard_tab');
      }
    };
    checkTab();
    const interval = setInterval(checkTab, 500);
    return () => clearInterval(interval);
  }, []);
  const watchlist = useMemo(() => {
    if (user?.holdings && user.holdings.length > 0) {
      return user.holdings.map((h: any) => {
        const livePrice = liveTradePrices[h.ticker || h.symbol] || h.currentPrice || h.price || 0;
        const change = h.change || 0;
        return {
          symbol: h.ticker || h.symbol,
          price: livePrice,
          change: (change >= 0 ? '+' : '') + change.toFixed(2) + '%',
          isPositive: change >= 0
        };
      });
    }
    return [
      { symbol: 'BTC', price: 64230, change: '+2.45%', isPositive: true },
      { symbol: 'ETH', price: 3450, change: '+1.82%', isPositive: true },
      { symbol: 'SOL', price: 145, change: '-0.52%', isPositive: false }
    ];
  }, [user?.holdings, liveTradePrices]);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab);
    safeStorage.setItem('aver_dashboard_tab', tab);
  }, []);

  const handleViewModeChange = useCallback((mode: any) => {
    setPortfolioViewMode(mode);
  }, []);

  const [selectedAsset, setSelectedAsset] = useState('BTC');

  const [marketData, setMarketData] = useState<any[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState('');
  const [aiSignals, setAiSignals] = useState<any[]>([]);

  const fetchMarketData = async () => {
    try {
      setMarketLoading(true);
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22ADAUSDT%22,%22XRPUSDT%22,%22SOLUSDT%22,%22DOGEUSDT%22,%22AVAXUSDT%22,%22LINKUSDT%22%5D');
      if (!res.ok) throw new Error('Failed to fetch market data');
      const data = await res.json();
      const mapped = data.map((d: any) => {
        const symbol = d.symbol.replace('USDT', '');
        const isPositive = parseFloat(d.priceChangePercent) >= 0;
        return {
          symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol === 'ADA' ? 'Cardano' : symbol === 'XRP' ? 'Ripple' : symbol === 'SOL' ? 'Solana' : symbol === 'DOGE' ? 'Dogecoin' : symbol === 'AVAX' ? 'Avalanche' : 'Chainlink',
          price: parseFloat(d.lastPrice),
          change: (isPositive ? '+' : '') + parseFloat(d.priceChangePercent).toFixed(2) + '%',
          isPositive
        };
      });
      setMarketData(mapped);
    } catch (err) {
      console.warn("Market data fetch warning:", err);
      // Fallback to mock data if fetch fails
      setMarketData([
        { symbol: 'BTC', name: 'Bitcoin', price: 65000, change: '+1.2%', isPositive: true },
        { symbol: 'ETH', name: 'Ethereum', price: 3500, change: '-0.5%', isPositive: false },
        { symbol: 'SOL', name: 'Solana', price: 145, change: '+3.1%', isPositive: true },
      ]);
    } finally {
      setMarketLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      setNewsError('');
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss');
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      if (data.items) {
        setNews(data.items.slice(0, 4).map((item: any) => {
           const diffMs = Date.now() - new Date(item.pubDate).getTime();
           const hours = Math.floor(diffMs / 3600000);
           const time = hours > 0 ? `${hours}h ago` : 'Just now';
           return {
             headline: item.title,
             source: item.author || 'Cointelegraph',
             time,
             link: item.link
           };
        }));
      }
    } catch (err) {
      console.error("News fetch error:", err);
      setNewsError('Failed to load news');
    } finally {
      setNewsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMarketData();
    fetchNews();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const [walletData, setWalletData] = useState<WalletData | null>(null);

  React.useEffect(() => {
    if (user?.uid) {
      portfolioPersistenceService.getPortfolioCurrent(user.uid).then(pState => {
        console.log("[Dashboard] Hydrated state from portfolioPersistenceService:", pState?.lastUpdated);
      });

      const unsubWallet = walletService.subscribeWallet(user.uid, (wDoc) => {
        if (wDoc) {
          setWalletData(prev => {
            if (
              prev &&
              prev.portfolioBalance === wDoc.portfolioBalance &&
              prev.availableBalance === wDoc.availableBalance &&
              prev.vaultBalance === wDoc.vaultBalance &&
              prev.aiTradingCapital === wDoc.aiTradingCapital &&
              prev.portfolioValue === wDoc.portfolioValue
            ) {
              return prev;
            }
            return wDoc;
          });
        }
      });

      return () => unsubWallet();
    }
  }, [user?.uid]);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showEventsPromosModal, setShowEventsPromosModal] = useState(false);
  const [showSupportCenterModal, setShowSupportCenterModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [amount, setAmount] = useState('');
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Fallback defaults if user profile isn't fully loaded or is null
  const { totalNetBalance, activeTradingBalance, aiTradingCapital, homeNetBalance } = useFinancials();
  
  // Active AI Session Profit/Loss
  const activeSessionPnL = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      const closedSessionPnL = (session.tradingCapital || 0) - (session.initialCapital || 0);
      return closedSessionPnL + totalFloatingPnl;
    }
    return 0;
  }, [session, totalFloatingPnl]);

  const closedTradesPnL = useMemo(() => {
    // Prioritize synchronized Firestore data for absolute persistence across sessions
    if (user?.portfolio?.todayPnL !== undefined) {
      return user.portfolio.todayPnL;
    }
    
    // Fallback to trades array if available
    const fromTrades = trades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.pnl || 0), 0);
    if (fromTrades !== 0) return fromTrades;
    
    if (user?.totalProfit !== undefined || user?.totalLoss !== undefined) {
      return (user?.totalProfit || 0) - (user?.totalLoss || 0);
    }
    return 0;
  }, [trades, user]);

  // Net value displayed on Home Net Balance card (represents available money, decreases immediately on session start by active trading capital)
  const totalValue = useMemo(() => {
    return homeNetBalance;
  }, [homeNetBalance]);

  // Account baseline before session allocation deduction
  const baselineAccountBalance = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      return totalValue + session.initialCapital;
    }
    // Inactive session: baseline is the current totalValue minus the trading profit
    const computedBase = totalValue - (closedTradesPnL + totalFloatingPnl);
    return computedBase > 0 ? computedBase : 1000;
  }, [session, totalValue, closedTradesPnL, totalFloatingPnl]);

  // Total PnL dollar change for performance indicator beneath Net Balance
  // Immediately reflects the negative deduction on launch (-session.initialCapital) and continues updating dynamically with session PnL
  const totalPlAmount = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      return -session.initialCapital;
    }
    return closedTradesPnL + totalFloatingPnl;
  }, [session, closedTradesPnL, totalFloatingPnl]);

  // Performance indicator percentage beneath Net Balance
  const totalPlPercent = useMemo(() => {
    return (totalPlAmount / (baselineAccountBalance || 1)) * 100;
  }, [totalPlAmount, baselineAccountBalance]);

  // Overall Return Amount & Overall Return %
  const overallReturnAmount = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      return -session.initialCapital;
    }
    if (user?.portfolio?.overallReturn !== undefined) {
      return user.portfolio.overallReturn;
    }
    const fromTrades = trades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.pnl || 0), 0);
    if (fromTrades !== 0) return fromTrades;
    return (user?.totalProfit || 0) - (user?.totalLoss || 0);
  }, [session, user, trades]);

  const overallReturnPercent = useMemo(() => {
    return (overallReturnAmount / (baselineAccountBalance || 100000)) * 100;
  }, [overallReturnAmount, baselineAccountBalance]);

  const totalValueFormatted = formatCurrency(totalValue);
  const todayPnLFormatted = (totalPlAmount >= 0 ? '+' : '') + formatCurrency(totalPlAmount);
  const todayPnLPercentFormatted = (totalPlPercent >= 0 ? '+' : '') + totalPlPercent.toFixed(2) + '%';
  const overallReturnFormatted = (overallReturnPercent >= 0 ? '+' : '') + overallReturnPercent.toFixed(2) + '%';

  const referralCount = user?.referralCount || 0;
  const completedAiTrades = trades.length || 0;
  
  const loginStreak = useMemo(() => {
    const activityDates = activity.map((h: any) => new Date(h.timestamp).toDateString());
    const uniqueDates = Array.from(new Set(activityDates)) as string[];
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= i + 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [activity]);
  
  const profitableDays = useMemo(() => {
    const profitByDate = trades.reduce((acc: Record<string, number>, t) => {
        if (t.pnl === undefined) return acc;
        const date = new Date(t.timestamp).toDateString();
        acc[date] = (acc[date] || 0) + t.pnl;
        return acc;
    }, {});
    
    return Object.values(profitByDate).filter((pnl: unknown) => (pnl as number) > 0).length;
  }, [trades]);

  const totalXp = (referralCount * 250) + (completedAiTrades * 120) + (trades.length || 0) * 80 + (profitableDays * 150) + (loginStreak * 75) + ((user?.totalDeposits || 0) * 0.1);
  const xpPerLevel = 1000;
  const currentLevel = Math.floor(totalXp / xpPerLevel) + 1;
  const currentXp = totalXp % xpPerLevel;
  const xpProgressPercent = Math.min(100, Math.round((currentXp / xpPerLevel) * 100));

  const badges = [
    { name: 'Pioneer', unlocked: true, icon: '🚀', desc: 'Aver platform voyager' },
    { name: 'AI Pilot', unlocked: completedAiTrades > 0, icon: '🤖', desc: 'Executed AI trade' },
    { name: 'Alpha', unlocked: referralCount > 0, icon: '👑', desc: 'Referred active user' },
    { name: 'VIP Vault', unlocked: (Number(user?.totalDeposits) || 0) > 1000, icon: '💎', desc: 'Deposited over $1,000' }
  ];
  
  // HELPER METHODS FOR ACCOUNT ACTIVITY AND SMART ASSISTANT
  const getRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60000) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diffMs / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diffMs / 86400000);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getActivitiesList = () => {
    if (!activity || activity.length === 0) return [];

    const list: any[] = [];

    activity.forEach((act: any) => {
      if (!act) return;
      const dateObj = act.timestamp ? (act.timestamp.toDate ? act.timestamp.toDate() : new Date(act.timestamp)) : new Date();
      if (isNaN(dateObj.getTime())) return;
      
      let mappedType = act.type || 'system';
      let mappedTitle = 'Activity Logged';
      let mappedCategory = 'system';

      if (act.type === 'deposit' || act.type?.includes('DEPOSIT')) {
        mappedTitle = 'Deposit Confirmed';
        mappedType = 'deposit';
        mappedCategory = 'financial';
      } else if (act.type === 'withdrawal' || act.type?.includes('WITHDRAWAL')) {
        mappedTitle = 'Withdrawal Approved';
        mappedType = 'withdrawal';
        mappedCategory = 'financial';
      } else if (act.type === 'CONFIG_UPDATED') {
        mappedTitle = 'Configuration Saved';
        mappedType = 'config';
        mappedCategory = 'security';
      } else if (act.type === 'SESSION_STARTED') {
        mappedTitle = 'AI Engine Started';
        mappedType = 'session-start';
        mappedCategory = 'trading';
      } else if (act.type === 'SESSION_ENDED') {
        mappedTitle = 'AI Engine Paused';
        mappedType = 'session-end';
        mappedCategory = 'trading';
      } else if (act.type === 'TRADE_OPENED') {
        mappedTitle = 'Trade Executed';
        mappedType = 'trade-open';
        mappedCategory = 'trading';
      } else if (act.type === 'TRADE_CLOSED') {
        mappedTitle = 'Trade Closed';
        mappedType = 'trade-close';
        mappedCategory = 'trading';
      } else if (act.type === 'TP_HIT') {
        mappedTitle = 'Take Profit Executed';
        mappedType = 'tp-hit';
        mappedCategory = 'trading';
      } else if (act.type === 'SL_HIT') {
        mappedTitle = 'Stop Loss Triggered';
        mappedType = 'sl-hit';
        mappedCategory = 'trading';
      } else if (act.type === 'REBALANCE') {
        mappedTitle = 'Portfolio Rebalanced';
        mappedType = 'rebalance';
        mappedCategory = 'trading';
      } else if (act.type === 'COPY_TRADE') {
        mappedTitle = 'Copy Trade Executed';
        mappedType = 'copy-trade';
        mappedCategory = 'trading';
      }

      list.push({
        id: act.id,
        type: mappedType,
        title: mappedTitle,
        description: act.message,
        timestamp: dateObj,
        category: mappedCategory
      });
    });

    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return list;
  };

  const getAssistantWarnings = () => {
    const warnings: any[] = [];

    // 1. Identity verification incomplete
    if (!user?.kycStatus || user.kycStatus === 'unverified') {
      warnings.push({
        id: 'kyc',
        title: 'Identity Verification Incomplete',
        description: 'Complete your tier-1 verification to unlock unlimited asset trades and premium withdrawals.',
        actionText: 'Verify Identity',
        actionType: 'prop',
        actionName: 'bonus-center'
      });
    }

    // 2. Biometric protection disabled
    if (!user?.biometricEnabled) {
      warnings.push({
        id: 'biometric',
        title: 'Biometric Access Disabled',
        description: 'Enhance your security level by configuring Touch ID / Face ID biometric login.',
        actionText: 'Configure Security',
        actionType: 'tab',
        targetTab: 'profile'
      });
    }

    // 3. AI copilot inactive
    if (!user?.aiTradingEnabled) {
      warnings.push({
        id: 'copilot',
        title: 'Autonomous AI Copilot Inactive',
        description: 'Your neural automation suite is currently offline. Toggle on AI trading to scan markets.',
        actionText: 'Activate Copilot',
        actionType: 'tab',
        targetTab: 'ai'
      });
    }

    // 4. Referral rewards claimable
    if (user?.referralCount && user.referralCount > 0) {
      warnings.push({
        id: 'referral',
        title: 'Referral Rewards Claimable',
        description: 'You have active referrals awaiting collection! Claim your XP and bonuses at the Centre.',
        actionText: 'Claim Rewards',
        actionType: 'prop',
        actionName: 'referral-centre'
      });
    }

    return warnings;
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setTxError('Please enter a valid positive deposit amount.');
      return;
    }
    setTxLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      await addDeposit(value);
      setTxSuccess(`Success! Deposited $${value.toLocaleString()} to your wallet.`);
      setAmount('');
      setTimeout(() => {
        setShowDepositModal(false);
        setTxSuccess('');
      }, 1500);
    } catch (err: any) {
      setTxError(err.message || 'Deposit failed. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setTxError('Please enter a valid positive withdrawal amount.');
      return;
    }
    setTxLoading(true);
    setTxError('');
    setTxSuccess('');
    try {
      await addWithdrawal(value);
      setTxSuccess(`Success! Withdrew $${value.toLocaleString()} from your wallet.`);
      setAmount('');
      setTimeout(() => {
        setShowWithdrawModal(false);
        setTxSuccess('');
      }, 1500);
    } catch (err: any) {
      setTxError(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    await clearNotifications();
  };

  const containerClasses = isDark 
    ? "bg-black text-white" 
    : "bg-slate-50 text-slate-900";

  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  const modalBgClasses = isDark
    ? "bg-black border border-white/10 shadow-2xl"
    : "bg-white border border-slate-200 shadow-2xl";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className={`min-h-screen flex flex-col ${containerClasses} transition-colors duration-500 overflow-x-hidden font-sans`}>
      
      {/* Animated subtle background gradients */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[100px] rounded-full" />
        </div>
      )}

      {/* Desktop Left Sidebar Navigation */}
      {!isFullScreen && (
        <aside className={`fixed inset-y-0 left-0 w-64 hidden lg:flex flex-col z-30 border-r ${isDark ? 'bg-slate-950/45 border-white/5 backdrop-blur-xl' : 'bg-white/75 border-slate-200/50 backdrop-blur-xl'} transition-colors duration-500`}>
        {/* Sidebar Header with branding */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <AverLogo theme={theme} size={28} showText={true} />
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { name: t('common.home') || 'Dashboard', id: 'home', icon: DashboardIcon },
            { name: 'Copy Trading', id: 'copy-trading', icon: Copy },
            { name: t('common.portfolio') || 'Wallet', id: 'portfolio', icon: WalletIcon },
            { name: t('common.market') || 'Trades', id: 'markets', icon: TradesIcon },
            { name: t('common.discover') || 'Analytics', id: 'discover', icon: AnalyticsIcon },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                    : `${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'} border border-transparent`
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile section at the bottom of sidebar */}
        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-slate-200/50'} flex items-center justify-between`}>
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <UserAvatar user={user} sizeClass="w-full h-full" isDark={isDark} />
            </div>
            <div className="truncate max-w-[120px]">
              <p className={`text-xs font-bold ${textPrimary} truncate`}>
                {user?.username || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-emerald-500 font-medium">Pro Account</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('preferences')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${textSecondary}`}>
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </aside>
      )}

      {/* Main content shifted left margin on desktop */}
      <div className={`${isFullScreen ? '' : 'lg:pl-64'} flex-1 flex flex-col`}>
        <div className={`relative z-10 flex-1 flex flex-col p-0 sm:p-0 ${isFullScreen ? 'w-full max-w-none m-0' : 'lg:max-w-none lg:mx-0'} pt-safe ${activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'portfolio' && activeTab !== 'ai' ? 'pt-[50px]' : ''} ${!isFullScreen && (activeTab === 'home' || activeTab === 'profile' || activeTab === 'discover') ? 'p-4 sm:p-6 lg:max-w-5xl lg:mx-auto' : ''}`}>
          
          {activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'portfolio' && activeTab !== 'ai' && (
            <header className={`fixed top-0 left-0 lg:left-64 right-0 h-[50px] flex justify-between items-center px-4 lg:px-8 z-40 ${isDark ? 'bg-black/80 backdrop-blur-md border-b border-white/5' : 'bg-slate-50/80 backdrop-blur-md border-b border-slate-200'}`}>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-[1.5px] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer animate-in fade-in zoom-in duration-300"
              >
                <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
                  {authLoading ? (
                    <div className="w-full h-full animate-pulse bg-slate-700" />
                  ) : (
                    <UserAvatar user={user} sizeClass="w-full h-full" isDark={isDark} />
                  )}
                </div>
              </button>
              <div>
                {authLoading ? (
                  <div className="w-20 h-4 rounded animate-pulse bg-slate-700" />
                ) : (
                  <h1 className={`text-sm font-bold tracking-tight ${textPrimary}`}>
                    {user?.username || user?.email?.split('@')[0] || 'User'}
                  </h1>
                )}
              </div>
            </div>

            {/* Center High-Frequency Unrealized P/L Counter */}
            <div id="header-unrealized-pl-wrapper" className="flex items-center justify-center">
            </div>
            
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer relative ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
            >
              <Bell className={`w-4 h-4 ${textPrimary}`} />
              {notifications && notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white ring-2 ring-slate-950">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </header>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="space-y-6"
            >
              
              {/* Section 1: Portfolio Card */}
              <motion.div variants={itemVariants} className={`rounded-[24px] p-6 relative overflow-hidden ${cardClasses}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full" />
                
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>Net Balance</p>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${textPrimary} mb-4`}>
                  {totalValueFormatted}
                </h2>
                
                <div className="flex items-center space-x-3 mb-6">
                  <div 
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border"
                    style={{
                      backgroundColor: totalPlAmount >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: totalPlAmount >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: totalPlAmount >= 0 ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {totalPlAmount >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-black">{todayPnLFormatted}</span>
                    <span className="text-xs font-bold opacity-90">({todayPnLPercentFormatted})</span>
                  </div>
                  <div className={`text-xs font-semibold ${textSecondary}`}>
                    Overall: <span className="font-bold" style={{ color: overallReturnPercent >= 0 ? '#22c55e' : '#ef4444' }}>{overallReturnFormatted}</span>
                  </div>
                </div>

                {session?.status === 'ACTIVE' && (
                  <div className="mb-6 -mt-3 flex items-start space-x-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-snug font-medium text-amber-500/90">
                      <strong>AI Session Active:</strong> ${session.initialCapital.toLocaleString()} has been temporarily allocated to active Trading Capital, reducing your available balance. Your total net asset value is fully preserved in your Portfolio.
                    </p>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => {
                      setAmount('');
                      setTxError('');
                      setTxSuccess('');
                      setShowDepositModal(true);
                    }}
                    className="flex-1 max-w-[140px] flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:border-emerald-500/50 active:scale-95 shadow-lg cursor-pointer"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/3050/3050249.png" alt="Deposit" className="w-6 h-6 mb-2 invert" />
                    <span>Deposit</span>
                  </button>
                  <button 
                    onClick={() => {
                      setAmount('');
                      setTxError('');
                      setTxSuccess('');
                      setShowWithdrawModal(true);
                    }}
                    className="flex-1 max-w-[140px] flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 text-white font-bold text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:border-emerald-500/50 active:scale-95 shadow-lg cursor-pointer"
                  >
                    <img src="https://cdn-icons-png.flaticon.com/512/3050/3050250.png" alt="Withdraw" className="w-6 h-6 mb-2 invert" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </motion.div>


              <div className="space-y-6">
                  {/* Smart Account Assistant Widget */}
                  {(() => {
                    const warnings = getAssistantWarnings();
                    if (warnings.length === 0) return null;
                    const warning = warnings[0]; // Display highest priority warning
                    return (
                      <motion.div 
                        variants={itemVariants}
                        className={`rounded-[24px] p-5 relative overflow-hidden border ${
                          isDark 
                            ? 'bg-amber-500/10 border-amber-500/30' 
                            : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className={`text-sm font-black tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                              {warning.title}
                            </h4>
                            <p className={`text-xs mt-1.5 font-medium leading-relaxed ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>
                              {warning.description}
                            </p>
                            <button 
                              onClick={() => {
                                if (warning.actionType === 'tab') {
                                  setActiveTab(warning.targetTab);
                                } else if (warning.actionType === 'prop') {
                                  onNavigate(warning.actionName);
                                }
                              }}
                              className={`mt-4 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer ${
                                isDark 
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            >
                              {warning.actionText}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Account Activity Timeline Widget */}
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-end mb-3">
                      <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary} flex items-center gap-1.5`}>
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Account Timeline
                      </h3>
                    </div>

                    <div className={`rounded-[24px] p-5 space-y-4 ${cardClasses} max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2`}>
                      {getActivitiesList().length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-500">
                          No recent account activities.
                        </div>
                      ) : (
                        <div className="relative border-l border-white/5 ml-3 pl-5 space-y-5">
                          {getActivitiesList().map((item, i) => {
                            let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                            if (item.type === 'deposit') icon = <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
                            if (item.type === 'withdrawal') icon = <ArrowUpRight className="w-4 h-4 text-rose-400" />;
                            if (item.category === 'trading') icon = <Brain className="w-4 h-4 text-blue-400" />;
                            if (item.category === 'referral') icon = <Award className="w-4 h-4 text-purple-400" />;
                            if (item.category === 'security') icon = <ShieldCheck className="w-4 h-4 text-amber-400" />;

                            return (
                              <div key={`${item.id}-${i}`} className="relative">
                                <div className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full flex items-center justify-center border ${
                                  isDark ? 'bg-[#08090e] border-white/10' : 'bg-white border-slate-200'
                                }`}>
                                  {icon}
                                </div>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className={`text-xs font-bold tracking-tight ${textPrimary}`}>{item.title}</h5>
                                    <p className={`text-[11px] mt-0.5 leading-normal ${textSecondary}`}>{item.description}</p>
                                  </div>
                                  <span className="text-[9px] font-medium text-gray-500 whitespace-nowrap ml-2">
                                    {getRelativeTime(item.timestamp)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Achievement & Progress Widget */}
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex justify-between items-end mb-1">
                      <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary} flex items-center gap-1.5`}>
                        <Award className="w-4 h-4 text-amber-500" />
                        Level & Milestones
                      </h3>
                    </div>

                    <div className={`rounded-[24px] p-5 ${cardClasses} space-y-4`}>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <div>
                            <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">Trading Rank</span>
                            <h4 className={`text-lg font-black tracking-tight ${textPrimary}`}>Level {currentLevel}</h4>
                          </div>
                          <span className={`text-xs font-bold ${textSecondary}`}>{currentXp} / 1000 XP</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgressPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1 animate-pulse" />
                          <p className={`text-[10px] font-bold ${textSecondary}`}>Streak</p>
                          <p className={`text-xs font-black ${textPrimary} mt-0.5`}>{loginStreak} Days</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                          <p className={`text-[10px] font-bold ${textSecondary}`}>Win Run</p>
                          <p className={`text-xs font-black ${textPrimary} mt-0.5`}>{profitableDays}</p>
                        </div>
                        <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                          <Brain className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                          <p className={`text-[10px] font-bold ${textSecondary}`}>AI Trades</p>
                          <p className={`text-xs font-black ${textPrimary} mt-0.5`}>{completedAiTrades}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Unlocked Insignias</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {badges.map((badge, i) => (
                            <div 
                              key={`badge-${badge.name}-${i}`} 
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border whitespace-nowrap ${
                                badge.unlocked 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : 'bg-white/[0.01] border-white/5 text-gray-600 opacity-40'
                              }`}
                              title={badge.desc}
                            >
                              <span className="text-xs">{badge.icon}</span>
                              <span className="text-[10px] font-bold tracking-tight">{badge.name}</span>
                              {!badge.unlocked && <Lock className="w-2.5 h-2.5" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>

            </motion.div>
          )}

          {activeTab === 'copy-trading' && <CopyTrading theme={theme} />}

          {activeTab === 'portfolio' && (
            <PortfolioViewV2 
              theme={theme} 
              onBack={() => setActiveTab('home')} 
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
              onViewModeChange={setPortfolioViewMode}
            />
          )}

          {activeTab === 'markets' && <MarketsPage theme={theme} onSelectAsset={(asset) => { setSelectedAsset(asset); setActiveTab('coin-details'); }} />}
          {activeTab === 'coin-details' && selectedAsset && <CoinDetailsPage asset={selectedAsset} theme={theme} onBack={() => setActiveTab('markets')} />}
          {activeTab === 'discover' && <DiscoverView theme={theme} onOpenMarketHighlights={() => onNavigate('market-highlights')} onOpenEventsPromos={() => setActiveTab('events')} onOpenSupportCenter={() => setActiveTab('support')} />}
          {activeTab === 'ai' && <AiTradingModule theme={theme} onOpenDeposit={() => { setActiveTab('home'); setShowDepositModal(true); }} />}
          {activeTab === 'profile' && <ProfileView theme={theme} onOpenBonusCenter={() => onNavigate('bonus-center')} onOpenReferralCentre={() => onNavigate('referral-centre')} onOpenPreferences={() => onNavigate('preferences')} />}
          
          {activeTab === 'events' && <EventsPromosPage theme={theme} onBack={() => setActiveTab('discover')} />}
          {activeTab === 'support' && <SupportCenterPage theme={theme} onBack={() => setActiveTab('discover')} />}
          
          {activeTab !== 'home' && activeTab !== 'copy-trading' && activeTab !== 'portfolio' && activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'discover' && activeTab !== 'ai' && activeTab !== 'profile' && activeTab !== 'events' && activeTab !== 'support' && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-10 text-center"
            >
              <h1 className={`text-2xl font-bold ${textPrimary} mb-4 capitalize`}>{activeTab}</h1>
              <div className={`rounded-2xl p-10 flex flex-col items-center justify-center ${cardClasses}`}>
                <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  {activeTab === 'markets' && <Activity className={`w-8 h-8 ${textSecondary}`} />}
                  {activeTab === 'ai' && <Brain className={`w-8 h-8 ${textSecondary}`} />}
                </div>
                <p className={`${textSecondary} font-medium`}>
                  {activeTab} module is coming soon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
      
      {/* Persistent Bottom Navigation - Conditional Rendering */}
      {!isFullScreen && activeTab !== 'coin-details' && !(activeTab === 'portfolio' && (portfolioViewMode === 'vault' || portfolioViewMode === 'asset-stats')) && (
        <>
          <div className="h-32 flex-shrink-0 lg:hidden" aria-hidden="true" />
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}

      {/* --- SLEEK FLOATING MODALS (SATISFIES ALL REQUIREMENTS FOR PERSISTENCE TESTABILITY) --- */}

      {/* 1. DEPOSIT MODAL */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-[28px] p-6 ${modalBgClasses}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>{t('common.deposit')}</h3>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className={`p-1.5 rounded-full hover:bg-white/5 ${textSecondary} cursor-pointer`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">{t('common.amount_deposit')}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input 
                      type="number"
                      required
                      min="10"
                      step="any"
                      placeholder="5,000.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>

                {txError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-sans font-medium text-center">
                    {txError}
                  </div>
                )}

                {txSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-sans font-medium text-center">
                    {txSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={txLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {txLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('common.confirm_deposit')}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-[28px] p-6 ${modalBgClasses}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>{t('common.withdrawal')}</h3>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className={`p-1.5 rounded-full hover:bg-white/5 ${textSecondary} cursor-pointer`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">{t('common.amount_withdrawal')}</label>
                    <span className="text-[10px] text-gray-500 font-semibold font-mono">Max: {totalValueFormatted}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input 
                      type="number"
                      required
                      min="10"
                      step="any"
                      placeholder="2,500.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                </div>

                {txError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-sans font-medium text-center">
                    {txError}
                  </div>
                )}

                {txSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-sans font-medium text-center">
                    {txSuccess}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={txLoading}
                  className="w-full py-3.5 bg-[#ef4444] hover:bg-red-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                >
                  {txLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('common.confirm_withdrawal')}</span>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. TRANSACTION HISTORY MODAL */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-lg rounded-[28px] p-6 max-h-[80vh] flex flex-col ${modalBgClasses}`}
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className={`text-lg font-black tracking-tight ${textPrimary} flex items-center`}>
                  <History className="w-5 h-5 mr-2 text-emerald-500" />
                  Transaction History
                </h3>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className={`p-1.5 rounded-full hover:bg-white/5 ${textSecondary} cursor-pointer`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(!user?.history || user.history.length === 0) ? (
                  <div className="text-center py-12 text-gray-500 font-medium">
                    No transactions recorded.
                  </div>
                ) : (
                  user.history.map((hist, i) => (
                    <div 
                      key={`${hist.id}-${i}`} 
                      className={`p-4 rounded-xl flex items-center justify-between border ${
                        isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          hist.type === 'deposit' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {hist.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${textPrimary} capitalize`}>{hist.type}</p>
                          <p className={`text-[10px] ${textSecondary}`}>{hist.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${
                          hist.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {hist.type === 'deposit' ? '+' : '-'}{formatCurrency(hist.amount)}
                        </p>
                        <p className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider inline-block mt-1">
                          {hist.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. NOTIFICATIONS MODAL */}
      <AnimatePresence>
        {showNotificationsModal && (
          <NotificationCenter onClose={() => setShowNotificationsModal(false)} isDark={isDark} />
        )}
      </AnimatePresence>

    </div>
  );
}
