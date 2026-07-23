import React from 'react';
import { ArrowUpRight, CheckCircle2, XCircle, ShieldAlert, Clock } from 'lucide-react';

interface AdminWithdrawalsProps {
  theme: string;
}

export default function AdminWithdrawals({ theme }: AdminWithdrawalsProps) {
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <span className="text-xs font-mono font-bold text-purple-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-purple-500/10 inline-block mb-2">
            Capital Outflow
          </span>
          <h1 className="text-2xl font-black tracking-tight">Withdrawal Approvals & Risk Checks</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Review outward withdrawal requests, automated risk scoring, and manual security sign-offs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-bold font-mono">
            14 Pending • $184,200
          </span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Pending Withdrawal Queue</h3>
          <span className="text-xs font-mono text-purple-500">Multisig Safeguard Active</span>
        </div>

        <div className="space-y-4">
          {[
            { id: 'WDR-3312', email: 'marcus.v@example.com', asset: 'Ethereum (ETH)', amount: '$4,200.00 (1.45 ETH)', destination: '0x71C...39aE', riskScore: 'Low (12/100)', time: '14 mins ago' },
            { id: 'WDR-3311', email: 'elena.rostova@example.com', asset: 'USDT (TRC-20)', amount: '$28,000.00', destination: 'TVk9...88wQ', riskScore: 'Medium (48/100)', time: '32 mins ago' },
            { id: 'WDR-3310', email: 'david.c@example.com', asset: 'Bitcoin (BTC)', amount: '$65,400.00', destination: 'bc1q...99zx', riskScore: 'Low (8/100)', time: '1 hour ago' },
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'} flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4`}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-base shrink-0 mt-0.5">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-purple-500">{item.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500">{item.riskScore}</span>
                  </div>
                  <h4 className="font-bold text-base mt-1">{item.amount}</h4>
                  <p className={`text-xs ${textSecondary} mt-0.5`}>User: {item.email} • Dest: <code className="font-mono">{item.destination}</code> • Requested {item.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
                <button className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span>Flag & Block</span>
                </button>
                <button className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 text-xs font-bold transition-colors shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Sign</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
