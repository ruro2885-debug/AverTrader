import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, CheckCircle2, XCircle, Clock, FileText, User } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface KYC {
  id: string;
  userId: string;
  name: string;
  email: string;
  tier: string;
  documents: string[];
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
}

export default function AdminKYC({ theme }: { theme: 'light' | 'dark' }) {
  const [submissions, setSubmissions] = useState<KYC[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'admin_kyc'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as KYC));
      setSubmissions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'admin_kyc', id), { 
        status,
        verifiedAt: serverTimestamp() 
      });
    } catch (err) {
      console.error("Failed to update KYC:", err);
    }
  };

  const filtered = submissions.filter(s => 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Identity Governance</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Review and verify institutional KYC submissions for regulatory compliance.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-[2rem] border flex flex-col transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
            } ${item.status === 'pending' ? 'ring-1 ring-amber-500/30' : ''}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                }`}>
                  {item.name?.charAt(0) || <User className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-base">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                item.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                item.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {item.status}
              </span>
            </div>

            <div className={`flex-1 p-4 rounded-2xl mb-6 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Verification Level</span>
                <span className="text-xs font-black text-emerald-500">{item.tier || 'Tier 1'}</span>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Uploaded Documents</span>
                <div className="flex flex-wrap gap-2">
                  {(item.documents || ['ID_FRONT.jpg', 'ID_BACK.jpg', 'LIVENESS.mp4']).map((doc, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                      isDark ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                      <FileText className="w-3 h-3" />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Pending'}
              </div>
              
              {item.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAction(item.id, 'rejected')}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'verified')}
                    className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <ShieldCheck className="w-16 h-16" />
            <div className="space-y-1">
              <p className="font-bold">No identity submissions detected</p>
              <p className="text-xs">Incoming KYC applications will appear here for manual verification.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
