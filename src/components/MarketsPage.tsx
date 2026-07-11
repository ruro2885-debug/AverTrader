import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, QrCode, TrendingUp, TrendingDown, Star, ChevronRight } from 'lucide-react';
import CoinLogo from './CoinLogo';

export default function MarketsPage({ theme, onSelectAsset }: { theme: 'light' | 'dark', onSelectAsset: (asset: any) => void }) {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark ? "bg-slate-900/40 backdrop-blur-md border border-white/5" : "bg-white/60 backdrop-blur-md border border-slate-200/50";

  const categories = ['All', 'Favorites', 'Trending', 'Gainers', 'Losers', 'AI Picks', 'New Listings'];
  const [activeCategory, setActiveCategory] = useState('All');

  const assets = [
    { symbol: 'BTC', name: 'Bitcoin', price: '$118,423.20', change: '+2.84%', isPositive: true },
    { symbol: 'ETH', name: 'Ethereum', price: '$4,230.20', change: '-1.12%', isPositive: false },
    { symbol: 'SOL', name: 'Solana', price: '$145.60', change: '+5.45%', isPositive: true },
    { symbol: 'AVR', name: 'Aver', price: '$1.24', change: '+12.4%', isPositive: true },
    { symbol: 'BNB', name: 'Binance Coin', price: '$586.30', change: '+0.45%', isPositive: true },
    { symbol: 'XRP', name: 'Ripple', price: '$1.82', change: '-2.15%', isPositive: false },
    { symbol: 'ADA', name: 'Cardano', price: '$0.98', change: '+1.15%', isPositive: true },
    { symbol: 'DOGE', name: 'Dogecoin', price: '$0.34', change: '+8.42%', isPositive: true },
    { symbol: 'AVAX', name: 'Avalanche', price: '$42.50', change: '-3.12%', isPositive: false },
    { symbol: 'FET', name: 'Artificial Superintelligence Alliance', price: '$2.15', change: '+15.7%', isPositive: true },
    { symbol: 'LINK', name: 'Chainlink', price: '$18.40', change: '+4.20%', isPositive: true },
  ];

  return (
    <div className={`min-h-screen pt-[73px] pb-32 ${isDark ? 'bg-[#000000]' : 'bg-slate-50'}`}>
      {/* 1. FIXED HEADER */}
      <header className={`fixed top-0 left-0 right-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-[#000000]/90' : 'bg-white/90'} border-b ${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center box-border`}>
        <div>
          <h1 className={`text-xl font-black ${textPrimary}`}>Markets</h1>
          <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Market
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Search size={20} className={textSecondary} />
          <SlidersHorizontal size={20} className={textSecondary} />
        </div>
      </header>

      {/* 2. SEARCH BAR */}
      <div className="px-4 py-4 sticky top-[73px] z-30 bg-inherit">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search BTC, ETH, SOL..." 
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium ${isDark ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all`}
          />
        </div>
      </div>

      {/* 3. CATEGORY TABS */}
      <div className="flex overflow-x-auto gap-1 px-4 pb-4 scrollbar-hide sticky top-[157px] z-30 bg-inherit">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. FEATURED MARKET BANNER */}
      <div className="px-4 py-2">
        <div className="rounded-[28px] overflow-hidden relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/10 group cursor-pointer active:scale-[0.98] transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-white" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Featured Asset</span>
            </div>
            <h3 className="text-2xl font-black mb-1 tracking-tight">Top Gainer: Aver (AVR)</h3>
            <p className="text-sm text-white/90 mb-4 max-w-[240px] leading-relaxed font-medium">Aver is leading the market today with a massive 12.4% gain in 24 hours.</p>
            <div className="flex items-center gap-2 text-xs font-black bg-white/20 w-fit px-3 py-1.5 rounded-lg border border-white/20">
              Trade Now <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. LIVE MARKET LIST */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>Market Overview</h3>
          <button className="text-xs font-bold text-emerald-500">View All</button>
        </div>
        <div className={`rounded-[24px] overflow-hidden ${cardClasses} shadow-xl`}>
          {assets.map((asset, i) => (
            <motion.div 
              key={`${asset.symbol}-${i}`} 
              onClick={() => onSelectAsset(asset)} 
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${i !== assets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                  <CoinLogo symbol={asset.symbol} size={28} />
                </div>
                <div>
                  <p className={`font-black text-sm tracking-tight ${textPrimary}`}>{asset.name}</p>
                  <p className={`text-[11px] font-bold ${textSecondary} uppercase tracking-wider`}>{asset.symbol}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className="hidden sm:block w-24 h-10">
                   <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path 
                      d={asset.isPositive ? "M0,35 C20,30 40,38 60,15 C80,10 90,20 100,10" : "M0,10 C20,15 40,5 60,30 C80,35 90,25 100,35"} 
                      fill="none" 
                      stroke={asset.isPositive ? "#10b981" : "#ef4444"} 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className={`font-black text-sm ${textPrimary}`}>{asset.price}</p>
                  <p className={`text-[11px] font-black ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                    {asset.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {asset.change}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 8. FLOATING ACTION BUTTON */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-40">
        <QrCode size={24} className="text-white" />
      </button>

    </div>
  );
}
