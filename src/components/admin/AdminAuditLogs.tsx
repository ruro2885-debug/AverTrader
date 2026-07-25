import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Terminal, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Cpu, 
  Database,
  Filter,
  ArrowDownCircle,
  MoreVertical,
  Activity,
  User,
  Monitor
} from 'lucide-react';
import { adminService, AdminAuditLog } from '../../services/adminService';

interface AdminAuditLogsProps {
  theme: 'light' | 'dark';
}

export default function AdminAuditLogs({ theme }: AdminAuditLogsProps) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    const unsub = adminService.subscribeAuditLogs(setLogs);
    return unsub;
  }, []);

  const filtered = logs.filter(l => 
    (l.adminEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.resource || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Audit Trail</h2>
          <p className="text-sm text-slate-500">Immutable ledger of all administrative operations and platform modifications.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by admin email, action or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <button className="bg-[#0D1117] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
          Action: All
        </button>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Timestamp (UTC)</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Administrator</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Operation</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Modified Resource</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.length > 0 ? filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString([], { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 'Pending...'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <User className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-white truncate max-w-[150px]">{l.adminEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`px-2 py-1 rounded-lg w-fit text-[10px] font-bold tracking-widest uppercase border ${
                      l.action.includes('DELETE') ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      l.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    }`}>
                      {l.action}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 group-hover:text-white transition-colors">
                      <Database className="w-3.5 h-3.5 text-slate-600" />
                      {l.resource}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500">
                      <span className="truncate max-w-[200px] italic">{l.details}</span>
                      <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-all">
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-slate-900/50 rounded-[28px] flex items-center justify-center border border-white/[0.03]">
                        <History className="w-10 h-10 text-slate-800" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Audit Trail Empty</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          Every administrative action on the platform is logged here permanently. No logs recorded yet.
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
