import React from 'react';
import { ArrowDownLeft, CheckCircle, Clock, Search, DollarSign } from 'lucide-react';

interface AdminDepositsProps {
  theme: string;
}

export default function AdminDeposits({ theme }: AdminDepositsProps) {
  const cardBg = theme === 'dark' ? 'bg-[#12161c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
        <div>
          <span className="text-xs font-mono font-bold text-emerald-500 uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 inline-block mb-2">
            Capital Inflow
          </span>
          <h1 className="text-2xl font-black tracking-tight">Deposit Management & Clearing</h1>
          <p className={`text-sm ${textSecondary} mt-1`}>
            Monitor and clear incoming cryptocurrency transfers, wire deposits, and fiat gateways.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">
            Total Today: $1,429,500
          </span>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Deposit Transactions</h3>
          <span className="text-xs font-mono text-emerald-500">Live Gateway Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'} font-mono text-xs uppercase`}>
                <th className="pb-3 font-semibold">Tx ID</th>
                <th className="pb-3 font-semibold">User Email</th>
                <th className="pb-3 font-semibold">Asset / Method</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {[
                { id: 'DEP-8842', email: 'alex.trader@example.com', asset: 'USDT (ERC-20)', amount: '$12,500.00', status: 'Completed', time: '2 mins ago' },
                { id: 'DEP-8841', email: 'jordan.p@example.com', asset: 'Bitcoin (BTC)', amount: '$45,000.00', status: 'Clearing (2/3)', time: '12 mins ago' },
                { id: 'DEP-8840', email: 'liam.k@example.com', asset: 'Wire Transfer (USD)', amount: '$150,000.00', status: 'Pending Review', time: '45 mins ago' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                  <td className="py-4 font-mono text-xs font-bold text-emerald-500">{row.id}</td>
                  <td className="py-4 font-medium">{row.email}</td>
                  <td className="py-4 font-mono text-xs">{row.asset}</td>
                  <td className="py-4 font-mono font-bold">{row.amount}</td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                      row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`py-4 text-xs ${textSecondary}`}>{row.time}</td>
                  <td className="py-4 text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-bold transition-colors">
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
