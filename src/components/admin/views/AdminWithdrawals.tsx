import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldAlert, CheckCircle2, XCircle, Clock, ExternalLink, ArrowUpCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Withdrawal {
  id: string;
  userId: string;
  email: string;
  asset: string;
  amount: number;
  destination: string;
  riskScore: number;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
}

export default function AdminWithdrawals({ theme }: { theme: 'light' | 'dark' }) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'admin_withdrawals'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
      setWithdrawals(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'admin_withdrawals', id), { 
        status,
        processedAt: serverTimestamp() 
      });
    } catch (err) {
      console.error("Failed to update withdrawal:", err);
    }
  };

  const filtered = withdrawals.filter(w => 
    w.email?.toLowerCase().includes(search.toLowerCase()) || 
    w.asset?.toLowerCase().includes(search.toLowerCase()) ||
    w.destination?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Withdrawal Governance</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Security-first approval terminal for institutional capital outflows.
          </p>
        </div>
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
          isDark ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'
        }`}>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Outflow</span>
            <strong className="text-rose-500 text-lg font-black">
              ${withdrawals.filter(w => w.status === 'pending').reduce((acc, w) => acc + (w.amount || 0), 0).toLocaleString()}
            </strong>
          </div>
          <ArrowUpCircle className="w-8 h-8 text-rose-500" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by email, asset or destination..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
      </div>

      <div className={`rounded-[2rem] border overflow-hidden ${
        isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User / Request ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount / Destination</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{item.email}</span>
                      <span className="text-[10px] font-mono text-slate-500">{item.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-rose-500">{item.amount?.toLocaleString()} {item.asset}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full ${item.riskScore > 70 ? 'bg-rose-500' : item.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${item.riskScore}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${item.riskScore > 70 ? 'text-rose-500' : item.riskScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {item.riskScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAction(item.id, 'completed')}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                            title="Approve & Send"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(item.id, 'rejected')}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="Reject & Freeze"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <ArrowUpCircle className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No withdrawal activity detected</p>
              <p className="text-xs">Outbound capital flow will appear here after automated risk screening.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
