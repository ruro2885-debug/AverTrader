import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../types';
import { 
  ArrowLeft, ArrowRight, Pause, Play, ChevronLeft, 
  Activity, Shield, Wallet, Cpu, BarChart3, Lock,
  TrendingUp, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePreferences } from '../contexts/PreferencesContext';

interface PlatformShowcaseProps {
  theme: Theme;
  onBack: () => void;
  key?: string;
}

const MODULES = [
  {
    id: 'dashboard',
    title: 'AI Trading Dashboard',
    icon: Activity,
    explanation: 'A comprehensive command center that aggregates market data, open positions, and execution metrics into a single, unified interface.',
    capabilities: [
      'Real-time multi-exchange order book visualization',
      'One-click trade execution with smart routing',
      'Dynamic margin and leverage tracking'
    ],
    benefits: 'Enables rapid decision-making by eliminating screen clutter and presenting only actionable, high-priority data.',
    aiRole: 'AverCore AI™ continuously adjusts the dashboard layout based on market volatility and the user\'s historical trading patterns.',
  },
  {
    id: 'portfolio',
    title: 'Smart Portfolio Management',
    icon: BarChart3,
    explanation: 'An automated wealth tracking system that monitors cross-asset allocations and calculates real-time risk exposure across your entire portfolio.',
    capabilities: [
      'Automated rebalancing recommendations',
      'Historical performance attribution and benchmarking',
      'Tax-optimized lot selection modeling'
    ],
    benefits: 'Reduces manual oversight and ensures your portfolio remains aligned with your long-term risk tolerance.',
    aiRole: 'AverCore AI™ runs millions of Monte Carlo simulations per minute to predict potential portfolio drawdowns before they occur.',
  },
  {
    id: 'intelligence',
    title: 'AI Market Intelligence',
    icon: Globe,
    explanation: 'A global socio-economic scanner that parses news, regulatory filings, and social sentiment to identify emerging market trends.',
    capabilities: [
      'Natural language processing of real-time news feeds',
      'Social sentiment divergence tracking',
      'Macro-economic event impact forecasting'
    ],
    benefits: 'Keeps you ahead of the curve by surfacing hidden catalysts and potential market-moving events before they reflect in price.',
    aiRole: 'AverCore AI™ cross-references linguistic patterns with historical market reactions to generate proprietary confidence scores.',
  },
  {
    id: 'wallet',
    title: 'Secure Wallet & Deposit Center',
    icon: Wallet,
    explanation: 'A fully integrated, multi-currency custody solution that bridges traditional fiat banking pipelines with decentralized blockchain networks.',
    capabilities: [
      'Instant fiat-to-crypto conversion routing',
      'Yield-generating idle capital allocation',
      'Multi-signature withdrawal approval flows'
    ],
    benefits: 'Consolidates all financial assets into a single, highly liquid ecosystem without sacrificing institutional-grade security.',
    aiRole: 'AverCore AI™ optimizes network gas fees and routes deposits through the most efficient liquidity pools available.',
  },
  {
    id: 'assistant',
    title: 'Aver Core AI Assistant',
    icon: Cpu,
    explanation: 'An interactive, conversational neural network designed to act as your personal quantitative analyst and platform guide.',
    capabilities: [
      'Context-aware query resolution and support',
      'Custom algorithm generation via natural language',
      'On-demand technical analysis summaries'
    ],
    benefits: 'Democratizes complex quantitative analysis by allowing users to interact with institutional data using everyday language.',
    aiRole: 'AverCore AI™ is the foundation of this module, utilizing advanced LLMs fine-tuned specifically on financial and regulatory datasets.',
  },
  {
    id: 'security',
    title: 'Security Center',
    icon: Shield,
    explanation: 'The command module for managing platform access, cryptographic keys, and active defense mechanisms protecting your account.',
    capabilities: [
      'Zero-knowledge hardware key integration',
      'Biometric authentication threshold management',
      'Real-time anomaly detection and session termination'
    ],
    benefits: 'Provides absolute peace of mind by granting you total control over the defensive perimeter of your assets.',
    aiRole: 'AverCore AI™ monitors session telemetry globally to proactively identify and neutralize sophisticated cyber threats.',
  }
];

export default function PlatformShowcase({ theme, onBack }: PlatformShowcaseProps) {
  const isDark = theme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = usePreferences();
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MODULES.length);
    }, 8000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [isPlaying, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MODULES.length);
    if (isPlaying) startTimer();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + MODULES.length) % MODULES.length);
    if (isPlaying) startTimer();
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const activeModule = MODULES[currentIndex];
  const ModuleIcon = activeModule.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} pb-24`}
    >
      {/* Top Navigation */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? 'border-white/5 bg-black/50' : 'border-slate-200 bg-white/70'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={onBack}
            className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Main</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className={`text-xs font-mono px-3 py-1.5 rounded-full ${isDark ? 'bg-white/5 text-gray-300' : 'bg-black/5 text-gray-600'}`}>
              Platform Showcase
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 lg:pt-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
          
          {/* Device Mockups (Left Column) */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[500px]">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-2xl aspect-video perspective-1000">
              
              {/* Desktop Monitor */}
              <motion.div 
                className={`absolute inset-0 z-10 rounded-xl shadow-2xl border-[10px] overflow-hidden transform-gpu flex flex-col ${isDark ? 'bg-[#050505] border-[#1a1a1a]' : 'bg-[#fafafa] border-[#d4d4d4]'}`}
                style={{ boxShadow: isDark ? '0 30px 60px -12px rgba(0,0,0,0.8)' : '0 30px 60px -12px rgba(0,0,0,0.3)' }}
              >
                {/* Desktop Top Bar */}
                <div className={`h-6 w-full flex items-center px-3 space-x-2 ${isDark ? 'bg-gray-950' : 'bg-gray-300'}`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                {/* Desktop Content */}
                <div className="flex-1 relative overflow-hidden p-6 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="flex-1 flex flex-col"
                    >
                      <div className="flex items-center space-x-3 mb-6">
                        <activeModule.icon className="w-8 h-8 text-emerald-400" />
                        <h3 className="font-display font-bold text-2xl">{activeModule.title}</h3>
                      </div>
                      
                      {/* Fake UI Skeleton */}
                      <div className="flex-1 flex gap-4">
                        <div className={`w-1/3 rounded-xl p-4 flex flex-col gap-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div className={`h-4 w-1/2 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                          <div className={`h-20 w-full rounded-lg ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                          <div className={`h-20 w-full rounded-lg ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                        </div>
                        <div className={`flex-1 rounded-xl p-4 flex flex-col ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div className={`h-4 w-1/4 rounded mb-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                          <div className={`flex-1 rounded-lg w-full overflow-hidden relative ${isDark ? 'bg-gradient-to-t from-emerald-500/20 to-transparent' : 'bg-gradient-to-t from-emerald-500/10 to-transparent'}`}>
                             {/* Fake chart bars */}
                             <div className="absolute bottom-0 left-4 w-8 h-1/2 bg-emerald-400/50 rounded-t" />
                             <div className="absolute bottom-0 left-16 w-8 h-3/4 bg-emerald-400/50 rounded-t" />
                             <div className="absolute bottom-0 left-28 w-8 h-1/4 bg-emerald-400/50 rounded-t" />
                             <div className="absolute bottom-0 left-40 w-8 h-5/6 bg-emerald-400/50 rounded-t" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Tablet Mockup */}
              <motion.div 
                className={`absolute -right-16 -bottom-16 z-20 w-72 h-[380px] rounded-[1.75rem] shadow-2xl border-[10px] transform-gpu flex flex-col overflow-hidden ${isDark ? 'bg-[#0a0a0a] border-[#151515] ring-1 ring-white/10' : 'bg-[#fafafa] border-[#e0e0e0] ring-1 ring-black/10'}`}
                style={{ boxShadow: isDark ? '-15px 25px 50px rgba(0,0,0,0.9)' : '-15px 25px 50px rgba(0,0,0,0.3)' }}
              >
                <div className="flex-1 relative p-4 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule.id + "-tablet"}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex-1 flex flex-col"
                    >
                       <div className="flex items-center space-x-2 mb-4">
                        <activeModule.icon className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-display font-bold text-sm truncate">{activeModule.title}</h4>
                      </div>
                      <div className={`flex-1 rounded-xl p-3 flex flex-col gap-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                        <div className={`h-3 w-3/4 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                        <div className={`h-8 w-full rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                        <div className={`h-8 w-full rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                        <div className={`h-8 w-full rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Smartphone Mockup */}
              <motion.div 
                className={`absolute -left-12 -bottom-10 z-30 w-44 h-[340px] rounded-[2.5rem] shadow-2xl border-[12px] transform-gpu flex flex-col overflow-hidden ${isDark ? 'bg-[#0a0a0a] border-[#111] ring-1 ring-white/10' : 'bg-[#fff] border-[#e5e5e5] ring-1 ring-black/10'}`}
                style={{ boxShadow: isDark ? '20px 20px 50px rgba(0,0,0,0.9)' : '20px 20px 50px rgba(0,0,0,0.3)' }}
              >
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-50">
                  <div className={`w-1/2 h-full rounded-b-xl ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`} />
                </div>
                <div className="flex-1 relative p-4 pt-8 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule.id + "-phone"}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex-1 flex flex-col items-center justify-center"
                    >
                      <activeModule.icon className="w-12 h-12 text-emerald-400 mb-4" />
                      <div className={`h-2 w-2/3 rounded mb-2 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <div className={`h-2 w-1/2 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      
                      <div className={`mt-6 w-16 h-16 rounded-full border-4 flex items-center justify-center ${isDark ? 'border-emerald-500/30' : 'border-emerald-500/50'}`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

            </div>
          </div>

          {/* Information Panel (Right Column) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
            
            {/* Header */}
            <div>
              <motion.div 
                key={activeModule.id + "title"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3 mb-4"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ModuleIcon className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
                  {activeModule.title}
                </h2>
              </motion.div>
              <p className={`text-lg font-sans font-light leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {activeModule.explanation}
              </p>
            </div>

            {/* Details */}
            <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
              
              <div>
                <h4 className={`text-xs font-mono font-bold tracking-wider uppercase mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Primary Capabilities
                </h4>
                <ul className="space-y-2">
                  {activeModule.capabilities.map((cap, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                      <span className={`text-sm font-sans ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className={`text-xs font-mono font-bold tracking-wider uppercase mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  User Benefit
                </h4>
                <p className={`text-sm font-sans ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {activeModule.benefits}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <h4 className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider uppercase mb-2 text-emerald-500">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>AverCore AI™ Integration</span>
                </h4>
                <p className={`text-sm font-sans ${isDark ? 'text-gray-300' : 'text-emerald-900'}`}>
                  {activeModule.aiRole}
                </p>
              </div>

            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrev}
                  className={`p-3 rounded-full border transition-colors ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-900'}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={togglePlay}
                  className={`p-3 rounded-full border transition-colors ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-900'}`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleNext}
                  className={`p-3 rounded-full border transition-colors ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-slate-300 hover:bg-slate-200 text-slate-900'}`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className={`text-xs font-bold font-mono tracking-wider uppercase ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Preview {currentIndex + 1} of {MODULES.length}
              </div>
            </div>

          </div>
        </div>

        {/* Final CTA */}
        {currentIndex === MODULES.length - 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-24 p-12 text-center rounded-3xl border ${isDark ? 'bg-gradient-to-b from-slate-900 to-black border-white/10' : 'bg-gradient-to-b from-slate-100 to-white border-slate-200'}`}
          >
            <h3 className="font-display font-bold text-3xl mb-4">{t("show.ready.title")}</h3>
            <p className={`max-w-2xl mx-auto font-sans font-light mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t("show.ready.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => {
                  onBack();
                  setTimeout(() => {
                    const el = document.getElementById('preview');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all shadow-lg flex items-center space-x-2"
              >
                <span>{t("auth.register")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  onBack();
                }}
                className={`px-8 py-4 rounded-full font-bold transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black'}`}
              >
                {t("auth.signin")}
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}
