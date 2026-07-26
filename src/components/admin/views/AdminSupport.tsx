import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Search, Filter, Clock, User, 
  Send, ChevronRight, CheckCircle2, AlertCircle, Trash2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Ticket {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function AdminSupport({ theme }: { theme: 'light' | 'dark' }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'support_tickets'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
      setTickets(data);
      setLoading(false);
      
      // Update selected ticket if it exists in the new data
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return unsub;
  }, [selectedTicket?.id]);

  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim() || !user) return;

    const newMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'Admin Agent',
      text: reply.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        messages: arrayUnion(newMessage),
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
      setReply('');
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  const closeTicket = async (id: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to close ticket:", err);
    }
  };

  const filtered = tickets.filter(t => 
    t.title?.toLowerCase().includes(search.toLowerCase()) || 
    t.userId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-8">
      {/* Sidebar List */}
      <div className="w-[380px] flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Support Desk</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time institutional support terminal.
          </p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`w-full p-4 rounded-2xl border text-left transition-all ${
                selectedTicket?.id === ticket.id
                  ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200')
                  : (isDark ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300')
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                  ticket.priority === 'critical' ? 'bg-rose-500/10 text-rose-500' :
                  ticket.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {ticket.priority}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{ticket.category}</span>
              </div>
              <h4 className="text-sm font-bold mb-1 truncate">{ticket.title}</h4>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="truncate max-w-[120px]">{ticket.userId}</span>
                <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center opacity-30 space-y-3">
              <MessageSquare className="w-12 h-12 mx-auto" />
              <p className="text-sm font-bold uppercase tracking-widest">No tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className={`flex-1 rounded-[2.5rem] border flex flex-col overflow-hidden ${
        isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <AnimatePresence mode="wait">
          {selectedTicket ? (
            <motion.div 
              key={selectedTicket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Ticket Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold`}>
                    {selectedTicket.category.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-none mb-1.5">{selectedTicket.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {selectedTicket.userId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ID: {selectedTicket.id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => closeTicket(selectedTicket.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Close Ticket
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* Initial Description */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Original Issue Description</span>
                  <p className="text-sm leading-relaxed">{selectedTicket.description}</p>
                </div>

                {selectedTicket.messages?.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'Admin Agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.sender === 'Admin Agent' 
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' 
                        : (isDark ? 'bg-white/10 text-white rounded-tl-none' : 'bg-slate-100 text-slate-900 rounded-tl-none')
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <span className={`text-[9px] mt-1 block opacity-60 font-bold uppercase`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Area */}
              <div className="p-6 border-t border-white/5">
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-inner'
                }`}>
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your official administrative response..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full resize-none h-10 py-2"
                  />
                  <button 
                    onClick={handleSendReply}
                    className="p-3 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Select a Support Ticket</h3>
              <p className="max-w-xs text-sm">Review institutional issues and provide real-time guidance to platform users.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
