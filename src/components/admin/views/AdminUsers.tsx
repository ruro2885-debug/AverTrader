import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, Shield, Mail, Calendar, UserCheck, UserX } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface UserData {
  uid: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers({ theme }: { theme: 'light' | 'dark' }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleAdmin = async (uid: string, currentRole: string) => {
    const newRole = currentRole === 'super_admin' ? 'user' : 'super_admin';
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.uid?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">User Registry</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage global platform users, roles, and institutional access levels.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by email or UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
        <button className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold border transition-all ${
          isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
        }`}>
          <Filter className="w-4 h-4" />
          Advanced Filters
        </button>
      </div>

      <div className={`rounded-[2rem] border overflow-hidden ${
        isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User / UID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Registered</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className={`group hover:bg-white/[0.02] transition-colors`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-500 border border-white/5">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{user.email}</span>
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">{user.uid}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                      user.role === 'super_admin' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleAdmin(user.uid, user.role)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                        }`}
                        title={user.role === 'super_admin' ? 'Remove Admin' : 'Make Admin'}
                      >
                        <Shield className={`w-4 h-4 ${user.role === 'super_admin' ? 'text-purple-500' : 'text-slate-500'}`} />
                      </button>
                      <button className={`p-2 rounded-lg transition-all ${
                        isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                      }`}>
                        <Mail className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className={`p-2 rounded-lg transition-all ${
                        isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                      }`}>
                        <MoreHorizontal className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <UserX className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No users found matching your search</p>
              <p className="text-xs">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
