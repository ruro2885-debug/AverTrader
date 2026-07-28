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
export default function DiscoverView({ 
  theme, 
  onOpenMarketHighlights, 
  onOpenEventsPromos, 
  onOpenSupportCenter,
  onOpenStrategies
}: { 
  theme: 'light' | 'dark', 
  onOpenMarketHighlights: () => void, 
  onOpenEventsPromos: () => void,
  onOpenSupportCenter: () => void,
  onOpenStrategies: () => void
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
                  onClick={onOpenStrategies}
                  className="w-full sm:w-auto py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                >
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
                  8 Professional Models
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
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {[
          { title: 'Market Highlights', icon: Sparkles, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5', onClick: onOpenMarketHighlights },
          { title: 'Events & Promos', icon: Calendar, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5', onClick: onOpenEventsPromos },
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
    </motion.div>
  );
}
