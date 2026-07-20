import React, { useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useFinancials } from '../hooks/useFinancials';
import { TradingEngineContext } from '../contexts/TradingEngineContext';
import { 
  Zap, 
  Sliders, 
  Calendar, 
  Search, 
  Briefcase, 
  History as HistoryIcon, 
  BarChart3, 
  Bell, 
  Settings as SettingsIcon,
  Activity, 
  Cpu,
  Globe,
  Radio,
  Clock,
  Shield,
  HelpCircle,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiTradingService } from '../services/aiTradingService';
import { db } from '../lib/firebase';
import { safeStorage } from '../utils/storage';
import { 
  AiSession, 
  AiRecommendation, 
  AiTrade, 
  AiConfiguration,
  TradingSchedule
} from '../types/aiTrading';
import { Timestamp, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

// Sub-components
import AiWorkspaceHeader from './ai/AiWorkspaceHeader';
import AiDiscoveryPanel from './ai/AiDiscoveryPanel';
import AiRecommendationList from './ai/AiRecommendationList';
import AiTradeCenter from './ai/AiTradeCenter';
import AiPerformanceHub from './ai/AiPerformanceHub';
import AiConfigurationsView from './ai/AiConfigurationsView';
import AiSessionsView from './ai/AiSessionsView';
import AiMarketScannerView from './ai/AiMarketScannerView';
import AiActivityLog, { ActivityEvent } from './ai/AiActivityLog';

type AiView = 'HOME' | 'CONFIGS' | 'SESSIONS' | 'SCANNER' | 'RECOMMENDATIONS' | 'TRADES' | 'HISTORY' | 'PERFORMANCE' | 'NOTIFICATIONS' | 'SETTINGS';
type EngineState = 'IDLE' | 'PREPARING' | 'LOADING_CONFIG' | 'SYNC_USER' | 'SYNC_MARKET' | 'SCANNING' | 'ANALYZING' | 'GENERATING' | 'WAITING_DECISION' | 'MONITORING' | 'PAUSED' | 'STOPPED' | 'ERROR';

export default function AiTradingModule({ theme }: { theme: 'light' | 'dark' }) {
  const { user, updateProfile, addNotification } = useAuth();
  const { activeTradingBalance, addFundsToActiveBalance, activeBalanceOffset } = useFinancials();
  const { preferences, formatCurrency } = usePreferences();
  const { 
    configs, 
    config, 
    activeConfigId,
    session, 
    trades, 
    activity: engineActivity, 
    recommendations,
    startSession, 
    endSession, 
    saveConfiguration, 
    deleteConfiguration, 
    duplicateConfiguration, 
    activateConfiguration,
    liveTradePrices 
  } = useContext(TradingEngineContext);
  const isDark = theme === 'dark';

  // Navigation state (restored from localStorage)
  const [activeView, setActiveView] = useState<AiView>(() => {
    const saved = safeStorage.getItem('aver_ai_active_view');
    return (saved as AiView) || 'HOME';
  });

  const activeTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const [loading, setLoading] = useState(false);

  const enrichedActiveTrades = useMemo(() => activeTrades.map(trade => {
    const livePrice = liveTradePrices[trade.id];
    if (livePrice) {
      const pnl = (livePrice - trade.entry) * trade.quantity;
      const pnlPercent = ((livePrice - trade.entry) / trade.entry) * 100;
      return { 
        ...trade, 
        currentPrice: livePrice,
        pnl,
        pnlPercent
      };
    }
    return trade;
  }), [activeTrades, liveTradePrices]);

  const totalFloatingPnl = useMemo(() => enrichedActiveTrades.reduce((sum, t) => sum + (t.pnl || 0), 0), [enrichedActiveTrades]);

  useEffect(() => {
    console.log("[AiTradingModule] Stats update: activeTradingBalance=", activeTradingBalance, "totalFloatingPnl=", totalFloatingPnl);
  }, [activeTradingBalance, totalFloatingPnl]);

  // Live simulation and thinking engine states
  const [liveAssetStates, setLiveAssetStates] = useState<Record<string, string>>({
    BTC: 'Ready',
    ETH: 'Ready',
    SOL: 'Ready',
    AAPL: 'Ready',
    NVDA: 'Ready',
    TSLA: 'Ready'
  });
  const [liveThinkingIdea, setLiveThinkingIdea] = useState('Neural core online. Standby for market sync...');

  // Central State Engine Telemetry
  const [engineState, setEngineState] = useState<EngineState>('IDLE');
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [cpuUsage, setCpuUsage] = useState(2.4);
  const [memoryUsage, setMemoryUsage] = useState(412);
  const [neuralCycles, setNeuralCycles] = useState(0);

  const totalPnlAmount = activeBalanceOffset + totalFloatingPnl;
  const initialCapital = 100000;
  const totalPnlPercent = (totalPnlAmount / initialCapital) * 100;

  // Layout helpers
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';

  // Event logger helper
  const addActivityEvent = useCallback((type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT', message: string, source = 'NEURAL_ENGINE') => {
    const newEvent: ActivityEvent = {
      id: `ev_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      source
    };
    setActivityEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, []);

  // Merge contextual engine activity into local log display
  useEffect(() => {
    if (engineActivity && engineActivity.length > 0) {
      setActivityEvents(prev => {
        const combined = [...prev];
        engineActivity.forEach(engAct => {
          if (!combined.some(c => c.id === engAct.id)) {
            const rawTimestamp: any = engAct.timestamp;
            const timestampStr = rawTimestamp 
              ? (rawTimestamp.toDate 
                  ? rawTimestamp.toDate().toLocaleTimeString() 
                  : new Date(rawTimestamp).toLocaleTimeString()) 
              : new Date().toLocaleTimeString();
            combined.push({
              id: engAct.id,
              timestamp: timestampStr,
              type: (engAct.type === 'TP_HIT' || engAct.type === 'SL_HIT' || engAct.type === 'SUCCESS') ? 'SUCCESS' : engAct.type === 'COPY_TRADE' ? 'ALERT' : 'INFO',
              message: engAct.message,
              source: 'NEURAL_ENGINE'
            });
          }
        });
        // Sort by id / age descending
        return combined.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 50);
      });
    }
  }, [engineActivity]);

  // Save active tab preference
  useEffect(() => {
    safeStorage.setItem('aver_ai_active_view', activeView);
  }, [activeView]);

  // Telemetry simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const delta = (Math.random() - 0.5) * 5;
        const target = session?.status === 'ACTIVE' ? 45 : 4.2;
        const next = prev + (target - prev) * 0.15 + delta;
        return parseFloat(Math.max(1, Math.min(99, next)).toFixed(1));
      });
      setMemoryUsage(prev => {
        const delta = Math.floor((Math.random() - 0.5) * 10);
        const target = session?.status === 'ACTIVE' ? 1420 : 380;
        const next = prev + (target - prev) * 0.05 + delta;
        return Math.max(100, Math.min(4000, next));
      });
      if (session?.status === 'ACTIVE') {
        setNeuralCycles(prev => prev + Math.floor(Math.random() * 8 + 1));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [session]);

  const [showOpportunityDesk, setShowOpportunityDesk] = useState(true);

  // Sync engineState with session status
  useEffect(() => {
    if (session?.status === 'ACTIVE') {
      setEngineState('SCANNING');
    } else {
      setEngineState('IDLE');
    }
  }, [session]);

  // Session Management
  const handleStartSession = async () => {
    if (!user) return;
    
    // 1. Initializing State
    setEngineState('PREPARING');
    addActivityEvent('INFO', 'Neural core initializing. Checking system integrity...');
    
    try {
      const activeConfig = configs.find(c => c.id === activeConfigId) || configs[0];
      if (!activeConfig) throw new Error("No configuration available.");

      // 2. Loading Config State
      await new Promise(resolve => setTimeout(resolve, 800));
      setEngineState('LOADING_CONFIG');
      addActivityEvent('INFO', `Loading parameters from "${activeConfig.name}" profile...`);
      
      // 3. Sync User State
      await new Promise(resolve => setTimeout(resolve, 600));
      setEngineState('SYNC_USER');
      addActivityEvent('INFO', 'Synchronizing user risk profile and equity balance...');

      // 4. Sync Market State (Scanning only configured markets)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEngineState('SYNC_MARKET');
      addActivityEvent('INFO', `Establishing live feed for ${activeConfig.markets.length} configured markets...`);

      // 5. Actually start the session in the backend context
      await startSession(activeConfig.id, activeConfig.markets);
      
      // 6. Transition to Active Scanning
      await new Promise(resolve => setTimeout(resolve, 800));
      setEngineState('SCANNING');
      
      addActivityEvent('SUCCESS', `AI Session online. Executing "${activeConfig.strategy.replace('_', ' ')}" strategy.`);
      addNotification('trading', 'medium', 'AI Session Started', 'Neural analysis engine is now scanning selected markets.');
      
      // Navigate to Recommendations if they exist or stay home
      if (activeView === 'CONFIGS') setActiveView('HOME');

    } catch (error: any) {
      setEngineState('ERROR');
      addActivityEvent('WARNING', `Critical initialization failure: ${error.message || 'Unknown error'}`);
      addNotification('trading', 'high', 'Session Failed', 'Could not initialize AI session.');
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    setEngineState('STOPPED');
    addActivityEvent('INFO', 'Powering down neural modules...');
    try {
      await endSession();
      setEngineState('IDLE');
      addActivityEvent('SUCCESS', 'Neural analysis engine has been safely shut down.');
      addNotification('trading', 'medium', 'AI Session Ended', 'Neural analysis engine has been powered down.');
    } catch (error) {
      setEngineState('ERROR');
      addActivityEvent('WARNING', 'Error occurred during termination cycle.');
      addNotification('trading', 'high', 'Error', 'Failed to stop session cleanly.');
    }
  };

  // Configurations Management Callbacks
  const handleSaveConfig = async (updatedConfig: AiConfiguration) => {
    if (!user) return;
    try {
      setLoading(true);
      await saveConfiguration(updatedConfig);
      addActivityEvent('SUCCESS', `Configuration "${updatedConfig.name}" saved and synchronized.`);
      if (session?.status === 'ACTIVE' && (updatedConfig.id === activeConfigId)) {
        addActivityEvent('INFO', 'Active session parameters updated in real-time.');
      }
    } catch (error) {
      addActivityEvent('WARNING', `Failed to persist configuration "${updatedConfig.name}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await deleteConfiguration(configId);
      addActivityEvent('INFO', 'Configuration permanently purged.');
    } catch (error) {
      addActivityEvent('WARNING', 'Could not delete configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateConfig = async (configId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await duplicateConfiguration(configId);
      addActivityEvent('SUCCESS', `Configuration duplicated.`);
    } catch (error) {
      addActivityEvent('WARNING', 'Could not duplicate configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateConfig = async (configId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      await activateConfiguration(configId);
      addActivityEvent('SUCCESS', 'Target configuration activated.');
    } catch (error) {
      addActivityEvent('WARNING', 'Failed to activate configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (newSchedule: TradingSchedule) => {
    const activeConfig = configs.find(c => c.id === activeConfigId);
    if (!activeConfig) return;
    const updated = {
      ...activeConfig,
      schedule: newSchedule
    };
    await handleSaveConfig(updated);
  };

  const handleToggleMarket = async (symbol: string) => {
    const activeConfig = configs.find(c => c.id === activeConfigId);
    if (!activeConfig) return;
    const nextMarkets = activeConfig.markets.includes(symbol)
      ? activeConfig.markets.filter(m => m !== symbol)
      : [...activeConfig.markets, symbol];
    const updated = {
      ...activeConfig,
      markets: nextMarkets
    };
    await handleSaveConfig(updated);
  };

  // --- CONSTANTS FOR NEURAL CORE SIMULATION ---
  const THINKING_IDEAS = [
    "Analyzing order book imbalances on major institutional feeds...",
    "Evaluating multi-interval MACD divergence for trend confirmation...",
    "Running Monte Carlo stress tests against current position risk metrics...",
    "Correlating social sentiment momentum with dynamic volume profiles...",
    "Calculating 14-period ATR bands to adjust trailing-stop triggers...",
    "Verifying liquidity depth across digital asset exchanges...",
    "Monitoring whale wallet flows for high-volume entry signals...",
    "Calibrating neural momentum parameters to volatile asset feeds...",
    "Analyzing options delta hedging behaviors on crypto-indexes...",
    "Filtering out localized high-frequency wash trading activity..."
  ];

  const ASSET_STATE_CYCLES = [
    "Scanning...",
    "Analyzing...",
    "Opportunity Found",
    "Entering Trade",
    "Managing",
    "Closed",
    "Ready Again"
  ];

  // Simulated live loop for real-time visual telemetry and neural engine stats
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE' || !user) {
      setEngineState('IDLE');
      return;
    }

    const activeConfig = configs.find(c => c.id === activeConfigId) || configs[0];
    if (!activeConfig) return;

    setEngineState('SCANNING');

    // 1. TELEMETRY & STATS UPDATER (Every 1.5 seconds)
    const telemetryInterval = setInterval(() => {
      setCpuUsage(prev => {
        const target = activeTrades.length > 0 ? 68.4 : 32.1;
        const delta = (Math.random() - 0.5) * 6;
        return parseFloat(Math.max(1, Math.min(99, prev + (target - prev) * 0.12 + delta)).toFixed(1));
      });

      setMemoryUsage(prev => {
        const target = activeTrades.length > 0 ? 512.6 : 389.2;
        const delta = (Math.random() - 0.5) * 8;
        return parseFloat(Math.max(100, Math.min(2048, prev + (target - prev) * 0.05 + delta)).toFixed(1));
      });

      setNeuralCycles(prev => prev + 1);
    }, 1500);

    // 2. STAGGERED ASSET STATE & THINKING ROTATOR (Every 4 seconds)
    const rotationInterval = setInterval(() => {
      // Rotate active asset states randomly
      setLiveAssetStates(prev => {
        const next = { ...prev };
        const markets = activeConfig.markets || ['BTC', 'ETH', 'SOL'];
        markets.forEach(asset => {
          const currentState = prev[asset] || 'Ready';
          const currentIndex = ASSET_STATE_CYCLES.indexOf(currentState);
          if (Math.random() > 0.6) {
            const nextIndex = (currentIndex + 1) % ASSET_STATE_CYCLES.length;
            next[asset] = ASSET_STATE_CYCLES[nextIndex];
          }
        });
        return next;
      });

      // Rotate thinking thoughts
      setLiveThinkingIdea(prev => {
        const index = Math.floor(Math.random() * THINKING_IDEAS.length);
        return THINKING_IDEAS[index];
      });

      // Update engine state based on active positions
      setEngineState(activeTrades.length > 0 ? 'MONITORING' : 'SCANNING');
    }, 4000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(rotationInterval);
    };
  }, [session, configs, activeConfigId, user, activeTrades]);

  const pendingRecommendations = recommendations.filter(r => r.status === 'PENDING');

  return (
    <div className="min-h-[85vh] flex flex-col lg:flex-row gap-6 py-6 font-sans">
      {/* Sidebar Sub-Navigation (Responsive desktop-first) */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-1 border-b lg:border-b-0 lg:border-r border-white/5 pr-0 lg:pr-4">
        <div className="flex flex-row lg:flex-col gap-1 w-full min-w-max lg:min-w-0">
          <SidebarButton 
            active={activeView === 'HOME'} 
            onClick={() => setActiveView('HOME')} 
            icon={<Cpu className="w-4 h-4" />} 
            label="Command Center" 
            badge={session?.status === 'ACTIVE' ? 'LIVE' : undefined}
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'CONFIGS'} 
            onClick={() => setActiveView('CONFIGS')} 
            icon={<Sliders className="w-4 h-4" />} 
            label="Configurations" 
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'SESSIONS'} 
            onClick={() => setActiveView('SESSIONS')} 
            icon={<Calendar className="w-4 h-4" />} 
            label="Sessions Schedule" 
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'SCANNER'} 
            onClick={() => setActiveView('SCANNER')} 
            icon={<Search className="w-4 h-4" />} 
            label="Market Scanner" 
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'TRADES'} 
            onClick={() => setActiveView('TRADES')} 
            icon={<Briefcase className="w-4 h-4" />} 
            label="Active Positions" 
            badge={activeTrades.length > 0 ? String(activeTrades.length) : undefined}
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'HISTORY'} 
            onClick={() => setActiveView('HISTORY')} 
            icon={<HistoryIcon className="w-4 h-4" />} 
            label="Trade History" 
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'PERFORMANCE'} 
            onClick={() => setActiveView('PERFORMANCE')} 
            icon={<BarChart3 className="w-4 h-4" />} 
            label="Performance Hub" 
            isDark={isDark}
          />
          <SidebarButton 
            active={activeView === 'NOTIFICATIONS'} 
            onClick={() => setActiveView('NOTIFICATIONS')} 
            icon={<Bell className="w-4 h-4" />} 
            label="System Alerts" 
            isDark={isDark}
          />
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeView === 'HOME' && (
              <div className="space-y-6">
                {/* Engine Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <AiWorkspaceHeader 
                    session={session} 
                    onStart={handleStartSession} 
                    onEnd={handleEndSession} 
                    isDark={isDark}
                    hasPrefs={configs.length > 0}
                  />

                  {/* CPU / MEM Telemetry metrics */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/5 text-[11px] font-mono w-full md:w-auto">
                    <div>
                      <span className={textSecondary}>ENGINE STATUS</span>
                      <p className={`font-black uppercase mt-1 ${
                        engineState === 'SCANNING' || engineState === 'MONITORING' ? 'text-[#00D09C]' :
                        engineState === 'ANALYZING' || engineState === 'GENERATING' ? 'text-amber-500' :
                        engineState === 'WAITING_DECISION' ? 'text-blue-500' : 'text-slate-500'
                      }`}>{engineState.replace('_', ' ')}</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>NEURAL CPU</span>
                      <p className={`font-black text-white mt-1`}>{cpuUsage}%</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>MEMORY</span>
                      <p className={`font-black text-white mt-1`}>{memoryUsage}MB</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>CYCLES</span>
                      <p className={`font-black text-white mt-1`}>{neuralCycles}</p>
                    </div>
                  </div>
                </div>

                {/* AI Trading Capital Command Center Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Card 1: Trading Capital */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Trading Capital</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight`}>
                        ${(activeTradingBalance + totalFloatingPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                      <p className="text-[9px] font-mono text-[#00D09C] mt-1">● Synced with Wallet</p>
                    </div>
                  </div>




                  {/* Card: Total Positions Held */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Total Positions Held</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight`}>
                        {config?.markets?.length || 0}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 font-black">Selected Index/Pairs</p>
                    </div>
                  </div>

                  {/* Card 4: Allocated Ratio */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Allocated Ratio</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight`}>
                        {session?.status === 'ACTIVE' ? '100.0%' : '0.0%'}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        {session?.status === 'ACTIVE' ? 'Engaged Nodes' : 'Engine Idle'}
                      </p>
                    </div>
                  </div>



                  {/* Card 6: Daily P/L */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Daily P/L</span>
                    <div>
                      <h4 className={`text-lg font-black tracking-tight ${totalPnlAmount >= 0 ? 'text-[#00D09C]' : 'text-red-500'}`}>
                        {totalPnlAmount >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 font-black">Performance Yield</p>
                    </div>
                  </div>
                </div>

                {/* Neural Core Decision Stream (AI Thinking Module) */}
                <div className={`p-4 rounded-2xl border ${cardClasses} flex items-center justify-between gap-4 overflow-hidden bg-gradient-to-r from-teal-500/5 to-transparent`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#00D09C]/10 text-[#00D09C] shrink-0 animate-pulse">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider block`}>
                        Neural Decision Engine (Think-Tank)
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={liveThinkingIdea}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className={`text-xs font-mono font-black ${textPrimary} block mt-0.5`}
                        >
                          {liveThinkingIdea}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500 whitespace-nowrap">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D09C] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D09C]"></span>
                    </span>
                    CORE AGENT LIVE
                  </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Main column */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Discovery engine panel */}
                    <AiDiscoveryPanel 
                      session={session} 
                      config={config}
                      recommendations={recommendations}
                      isDark={isDark}
                      liveStates={liveAssetStates}
                    />
                  </div>

                  {/* Right side information widgets */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Active Trades Center */}
                    <AiTradeCenter 
                      trades={enrichedActiveTrades}
                      isDark={isDark}
                      monitoredMarkets={config?.markets || []}
                    />

                    {/* Diagnostics and Activity Log */}
                    <AiActivityLog 
                      events={activityEvents.slice(0, 5)} 
                      isDark={isDark} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeView === 'CONFIGS' && (
              <AiConfigurationsView 
                configs={configs}
                activeConfigId={activeConfigId}
                onSave={handleSaveConfig}
                onDelete={handleDeleteConfig}
                onDuplicate={handleDuplicateConfig}
                onActivate={handleActivateConfig}
                onStartSession={handleStartSession}
                isDark={isDark}
              />
            )}

            {activeView === 'SESSIONS' && (
              <AiSessionsView 
                schedule={configs.find(c => c.id === activeConfigId)?.schedule || configs[0]?.schedule || {
                  sessions: [{ start: '08:00', end: '16:00' }],
                  weekdays: true,
                  weekends: false,
                  timezone: 'UTC',
                  breakPeriods: [],
                  excludeHolidays: true
                }}
                onSaveSchedule={handleSaveSchedule}
                isDark={isDark}
              />
            )}

            {activeView === 'SCANNER' && (
              <AiMarketScannerView 
                monitoredMarkets={configs.find(c => c.id === activeConfigId)?.markets || []}
                onToggleMarket={handleToggleMarket}
                isDark={isDark}
              />
            )}

            {activeView === 'TRADES' && (
              <div className="space-y-4">
                <h2 className={`text-xl font-black ${textPrimary} mb-2`}>Active Execution Matrix</h2>
                <AiTradeCenter 
                  trades={enrichedActiveTrades}
                  isDark={isDark}
                  monitoredMarkets={config?.markets || []}
                />
              </div>
            )}

            {activeView === 'HISTORY' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className={`text-xl font-black ${textPrimary}`}>Closed Positions Log</h2>
                  <span className="text-[10px] font-mono bg-black/25 dark:bg-white/5 border border-slate-200/10 dark:border-white/10 text-slate-400 px-2 py-1 rounded-md">
                    {closedTrades.length} RECORDED EXECUTIONS
                  </span>
                </div>
                
                {closedTrades.length === 0 ? (
                  <div className={`rounded-2xl p-12 border ${cardClasses} text-center space-y-4`}>
                    <HistoryIcon className={`w-12 h-12 mx-auto ${textSecondary} opacity-20`} />
                    <div>
                      <h3 className={`text-lg font-black ${textPrimary}`}>Closed Positions Log</h3>
                      <p className={`text-xs ${textSecondary} mt-1`}>Historical authorized executions and finalized target returns will populate here dynamically.</p>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl border overflow-hidden ${cardClasses}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/5 dark:border-white/5 bg-slate-500/5 dark:bg-black/20 text-[10px] uppercase font-black tracking-wider text-slate-400">
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Entry Price</th>
                            <th className="px-6 py-4">Exit Price</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Realized P/L</th>
                            <th className="px-6 py-4 text-right">Closed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/5 dark:divide-white/5 text-xs font-mono text-slate-300">
                          {closedTrades.map((trade) => {
                            const pnl = (trade.exit || trade.entry) - trade.entry;
                            const totalPnl = pnl * trade.quantity;
                            const isProfit = totalPnl >= 0;
                            return (
                              <tr key={trade.id} className="hover:bg-slate-500/5 dark:hover:bg-white/2 transition-colors">
                                <td className="px-6 py-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isProfit ? 'bg-[#00D09C]' : 'bg-red-500'}`} />
                                  {trade.asset}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                    BUY
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">${trade.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">${(trade.exit || trade.entry).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{trade.quantity}</td>
                                <td className={`px-6 py-4 font-black ${isProfit ? 'text-[#00D09C]' : 'text-red-500'}`}>
                                  {isProfit ? '+' : ''}${totalPnl.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right text-[10px] text-slate-500">
                                  {trade.closedAt ? (trade.closedAt as any).toDate ? (trade.closedAt as any).toDate().toLocaleTimeString() : new Date(trade.closedAt as any).toLocaleTimeString() : 'N/A'}
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

            {activeView === 'PERFORMANCE' && (
              <AiPerformanceHub isDark={isDark} trades={trades} recommendations={recommendations} />
            )}

            {activeView === 'NOTIFICATIONS' && (
              <div className="space-y-4">
                <h2 className={`text-xl font-black ${textPrimary} mb-2`}>Neural Activity Alerts</h2>
                <AiActivityLog events={activityEvents} isDark={isDark} />
              </div>
            )}

            {activeView === 'SETTINGS' && (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h2 className={`text-xl font-black ${textPrimary}`}>Global AI Settings</h2>
                  <p className={`text-xs ${textSecondary} mt-1`}>Manage macro override rules, safety buffers, and risk triggers.</p>
                </div>

                <div className={`rounded-2xl border p-6 space-y-6 ${cardClasses}`}>
                  <div className="space-y-4">
                    <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary}`}>Macro Safety Breaks</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-black ${textPrimary}`}>Global Drawdown Halt</p>
                        <p className={`text-[10px] ${textSecondary}`}>Power down engine if daily portfolio loss exceeds 5%</p>
                      </div>
                      <button className="w-10 h-5 rounded-full relative bg-[#00D09C]">
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        <p className={`text-xs font-black ${textPrimary}`}>Asymmetric Drift Filter</p>
                        <p className={`text-[10px] ${textSecondary}`}>Ignore patterns when asset volatility spikes above 80%</p>
                      </div>
                      <button className="w-10 h-5 rounded-full relative bg-[#00D09C]">
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SidebarButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  badge, 
  isDark 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  badge?: string; 
  isDark: boolean 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black transition-all text-left relative whitespace-nowrap lg:whitespace-normal
        ${active 
          ? 'bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/30' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
        }
      `}
    >
      {icon}
      <span className="flex-1 pr-6">{label}</span>
      {badge && (
        <span className={`absolute right-3 px-1.5 py-0.5 rounded text-[8px] font-mono font-black ${
          badge === 'LIVE' ? 'bg-[#00D09C] text-black' : 'bg-[#00D09C]/15 text-[#00D09C]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
