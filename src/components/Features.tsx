import React from 'react';
import { Network, Shield, Cpu } from 'lucide-react';

export default function Features({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <section className="py-16 md:py-24 px-4 sm:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Routing Feature */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
              <Network className="w-8 h-8" />
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white">
              Sub-Millisecond Algorithmic Routing.
            </h3>
            <p className="text-base sm:text-xl font-extrabold leading-relaxed text-slate-100">
              Aver bypasses conventional retail gateways, utilizing direct co-location pathways to major decentralized liquidity pools. This architecture eliminates middleman latency, ensuring your autonomous systems execute precisely at the projected entry price.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
                <h4 className="text-lg font-black text-white">Latency Optimized</h4>
                <p className="text-sm font-extrabold text-slate-200">Average execution ping &lt; 0.8ms to primary nodes.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
                <h4 className="text-lg font-black text-white">Smart Order Split</h4>
                <p className="text-sm font-extrabold text-slate-200">Automatically fragments large allocations to mask intent.</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl backdrop-blur-xl space-y-4">
            <p className="text-xs font-black uppercase text-emerald-400 tracking-wider">LIVE NODE EXECUTION PIPELINE</p>
            <div className="space-y-3 font-mono text-sm font-bold text-slate-200">
              <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-white/10">
                <span>NEW YORK CO-LOC NODE</span>
                <span className="text-emerald-400">0.24ms CONNECTED</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-white/10">
                <span>LONDON QUANT HUB</span>
                <span className="text-emerald-400">0.41ms CONNECTED</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-white/10">
                <span>TOKYO MEV BLOCKER</span>
                <span className="text-teal-400">0.62ms ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Defense Vault Feature */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="p-8 rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl backdrop-blur-xl space-y-4 order-2 lg:order-1">
            <p className="text-xs font-black uppercase text-teal-400 tracking-wider">HARDWARE SECURITY MODULE STATUS</p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3 font-mono text-sm font-bold text-slate-200">
              <div className="flex justify-between">
                <span>ENCRYPTION STANDARD</span>
                <span className="text-white">AES-256-GCM HARDWARE</span>
              </div>
              <div className="flex justify-between">
                <span>ZERO KNOWLEDGE SHELL</span>
                <span className="text-emerald-400">ISOLATED & SECURE</span>
              </div>
              <div className="flex justify-between">
                <span>ANOMALY FIREWALL</span>
                <span className="text-emerald-400">0 BREACH VECTORS</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-400 w-fit">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white">
              Zero-Knowledge Defense Vault.
            </h3>
            <p className="text-base sm:text-xl font-extrabold leading-relaxed text-slate-100">
              Aver protects client capital and secure parameters using an advanced cryptographic shell. With full zero-knowledge key isolation, no personal identifiers or access keys are ever stored on-chain or on centralized databases, insulating you from breach vectors.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
                <h4 className="text-lg font-black text-white">Military-Grade Encryption</h4>
                <p className="text-sm font-extrabold text-slate-200">AES-256-GCM hardware key isolation across multi-signature clusters.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
                <h4 className="text-lg font-black text-white">Anomaly Blockers</h4>
                <p className="text-sm font-extrabold text-slate-200">Autonomous AI firewalls isolate suspicious network actions in real-time.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
