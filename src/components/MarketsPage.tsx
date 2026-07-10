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
    { symbol: 'FET', name: 'Fetch.ai', price: '$2.15', change: '+15.7%', isPositive: true },
  ];

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#050505]' : 'bg-slate-50'}`}>
      {/* 1. FIXED HEADER */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl ${isDark ? 'bg-[#050505]/80' : 'bg-slate-50/80'} border-b ${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center shadow-sm`}>
        <div>
          <h1 className={`text-xl font-black ${textPrimary}`}>Markets</h1>
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Markets
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Search size={20} className={textSecondary} />
          <SlidersHorizontal size={20} className={textSecondary} />
        </div>
      </header>

      {/* 2. SEARCH */}
      <div className="px-4 py-4">
        <input 
          type="text" 
          placeholder="Search Bitcoin, Ethereum, Solana..." 
          className={`w-full p-4 rounded-2xl ${isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} border focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        />
      </div>

      {/* 3. MARKET CATEGORY CHIPS */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. FEATURED MARKET CARD */}
      <div className="px-4 py-4">
        <div className="rounded-[24px] overflow-hidden relative bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
          <h3 className="text-xl font-bold mb-1">Top Gainer: Aver (AVR)</h3>
          <p className="text-sm text-white/80 mb-4">Aver is leading the market today with a massive 12.4% gain.</p>
          <button className="px-5 py-2.5 rounded-xl bg-white/20 text-white font-bold text-sm border border-white/20">View Details</button>
        </div>
      </div>

      {/* 5. MARKET OVERVIEW */}
      <div className="px-4 py-4 grid grid-cols-2 gap-4">
        {['Market Cap', '24h Volume', 'BTC Dominance', 'Fear & Greed'].map(stat => (
          <div key={stat} className={`p-4 rounded-2xl ${cardClasses}`}>
            <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>{stat}</p>
            <p className={`text-sm font-black ${textPrimary} mt-1`}>$1.2T</p>
          </div>
        ))}
      </div>

      {/* 6. TRENDING COINS */}
      <div className="px-4 py-4">
        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>Trending Coins</h3>
        <div className="flex overflow-x-auto gap-4 scrollbar-hide">
          {assets.map(asset => (
            <div key={asset.symbol} className={`p-4 rounded-2xl ${cardClasses} min-w-[140px]`}>
              <div className="flex items-center gap-2 mb-2">
                <CoinLogo symbol={asset.symbol} size={24} />
                <span className={`font-bold ${textPrimary}`}>{asset.symbol}</span>
              </div>
              <p className={`text-lg font-black ${textPrimary}`}>{asset.price}</p>
              <p className={`text-xs font-bold ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{asset.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. FULL MARKET LIST */}
      <div className="px-4 py-4">
        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>All Markets</h3>
        <div className={`rounded-[20px] overflow-hidden ${cardClasses}`}>
          {assets.map((asset, i) => (
            <div key={asset.symbol} onClick={() => onSelectAsset(asset)} className={`flex items-center justify-between p-4 cursor-pointer ${i !== assets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''}`}>
              <div className="flex items-center gap-3">
                <CoinLogo symbol={asset.symbol} size={36} />
                <div>
                  <p className={`font-bold text-sm ${textPrimary}`}>{asset.name}</p>
                  <p className={`text-xs ${textSecondary}`}>{asset.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${textPrimary}`}>{asset.price}</p>
                <p className={`text-xs font-bold ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{asset.change}</p>
              </div>
              <ChevronRight size={16} className={textSecondary} />
            </div>
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
