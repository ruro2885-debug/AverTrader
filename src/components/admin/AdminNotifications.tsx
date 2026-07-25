import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminNotifications({ theme }: { theme: 'light' | 'dark' }) {
  const { user: admin } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setIsSending(true);
    try {
      await adminService.sendGlobalNotification({ title, body, type }, admin.uid, admin.email!);
      setTitle('');
      setBody('');
      alert('Global notification broadcasted successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Notifications</h2>
        <p className="text-sm text-slate-500">Broadcast institutional updates and critical alerts to all users.</p>
      </div>

      <div className="max-w-2xl bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-8">
        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Notification Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled System Maintenance"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Message Content</label>
              <textarea 
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Draft the message for the platform-wide broadcast..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['info', 'warning', 'success'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    type === t ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  {t === 'info' && <Info className="w-4 h-4" />}
                  {t === 'warning' && <AlertTriangle className="w-4 h-4" />}
                  {t === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSending ? 'Broadcasting...' : (
              <>
                <Send className="w-4 h-4" />
                Dispatch Notification
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
