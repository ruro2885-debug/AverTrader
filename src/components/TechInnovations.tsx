import React, { useState } from 'react';
import { Cpu, Zap, Shield, Eye, Network } from 'lucide-react';

export default function TechInnovations({ theme }: { theme: 'light' | 'dark' }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      title: 'AverCore AI™ Engine',
      subtitle: 'PLATFORM\'S EXCLUSIVE INTELLIGENCE CORE',
      icon: Cpu,
      description: 'The neural foundation of the Aver ecosystem. AverCore AI™ handles massive multi-source financial pipelines, performing natural language sentiment audits, statistical modeling, and system self-optimization in milliseconds.',
      features: [
        'Dynamic neural sentiment weighting',
        'Multi-vector deep reinforcement training',
        'Sub-millisecond data pipelines',
        'Autonomous load and telemetry scaling'
      ]
    },
    {
      title: 'Precision Entry Optimizer™',
      subtitle: 'SUB-MILLISECOND ENTRY REGISTRATION',
      icon: Zap,
      description: 'PEO™ calculates liquidity density across global decentralized venues to execute institutional positions with ultra-low slippage and microsecond speed.',
      features: [
        'Direct co-location liquidity routing',
        'Zero-slippage order fragmentation',
        'Dynamic order book depth analysis',
        'Real-time MEV protection barrier'
      ]
    },
    {
      title: 'Zero-Knowledge Defense Vault',
      subtitle: 'SOVEREIGN CAPITAL & KEY ISOLATION',
      icon: Shield,
      description: 'Aver protects client capital and parameters using an advanced cryptographic shell. With full zero-knowledge key isolation, no personal keys or credentials are ever exposed.',
      features: [
        'AES-256-GCM hardware key isolation',
        'Zero-knowledge session authentication',
        'Autonomous AI security firewalls',
        'Multi-signature execution consensus'
      ]
    }
  ];

  const currentTab = tabs[activeTab];
  const Icon = currentTab.icon;

  return (
    <section className="py-16 md:py-24 px-4 sm:px-8 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Architected For Sovereign Precision.
          </h2>
          <p className="text-base sm:text-lg font-extrabold text-slate-100">
            Aver eliminates latency, opaque market maker spreads, and execution slippage through custom-engineered quantitative infrastructure.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-3">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-6 py-3.5 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
                activeTab === idx 
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105' 
                  : 'bg-slate-900 border border-white/10 text-white hover:bg-slate-800'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Selected Card Details */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/15 bg-slate-900/90 p-8 sm:p-12 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">{currentTab.title}</h3>
              <p className="text-xs sm:text-sm font-black text-emerald-400 tracking-wider uppercase">{currentTab.subtitle}</p>
            </div>
          </div>

          <p className="text-base sm:text-xl font-extrabold leading-relaxed text-slate-100">
            {currentTab.description}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            {currentTab.features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 font-extrabold text-sm sm:text-base text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
