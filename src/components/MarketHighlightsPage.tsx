import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Bell, RefreshCw, Activity, Bot, TrendingUp, TrendingDown, Sparkles, Newspaper, PieChart, CalendarDays } from 'lucide-react';
import CoinLogo from './CoinLogo';

export default function MarketHighlightsPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 h-[60px] flex items-center justify-between px-4 border-b backdrop-blur-md ${isDark ? 'bg-black/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full hover:bg-white/10 ${textSecondary}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-lg font-black ${textPrimary}`}>Market Highlights</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className={`p-2 rounded-full hover:bg-white/10 ${textSecondary}`}><Search className="w-5 h-5" /></button>
          <button className={`p-2 rounded-full hover:bg-white/10 ${textSecondary}`}><Bell className="w-5 h-5" /></button>
          <button className={`p-2 rounded-full hover:bg-white/10 ${textSecondary}`}><RefreshCw className="w-5 h-5" /></button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
            <Activity className="w-3 h-3" />
            AI Monitoring
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Market Snapshot Hero */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
          <h2 className="text-sm font-bold text-slate-400 mb-4">Market Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Market Sentiment</p>
              <p className="text-lg font-black text-emerald-500">Bullish</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">AI Confidence</p>
              <p className="text-lg font-black text-white">88%</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Global Risk</p>
              <p className="text-lg font-black text-amber-500">Moderate</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Market Trend</p>
              <p className="text-lg font-black text-blue-500">Uptrend</p>
            </div>
          </div>
        </section>

        {/* AI Briefing */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-400">AI Market Briefing</h2>
          </div>
          <p className={`text-sm leading-relaxed ${textSecondary}`}>The market is currently showing strong bullish momentum driven by institutional adoption in Layer 1 protocols and increased DeFi activity. Sentiment is improving, despite some macroeconomic headwinds affecting volatility. Our AI suggests focusing on high-momentum assets while managing risk due to potential short-term pullbacks.</p>
        </section>

        {/* Live Market Movers */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
            <h2 className="text-sm font-bold text-slate-400 mb-4">Live Market Movers</h2>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['Gainers', 'Losers', 'Trending', 'Highest Volume'].map(chip => (
                    <button key={chip} className={`px-4 py-2 rounded-full text-xs font-bold border ${chip === 'Gainers' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>{chip}</button>
                ))}
            </div>
            <div className="space-y-4">
                {[
                    { symbol: 'AVR', name: 'Aver', price: '$1.24', change: '+12.4%', isPositive: true },
                    { symbol: 'SOL', name: 'Solana', price: '$145.60', change: '+8.2%', isPositive: true },
                    { symbol: 'FET', name: 'Fetch.ai', price: '$2.15', change: '-5.7%', isPositive: false },
                ].map(asset => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CoinLogo symbol={asset.symbol} size={36} />
                            <div>
                                <p className={`font-bold text-sm ${textPrimary}`}>{asset.symbol}</p>
                                <p className={`text-[11px] ${textSecondary}`}>{asset.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-sm ${textPrimary}`}>{asset.price}</p>
                            <p className={`text-[11px] font-medium flex items-center justify-end ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {asset.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {asset.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Sector Performance (Placeholder) */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-400">Sector Performance</h2>
          </div>
          <p className={`text-sm ${textSecondary}`}>Sector performance tracking is loading...</p>
        </section>

        {/* News Feed (Placeholder) */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-5 h-5 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-400">Breaking Stories</h2>
          </div>
          <p className={`text-sm ${textSecondary}`}>Latest market stories are being fetched...</p>
        </section>
        
        {/* Events (Placeholder) */}
        <section className={`rounded-[24px] p-6 ${cardClasses}`}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-400">Today's Important Events</h2>
          </div>
          <p className={`text-sm ${textSecondary}`}>Upcoming market events are syncing...</p>
        </section>
      </div>
    </motion.div>
  );
}
