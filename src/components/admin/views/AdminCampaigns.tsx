import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Search, Plus, Calendar, Trophy, Users, Edit3, Trash2, Globe, Lock } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface EventHub {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  status: 'active' | 'upcoming' | 'expired';
  totalRewardPool: number;
  rewardToken: string;
  startTime: string;
  endTime: string;
  participantCount: number;
}

export default function AdminCampaigns({ theme }: { theme: 'light' | 'dark' }) {
  const [events, setEvents] = useState<EventHub[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'events_hub'), orderBy('startTime', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventHub));
      setEvents(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'expired' : 'active';
    try {
      await updateDoc(doc(db, 'events_hub', id), { status: next });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filtered = events.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Campaign Manager</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Deploy global promotional events, competitions, and institutional rewards.
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
          <Plus className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((event) => (
          <motion.div
            key={event.id}
            layout
            className={`p-6 rounded-[2rem] border transition-all ${
              isDark ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center`}>
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{event.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  event.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  event.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {event.status}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reward Pool</span>
                <strong className="text-emerald-500 text-sm font-black">{event.totalRewardPool.toLocaleString()} {event.rewardToken}</strong>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Participants</span>
                <strong className="text-sm font-black">{event.participantCount.toLocaleString()}</strong>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Days Left</span>
                <strong className="text-sm font-black">12</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.startTime).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5 text-rose-500/60">
                  <Lock className="w-3.5 h-3.5" />
                  {new Date(event.endTime).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={`p-2.5 rounded-xl border transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}>
                  <Edit3 className="w-4 h-4 text-slate-500" />
                </button>
                <button 
                  onClick={() => toggleStatus(event.id, event.status)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    event.status === 'active' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950'
                  }`}
                >
                  {event.status === 'active' ? 'End Early' : 'Activate'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Megaphone className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No active campaigns</p>
              <p className="text-xs">Start by creating a new institutional event or reward program.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
