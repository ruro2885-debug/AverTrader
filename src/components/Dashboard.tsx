import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  Brain, Activity, Star, Newspaper, Zap, ArrowRightLeft, 
  Copy, History, CreditCard, ChevronRight, Bell, X, ShieldCheck 
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import CoinLogo from './CoinLogo';
import ProfileView from './ProfileView';
import MarketsPage from './MarketsPage';
import DiscoverView from './DiscoverView';
import CoinDetailsPage from './CoinDetailsPage';
import PortfolioViewV2 from './portfolio_v2/PortfolioViewV2';
import BonusCenter from './BonusCenter';
import AiTradingModule from './AiTradingModule';

import ReferralCentre from './ReferralCentre';
import Preferences from './Preferences';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import UserAvatar from './UserAvatar';
import AverLogo from './AverLogo';
import { DashboardIcon, WalletIcon, TradesIcon, AnalyticsIcon } from './CustomIcons';

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64230.00, change: '+2.4%', isPositive: true },
  { symbol: 'ETH', name: 'Ethereum', price: 3450.20, change: '+1.2%', isPositive: true },
  { symbol: 'SOL', name: 'Solana', price: 145.60, change: '-0.8%', isPositive: false },
  { symbol: 'BNB', name: 'BNB', price: 590.10, change: '+0.5%', isPositive: true },
  { symbol: 'XRP', name: 'Ripple', price: 0.58, change: '-1.2%', isPositive: false },
];

const aiSignals = [
  { asset: 'BTC', signal: 'Tactical Long Momentum', confidence: 94, risk: 'Medium', movement: 'Target $65,500 (H4 Breakout confirmation)' },
  { asset: 'ETH', signal: 'VWAP Mean Reversion (LONG)', confidence: 91, risk: 'Low', movement: 'Target midline $3,485 (Oversold standard deviation band)' },
];

const watchlist = [
  { symbol: 'AVR', name: 'Aver', price: 1.24, change: '+5.4%', isPositive: true },
  { symbol: 'ADA', name: 'Cardano', price: 0.45, change: '-2.1%', isPositive: false },
];

const news = [
  { headline: 'Bitcoin ETFs see record inflows as institutional adoption grows', source: 'Crypto News', time: '2h ago', sentiment: 'Positive' },
  { headline: 'Ethereum network upgrade successfully deployed on testnet', source: 'Tech Finance', time: '4h ago', sentiment: 'Positive' },
];

export default function Dashboard({ theme }: { theme: 'light' | 'dark' }) {
  const [activeTab, setActiveTab] = useState('home');
  const [portfolioViewMode, setPortfolioViewMode] = useState<'portfolio' | 'vault' | 'asset-stats'>('portfolio');
  const isFullScreen = activeTab === 'portfolio' && portfolioViewMode !== 'portfolio';

  React.useEffect(() => {
    setPortfolioViewMode('portfolio');
  }, [activeTab]);

  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const { user, notifications, loading: authLoading, addDeposit, addWithdrawal, clearNotifications } = useAuth();
  const { formatCurrency, t } = usePreferences();
  const isDark = theme === 'dark';

  // Interactive transaction state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [amount, setAmount] = useState('');
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // Fallback defaults if user profile isn't fully loaded or is null
  const totalValue = user?.portfolio?.totalValue ?? 124560.00;
  const todayPnL = user?.portfolio?.todayPnL ?? 1240.50;
  const todayPnLPercent = user?.portfolio?.todayPnLPercent ?? 1.01;
  const overallReturn = user?.portfolio?.overallReturn ?? 24.5;

  const totalValueFormatted = formatCurrency(totalValue);
  const todayPnLFormatted = (todayPnL >= 0 ? '+' : '') + formatCurrency(todayPnL);
  const todayPnLPercentFormatted = (todayPnLPercent >= 0 ? '+' : '') + todayPnLPercent.toFixed(2) + '%';
  const overallReturnFormatted = (overallReturn >= 0 ? '+' : '') + overallReturn.toFixed(1) + '%';

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
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
        <div className={`relative z-10 flex-1 flex flex-col p-0 sm:p-0 ${isFullScreen ? 'w-full max-w-none m-0' : 'lg:max-w-none lg:mx-0'} pt-safe ${activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'portfolio' && activeTab !== 'ai' ? 'pt-[60px]' : ''} ${!isFullScreen && (activeTab === 'home' || activeTab === 'profile' || activeTab === 'discover') ? 'p-4 sm:p-6 lg:max-w-5xl lg:mx-auto' : ''}`}>
          
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
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg ${todayPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {todayPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-bold">{todayPnLFormatted}</span>
                    <span className="text-xs font-medium">({todayPnLPercentFormatted})</span>
                  </div>
                  <div className={`text-xs font-medium ${textSecondary}`}>
                    Overall: <span className={`${overallReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>{overallReturnFormatted}</span>
                  </div>
                </div>

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

              {/* Section 3: AI Trading Signals */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-end mb-3">
                  <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                    <Brain className="w-5 h-5 mr-2 text-emerald-500" />
                    AI Trading Signals
                  </h3>
                  <button onClick={() => setActiveTab('ai')} className="text-xs font-bold text-[#00D09C] hover:text-emerald-400 flex items-center cursor-pointer">
                    Open Institutional Desk <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
                
                {aiSignals.map((signal, i) => (
                  <div key={i} className={`rounded-[20px] p-5 ${isDark ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900/40 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <CoinLogo symbol={signal.asset} size={36} />
                        <div>
                          <h4 className={`font-bold ${textPrimary}`}>{signal.asset} Tactical Allocation</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md mr-2">
                              {signal.signal}
                            </span>
                            <span className={`text-xs ${textSecondary}`}>{signal.confidence}% Confidence Index</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded border text-xs font-medium ${signal.risk === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : signal.risk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {signal.risk} Risk
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-xs ${textSecondary}`}>Dynamic Target Horizon</p>
                        <p className="text-sm font-bold text-emerald-500">{signal.movement}</p>
                      </div>
                      <button onClick={() => setActiveTab('ai')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                        View Analysis & Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 2: Market Overview */}
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-end mb-3">
                    <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                      <Activity className="w-5 h-5 mr-2 text-blue-500" />
                      {t('common.market')}
                    </h3>
                    <button className={`text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center`}>
                      More <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                  <div className={`rounded-[20px] overflow-hidden ${cardClasses}`}>
                    {marketData.map((coin, i) => (
                      <div key={coin.symbol} className={`flex items-center justify-between p-4 transition-colors ${i !== marketData.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center space-x-3 w-[40%]">
                          <CoinLogo symbol={coin.symbol} size={32} />
                          <div>
                            <p className={`font-bold text-sm ${textPrimary}`}>{coin.symbol}</p>
                            <p className={`text-xs ${textSecondary}`}>{coin.name}</p>
                          </div>
                        </div>
                        
                        {/* Mini Sparkline Chart */}
                        <div className="flex-1 px-4 hidden sm:block">
                          <svg className="w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path 
                              d={coin.isPositive 
                                ? "M0,25 C20,20 40,30 60,10 C80,5 90,15 100,5" 
                                : "M0,5 C20,10 40,0 60,20 C80,25 90,15 100,25"} 
                              fill="none" 
                              stroke={coin.isPositive ? "#10b981" : "#ef4444"} 
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path 
                              d={coin.isPositive 
                                ? "M0,25 C20,20 40,30 60,10 C80,5 90,15 100,5 L100,30 L0,30 Z" 
                                : "M0,5 C20,10 40,0 60,20 C80,25 90,15 100,25 L100,30 L0,30 Z"} 
                              fill={coin.isPositive ? "url(#gradient-positive)" : "url(#gradient-negative)"} 
                              className="opacity-20"
                            />
                            <defs>
                              <linearGradient id="gradient-positive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                              <linearGradient id="gradient-negative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        <div className="text-right w-[30%]">
                          <p className={`font-bold text-sm ${textPrimary}`}>{formatCurrency(coin.price)}</p>
                          <p className={`text-xs font-medium flex items-center justify-end mt-0.5 ${coin.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                            {coin.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="space-y-6">
                  {/* Section 4: Watchlist */}
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-end mb-3">
                      <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                        <Star className="w-5 h-5 mr-2 text-amber-500" />
                        Watchlist
                      </h3>
                    </div>
                    <div className={`rounded-[20px] overflow-hidden ${cardClasses}`}>
                      {watchlist.map((coin, i) => (
                        <div key={coin.symbol} className={`flex items-center justify-between p-4 ${i !== watchlist.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''}`}>
                          <div className="flex items-center space-x-3">
                            <CoinLogo symbol={coin.symbol} size={32} />
                            <div>
                              <p className={`font-bold text-sm ${textPrimary}`}>{coin.symbol}</p>
                              <div className="flex space-x-2 mt-1">
                                <span className={`text-[10px] font-medium ${textSecondary}`}>{formatCurrency(coin.price)}</span>
                                <span className={`text-[10px] font-medium ${coin.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{coin.change}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => alert('Simulated watchlist orders')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>Buy</button>
                            <button onClick={() => alert('Simulated watchlist orders')} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>Sell</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Section 5: Market News */}
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-end mb-3">
                      <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                        <Newspaper className="w-5 h-5 mr-2 text-indigo-500" />
                        Market News
                      </h3>
                    </div>
                    <div className={`rounded-[20px] overflow-hidden ${cardClasses} p-4 space-y-4`}>
                      {news.map((item, i) => (
                        <div key={i} className={`pb-4 ${i !== news.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : 'pb-0'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.sentiment}</span>
                            <span className={`text-[10px] ${textSecondary}`}>{item.time}</span>
                          </div>
                          <h4 className={`text-sm font-semibold leading-tight ${textPrimary} mb-2 line-clamp-2`}>{item.headline}</h4>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs ${textSecondary}`}>{item.source}</span>
                            <button className={`text-xs font-bold transition-colors cursor-pointer ${isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'}`}>
                              Read Article
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

            </motion.div>
          )}

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
          {activeTab === 'discover' && <DiscoverView theme={theme} />}
          {activeTab === 'ai' && <AiTradingModule theme={theme} />}
          {activeTab === 'profile' && <ProfileView theme={theme} onOpenBonusCenter={() => setActiveTab('bonus-center')} onOpenReferralCentre={() => setActiveTab('referral-centre')} onOpenPreferences={() => setActiveTab('preferences')} />}
          {activeTab === 'bonus-center' && (
            <BonusCenter 
              theme={theme} 
              onBack={() => setActiveTab('profile')} 
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}
          {activeTab === 'referral-centre' && <ReferralCentre theme={theme} onBack={() => setActiveTab('profile')} />}
          {activeTab === 'preferences' && <Preferences theme={theme} onBack={() => setActiveTab('profile')} />}
          
          {activeTab !== 'home' && activeTab !== 'portfolio' && activeTab !== 'markets' && activeTab !== 'coin-details' && activeTab !== 'discover' && activeTab !== 'ai' && activeTab !== 'profile' && activeTab !== 'bonus-center' && activeTab !== 'referral-centre' && activeTab !== 'preferences' && (
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
      
      {!isFullScreen && (
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
                  user.history.map((hist) => (
                    <div 
                      key={hist.id} 
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
