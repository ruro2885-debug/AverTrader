import React from 'react';
import { ArrowLeft, Star, Share2 } from 'lucide-react';
import CoinLogo from './CoinLogo';

export default function CoinDetailsPage({ asset, theme, onBack }: { asset: any, theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#000000]' : 'bg-slate-50'}`}>
      <header className="p-4 flex justify-between items-center">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800/50">
          <ArrowLeft size={20} className={textPrimary} />
        </button>
        <div className="flex gap-4">
          <Star size={20} className={textSecondary} />
          <Share2 size={20} className={textSecondary} />
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <CoinLogo symbol={asset.symbol} size={64} />
          <div>
            <h1 className={`text-2xl font-black ${textPrimary}`}>{asset.name}</h1>
            <p className={`text-lg font-bold ${textSecondary}`}>{asset.symbol}</p>
          </div>
        </div>
        <p className={`text-3xl font-black ${textPrimary} mb-1`}>{asset.price}</p>
        <p className={`text-sm font-bold ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{asset.change}</p>
      </div>

      <div className="px-6 py-4">
        <div className="h-48 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500">Chart Placeholder</div>
      </div>

      <div className="px-6 py-4">
        <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>Market Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          {['Market Cap', '24h Volume', 'Circulating Supply', 'Max Supply'].map(stat => (
            <div key={stat} className={`p-4 rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <p className={`text-[10px] uppercase font-bold ${textSecondary}`}>{stat}</p>
              <p className={`text-sm font-black ${textPrimary} mt-1`}>$1.2T</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="fixed bottom-6 left-6 right-6">
        <button className="w-full py-4 bg-emerald-500 rounded-2xl text-white font-bold text-lg">Trade {asset.symbol}</button>
      </div>
    </div>
  );
}
