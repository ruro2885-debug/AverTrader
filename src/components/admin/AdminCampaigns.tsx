import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus, Search, Filter, Megaphone, Clock, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminCampaigns({ theme }: { theme: 'light' | 'dark' }) {
  const { user: admin } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    category: 'Competition',
    reward: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    const unsub = adminService.subscribeCampaigns(setCampaigns);
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!admin) return;
    await adminService.createCampaign({ 
      ...newCampaign, 
      totalRewardPool: parseFloat(newCampaign.reward) || 0,
      participantCount: 0 
    }, admin.uid, admin.email!);
    setIsAdding(false);
    setNewCampaign({ title: '', category: 'Competition', reward: '', status: 'Upcoming' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Campaigns & Events</h2>
          <p className="text-sm text-slate-500">Deploy and manage promotional events, trading competitions, and user incentives.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length > 0 ? campaigns.map((c) => (
          <div key={c.id} className="bg-[#0D1117] border border-white/[0.05] rounded-3xl p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Megaphone className="w-6 h-6 text-emerald-500" />
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                c.status === 'Live' ? 'bg-emerald-500/20 text-emerald-500 animate-pulse' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {c.status}
              </span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">{c.title}</h4>
            <p className="text-xs text-slate-500 mb-6">{c.category}</p>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Reward Pool</span>
                <span className="text-white font-bold">${c.totalRewardPool?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Participants</span>
                <span className="text-white font-bold">{c.participantCount || 0}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Calendar className="w-12 h-12 text-slate-800 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Campaigns</h3>
            <p className="text-sm text-slate-500 max-w-sm">Launch new promotional events to drive platform engagement and volume.</p>
          </div>
        )}
      </div>

      {/* Add Campaign Modal Placeholder */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0D1117] border border-white/10 rounded-[32px] p-8"
          >
            <h3 className="text-xl font-bold mb-6">New Operational Event</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Event Title</label>
                <input 
                  type="text" 
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. BTC Bull Run Challenge"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Reward Pool ($)</label>
                  <input 
                    type="number" 
                    value={newCampaign.reward}
                    onChange={(e) => setNewCampaign({ ...newCampaign, reward: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="10000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Status</label>
                  <select 
                    value={newCampaign.status}
                    onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Live">Live</option>
                    <option value="Ended">Ended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-xl transition-all">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl transition-all">Deploy Event</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
