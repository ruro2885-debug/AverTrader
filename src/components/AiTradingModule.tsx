import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Play, Square, Settings, Zap, Plus, Trash2, 
  Terminal, ArrowUpRight, ArrowDownRight, Bot, X, Check,
  Sliders, AlertTriangle, Cpu, Shield, SlidersHorizontal, 
  Eye, Percent, HelpCircle, Lock, Unlock, Sparkles, ChevronDown,
  ChevronUp, RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';

interface ActiveTrade {
  id: string;
  pair: string;
  algorithm: string;
  type: 'LONG' | 'SHORT' | 'HEDGE';
  entryPrice: number;
  currentPrice: number;
  pnl: number; // percentage ROI
  allocatedCapital: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'ACTIVE' | 'HALTED';
  rationale: string;
  timestamp: string;
}

interface PendingSignal {
  id: string;
  pair: string;
  direction: 'LONG' | 'SHORT';
  algorithm: string;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  rationale: string;
  targetPrice: number;
  stopLoss: number;
}

export default function AiTradingModule({ theme }: { theme: 'light' | 'dark' }) {
  const { t, formatCurrency } = usePreferences();
  const { user, updateProfile } = useAuth();
  const isDark = theme === 'dark';

  // State for AI Operating Mode
  const [copilotMode, setCopilotMode] = useState<'copilot' | 'autonomous'>(() => {
    return (localStorage.getItem('aver_ai_mode') as 'copilot' | 'autonomous') || 'copilot';
  });

  // State for AI Guardrails & Preferences
  const [maxActiveTrades, setMaxActiveTrades] = useState<number>(() => {
    return parseInt(localStorage.getItem('aver_ai_max_trades') || '3', 10);
  });
  const [riskProfile, setRiskProfile] = useState<'Conservative' | 'Balanced' | 'Tactical'>(() => {
    return (localStorage.getItem('aver_ai_risk_profile') as any) || 'Balanced';
  });
  const [drawdownStopLimit, setDrawdownStopLimit] = useState<number>(() => {
    return parseFloat(localStorage.getItem('aver_ai_drawdown_limit') || '2.5');
  });
  const [maxCapitalExposure, setMaxCapitalExposure] = useState<number>(() => {
    return parseFloat(localStorage.getItem('aver_ai_max_exposure') || '40'); // % of available balance
  });

  // UI toggle states
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [selectedTradeLogsId, setSelectedTradeLogsId] = useState<string | null>(null);
  const [customDeployOpen, setCustomDeployOpen] = useState<boolean>(false);

  // Custom Deploy Form State
  const [deployPair, setDeployPair] = useState('BTC/USDT');
  const [deployAlgo, setDeployAlgo] = useState('VWAP Mean Reversion');
  const [deployType, setDeployType] = useState<'LONG' | 'SHORT'>('LONG');
  const [deployCapital, setDeployCapital] = useState('1500');
  const [deployRisk, setDeployRisk] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Unified audit trail (system logs)
  const [logs, setLogs] = useState<string[]>(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return [
      `[${timeStr}] System initialized. Loaded Aver AI Neural Core v4.11.0.`,
      `[${timeStr}] Current guardrails validated: drawdown limit set to ${drawdownStopLimit}%, risk mode: ${riskProfile}.`,
      `[${timeStr}] Subscribed to high-frequency WebSocket streams for BTC, ETH, and SOL.`
    ];
  });

  const addLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${timeStr}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Portfolio total reference
  const portfolioTotal = user?.portfolio?.totalValue || 124560;
  const availableBalance = user?.availableBalance || 15000;

  // Active AI-Managed positions
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(() => {
    const saved = localStorage.getItem('aver_ai_active_trades');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'trade-btc-1',
        pair: 'BTC/USDT',
        algorithm: 'Tactical Momentum',
        type: 'LONG',
        entryPrice: 63890.00,
        currentPrice: 64230.00,
        pnl: 0.53,
        allocatedCapital: 2500,
        riskLevel: 'Medium',
        status: 'ACTIVE',
        rationale: 'H4 EMA crossover confirmed with supportive volume cluster. Target zone at $65,500. Trailing safeguard stop set at $63,400.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'trade-sol-2',
        pair: 'SOL/USDT',
        algorithm: 'High-Freq Scalper',
        type: 'LONG',
        entryPrice: 141.20,
        currentPrice: 145.60,
        pnl: 3.11,
        allocatedCapital: 1500,
        riskLevel: 'High',
        status: 'ACTIVE',
        rationale: 'RSI divergence detected on M15 timeline with bullish order book pressure. Capturing minor range breakouts with immediate risk offset.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    ];
  });

  // Available high-conviction opportunities scanned by AI
  const [pendingSignals, setPendingSignals] = useState<PendingSignal[]>([
    {
      id: 'sig-eth-1',
      pair: 'ETH/USDT',
      direction: 'LONG',
      algorithm: 'VWAP Mean Reversion',
      confidence: 91,
      riskLevel: 'Low',
      rationale: 'Price breached the -2.0 standard deviation band on VWAP. High probability of prompt mean reversion back to $3,485 midline.',
      targetPrice: 3485.00,
      stopLoss: 3390.00
    },
    {
      id: 'sig-avr-2',
      pair: 'AVR/USDT',
      direction: 'LONG',
      algorithm: 'Delta Neutral Hedge',
      confidence: 87,
      riskLevel: 'Medium',
      rationale: 'Aver native token shows strong accumulation clusters on spot desks with rising DEX liquidity depth. Breakout signal active.',
      targetPrice: 1.35,
      stopLoss: 1.18
    },
    {
      id: 'sig-btc-short',
      pair: 'BTC/USDT',
      direction: 'SHORT',
      algorithm: 'Volume Divergence',
      confidence: 84,
      riskLevel: 'High',
      rationale: 'Order book depth exhibits high ask-side liquidity wall at $64,800. Momentum cooling off on hourly frames. Short hedge opportunity.',
      targetPrice: 63100.00,
      stopLoss: 64950.00
    }
  ]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('aver_ai_mode', copilotMode);
    localStorage.setItem('aver_ai_max_trades', maxActiveTrades.toString());
    localStorage.setItem('aver_ai_risk_profile', riskProfile);
    localStorage.setItem('aver_ai_drawdown_limit', drawdownStopLimit.toString());
    localStorage.setItem('aver_ai_max_exposure', maxCapitalExposure.toString());
  }, [copilotMode, maxActiveTrades, riskProfile, drawdownStopLimit, maxCapitalExposure]);

  useEffect(() => {
    localStorage.setItem('aver_ai_active_trades', JSON.stringify(activeTrades));
  }, [activeTrades]);

  // Live price fluctuation & logic ticks
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Tick active trades prices slightly
      setActiveTrades(prevTrades => {
        let changed = false;
        const updated = prevTrades.map(trade => {
          if (trade.status !== 'ACTIVE') return trade;
          changed = true;

          // Subtle random fluctuation (-0.12% to +0.18%)
          const pct = (Math.random() * 0.3) - 0.12;
          const delta = trade.currentPrice * (pct / 100);
          const nextPrice = parseFloat((trade.currentPrice + delta).toFixed(2));
          
          // Calculate new PNL percent from entry
          let pnlPercent = 0;
          if (trade.type === 'LONG') {
            pnlPercent = ((nextPrice - trade.entryPrice) / trade.entryPrice) * 100;
          } else {
            pnlPercent = ((trade.entryPrice - nextPrice) / trade.entryPrice) * 100;
          }

          // Random trade execution events
          if (Math.random() > 0.94) {
            const actions = [
              `Re-evaluating trend strength for ${trade.pair}. Status: Stable.`,
              `Adjusted Trailing Safeguard stop for ${trade.pair} in response to volatility changes.`,
              `Liquidity pool depth for ${trade.pair} holds at ${Math.round(80 + Math.random() * 40)}% standard density.`,
              `Risk audit confirmed for position #${trade.id}. Volatility parameters within guidelines.`
            ];
            addLog(actions[Math.floor(Math.random() * actions.length)]);
          }

          return {
            ...trade,
            currentPrice: nextPrice,
            pnl: parseFloat(pnlPercent.toFixed(2))
          };
        });

        return changed ? updated : prevTrades;
      });

      // 2. Occasional autonomous actions if autonomous mode is enabled
      if (copilotMode === 'autonomous' && Math.random() > 0.85 && activeTrades.length < maxActiveTrades && pendingSignals.length > 0) {
        // AI autonomously triggers the highest confidence pending signal
        const candidate = [...pendingSignals].sort((a, b) => b.confidence - a.confidence)[0];
        if (candidate) {
          const cap = Math.min(2000, Math.floor(availableBalance * (maxCapitalExposure / 100) / maxActiveTrades));
          
          if (cap >= 200) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newTrade: ActiveTrade = {
              id: `trade-auto-${Date.now()}`,
              pair: candidate.pair,
              algorithm: candidate.algorithm,
              type: candidate.direction,
              entryPrice: candidate.pair === 'ETH/USDT' ? 3450.20 : candidate.pair === 'AVR/USDT' ? 1.24 : 64230.00,
              currentPrice: candidate.pair === 'ETH/USDT' ? 3450.20 : candidate.pair === 'AVR/USDT' ? 1.24 : 64230.00,
              pnl: 0.00,
              allocatedCapital: cap,
              riskLevel: candidate.riskLevel,
              status: 'ACTIVE',
              rationale: `Autonomous entry triggered by Neural core. Rationale: ${candidate.rationale}`,
              timestamp: new Date().toISOString()
            };

            setActiveTrades(prev => [...prev, newTrade]);
            setPendingSignals(prev => prev.filter(s => s.id !== candidate.id));
            addLog(`Autonomous Executed: Opened ${newTrade.type} on ${newTrade.pair} (${newTrade.algorithm}). Capital: $${cap.toLocaleString()}`);
          }
        }
      }

    }, 5000);

    return () => clearInterval(timer);
  }, [activeTrades, pendingSignals, copilotMode, maxActiveTrades, availableBalance, maxCapitalExposure]);

  // Calculations for dashboard
  const activeCount = activeTrades.filter(t => t.status === 'ACTIVE').length;
  const totalAllocated = activeTrades.reduce((acc, t) => acc + t.allocatedCapital, 0);
  const netReturnVal = useMemo(() => {
    return activeTrades.reduce((acc, t) => {
      const returnAmt = t.allocatedCapital * (t.pnl / 100);
      return acc + returnAmt;
    }, 0);
  }, [activeTrades]);

  const netReturnPct = totalAllocated > 0 ? (netReturnVal / totalAllocated) * 100 : 0;

  // Actions
  const toggleTradeStatus = (id: string) => {
    setActiveTrades(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'ACTIVE' ? 'HALTED' : 'ACTIVE';
        addLog(`Position #${id} (${t.pair}) state set to ${nextStatus}.`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const closeTrade = (id: string) => {
    const target = activeTrades.find(t => t.id === id);
    if (target) {
      const finalReturn = target.allocatedCapital * (target.pnl / 100);
      addLog(`Closed Position #${id} on ${target.pair}. Final Return: ${finalReturn >= 0 ? '+' : ''}$${finalReturn.toFixed(2)} (${target.pnl}%).`);
      
      // Update available balance back in user context if appropriate, otherwise just show on UI
      if (user && updateProfile) {
        const payout = target.allocatedCapital + finalReturn;
        updateProfile({
          availableBalance: Math.max(0, parseFloat((user.availableBalance + finalReturn).toFixed(2)))
        } as any);
      }
      setActiveTrades(prev => prev.filter(t => t.id !== id));
      if (selectedTradeLogsId === id) setSelectedTradeLogsId(null);
    }
  };

  const rebalanceAll = () => {
    addLog(`Initiating portfolio-wide AI rebalancing sweep...`);
    setActiveTrades(prev => prev.map(t => {
      if (t.status !== 'ACTIVE') return t;
      addLog(`Rebalanced execution offsets for ${t.pair} neural strategy.`);
      return {
        ...t,
        allocatedCapital: Math.round(t.allocatedCapital * 0.98 + (Math.random() * 20))
      };
    }));
    addLog(`Neural alignment rebalancing completed. Volatility risk balanced.`);
  };

  const deployPendingSignal = (sig: PendingSignal) => {
    // Check exposure limits
    const allowedExposure = availableBalance * (maxCapitalExposure / 100);
    if (totalAllocated >= allowedExposure) {
      alert(`Guardrail Triggered: Active exposure ($${totalAllocated.toLocaleString()}) would exceed your configured Limit of $${allowedExposure.toLocaleString()} (${maxCapitalExposure}% of available reserves).`);
      addLog(`Deployment Rejected: Guardrail limit exceeded.`);
      return;
    }

    if (activeTrades.length >= maxActiveTrades) {
      alert(`Guardrail Triggered: Active trade count holds at maximum threshold of ${maxActiveTrades}. Adjust preferences to deploy further.`);
      addLog(`Deployment Rejected: Active trade count limit of ${maxActiveTrades} reached.`);
      return;
    }

    const price = sig.pair === 'BTC/USDT' ? 64230.00 : sig.pair === 'ETH/USDT' ? 3450.20 : 1.24;
    const allocated = Math.min(availableBalance - totalAllocated, 2000);

    const newTrade: ActiveTrade = {
      id: `trade-${sig.id}-${Date.now()}`,
      pair: sig.pair,
      algorithm: sig.algorithm,
      type: sig.direction === 'LONG' ? 'LONG' : 'SHORT',
      entryPrice: price,
      currentPrice: price,
      pnl: 0.00,
      allocatedCapital: allocated,
      riskLevel: sig.riskLevel,
      status: 'ACTIVE',
      rationale: `Co-Pilot initialized: ${sig.rationale}`,
      timestamp: new Date().toISOString()
    };

    setActiveTrades(prev => [...prev, newTrade]);
    setPendingSignals(prev => prev.filter(s => s.id !== sig.id));
    addLog(`Co-Pilot Executed: Spawned ${newTrade.type} trade on ${newTrade.pair} with $${allocated.toLocaleString()} allocation.`);
  };

  const deployCustomTrade = () => {
    const capital = parseFloat(deployCapital) || 500;
    if (capital > availableBalance) {
      alert(`Insufficient available wallet reserves. Current Available: $${availableBalance.toLocaleString()}`);
      return;
    }

    const price = deployPair === 'BTC/USDT' ? 64230.00 : deployPair === 'ETH/USDT' ? 3450.20 : 145.60;

    const newTrade: ActiveTrade = {
      id: `custom-${Date.now()}`,
      pair: deployPair,
      algorithm: deployAlgo,
      type: deployType as any,
      entryPrice: price,
      currentPrice: price,
      pnl: 0.00,
      allocatedCapital: capital,
      riskLevel: deployRisk,
      status: 'ACTIVE',
      rationale: `Manual user-commissioned Copilot trade. Custom Algorithm: ${deployAlgo}.`,
      timestamp: new Date().toISOString()
    };

    setActiveTrades(prev => [...prev, newTrade]);
    setCustomDeployOpen(false);
    addLog(`Custom AI Position deployed on ${deployPair}. Allocated: $${capital.toLocaleString()}.`);
  };

  // Styling Classes
  const cardClasses = isDark
    ? "bg-[#0b0f19]/70 backdrop-blur-xl border border-white/5 shadow-2xl"
    : "bg-white/85 backdrop-blur-xl border border-slate-200/60 shadow-lg";

  const inputClasses = isDark
    ? "bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]"
    : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const textTertiary = isDark ? "text-slate-500" : "text-slate-400";
  const borderColor = isDark ? "border-white/5" : "border-slate-100";

  return (
    <div className={`py-6 space-y-6 font-sans ${textPrimary}`}>
      
      {/* Header Panel with Premium Institutional Background Photo */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop" 
          alt="Aver Neural Core Trading Desk" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D09C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D09C]"></span>
              </span>
              <span className="text-[10px] font-mono font-black tracking-widest text-[#00D09C] uppercase">
                Aver Neural Core Desk
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Institutional AI Desk
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">
              Co-manage multi-trade allocation models alongside Aver's proprietary neural engine. Real-time scanning, risk-adjusted boundaries, and absolute explainability on every execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Rebalance */}
            <button
              onClick={rebalanceAll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Optimise Allocation</span>
            </button>

            {/* Custom Trade Deploy */}
            <button
              onClick={() => setCustomDeployOpen(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-[#00D09C]/10 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Deploy Custom Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Console & Strategic Guardrails */}
      <div className={`rounded-2xl p-5 ${cardClasses} space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/20 dark:border-white/5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              AI Strategy Configuration
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Set general execution parameters and automated risk thresholds.
            </p>
          </div>

          {/* Copilot Mode Toggle */}
          <div className="flex items-center p-1 bg-black/20 rounded-xl max-w-max border border-white/5">
            <button
              onClick={() => {
                setCopilotMode('copilot');
                addLog('AI mode adjusted to: CO-PILOT. Executions require explicit user approval.');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copilotMode === 'copilot'
                  ? 'bg-[#00D09C] text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Co-Pilot (Manual Confirmation)</span>
            </button>
            <button
              onClick={() => {
                setCopilotMode('autonomous');
                addLog('AI mode adjusted to: AUTONOMOUS. System can self-execute setup triggers.');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copilotMode === 'autonomous'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Autonomous Desk</span>
            </button>
          </div>
        </div>

        {/* Dynamic Guardrail Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className={textSecondary}>Max Active Trades</span>
              <span className="text-[#00D09C] font-mono">{maxActiveTrades} positions</span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={5} 
              value={maxActiveTrades}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMaxActiveTrades(val);
                addLog(`Guardrail configured: Max simultaneous active trades set to ${val}.`);
              }}
              className="w-full accent-[#00D09C] bg-slate-200 dark:bg-slate-800 h-1 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className={textSecondary}>Max Leverage Drawdown Stop</span>
              <span className="text-rose-400 font-mono">-{drawdownStopLimit}%</span>
            </div>
            <input 
              type="range" 
              min={0.5} 
              max={5.0} 
              step={0.1}
              value={drawdownStopLimit}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDrawdownStopLimit(val);
                addLog(`Guardrail configured: Hard drawdown limit set to -${val}% per trade.`);
              }}
              className="w-full accent-rose-500 bg-slate-200 dark:bg-slate-800 h-1 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className={textSecondary}>Max Capital Exposure</span>
              <span className="text-[#00D09C] font-mono">{maxCapitalExposure}%</span>
            </div>
            <input 
              type="range" 
              min={10} 
              max={80} 
              step={5}
              value={maxCapitalExposure}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setMaxCapitalExposure(val);
                addLog(`Guardrail configured: Max available capital exposure cap set to ${val}%.`);
              }}
              className="w-full accent-[#00D09C] bg-slate-200 dark:bg-slate-800 h-1 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold ${textSecondary} block`}>Risk Profile Mode</label>
            <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
              {(['Conservative', 'Balanced', 'Tactical'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRiskProfile(r);
                    addLog(`Strategy risk alignment updated to: ${r}.`);
                  }}
                  className={`py-1 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${
                    riskProfile === r 
                      ? 'bg-white/10 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global AI Status HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${cardClasses} p-4.5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Simultaneous Channels</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-[#00D09C]">{activeCount}</span>
              <span className="text-xs text-slate-400">/ {maxActiveTrades} maximum limits</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#00D09C]/10 text-[#00D09C]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className={`${cardClasses} p-4.5 rounded-2xl flex items-center justify-between`}>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Managed Capital Exposure</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black">${totalAllocated.toLocaleString()}</span>
              <span className="text-xs text-slate-400">
                ({Math.round((totalAllocated / availableBalance) * 100)}% utilization)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4.5 rounded-2xl flex items-center justify-between border ${
          netReturnVal >= 0 
            ? 'bg-emerald-950/10 border-emerald-500/20' 
            : 'bg-rose-950/10 border-rose-500/20'
        }`}>
          <div>
            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Copilot Net Performance</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-black ${netReturnVal >= 0 ? 'text-[#00D09C]' : 'text-[#FF6B6B]'}`}>
                {netReturnVal >= 0 ? '+' : ''}${netReturnVal.toFixed(2)}
              </span>
              <span className={`text-xs font-mono font-bold ${netReturnVal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ({netReturnVal >= 0 ? '+' : ''}{netReturnPct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${netReturnVal >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {netReturnVal >= 0 ? <TrendingUp className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Main Content Flow: Active Trades & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Managed Positions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00D09C]" />
              Active Co-Managed Trades ({activeCount})
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Auto-Drawdown Safeguard: Active
            </span>
          </div>

          {activeTrades.length === 0 ? (
            <div className={`${cardClasses} p-12 rounded-2xl text-center space-y-4`}>
              <Cpu className="w-10 h-10 mx-auto text-slate-500 animate-pulse" />
              <p className={`text-sm ${textSecondary} font-medium`}>
                No live co-managed trades detected on this desk.
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Authorize a pending scanned market anomaly on the sidebar or deploy a custom strategy override parameters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTrades.map((trade) => {
                const isSelectedForLogs = selectedTradeLogsId === trade.id;
                return (
                  <motion.div 
                    layout
                    key={trade.id} 
                    className={`rounded-2xl border transition-all ${
                      trade.status === 'ACTIVE'
                        ? isDark ? 'bg-slate-900/60 border-[#00D09C]/20' : 'bg-white border-[#00D09C]/30 shadow-md' 
                        : isDark ? 'bg-slate-950/20 border-white/5 opacity-60' : 'bg-slate-100/50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${trade.status === 'ACTIVE' ? 'bg-[#00D09C] animate-pulse' : 'bg-slate-500'}`} />
                            <h3 className="font-bold text-lg tracking-tight">{trade.pair}</h3>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              trade.type === 'LONG' 
                                ? 'bg-emerald-500/15 text-emerald-400' 
                                : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {trade.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">{trade.algorithm}</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              trade.riskLevel === 'High' 
                                ? 'bg-rose-500/10 text-rose-400' 
                                : trade.riskLevel === 'Medium' 
                                  ? 'bg-amber-500/10 text-amber-400' 
                                  : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {trade.riskLevel} Risk
                            </span>
                          </div>
                        </div>

                        {/* Financial metrics column */}
                        <div className="grid grid-cols-3 sm:grid-cols-1 text-left sm:text-right gap-4 sm:gap-1">
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Live Position ROI</p>
                            <p className={`font-mono font-black text-lg ${trade.pnl >= 0 ? 'text-[#00D09C]' : 'text-[#FF6B6B]'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{trade.pnl}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Value</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                              ${trade.allocatedCapital.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Explainability / Rationale preview */}
                      <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${isDark ? 'bg-black/30 text-slate-300' : 'bg-slate-50 text-slate-600'} border ${borderColor} mb-4`}>
                        <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">
                          <Bot className="w-3.5 h-3.5 text-[#00D09C]" />
                          <span>Neural Assessment / Action Rationale</span>
                        </div>
                        {trade.rationale}
                      </div>

                      {/* Controls strip */}
                      <div className="flex items-center justify-between pt-3.5 border-t border-slate-200/20 dark:border-white/5">
                        <button
                          onClick={() => setSelectedTradeLogsId(isSelectedForLogs ? null : trade.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelectedForLogs 
                              ? 'bg-[#00D09C]/15 text-[#00D09C]' 
                              : 'bg-white/5 hover:bg-white/10 text-slate-400'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Audit Trail</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleTradeStatus(trade.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              trade.status === 'ACTIVE' 
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {trade.status === 'ACTIVE' ? (
                              <>
                                <Square className="w-3 h-3 fill-amber-400/80" />
                                <span>Halt Automation</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-emerald-400/80" />
                                <span>Resume</span>
                              </>
                            )}
                          </button>

                          <button 
                            onClick={() => closeTrade(trade.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs transition-all cursor-pointer"
                          >
                            Liquidate
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Audit Log */}
                    <AnimatePresence>
                      {isSelectedForLogs && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-200/20 dark:border-white/5 bg-black/40"
                        >
                          <div className="p-4 font-mono text-[10px] space-y-1.5 text-slate-300">
                            <p className="text-slate-500 border-b border-white/5 pb-1.5 mb-2.5 flex justify-between items-center font-sans font-bold uppercase tracking-widest text-[8px]">
                              <span>Neural Live Activity Terminal</span>
                              <span className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#00D09C] animate-ping" />
                                Sentinel streams online
                              </span>
                            </p>
                            <div><span className="text-[#00D09C]/70 mr-1.5">❯</span> [ID: {trade.id}] Entry Execution Price: {trade.pair.split('/')[1]} {trade.entryPrice.toLocaleString()}</div>
                            <div><span className="text-[#00D09C]/70 mr-1.5">❯</span> Sentinel active on -{drawdownStopLimit}% hard drawdown trailing safeguard limit.</div>
                            <div><span className="text-[#00D09C]/70 mr-1.5">❯</span> Current Position Valuation: ${trade.allocatedCapital.toLocaleString()} • Delta value: {trade.pnl >= 0 ? '+' : ''}${(trade.allocatedCapital * (trade.pnl / 100)).toFixed(2)}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Opportunities Scanned Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Scanned Opportunities
            </h2>
            <span className="text-[9px] font-mono font-bold text-[#00D09C] bg-[#00D09C]/10 px-2 py-0.5 rounded-md uppercase animate-pulse">
              Live Feed
            </span>
          </div>

          <div className="space-y-3.5">
            {pendingSignals.map((sig) => (
              <div 
                key={sig.id}
                className={`rounded-2xl p-4.5 border space-y-3.5 ${
                  isDark ? 'bg-slate-900/40 border-white/5 hover:border-white/10' : 'bg-white border-slate-200/60 hover:shadow-md'
                } transition-all`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{sig.pair}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                        sig.direction === 'LONG' 
                          ? 'bg-emerald-500/15 text-emerald-500' 
                          : 'bg-rose-500/15 text-rose-500'
                      }`}>
                        {sig.direction}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{sig.algorithm}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#00D09C] bg-[#00D09C]/10 px-2 py-0.5 rounded-lg font-mono">
                      {sig.confidence}% Confidence
                    </span>
                  </div>
                </div>

                {/* Explainability details */}
                <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
                  {sig.rationale}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5">
                  <div>Target Price: <span className="font-bold text-slate-200">${sig.targetPrice}</span></div>
                  <div>Stop Loss: <span className="font-bold text-rose-400">${sig.stopLoss}</span></div>
                </div>

                {/* Confirm & Execute Actions */}
                <button
                  onClick={() => deployPendingSignal(sig)}
                  className={`w-full py-2 ${
                    sig.direction === 'LONG' 
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                  } rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer text-center`}
                >
                  Confirm & Deploy Allocation
                </button>
              </div>
            ))}

            {pendingSignals.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                All anomalies compiled. Monitoring global order books for fresh signals.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Terminal Console */}
      <div className={`rounded-2xl border ${borderColor} ${cardClasses} overflow-hidden`}>
        <div className="bg-black/50 p-4 border-b border-slate-200/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00D09C]" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Neural Activity & System Audit Trail
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#00D09C] bg-[#00D09C]/15 px-2 py-0.5 rounded">
            Live Streaming
          </span>
        </div>
        <div className="p-4 bg-black/35 font-mono text-[10px] text-slate-300 space-y-1.5 max-h-[150px] overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="truncate">
              <span className="text-[#00D09C] mr-2">❯</span>
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* Deploy Agent Bottom Sheet Modal */}
      <AnimatePresence>
        {customDeployOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomDeployOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Bottom Sheet Card */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative w-full max-w-md ${isDark ? 'bg-[#0b0f19] border-t border-white/10' : 'bg-white border-t border-slate-200'} rounded-t-[28px] p-6 pb-10 z-10 shadow-2xl overflow-hidden`}
            >
              {/* Handle */}
              <div className="w-12 h-1 bg-slate-500/35 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#00D09C]/10 text-[#00D09C] rounded-lg">
                    <Bot className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Deploy Custom Copilot Trade</h3>
                </div>
                <button 
                  onClick={() => setCustomDeployOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Asset Select */}
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest block mb-1.5">Trading Asset</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AVR/USDT'].map((pair) => (
                      <button
                        key={pair}
                        onClick={() => setDeployPair(pair)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          deployPair === pair 
                            ? 'bg-[#00D09C]/15 border-[#00D09C] text-[#00D09C]' 
                            : 'bg-white/5 border-white/5 text-slate-400'
                        }`}
                      >
                        {pair.split('/')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direction Toggle */}
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest block mb-1.5">Trade Direction</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
                    {['LONG', 'SHORT'].map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setDeployType(dir as any)}
                        className={`py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          deployType === dir 
                            ? dir === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Strategy Algorithm select */}
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest block mb-1.5">Core Algorithm</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['VWAP Reversion', 'Trend Momentum', 'Delta Hedge'].map((algo) => (
                      <button
                        key={algo}
                        onClick={() => setDeployAlgo(algo)}
                        className={`py-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          deployAlgo === algo 
                            ? 'bg-[#00D09C]/15 border-[#00D09C] text-[#00D09C]' 
                            : 'bg-white/5 border-white/5 text-slate-400'
                        }`}
                      >
                        {algo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Setting */}
                <div>
                  <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest block mb-1.5">Risk Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Low', 'Medium', 'High'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setDeployRisk(r)}
                        className={`py-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          deployRisk === r 
                            ? r === 'Low' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : r === 'Medium' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-rose-500/10 border-rose-500 text-rose-400'
                            : 'bg-white/5 border-white/5 text-slate-400'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allocated Capital */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest block">Allocated Capital ($)</label>
                    <span className="text-[10px] font-mono text-[#00D09C]">Available: ${availableBalance.toLocaleString()}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">$</span>
                    <input 
                      type="number"
                      value={deployCapital}
                      onChange={(e) => setDeployCapital(e.target.value)}
                      className="w-full pl-7 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#00D09C] focus:ring-1 focus:ring-[#00D09C]"
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={deployCustomTrade}
                  className="w-full py-3 bg-[#00D09C] hover:bg-[#00B585] text-black text-sm font-black rounded-xl transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Initiate Copilot Strategy</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
