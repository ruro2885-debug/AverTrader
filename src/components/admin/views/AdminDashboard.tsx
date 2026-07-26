import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Wallet, ArrowDownCircle, ArrowUpCircle, 
  TrendingUp, TrendingDown, Activity, ShieldAlert
} from 'lucide-react';
import { collection, query, limit, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface AdminStats {
  totalUsers: number;
  totalWallets: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKYC: number;
  openTickets: number;
}

export default function AdminDashboard({ theme }: { theme: 'light' | 'dark' }) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalWallets: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingKYC: 0,
    openTickets: 0
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    // Real-time listener for Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, totalUsers: snap.size }));
    });

    // Real-time listener for Wallets
    const unsubWallets = onSnapshot(collection(db, 'linked_wallets'), (snap) => {
      setStats(prev => ({ ...prev, totalWallets: snap.size }));
    });

    // Real-time listener for Pending Deposits
    const unsubDeposits = onSnapshot(
      query(collection(db, 'admin_deposits'), where('status', '==', 'pending')),
      (snap) => {
        setStats(prev => ({ ...prev, pendingDeposits: snap.size }));
      }
    );

    // Real-time listener for Pending Withdrawals
    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'admin_withdrawals'), where('status', '==', 'pending')),
      (snap) => {
        setStats(prev => ({ ...prev, pendingWithdrawals: snap.size }));
      }
    );

    // Real-time listener for Pending KYC
    const unsubKYC = onSnapshot(
      query(collection(db, 'admin_kyc'), where('status', '==', 'pending')),
      (snap) => {
        setStats(prev => ({ ...prev, pendingKYC: snap.size }));
      }
    );

    return () => {
      unsubUsers();
      unsubWallets();
      unsubDeposits();
      unsubWithdrawals();
      unsubKYC();
    };
  }, []);

  const statCards = [
    { label: 'Total Platform Users', value: stats.totalUsers, icon: Users, color: 'blue', trend: '+12%', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    { label: 'Linked Institutional Wallets', value: stats.totalWallets, icon: Wallet, color: 'emerald', trend: '+5%', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, icon: ArrowDownCircle, color: 'amber', trend: stats.pendingDeposits > 0 ? 'Action Needed' : 'Clean', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: ArrowUpCircle, color: 'rose', trend: stats.pendingWithdrawals > 5 ? 'High Volume' : 'Stable', bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Terminal Overview</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Real-time institutional control center monitor. Global platform status and financial flows.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
            } shadow-sm group hover:border-emerald-500/30 transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.text} border ${stat.border}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                stat.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="space-y-1">
              <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>
                {stat.label}
              </span>
              <div className="text-3xl font-black tracking-tight">
                {stat.value.toLocaleString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Operational Alerts */}
        <div className={`p-8 rounded-[2rem] border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-emerald-500" />
              <h3 className="text-xl font-bold">Operational Alerts</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority Queue</span>
          </div>

          <div className="space-y-4">
            {stats.pendingKYC > 0 && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-bold">Pending KYC Verifications</span>
                </div>
                <span className="text-sm font-black text-amber-500">{stats.pendingKYC} Requests</span>
              </div>
            )}
            
            {stats.pendingWithdrawals > 0 && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-sm font-bold">Withdrawal Approvals Required</span>
                </div>
                <span className="text-sm font-black text-rose-500">{stats.pendingWithdrawals} Pending</span>
              </div>
            )}

            {stats.pendingKYC === 0 && stats.pendingWithdrawals === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                <Activity className="w-12 h-12" />
                <p className="text-sm font-bold">System clean. No high-priority alerts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Volume Flow (Placeholder for dynamic chart) */}
        <div className={`p-8 rounded-[2rem] border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              <h3 className="text-xl font-bold">Financial Flux</h3>
            </div>
            <div className="flex gap-2">
              <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Inbound</div>
              <div className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase">Outbound</div>
            </div>
          </div>

          <div className="h-[240px] flex items-end gap-2 px-2">
            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full relative h-[200px] flex items-end">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={`w-full rounded-t-lg transition-all ${
                      i % 2 === 0 ? 'bg-emerald-500/40 group-hover:bg-emerald-500' : 'bg-rose-500/40 group-hover:bg-rose-500'
                    }`}
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-500">M{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
