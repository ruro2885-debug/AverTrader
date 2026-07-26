import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet, Search, Filter, Shield, Globe, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface LinkedWallet {
  id: string;
  userId: string;
  address: string;
  network: string;
  walletType: string;
  status: 'active' | 'inactive';
  linkedAt: string;
}

export default function AdminWallets({ theme }: { theme: 'light' | 'dark' }) {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'linked_wallets'), orderBy('linkedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkedWallet));
      setWallets(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleStatus = async (id: string, current: string) => {
    try {
      await updateDoc(doc(db, 'linked_wallets', id), {
        status: current === 'active' ? 'inactive' : 'active'
      });
    } catch (err) {
      console.error("Failed to toggle wallet status:", err);
    }
  };

  const deleteWallet = async (id: string) => {
    if (!window.confirm("Permanently unlink this institutional wallet?")) return;
    try {
      await deleteDoc(doc(db, 'linked_wallets', id));
    } catch (err) {
      console.error("Failed to delete wallet:", err);
    }
  };

  const filtered = wallets.filter(w => 
    w.address?.toLowerCase().includes(search.toLowerCase()) || 
    w.userId?.toLowerCase().includes(search.toLowerCase()) ||
    w.network?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Custody Network</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Audit and manage all external institutional wallets linked to the platform ecosystem.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by address, network or UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((wallet) => (
          <motion.div
            key={wallet.id}
            layout
            className={`p-6 rounded-[2rem] border transition-all ${
              isDark ? 'bg-white/5 border-white/5 hover:border-emerald-500/20' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/30'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-500 border border-white/5`}>
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base">{wallet.walletType || 'Institutional'}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{wallet.network}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleStatus(wallet.id, wallet.status)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  wallet.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}
              >
                {wallet.status}
              </button>
            </div>

            <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Public Address</span>
                <button className="text-emerald-500 hover:text-emerald-400 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-mono text-slate-400 break-all leading-relaxed">
                {wallet.address}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Owner ID</span>
                <span className="text-[10px] font-mono text-slate-400">{wallet.userId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => deleteWallet(wallet.id)}
                  className={`p-2.5 rounded-xl transition-all ${
                    isDark ? 'hover:bg-rose-500/10 hover:text-rose-500 text-slate-500' : 'hover:bg-rose-50 hover:text-rose-600 text-slate-400'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Globe className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No linked wallets detected</p>
              <p className="text-xs">Linked external accounts will be indexed here in real-time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
