import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Activity, 
  Clock, 
  ShieldCheck,
  Globe,
  Zap,
  BarChart3,
  CreditCard
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminDashboardProps {
  theme: 'light' | 'dark';
}

export default function AdminDashboard({ theme }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingKyc: 0,
    openTickets: 0
  });

  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  useEffect(() => {
    // Real-time listeners for stats
    const unsubUsers = adminService.subscribeUsers((users) => {
      setStats(prev => ({ ...prev, totalUsers: users.length }));
    });

    const unsubKyc = adminService.subscribeKyc((kyc) => {
      setStats(prev => ({ ...prev, pendingKyc: kyc.filter(k => k.status === 'Pending').length }));
    });

    const unsubLogs = adminService.subscribeAuditLogs((logs) => {
      setRecentLogs(logs.slice(0, 5));
    });

    // In a real app, I'd also have aggregation triggers for financial stats
    // or use a summary document that updates on Cloud Functions.
    // For now, I'll count them from the collections.
    const unsubDeposits = adminService.subscribeDeposits((deps) => {
      const total = deps.filter(d => d.status === 'Completed').reduce((sum, d) => sum + d.amount, 0);
      setStats(prev => ({ ...prev, totalDeposits: total }));
    });

    const unsubWithdrawals = adminService.subscribeWithdrawals((wdrs) => {
      const total = wdrs.filter(w => w.status === 'Approved' || w.status === 'Processing').reduce((sum, w) => sum + w.amount, 0);
      setStats(prev => ({ ...prev, totalWithdrawals: total }));
    });

    return () => {
      unsubUsers();
      unsubKyc();
      unsubLogs();
      unsubDeposits();
      unsubWithdrawals();
    };
  }, []);

  const cards = [
    { label: 'Total Registered Users', value: stats.totalUsers, icon: Users, trend: '+4.2%', color: 'text-blue-500' },
    { label: 'Platform Liquidity', value: `$${(stats.totalDeposits - stats.totalWithdrawals).toLocaleString()}`, icon: Wallet, trend: '+12.5%', color: 'text-emerald-500' },
    { label: 'Pending KYC Reviews', value: stats.pendingKyc, icon: ShieldCheck, trend: stats.pendingKyc > 5 ? 'Attention' : 'Stable', color: 'text-amber-500' },
    { label: 'Total Volume', value: `$${(stats.totalDeposits + stats.totalWithdrawals).toLocaleString()}`, icon: BarChart3, trend: '+8.1%', color: 'text-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Operational Pulse</h2>
          <p className="text-slate-500">Real-time platform metrics and administrative overview.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-emerald-500 tracking-wide uppercase">Live Terminal Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#0D1117] border border-white/[0.05] rounded-3xl p-6 hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 ${
                card.trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'
              }`}>
                {card.trend}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Inflow Analytics</h3>
                <p className="text-sm text-slate-500">Platform capital growth over 30 days</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['1D', '1W', '1M', 'ALL'].map(t => (
                <button key={t} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                  t === '1M' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white transition-colors'
                }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-2xl">
            <div className="text-center">
              <Globe className="w-10 h-10 text-slate-700 mx-auto mb-4 animate-spin-slow" />
              <p className="text-sm text-slate-500">Analyzing global ledger data...</p>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <History className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recent Audit Logs</h3>
              <p className="text-sm text-slate-500">Security & Operational trail</p>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            {recentLogs.length > 0 ? recentLogs.map((log, idx) => (
              <div key={idx} className="flex gap-4 group">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {log.action[0]}
                  </div>
                  {idx < recentLogs.length - 1 && (
                    <div className="absolute top-8 left-4 w-px h-6 bg-white/5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-xs font-bold text-white truncate">{log.action}</p>
                    <span className="text-[9px] text-slate-500 font-mono">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{log.adminEmail}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Activity className="w-8 h-8 text-slate-800 mb-3" />
                <p className="text-xs text-slate-600">No recent logs recorded.</p>
              </div>
            )}
          </div>

          <button className="w-full py-3 mt-6 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white rounded-xl transition-all">
            View Full Audit Trail
          </button>
        </div>

      </div>

      {/* Operational Modules Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#0D1117] border border-white/[0.05] rounded-3xl p-6 flex items-center gap-6 group hover:border-indigo-500/30 transition-all cursor-pointer">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">AI Engine Monitor</h4>
            <p className="text-xs text-slate-500">Status: Operational (v2.4.1)</p>
          </div>
        </div>

        <div className="bg-[#0D1117] border border-white/[0.05] rounded-3xl p-6 flex items-center gap-6 group hover:border-emerald-500/30 transition-all cursor-pointer">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Payment Gateway</h4>
            <p className="text-xs text-slate-500">All bridges online</p>
          </div>
        </div>

        <div className="bg-[#0D1117] border border-white/[0.05] rounded-3xl p-6 flex items-center gap-6 group hover:border-amber-500/30 transition-all cursor-pointer">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h4 className="font-bold text-white mb-1">Security Systems</h4>
            <p className="text-xs text-slate-500">Firewall hardening active</p>
          </div>
        </div>
      </div>

    </div>
  );
}
