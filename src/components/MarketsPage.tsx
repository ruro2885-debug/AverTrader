import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, SlidersHorizontal, QrCode, TrendingUp, TrendingDown, Star, ChevronRight, Newspaper } from 'lucide-react';
import CoinLogo from './CoinLogo';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';

export default function MarketsPage({ theme, onSelectAsset }: { theme: 'light' | 'dark', onSelectAsset: (asset: any) => void }) {
  const { user, updateProfile } = useAuth();
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
          else if (text.includes('RIPPLE') || text.includes('XRP')) relatedAsset = 'XRP';
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

  React.useEffect(() => {
    fetchAssets();
    fetchNews();
    const assetsInterval = setInterval(fetchAssets, 30000); // 30s refresh
    const newsInterval = setInterval(fetchNews, 60000); // 60s refresh
    return () => {
      clearInterval(assetsInterval);
      clearInterval(newsInterval);
    };
  }, []);

  const toggleWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (!user) return;
    const currentList = user.watchlist || [];
    const newList = currentList.includes(symbol) 
      ? currentList.filter(s => s !== symbol) 
      : [...currentList, symbol];
    await updateProfile({ watchlist: newList } as any, undefined, undefined, true);
  };

  const isDark = theme === 'dark';
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark ? "bg-slate-900/40 backdrop-blur-md border border-white/5" : "bg-white/60 backdrop-blur-md border border-slate-200/50";

  const categories = ['All', 'Favorites', 'Trending', 'Gainers', 'Losers', 'AI Picks', 'New Listings'];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === 'Favorites') {
      return user?.watchlist?.includes(asset.symbol);
    } else if (activeCategory === 'Gainers') {
      return asset.isPositive;
    } else if (activeCategory === 'Losers') {
      return !asset.isPositive;
    }
    return true;
  });

  const watchlistSymbols = user?.watchlist || [];
  const watchlistAssets = assets.filter(asset => watchlistSymbols.includes(asset.symbol));

  return (
    <div className="pt-[73px] flex-1 flex flex-col">
      {/* 1. FIXED HEADER */}
      <header className={`fixed top-0 left-0 right-0 w-full z-40 backdrop-blur-xl ${isDark ? 'bg-black/90' : 'bg-white/90'} border-b ${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center box-border`}>
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
      <div className="px-4 py-4 sticky top-[73px] z-30">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search BTC, ETH, SOL..." 
             className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium ${isDark ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all`}
          />
        </div>
      </div>

      {/* 3. CATEGORY TABS */}
      <div className="flex overflow-x-auto gap-1 px-4 pb-4 scrollbar-hide sticky top-[157px] z-30">
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

      {/* 4. WATCHLIST */}
      {user && activeCategory !== 'Favorites' && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary} flex items-center gap-1.5`}>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Your Watchlist
            </h3>
            <span className="text-[11px] font-bold text-emerald-500">
              {watchlistAssets.length} tracked
            </span>
          </div>

          {watchlistAssets.length === 0 ? (
            <div className={`rounded-2xl p-6 text-center border border-dashed ${isDark ? 'border-white/10 bg-slate-900/10' : 'border-slate-200 bg-slate-50'}`}>
              <Star className="w-6 h-6 text-slate-500 mx-auto mb-2 opacity-40" />
              <p className={`text-xs font-bold ${textPrimary} mb-0.5`}>Watchlist is empty</p>
              <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto">
                Tap the star icon next to assets to monitor them here.
              </p>
            </div>
          ) : (
            <div className={`rounded-[20px] overflow-hidden ${cardClasses} shadow-sm`}>
              {watchlistAssets.map((asset, i) => (
                <div 
                  key={`watch-${asset.symbol}-${i}`}
                  onClick={() => onSelectAsset(asset)}
                  className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                    i !== watchlistAssets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''
                  } ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <CoinLogo symbol={asset.symbol} size={24} />
                    <div>
                      <p className={`font-black text-xs sm:text-sm tracking-tight ${textPrimary}`}>{asset.name}</p>
                      <p className={`text-[9px] font-bold ${textSecondary} uppercase`}>{asset.symbol}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-20 h-6">
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

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-black text-xs sm:text-sm ${textPrimary}`}>{formatCurrency(asset.price)}</p>
                      <p className={`text-[9px] font-black ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {asset.change}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => toggleWatchlist(e, asset.symbol)}
                      className="p-1"
                    >
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. LIVE MARKET LIST */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-black uppercase tracking-wider ${textSecondary}`}>
            {activeCategory === 'Favorites' ? 'Your Favorites' : 'Market Overview'}
          </h3>
          <span className="text-[11px] font-bold text-gray-500">
            {filteredAssets.length} assets
          </span>
        </div>
        <div className={`rounded-[24px] overflow-hidden ${cardClasses} shadow-xl`}>
          {loading && filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">Retrieving digital assets...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No assets matching criteria.</div>
          ) : (
            filteredAssets.map((asset, i) => (
              <motion.div 
                key={`${asset.symbol}-${i}`} 
                onClick={() => onSelectAsset(asset)} 
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${i !== filteredAssets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => toggleWatchlist(e, asset.symbol)}
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
                    <p className={`font-black text-sm ${textPrimary}`}>{formatCurrency(asset.price)}</p>
                    <p className={`text-[11px] font-black ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                      {asset.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {asset.change}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 6. MARKET NEWS */}
      <div className="px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-black tracking-tight ${textPrimary} flex items-center gap-2`}>
            <Newspaper className="w-5 h-5 text-indigo-500" />
            Financial Intelligence
          </h3>
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Auto-Updated
          </span>
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
                    {item.relatedAsset && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-black px-1.5 py-0.5 rounded uppercase">
                        {item.relatedAsset}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">{item.time}</span>
                </div>
                <h4 className={`text-sm font-bold leading-snug ${textPrimary} hover:text-emerald-500 transition-colors mb-2 line-clamp-2`}>
                  {item.headline}
                </h4>
                <div className="flex justify-end">
                  <span className="text-xs text-emerald-500 font-bold hover:underline flex items-center gap-0.5">
                    Read Article <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. FLOATING ACTION BUTTON */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-40">
        <QrCode size={24} className="text-white" />
      </button>

    </div>
  );
}
