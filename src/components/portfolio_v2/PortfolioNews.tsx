import React from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioNewsProps {
  theme: 'light' | 'dark';
}

const NEWS_ITEMS = [
  {
    id: 1,
    asset: 'BTC',
    title: 'Bitcoin ETFs See Record Inflows Amid Institutional Adoption Spurt',
    source: 'CoinDesk',
    time: '2 hours ago',
    sentiment: 'positive',
    impact: 'High'
  },
  {
    id: 2,
    asset: 'ETH',
    title: 'Ethereum Dencun Upgrade Deployed to Final Testnet Successfully',
    source: 'The Block',
    time: '5 hours ago',
    sentiment: 'positive',
    impact: 'Medium'
  },
  {
    id: 3,
    asset: 'SOL',
    title: 'Solana Network Activity Reaches All-Time High Following Airdrop Season',
    source: 'Decrypt',
    time: '8 hours ago',
    sentiment: 'positive',
    impact: 'High'
  },
  {
    id: 4,
    asset: 'MACRO',
    title: 'Federal Reserve Signals Potential Rate Cuts Later This Year',
    source: 'Bloomberg',
    time: '12 hours ago',
    sentiment: 'neutral',
    impact: 'Medium'
  }
];

export default function PortfolioNews({ theme }: PortfolioNewsProps) {
  const isDark = theme === 'dark';
  
  const bgClasses = isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/60 border-slate-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const borderClass = isDark ? 'border-white/5' : 'border-slate-100';

  return (
    <div className={`w-[96%] mx-auto rounded-xl border ${bgClasses} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-blue-500" />
            <h2 className={`text-xl font-bold tracking-tight ${textPrimary}`}>Market Intelligence</h2>
          </div>
          <p className={`text-sm ${textSecondary}`}>Latest news and insights curated for your specific holdings.</p>
        </div>
        <button className={`text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors`}>
          View All News →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NEWS_ITEMS.map((news) => (
          <div key={news.id} className={`p-4 rounded-xl border ${borderClass} ${hoverClass} transition-all cursor-pointer flex flex-col justify-between group`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  news.asset === 'MACRO' 
                    ? (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {news.asset}
                </span>
                
                {news.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {news.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-rose-500" />}
              </div>
              
              <h3 className={`font-medium ${textPrimary} leading-snug mb-3 group-hover:text-blue-400 transition-colors`}>
                {news.title}
              </h3>
            </div>
            
            <div className={`flex items-center justify-between text-xs ${textSecondary} mt-2`}>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-400">{news.source}</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {news.time}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
