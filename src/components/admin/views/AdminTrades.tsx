import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Search, Filter, ShieldCheck, Clock, ExternalLink, 
  ArrowUpRight, ArrowDownRight, DollarSign, User, AlertCircle, CheckCircle2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface TradeRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  symbol: string;
  type: 'buy' | 'sell' | 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  leverage?: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
  timestamp: string;
}

export default function AdminTrades({ theme }: { theme: 'light' | 'dark' }) {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    let allTrades: TradeRecord[] = [];

    const fetchAllTrades = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const userDoc of usersSnap.docs) {
          const uId = userDoc.id;
          const uData = userDoc.data();
          const email = uData.email || 'unknown@user.com';

          const tradesSnap = await getDocs(collection(db, 'users', uId, 'trades'));
          tradesSnap.forEach(tDoc => {
            const tData = tDoc.data();
            allTrades.push({
              id: tDoc.id,
              userId: uId,
              userEmail: email,
              symbol: tData.symbol || 'BTC/USDT',
              type: tData.type || 'long',
              amount: tData.amount || tData.size || 0,
              entryPrice: tData.entryPrice || 0,
              currentPrice: tData.currentPrice || tData.entryPrice || 0,
              leverage: tData.leverage || 1,
              pnl: tData.pnl || 0,
              status: tData.status || 'OPEN',
              timestamp: tData.timestamp || new Date().toISOString()
            });
          });
        }
      } catch (err) {
        console.warn("Error fetching trades from Firestore users:", err);
      }

      // Also fallback to local storage cached trades if any
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('aver_trades_')) {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                parsed.forEach((t: any) => {
                  if (!allTrades.some(existing => existing.id === t.id)) {
                    allTrades.push({
                      id: t.id || Math.random().toString(),
                      userId: key.replace('aver_trades_', ''),
                      userEmail: t.userEmail || 'Local User',
                      symbol: t.symbol || 'BTC/USDT',
                      type: t.type || 'long',
                      amount: t.amount || t.size || 0,
                      entryPrice: t.entryPrice || 0,
                      currentPrice: t.currentPrice || t.entryPrice || 0,
                      leverage: t.leverage || 1,
                      pnl: t.pnl || 0,
                      status: t.status || 'OPEN',
                      timestamp: t.timestamp || new Date().toISOString()
                    });
                  }
                });
              }
            }
          }
        }
      } catch (e) {}

      // Sort by timestamp desc
      allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTrades(allTrades);
      setLoading(false);
    };

    fetchAllTrades();
  }, []);

  const filteredTrades = trades.filter(t => {
    const matchesSearch = 
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight flex items-center gap-3`}>
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            Platform Trades Monitoring
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
            Live inspection of automated and manual user trading positions across all pairs and strategies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Total Recorded: {trades.length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by symbol, email, or trade ID..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
              isDark 
                ? 'bg-slate-900/80 border-white/10 text-white placeholder-slate-500' 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(['all', 'OPEN', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : isDark
                    ? 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Trades Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading platform trades...</div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-500 opacity-40" />
            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No trades found matching criteria</p>
            <p className="text-xs text-slate-500">Active user trading records will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-white/10 text-slate-400 bg-white/[0.02]' : 'border-slate-200 text-slate-500 bg-slate-50'
                }`}>
                  <th className="py-3.5 px-4">Trade ID / Symbol</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Size / Amount</th>
                  <th className="py-3.5 px-4">Entry Price</th>
                  <th className="py-3.5 px-4">P&L</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-white/5 text-slate-300' : 'divide-slate-100 text-slate-800'}`}>
                {filteredTrades.map((t) => {
                  const isProfit = (t.pnl || 0) >= 0;
                  return (
                    <tr key={t.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-sm text-white">{t.symbol}</div>
                        <div className="text-[10px] text-slate-500">#{t.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium">{t.userEmail || 'Unknown User'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.userId?.slice(0, 10)}...</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          t.type === 'buy' || t.type === 'long' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.type === 'buy' || t.type === 'long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.type} {t.leverage ? `${t.leverage}x` : ''}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold">
                        ${Number(t.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        ${Number(t.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-4 px-4 font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${Number(t.pnl || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'OPEN'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
