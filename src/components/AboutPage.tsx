import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Cpu, Activity, Globe, Award, CheckCircle, ExternalLink } from 'lucide-react';
import AverLogo from './AverLogo';
import { usePreferences } from '../contexts/PreferencesContext';

interface AboutPageProps {
  theme: 'light' | 'dark';
  onBack: () => void;
  onNavigateAuth?: () => void;
}

export default function AboutPage({ theme, onBack, onNavigateAuth }: AboutPageProps) {
  const isDark = theme === 'dark';
  const { t } = usePreferences();

  const milestones = [
    {
      year: '2023',
      title: 'Foundation & AI Core',
      description: 'AverTrader was conceptualized to bridge retail liquidity with institutional-grade AI execution architecture.',
    },
    {
      year: '2024',
      title: 'AverCore™ Engine Launch',
      description: 'Proprietary predictive execution protocols deployed with sub-millisecond telemetry routing.',
    },
    {
      year: '2025',
      title: 'Multi-Asset Telemetry',
      description: 'Expanded market coverage to include automated algorithmic rebalancing across global digital assets.',
    },
    {
      year: '2026',
      title: 'Global Ecosystem Expansion',
      description: 'Next-generation compliance, decentralized security vaults, and multi-tier institutional execution.',
    },
  ];

  const pillars = [
    {
      icon: Cpu,
      title: 'Predictive Intelligence',
      description: 'Self-adapting machine learning models that assess volatility and optimize entry/exit trajectories in real time.',
    },
    {
      icon: Shield,
      title: 'Institutional Security',
      description: 'Multi-layer key isolation, 2FA protocols, and automated anomaly detection protect every trading session.',
    },
    {
      icon: Activity,
      title: 'Real-Time Telemetry',
      description: 'Sub-millisecond data feeds streamed directly across major liquidity hubs worldwide.',
    },
    {
      icon: Globe,
      title: 'Global Accessibility',
      description: 'Accessible in over 190 countries with multi-language and multi-currency support.',
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header Bar */}
      <header className={`sticky top-0 z-40 h-16 border-b flex items-center justify-between px-6 backdrop-blur-md ${
        isDark ? 'bg-slate-950/80 border-white/5' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl transition-all ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AverLogo theme={theme} size={32} />
        </div>
        {onNavigateAuth && (
          <button
            onClick={onNavigateAuth}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Get Started
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Hero Banner */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL AI EXECUTION</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Engineering the Future of <span className="text-emerald-400">Algorithmic Trading</span>
          </h1>
          <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            AverTrader is an independent high-performance trading workspace and AI execution platform engineered for intelligent market telemetry, automated session management, and institutional portfolio tracking.
          </p>
        </section>

        {/* Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500/40 shadow-sm'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <pillar.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{pillar.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Timeline */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-center">Platform Evolution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <span className="text-emerald-400 font-mono font-bold text-xs">{m.year}</span>
                <h4 className="font-bold text-sm mt-1 mb-2">{m.title}</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Identity & Legal Clarity */}
        <section className={`p-8 rounded-2xl border text-center space-y-4 ${
          isDark ? 'bg-slate-900/50 border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          <h3 className="font-bold text-base">Independent Entity Disambiguation</h3>
          <p className={`text-xs max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            AverTrader (domain: avertrader.space) is a standalone cryptocurrency trading workspace and AI execution suite. It is entirely independent and not affiliated with, owned by, or associated with AvaTrade (avatrade.com), AvaTrader, TradeSpace, or any other broker.
          </p>
        </section>
      </main>
    </div>
  );
}
