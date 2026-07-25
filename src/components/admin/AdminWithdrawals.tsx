import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Filter,
  CreditCard,
  User,
  MoreVertical,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { adminService, AdminWithdrawalRequest } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminWithdrawalsProps {
  theme: 'light' | 'dark';
}

export default function AdminWithdrawals({ theme }: AdminWithdrawalsProps) {
  const { user: admin } = useAuth();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = adminService.subscribeWithdrawals(setWithdrawals);
    return unsub;
  }, []);

  const handleUpdateStatus = async (id: string, status: AdminWithdrawalRequest['status']) => {
    if (!admin) return;
    if (confirm(`Set withdrawal ${id} status to ${status}?`)) {
      await adminService.updateWithdrawalStatus(id, status, admin.uid, admin.email!);
    }
  };

  const filtered = withdrawals.filter(w => 
    (w.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (w.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Withdrawal Authorization</h2>
          <p className="text-sm text-slate-500">Review and verify outgoing capital requests for risk and compliance.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by ID, email or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-[#0D1117] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
            Risk Score: All
          </button>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Transaction ID</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Recipient Identity</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Value & Destination</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Risk Score</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Authorization</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.length > 0 ? filtered.map((w) => (
                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono text-slate-400">#{w.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-white">{w.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-bold text-white">${w.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">{w.destination}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 font-bold text-xs ${
                      w.riskScore < 30 ? 'text-emerald-500' : 
                      w.riskScore < 70 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {w.riskScore > 60 && <ShieldAlert className="w-3 h-3" />}
                      {w.riskScore}/100
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg w-fit text-[10px] font-bold tracking-widest uppercase ${
                      w.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                      w.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 
                      w.status === 'Processing' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {w.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {w.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(w.id, 'Approved')}
                            className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(w.id, 'Rejected')}
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-900/50 rounded-[28px] flex items-center justify-center border border-white/[0.03]">
                        <ArrowUpCircle className="w-10 h-10 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">No Withdrawal Requests Found</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          Administrative verification is required for all outgoing transfers. New requests will appear here for review.
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
