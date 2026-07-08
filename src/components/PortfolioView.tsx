import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, ArrowRightLeft, 
  History, Calendar, Hash, DollarSign, Search, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  asset: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  txHash: string;
  createdAt: string;
}

export default function PortfolioView({ theme }: { theme: 'light' | 'dark' }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({
    balance: 1000.00,
    totalDeposits: 1000.00,
    totalWithdrawals: 0.00,
    todayPnL: 12.50,
    todayPnLPercent: 1.25,
    overallReturn: 1.25
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'trade'>('all');
  const isDark = theme === 'dark';

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-md";

  // Listen to portfolio data
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, `users/${user.uid}/portfolio/main`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPortfolio({
          balance: data.balance || 1000.00,
          totalDeposits: data.totalDeposits || 1000.00,
          totalWithdrawals: data.totalWithdrawals || 0.00,
          todayPnL: data.todayPnL || 0.00,
          todayPnLPercent: data.todayPnLPercent || 0.00,
          overallReturn: data.overallReturn || 0.00
        });
      }
    });
    return unsubscribe;
  }, [user]);

  // Listen to transactions list
  useEffect(() => {
    if (!user) return;
    const txRef = collection(db, `users/${user.uid}/transactions`);
    const q = query(txRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Transaction);
      });
      setTransactions(list);
    });
    return unsubscribe;
  }, [user]);

  // Filter transactions
  const filteredTx = transactions.filter(tx => {
    const matchesSearch = tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-6"
    >
      {/* Dynamic Grid with portfolio balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Balance */}
        <div className={`rounded-3xl p-6 relative overflow-hidden ${cardClasses}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full pointer-events-none" />
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Account Balance</span>
          </div>
          <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
            ${portfolio.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">USD Equivalent</p>
        </div>

        {/* Card 2: Deposits */}
        <div className={`rounded-3xl p-6 relative overflow-hidden ${cardClasses}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[30px] rounded-full pointer-events-none" />
          <div className="flex items-center space-x-2 text-blue-400 mb-2">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Deposits</span>
          </div>
          <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
            ${portfolio.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Including welcome bonus</p>
        </div>

        {/* Card 3: Withdrawals */}
        <div className={`rounded-3xl p-6 relative overflow-hidden ${cardClasses}`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-[30px] rounded-full pointer-events-none" />
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total Withdrawals</span>
          </div>
          <h3 className={`text-2xl font-black tracking-tight ${textPrimary}`}>
            ${portfolio.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Standard settlement limits</p>
        </div>
      </div>

      {/* Yield Curve Graph (SVG Spline) */}
      <div className={`rounded-[24px] p-6 ${cardClasses}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textSecondary}`}>Performance Yield</span>
            <h4 className={`text-lg font-black tracking-tight ${textPrimary}`}>Growth Statistics</h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold`}>
              {portfolio.overallReturn >= 0 ? '+' : ''}{portfolio.overallReturn}% Net
            </div>
          </div>
        </div>

        {/* SVG Spline */}
        <div className="w-full h-32 relative">
          <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path 
              d="M0,28 C15,25 25,29 40,20 C55,11 65,15 80,6 C90,1 95,3 100,0.5" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path 
              d="M0,28 C15,25 25,29 40,20 C55,11 65,15 80,6 C90,1 95,3 100,0.5 L100,30 L0,30 Z" 
              fill="url(#portfolio-gradient)" 
              className="opacity-10"
            />
            <defs>
              <linearGradient id="portfolio-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] font-mono font-bold text-slate-600 px-1 pt-2 border-t border-slate-500/10">
            <span>START</span>
            <span>WEEK 1</span>
            <span>WEEK 2</span>
            <span>CURRENT</span>
          </div>
        </div>
      </div>

      {/* Interactive Transactions Log */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className={`text-lg font-bold flex items-center ${textPrimary}`}>
            <History className="w-5 h-5 mr-2 text-emerald-500" />
            Transaction History
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'all' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('deposit')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'deposit' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Deposits
            </button>
            <button 
              onClick={() => setFilterType('withdrawal')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'withdrawal' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Withdrawals
            </button>
            <button 
              onClick={() => setFilterType('trade')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'trade' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Trades
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-[15px]" />
          <input 
            type="text" 
            placeholder="Search by tx hash, asset, type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
              isDark 
                ? 'bg-[#08090e]/80 border-white/5 text-white placeholder-slate-600 focus:border-emerald-500/20' 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/20 shadow-sm'
            }`}
          />
        </div>

        {/* Transactions list */}
        <div className={`rounded-3xl overflow-hidden ${cardClasses}`}>
          {filteredTx.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-slate-500 stroke-1" />
              <p className={`text-sm ${textSecondary} font-medium`}>No transaction logs matching current filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-500/10">
              {filteredTx.map((tx) => (
                <div key={tx.id} className={`flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-white/[0.01]' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : tx.type === 'withdrawal'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tx.type === 'deposit' && <ArrowDownRight className="w-5 h-5" />}
                      {tx.type === 'withdrawal' && <ArrowUpRight className="w-5 h-5" />}
                      {tx.type === 'trade' && <ArrowRightLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-sm font-bold capitalize ${textPrimary}`}>{tx.type}</span>
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          tx.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : tx.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-500">
                        <span className="flex items-center"><Hash className="w-3 h-3 mr-0.5" /> {tx.id.substring(0, 10)}</span>
                        <span>•</span>
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-0.5" /> {new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black tracking-tight ${
                      tx.type === 'deposit' 
                        ? 'text-emerald-400' 
                        : tx.type === 'withdrawal'
                        ? 'text-indigo-400'
                        : 'text-amber-400'
                    }`}>
                      {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <p className="text-[9px] font-mono font-medium text-slate-500 mt-0.5">{tx.asset}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
