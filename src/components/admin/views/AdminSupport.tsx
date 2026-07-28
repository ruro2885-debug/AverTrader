import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Search, Filter, Clock, User, 
  Send, ChevronRight, CheckCircle2, AlertCircle, Trash2,
  Paperclip, Image as ImageIcon, FileText, ShieldCheck, ShieldAlert,
  Activity, DollarSign, ArrowLeft, MoreVertical, Plus, Check,
  Eye, AlertTriangle, RefreshCw, X, Radio, UserCheck, UserX, Tag,
  Bot, Sparkles, CheckCheck, FileUp, Lock, LifeBuoy, Layers, ArrowUpRight
} from 'lucide-react';
import { collection, onSnapshot, query, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';

export interface SupportMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'file' | 'pdf' | 'audio';
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  category: string;
  description: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  attachmentUrl?: string;
  messages: SupportMessage[];
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  fullName?: string;
  username?: string;
  photoURL?: string;
  avatar?: string;
  status?: string;
  createdAt?: string;
}

export interface UserLiveSummary {
  user: UserProfile;
  tickets: SupportTicket[];
  latestTicket: SupportTicket | null;
  lastMessage: SupportMessage | null;
  lastMessageTime: string;
  unreadCount: number;
}

export interface UserTicketSummary {
  user: UserProfile;
  tickets: SupportTicket[];
  openTicketCount: number;
  totalTicketCount: number;
  latestTicket: SupportTicket;
}

export default function AdminSupport({ theme }: { theme: 'light' | 'dark' }) {
  const [activeTab, setActiveTab] = useState<'live' | 'tickets'>('live');
  
  // Real-time Firestore stores
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  // Navigation / Selection State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Input states
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Attachment states
  const [attachment, setAttachment] = useState<{ name: string; url: string; type: 'image' | 'file' | 'pdf' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user: authAdmin } = useAuth();

  // 1. Real-time Users Collection Listener
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map: Record<string, UserProfile> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          uid: d.id,
          email: data.email || `${d.id.slice(0, 8)}@aver.com`,
          displayName: data.displayName || data.fullName || (data.email ? data.email.split('@')[0] : 'AVER Trader'),
          fullName: data.fullName || data.displayName || 'AVER Trader',
          username: data.username || (data.email ? data.email.split('@')[0] : `user_${d.id.slice(0, 5)}`),
          photoURL: data.photoURL || data.avatar,
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString()
        };
      });
      setUsersMap(map);
    }, (err) => {
      console.warn("Users sync notice:", err);
    });

    return () => unsubUsers();
  }, []);

  // 2. Real-time Support Tickets Sync Listener
  useEffect(() => {
    const unsubTickets = onSnapshot(collection(db, 'support_tickets'), (snap) => {
      const data: SupportTicket[] = snap.docs.map(docSnap => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          userId: docData.userId || 'unknown',
          userEmail: docData.userEmail || '',
          userName: docData.userName || '',
          title: docData.title || 'Support Request',
          category: docData.category || 'General',
          description: docData.description || '',
          status: docData.status || 'open',
          priority: docData.priority || 'medium',
          createdAt: docData.createdAt || new Date().toISOString(),
          updatedAt: docData.updatedAt || docData.createdAt || new Date().toISOString(),
          adminNotes: docData.adminNotes || '',
          attachmentUrl: docData.attachmentUrl || '',
          messages: Array.isArray(docData.messages) ? docData.messages : []
        };
      });

      // Sort newest updated first
      data.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

      setTickets(data);
      setLoading(false);
    }, (err) => {
      console.warn("Support tickets sync notice:", err);
      setLoading(false);
    });

    return () => unsubTickets();
  }, []);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tickets, selectedUserId, selectedTicketId, activeTab]);

  // Sync admin notes input when active ticket changes
  useEffect(() => {
    if (selectedTicketId) {
      const t = tickets.find(tk => tk.id === selectedTicketId);
      if (t) setAdminNotes(t.adminNotes || '');
    }
  }, [selectedTicketId, tickets]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result as string,
        type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'file'
      });
    };
    reader.readAsDataURL(file);
  };

  // Grouping for Messages Tab (User Cards)
  const userLiveSummaries: UserLiveSummary[] = React.useMemo(() => {
    const groupsMap: Record<string, SupportTicket[]> = {};

    tickets.forEach(t => {
      const uid = t.userId || 'anonymous';
      if (!groupsMap[uid]) groupsMap[uid] = [];
      groupsMap[uid].push(t);
    });

    return Object.keys(groupsMap).map(uid => {
      const userTickets = groupsMap[uid];
      userTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const latestTicket = userTickets[0] || null;

      // Extract all messages across user's tickets
      const allMsgs: SupportMessage[] = [];
      userTickets.forEach(t => {
        if (t.messages && t.messages.length > 0) {
          allMsgs.push(...t.messages);
        }
      });

      allMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const lastMessage = allMsgs.length > 0 ? allMsgs[allMsgs.length - 1] : null;
      const lastMessageTime = lastMessage?.timestamp || latestTicket?.updatedAt || latestTicket?.createdAt || new Date().toISOString();

      // Count unread (user messages without admin response or unread status)
      const unreadCount = allMsgs.filter(m => m.sender !== 'AVER Specialist' && m.sender !== 'Admin' && m.status !== 'read').length;

      // User detail lookup
      const userDoc = usersMap[uid];
      const fallbackEmail = latestTicket?.userEmail || `${uid.slice(0, 8)}@aver.com`;
      const fallbackName = latestTicket?.userName || fallbackEmail.split('@')[0];

      const user: UserProfile = {
        uid: uid,
        email: userDoc?.email || fallbackEmail,
        displayName: userDoc?.displayName || userDoc?.fullName || fallbackName,
        fullName: userDoc?.fullName || userDoc?.displayName || fallbackName,
        username: userDoc?.username || `@${fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        photoURL: userDoc?.photoURL || userDoc?.avatar,
        status: userDoc?.status || 'active'
      };

      return {
        user,
        tickets: userTickets,
        latestTicket,
        lastMessage,
        lastMessageTime,
        unreadCount
      };
    }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }, [tickets, usersMap]);

  // Grouping for Tickets Tab (User Cards with Tickets list)
  const userTicketSummaries: UserTicketSummary[] = React.useMemo(() => {
    const groupsMap: Record<string, SupportTicket[]> = {};

    tickets.forEach(t => {
      const uid = t.userId || 'anonymous';
      if (!groupsMap[uid]) groupsMap[uid] = [];
      groupsMap[uid].push(t);
    });

    return Object.keys(groupsMap).map(uid => {
      const userTickets = groupsMap[uid];
      userTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const latestTicket = userTickets[0];
      const openTicketCount = userTickets.filter(t => t.status === 'open' || t.status === 'pending').length;

      const userDoc = usersMap[uid];
      const fallbackEmail = latestTicket?.userEmail || `${uid.slice(0, 8)}@aver.com`;
      const fallbackName = latestTicket?.userName || fallbackEmail.split('@')[0];

      const user: UserProfile = {
        uid: uid,
        email: userDoc?.email || fallbackEmail,
        displayName: userDoc?.displayName || userDoc?.fullName || fallbackName,
        fullName: userDoc?.fullName || userDoc?.displayName || fallbackName,
        username: userDoc?.username || `@${fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        photoURL: userDoc?.photoURL || userDoc?.avatar,
        status: userDoc?.status || 'active'
      };

      return {
        user,
        tickets: userTickets,
        openTicketCount,
        totalTicketCount: userTickets.length,
        latestTicket
      };
    }).sort((a, b) => new Date(b.latestTicket.updatedAt).getTime() - new Date(a.latestTicket.updatedAt).getTime());
  }, [tickets, usersMap]);

  // Filtered List Search
  const filteredLiveUsers = userLiveSummaries.filter(item => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      item.user.displayName?.toLowerCase().includes(term) ||
      item.user.email?.toLowerCase().includes(term) ||
      item.user.username?.toLowerCase().includes(term) ||
      item.user.uid.toLowerCase().includes(term) ||
      (item.lastMessage?.text || '').toLowerCase().includes(term)
    );
  });

  const filteredTicketUsers = userTicketSummaries.filter(item => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    
    // Status Filter
    if (statusFilter !== 'all') {
      const hasStatus = item.tickets.some(t => t.status === statusFilter);
      if (!hasStatus) return false;
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      const hasPriority = item.tickets.some(t => t.priority === priorityFilter);
      if (!hasPriority) return false;
    }

    return (
      item.user.displayName?.toLowerCase().includes(term) ||
      item.user.email?.toLowerCase().includes(term) ||
      item.user.username?.toLowerCase().includes(term) ||
      item.user.uid.toLowerCase().includes(term) ||
      item.tickets.some(t => t.title.toLowerCase().includes(term) || t.id.toLowerCase().includes(term))
    );
  });

  // Selected User Data
  const selectedUserLiveSummary = selectedUserId ? userLiveSummaries.find(s => s.user.uid === selectedUserId) : null;
  const selectedUserTicketSummary = selectedUserId ? userTicketSummaries.find(s => s.user.uid === selectedUserId) : null;
  const activeTicketDetail = selectedTicketId ? tickets.find(t => t.id === selectedTicketId) : null;

  // Primary Live Chat Ticket for selected user
  const activeLiveTicket = React.useMemo(() => {
    if (!selectedUserLiveSummary || selectedUserLiveSummary.tickets.length === 0) return null;
    return selectedUserLiveSummary.tickets[0];
  }, [selectedUserLiveSummary]);

  // Send Admin Reply
  const handleSendAdminReply = async (ticketId: string) => {
    if (!replyText.trim() && !attachment && !selectedFile) return;

    setSendingReply(true);
    const text = replyText.trim();
    setReplyText('');

    const targetTicket = tickets.find(t => t.id === ticketId);
    if (!targetTicket) {
      setSendingReply(false);
      return;
    }

    const now = new Date().toISOString();
    let finalAttachmentUrl = attachment?.url || '';

    if (selectedFile) {
      try {
        const storageRef = ref(storage, `support_attachments/${ticketId}/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        finalAttachmentUrl = await getDownloadURL(uploadResult.ref);
      } catch (err) {
        console.warn("Storage upload fallback to Data URL:", err);
        finalAttachmentUrl = attachment?.url || '';
      }
    }

    const adminMsg: SupportMessage = {
      id: "MSG-ADM-" + Math.floor(100000 + Math.random() * 900000),
      sender: "AVER Specialist",
      text: text || "Sent an attachment.",
      timestamp: now,
      status: 'delivered',
      ...(finalAttachmentUrl ? {
        attachmentUrl: finalAttachmentUrl,
        attachmentName: attachment?.name || selectedFile?.name || 'Attachment',
        attachmentType: attachment?.type || (selectedFile?.type.startsWith('image/') ? 'image' : 'file')
      } : {})
    };

    setAttachment(null);
    setSelectedFile(null);

    const updatedMessages = [...(targetTicket.messages || []), adminMsg];

    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        messages: updatedMessages,
        updatedAt: now,
        status: targetTicket.status === 'open' ? 'pending' : targetTicket.status
      });
    } catch (err) {
      console.error("Error sending admin reply:", err);
      alert("Failed to send message. Please retry.");
    } finally {
      setSendingReply(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (ticketId: string, newStatus: 'open' | 'pending' | 'resolved' | 'closed') => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  // Update Priority
  const handleUpdatePriority = async (ticketId: string, newPriority: 'low' | 'medium' | 'high' | 'critical') => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        priority: newPriority,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error updating priority:", err);
    }
  };

  // Save Admin Notes
  const handleSaveNotes = async (ticketId: string) => {
    setSavingNotes(true);
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        adminNotes: adminNotes.trim(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error saving admin notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'high': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'open': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'resolved': return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'closed': return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0B0E14] text-slate-100 font-sans flex flex-col overflow-hidden relative selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*,.pdf,.doc,.docx,.txt" 
        className="hidden" 
      />

      {/* Top Header Bar */}
      <header className="shrink-0 bg-[#0F131C] border-b border-slate-800/80 px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Support Terminal
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Hub
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Institutional Admin Customer Support Workspace</p>
            </div>
          </div>
        </div>

        {/* Tab Selection & Metrics */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => { setActiveTab('live'); setSelectedUserId(null); setSelectedTicketId(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'live' 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-black' 
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages ({filteredLiveUsers.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('tickets'); setSelectedUserId(null); setSelectedTicketId(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'tickets' 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-black' 
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tickets ({filteredTicketUsers.length})</span>
          </button>
        </div>
      </header>

      {/* Main Terminal Workspace Container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14] relative">

        {/* Filter & Search Toolbar (Only visible on User List view) */}
        {!selectedUserId && (
          <div className="shrink-0 bg-[#0F131C]/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === 'live' ? "Search users, email, UID, messages..." : "Search tickets, user, subject, ID..."}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141923] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'tickets' && (
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#141923] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e: any) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#141923] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B0E14]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Support Desk...</p>
            </div>
          ) : activeTab === 'live' ? (
            
            /* =========================================================
               TAB 1: MESSAGES (LIVE CONVERSATIONS)
               ========================================================= */
            !selectedUserId ? (
              
              /* USER LIST (MESSAGES TAB) */
              filteredLiveUsers.length === 0 ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800/80 rounded-3xl bg-[#0F131C]/50">
                  <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Conversations Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">Users will appear here as soon as they start a support conversation.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLiveUsers.map((item) => (
                    <motion.div
                      key={item.user.uid}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedUserId(item.user.uid)}
                      className="cursor-pointer bg-[#121620] hover:bg-[#161B27] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-lg flex flex-col justify-between space-y-3"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black flex items-center justify-center text-base shadow-md shrink-0">
                            {(item.user.displayName || item.user.fullName || item.user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {item.user.displayName || item.user.fullName}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">{item.user.email}</p>
                            <p className="text-[10px] text-emerald-400/80 font-mono truncate">{item.user.username}</p>
                          </div>
                        </div>

                        {item.unreadCount > 0 && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black shadow-md shadow-emerald-500/20">
                            {item.unreadCount} NEW
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <div className="bg-[#0B0E14] rounded-xl p-2.5 border border-slate-800/80">
                        <p className="text-xs text-slate-300 line-clamp-2 italic">
                          "{item.lastMessage?.text || item.latestTicket?.description || 'Support session initiated.'}"
                        </p>
                      </div>

                      {/* Bottom Footer Details */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                        <span className="truncate">UID: {item.user.uid.slice(0, 10)}...</span>
                        <span className="shrink-0 text-slate-400">{formatTimestamp(item.lastMessageTime)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )

            ) : (

              /* USER CHAT WORKSPACE (MESSAGES TAB) */
              selectedUserLiveSummary ? (
                <div className="h-full flex flex-col bg-[#121620] border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Chat Header */}
                  <div className="shrink-0 bg-[#161B27] px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                        {(selectedUserLiveSummary.user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedUserLiveSummary.user.displayName || selectedUserLiveSummary.user.fullName}
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            {selectedUserLiveSummary.user.username}
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">{selectedUserLiveSummary.user.email} • UID: {selectedUserLiveSummary.user.uid}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        Live Conversation
                      </span>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0B0E14]">
                    {activeLiveTicket?.messages && activeLiveTicket.messages.length > 0 ? (
                      activeLiveTicket.messages.map((msg, idx) => {
                        const isAdmin = msg.sender === 'AVER Specialist' || msg.sender === 'Admin';
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {isAdmin ? 'AVER Specialist (You)' : msg.sender}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {formatTimestamp(msg.timestamp)}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAdmin
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                                  : 'bg-[#181D29] text-white border border-slate-800 rounded-tl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                              {msg.attachmentUrl && (
                                <div className="mt-2 pt-2 border-t border-black/10">
                                  {msg.attachmentType === 'image' || msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block mt-1">
                                      <img src={msg.attachmentUrl} alt="attachment" className="max-h-48 rounded-lg object-cover border border-white/20" />
                                    </a>
                                  ) : (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-mono underline hover:opacity-80">
                                      <Paperclip className="w-3.5 h-3.5" />
                                      <span>{msg.attachmentName || 'View Attached File'}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-xs font-bold">No messages in this workspace yet.</p>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Reply Composer Bar */}
                  {activeLiveTicket && (
                    <div className="shrink-0 bg-[#161B27] p-3 sm:p-4 border-t border-slate-800">
                      {attachment && (
                        <div className="mb-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="truncate max-w-xs">{attachment.name}</span>
                          <button onClick={() => { setAttachment(null); setSelectedFile(null); }} className="hover:text-white ml-auto">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
                          title="Attach document or image"
                        >
                          <Paperclip className="w-4 h-4 text-emerald-400" />
                        </button>

                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !sendingReply && handleSendAdminReply(activeLiveTicket.id)}
                          placeholder="Type specialist reply..."
                          className="flex-1 px-4 py-3 rounded-xl bg-[#0B0E14] border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />

                        <button
                          onClick={() => handleSendAdminReply(activeLiveTicket.id)}
                          disabled={sendingReply || (!replyText.trim() && !attachment && !selectedFile)}
                          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-500/20"
                        >
                          {sendingReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span className="hidden sm:inline">Send Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            )

          ) : (

            /* =========================================================
               TAB 2: TICKETS (TICKETS BY USER)
               ========================================================= */
            !selectedUserId ? (

              /* USER CARDS LIST (TICKETS TAB) */
              filteredTicketUsers.length === 0 ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800/80 rounded-3xl bg-[#0F131C]/50">
                  <Layers className="w-12 h-12 text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">No Support Tickets Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">Submitted support tickets will appear grouped by user.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTicketUsers.map((item) => (
                    <motion.div
                      key={item.user.uid}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => { setSelectedUserId(item.user.uid); setSelectedTicketId(null); }}
                      className="cursor-pointer bg-[#121620] hover:bg-[#161B27] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 transition-all shadow-lg flex flex-col justify-between space-y-3"
                    >
                      {/* Top Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-base shadow-md shrink-0">
                            {(item.user.displayName || item.user.fullName || item.user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {item.user.displayName || item.user.fullName}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">{item.user.email}</p>
                            <p className="text-[10px] text-emerald-400/80 font-mono truncate">{item.user.username}</p>
                          </div>
                        </div>

                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          item.openTicketCount > 0 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {item.openTicketCount} Open
                        </span>
                      </div>

                      {/* Latest Ticket Subject */}
                      <div className="bg-[#0B0E14] rounded-xl p-2.5 border border-slate-800/80">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>{item.latestTicket.id}</span>
                          <span className={`px-1.5 py-0.2 rounded border uppercase font-extrabold ${getStatusStyle(item.latestTicket.status)}`}>
                            {item.latestTicket.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">{item.latestTicket.title}</p>
                      </div>

                      {/* Footer Stats */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                        <span>Total Tickets: {item.totalTicketCount}</span>
                        <span className="text-slate-400">{formatTimestamp(item.latestTicket.updatedAt)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )

            ) : !selectedTicketId ? (

              /* USER'S TICKETS LIST (TICKETS TAB) */
              selectedUserTicketSummary ? (
                <div className="space-y-4">
                  {/* User Banner Header */}
                  <div className="bg-[#121620] border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                        {(selectedUserTicketSummary.user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                          {selectedUserTicketSummary.user.displayName || selectedUserTicketSummary.user.fullName}
                          <span className="text-xs text-slate-400 font-mono">({selectedUserTicketSummary.user.username})</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">{selectedUserTicketSummary.user.email} • UID: {selectedUserTicketSummary.user.uid}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-300">{selectedUserTicketSummary.tickets.length} Total Tickets</span>
                    </div>
                  </div>

                  {/* List of user tickets */}
                  <div className="space-y-3">
                    {selectedUserTicketSummary.tickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className="cursor-pointer bg-[#121620] hover:bg-[#161B27] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-emerald-400">{t.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusStyle(t.status)}`}>
                              {t.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getPriorityStyle(t.priority)}`}>
                              {t.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 bg-slate-800 rounded">
                              {t.category}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{t.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-xs text-slate-500 font-mono">{formatTimestamp(t.updatedAt)}</span>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null

            ) : (

              /* SPECIFIC TICKET DETAIL WORKSPACE */
              activeTicketDetail ? (
                <div className="h-full flex flex-col bg-[#121620] border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Top Bar */}
                  <div className="shrink-0 bg-[#161B27] px-4 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedTicketId(null)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black text-emerald-400">{activeTicketDetail.id}</span>
                          <span className="text-xs text-slate-400">• {activeTicketDetail.category}</span>
                        </div>
                        <h2 className="text-base font-bold text-white">{activeTicketDetail.title}</h2>
                      </div>
                    </div>

                    {/* Status & Priority Selectors */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                        <select
                          value={activeTicketDetail.status}
                          onChange={(e: any) => handleUpdateStatus(activeTicketDetail.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                        <select
                          value={activeTicketDetail.priority}
                          onChange={(e: any) => handleUpdatePriority(activeTicketDetail.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-slate-700 text-xs font-bold text-amber-400 focus:outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0B0E14]">
                    {/* Admin Notes Collapsible / Section */}
                    <div className="bg-[#121620] border border-slate-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          Internal Admin Notes
                        </span>
                        <button
                          onClick={() => handleSaveNotes(activeTicketDetail.id)}
                          disabled={savingNotes}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          {savingNotes ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-emerald-400" />}
                          <span>Save Notes</span>
                        </button>
                      </div>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes visible only to administrators..."
                        className="w-full p-3 rounded-xl bg-[#0B0E14] border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none h-16"
                      />
                    </div>

                    {/* Messages Thread */}
                    <div className="space-y-4">
                      {activeTicketDetail.messages && activeTicketDetail.messages.length > 0 ? (
                        activeTicketDetail.messages.map((msg, idx) => {
                          const isAdmin = msg.sender === 'AVER Specialist' || msg.sender === 'Admin';
                          return (
                            <div
                              key={msg.id || idx}
                              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {isAdmin ? 'AVER Specialist (You)' : msg.sender}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {formatTimestamp(msg.timestamp)}
                                </span>
                              </div>

                              <div
                                className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                  isAdmin
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-tr-none shadow-md'
                                    : 'bg-[#181D29] text-white border border-slate-800 rounded-tl-none'
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                                {msg.attachmentUrl && (
                                  <div className="mt-2 pt-2 border-t border-black/10">
                                    {msg.attachmentType === 'image' || msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block mt-1">
                                        <img src={msg.attachmentUrl} alt="attachment" className="max-h-48 rounded-lg object-cover border border-white/20" />
                                      </a>
                                    ) : (
                                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-mono underline hover:opacity-80">
                                        <Paperclip className="w-3.5 h-3.5" />
                                        <span>{msg.attachmentName || 'View Attached File'}</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 rounded-xl bg-[#121620] border border-slate-800 text-xs text-slate-300">
                          <p className="font-bold text-slate-200">Ticket Description:</p>
                          <p className="mt-1 text-slate-400">{activeTicketDetail.description}</p>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </div>

                  {/* Reply Composer Bar */}
                  <div className="shrink-0 bg-[#161B27] p-3 sm:p-4 border-t border-slate-800">
                    {attachment && (
                      <div className="mb-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-xs">{attachment.name}</span>
                        <button onClick={() => { setAttachment(null); setSelectedFile(null); }} className="hover:text-white ml-auto">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
                        title="Attach document or image"
                      >
                        <Paperclip className="w-4 h-4 text-emerald-400" />
                      </button>

                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !sendingReply && handleSendAdminReply(activeTicketDetail.id)}
                        placeholder="Type ticket response..."
                        className="flex-1 px-4 py-3 rounded-xl bg-[#0B0E14] border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                      />

                      <button
                        onClick={() => handleSendAdminReply(activeTicketDetail.id)}
                        disabled={sendingReply || (!replyText.trim() && !attachment && !selectedFile)}
                        className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-emerald-500/20"
                      >
                        {sendingReply ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Send Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null

            )
          )}
        </div>
      </main>
    </div>
  );
}
