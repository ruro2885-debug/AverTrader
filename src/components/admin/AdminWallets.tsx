import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Wallet, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert,
  Globe,
  Link2,
  Calendar,
  MoreVertical,
  Activity
} from 'lucide-react';
import { linkedWalletService } from '../../services/linkedWalletService';
import { LinkedWallet } from '../../types';

interface AdminWalletsProps {
  theme: 'light' | 'dark';
}

export default function AdminWallets({ theme }: AdminWalletsProps) {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const data = await linkedWalletService.getAllLinkedWallets();
      setWallets(data);
    } catch (err) {
      console.error("Failed to fetch all linked wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(w => 
    (w.address || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (w.userId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Linked Wallet Registry</h2>
          <p className="text-sm text-slate-500">Monitor and audit global user wallet connections.</p>
        </div>
        <button 
          onClick={fetchWallets}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold rounded-xl transition-all text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by wallet address or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Blockchain Asset</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Wallet Address</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Owner Identity</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Sync Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-white/5 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredWallets.length > 0 ? filteredWallets.map((w) => (
                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold border border-white/5 ${
                        w.network === 'Ethereum' ? 'bg-indigo-500/10 text-indigo-500' : 
                        w.network === 'Solana' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10'
                      }`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{w.network}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{w.walletType || 'Self-Custody'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/addr">
                      <span className="text-xs font-mono text-slate-400 group-hover/addr:text-emerald-500 transition-colors">
                        {w.address.slice(0, 10)}...{w.address.slice(-8)}
                      </span>
                      <button className="opacity-0 group-hover/addr:opacity-100 transition-opacity p-1 text-slate-600 hover:text-white">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{w.userId}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${w.status === 'Connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${w.status === 'Connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {w.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {w.linkedAt ? new Date(w.linkedAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-900/50 rounded-[28px] flex items-center justify-center border border-white/[0.03]">
                        <Link2 className="w-10 h-10 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">No Linked Wallets Found</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          The global wallet registry is currently empty. Connections will appear here in real-time as users link their accounts.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
