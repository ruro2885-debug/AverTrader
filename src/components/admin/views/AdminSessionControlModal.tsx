import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, Zap, TrendingUp, TrendingDown, DollarSign, 
  Clock, Activity, AlertTriangle, CheckCircle2, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Target, Percent, Play, Square,
  Sliders, Plus, Minus, Lock, Unlock, Copy, Check, ExternalLink,
  ChevronRight, Sparkles, Layers, Cpu, Compass, Flame
} from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, collection, addDoc, onSnapshot, Timestamp, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SessionAdminControl, SessionControlMode } from '../../../types/aiTrading';
import { walletService } from '../../../services/walletService';
import { portfolioPersistenceService } from '../../../services/portfolioPersistenceService';

interface ActiveSessionRecord {
  id: string;
  userId: string;
  userEmail: string;
  status: 'ACTIVE' | 'INACTIVE';
  startTime: any;
  tradingCapital: number;
  initialCapital: number;
  openPositionsCount: number;
  totalProfit: number;
  totalLoss: number;
  activeConfigId?: string;
  strategyName?: string;
  adminControl?: SessionAdminControl;
}

interface TradeRecord {
  id: string;
  userId?: string;
  userEmail?: string;
  symbol: string;
  type: 'buy' | 'sell' | 'long' | 'short';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  leverage?: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
  timestamp: string;
  sessionId?: string;
}

interface AdminSessionControlModalProps {
  session: ActiveSessionRecord;
  theme: 'light' | 'dark';
  onClose: () => void;
  onSessionTerminated?: (sessionId: string) => void;
}

export default function AdminSessionControlModal({
  session: initialSession,
  theme,
  onClose,
  onSessionTerminated
}: AdminSessionControlModalProps) {
  const [session, setSession] = useState<ActiveSessionRecord>(initialSession);
  const [sessionTrades, setSessionTrades] = useState<TradeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'positions' | 'history'>('control');
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Outcome control state
  const currentControl: SessionAdminControl = session.adminControl || {
    mode: 'NORMAL',
    forceNextTrade: 'AUTO',
    customTargetPnl: 500,
    customWinRate: 85
  };

  const [mode, setMode] = useState<SessionControlMode>(currentControl.mode || 'NORMAL');
  const [forceNextTrade, setForceNextTrade] = useState<'AUTO' | 'WIN' | 'LOSS'>(currentControl.forceNextTrade || 'AUTO');
  const [customTargetPnl, setCustomTargetPnl] = useState<number>(currentControl.customTargetPnl ?? 500);
  const [customWinRate, setCustomWinRate] = useState<number>(currentControl.customWinRate ?? 85);
  const [injectedAmount, setInjectedAmount] = useState<string>('100');

  // Manual Position Form
  const [showNewPositionModal, setShowNewPositionModal] = useState(false);
  const [newPosSymbol, setNewPosSymbol] = useState('BTC/USDT');
  const [newPosType, setNewPosType] = useState<'long' | 'short'>('long');
  const [newPosAmount, setNewPosAmount] = useState('250');
  const [newPosLeverage, setNewPosLeverage] = useState('10');

  // Live session timer calculation
  const [elapsedFormatted, setElapsedFormatted] = useState('00:00:00');

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Elapsed timer ticker
  useEffect(() => {
    const getStartTimeMs = (ts: any): number => {
      if (!ts) return Date.now();
      if (typeof ts === 'object' && ts !== null) {
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (typeof ts.seconds === 'number') return ts.seconds * 1000;
      }
      const d = new Date(ts).getTime();
      return isNaN(d) ? Date.now() : d;
    };

    const startMs = getStartTimeMs(session.startTime);

    const updateTimer = () => {
      const diff = Math.max(0, Date.now() - startMs);
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setElapsedFormatted(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.startTime]);

  // Real-time Firestore sync for Session and its Trades
  useEffect(() => {
    // 1. Session Document Listener
    const unsubSession = onSnapshot(doc(db, 'aiSessions', session.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSession(prev => ({
          ...prev,
          ...data,
          id: snap.id,
          startTime: data.startTime || prev.startTime,
          adminControl: data.adminControl || prev.adminControl
        }));

        if (data.adminControl) {
          setMode(data.adminControl.mode || 'NORMAL');
          setForceNextTrade(data.adminControl.forceNextTrade || 'AUTO');
          if (data.adminControl.customTargetPnl !== undefined) {
            setCustomTargetPnl(data.adminControl.customTargetPnl);
          }
          if (data.adminControl.customWinRate !== undefined) {
            setCustomWinRate(data.adminControl.customWinRate);
          }
        }
      }
    }, (err) => {
      console.warn("Realtime session sync fallback:", err);
    });

    // 2. User Trades Listener
    const unsubTrades = onSnapshot(collection(db, 'users', session.userId, 'trades'), (snap) => {
      const list: TradeRecord[] = [];
      snap.forEach(tDoc => {
        const d = tDoc.data();
        list.push({
          id: tDoc.id,
          userId: session.userId,
          userEmail: session.userEmail,
          symbol: d.symbol || d.asset || 'BTC/USDT',
          type: d.type || 'long',
          amount: d.amount || d.size || d.quantity || 0,
          entryPrice: d.entryPrice || d.entry || 0,
          currentPrice: d.currentPrice || d.entryPrice || 0,
          leverage: d.leverage || 1,
          pnl: d.pnl || 0,
          status: d.status || 'OPEN',
          timestamp: d.timestamp || d.openedAt || new Date().toISOString(),
          sessionId: d.sessionId
        });
      });

      // Also read local trades if available
      try {
        const localRaw = localStorage.getItem(`aver_trades_${session.userId}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((pt: any) => {
              if (!list.some(x => x.id === pt.id)) {
                list.push({
                  id: pt.id || `loc_${Date.now()}`,
                  userId: session.userId,
                  userEmail: session.userEmail,
                  symbol: pt.symbol || pt.asset || 'BTC/USDT',
                  type: pt.type || 'long',
                  amount: pt.amount || pt.size || pt.quantity || 0,
                  entryPrice: pt.entryPrice || pt.entry || 0,
                  currentPrice: pt.currentPrice || pt.entryPrice || 0,
                  leverage: pt.leverage || 1,
                  pnl: pt.pnl || 0,
                  status: pt.status || 'OPEN',
                  timestamp: pt.timestamp || pt.openedAt || new Date().toISOString(),
                  sessionId: pt.sessionId
                });
              }
            });
          }
        }
      } catch (e) {}

      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSessionTrades(list);
    }, (err) => {
      console.warn("Trades sync fallback to localStorage:", err);
      try {
        const localRaw = localStorage.getItem(`aver_trades_${session.userId}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            setSessionTrades(parsed);
          }
        }
      } catch (e) {}
    });

    return () => {
      unsubSession();
      unsubTrades();
    };
  }, [session.id, session.userId, session.userEmail]);

  // Apply and Save Admin Outcome Control
  const handleSaveControl = async (overrides?: Partial<SessionAdminControl>) => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const updatedControl: SessionAdminControl = {
      mode: overrides?.mode !== undefined ? overrides.mode : mode,
      forceNextTrade: overrides?.forceNextTrade !== undefined ? overrides.forceNextTrade : forceNextTrade,
      customTargetPnl: overrides?.customTargetPnl !== undefined ? overrides.customTargetPnl : Number(customTargetPnl),
      customWinRate: overrides?.customWinRate !== undefined ? overrides.customWinRate : Number(customWinRate),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Update Firestore session doc
      await updateDoc(doc(db, 'aiSessions', session.id), {
        adminControl: updatedControl
      }).catch(async () => {
        // In case doc is missing or restricted, attempt setDoc with merge
        await setDoc(doc(db, 'aiSessions', session.id), {
          adminControl: updatedControl
        }, { merge: true });
      });

      // 2. Update localStorage for instant zero-latency sync across tabs & local engine
      const controlKey = `aver_session_control_${session.id}`;
      const userControlKey = `aver_session_control_${session.userId}`;
      localStorage.setItem(controlKey, JSON.stringify(updatedControl));
      localStorage.setItem(userControlKey, JSON.stringify(updatedControl));

      // 3. Dispatch global event so TradingEngineContext picks it up immediately
      window.dispatchEvent(new CustomEvent('aver_admin_control_updated', {
        detail: {
          sessionId: session.id,
          userId: session.userId,
          control: updatedControl
        }
      }));

      // Update local state
      setSession(prev => ({
        ...prev,
        adminControl: updatedControl
      }));

      setSaveSuccessMsg('Outcome directive applied successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Error applying outcome control:", err);
      // Even if Firestore fails, localStorage will keep the engine instructed
      localStorage.setItem(`aver_session_control_${session.id}`, JSON.stringify(updatedControl));
      localStorage.setItem(`aver_session_control_${session.userId}`, JSON.stringify(updatedControl));
      window.dispatchEvent(new CustomEvent('aver_admin_control_updated', {
        detail: {
          sessionId: session.id,
          userId: session.userId,
          control: updatedControl
        }
      }));
      setSaveSuccessMsg('Outcome directive applied (local sync active)!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Instant Next Trade Force Action
  const handleQuickNextTrade = async (targetDirective: 'WIN' | 'LOSS' | 'AUTO') => {
    setForceNextTrade(targetDirective);
    await handleSaveControl({ forceNextTrade: targetDirective });
  };

  // Switch Mode Instantly
  const handleSelectMode = async (selectedMode: SessionControlMode) => {
    setMode(selectedMode);
    await handleSaveControl({ mode: selectedMode });
  };

  // Financial Direct Injection (Inject Profit or Loss)
  const handleInjectPnl = async (amountDelta: number) => {
    setIsSaving(true);
    try {
      const isPositive = amountDelta >= 0;
      const currentProfit = Number(session.totalProfit || 0);
      const currentLoss = Number(session.totalLoss || 0);
      const currentCap = Number(session.tradingCapital || 0);

      const newProfit = isPositive ? currentProfit + amountDelta : currentProfit;
      const newLoss = !isPositive ? currentLoss + Math.abs(amountDelta) : currentLoss;
      const newCap = Math.max(0, currentCap + amountDelta);

      // 1. Update Firestore Session
      await updateDoc(doc(db, 'aiSessions', session.id), {
        totalProfit: newProfit,
        totalLoss: newLoss,
        tradingCapital: newCap,
        lastUpdate: Timestamp.now()
      }).catch(() => {});

      // 2. Update LocalStorage Session & User
      const sessionKey = `aver_session_${session.userId}`;
      const existingRaw = localStorage.getItem(sessionKey);
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          parsed.totalProfit = newProfit;
          parsed.totalLoss = newLoss;
          parsed.tradingCapital = newCap;
          localStorage.setItem(sessionKey, JSON.stringify(parsed));
        } catch (e) {}
      }

      // Update state
      setSession(prev => ({
        ...prev,
        totalProfit: newProfit,
        totalLoss: newLoss,
        tradingCapital: newCap
      }));

      // Broadcast update
      window.dispatchEvent(new CustomEvent('aver_session_updated', {
        detail: {
          ...session,
          totalProfit: newProfit,
          totalLoss: newLoss,
          tradingCapital: newCap
        }
      }));

      setSaveSuccessMsg(`Injected ${isPositive ? '+' : ''}$${amountDelta.toFixed(2)} into session P&L!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error("Injection error:", e);
      alert("Failed to inject P&L adjustment.");
    } finally {
      setIsSaving(false);
    }
  };

  // Force Close an Individual Position with WIN or LOSS or MARKET
  const handleForceClosePosition = async (trade: TradeRecord, outcomeType: 'WIN' | 'LOSS' | 'MARKET') => {
    setIsSaving(true);
    try {
      const entry = Number(trade.entryPrice || 0);
      let exitPrice = entry;
      let pnl = 0;

      if (outcomeType === 'WIN') {
        const returnPct = 0.035 + Math.random() * 0.02; // +3.5% to +5.5%
        exitPrice = parseFloat((entry * (1 + returnPct)).toFixed(2));
        pnl = parseFloat(((exitPrice - entry) * trade.amount).toFixed(2));
      } else if (outcomeType === 'LOSS') {
        const lossPct = -(0.025 + Math.random() * 0.02); // -2.5% to -4.5%
        exitPrice = parseFloat((entry * (1 + lossPct)).toFixed(2));
        pnl = parseFloat(((exitPrice - entry) * trade.amount).toFixed(2));
      } else {
        exitPrice = trade.currentPrice || entry;
        pnl = parseFloat(((exitPrice - entry) * trade.amount).toFixed(2));
      }

      // 1. Update Trade Doc in Firestore
      try {
        await updateDoc(doc(db, 'users', session.userId, 'trades', trade.id), {
          status: 'CLOSED',
          exitPrice,
          exit: exitPrice,
          pnl,
          closedAt: Timestamp.now(),
          reasonClosed: outcomeType === 'WIN' ? 'TARGET_HIT' : outcomeType === 'LOSS' ? 'STOP_LOSS_HIT' : 'MANUAL'
        });
      } catch (err) {
        console.warn("Could not update trade doc directly:", err);
      }

      // 2. Update Local Storage Trades
      try {
        const localKey = `aver_trades_${session.userId}`;
        const localRaw = localStorage.getItem(localKey);
        if (localRaw) {
          const parsed: any[] = JSON.parse(localRaw);
          const updated = parsed.map(t => {
            if (t.id === trade.id) {
              return {
                ...t,
                status: 'CLOSED',
                exitPrice,
                exit: exitPrice,
                pnl,
                closedAt: new Date().toISOString(),
                reasonClosed: outcomeType === 'WIN' ? 'TARGET_HIT' : outcomeType === 'LOSS' ? 'STOP_LOSS_HIT' : 'MANUAL'
              };
            }
            return t;
          });
          localStorage.setItem(localKey, JSON.stringify(updated));
        }
      } catch (e) {}

      // 3. Update Session Metrics
      const isWin = pnl >= 0;
      const newProfit = isWin ? (session.totalProfit || 0) + pnl : (session.totalProfit || 0);
      const newLoss = !isWin ? (session.totalLoss || 0) + Math.abs(pnl) : (session.totalLoss || 0);
      const newCap = (session.tradingCapital || 0) + pnl;

      await updateDoc(doc(db, 'aiSessions', session.id), {
        totalProfit: newProfit,
        totalLoss: newLoss,
        tradingCapital: newCap,
        lastUpdate: Timestamp.now()
      }).catch(() => {});

      // Trigger local engine refresh
      window.dispatchEvent(new CustomEvent('aver_trade_closed', {
        detail: { tradeId: trade.id, pnl, exitPrice }
      }));

      setSaveSuccessMsg(`Position ${trade.symbol} closed (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)})!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error("Failed to close position:", e);
      alert("Failed to force close position.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open a new manual trade for the user
  const handleOpenManualTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const amountNum = parseFloat(newPosAmount);
      const leverageNum = parseFloat(newPosLeverage) || 1;
      
      let basePrice = 64200;
      if (newPosSymbol.includes('ETH')) basePrice = 3450;
      else if (newPosSymbol.includes('SOL')) basePrice = 145;
      else if (newPosSymbol.includes('XRP')) basePrice = 0.58;
      else if (newPosSymbol.includes('DOGE')) basePrice = 0.12;
      else if (newPosSymbol.includes('BNB')) basePrice = 580;

      const tradeId = `trade_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTradeData = {
        id: tradeId,
        sessionId: session.id,
        userId: session.userId,
        symbol: newPosSymbol,
        type: newPosType,
        amount: amountNum,
        entryPrice: basePrice,
        currentPrice: basePrice,
        leverage: leverageNum,
        pnl: 0,
        status: 'OPEN',
        openedAt: Timestamp.now(),
        timestamp: new Date().toISOString()
      };

      // 1. Add to Firestore
      try {
        await setDoc(doc(db, 'users', session.userId, 'trades', tradeId), newTradeData);
      } catch (err) {
        console.warn("Could not write manual trade to Firestore:", err);
      }

      // 2. Add to LocalStorage
      try {
        const localKey = `aver_trades_${session.userId}`;
        const localRaw = localStorage.getItem(localKey);
        const parsed = localRaw ? JSON.parse(localRaw) : [];
        parsed.unshift(newTradeData);
        localStorage.setItem(localKey, JSON.stringify(parsed));
      } catch (e) {}

      // Trigger local engine event
      window.dispatchEvent(new CustomEvent('aver_admin_manual_order', {
        detail: newTradeData
      }));

      setShowNewPositionModal(false);
      setSaveSuccessMsg(`Manual order placed: ${newPosType.toUpperCase()} ${newPosSymbol} ($${amountNum})`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Error creating manual position:", err);
      alert("Failed to inject manual order.");
    } finally {
      setIsSaving(false);
    }
  };

  // Terminate Active Session completely
  const handleTerminateSession = async () => {
    if (!window.confirm(`FORCE TERMINATE SESSION:\nAre you sure you want to completely stop the active session for ${session.userEmail}?\nAll open positions will be reconciled and the session will be marked INACTIVE.`)) {
      return;
    }

    setIsSaving(true);
    try {
      // 1. Delete session from Firestore aiSessions collection immediately
      await deleteDoc(doc(db, 'aiSessions', session.id)).catch(() => {});

      // 2. Refund balance and update user profile in Firestore
      if (session.userId && !session.userId.startsWith('local-') && session.userId !== 'guest_user') {
        try {
          const uDocRef = doc(db, 'users', session.userId);
          const uDocSnap = await getDoc(uDocRef).catch(() => null);
          const userData = uDocSnap?.exists() ? uDocSnap.data() : null;
          
          const returnCapital = Number(session.tradingCapital || session.initialCapital || 1000);
          const currentTokenBal = Number(userData?.tokenBalance ?? userData?.availableBalance ?? 0);
          const newTokenBal = currentTokenBal + returnCapital;
          const currentPortfolio = Number(userData?.portfolioBalance ?? newTokenBal);
          const newPortfolio = Math.max(newTokenBal, currentPortfolio);

          await updateDoc(uDocRef, {
            tokenBalance: newTokenBal,
            availableBalance: newTokenBal,
            portfolioBalance: newPortfolio,
            aiTradingCapital: 0,
            aiSession: null,
            activeSession: null,
            lastUpdated: serverTimestamp()
          }).catch(() => {});

          await walletService.updateWallet(session.userId, {
            tokenBalance: newTokenBal,
            availableBalance: newTokenBal,
            portfolioBalance: newPortfolio,
            aiTradingCapital: 0,
            portfolioValue: newPortfolio
          }).catch(() => {});

          await portfolioPersistenceService.updateSessionDetails(session.userId, {
            sessionId: null,
            status: 'INACTIVE',
            engineState: 'IDLE'
          }).catch(() => {});

          await portfolioPersistenceService.updateWalletState(session.userId, {
            tokenBalance: newTokenBal,
            availableBalance: newTokenBal,
            portfolioBalance: newPortfolio,
            aiTradingCapital: 0
          }).catch(() => {});
        } catch (uErr) {
          console.warn("[AdminSessionControlModal] Error reconciling user balance on terminate:", uErr);
        }
      }

      // 3. Clear Local Storage for user
      localStorage.removeItem(`aver_session_${session.userId}`);
      localStorage.removeItem(`aver_session_control_${session.id}`);
      localStorage.removeItem(`aver_session_control_${session.userId}`);
      localStorage.removeItem(`aver_stopped_session_${session.userId}`);
      sessionStorage.removeItem(`aver_stopped_session_${session.userId}`);

      // 4. Dispatch updates
      window.dispatchEvent(new CustomEvent('aver_session_updated', { detail: null }));
      window.dispatchEvent(new CustomEvent('aver_session_terminated', { detail: { sessionId: session.id } }));

      if (onSessionTerminated) {
        onSessionTerminated(session.id);
      }
      onClose();
    } catch (e) {
      console.error("Failed to terminate session:", e);
      alert("Failed to stop session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openTrades = sessionTrades.filter(t => t.status === 'OPEN');
  const closedTrades = sessionTrades.filter(t => t.status === 'CLOSED');
  const totalNetPnl = (session.totalProfit || 0) - (session.totalLoss || 0);
  const isNetPnlPositive = totalNetPnl >= 0;
  const initialCap = session.initialCapital || session.tradingCapital || 1000;
  const pnlPercent = initialCap > 0 ? (totalNetPnl / initialCap) * 100 : 0;
  const winCount = closedTrades.filter(t => (t.pnl || 0) >= 0).length;
  const winRateCalculated = closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl text-white flex flex-col notranslate" translate="no">
      {/* Top Fixed Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: User Identity & Live Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                LIVE SESSION CONTROL
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {elapsedFormatted}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base md:text-lg font-black text-white truncate">{session.userEmail}</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(session.userId);
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                className="text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded flex items-center gap-1 font-mono transition-colors"
                title="Copy User UID"
              >
                {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                UID: {session.userId.slice(0, 8)}...
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions & Close */}
        <div className="flex items-center gap-3">
          {saveSuccessMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saveSuccessMsg}
            </motion.div>
          )}

          <button
            onClick={handleTerminateSession}
            disabled={isSaving}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 px-3.5 py-2 rounded-xl transition-all"
            title="Terminate active trading session"
          >
            <Square className="w-3.5 h-3.5" />
            Stop Session
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
            title="Close Fullscreen View (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Allocated Capital */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Allocated Capital</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-white">
              ${(session.tradingCapital || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Initial: ${initialCap.toLocaleString()}</span>
              <span className="font-mono text-emerald-400">#{(session.id || '').slice(-6)}</span>
            </div>
          </div>

          {/* Session P&L */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Live Session P&L</span>
              {isNetPnlPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
            </div>
            <div className={`text-xl md:text-2xl font-black font-mono flex items-center gap-1 ${isNetPnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isNetPnlPositive ? '+' : ''}${totalNetPnl.toFixed(2)}
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ml-1">
                {isNetPnlPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Profits: +${(session.totalProfit || 0).toFixed(2)}</span>
              <span>Losses: -${(session.totalLoss || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Active Positions */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Open Positions</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-blue-400">
              {openTrades.length} <span className="text-sm font-normal text-slate-400">active orders</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Closed Trades: {closedTrades.length}</span>
              <span>Win Rate: {winRateCalculated}%</span>
            </div>
          </div>

          {/* Active Directive Mode */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 relative overflow-hidden shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Active Directive</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base md:text-lg font-black text-amber-400 flex items-center gap-1.5 truncate">
              {mode === 'NORMAL' && <span className="text-slate-300">🟢 Natural / Standard</span>}
              {mode === 'FORCE_PROFIT' && <span className="text-emerald-400">🚀 Force Profit</span>}
              {mode === 'FORCE_LOSS' && <span className="text-rose-400">🔻 Force Drawdown</span>}
              {mode === 'CUSTOM_TARGET_PNL' && <span className="text-cyan-400">🎯 Target ${customTargetPnl}</span>}
              {mode === 'CUSTOM_WIN_RATE' && <span className="text-purple-400">📊 Win Rate {customWinRate}%</span>}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Next Trade: <b className="text-white">{forceNextTrade}</b></span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Real-time</span>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'control'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Outcome Directives & Controls
          </button>

          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'positions'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Active Positions ({openTrades.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            Session Trade Audit ({closedTrades.length})
          </button>
        </div>

        {/* TAB 1: OUTCOME DIRECTIVES & CONTROLS */}
        {activeTab === 'control' && (
          <div className="space-y-6">
            {/* Mode Selector Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Select Session Outcome Mode
                </h3>
                <span className="text-xs text-slate-500">Changes apply immediately to this active session</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. NATURAL / STANDARD */}
                <div
                  onClick={() => handleSelectMode('NORMAL')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    mode === 'NORMAL'
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <Shield className="w-4 h-4" />
                      </div>
                      {mode === 'NORMAL' && (
                        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white">Natural / Normal</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Zero manipulation. Trades 100% naturally using real market price feeds and normal algorithm risk rules.
                    </p>
                  </div>
                </div>

                {/* 2. FORCE PROFIT */}
                <div
                  onClick={() => handleSelectMode('FORCE_PROFIT')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    mode === 'FORCE_PROFIT'
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-400'
                      : 'bg-slate-900/60 border-white/10 hover:border-emerald-500/30 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      {mode === 'FORCE_PROFIT' && (
                        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-emerald-400">Force High Profit</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Forces upcoming trades to execute in strong positive profit with maximized alpha returns.
                    </p>
                  </div>
                </div>

                {/* 3. FORCE LOSS */}
                <div
                  onClick={() => handleSelectMode('FORCE_LOSS')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    mode === 'FORCE_LOSS'
                      ? 'bg-rose-500/15 border-rose-400 shadow-lg shadow-rose-500/15 ring-1 ring-rose-400'
                      : 'bg-slate-900/60 border-white/10 hover:border-rose-500/30 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      {mode === 'FORCE_LOSS' && (
                        <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-rose-400">Force Drawdown</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Simulates controlled negative yield and drawdown on subsequent trade executions.
                    </p>
                  </div>
                </div>

                {/* 4. CUSTOM TARGET PNL */}
                <div
                  onClick={() => handleSelectMode('CUSTOM_TARGET_PNL')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    mode === 'CUSTOM_TARGET_PNL'
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400'
                      : 'bg-slate-900/60 border-white/10 hover:border-cyan-500/30 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Target className="w-4 h-4" />
                      </div>
                      {mode === 'CUSTOM_TARGET_PNL' && (
                        <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-cyan-400">Target P&L</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Steers session trades steadily towards an exact specified dollar P&L target.
                    </p>
                  </div>
                </div>

                {/* 5. CUSTOM WIN RATE */}
                <div
                  onClick={() => handleSelectMode('CUSTOM_WIN_RATE')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    mode === 'CUSTOM_WIN_RATE'
                      ? 'bg-purple-500/15 border-purple-400 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400'
                      : 'bg-slate-900/60 border-white/10 hover:border-purple-500/30 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <Percent className="w-4 h-4" />
                      </div>
                      {mode === 'CUSTOM_WIN_RATE' && (
                        <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-purple-400">Win Rate Lock</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Locks exact statistical win rate percentage (e.g. 90%, 50%, 20%) for all orders.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Mode Target Configuration Inputs */}
            {(mode === 'CUSTOM_TARGET_PNL' || mode === 'CUSTOM_WIN_RATE') && (
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  Configure Target Parameters
                </h4>

                {mode === 'CUSTOM_TARGET_PNL' && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-xs text-slate-400 font-bold">Target P&L Amount ($):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customTargetPnl}
                        onChange={(e) => setCustomTargetPnl(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-sm w-40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="500"
                      />
                      <button
                        onClick={() => handleSaveControl({ customTargetPnl: Number(customTargetPnl) })}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
                      >
                        Apply Target
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Quick presets:</span>
                      <button onClick={() => { setCustomTargetPnl(250); handleSaveControl({ customTargetPnl: 250 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">+$250</button>
                      <button onClick={() => { setCustomTargetPnl(500); handleSaveControl({ customTargetPnl: 500 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">+$500</button>
                      <button onClick={() => { setCustomTargetPnl(1000); handleSaveControl({ customTargetPnl: 1000 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">+$1,000</button>
                      <button onClick={() => { setCustomTargetPnl(-250); handleSaveControl({ customTargetPnl: -250 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">-$250</button>
                    </div>
                  </div>
                )}

                {mode === 'CUSTOM_WIN_RATE' && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-xs text-slate-400 font-bold">Lock Win Rate (%):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customWinRate}
                        onChange={(e) => setCustomWinRate(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-sm w-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="85"
                      />
                      <button
                        onClick={() => handleSaveControl({ customWinRate: Number(customWinRate) })}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition-all"
                      >
                        Lock Rate
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Presets:</span>
                      <button onClick={() => { setCustomWinRate(95); handleSaveControl({ customWinRate: 95 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">95% (Guaranteed)</button>
                      <button onClick={() => { setCustomWinRate(75); handleSaveControl({ customWinRate: 75 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">75% (High)</button>
                      <button onClick={() => { setCustomWinRate(50); handleSaveControl({ customWinRate: 50 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">50% (Neutral)</button>
                      <button onClick={() => { setCustomWinRate(20); handleSaveControl({ customWinRate: 20 }); }} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded font-mono text-[11px]">20% (Low)</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instant Next Trade Override Toolbar */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Instant Next Trade Directive
                </h3>
                <span className="text-xs text-slate-500">Overrides only the very next executed trade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickNextTrade('WIN')}
                  disabled={isSaving}
                  className={`p-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    forceNextTrade === 'WIN'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Force Next Trade to WIN
                </button>

                <button
                  onClick={() => handleQuickNextTrade('LOSS')}
                  disabled={isSaving}
                  className={`p-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    forceNextTrade === 'LOSS'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Force Next Trade to LOSE
                </button>

                <button
                  onClick={() => handleQuickNextTrade('AUTO')}
                  disabled={isSaving}
                  className={`p-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    forceNextTrade === 'AUTO'
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Auto / Natural Next Trade
                </button>
              </div>
            </div>

            {/* Direct Financial Injection Row */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Direct Capital & P&L Injection
                </h3>
                <span className="text-xs text-slate-500">Instantly adjusts session balance and realized P&L</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleInjectPnl(50)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs"
                >
                  + $50.00
                </button>
                <button
                  onClick={() => handleInjectPnl(100)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs"
                >
                  + $100.00
                </button>
                <button
                  onClick={() => handleInjectPnl(250)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs"
                >
                  + $250.00
                </button>
                <button
                  onClick={() => handleInjectPnl(500)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs"
                >
                  + $500.00
                </button>

                <div className="h-6 w-px bg-white/10 mx-1"></div>

                <button
                  onClick={() => handleInjectPnl(-50)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-mono font-bold text-xs"
                >
                  - $50.00
                </button>
                <button
                  onClick={() => handleInjectPnl(-100)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-mono font-bold text-xs"
                >
                  - $100.00
                </button>
                <button
                  onClick={() => handleInjectPnl(-250)}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-mono font-bold text-xs"
                >
                  - $250.00
                </button>

                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="number"
                    value={injectedAmount}
                    onChange={(e) => setInjectedAmount(e.target.value)}
                    placeholder="Custom $"
                    className="w-24 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const num = parseFloat(injectedAmount);
                      if (!isNaN(num) && num !== 0) handleInjectPnl(num);
                    }}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                  >
                    Inject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE POSITIONS */}
        {activeTab === 'positions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Live Open Positions for {session.userEmail}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control active market exposure or manually trigger instant targeted exits.
                </p>
              </div>

              <button
                onClick={() => setShowNewPositionModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Inject Custom Order
              </button>
            </div>

            {openTrades.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-2">
                <Activity className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                <p className="text-sm font-bold text-slate-300">No Open Positions</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The automated trading loop is continuously scanning markets. Positions opened by the engine will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openTrades.map(trade => {
                  const pnl = trade.pnl || 0;
                  const isTradeWin = pnl >= 0;
                  const isLong = trade.type === 'buy' || trade.type === 'long';

                  return (
                    <div 
                      key={trade.id}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isLong ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isLong ? 'LONG' : 'SHORT'}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-white">{trade.symbol}</h4>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Entry: ${Number(trade.entryPrice || 0).toLocaleString()} • Size: ${Number(trade.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className={`text-base font-black ${isTradeWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isTradeWin ? '+' : ''}${pnl.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-500 block">Floating P&L</span>
                        </div>
                      </div>

                      {/* Position Actions */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleForceClosePosition(trade, 'WIN')}
                          disabled={isSaving}
                          className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Force Win (+3.5%)
                        </button>

                        <button
                          onClick={() => handleForceClosePosition(trade, 'LOSS')}
                          disabled={isSaving}
                          className="py-2 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Force Loss (-2.5%)
                        </button>

                        <button
                          onClick={() => handleForceClosePosition(trade, 'MARKET')}
                          disabled={isSaving}
                          className="py-2 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                        >
                          <Square className="w-3.5 h-3.5" />
                          Close Market
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SESSION TRADE AUDIT */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Closed Trades History ({closedTrades.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete audit log of executed trades for this active session.
                </p>
              </div>
            </div>

            {closedTrades.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                <p className="text-sm font-bold text-slate-300">No Closed Trades Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Trades completed during this session will be recorded here with timestamp, entry, exit, and net P&L.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/90 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-3.5">Asset / Pair</th>
                        <th className="p-3.5">Type</th>
                        <th className="p-3.5">Size ($)</th>
                        <th className="p-3.5">Entry Price</th>
                        <th className="p-3.5">Exit Price</th>
                        <th className="p-3.5">Net P&L</th>
                        <th className="p-3.5">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {closedTrades.map(t => {
                        const isWin = (t.pnl || 0) >= 0;
                        return (
                          <tr key={t.id} className="hover:bg-white/[0.02]">
                            <td className="p-3.5 font-bold text-white font-sans">{t.symbol}</td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                t.type === 'buy' || t.type === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {t.type?.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-300">${Number(t.amount || 0).toFixed(2)}</td>
                            <td className="p-3.5 text-slate-400">${Number(t.entryPrice || 0).toLocaleString()}</td>
                            <td className="p-3.5 text-slate-300">${Number(t.currentPrice || t.entryPrice || 0).toLocaleString()}</td>
                            <td className={`p-3.5 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isWin ? '+' : ''}${Number(t.pnl || 0).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-[11px] text-slate-500 font-sans">
                              {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: INJECT CUSTOM ORDER */}
      {showNewPositionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Inject Custom Order
              </h3>
              <button onClick={() => setShowNewPositionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenManualTrade} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Asset Pair</label>
                <select
                  value={newPosSymbol}
                  onChange={(e) => setNewPosSymbol(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/20 text-white text-sm focus:outline-none"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                  <option value="XRP/USDT">XRP/USDT</option>
                  <option value="DOGE/USDT">DOGE/USDT</option>
                  <option value="BNB/USDT">BNB/USDT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Direction</label>
                  <div className="flex rounded-xl bg-black/50 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewPosType('long')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${newPosType === 'long' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      LONG
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPosType('short')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${newPosType === 'short' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
                    >
                      SHORT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Size (USD)</label>
                  <input
                    type="number"
                    value={newPosAmount}
                    onChange={(e) => setNewPosAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-sm focus:outline-none"
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPositionModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
                >
                  Launch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
