import { motion } from 'motion/react';
import { 
  TrendingUp, Bot, Users, Sparkles, Flame, Calendar, BookOpen, ChevronRight, PlayCircle
} from 'lucide-react';
import CoinLogo from './CoinLogo';

export default function DiscoverView({ theme }: { theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';
  
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  const trendingAssets = [
    { symbol: 'AVR', name: 'Aver', price: '$1.24', change: '+12.4%', isPositive: true },
    { symbol: 'SOL', name: 'Solana', price: '$145.60', change: '+8.2%', isPositive: true },
    { symbol: 'FET', name: 'Fetch.ai', price: '$2.15', change: '+15.7%', isPositive: true },
  ];

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
          <h2 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Discover</h2>
          <p className={`text-sm ${textSecondary} mt-1`}>Explore opportunities and insights</p>
        </div>
      </div>

      {/* Featured Banner */}
      <div className={`rounded-[24px] overflow-hidden relative ${isDark ? 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80' : 'bg-gradient-to-r from-indigo-500 to-purple-600'} p-6 sm:p-8 text-white shadow-lg`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-4 backdrop-blur-md border border-white/20">
            Platform Update
          </span>
          <h3 className="text-xl sm:text-2xl font-bold mb-2">AverNoxTrader v2.0 is Almost Here</h3>
          <p className="text-sm text-white/80 max-w-sm mb-6">A major upgrade is on the way with smarter AI trading, improved copy trading, faster performance, and exciting new features. Stay tuned for the official release.</p>
          <button disabled className="px-5 py-2.5 rounded-xl bg-white/10 text-white/50 font-bold text-sm cursor-not-allowed border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-colors">
            Coming Soon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trending */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Flame className="w-5 h-5 mr-2 text-orange-500" />
              Trending Assets
            </h3>
            <button className={`text-xs font-bold text-orange-500 hover:text-orange-400`}>View All</button>
          </div>
          <div className={`rounded-[20px] overflow-hidden ${cardClasses}`}>
            {trendingAssets.map((asset, i) => (
              <div key={asset.symbol} className={`flex items-center justify-between p-4 ${i !== trendingAssets.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''}`}>
                <div className="flex items-center space-x-3">
                  <CoinLogo symbol={asset.symbol} size={36} />
                  <div>
                    <p className={`font-bold text-sm ${textPrimary}`}>{asset.symbol}</p>
                    <p className={`text-[11px] ${textSecondary}`}>{asset.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${textPrimary}`}>{asset.price}</p>
                  <p className={`text-[11px] font-medium flex items-center justify-end mt-0.5 ${asset.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {asset.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Strategies */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className={`text-lg font-bold ${textPrimary} flex items-center`}>
              <Bot className="w-5 h-5 mr-2 text-emerald-500" />
              Featured AI Strategies
            </h3>
          </div>
          <div className={`rounded-[20px] p-5 ${cardClasses}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className={`font-bold text-base ${textPrimary}`}>Quantum Momentum</h4>
                <p className={`text-xs ${textSecondary} mt-0.5`}>High-frequency trend following</p>
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold uppercase">
                +42.8% APY
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-5">
              <div>
                <p className={`text-[10px] ${textSecondary}`}>Risk Level</p>
                <p className={`text-sm font-bold text-amber-500`}>Medium</p>
              </div>
              <div>
                <p className={`text-[10px] ${textSecondary}`}>Active Users</p>
                <p className={`text-sm font-bold ${textPrimary}`}>12,450</p>
              </div>
            </div>
            <button className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}>
              Analyze Strategy
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Top Copy Traders', icon: Users, color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
          { title: 'Market Highlights', icon: Sparkles, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
          { title: 'Events & Promos', icon: Calendar, color: 'text-purple-500', bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50' },
          { title: 'Aver Academy', icon: BookOpen, color: 'text-emerald-500', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
        ].map((item, i) => (
          <button key={i} className={`p-5 rounded-[20px] ${cardClasses} flex flex-col items-start transition-transform hover:scale-[1.02] text-left group`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <h4 className={`font-bold text-sm ${textPrimary} mb-1`}>{item.title}</h4>
            <div className={`flex items-center text-[11px] ${textSecondary} group-hover:text-emerald-500 transition-colors`}>
              Explore <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        ))}
      </div>
      
    </motion.div>
  );
}