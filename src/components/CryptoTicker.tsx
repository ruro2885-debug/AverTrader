import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const TICKER_DATA = [
  { symbol: 'BTC', price: '$67,420.50', change: '+2.45%', up: true },
  { symbol: 'ETH', price: '$3,520.10', change: '+3.12%', up: true },
  { symbol: 'SOL', price: '$184.75', change: '+5.80%', up: true },
  { symbol: 'XRP', price: '$0.59', change: '+3.22%', up: true },
  { symbol: 'ADA', price: '$0.49', change: '-1.09%', up: false },
  { symbol: 'AVAX', price: '$34.15', change: '+4.10%', up: true },
  { symbol: 'DOT', price: '$7.82', change: '-0.45%', up: false },
  { symbol: 'DOGE', price: '$0.12', change: '+5.72%', up: true },
  { symbol: 'BNB', price: '$588.30', change: '+1.95%', up: true },
];

export default function CryptoTicker() {
  const tripleItems = [...TICKER_DATA, ...TICKER_DATA, ...TICKER_DATA];

  return (
    <div className="w-full bg-slate-950/90 border-b border-white/10 overflow-hidden py-2 text-xs font-mono select-none z-30">
      <div className="animate-marquee flex items-center whitespace-nowrap gap-8 px-4">
        {tripleItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 font-bold tracking-wider">
            <span className="text-emerald-400">• LIVE</span>
            <span className="text-white font-extrabold">{item.symbol}</span>
            <span className="text-slate-200">{item.price}</span>
            <span className={`flex items-center gap-0.5 ${item.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
