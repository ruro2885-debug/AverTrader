import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, ArrowRightLeft, FileText, Download } from 'lucide-react';

interface PortfolioTransactionsProps {
  theme: 'light' | 'dark';
}

const TRANSACTIONS = [
  {
    id: 'tx_001',
    type: 'deposit',
    asset: 'USDT',
    network: 'TRC20',
    amount: '+5,000.00',
    status: 'completed',
    date: 'Today, 14:32:05',
    txHash: '0x3a4b...9f8c'
  },
  {
    id: 'tx_002',
    type: 'trade',
    asset: 'BTC/USDT',
    side: 'buy',
    amount: '0.15000000',
    price: '$64,280.00',
    status: 'completed',
    date: 'Yesterday, 09:15:22',
    txHash: 'Order: #948271'
  },
  {
    id: 'tx_003',
    type: 'withdraw',
    asset: 'ETH',
    network: 'ERC20',
    amount: '-2.50000000',
    status: 'processing',
    date: 'Jul 09, 18:45:10',
    txHash: '0x8f2d...1a4e'
  },
  {
    id: 'tx_004',
    type: 'earn',
    asset: 'SOL',
    network: 'Staking',
    amount: '+0.04500000',
    status: 'completed',
    date: 'Jul 08, 00:00:00',
    txHash: 'Yield Distribution'
  },
  {
    id: 'tx_005',
    type: 'transfer',
    asset: 'USDC',
    network: 'Spot → Margin',
    amount: '1,000.00',
    status: 'completed',
    date: 'Jul 05, 11:20:45',
    txHash: 'Internal Transfer'
  }
];

export default function PortfolioTransactions({ theme }: PortfolioTransactionsProps) {
  const isDark = theme === 'dark';
  
  const bgClasses = isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white/60 border-slate-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverClass = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const borderClass = isDark ? 'border-white/5' : 'border-slate-100';

  const getTypeIcon = (type: string, side?: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case 'withdraw': return <ArrowUpRight className="w-4 h-4 text-amber-500" />;
      case 'trade': return side === 'buy' ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <ArrowUpRight className="w-4 h-4 text-rose-500" />;
      case 'earn': return <RefreshCcw className="w-4 h-4 text-blue-500" />;
      case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-500 bg-emerald-500/10';
      case 'processing': return 'text-amber-500 bg-amber-500/10';
      case 'failed': return 'text-rose-500 bg-rose-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className={`w-[96%] mx-auto rounded-xl border ${bgClasses} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${textPrimary}`}>Recent Transactions</h2>
          <p className={`text-sm ${textSecondary} mt-1`}>Your latest deposits, withdrawals, and trading activity.</p>
        </div>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${borderClass} ${textSecondary} ${hoverClass} transition-colors text-sm font-medium`}>
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className={`text-xs uppercase tracking-wider ${textSecondary} border-b ${borderClass}`}>
              <th className="pb-4 font-medium pl-4">Type</th>
              <th className="pb-4 font-medium">Asset / Pair</th>
              <th className="pb-4 font-medium">Network / Details</th>
              <th className="pb-4 font-medium text-right">Amount</th>
              <th className="pb-4 font-medium text-center">Status</th>
              <th className="pb-4 font-medium text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {TRANSACTIONS.map((tx, i) => (
              <tr key={tx.id} className={`group border-b ${borderClass} last:border-0 ${hoverClass} transition-colors cursor-pointer`}>
                <td className="py-4 pl-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      {getTypeIcon(tx.type, tx.side)}
                    </div>
                    <div>
                      <div className={`font-medium capitalize ${textPrimary}`}>{tx.type}</div>
                      <div className={`text-xs ${textSecondary} font-mono mt-0.5`}>{tx.txHash}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className={`font-medium ${textPrimary}`}>{tx.asset}</div>
                  {tx.side && (
                    <div className={`text-xs mt-0.5 capitalize ${tx.side === 'buy' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.side}
                    </div>
                  )}
                </td>
                <td className="py-4">
                  <div className={`${textPrimary}`}>{tx.network}</div>
                  {tx.price && <div className={`text-xs ${textSecondary} mt-0.5 font-mono`}>{tx.price}</div>}
                </td>
                <td className={`py-4 text-right font-mono font-medium ${tx.amount.startsWith('+') ? 'text-emerald-500' : tx.amount.startsWith('-') ? textPrimary : textPrimary}`}>
                  {tx.amount}
                </td>
                <td className="py-4 text-center">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className={`py-4 text-right ${textSecondary} text-xs tabular-nums`}>
                  {tx.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-dashed border-white/5 flex justify-center">
        <button className={`text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors`}>
          View Complete History →
        </button>
      </div>
    </div>
  );
}
