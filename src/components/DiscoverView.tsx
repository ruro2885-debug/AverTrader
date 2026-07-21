import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Bot, Users, Sparkles, Flame, Calendar, BookOpen, ChevronRight, PlayCircle, LifeBuoy
} from 'lucide-react';
import CoinLogo from './CoinLogo';
import { usePreferences } from '../contexts/PreferencesContext';
import CopyTradeDashboard from './copytrade/CopyTradeDashboard';

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
  const [featuredStrategy, setFeaturedStrategy] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

    // Rotating Featured AI Strategies
    const strategies = [
      { name: "Quantum Momentum", description: "High-frequency trend following", apy: "42.8%", risk: "Medium", users: "12,450" },
      { name: "Arbitrage Alpha", description: "Cross-exchange price discrepancy", apy: "35.2%", risk: "Low", users: "8,920" },
      { name: "Yield Harvester", description: "Automated liquidity provision", apy: "51.5%", risk: "High", users: "15,300" }
    ];
    // Rotate every 24 hours based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setFeaturedStrategy(strategies[dayOfYear % strategies.length]);
  }, []);

  if (showCopyTrade) {
    return (
      <CopyTradeDashboard 
        theme={theme} 
        onBack={() => setShowCopyTrade(false)} 
      />
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Flame className="w-5 h-5 mr-2 text-orange-500" />
              {t('common.trending_assets')}
            </h3>
            <button className={`text-xs font-bold text-orange-500 hover:text-orange-400`}>{t('common.view_all')}</button>
          </div>
          <div className={`rounded-[20px] overflow-hidden ${cardClasses}`}>
            {trendingAssets.map((asset, i) => (
              <div key={`${asset.symbol}-${i}`} className={`flex items-center justify-between p-4 ${i !== trendingAssets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''}`}>
                <div className="flex items-center space-x-3">
                  <CoinLogo symbol={asset.symbol} size={36} />
                  <div>
                    <p className={`font-bold text-sm ${textPrimary}`}>{asset.symbol}</p>
                    <p className={`text-[11px] ${textSecondary}`}>{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${textPrimary}`}>{asset.price}</p>
                  <p className={`text-[11px] font-medium flex items-center justify-end mt-0.5 ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {asset.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Strategies */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Bot className="w-5 h-5 mr-2 text-emerald-500" />
              {t('common.ai_strategies')}
            </h3>
          </div>
          {featuredStrategy && (
          <div className={`rounded-[20px] p-5 ${cardClasses}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className={`font-bold text-base ${textPrimary}`}>{featuredStrategy.name}</h4>
                <p className={`text-xs ${textSecondary} mt-0.5`}>{featuredStrategy.description}</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold uppercase">
                {featuredStrategy.apy} APY
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-5">
              <div>
                <p className={`text-[10px] ${textSecondary}`}>Risk Level</p>
                <p className={`text-sm font-bold text-amber-500`}>{featuredStrategy.risk}</p>
              </div>
              <div>
                <p className={`text-[10px] ${textSecondary}`}>Active Users</p>
                <p className={`text-sm font-bold ${textPrimary}`}>{featuredStrategy.users}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedStrategy(featuredStrategy);
                setIsModalVisible(true);
              }}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}>
              {t('common.analyze_strategy')}
            </button>
          </div>
          )}
        </div>
      </div>

      {/* PREMIUM COPY TRADE LAUNCHER CARD - REPLACES OLD "TOP COPY TRADERS" ROW */}
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
      
      
      {isModalVisible && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl p-6 ${cardClasses}`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{selectedStrategy.name}</h3>
            <p className={`text-sm ${textSecondary} mb-6`}>{selectedStrategy.description}. This strategy utilizes advanced algorithms to optimize returns while managing risk.</p>
            <button 
              onClick={() => setIsModalVisible(false)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
