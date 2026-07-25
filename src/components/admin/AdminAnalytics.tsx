import React from 'react';
import { PieChart, TrendingUp, BarChart3, Globe } from 'lucide-react';

export default function AdminAnalytics({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-slate-500">High-level market exposure and user behavior metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <PieChart className="w-12 h-12 text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Portfolio Allocation Bias</h3>
          <p className="text-sm text-slate-500">Aggregated user holding distributions across all assets.</p>
        </div>
        <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <TrendingUp className="w-12 h-12 text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Capital Velocity</h3>
          <p className="text-sm text-slate-500">Global deposit vs withdrawal velocity and turnover.</p>
        </div>
      </div>
    </div>
  );
}
