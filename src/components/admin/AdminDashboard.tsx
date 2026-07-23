import React from 'react';
import { Users, DollarSign, ShieldCheck, ArrowDownLeft, ArrowUpRight, TrendingUp, Activity, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  theme: string;
}

export default function AdminDashboard({ theme }: AdminDashboardProps) {
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 inline-block mb-2">
            Administrator Portal
          </span>
          <h1 className="text-2xl font-black tracking-tight">Platform Control Center</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Overview of global platform metrics, user activities, and pending verifications.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Node Connected</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold ${textSecondary}`}>Total Platform Users</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono">14,892</div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-500 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% this week</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold ${textSecondary}`}>Active Vault Capital</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono">$48,290,412</div>
          <div className="flex items-center space-x-1 mt-2 text-xs text-emerald-500 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.2% volume</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold ${textSecondary}`}>Pending KYC Reviews</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono">38</div>
          <div className={`flex items-center space-x-1 mt-2 text-xs ${textSecondary}`}>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Requires administrative action</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${cardBg} shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold ${textSecondary}`}>Pending Withdrawals</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono">14 ($184.2K)</div>
          <div className={`flex items-center space-x-1 mt-2 text-xs ${textSecondary}`}>
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            <span>Average approval time: 4.2m</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Placeholder */}
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Recent System Activity & Audit Trail</h3>
          <span className="text-xs font-mono text-emerald-500 px-2.5 py-1 rounded bg-emerald-500/10">Real-Time Sync</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'} font-mono text-xs uppercase`}>
                <th className="pb-3 font-semibold">Event ID</th>
                <th className="pb-3 font-semibold">User / Entity</th>
                <th className="pb-3 font-semibold">Action</th>
                <th className="pb-3 font-semibold">Amount / Details</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {[
                { id: 'EVT-9842', user: 'alex.trader@example.com', action: 'Deposit Request', details: '$12,500.00 USDT', status: 'Completed', time: '2 mins ago' },
                { id: 'EVT-9841', user: 'sarah.fin@example.com', action: 'KYC Tier 2 Submission', details: 'Passport & Proof of Address', status: 'Pending', time: '8 mins ago' },
                { id: 'EVT-9840', user: 'marcus.v@example.com', action: 'Withdrawal Request', details: '$4,200.00 ETH', status: 'Reviewing', time: '14 mins ago' },
                { id: 'EVT-9839', user: 'elena.rostova@example.com', action: 'Support Ticket #1042', details: 'API Rate limit query', status: 'Open', time: '25 mins ago' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-4 font-mono text-xs font-bold text-emerald-500">{row.id}</td>
                  <td className="py-4 font-medium">{row.user}</td>
                  <td className="py-4">{row.action}</td>
                  <td className="py-4 font-mono text-xs">{row.details}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                      row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      row.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                      row.status === 'Reviewing' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-purple-500/10 text-purple-500'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`py-4 text-xs ${textSecondary}`}>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
