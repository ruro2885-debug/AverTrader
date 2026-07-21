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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market/ticker');
      if (!res.ok) throw new Error('Failed to fetch market data');
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
          rawPrice: parseFloat(d.lastPrice),
          rawChange: parseFloat(d.priceChangePercent) || 0,
          quoteVolume: parseFloat(d.quoteVolume) || 0
        };
      });
      setAssets(mapped);
    } catch (err) {
      console.error(err);
      setError('Unable to load market data.');
    } finally {
      setLoading(false);
    }
  };

  const generateLocalInsights = (currentAssets: any[]) => {
    if (!currentAssets || currentAssets.length === 0) return 'No insights available.';
    const btc = currentAssets.find(a => a.symbol === 'BTC');
    const eth = currentAssets.find(a => a.symbol === 'ETH');
    const gainers = [...currentAssets].sort((a, b) => b.rawChange - a.rawChange);
    const topGainer = gainers[0];
    
    let insight = `Market analysis indicates a ${btc?.isPositive ? 'bullish' : 'bearish'} trend led by Bitcoin at ${formatCurrency(btc?.price || 0)}. `;
    if (topGainer && topGainer.rawChange > 5) {
      insight += `${topGainer.name} (${topGainer.symbol}) is showing exceptionally strong momentum, up ${topGainer.change}. `;
    }
    if (eth) {
      insight += `Ethereum is currently trading at ${formatCurrency(eth.price)}, showing a ${eth.change} shift. `;
    }
    insight += `Overall liquidity remains concentrated in top-tier assets. Quantum engine recommends maintaining a balanced exposure weighted towards high-conviction momentum plays.`;
    return insight;
  };

  const fetchInsights = async (currentAssets: any[]) => {
    try {
      setInsightsLoading(true);
      const currentPrices = currentAssets.reduce((acc, asset) => {
        acc[asset.symbol] = asset.price;
        return acc;
      }, {} as Record<string, number>);
      
      const res = await fetch('/api/market/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPrices })
      });
      if (!res.ok) {
        setInsights(generateLocalInsights(currentAssets));
        return;
      }
      const data = await res.json();
      if (!data || (!data.briefing && !data.intelligence)) {
        setInsights(generateLocalInsights(currentAssets));
        return;
      }
      setInsights(data.briefing?.summary || data.intelligence || generateLocalInsights(currentAssets));
    } catch (err) {
      console.error(err);
      setInsights(generateLocalInsights(currentAssets));
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0) {
      fetchInsights(assets);
    }
  }, [assets]);

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

  const categories = ['Favorites', 'Trending', 'Gainers', 'Losers'];
  const [activeCategory, setActiveCategory] = useState('Trending');

  const overviewAssets = React.useMemo(() => {
    if (activeCategory === 'Favorites') {
      return assets.filter(asset => user?.watchlist?.includes(asset.symbol)).slice(0, 3);
    }
    
    if (activeCategory === 'Trending') {
      return [...assets].sort((a, b) => (b.quoteVolume || 0) - (a.quoteVolume || 0)).slice(0, 3);
    }
    
    if (activeCategory === 'Gainers') {
      return [...assets].sort((a, b) => (b.rawChange || 0) - (a.rawChange || 0)).slice(0, 3);
    }
    
    if (activeCategory === 'Losers') {
      return [...assets].sort((a, b) => (a.rawChange || 0) - (b.rawChange || 0)).slice(0, 3);
    }
    
    return assets.slice(0, 3);
  }, [assets, activeCategory, user?.watchlist]);

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
          ) : error ? (
            <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-3">
              <span>Unable to load market data. Tap to retry.</span>
              <button onClick={fetchAssets} className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Retry</button>
            </div>
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
            {insightsLoading ? (
              <p className="text-sm text-slate-500 animate-pulse">Analyzing market pulse...</p>
            ) : insights ? (
              <p className="text-sm text-slate-300">{insights}</p>
            ) : (
              <p className="text-sm text-slate-400">No insights currently available.</p>
            )}
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

