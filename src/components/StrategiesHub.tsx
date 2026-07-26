import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Cpu, TrendingUp, Zap, Shield,
  ChevronRight, CheckCircle2, AlertTriangle, Rocket,
  Info, Activity, Target, Layers, BarChart2, Compass, Bookmark
} from 'lucide-react';
import { STRATEGIES, STRATEGY_CATEGORIES, Strategy } from '../data/strategies';
import { useTradingEngine } from '../contexts/TradingEngineContext';
import { useAuth } from '../contexts/AuthContext';
import { AiConfiguration } from '../types/aiTrading';
import { Timestamp } from 'firebase/firestore';

interface StrategiesHubProps {
  theme: 'light' | 'dark';
  onBack: () => void;
}

export default function StrategiesHub({ theme, onBack }: StrategiesHubProps) {
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const { saveConfiguration } = useTradingEngine();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const filteredStrategies = useMemo(() => {
    return STRATEGIES.filter(strat => {
      const matchesCategory = selectedCategory === 'All' || strat.category === selectedCategory;
      const matchesSearch = strat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           strat.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSaveConfiguration = async (strategy: Strategy) => {
    setIsSaving(true);
    const userId = user?.uid || 'guest_user';
    
    try {
      // Map Strategy data to AiConfiguration
      const newConfig: AiConfiguration = {
        id: `cfg_strat_${strategy.id}_${Date.now()}`,
        ownerId: userId,
        name: strategy.name,
        createdAt: Timestamp.now(),
        lastModified: Timestamp.now(),
        status: 'ACTIVE',
        sessionSetup: {
          amountToAllocate: 1000,
          fundingSource: 'WALLET',
          sessionDuration: 24
        },
        profitRiskManagement: {
          sessionTakeProfit: parseFloat(strategy.apy.replace(/[^0-9.]/g, '')) / 12 || 5, // Estimated monthly TP
          sessionStopLoss: parseFloat(strategy.maxDrawdown.replace(/[^0-9.]/g, '')) || 5,
          maxRiskPerTrade: 1.5,
          maxPositionSize: 500
        },
        aiTradingRules: {
          minConfidence: 85,
          maxSimultaneousPositions: 3,
          assetSelection: ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK'],
          tradingStrategy: mapCategoryToStrategy(strategy.category)
        },
        configurationDetails: {
          description: strategy.description,
          category: strategy.category,
          version: '1.0.0'
        },
        analyticsAndNotes: {
          riskScore: strategy.riskLevel === 'Low' ? 25 : strategy.riskLevel === 'Medium' ? 50 : strategy.riskLevel === 'High' ? 75 : 90,
          strategyNotes: strategy.howItWorks,
          performanceStats: {
            winRate: parseFloat(strategy.successRate.replace(/[^0-9.]/g, '')),
            totalReturn: parseFloat(strategy.apy.replace(/[^0-9.]/g, '')),
            drawdown: parseFloat(strategy.maxDrawdown.replace(/[^0-9.]/g, ''))
          }
        },
        notificationPreferences: {
          newRecommendations: true,
          tradeExecutions: true,
          marketAlerts: false
        }
      };

      await saveConfiguration(newConfig);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        setSelectedStrategy(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to save configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const mapCategoryToStrategy = (category: string): AiConfiguration['aiTradingRules']['tradingStrategy'] => {
    switch (category) {
      case 'Momentum': return 'NEURAL_MOMENTUM';
      case 'Trend Following': return 'NEURAL_MOMENTUM';
      case 'Volatility': return 'VOLATILITY_BREAKOUT';
      case 'Breakout': return 'VOLATILITY_BREAKOUT';
      case 'Mean Reversion': return 'MEAN_REVERSION';
      case 'Grid': return 'QUANT_GRID';
      default: return 'NEURAL_MOMENTUM';
    }
  };

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgMain = isDark ? "bg-[#05080c]" : "bg-slate-50";

  return (
    <div className={`min-h-screen ${bgMain} pb-20 font-sans selection:bg-emerald-500/30`}>
      {/* Premium Header */}
      <div className={`sticky top-0 z-40 ${isDark ? 'bg-[#05080c]/80' : 'bg-slate-50/80'} backdrop-blur-2xl border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className={`p-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-500 shadow-sm'} transition-all border border-transparent`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="space-y-0.5">
              <h1 className={`text-2xl font-black ${textPrimary} tracking-tight leading-none uppercase`}>Strategy Hub</h1>
              <p className={`text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] opacity-80`}>Global Intelligence Layer</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl">
            <div className={`relative w-full group`}>
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-emerald-500 transition-colors`} />
              <input 
                type="text" 
                placeholder="Search institutional quantitative models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-6 py-3.5 rounded-[20px] text-sm outline-none transition-all ${
                  isDark ? 'bg-white/5 border-white/5 focus:bg-white/10 focus:border-emerald-500/30 text-white placeholder:text-slate-700' : 'bg-white border-slate-200 focus:border-emerald-500/30 shadow-sm text-slate-900 placeholder:text-slate-400'
                } border font-medium`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Engine v4.2</span>
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
            {STRATEGY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border uppercase tracking-widest ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-xl shadow-emerald-500/20' 
                    : isDark ? 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-500/30 shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16">
        {/* Intro Section */}
        <div className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-12"
          >
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-1px bg-emerald-500/30" />
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">Quantitative Strategy Laboratory</span>
              </div>
              <h2 className={`text-6xl font-black ${textPrimary} mb-8 leading-[0.9] tracking-tighter`}>
                Institutional <span className="text-emerald-500">AI Logic.</span><br />
                Tailored Performance.
              </h2>
              <p className={`text-lg ${textSecondary} font-medium leading-relaxed opacity-80 max-w-2xl`}>
                Deploy battle-tested algorithmic configurations. Every strategy is powered by our proprietary Neural Engine, combining real-time sentiment analysis with high-frequency quantitative modeling.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'} flex flex-col justify-center`}>
                <div className="text-emerald-500 font-black text-4xl mb-1">98.4<span className="text-xl opacity-60">%</span></div>
                <div className={`text-[10px] font-black ${textSecondary} uppercase tracking-[0.2em] opacity-60`}>Execution Efficiency</div>
              </div>
              <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'} flex flex-col justify-center`}>
                <div className="text-emerald-500 font-black text-4xl mb-1">20ms</div>
                <div className={`text-[10px] font-black ${textSecondary} uppercase tracking-[0.2em] opacity-60`}>Latency Response</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Strategy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredStrategies.map((strat, idx) => (
              <StrategyCard 
                key={strat.id}
                strategy={strat}
                theme={theme}
                index={idx}
                onClick={() => setSelectedStrategy(strat)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredStrategies.length === 0 && (
          <div className="py-40 text-center">
            <div className={`w-24 h-24 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'} flex items-center justify-center mx-auto mb-8`}>
              <Search className={`w-10 h-10 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
            </div>
            <h3 className={`text-2xl font-black ${textPrimary} mb-3`}>No results found</h3>
            <p className={`${textSecondary} font-medium`}>Adjust your filters to find suitable quantitative models.</p>
          </div>
        )}
      </div>

      {/* Strategy Detail Overlay */}
      <AnimatePresence>
        {selectedStrategy && (
          <StrategyDetail 
            strategy={selectedStrategy}
            theme={theme}
            onClose={() => setSelectedStrategy(null)}
            onSave={() => handleSaveConfiguration(selectedStrategy)}
            isSaving={isSaving}
            showSuccess={showSaveSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StrategyCard({ strategy, theme, onClick, index }: { strategy: Strategy; theme: 'light' | 'dark'; onClick: () => void; index: number; key?: string | number }) {
  const isDark = theme === 'dark';
  const Icon = strategy.icon;
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.19, 1, 0.22, 1] }}
      whileHover={{ y: -8 }}
      onClick={onClick}
      className={`group cursor-pointer p-8 rounded-[40px] border transition-all relative overflow-hidden flex flex-col h-[420px] ${
        isDark ? 'bg-[#0d131f]/60 border-white/5 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-500/30 shadow-xl shadow-slate-200/40'
      }`}
    >
      {/* Decorative Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors`} />
      
      <div className="flex items-start justify-between mb-10 relative z-10">
        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-500 ${
          isDark ? 'bg-white/5 border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10' : 'bg-slate-50 border-slate-100 group-hover:border-emerald-500/30 group-hover:bg-emerald-50'
        }`}>
          <Icon className={`w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform duration-500`} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-emerald-500 mb-0.5 tracking-tight">{strategy.apy}</div>
          <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em] opacity-60`}>Projected APY</div>
        </div>
      </div>

      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
            isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {strategy.category}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest ${textSecondary} opacity-40`}>
            {strategy.badge}
          </span>
        </div>
        <h3 className={`text-2xl font-black ${textPrimary} tracking-tight mb-3 leading-tight group-hover:text-emerald-500 transition-colors`}>{strategy.name}</h3>
        <p className={`text-sm ${textSecondary} font-medium line-clamp-3 leading-relaxed opacity-80`}>{strategy.tagline}</p>
      </div>

      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-8">
          <div>
            <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em] mb-1 opacity-60`}>Risk Index</div>
            <div className={`text-xs font-black ${
              strategy.riskLevel === 'Low' ? 'text-blue-400' :
              strategy.riskLevel === 'Medium' ? 'text-emerald-400' :
              strategy.riskLevel === 'High' ? 'text-amber-400' : 'text-rose-400'
            } uppercase tracking-widest`}>{strategy.riskLevel}</div>
          </div>
          <div>
            <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em] mb-1 opacity-60`}>Success Rate</div>
            <div className={`text-xs font-black ${textPrimary} tracking-widest`}>{strategy.successRate}</div>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
          isDark ? 'bg-white/5 text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white shadow-sm'
        }`}>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function StrategyDetail({ strategy, theme, onClose, onSave, isSaving, showSuccess }: { 
  strategy: Strategy; 
  theme: 'light' | 'dark'; 
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  showSuccess: boolean;
}) {
  const isDark = theme === 'dark';
  const Icon = strategy.icon;
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-12 bg-[#05080c]/95 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`w-full max-w-6xl h-full sm:h-auto sm:max-h-[85vh] overflow-hidden sm:rounded-[60px] shadow-2xl relative border ${
          isDark ? 'bg-[#0d131f] border-white/10' : 'bg-white border-slate-200'
        } flex flex-col`}
      >
        {/* Header Section */}
        <div className={`p-8 sm:p-12 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between`}>
          <div className="flex items-center gap-8">
            <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center border-2 ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
            }`}>
              <Icon className="w-12 h-12 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className={`text-4xl font-black ${textPrimary} tracking-tight uppercase`}>{strategy.name}</h2>
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  isDark ? 'bg-white/5 text-slate-500 border border-white/5' : 'bg-white text-slate-400 border border-slate-200 shadow-sm'
                }`}>
                  {strategy.category}
                </span>
              </div>
              <p className={`text-xl font-bold text-emerald-500 opacity-90 tracking-tight`}>{strategy.tagline}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-4 rounded-full transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white border border-white/5' : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 sm:p-16 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            {/* Left Column: Intelligence */}
            <div className="lg:col-span-7 space-y-16">
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <h4 className={`text-xs font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Strategy Overview</h4>
                </div>
                <p className={`text-xl ${textSecondary} leading-[1.6] font-medium opacity-90`}>{strategy.description}</p>
              </section>

              <div className="grid grid-cols-2 gap-12">
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <h4 className={`text-xs font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Ideal Market</h4>
                  </div>
                  <p className={`text-lg ${textPrimary} font-black leading-tight`}>{strategy.idealMarketConditions}</p>
                </section>
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h4 className={`text-xs font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Expected Behavior</h4>
                  </div>
                  <p className={`text-lg ${textPrimary} font-black leading-tight`}>{strategy.expectedBehavior}</p>
                </section>
              </div>

              <section className={`p-10 rounded-[48px] ${isDark ? 'bg-white/[0.02] border border-white/5' : 'bg-slate-50 border border-slate-200 shadow-inner'}`}>
                <div className="flex items-center gap-4 mb-10">
                  <Cpu className="w-6 h-6 text-emerald-500" />
                  <h4 className={`text-xs font-black uppercase tracking-[0.4em] ${textPrimary}`}>AI Operational Configuration</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12">
                  {Object.entries(strategy.recommendedAiConfig).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} opacity-40`}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className={`text-sm font-black ${textPrimary} uppercase tracking-tight`}>{val}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Validation & Action */}
            <div className="lg:col-span-5 space-y-10">
              <div className={`p-12 rounded-[56px] border ${isDark ? 'bg-white/[0.03] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] ${textSecondary} mb-12 text-center opacity-40`}>Backtested Performance</h4>
                
                <div className="grid grid-cols-2 gap-y-12 gap-x-8 mb-12">
                  <div className="text-center group">
                    <div className="text-4xl font-black text-emerald-500 mb-2 tracking-tighter group-hover:scale-110 transition-transform">{strategy.apy}</div>
                    <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest opacity-60`}>Target APY</div>
                  </div>
                  <div className="text-center group">
                    <div className={`text-4xl font-black ${textPrimary} mb-2 tracking-tighter group-hover:scale-110 transition-transform`}>{strategy.successRate}</div>
                    <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest opacity-60`}>Win Rate</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-4xl font-black text-rose-500 mb-2 tracking-tighter group-hover:scale-110 transition-transform">{strategy.maxDrawdown}</div>
                    <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest opacity-60`}>Max Drawdown</div>
                  </div>
                  <div className="text-center group">
                    <div className={`text-4xl font-black ${textPrimary} mb-2 tracking-tighter group-hover:scale-110 transition-transform`}>{strategy.sharpeRatio}</div>
                    <div className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest opacity-60`}>Sharpe Ratio</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span className={`text-[11px] font-black ${textPrimary} uppercase tracking-widest`}>Risk Adjusted Capital Controls</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className={`text-[11px] font-black ${textPrimary} uppercase tracking-widest`}>Verified Quant Logic</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={onSave}
                  disabled={isSaving || showSuccess}
                  className={`w-full py-7 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 relative overflow-hidden ${
                    showSuccess 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-500/30'
                  } disabled:opacity-80`}
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  ) : showSuccess ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Configuration Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-6 h-6" />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
                
                <p className={`text-[10px] text-center font-black ${textSecondary} uppercase tracking-[0.2em] opacity-40`}>
                  Saves to Global Configuration Manager
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
