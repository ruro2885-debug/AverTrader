import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Shield, 
  Mail, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Ban,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUsersProps {
  theme: 'light' | 'dark';
}

export default function AdminUsers({ theme }: AdminUsersProps) {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'super_admin'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = adminService.subscribeUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.uid || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleRole = async (uid: string, currentRole: string) => {
    if (!currentAdmin) return;
    const newRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      await adminService.updateUserRole(uid, newRole, currentAdmin.uid, currentAdmin.email!);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-slate-500">Manage platform users, roles, and administrative access.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm">
          <UserPlus className="w-4 h-4" />
          Provision User
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1117] border border-white/[0.05] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-[#0D1117] border border-white/[0.05] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-slate-400"
          >
            <option value="all">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="super_admin">Super Admins</option>
          </select>
          <button className="bg-[#0D1117] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">User Identity</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Platform Role</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Onboarding Date</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Security Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-white/5 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-white/5">
                        {u.email?.[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate uppercase">{u.uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                      u.role === 'super_admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {u.role || 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-medium">Verified</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleRole(u.uid, u.role)}
                        className="p-2 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-lg transition-all"
                        title="Promote/Demote"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-slate-800" />
                      <p className="text-slate-500">No users found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/[0.03] flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="text-white font-bold">{filteredUsers.length}</span> of <span className="text-white font-bold">{users.length}</span> platform entities
          </p>
          <div className="flex gap-1">
            <button className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
