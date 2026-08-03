import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownRight, 
  ExternalLink, RefreshCcw, Clock, Wallet, History,
  ArrowRightLeft, AlertCircle, CheckCircle2, XCircle, ChevronRight, X,
  Sparkles, Layers, Shield, Calendar, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { transactionService, getExplorerUrl } from '../services/transactionService';
import { TransactionRecord } from '../types';

type TabType = 'transactions' | 'orders' | 'order-history';

interface FilterState {
  type: string;
  asset: string;
  network: string;
  time: string;
}

const TYPE_OPTIONS = [
  'All', 
  'Deposit', 
  'Withdrawal', 
  'Transfer', 
  'Trade', 
  'AI Allocation', 
  'Profit Settlement', 
  'Loss Settlement', 
  'Reward', 
  'Interest',
  'Adjustment'
];

const ASSET_OPTIONS = ['All', 'USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'USD'];
const NETWORK_OPTIONS = ['All', 'TRC20', 'ERC20', 'BEP20', 'Solana', 'Internal'];
const TIME_OPTIONS = ['All Time', 'Today', 'Past 7 Days', 'Past 30 Days', 'Past 90 Days'];

export default function TransactionHistory({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { formatCurrency, theme } = usePreferences();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [filters, setFilters] = useState<FilterState>({
    type: 'All',
    asset: 'All',
    network: 'All',
    time: 'All Time'
  });

  const [activeFilterModal, setActiveFilterModal] = useState<'type' | 'asset' | 'network' | 'time' | null>(null);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Custom Explorer Lookup Modal
  const [showExplorerModal, setShowExplorerModal] = useState(false);
  const [explorerInputHash, setExplorerInputHash] = useState('');
  const [explorerInputNetwork, setExplorerInputNetwork] = useState('TRC20');

  // Real-time synchronization
  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      const data = await transactionService.getUserTransactions(user.uid, user);
      setTransactions(data);
    } catch (err) {
      console.warn("Error fetching transactions:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = transactionService.subscribeUserTransactions(user.uid, (data) => {
      setTransactions(data);
      setLoading(false);
      setIsRefreshing(false);
    }, user);

    return () => unsub();
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
  };

  // Filter items based on active tab & selected filters
  const filteredItems = useMemo(() => {
    return transactions.filter(item => {
      // 1. Tab match
      if (activeTab === 'transactions') {
        if (item.category === 'orders' && item.status === 'Pending') return false;
      } else if (activeTab === 'orders') {
        if (item.status !== 'Pending') return false;
      } else if (activeTab === 'order-history') {
        if (item.status === 'Pending' || (item.category !== 'order-history' && item.type !== 'trade' && !item.type.includes('order'))) {
          return false;
        }
      }

      // 2. Type filter
      if (filters.type !== 'All') {
        const t = (item.type || '').toLowerCase();
        const f = filters.type.toLowerCase();
        if (f === 'deposit' && !t.includes('deposit')) return false;
        if (f === 'withdrawal' && !t.includes('withdrawal')) return false;
        if (f === 'transfer' && !t.includes('transfer')) return false;
        if (f === 'trade' && !t.includes('trade') && !t.includes('order')) return false;
        if (f === 'ai allocation' && !t.includes('allocation') && !t.includes('session')) return false;
        if (f === 'profit settlement' && !t.includes('profit')) return false;
        if (f === 'loss settlement' && !t.includes('loss')) return false;
        if (f === 'reward' && !t.includes('reward') && !t.includes('bonus') && !t.includes('cashback')) return false;
        if (f === 'interest' && !t.includes('interest')) return false;
        if (f === 'adjustment' && !t.includes('adjustment')) return false;
      }

      // 3. Asset filter
      if (filters.asset !== 'All') {
        if ((item.asset || '').toUpperCase() !== filters.asset.toUpperCase()) return false;
      }

      // 4. Network filter
      if (filters.network !== 'All') {
        const net = (item.network || '').toLowerCase();
        const fn = filters.network.toLowerCase();
        if (fn === 'internal') {
          if (!net.includes('internal') && net !== '') return false;
        } else {
          if (!net.includes(fn)) return false;
        }
      }

      // 5. Time filter
      if (filters.time !== 'All Time') {
        const itemDate = new Date(item.timestamp).getTime();
        const now = Date.now();
        if (filters.time === 'Today') {
          const startOfDay = new Date();
          startOfDay.setHours(0,0,0,0);
          if (itemDate < startOfDay.getTime()) return false;
        } else if (filters.time === 'Past 7 Days') {
          if (now - itemDate > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (filters.time === 'Past 30 Days') {
          if (now - itemDate > 30 * 24 * 60 * 60 * 1000) return false;
        } else if (filters.time === 'Past 90 Days') {
          if (now - itemDate > 90 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    });
  }, [transactions, activeTab, filters]);

  // Group filtered items by Date string
  const groupedItems = useMemo(() => {
    const groups: Record<string, TransactionRecord[]> = {};
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    filteredItems.forEach(item => {
      const d = new Date(item.timestamp);
      const dateKeyStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let displayLabel = dateKeyStr;
      if (dateKeyStr === todayStr) displayLabel = 'Today';
      else if (dateKeyStr === yesterdayStr) displayLabel = 'Yesterday';

      if (!groups[displayLabel]) groups[displayLabel] = [];
      groups[displayLabel].push(item);
    });
    return groups;
  }, [filteredItems]);

  const renderItemIcon = (item: TransactionRecord) => {
    const type = item.type.toLowerCase();
    if (type.includes('deposit')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
          <ArrowDownRight className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('withdrawal')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-sm">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('profit') || type.includes('reward') || type.includes('bonus') || type.includes('cashback') || type.includes('interest')) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
      );
    }
    if (type.includes('trade') || type.includes('order')) {
      const isBuy = item.side === 'buy' || item.amount > 0;
      return (
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm ${
          isBuy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {isBuy ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
        <ArrowRightLeft className="w-5 h-5" />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'approved' || s === 'filled') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (s === 'pending' || s === 'processing') {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (s === 'failed' || s === 'rejected' || s === 'cancelled') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const openExplorer = (txHash: string, network: string, customUrl?: string) => {
    const url = customUrl || getExplorerUrl(txHash, network);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCustomExplorerSearch = () => {
    if (!explorerInputHash.trim()) return;
    const url = getExplorerUrl(explorerInputHash.trim(), explorerInputNetwork);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowExplorerModal(false);
      setExplorerInputHash('');
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isDark ? 'bg-neutral-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Compact Header */}
      <header className={`px-5 sm:px-8 pt-4 pb-3 flex items-center justify-between sticky top-0 z-20 ${
        isDark ? 'bg-neutral-950/90 border-b border-white/10' : 'bg-white/90 border-b border-slate-200'
      } backdrop-blur-xl`}>
        <div className="flex items-center space-x-3.5">
          <button 
            type="button"
            onClick={onBack}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">Transaction History</h1>
            <p className="text-[11px] text-neutral-400 hidden sm:block">Live ledger of all platform activities and trade executions</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isRefreshing ? 'animate-spin opacity-80' : ''
          } ${
            isDark ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
          }`}
          title="Refresh Ledger"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </header>

      {/* Spaced Tabs with Animated Indicator */}
      <div className={`px-5 sm:px-8 pt-2 pb-0.5 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex space-x-6 sm:space-x-10 max-w-7xl mx-auto">
          {(['transactions', 'orders', 'order-history'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const tabLabel = tab === 'transactions' ? 'Transactions' : tab === 'orders' ? 'Open Orders' : 'Order History';
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative cursor-pointer ${
                  isActive 
                    ? (isDark ? 'text-white' : 'text-slate-900') 
                    : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-slate-400 hover:text-slate-600')
                }`}
              >
                <span>{tabLabel}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal Unstacked Filter Bar */}
      <div className="px-5 sm:px-8 py-2.5 border-b border-white/5 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {/* Filter 1: Type */}
          <button
            type="button"
            onClick={() => setActiveFilterModal('type')}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              filters.type !== 'All'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : (isDark ? 'bg-neutral-900/80 border-white/10 text-neutral-300 hover:border-white/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm')
            }`}
          >
            <span className="text-neutral-400 font-normal">Type:</span>
            <span className="font-bold">{filters.type}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rotate-90 ml-0.5" />
          </button>

          {/* Filter 2: Asset */}
          <button
            type="button"
            onClick={() => setActiveFilterModal('asset')}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              filters.asset !== 'All'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : (isDark ? 'bg-neutral-900/80 border-white/10 text-neutral-300 hover:border-white/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm')
            }`}
          >
            <span className="text-neutral-400 font-normal">Asset:</span>
            <span className="font-bold">{filters.asset}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rotate-90 ml-0.5" />
          </button>

          {/* Filter 3: Network */}
          <button
            type="button"
            onClick={() => setActiveFilterModal('network')}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              filters.network !== 'All'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : (isDark ? 'bg-neutral-900/80 border-white/10 text-neutral-300 hover:border-white/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm')
            }`}
          >
            <span className="text-neutral-400 font-normal">Network:</span>
            <span className="font-bold">{filters.network}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rotate-90 ml-0.5" />
          </button>

          {/* Filter 4: Time */}
          <button
            type="button"
            onClick={() => setActiveFilterModal('time')}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              filters.time !== 'All Time'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : (isDark ? 'bg-neutral-900/80 border-white/10 text-neutral-300 hover:border-white/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm')
            }`}
          >
            <span className="text-neutral-400 font-normal">Time:</span>
            <span className="font-bold">{filters.time}</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rotate-90 ml-0.5" />
          </button>

          {/* Clear Filters reset chip */}
          {(filters.type !== 'All' || filters.asset !== 'All' || filters.network !== 'All' || filters.time !== 'All Time') && (
            <button
              type="button"
              onClick={() => setFilters({ type: 'All', asset: 'All', network: 'All', time: 'All Time' })}
              className="h-9 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 max-w-7xl mx-auto w-full flex flex-col justify-between">
        <div>
          {loading ? (
            // Skeleton Loader
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={`p-4 rounded-2xl animate-pulse flex items-center justify-between border ${
                    isDark ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-800" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 rounded-lg bg-neutral-800" />
                      <div className="w-20 h-3 rounded-lg bg-neutral-800" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="w-24 h-4 rounded-lg bg-neutral-800 ml-auto" />
                    <div className="w-16 h-3 rounded-lg bg-neutral-800 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            // Empty State (Genuinely no matching records)
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-4"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl ${
                isDark ? 'bg-neutral-900 border-white/10 text-neutral-400' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <History className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold tracking-tight">No Transactions Found</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {transactions.length === 0 
                    ? 'Your transaction history will appear here once you complete your first operation.'
                    : 'No transaction records match your currently active filters. Try resetting your filter selection.'
                  }
                </p>
              </div>
              {(filters.type !== 'All' || filters.asset !== 'All' || filters.network !== 'All' || filters.time !== 'All Time') && (
                <button
                  type="button"
                  onClick={() => setFilters({ type: 'All', asset: 'All', network: 'All', time: 'All Time' })}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-neutral-950 hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Reset All Filters
                </button>
              )}
            </motion.div>
          ) : (
            // Render Transaction List Grouped By Date
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + JSON.stringify(filters)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-6"
              >
                {(Object.entries(groupedItems) as [string, TransactionRecord[]][]).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">{dateLabel}</h3>
                      <div className="flex-1 h-[1px] bg-white/5" />
                    </div>

                    <div className="space-y-2">
                      {items.map((item, idx) => {
                        const isDeposit = item.type.includes('deposit');
                        const isWithdrawal = item.type.includes('withdrawal');
                        const isProfit = item.type.includes('profit');
                        const hasExplorer = !!item.txHash && item.network !== 'Internal';

                        return (
                          <motion.div
                            key={item.id || idx}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                            className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between group border transition-all ${
                              isDark 
                                ? 'bg-neutral-900/60 hover:bg-neutral-900 border-white/5 hover:border-white/10 shadow-lg' 
                                : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              {renderItemIcon(item)}

                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate flex items-center gap-2">
                                  <span>{item.title || `${item.type} ${item.asset}`}</span>
                                </h4>

                                <div className="flex items-center space-x-2 text-[10px] font-medium text-neutral-400 mt-0.5 flex-wrap gap-y-0.5">
                                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="opacity-30">•</span>
                                  <span className="font-mono text-neutral-300">{item.network || 'Mainnet'}</span>
                                  {item.quantity && item.price && (
                                    <>
                                      <span className="opacity-30">•</span>
                                      <span>{item.quantity} @ {formatCurrency(item.price)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <p className={`text-xs sm:text-sm font-black ${
                                isDeposit || isProfit ? 'text-emerald-400' : 
                                isWithdrawal ? 'text-rose-400' : 
                                (isDark ? 'text-white' : 'text-slate-900')
                              }`}>
                                {isDeposit || isProfit ? '+' : isWithdrawal ? '-' : ''}
                                {typeof item.amount === 'number' ? item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : item.amount} {item.asset}
                              </p>

                              <div className="flex items-center justify-end space-x-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusBadge(item.status)}`}>
                                  {item.status}
                                </span>

                                {/* Check Explorer Action (Only for blockchain transactions with txHash) */}
                                {hasExplorer && (
                                  <button
                                    type="button"
                                    onClick={() => openExplorer(item.txHash!, item.network, item.explorerUrl)}
                                    className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white transition cursor-pointer border border-white/10 flex items-center gap-1 text-[9px] font-bold"
                                    title="Check Blockchain Explorer"
                                  >
                                    <span>Explorer</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Explorer Button embedded at the end of the scrollable list (not fixed/sticky) */}
        <div className="mt-8 pt-4 pb-6">
          <button 
            type="button"
            onClick={() => setShowExplorerModal(true)}
            className={`w-full py-3.5 px-5 rounded-2xl border-2 border-dashed flex items-center justify-center space-x-3 group transition-all hover:scale-[1.005] active:scale-[0.995] cursor-pointer ${
              isDark 
                ? 'border-white/15 hover:border-emerald-500/40 text-neutral-300 hover:text-emerald-400 bg-neutral-900/40' 
                : 'border-slate-300 hover:border-emerald-500/40 text-slate-600 hover:text-emerald-600 bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isDark ? 'bg-white/5 group-hover:bg-emerald-500/10' : 'bg-slate-200 group-hover:bg-emerald-50'}`}>
              <Search className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs sm:text-sm font-bold">Can't find your transaction? Check explorer</span>
          </button>
        </div>
      </div>

      {/* Filter Options Selection Modal */}
      <AnimatePresence>
        {activeFilterModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className={`w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 space-y-6 border shadow-2xl ${
                isDark ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold capitalize">Select {activeFilterModal}</h3>
                <button
                  type="button"
                  onClick={() => setActiveFilterModal(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {(activeFilterModal === 'type' ? TYPE_OPTIONS :
                  activeFilterModal === 'asset' ? ASSET_OPTIONS :
                  activeFilterModal === 'network' ? NETWORK_OPTIONS : TIME_OPTIONS
                ).map(opt => {
                  const isSelected = filters[activeFilterModal] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, [activeFilterModal]: opt }));
                        setActiveFilterModal(null);
                      }}
                      className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' 
                          : (isDark ? 'bg-neutral-950/60 hover:bg-neutral-950 border border-white/5 text-neutral-300' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700')
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Blockchain Explorer Lookup Modal */}
      <AnimatePresence>
        {showExplorerModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-[32px] p-6 sm:p-8 space-y-6 border shadow-2xl ${
                isDark ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Check Blockchain Explorer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExplorerModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Transaction Hash (TxID)</label>
                  <input
                    type="text"
                    value={explorerInputHash}
                    onChange={(e) => setExplorerInputHash(e.target.value)}
                    placeholder="e.g., 0x7f8c... or 4f2a..."
                    className="w-full font-mono text-sm bg-neutral-950 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Blockchain Network</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['TRC20', 'ERC20', 'Solana', 'BEP20', 'Bitcoin'].map(net => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setExplorerInputNetwork(net)}
                        className={`p-3 rounded-xl text-xs font-bold border transition ${
                          explorerInputNetwork === net 
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                            : 'bg-neutral-950 border-white/5 text-neutral-400 hover:border-white/10'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCustomExplorerSearch}
                  disabled={!explorerInputHash.trim()}
                  className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 transition ${
                    explorerInputHash.trim()
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <span>Open Blockchain Explorer</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
