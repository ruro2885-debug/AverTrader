import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Bell, RefreshCw, Clock, CheckCircle2, 
  LifeBuoy, HelpCircle, Send, ChevronDown, ChevronUp, 
  Bug, AlertTriangle, Shield, Terminal, MessageSquare, 
  Check, Info, Sparkles, User, AlertCircle, Copy, FileText,
  Layers, HardDrive, Network
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';

// Types
export interface SupportMessage {
  id: string;
  sender: 'USER' | 'SUPPORT';
  text: string;
  timestamp: string; // ISO String
}

export interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  category: 'Trading & Execution' | 'AI Strategy Copilot' | 'Security & Biometrics' | 'Deposits & Wallet' | 'Bug Report';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESC-QUANT-1';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  messages: SupportMessage[];
  diagnostics?: {
    userAgent: string;
    os: string;
    devPort: string;
    frameSandbox: string;
    attachLogs: boolean;
  };
}

// Initial/default knowledge base FAQs
interface FAQItem {
  question: string;
  answer: string;
  category: 'trading' | 'ai' | 'security' | 'wallet';
}

const FAQ_DATABASE: FAQItem[] = [
  {
    category: 'trading',
    question: 'How do I execute high-leverage neural copy trades?',
    answer: 'Navigate to the Discover tab and click "Top Traders" inside the Copy Trade section. You can browse high-performance quant traders, review their APY and risk ratings, and replicate their configurations with one-click.'
  },
  {
    category: 'trading',
    question: 'Are simulated trades settled on a real-time ledger?',
    answer: 'Yes! All demo and copy trades are fully logged and settled on our persistent Firestore database, ensuring zero data loss and maintaining absolute portfolio synchronization across logins.'
  },
  {
    category: 'ai',
    question: 'What is the Aver V3.5 Neural Engine?',
    answer: 'The V3.5 Neural Engine is an algorithmic copilot that analyzes multi-exchange market feeds to suggest and execute trades. You can customize risk weights, active trade limits, and maximum drawdown limits in your settings.'
  },
  {
    category: 'ai',
    question: 'Can I disable the autonomous AI trading module?',
    answer: 'Yes, you have full control. Go to your settings or the AI Trading page and toggle "Autonomous Mode" off. The module will transition into standard passive signal generation.'
  },
  {
    category: 'security',
    question: 'Is my digital footprint safe with holographic KYC scanning?',
    answer: 'Absolutely. Aver utilizes zero-knowledge cryptographic proofs to verify face-scan telemetry without storing raw image files, providing unmatched privacy and security.'
  },
  {
    category: 'security',
    question: 'Which network port is strictly designated for development ingress?',
    answer: 'Port 3000 is strictly designated for external ingress. Our reverse-proxy layers securely route all dev traffic through port 3000. Avoid changing the PORT configuration to prevent connection loss.'
  },
  {
    category: 'wallet',
    question: 'How fast are simulated wallet deposits processed?',
    answer: 'Simulated deposits (such as the $100 onboarding bonus) settle instantly. Funds are added directly to your available balance and portfolio value, immediately triggering state updates across all screens.'
  },
  {
    category: 'wallet',
    question: 'How do I withdraw simulated profits?',
    answer: 'Withdrawals are initiated from the Portfolio or Wallet tab. Enter your simulated external wallet address, click withdraw, and the ledger will record the transaction history instantly.'
  }
];

export default function SupportCenterPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const { user, addNotification } = useAuth();

  // Local/Firebase Ticket States
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<'all' | 'trading' | 'ai' | 'security' | 'wallet'>('all');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'create'>('faq');

  // New ticket state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicket['category']>('Trading & Execution');
  const [newPriority, setNewPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [newDesc, setNewDesc] = useState('');
  const [attachLogs, setAttachLogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selected Ticket for Chat
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Diagnostics parameters (Simulated)
  const diagnosticsInfo = useMemo(() => {
    return {
      userAgent: navigator.userAgent.substring(0, 70) + '...',
      os: navigator.platform || 'Linux x86_64',
      devPort: 'Port 3000 (Ingress Secured)',
      frameSandbox: 'Active & Encrypted'
    };
  }, []);

  // UI styling helpers
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgCard = isDark
    ? "bg-[#0E121B] border border-white/5 shadow-xl"
    : "bg-white border border-slate-200 shadow-md";
  const bgApp = isDark ? "bg-[#07090E]" : "bg-slate-50";

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const triggerToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Sync tickets real-time
  useEffect(() => {
    if (!user?.uid) {
      // Load offline tickets from localStorage
      const saved = localStorage.getItem('aver_support_tickets');
      if (saved) {
        try {
          setTickets(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setTickets([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'users', user.uid, 'supportTickets');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: SupportTicket[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as SupportTicket);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTickets(list);
      setLoading(false);

      // Keep selected ticket references fresh
      if (selectedTicket) {
        const fresh = list.find(t => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      }
    }, (error) => {
      console.error("Firestore support tickets sync failure:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, selectedTicket?.id]);

  // Scroll Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Filter FAQs
  const filteredFAQs = useMemo(() => {
    return FAQ_DATABASE.filter(faq => {
      const matchesCategory = selectedFaqCategory === 'all' || faq.category === selectedFaqCategory;
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedFaqCategory]);

  // Bot Auto Reply Engine
  const generateBotReply = useCallback((ticketTitle: string, userText: string): string => {
    const text = userText.toLowerCase() + " " + ticketTitle.toLowerCase();
    
    if (text.includes('port') || text.includes('3000')) {
      return "Greetings, Quant Operator. Dev ingress routing is strictly mapped to Port 3000. All external traffic is reverse-proxied with absolute security controls. Do not modify server port environments.";
    }
    if (text.includes('kyc') || text.includes('scan') || text.includes('face')) {
      return "Holographic Face KYC is settled locally using Zero-Knowledge mathematical models. No private biometrics are serialized or stored outside the authenticated sandboxed Firestore db.";
    }
    if (text.includes('deposit') || text.includes('funding') || text.includes('fund') || text.includes('withdraw')) {
      return "Wallet ledger transaction confirmed. All simulated credits (e.g. $100 starter deposits, campaign rewards) reside on our secure Firebase backend and instantly populate across your master portfolios.";
    }
    if (text.includes('ai') || text.includes('copilot') || text.includes('neural') || text.includes('weights')) {
      return "Neural Engine V3.5 parameters compiled. Autonomous trading operations are fully synchronized with real-time Firestore activity logs. Adjust capital exposure limits via settings to configure risk.";
    }
    if (text.includes('bug') || text.includes('error') || text.includes('desync') || text.includes('crash')) {
      return "System diagnostics payload received and securely transferred to our Quant Ops Level 3. Interactive thread diagnostics indicate standard system boundaries are fully green.";
    }

    return "Thank you for contacting the Sovereign Quant Desk. Your interactive ticket has been categorized and queued. An engineering response is active on this terminal channel.";
  }, []);

  // Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      triggerToast("Please fill in all required ticket fields.", "error");
      return;
    }

    setSubmitting(true);
    const ticketId = "TCK-" + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    const initialMessage: SupportMessage = {
      id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
      sender: 'USER',
      text: newDesc,
      timestamp: now
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user?.uid || 'offline-guest',
      title: newTitle,
      category: newCategory,
      description: newDesc,
      status: 'OPEN',
      priority: newPriority,
      createdAt: now,
      updatedAt: now,
      messages: [initialMessage]
    };

    if (newCategory === 'Bug Report') {
      newTicket.diagnostics = {
        ...diagnosticsInfo,
        attachLogs
      };
    }

    try {
      if (user?.uid) {
        // Save to Firestore subcollection
        await setDoc(doc(db, 'users', user.uid, 'supportTickets', ticketId), newTicket);

        // Add user activity log
        await addDoc(collection(db, 'users', user.uid, 'activity'), {
          id: "ACT-" + Date.now(),
          userId: user.uid,
          type: 'support',
          message: `Opened ${newCategory} support ticket: "${newTitle}" (ID: ${ticketId})`,
          timestamp: now
        });
      } else {
        // Guest offline fallback
        const saved = localStorage.getItem('aver_support_tickets');
        let current: SupportTicket[] = [];
        if (saved) {
          try {
            current = JSON.parse(saved);
          } catch (e) {
            console.error(e);
          }
        }
        current.unshift(newTicket);
        localStorage.setItem('aver_support_tickets', JSON.stringify(current));
        setTickets(current);
      }

      // Add system-wide in-app notification
      await addNotification(
        'system',
        'medium',
        'Support Ticket Opened',
        `Support ticket ${ticketId} is now active. Our engineering team is reviewing your diagnostics.`,
        undefined,
        undefined,
        { ticketId }
      );

      triggerToast(`Ticket ${ticketId} created successfully!`, "success");

      // Reset form
      setNewTitle('');
      setNewDesc('');
      
      // Auto reply simulation after 1.5 seconds to make it highly interactive!
      setTimeout(async () => {
        const botMsgText = generateBotReply(newTitle, newDesc);
        const botMsg: SupportMessage = {
          id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
          sender: 'SUPPORT',
          text: botMsgText,
          timestamp: new Date().toISOString()
        };

        const replyTicket = {
          ...newTicket,
          status: 'IN_PROGRESS' as const,
          updatedAt: new Date().toISOString(),
          messages: [...newTicket.messages, botMsg]
        };

        if (user?.uid) {
          const tDoc = doc(db, 'users', user.uid, 'supportTickets', ticketId);
          await updateDoc(tDoc, {
            status: 'IN_PROGRESS',
            updatedAt: new Date().toISOString(),
            messages: replyTicket.messages
          });
        } else {
          const saved = localStorage.getItem('aver_support_tickets');
          let current: SupportTicket[] = [];
          if (saved) {
            try { current = JSON.parse(saved); } catch (e) {}
          }
          current = current.map(t => t.id === ticketId ? replyTicket : t);
          localStorage.setItem('aver_support_tickets', JSON.stringify(current));
          setTickets(current);
        }

        // Send a notification that support replied
        await addNotification(
          'system',
          'high',
          'Support Analyst Message',
          `Sovereign Support has replied to ticket ${ticketId}: "${botMsgText.substring(0, 60)}..."`,
          undefined,
          undefined,
          { ticketId }
        );
      }, 1500);

      // Navigate to tickets tab
      setActiveTab('tickets');
    } catch (err) {
      console.error(err);
      triggerToast("Failed to submit support ticket.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit chat reply
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');

    const now = new Date().toISOString();
    const newUserMsg: SupportMessage = {
      id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
      sender: 'USER',
      text: userText,
      timestamp: now
    };

    const updatedMessages = [...selectedTicket.messages, newUserMsg];
    
    // Update local state temporarily for snappy UI
    const tempTicket = {
      ...selectedTicket,
      updatedAt: now,
      messages: updatedMessages
    };
    setSelectedTicket(tempTicket);

    try {
      if (user?.uid) {
        const docRef = doc(db, 'users', user.uid, 'supportTickets', selectedTicket.id);
        await updateDoc(docRef, {
          updatedAt: now,
          messages: updatedMessages
        });
      } else {
        const saved = localStorage.getItem('aver_support_tickets');
        let current: SupportTicket[] = [];
        if (saved) {
          try { current = JSON.parse(saved); } catch (e) {}
        }
        current = current.map(t => t.id === selectedTicket.id ? tempTicket : t);
        localStorage.setItem('aver_support_tickets', JSON.stringify(current));
        setTickets(current);
      }

      // Live Bot Reply Simulation
      setTimeout(async () => {
        const botReplyText = generateBotReply(selectedTicket.title, userText);
        const botMsg: SupportMessage = {
          id: "MSG-" + Math.floor(100000 + Math.random() * 900000),
          sender: 'SUPPORT',
          text: botReplyText,
          timestamp: new Date().toISOString()
        };

        const finalMessages = [...updatedMessages, botMsg];
        const finalTicket = {
          ...selectedTicket,
          status: 'ESC-QUANT-1' as const, // escalate slightly to make user feel valued!
          updatedAt: new Date().toISOString(),
          messages: finalMessages
        };

        if (user?.uid) {
          const docRef = doc(db, 'users', user.uid, 'supportTickets', selectedTicket.id);
          await updateDoc(docRef, {
            status: 'ESC-QUANT-1',
            updatedAt: new Date().toISOString(),
            messages: finalMessages
          });
        } else {
          const saved = localStorage.getItem('aver_support_tickets');
          let current: SupportTicket[] = [];
          if (saved) {
            try { current = JSON.parse(saved); } catch (e) {}
          }
          current = current.map(t => t.id === selectedTicket.id ? finalTicket : t);
          localStorage.setItem('aver_support_tickets', JSON.stringify(current));
          setTickets(current);
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      triggerToast("Error sending message.", "error");
    }
  };

  // Close Ticket
  const handleResolveTicket = async (ticket: SupportTicket) => {
    const now = new Date().toISOString();
    try {
      if (user?.uid) {
        const docRef = doc(db, 'users', user.uid, 'supportTickets', ticket.id);
        await updateDoc(docRef, {
          status: 'RESOLVED',
          updatedAt: now
        });
      } else {
        const saved = localStorage.getItem('aver_support_tickets');
        let current: SupportTicket[] = [];
        if (saved) {
          try { current = JSON.parse(saved); } catch (e) {}
        }
        current = current.map(t => t.id === ticket.id ? { ...t, status: 'RESOLVED', updatedAt: now } : t);
        localStorage.setItem('aver_support_tickets', JSON.stringify(current));
        setTickets(current);
      }
      triggerToast(`Ticket ${ticket.id} marked as resolved!`, "success");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`absolute inset-0 z-50 flex flex-col ${bgApp} overflow-hidden font-sans`}
    >
      {/* Decorative Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,#10b981,transparent_50%)]"></div>
      
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 h-[64px] flex items-center justify-between px-5 border-b backdrop-blur-md ${isDark ? 'bg-[#07090E]/95 border-white/5' : 'bg-white/95 border-slate-200/60'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-md font-black tracking-tight leading-none text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              Sovereign Support
            </h1>
            <p className="text-[11px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">Quant Operations & Bug Desk</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => triggerToast("Polling server network threads...", "info")} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-bold pointer-events-auto max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' 
                : toast.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
              <span className="leading-tight">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner Area */}
      <div className="shrink-0 bg-gradient-to-b from-[#0F121C] to-transparent pt-6 pb-2 px-5">
        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/30 border border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">Live Core Ingress</span>
              <span className="bg-white/10 text-slate-300 text-[9px] font-mono px-2 py-0.5 rounded-full tracking-wider">Port 3000 Active</span>
            </div>
            <h2 className="text-xl font-black text-white leading-tight">Quantum Support & Diagnostic Desk</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Search official developer documentation, report system bugs with automated configuration context, or open interactive diagnostic tickets.
            </p>
          </div>
          
          <div className="flex gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-center shrink-0">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">My Tickets</span>
              <span className="text-lg font-black text-emerald-400">{tickets.length} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="shrink-0 px-5 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-4 border-b border-white/5">
          <button
            onClick={() => { setActiveTab('faq'); setSelectedTicket(null); }}
            className={`py-3.5 px-1 relative text-xs font-bold transition-colors ${activeTab === 'faq' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>Knowledge Base</span>
            </div>
            {activeTab === 'faq' && (
              <motion.div layoutId="support-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('tickets'); }}
            className={`py-3.5 px-1 relative text-xs font-bold transition-colors ${activeTab === 'tickets' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Sovereign Tickets</span>
              {tickets.filter(t => t.status !== 'RESOLVED').length > 0 && (
                <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-black">
                  {tickets.filter(t => t.status !== 'RESOLVED').length}
                </span>
              )}
            </div>
            {activeTab === 'tickets' && (
              <motion.div layoutId="support-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('create'); setSelectedTicket(null); }}
            className={`py-3.5 px-1 relative text-xs font-bold transition-colors ${activeTab === 'create' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <span>Submit Ticket / Bug</span>
            </div>
            {activeTab === 'create' && (
              <motion.div layoutId="support-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-4xl mx-auto w-full h-full">
          
          {/* TAB 1: KNOWLEDGE BASE */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search core systems, networks, AI models, port regulations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500/50 border transition-all ${
                    isDark ? 'bg-[#0E121B] border-white/5 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-950'
                  }`}
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Operations' },
                  { id: 'trading', label: 'Trading & Settlement' },
                  { id: 'ai', label: 'AI Strategy Engine' },
                  { id: 'security', label: 'Security & Biometrics' },
                  { id: 'wallet', label: 'Wallet & Deposits' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFaqCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                      selectedFaqCategory === cat.id 
                        ? 'bg-emerald-500 text-black' 
                        : isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Expandable FAQs List */}
              <div className="space-y-3">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq, idx) => {
                    const isOpen = expandedFaqIndex === idx;
                    return (
                      <div 
                        key={idx}
                        className={`rounded-2xl transition-all border overflow-hidden ${
                          isOpen ? 'bg-[#0F131D]/60 border-emerald-500/20' : 'bg-[#0B0E15]/30 border-white/5'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                          className="w-full text-left p-4 flex justify-between items-center select-none gap-4"
                        >
                          <span className={`text-xs font-extrabold ${isOpen ? 'text-emerald-400' : 'text-white'}`}>
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 bg-black/15"
                            >
                              <p className="p-4 text-xs text-slate-400 leading-relaxed font-medium">
                                {faq.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-[#0B0E15]/30 rounded-2xl border border-white/5">
                    <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-bold">No documentation entries matched your query.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY SOVEREIGN TICKETS */}
          {activeTab === 'tickets' && (
            <div className="h-full">
              {selectedTicket ? (
                /* Ticket Live Chat Detail screen */
                <div className="flex flex-col h-[500px] rounded-3xl bg-[#090C12] border border-white/5 overflow-hidden">
                  
                  {/* Top Chat Bar info */}
                  <div className="shrink-0 p-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedTicket(null)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">{selectedTicket.id}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedTicket.status === 'RESOLVED' 
                              ? 'bg-slate-800 text-slate-400' 
                              : selectedTicket.status === 'ESC-QUANT-1'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {selectedTicket.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-white leading-tight truncate max-w-[200px] sm:max-w-md">
                          {selectedTicket.title}
                        </h4>
                      </div>
                    </div>

                    {selectedTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveTicket(selectedTicket)}
                        className="bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg transition-all border border-white/5"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    
                    {/* Ticket Context Header */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Original Inquiry</span>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {selectedTicket.description}
                      </p>
                      
                      {selectedTicket.diagnostics && (
                        <div className="pt-2 border-t border-white/5 font-mono text-[9px] text-slate-500 space-y-0.5">
                          <div>OS: {selectedTicket.diagnostics.os}</div>
                          <div>Host: {selectedTicket.diagnostics.userAgent}</div>
                          <div>Dev Network: {selectedTicket.diagnostics.devPort}</div>
                        </div>
                      )}
                    </div>

                    {/* Array of Chat replies */}
                    {selectedTicket.messages.map((msg, mIdx) => {
                      const isUser = msg.sender === 'USER';
                      return (
                        <div key={msg.id || mIdx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-1 ${
                            isUser 
                              ? 'bg-emerald-500 text-black font-extrabold rounded-tr-none' 
                              : 'bg-[#121622] text-slate-200 font-medium rounded-tl-none border border-white/5'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <span className={`block text-[9px] text-right font-mono ${isUser ? 'text-black/60' : 'text-slate-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message Input bottom bar */}
                  <form onSubmit={handleSendChat} className="shrink-0 p-3 border-t border-white/5 bg-slate-900/20 flex gap-2">
                    <input
                      type="text"
                      placeholder={selectedTicket.status === 'RESOLVED' ? "This ticket has been settled." : "Input response payload..."}
                      disabled={selectedTicket.status === 'RESOLVED'}
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="submit"
                      disabled={selectedTicket.status === 'RESOLVED' || !chatMessage.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-black px-4 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>
              ) : (
                /* Main Tickets list view */
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-bold">Synchronizing support logs...</p>
                    </div>
                  ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-5 rounded-2xl bg-[#090C12]/50 hover:bg-[#0E121B]/60 border border-white/5 transition-all cursor-pointer flex justify-between items-center gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-500 font-bold">{ticket.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              ticket.status === 'RESOLVED' 
                                ? 'bg-slate-800 text-slate-400' 
                                : ticket.status === 'ESC-QUANT-1'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {ticket.status}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 rounded bg-white/5 text-slate-400`}>
                              {ticket.category}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-white truncate max-w-sm sm:max-w-md group-hover:text-emerald-400 transition-colors">
                            {ticket.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-sm sm:max-w-md">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1 font-mono">
                          <span className={`text-[9px] font-black uppercase px-1.5 rounded-md ${
                            ticket.priority === 'URGENT' 
                              ? 'bg-rose-500/20 text-rose-400 animate-pulse' 
                              : ticket.priority === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-white/5 text-slate-400'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(ticket.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-[#0B0E15]/30 rounded-2xl border border-white/5">
                      <LifeBuoy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h4 className="text-sm font-black text-white">No Support Tickets Active</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Your interactive quant diagnostic logs are empty. Click "Submit Ticket / Bug" above to create one.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE TICKET / BUG REPORT */}
          {activeTab === 'create' && (
            <div className="bg-[#090C12]/50 border border-white/5 rounded-3xl p-6 shadow-xl">
              <form onSubmit={handleSubmitTicket} className="space-y-6">
                
                {/* Header info */}
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Quantum Ticket Form</h3>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">Specify diagnostic payloads for immediate escalation</p>
                  </div>
                </div>

                {/* Ticket Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Ticket Subject Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Risk desynchronization, KYC scan frozen, Port 3000 mapping..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
                  />
                </div>

                {/* Grid Category & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Category Category</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-bold"
                    >
                      <option className="bg-[#090C12]" value="Trading & Execution">Trading & Execution</option>
                      <option className="bg-[#090C12]" value="AI Strategy Copilot">AI Strategy Copilot</option>
                      <option className="bg-[#090C12]" value="Security & Biometrics">Security & Biometrics</option>
                      <option className="bg-[#090C12]" value="Deposits & Wallet">Deposits & Wallet</option>
                      <option className="bg-[#090C12]" value="Bug Report">Bug Report (Triggers Diagnostics)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Priority Level</label>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-bold"
                    >
                      <option className="bg-[#090C12]" value="LOW">Low - Routine Operation</option>
                      <option className="bg-[#090C12]" value="MEDIUM">Medium - Performance Issue</option>
                      <option className="bg-[#090C12]" value="HIGH">High - Immediate Review</option>
                      <option className="bg-[#090C12]" value="URGENT">Urgent - Level 3 Esc-Quant-1</option>
                    </select>
                  </div>
                </div>

                {/* Bug Diagnostics Panel (Conditional on Bug Category) */}
                {newCategory === 'Bug Report' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                      <Bug className="w-4 h-4" />
                      <span>Diagnostics Context Payload Enabled</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Reporting a bug triggers an automatic sandbox system audit. We have pre-compiled these environment metadata points to attach to the report:
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-black/40 rounded-xl font-mono text-[9px] text-slate-400 border border-white/5">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3 text-amber-500" />
                        <span>OS: {diagnosticsInfo.os}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Network className="w-3 h-3 text-amber-500" />
                        <span>Port: {diagnosticsInfo.devPort}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 truncate">
                        <Layers className="w-3 h-3 text-amber-500" />
                        <span>Client: {diagnosticsInfo.userAgent}</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachLogs}
                        onChange={e => setAttachLogs(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">Attach standard stack trace & diagnostic environment state</span>
                    </label>
                  </motion.div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 block font-bold uppercase">Detailed Description & Payload</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe exactly what happened, any errors, or diagnostic telemetry..."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-black font-black text-xs py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-emerald-500/15"
                >
                  {submitting ? "Transmitting Diagnostics..." : "Transmit Ticket Payload"}
                </button>

              </form>
            </div>
          )}

        </div>
      </div>

    </motion.div>
  );
}
