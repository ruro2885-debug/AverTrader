import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Send, Paperclip, LifeBuoy, CheckCircle2, Clock, 
  AlertCircle, Plus, MessageSquare, Shield, Check, FileText, Image as ImageIcon, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, query, serverTimestamp } from 'firebase/firestore';

export interface SupportMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export default function SupportCenterPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketsPanel, setShowTicketsPanel] = useState(false);

  // New Ticket Form State
  const [newCategory, setNewCategory] = useState('Trading & Execution');
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('medium');
  const [newDescription, setNewDescription] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Chat Input State
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync tickets real-time with Firestore support_tickets collection
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'support_tickets'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTickets: SupportTicket[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as SupportTicket;
        if (data.userId === user.uid) {
          allTickets.push({ id: docSnap.id, ...data });
        }
      });

      // Sort newest first
      allTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setTickets(allTickets);
      setLoading(false);

      // If active ticket exists, keep it updated
      if (activeTicket) {
        const fresh = allTickets.find(t => t.id === activeTicket.id);
        if (fresh) setActiveTicket(fresh);
      } else if (allTickets.length > 0 && !activeTicket) {
        // Automatically open the most recent ticket if available
        setActiveTicket(allTickets[0]);
      }
    }, (error) => {
      console.error("Firestore support tickets sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  // Handle Create Ticket submission
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || !user) {
      triggerToast("Please fill in subject and description.", "error");
      return;
    }

    setSubmitting(true);
    const ticketId = "TCK-" + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    const initialMessage: SupportMessage = {
      id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
      sender: user.email || user.uid,
      text: newDescription,
      timestamp: now,
      ...(attachment ? { attachmentUrl: attachment.url, attachmentName: attachment.name } : {})
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user.uid,
      title: newSubject,
      category: newCategory,
      description: newDescription,
      status: 'open',
      priority: newPriority,
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage]
    };

    try {
      await setDoc(doc(db, 'support_tickets', ticketId), newTicket);
      triggerToast("Support ticket created successfully!", "success");
      
      // Reset form
      setNewSubject('');
      setNewDescription('');
      setAttachment(null);
      setShowCreateModal(false);
      
      // Automatically open the new ticket conversation
      setActiveTicket(newTicket);
    } catch (err) {
      console.error("Error creating ticket:", err);
      triggerToast("Failed to create support ticket.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Send Message in Active Conversation
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !messageText.trim() || !user) return;

    const text = messageText.trim();
    setMessageText('');

    const now = new Date().toISOString();
    const newMsg: SupportMessage = {
      id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
      sender: user.email || user.uid,
      text: text,
      timestamp: now
    };

    const updatedMessages = [...(activeTicket.messages || []), newMsg];

    // Optimistic update
    const updatedTicket = {
      ...activeTicket,
      updatedAt: now,
      messages: updatedMessages,
      status: 'pending' as const
    };
    setActiveTicket(updatedTicket);

    try {
      await updateDoc(doc(db, 'support_tickets', activeTicket.id), {
        messages: updatedMessages,
        updatedAt: now,
        status: 'pending'
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      triggerToast("Failed to send message.", "error");
    }
  };

  // File attachment simulation
  const handleAttachFile = () => {
    const mockFiles = [
      { name: 'error_stack_trace.log', url: '#' },
      { name: 'trade_execution_receipt.png', url: '#' },
      { name: 'verification_telemetry.pdf', url: '#' }
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachment(picked);
    triggerToast(`Attached ${picked.name}`, "info");
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${isDark ? 'bg-[#07090E] text-white' : 'bg-slate-50 text-slate-900'} font-sans overflow-hidden relative`}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-bold pointer-events-auto max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : toast.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {toast.type === 'info' && <LifeBuoy className="w-4 h-4 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Header */}
      <header className={`shrink-0 h-16 px-6 flex items-center justify-between border-b backdrop-blur-md ${isDark ? 'bg-[#0E121B]/90 border-white/5' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight">Support Center</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">24/7 Live Support</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">Connection: Online (Encrypted)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* My Tickets Button */}
          <button
            onClick={() => setShowTicketsPanel(!showTicketsPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>My Tickets</span>
            {tickets.length > 0 && (
              <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {tickets.length}
              </span>
            )}
          </button>

          {/* Create Support Ticket Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Support Ticket</span>
          </button>
        </div>
      </header>

      {/* Main Body: Chat Interface or Welcome Screen */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-bold">Connecting to Sovereign Support secure channel...</p>
            </div>
          ) : !activeTicket ? (
            /* First Time / No Active Conversation Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/10">
                <LifeBuoy className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Welcome to Support Center</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Need help with your account, deposits, withdrawals, trading, verification, or security? Send us a message below and our support specialists will assist you.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Create Support Ticket
              </button>
            </div>
          ) : (
            /* Active Ticket Conversation */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Ticket Status Bar */}
              <div className={`px-6 py-3 border-b flex items-center justify-between text-xs ${isDark ? 'bg-[#0E121B]/40 border-white/5' : 'bg-slate-100/60 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 font-bold">{activeTicket.id}</span>
                  <span className="font-bold">{activeTicket.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{activeTicket.category}</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    activeTicket.status === 'resolved' || activeTicket.status === 'closed'
                      ? 'bg-slate-800 text-slate-400'
                      : activeTicket.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {activeTicket.status}
                  </span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeTicket.messages?.map((msg, idx) => {
                  const isUser = msg.sender !== 'Admin Agent' && msg.sender !== 'Support Team';
                  return (
                    <motion.div 
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          {isUser ? 'You' : 'Support Specialist'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-2 shadow-md ${
                        isUser
                          ? 'bg-emerald-500 text-black font-semibold rounded-tr-none'
                          : isDark ? 'bg-[#121622] text-slate-200 border border-white/5 rounded-tl-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        {msg.attachmentName && (
                          <div className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-mono ${isUser ? 'bg-black/10 text-black' : 'bg-black/30 text-emerald-400'}`}>
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate">{msg.attachmentName}</span>
                          </div>
                        )}
                      </div>

                      {/* Delivered / Read indicators for user messages */}
                      {isUser && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-400 font-mono">
                          <span>✓✓ Delivered</span>
                          <span>• Read</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Support specialist is typing a response...</span>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Fixed Message Composer */}
              <form onSubmit={handleSendMessage} className={`shrink-0 p-4 border-t flex items-center gap-3 ${isDark ? 'bg-[#090C12] border-white/5' : 'bg-white border-slate-200 shadow-lg'}`}>
                
                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={handleAttachFile}
                  className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'}`}
                  title="Attach file or log"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {attachment && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] font-mono text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">{attachment.name}</span>
                    <button type="button" onClick={() => setAttachment(null)} className="hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Input Field */}
                <input
                  type="text"
                  placeholder="Type your message to support..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-black/40 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>

            </div>
          )}
        </div>

        {/* My Tickets Side Panel */}
        <AnimatePresence>
          {showTicketsPanel && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l z-30 flex flex-col shadow-2xl ${
                isDark ? 'bg-[#0E121B] border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">My Sovereign Tickets</h3>
                </div>
                <button 
                  onClick={() => setShowTicketsPanel(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setActiveTicket(ticket);
                        setShowTicketsPanel(false);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all ${
                        activeTicket?.id === ticket.id
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isDark ? 'bg-white/5 border-white/5 hover:border-white/10 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.id}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          ticket.status === 'resolved' || ticket.status === 'closed'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black truncate mb-1">{ticket.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{ticket.description}</p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <LifeBuoy className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs font-bold">No previous tickets found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Create Support Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl relative ${
                isDark ? 'bg-[#0E121B] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight">Create Support Ticket</h3>
                    <p className="text-[11px] text-slate-400">Directly connect with our specialist team</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Trading & Execution">Trading & Execution</option>
                    <option value="AI Strategy Copilot">AI Strategy Copilot</option>
                    <option value="Security & Biometrics">Security & Biometrics</option>
                    <option value="Deposits & Wallet">Deposits & Wallet</option>
                    <option value="Account & Verification">Account & Verification</option>
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deposit settlement delay, AI strategy desync..."
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-black/50 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="low">Low - General Inquiry</option>
                    <option value="medium">Medium - Standard Assistance</option>
                    <option value="high">High - Urgent Issue</option>
                    <option value="critical">Critical - System / Security Error</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide detailed information regarding your inquiry..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                      isDark ? 'bg-black/50 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Optional Attachment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Optional Attachment</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAttachFile}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>Attach File / Screenshot</span>
                    </button>
                    {attachment && (
                      <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {attachment.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {submitting ? "Creating Ticket..." : "Submit Ticket & Open Chat"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
