#!/bin/bash
cat << 'APP' > src/components/Hero.tsx
import { Play, ArrowRight, Activity, TrendingUp, Cpu, Sparkles, ShieldAlert } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

interface HeroProps {
  theme: 'light' | 'dark';
  onShowcase: () => void;
}

export default function Hero({ theme, onShowcase }: HeroProps) {
  const isDark = theme === 'dark';
  const { t } = usePreferences();

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden w-full px-6">
      
      {/* Immersive Depth Gradients */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none transition-opacity duration-1000 ${
          isDark ? 'opacity-100' : 'opacity-60'
        }`} />
        <div className={`absolute bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none transition-opacity duration-1000 ${
          isDark ? 'opacity-100' : 'opacity-60'
        }`} />
        <div 
          className={`absolute inset-0 z-0 ${
            isDark 
              ? 'bg-gradient-to-t from-[#050505] via-transparent to-slate-950/80'
              : 'bg-gradient-to-t from-white via-transparent to-white/80'
          }`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full mt-8">
        
        {/* Typography & Call to Action (Left Column) */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          
          {/* Technology Badges */}
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono tracking-wide">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('hero.badge.ai')}</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-400 text-xs font-bold font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('hero.badge.peo')}</span>
            </span>
          </div>

          {/* Majestic Hero Headings */}
          <h1 className={`font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-6 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            <span>
              {t('hero.title.1')}
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t('hero.title.2')}
            </span>
          </h1>

          <p className={`text-base sm:text-lg max-w-xl font-sans font-light leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {t('hero.subtitle')}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
            
            {/* Get Started Button */}
            <a
              href="#tech"
              className="px-8 py-4 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{t('hero.cta.doc')}</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            {/* Explore Platform Button */}
            <button
              onClick={onShowcase}
              className={`px-8 py-4 rounded-lg font-bold border cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white backdrop-blur-md hover:bg-white/10'
                  : 'border-slate-300 hover:border-emerald-500/40 text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-emerald-50/50'
              }`}
            >
              <Play className="w-4 h-4 fill-current text-emerald-400" />
              <span>{t('hero.cta.ecosystem')}</span>
            </button>
          </div>

          {/* Under CTAs Trust Badges */}
          <div className={`flex items-center space-x-6 pt-6 border-t w-full max-w-xl ${
            isDark ? 'border-white/5 text-gray-500' : 'border-slate-100 text-gray-400'
          }`}>
            <div className="flex items-center space-x-2 text-xs font-bold font-mono uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>{t('hero.sla')}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold font-mono uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-teal-500" />
              <span>{t('hero.security')}</span>
            </div>
          </div>
        </div>

        {/* Futuristic Interactive Glass UI Floating Elements (Right Column) */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          
          {/* Main platform showcase panel container */}
          <div className="relative w-full max-w-md aspect-[4/5] sm:aspect-square lg:aspect-auto lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 hover:rotate-1">
            
            {/* Background Image: Institutional Trader Workstation with charts */}
            <img
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200"
              alt="Aver Premium Command Interface Workstation"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.45] saturate-[0.8] contrast-[1.1] scale-100"
              referrerPolicy="no-referrer"
            />
            
            {/* Visual gradient overlays for glowing container corners */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
            <div className="absolute inset-0 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-xl" />
            
            {/* Interactive floating elements inside the frame */}
            <div className="absolute inset-x-6 bottom-6 flex flex-col space-y-4">
              
              {/* Glass Element 1: Live AverCore AI Optimization Stream */}
              <div className="bg-black/40 p-4 rounded-xl flex flex-col space-y-2 border border-white/5 animate-[bounce_6s_infinite_ease-in-out]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">{t('hero.badge.ai')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">Live Optimization</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-display font-bold text-lg text-white">Entry Precision Score</span>
                  <span className="font-mono text-xs text-emerald-400 font-semibold ml-auto">+98.74%</span>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[94%] animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              {/* Glass Element 2: Precision Entry Optimizer Log */}
              <div className="bg-black/40 p-4 rounded-xl flex items-center space-x-3.5 border border-white/5 animate-[bounce_8s_infinite_ease-in-out_1s]">
                <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-mono text-teal-400 font-medium">PEO™ Active State</p>
                    <p className="text-[9px] font-mono text-gray-500">Node P-42</p>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">Target calculated at $67,420</p>
                </div>
              </div>

            </div>

            {/* Glowing neon corner bracket accents */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/40 rounded-tl" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/40 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/40 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/40 rounded-br" />
          </div>
        </div>
      </div>
    </section>
  );
}
APP
