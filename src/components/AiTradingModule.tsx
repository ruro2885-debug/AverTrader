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
import AiSettingsView from './ai/AiSettingsView';

type AiView = 'HOME' | 'CONFIGS' | 'SESSIONS' | 'SCANNER' | 'RECOMMENDATIONS' | 'TRADES' | 'HISTORY' | 'PERFORMANCE' | 'NOTIFICATIONS' | 'SETTINGS';
type EngineState = 'IDLE' | 'PREPARING' | 'LOADING_CONFIG' | 'SYNC_USER' | 'SYNC_MARKET' | 'SCANNING' | 'ANALYZING' | 'GENERATING' | 'WAITING_DECISION' | 'MONITORING' | 'PAUSED' | 'STOPPED' | 'ERROR';

export default function AiTradingModule({ theme, onOpenDeposit }: { theme: 'light' | 'dark', onOpenDeposit: () => void }) {
  const { user, updateProfile, addNotification } = useAuth();
  const { activeTradingBalance, addFundsToActiveBalance, activeBalanceOffset, tokenBalance } = useFinancials();
  const { preferences, formatCurrency } = usePreferences();
  const { 
    configs, 
    config, 
    activeConfigId,
    session, 
    trades, 
    activity: engineActivity, 
    recommendations,
    loading: engineLoading,
    startSession, 
    endSession, 
    saveConfiguration, 
    deleteConfiguration, 
    duplicateConfiguration, 
    activateConfiguration,
    liveTradePrices 
  } = useContext(TradingEngineContext);
  const isDark = theme === 'dark';

  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false);

  // Navigation state (restored from localStorage)
  const [activeView, setActiveView] = useState<AiView>(() => {
    const saved = safeStorage.getItem('aver_ai_active_view');
    return (saved as AiView) || 'HOME';
  });

  const activeTrades = useMemo(() => trades.filter(t => t.status === 'OPEN'), [trades]);
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  const [loading, setLoading] = useState(false);

  const enrichedActiveTrades = useMemo(() => activeTrades.map(trade => {
    const livePrice = liveTradePrices[trade.id] || trade.currentPrice || trade.entry;
    const pnl = (livePrice - trade.entry) * trade.quantity;
    const pnlPercent = ((livePrice - trade.entry) / trade.entry) * 100;
    return { 
      ...trade, 
      currentPrice: livePrice,
      pnl,
      pnlPercent
    };
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

  

  // High-frequency live UI ticker states
  const [microVariance, setMicroVariance] = useState(0);
  const [nodeLoad, setNodeLoad] = useState(0);
  const [activeNodesCount, setActiveNodesCount] = useState(0);

  const closedTradesPnL = useMemo(() => {
    // Prioritize synchronized Firestore data for absolute persistence across sessions
    if (user?.portfolio?.todayPnL !== undefined) {
      return user.portfolio.todayPnL;
    }
    
    // Fallback to trades array if available
    const fromTrades = trades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.pnl || 0), 0);
    if (fromTrades !== 0) return fromTrades;
    
    if (user?.totalProfit !== undefined || user?.totalLoss !== undefined) {
      return (user?.totalProfit || 0) - (user?.totalLoss || 0);
    }
    return 0;
  }, [trades, user]);

  const rawTotalPnlAmount = closedTradesPnL + totalFloatingPnl;
  const baseCapital = useMemo(() => {
    // Priority: Session start capital (for accurate ROI from session start), then current balance
    if (session?.initialCapital && session.initialCapital > 0) return session.initialCapital;
    
    const base = user?.portfolioBalance || user?.portfolio?.totalValue || 0;
    return base > 0 ? base : 100;
  }, [user, session]);
  const rawTotalPnlPercent = (rawTotalPnlAmount / (baseCapital || 1)) * 100;

  const hasInsufficientFunds = (tokenBalance !== undefined ? tokenBalance <= 0 : activeTradingBalance <= 0);
  const isSessionActive = session?.status === 'ACTIVE';

  const displayAllocatedRatio = useMemo(() => {
    if (!config || !tokenBalance) return 0;
    // If session is active, we show the actual allocation ratio from when it started
    const allocated = session?.initialCapital || config.sessionSetup.amountToAllocate;
    return (allocated / tokenBalance) * 100;
  }, [config, tokenBalance, session]);
  
  const displayTradingCapital = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      return session.tradingCapital;
    }
    // When idle, show the configured target allocation from the active/selected config
    return config?.sessionSetup?.amountToAllocate || 0;
  }, [session, config]);

  const displayPnlAmount = useMemo(() => {
    if (session?.status === 'ACTIVE') {
      return session.totalProfit - session.totalLoss + totalFloatingPnl;
    }
    return 0; // Don't show P/L when no session is active
  }, [session, totalFloatingPnl]);

  const displayPnlPercent = useMemo(() => {
    if (session?.status === 'ACTIVE' && session.initialCapital > 0) {
      return (displayPnlAmount / session.initialCapital) * 100;
    }
    return 0;
  }, [session, displayPnlAmount]);

  const displayCpuUsage = !isSessionActive ? 0 : cpuUsage;
  const displayMemoryUsage = !isSessionActive ? 0 : memoryUsage;
  const displayNeuralCycles = !isSessionActive ? 0 : neuralCycles;
  const displayEngineState = !isSessionActive ? 'IDLE' : engineState;
  const displayThinkingIdea = !isSessionActive 
    ? (hasInsufficientFunds ? 'Insufficient funds. Deposit funds to start AI trading.' : 'Neural core offline. Standby for market sync...') 
    : liveThinkingIdea;

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

  // Telemetry and UI Micro-Fluctuations Simulation Loop (1000ms updates)
  useEffect(() => {
    if (engineLoading) return;
    
    if (!session || session.status !== 'ACTIVE') {
      setCpuUsage(0);
      setMemoryUsage(0);
      setNeuralCycles(0);
      setMicroVariance(0);
      setNodeLoad(0);
      setActiveNodesCount(0);
      return;
    }

    const interval = setInterval(() => {
      setCpuUsage(() => {
        const target = activeTrades.length > 0 ? 45 + (activeTrades.length * 2.5) : 15;
        return parseFloat(Math.min(99, target).toFixed(1));
      });

      setMemoryUsage(() => {
        const target = activeTrades.length > 0 ? 1420 + (activeTrades.length * 50) : 500;
        return Math.min(4000, target);
      });
      
      setNeuralCycles(prev => prev + (activeTrades.length > 0 ? 3 : 1));
      
      setMicroVariance(0);
      setNodeLoad(98.5);
      
      setActiveNodesCount(Math.floor(12));
    }, 1000);

    return () => clearInterval(interval);
  }, [session, activeTrades.length]);

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

    const currentTokenBalance = tokenBalance !== undefined ? tokenBalance : activeTradingBalance;
    if (currentTokenBalance <= 0) {
      addNotification('trading', 'high', 'Insufficient Funds', 'Insufficient funds. Deposit funds before starting an AI trading session.');
      setShowInsufficientFundsModal(true);
      return;
    }
    
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
      addActivityEvent('INFO', `Establishing live feed for ${activeConfig.aiTradingRules.assetSelection.length} configured markets...`);

      // 5. Actually start the session in the backend context
      await startSession(activeConfig.id, activeConfig.aiTradingRules.assetSelection);
      
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
    const nextMarkets = activeConfig.aiTradingRules.assetSelection.includes(symbol)
      ? activeConfig.aiTradingRules.assetSelection.filter(m => m !== symbol)
      : [...activeConfig.aiTradingRules.assetSelection, symbol];
    const updated = {
      ...activeConfig,
      aiTradingRules: {
        ...activeConfig.aiTradingRules,
        assetSelection: nextMarkets
      }
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
      setLiveAssetStates({
        BTC: 'Offline',
        ETH: 'Offline',
        SOL: 'Offline',
        AAPL: 'Offline',
        NVDA: 'Offline',
        TSLA: 'Offline'
      });
      return;
    }

    const activeConfig = configs.find(c => c.id === activeConfigId) || configs[0];
    if (!activeConfig) return;

    setEngineState('SCANNING');

    // 1. STAGGERED ASSET STATE & THINKING ROTATOR (Every 4 seconds)
    const rotationInterval = setInterval(() => {
      // Rotate active asset states randomly
      setLiveAssetStates(prev => {
        const next = { ...prev };
        const markets = activeConfig.aiTradingRules.assetSelection || ['BTC', 'ETH', 'SOL'];
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
      clearInterval(rotationInterval);
    };
  }, [session?.status, session?.id, activeConfigId, user?.uid, activeTrades.length, configs.length]);

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
                    disabled={hasInsufficientFunds}
                  />

                  {/* CPU / MEM Telemetry metrics */}
                  <div className="flex gap-4 p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/5 text-[11px] font-mono w-full md:w-auto">
                    <div>
                      <span className={textSecondary}>ENGINE STATUS</span>
                      <p className={`font-black uppercase mt-1 ${
                        displayEngineState === 'SCANNING' || displayEngineState === 'MONITORING' ? 'text-[#00D09C]' :
                        displayEngineState === 'ANALYZING' || displayEngineState === 'GENERATING' ? 'text-amber-500' :
                        displayEngineState === 'WAITING_DECISION' ? 'text-blue-500' : 'text-slate-500'
                      }`}>{displayEngineState.replace('_', ' ')}</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>NEURAL CPU</span>
                      <p className={`font-black text-white mt-1`}>{displayCpuUsage}%</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>MEMORY</span>
                      <p className={`font-black text-white mt-1`}>{displayMemoryUsage}MB</p>
                    </div>
                    <div className="w-px bg-white/5 self-stretch" />
                    <div>
                      <span className={textSecondary}>CYCLES</span>
                      <p className={`font-black text-white mt-1`}>{displayNeuralCycles}</p>
                    </div>
                  </div>
                </div>

                {/* AI Trading Capital Command Center Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Card 1: Trading Capital */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px] transition-all`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>{isSessionActive ? 'Active Trading Capital' : 'Configured Allocation'}</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight font-mono`}>
                        ${displayTradingCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                      <p className={`text-[9px] font-mono mt-1 flex items-center gap-1 ${isSessionActive ? 'text-[#00D09C]' : 'text-amber-500'}`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSessionActive ? 'bg-[#00D09C]' : 'bg-amber-500'} opacity-75`}></span>
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSessionActive ? 'bg-[#00D09C]' : 'bg-amber-500'}`}></span>
                        </span>
                        {isSessionActive ? 'Isolated Session Fund' : 'Target Setup Ready'}
                      </p>
                    </div>
                  </div>




                  {/* Card: Total Positions Held */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Total Positions Held</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight font-mono`}>
                        {activeTrades.length}
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 font-black">
                        {isSessionActive ? `Scanning ${config?.aiTradingRules?.assetSelection?.length || 3} Pairs` : 'Engine Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Card 4: Allocated Ratio */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Allocated Ratio</span>
                    <div>
                      <h4 className={`${textPrimary} text-lg font-black tracking-tight font-mono`}>
                        {displayAllocatedRatio.toFixed(2)}%
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        {isSessionActive ? 'Active Nodes Engaged' : 'Standby Core Engaged'}
                      </p>
                    </div>
                  </div>



                  {/* Card 6: Daily P/L */}
                  <div className={`p-4 rounded-2xl border ${cardClasses} flex flex-col justify-between min-h-[100px]`}>
                    <span className={`${textSecondary} text-[10px] font-black uppercase tracking-wider`}>Daily P/L</span>
                    <div>
                      <h4 className={`text-lg font-black tracking-tight font-mono ${displayPnlPercent >= 0 ? 'text-[#00D09C]' : 'text-red-500'}`}>
                        {displayPnlPercent >= 0 ? '+' : ''}{displayPnlPercent.toFixed(4)}%
                      </h4>
                      <p className="text-[9px] font-mono text-slate-400 mt-1 font-black">
                        {displayPnlAmount >= 0 ? '+' : ''}${displayPnlAmount.toFixed(2)} Today
                      </p>
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
                          key={displayThinkingIdea}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className={`text-xs font-mono font-black ${hasInsufficientFunds ? 'text-red-400' : textPrimary} block mt-0.5`}
                        >
                          {displayThinkingIdea}
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
                      isSessionActive={isSessionActive}
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
                userId={user?.uid || 'guest_user'}
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
                monitoredMarkets={configs.find(c => c.id === activeConfigId)?.aiTradingRules.assetSelection || []}
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
                  isSessionActive={isSessionActive}
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
              <AiPerformanceHub 
                isDark={isDark} 
                trades={trades} 
                recommendations={recommendations} 
                isSessionActive={isSessionActive}
              />
            )}

            {activeView === 'NOTIFICATIONS' && (
              <div className="space-y-4">
                <h2 className={`text-xl font-black ${textPrimary} mb-2`}>Neural Activity Alerts</h2>
                <AiActivityLog events={activityEvents} isDark={isDark} />
              </div>
            )}

            {activeView === 'SETTINGS' && (
              <AiSettingsView 
                config={config} 
                onSaveConfig={saveConfiguration} 
                isDark={isDark} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Insufficient Funds Modal */}
      <AnimatePresence>
        {showInsufficientFundsModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.95 }}
              className={`max-w-sm w-full rounded-3xl p-8 border ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Insufficient Funds</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
                Insufficient funds. Deposit funds before starting an AI trading session.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowInsufficientFundsModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowInsufficientFundsModal(false);
                    onOpenDeposit();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-[#00D09C] hover:bg-[#00b387] text-black transition-all"
                >
                  Deposit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
