import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, CheckCircle2, XCircle, Clock, ExternalLink, ArrowDownCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Deposit {
  id: string;
  userId: string;
  email: string;
  asset: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  timestamp: string;
}

export default function AdminDeposits({ theme }: { theme: 'light' | 'dark' }) {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'admin_deposits'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
      setDeposits(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (id: string, status: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'admin_deposits', id), { 
        status,
        processedAt: serverTimestamp() 
      });
    } catch (err) {
      console.error("Failed to update deposit:", err);
    }
  };

  const filtered = deposits.filter(d => 
    d.email?.toLowerCase().includes(search.toLowerCase()) || 
    d.asset?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Deposit Inflow</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit and confirm incoming institutional capital deposits.
          </p>
        </div>
        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
          isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'
        }`}>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Volume</span>
            <strong className="text-emerald-500 text-lg font-black">
              ${deposits.filter(d => d.status === 'pending').reduce((acc, d) => acc + (d.amount || 0), 0).toLocaleString()}
            </strong>
          </div>
          <ArrowDownCircle className="w-8 h-8 text-emerald-500" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by email or asset..." 
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
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
                      <span className="text-sm font-black text-emerald-500">{item.amount?.toLocaleString()} {item.asset}</span>
                      <span className="text-[10px] text-slate-500">Cross-chain network</span>
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
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAction(item.id, 'completed')}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                            title="Approve & Complete"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(item.id, 'rejected')}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="Reject Request"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                        <ExternalLink className="w-4 h-4 text-slate-500" />
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
            <ArrowDownCircle className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No deposit records found</p>
              <p className="text-xs">Incoming capital flow will appear here in real-time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
