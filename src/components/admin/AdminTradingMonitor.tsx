import React from 'react';
import { Activity, Zap, ShieldCheck } from 'lucide-react';

export default function AdminTradingMonitor({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Trading Monitor</h2>
          <p className="text-sm text-slate-500">Real-time surveillance of global AI-managed sessions and trade execution.</p>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="w-16 h-16 text-slate-800 mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">No Active Trading Sessions</h3>
        <p className="text-slate-500 max-w-sm">No live AI sessions are currently running across the platform liquidity pool.</p>
      </div>
    </div>
  );
}
