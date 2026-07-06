import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  Brain, Activity, Star, Newspaper, Zap, ArrowRightLeft, 
  Copy, History, CreditCard, ChevronRight, Bell 
} from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import CoinLogo from './CoinLogo';
import ProfileView from './ProfileView';
import DiscoverView from './DiscoverView';
import { useAuth } from '../contexts/AuthContext';

const portfolioData = {
  totalValue: '$124,560.00',
  todayPnL: '+$1,240.50',
  todayPnLPercent: '+1.01%',
  overallReturn: '+24.5%',
};

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$64,230.00', change: '+2.4%', isPositive: true },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,450.20', change: '+1.2%', isPositive: true },
  { symbol: 'SOL', name: 'Solana', price: '$145.60', change: '-0.8%', isPositive: false },
  { symbol: 'BNB', name: 'BNB', price: '$590.10', change: '+0.5%', isPositive: true },
  { symbol: 'XRP', name: 'Ripple', price: '$0.58', change: '-1.2%', isPositive: false },
];

const aiSignals = [
  { asset: 'BTC', signal: 'Strong Buy', confidence: 92, risk: 'Medium', movement: '+4.5% in 24h' },
];

const watchlist = [
  { symbol: 'AVR', name: 'Aver', price: '$1.24', change: '+5.4%', isPositive: true },
  { symbol: 'ADA', name: 'Cardano', price: '$0.45', change: '-2.1%', isPositive: false },
];

const news = [
  { headline: 'Bitcoin ETFs see record inflows as institutional adoption grows', source: 'Crypto News', time: '2h ago', sentiment: 'Positive' },
  { headline: 'Ethereum network upgrade successfully deployed on testnet', source: 'Tech Finance', time: '4h ago', sentiment: 'Positive' },
];

export default function Dashboard({ theme }: { theme: 'light' | 'dark' }) {
  const [activeTab, setActiveTab] = useState('home');
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const containerClasses = isDark 
    ? "bg-gradient-to-br from-[#020617] via-[#000000] to-[#022c22]" 
    : "bg-gradient-to-br from-slate-50 via-white to-emerald-50";

  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

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
    <div className={`min-h-screen pb-28 ${containerClasses} transition-colors duration-500 overflow-x-hidden font-sans`}>
      
      {/* Animated subtle background gradients */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[100px] rounded-full" />
        </div>
      )}

      <div className="relative z-10 p-4 sm:p-6 lg:max-w-5xl lg:mx-auto pt-safe">
        
        <header className="flex justify-between items-center mb-6 pt-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-[2px] hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
            <div>
              <p className={`text-xs ${textSecondary}`}>Hello there,</p>
              <h1 className={`text-lg font-bold tracking-tight ${textPrimary}`}>
                @{user?.displayName?.toLowerCase().replace(/\s+/g, '') || user?.email?.split('@')[0] || 'user'}
              </h1>
            </div>
          </div>
          <button className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>
            <Bell className={`w-5 h-5 ${textPrimary}`} />
          </button>
        </header>

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
                
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>Total Portfolio Value</p>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${textPrimary} mb-4`}>
                  {portfolioData.totalValue}
                </h2>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold">{portfolioData.todayPnL}</span>
                    <span className="text-xs font-medium">({portfolioData.todayPnLPercent})</span>
                  </div>
                  <div className={`text-xs font-medium ${textSecondary}`}>
                    Overall: <span className="text-emerald-500 font-bold">{portfolioData.overallReturn}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_4px_14px_rgba(16,185,129,0.3)]">
                    <ArrowDownRight className="w-5 h-5 mb-1" />
                    Deposit
                  </button>
                  <button className={`flex flex-col items-center justify-center p-3 rounded-2xl font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 border ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                    <ArrowUpRight className="w-5 h-5 mb-1" />
                    Withdraw
                  </button>
                  <button className={`flex flex-col items-center justify-center p-3 rounded-2xl font-bold text-sm transition-transform hover:scale-[1.02] active:scale-95 border ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
                    <ArrowRightLeft className="w-5 h-5 mb-1" />
                    Trade
                  </button>
                </div>
              </motion.div>

              {/* Section 6: Quick Actions */}
              <motion.div variants={itemVariants}>
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  {[
                    { name: 'Deposit', icon: ArrowDownRight },
                    { name: 'Withdraw', icon: ArrowUpRight },
                    { name: 'Swap', icon: ArrowRightLeft },
                    { name: 'Copy Trade', icon: Copy },
                    { name: 'Transfer', icon: Zap },
                    { name: 'History', icon: History },
                  ].map((action, i) => (
                    <button key={i} className="flex flex-col items-center flex-shrink-0 space-y-2 group w-16">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/50 border border-white/5' : 'bg-white hover:bg-slate-50 border border-slate-200 shadow-sm'}`}>
                        <action.icon className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} transition-transform group-hover:scale-110`} />
                      </div>
                      <span className={`text-[11px] text-center font-medium ${textSecondary}`}>{action.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Section 3: AI Trading Signals */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-end mb-3">
                  <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
                    <Brain className="w-5 h-5 mr-2 text-emerald-500" />
                    AI Signals
                  </h3>
                  <button className={`text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center`}>
                    View All <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
                
                {aiSignals.map((signal, i) => (
                  <div key={i} className={`rounded-[20px] p-5 ${isDark ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900/40 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <CoinLogo symbol={signal.asset} size={36} />
                        <div>
                          <h4 className={`font-bold ${textPrimary}`}>{signal.asset} Signal</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md mr-2">
                              {signal.signal}
                            </span>
                            <span className={`text-xs ${textSecondary}`}>{signal.confidence}% Confidence</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded border text-xs font-medium ${signal.risk === 'Low' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : signal.risk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {signal.risk} Risk
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-xs ${textSecondary}`}>Expected Movement</p>
                        <p className="text-sm font-bold text-emerald-500">{signal.movement}</p>
                      </div>
                      <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                        View Analysis
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
                      Market Overview
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
                          <p className={`font-bold text-sm ${textPrimary}`}>{coin.price}</p>
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
                                <span className={`text-[10px] font-medium ${textSecondary}`}>{coin.price}</span>
                                <span className={`text-[10px] font-medium ${coin.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{coin.change}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>Buy</button>
                            <button className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>Sell</button>
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
                            <button className={`text-xs font-bold transition-colors ${isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'}`}>
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

          {activeTab === 'discover' && <DiscoverView theme={theme} />}
          {activeTab === 'profile' && <ProfileView theme={theme} />}
          
          {activeTab !== 'home' && activeTab !== 'discover' && activeTab !== 'profile' && (
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
                  {activeTab === 'portfolio' && <Wallet className={`w-8 h-8 ${textSecondary}`} />}
                </div>
                <p className={`${textSecondary} font-medium`}>
                  {activeTab} module is coming soon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
