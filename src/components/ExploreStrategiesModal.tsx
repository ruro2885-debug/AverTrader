import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Strategy } from '../data/strategies';
import { useFeaturedStrategy } from '../hooks/useFeaturedStrategy';

interface ExploreStrategiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onSelectStrategy: (strategy: Strategy) => void;
}

export const ExploreStrategiesModal: React.FC<ExploreStrategiesModalProps> = ({ isOpen, onClose, theme, onSelectStrategy }) => {
  const isDark = theme === 'dark';
  const featuredStrategy = useFeaturedStrategy();

  return (
    <AnimatePresence>
      {isOpen && featuredStrategy && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '15%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-x-0 bottom-0 top-[15%] rounded-t-3xl z-50 flex flex-col ${isDark ? 'bg-[#0B0E14]' : 'bg-slate-50'}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {featuredStrategy.name}
              </h2>
              <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-200'}`}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Details View */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* Overview */}
                <div>
                  <h4 className={`text-xs font-black uppercase mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Overview</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{featuredStrategy.description}</p>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>APY</div>
                    <div className="text-xl font-black text-emerald-500">{featuredStrategy.apy}</div>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white border border-slate-200'}`}>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Confidence</div>
                    <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{featuredStrategy.aiConfidence}</div>
                  </div>
                </div>

                {/* Strategy Details Grid */}
                <div className={`rounded-xl overflow-hidden border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'}`}>
                  {[
                    { label: 'Market Type', value: featuredStrategy.category },
                    { label: 'Risk Level', value: featuredStrategy.riskLevel },
                    { label: 'Assets', value: featuredStrategy.supportedAssets.join(', ') },
                    { label: 'Timeframes', value: featuredStrategy.timeframes.join(', ') },
                    { label: 'Freq.', value: featuredStrategy.recommendedAiConfig.frequency },
                    { label: 'Capital', value: featuredStrategy.recommendedAiConfig.capitalAllocation },
                  ].map((row, i) => (
                    <div key={row.label} className={`flex items-center justify-between p-4 ${i !== 5 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''}`}>
                      <span className={`text-xs font-black uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{row.label}</span>
                      <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <h4 className={`text-xs font-black uppercase mb-2 ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>Advantages</h4>
                    <ul className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {featuredStrategy.advantages.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}>
                    <h4 className={`text-xs font-black uppercase mb-2 ${isDark ? 'text-rose-500' : 'text-rose-700'}`}>Disadvantages</h4>
                    <ul className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {featuredStrategy.disadvantages.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fixed Action Button */}
              <div className={`p-6 border-t ${isDark ? 'border-white/5 bg-[#0B0E14]' : 'border-slate-200 bg-white'}`}>
                <button
                  onClick={() => {
                    onSelectStrategy(featuredStrategy);
                    onClose();
                  }}
                  className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Use Configuration
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
