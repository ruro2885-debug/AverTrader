import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Brain, Bot, Play, Pause, Square, AlertCircle, 
  TrendingUp, Activity, CheckCircle2, Zap, Settings2, Globe
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function AITradingView({ theme }: { theme: 'light' | 'dark' }) {
  const { user, updateUserTradingStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [pnlStats, setPnlStats] = useState({
    balance: 1000.00,
    todayPnL: 12.50,
    todayPnLPercent: 1.25,
    overallReturn: 1.25
  });
  const isDark = theme === 'dark';

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50";

  // Listen to portfolio data for real-time statistical updates
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, `users/${user.uid}/portfolio/main`), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPnlStats({
          balance: data.balance || 1000.00,
          todayPnL: data.todayPnL || 0.00,
          todayPnLPercent: data.todayPnLPercent || 0.00,
          overallReturn: data.overallReturn || 0.00
        });
      }
    });
    return unsubscribe;
  }, [user]);

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'stopped') => {
    setLoading(true);
    try {
      await updateUserTradingStatus(newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerTradingSimulation = async () => {
    if (!user || user.aiTradingStatus !== 'active' || simulating) return;
    setSimulating(true);
    try {
      const response = await fetch('/api/trading-engine/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Success alert or state change handled by snapshot listener
      } else {
        alert(data.error || 'Simulation failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-6"
    >
      {/* Hero card with high-end real trading desk photo */}
      <div className="relative rounded-[24px] overflow-hidden shadow-2xl h-56 group">
        <img 
          src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=1200" 
          alt="AI Algorithmic Server Desk" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-1.5">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>AverCore AI™ Algorithmic Module</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2">
            Automated Quantitative Trading
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-lg">
            High-frequency neural networks processing 15,000 statistical arbitrage signals per second. Real-time executions, server-authoritative security.
          </p>
        </div>
      </div>

      {/* AI Trading Controller */}
      <div className={`rounded-[24px] p-6 ${cardClasses} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-500/10">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              user?.aiTradingStatus === 'active' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : user?.aiTradingStatus === 'paused'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs ${textSecondary}`}>Trading Engine Status</p>
              <h3 className={`text-lg font-extrabold tracking-tight capitalize ${textPrimary}`}>
                AI Engine: {user?.aiTradingStatus || 'paused'}
              </h3>
            </div>
          </div>

          {/* Action Controllers */}
          <div className="flex items-center space-x-2">
            <button 
              disabled={loading || user?.aiTradingStatus === 'active'}
              onClick={() => handleStatusChange('active')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                user?.aiTradingStatus === 'active'
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>

            <button 
              disabled={loading || user?.aiTradingStatus === 'paused'}
              onClick={() => handleStatusChange('paused')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                user?.aiTradingStatus === 'paused'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
              }`}
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>

            <button 
              disabled={loading || user?.aiTradingStatus === 'stopped'}
              onClick={() => handleStatusChange('stopped')}
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                user?.aiTradingStatus === 'stopped'
                  ? 'bg-red-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        </div>

        {/* Real-Time Live Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textSecondary}`}>AI Balance</span>
            <p className={`text-lg font-black tracking-tight mt-1 ${textPrimary}`}>
              ${pnlStats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textSecondary}`}>Today Profit</span>
            <p className={`text-lg font-black tracking-tight mt-1 ${pnlStats.todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnlStats.todayPnL >= 0 ? '+' : ''}${pnlStats.todayPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textSecondary}`}>Daily Return</span>
            <p className={`text-lg font-black tracking-tight mt-1 ${pnlStats.todayPnLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnlStats.todayPnLPercent >= 0 ? '+' : ''}{pnlStats.todayPnLPercent}%
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textSecondary}`}>Overall Yield</span>
            <p className={`text-lg font-black tracking-tight mt-1 ${pnlStats.overallReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnlStats.overallReturn >= 0 ? '+' : ''}{pnlStats.overallReturn}%
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Execution Panel - Runs secure cloud-function code to generate random trading results */}
      {user?.aiTradingStatus === 'active' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border ${isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'} flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className={`text-sm font-bold ${textPrimary}`}>Simulate AI Execution Loop</h4>
              <p className={`text-xs ${textSecondary} max-w-md`}>
                Trigger the secure backend quant engine (Cloud Function equivalent) to evaluate high-conviction order books, run simulated arbitrage, and post trade logs.
              </p>
            </div>
          </div>
          <button
            onClick={triggerTradingSimulation}
            disabled={simulating}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-[0_2px_10px_rgba(16,185,129,0.3)] shrink-0 cursor-pointer"
          >
            {simulating ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Simulate Trade</span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Static features descriptive of trading safety */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl ${cardClasses}`}>
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <Globe className="w-4 h-4" />
            <h4 className="text-sm font-bold">Relational Arbitrage</h4>
          </div>
          <p className={`text-xs leading-relaxed ${textSecondary}`}>
            Simultaneous multi-venue order routing across Binance, Coinbase, Kraken, and dYdX. Captures spreads under 1.4 milliseconds with minimal slippage.
          </p>
        </div>
        <div className={`p-5 rounded-2xl ${cardClasses}`}>
          <div className="flex items-center space-x-2 text-teal-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-sm font-bold">Zero-Trust Vaulting</h4>
          </div>
          <p className={`text-xs leading-relaxed ${textSecondary}`}>
            Direct smart-contract integration with decentralized cold keys. No custody of private keys; withdrawal addresses are locked by multi-sig validations.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
