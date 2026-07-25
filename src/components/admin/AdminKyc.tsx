import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  User, 
  ShieldCheck, 
  Clock,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService, AdminKycSubmission } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminKycProps {
  theme: 'light' | 'dark';
}

export default function AdminKyc({ theme }: AdminKycProps) {
  const { user: admin } = useAuth();
  const [kycList, setKycList] = useState<AdminKycSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = adminService.subscribeKyc(setKycList);
    return unsub;
  }, []);

  const handleUpdateStatus = async (id: string, status: AdminKycSubmission['status']) => {
    if (!admin) return;
    if (confirm(`Set KYC ${id} status to ${status}?`)) {
      await adminService.updateKycStatus(id, status, admin.uid, admin.email!);
    }
  };

  const filtered = kycList.filter(k => 
    (k.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (k.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">KYC Verification Hub</h2>
          <p className="text-sm text-slate-500">Conduct identity reviews and tier promotion authorizations.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <button className="bg-[#0D1117] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
          Tier: All
        </button>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Submission Profile</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Verification Tier</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Documents</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Review Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.length > 0 ? filtered.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white border border-white/5 font-bold">
                        {k.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{k.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{k.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-white/5">
                      {k.tier}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-1">
                      {k.documents?.map((doc, i) => (
                        <div key={i} className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer" title={doc}>
                          <FileText className="w-4 h-4" />
                        </div>
                      ))}
                      {!k.documents?.length && <span className="text-xs text-slate-600">No files</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg w-fit text-[10px] font-bold tracking-widest uppercase ${
                      k.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                      k.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {k.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {k.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(k.id, 'Approved')}
                            className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg transition-all"
                            title="Approve KYC"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(k.id, 'Rejected')}
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                            title="Reject KYC"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-900/50 rounded-[28px] flex items-center justify-center border border-white/[0.03]">
                        <UserCheck className="w-10 h-10 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">No KYC Reviews Pending</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          New user verification submissions will appear here for analyst review and tier authorization.
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
