import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, TrendingUp, TrendingDown, Star, ChevronRight, Newspaper } from 'lucide-react';
import CoinLogo from './CoinLogo';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';

export default function MarketsPage({ theme, onSelectAsset }: { theme: 'light' | 'dark', onSelectAsset: (asset: any) => void }) {
  const { user, toggleWatchlist } = useAuth();
  const { formatCurrency } = usePreferences();
  
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22ADAUSDT%22,%22XRPUSDT%22,%22SOLUSDT%22,%22DOGEUSDT%22,%22AVAXUSDT%22,%22LINKUSDT%22,%22BNBUSDT%22,%22FETUSDT%22%5D');
      const data = await res.json();
      const mapped = data.map((d: any) => {
        const symbol = d.symbol.replace('USDT', '');
        const isPositive = parseFloat(d.priceChangePercent) >= 0;
        return {
          symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol === 'ADA' ? 'Cardano' : symbol === 'XRP' ? 'Ripple' : symbol === 'SOL' ? 'Solana' : symbol === 'DOGE' ? 'Dogecoin' : symbol === 'AVAX' ? 'Avalanche' : symbol === 'BNB' ? 'Binance Coin' : symbol === 'FET' ? 'Artificial Superintelligence Alliance' : 'Chainlink',
          price: parseFloat(d.lastPrice),
          change: (isPositive ? '+' : '') + parseFloat(d.priceChangePercent).toFixed(2) + '%',
          isPositive,
          rawPrice: parseFloat(d.lastPrice)
        };
      });
      setAssets(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fcointelegraph.com%2Frss');
      const data = await res.json();
      if (data.items) {
        const mappedNews = data.items.slice(0, 5).map((item: any) => {
          const diffMs = Date.now() - new Date(item.pubDate).getTime();
          const hours = Math.floor(diffMs / 3600000);
          const time = hours > 0 ? `${hours}h ago` : 'Just now';
          
          let relatedAsset = null;
          const text = (item.title + " " + (item.description || "")).toUpperCase();
          if (text.includes('BITCOIN') || text.includes('BTC')) relatedAsset = 'BTC';
          else if (text.includes('ETHEREUM') || text.includes('ETH')) relatedAsset = 'ETH';
          else if (text.includes('SOLANA') || text.includes('SOL')) relatedAsset = 'SOL';
          else if (text.includes('RIPPLE') || text.includes('XRP')) relatedAsset = 'RIPPLE';
          else if (text.includes('CARDANO') || text.includes('ADA')) relatedAsset = 'ADA';

          return {
            headline: item.title,
            source: item.author || 'Cointelegraph',
            time,
            link: item.link,
            relatedAsset
          };
        });
        setNews(mappedNews);
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchNews();
    const assetsInterval = setInterval(fetchAssets, 40 * 60000); // 40m refresh
    const newsInterval = setInterval(fetchNews, 60000); // 60s refresh
    return () => {
      clearInterval(assetsInterval);
      clearInterval(newsInterval);
    };
  }, []);

  const handleToggleWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    await toggleWatchlist(symbol);
  };

  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark ? "bg-slate-900/40 backdrop-blur-md border border-white/5" : "bg-white/60 backdrop-blur-md border border-slate-200/50";

  const categories = ['Favorites', 'Trending', 'Gainers', 'Losers', 'AI Picks', 'New Listings'];
  const [activeCategory, setActiveCategory] = useState('Trending');

  const filteredAssets = assets.filter(asset => {
    if (activeCategory === 'Favorites') {
      return user?.watchlist?.includes(asset.symbol);
    } else if (activeCategory === 'Gainers') {
      return asset.isPositive;
    } else if (activeCategory === 'Losers') {
      return !asset.isPositive;
    }
    return true;
  });

  const overviewAssets = filteredAssets.slice(0, 3);

  return (
    <div className="pt-[73px] flex-1 flex flex-col">
      {/* 1. FIXED HEADER */}
      <header className={`fixed top-0 left-0 right-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-black/90' : 'bg-white/90'} border-b ${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center box-border`}>
        <div>
          <h1 className={`text-xl font-black ${textPrimary}`}>Markets</h1>
        </div>
      </header>

      {/* 2. CATEGORY TABS */}
      <div className="flex overflow-x-auto gap-1 px-4 py-4 scrollbar-hide sticky top-[73px] z-30 bg-inherit">
        {categories.map((cat, i) => (
          <button 
            key={`market-cat-${cat}-${i}`} 
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. MARKET OVERVIEW */}
      <div className="px-4 py-2">
        <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary} mb-3`}>Market Overview</h3>
        <div className={`rounded-[24px] overflow-hidden ${cardClasses} shadow-xl`}>
          {loading && overviewAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">Retrieving digital assets...</div>
          ) : overviewAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No assets available.</div>
          ) : (
            overviewAssets.map((asset, i) => (
              <motion.div 
                key={`${asset.symbol}-${i}`} 
                onClick={() => onSelectAsset(asset)} 
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${i !== overviewAssets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => handleToggleWatchlist(e, asset.symbol)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${user?.watchlist?.includes(asset.symbol) ? 'fill-amber-500 text-amber-500' : 'text-slate-500'}`} />
                  </button>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                    <CoinLogo symbol={asset.symbol} size={28} />
                  </div>
                  <div>
                    <p className={`font-black text-sm tracking-tight ${textPrimary}`}>{asset.name}</p>
                    <p className={`text-[11px] font-bold ${textSecondary} uppercase tracking-wider`}>{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${textPrimary}`}>{formatCurrency(asset.price)}</p>
                  <p className={`text-[11px] font-black ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                    {asset.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {asset.change}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 4. LIVE MARKET CONTENT */}
      <div className="px-4 py-6">
        <h3 className={`text-lg font-black tracking-tight ${textPrimary} mb-4`}>Market Insights</h3>
        <div className={`rounded-[24px] p-6 ${cardClasses}`}>
            <p className="text-sm text-slate-400">Live AI-driven market analysis, pulse tracking, and upcoming economic event calendar will be populated here as they become available.</p>
        </div>
      </div>

      {/* 5. MARKET NEWS */}
      <div className="px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black tracking-tight ${textPrimary} flex items-center gap-2`}>
            <Newspaper className="w-5 h-5 text-indigo-500" />
            Financial Intelligence
          </h3>
        </div>

        {newsLoading ? (
          <div className={`rounded-3xl p-8 text-center ${cardClasses} animate-pulse`}>
            <p className="text-xs text-gray-500">Retrieving institutional headlines...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, i) => (
              <div 
                key={`news-${i}`} 
                onClick={() => window.open(item.link, '_blank')}
                className={`rounded-[24px] p-5 cursor-pointer border hover:border-emerald-500/30 transition-all ${cardClasses}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono tracking-wider">{item.source}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{item.time}</span>
                </div>
                <h4 className={`text-sm font-bold leading-snug ${textPrimary} hover:text-emerald-500 transition-colors mb-2 line-clamp-2`}>
                  {item.headline}
                </h4>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

