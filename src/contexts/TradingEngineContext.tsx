import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useFinancials } from '../hooks/useFinancials';
import { AiConfiguration, AiTrade, AiSession, AiRecommendation, TradingSchedule } from '../types/aiTrading';
import { Position, ActivityEvent } from '../types/trading';
import { seedTraders, startTraderSimulator } from '../services/traderSimulator';
import { aiTradingService } from '../services/aiTradingService';

function isWithinSchedule(schedule?: TradingSchedule): boolean {
  if (!schedule) return true;
  
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const isWeekend = day === 0 || day === 6;
  const isWeekday = !isWeekend;
  
  if (isWeekend && !schedule.weekends) return false;
  if (isWeekday && !schedule.weekdays) return false;
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;
  
  if (schedule.sessions && schedule.sessions.length > 0) {
    const inWindow = schedule.sessions.some(s => {
      return currentTimeStr >= s.start && currentTimeStr <= s.end;
    });
    if (!inWindow) return false;
  }
  
  if (schedule.breakPeriods && schedule.breakPeriods.length > 0) {
    const inBreak = schedule.breakPeriods.some(b => {
      return currentTimeStr >= b.start && currentTimeStr <= b.end;
    });
    if (inBreak) return false;
  }
  
  return true;
}

interface TradingEngineContextType {
  configs: AiConfiguration[];
  config: AiConfiguration | null;
  activeConfigId: string | undefined;
  session: AiSession | null;
  positions: Position[];
  trades: AiTrade[];
  activity: ActivityEvent[];
  recommendations: AiRecommendation[];
  updateConfig: (newConfig: Partial<AiConfiguration>) => Promise<void>;
  logActivity: (type: string, message: string, metadata?: Record<string, any>) => Promise<void>;
  startSession: (configId: string, markets: string[]) => Promise<void>;
  endSession: () => Promise<void>;
  loading: boolean;
  liveTradePrices: Record<string, number>;
  saveConfiguration: (updatedConfig: AiConfiguration) => Promise<void>;
  deleteConfiguration: (configId: string) => Promise<void>;
  duplicateConfiguration: (configId: string) => Promise<void>;
  activateConfiguration: (configId: string) => Promise<void>;
  closeTrade: (tradeId: string, exitPrice: number, reason: AiTrade['reasonClosed']) => Promise<void>;
}

export const TradingEngineContext = createContext<TradingEngineContextType>({
  configs: [],
  config: null,
  activeConfigId: undefined,
  session: null,
  positions: [],
  trades: [],
  activity: [],
  recommendations: [],
  updateConfig: async () => {},
  logActivity: async () => {},
  startSession: async () => {},
  endSession: async () => {},
  loading: true,
  liveTradePrices: {},
  saveConfiguration: async () => {},
  deleteConfiguration: async () => {},
  duplicateConfiguration: async () => {},
  activateConfiguration: async () => {},
  closeTrade: async () => {},
});

export const TradingEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, updateProfile, addNotification } = useAuth();
  const { activeTradingBalance, addFundsToActiveBalance } = useFinancials();
  
  const activeTradingBalanceRef = useRef(activeTradingBalance);
  const addFundsRef = useRef(addFundsToActiveBalance);

  useEffect(() => {
    activeTradingBalanceRef.current = activeTradingBalance;
    addFundsRef.current = addFundsToActiveBalance;
  }, [activeTradingBalance, addFundsToActiveBalance]);

  const [configs, setConfigs] = useState<AiConfiguration[]>([]);
  const [config, setConfig] = useState<AiConfiguration | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<AiSession | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<AiTrade[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTradePrices, setLiveTradePrices] = useState<Record<string, number>>({});

  // Helper to load/save state from/to localStorage if Firestore is unavailable/offline
  const getLocalStorageItem = useCallback((key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, []);

  const setLocalStorageItem = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }, []);

  // Sync state FROM localStorage immediately on user login/availability to prevent blank resets on refresh
  useEffect(() => {
    if (!user) return;
    
    const cachedConfigs = getLocalStorageItem(`aver_configs_${user.uid}`, []);
    if (cachedConfigs.length > 0) {
      setConfigs(cachedConfigs);
      const active = cachedConfigs.find((c: any) => c.status === 'ACTIVE');
      if (active) {
        setConfig(active);
        setActiveConfigId(active.id);
      } else {
        setConfig(cachedConfigs[0]);
        setActiveConfigId(cachedConfigs[0].id);
      }
    }
    
    const cachedSession = getLocalStorageItem(`aver_session_${user.uid}`, null);
    if (cachedSession) {
      setSession(cachedSession);
    }
    
    const cachedPositions = getLocalStorageItem(`aver_positions_${user.uid}`, []);
    if (cachedPositions.length > 0) {
      setPositions(cachedPositions);
    }
    
    const cachedTrades = getLocalStorageItem(`aver_trades_${user.uid}`, []);
    if (cachedTrades.length > 0) {
      setTrades(cachedTrades);
    }
    
    const cachedActivity = getLocalStorageItem(`aver_activity_${user.uid}`, []);
    if (cachedActivity.length > 0) {
      setActivity(cachedActivity);
    }
    
    const cachedRecommendations = getLocalStorageItem(`aver_recommendations_${user.uid}`, []);
    if (cachedRecommendations.length > 0) {
      setRecommendations(cachedRecommendations);
    }

    setLoading(false);
  }, [user?.uid, getLocalStorageItem]);

  // Sync state TO localStorage on any state modification
  useEffect(() => {
    if (user && configs.length > 0) {
      setLocalStorageItem(`aver_configs_${user.uid}`, configs);
    }
  }, [configs, user, setLocalStorageItem]);

  useEffect(() => {
    if (user) {
      setLocalStorageItem(`aver_session_${user.uid}`, session);
    }
  }, [session, user, setLocalStorageItem]);

  useEffect(() => {
    if (user && positions.length > 0) {
      setLocalStorageItem(`aver_positions_${user.uid}`, positions);
    }
  }, [positions, user, setLocalStorageItem]);

  useEffect(() => {
    if (user && trades.length > 0) {
      setLocalStorageItem(`aver_trades_${user.uid}`, trades);
    }
  }, [trades, user, setLocalStorageItem]);

  useEffect(() => {
    if (user && activity.length > 0) {
      setLocalStorageItem(`aver_activity_${user.uid}`, activity);
    }
  }, [activity, user, setLocalStorageItem]);

  useEffect(() => {
    if (user && recommendations.length > 0) {
      setLocalStorageItem(`aver_recommendations_${user.uid}`, recommendations);
    }
  }, [recommendations, user, setLocalStorageItem]);

  useEffect(() => {
    seedTraders();
    const stopSimulator = startTraderSimulator();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const configsRef = collection(db, 'users', user.uid, 'aiConfigurations');
    const positionsRef = collection(db, 'users', user.uid, 'positions');
    const tradesRef = collection(db, 'users', user.uid, 'trades');
    const activityRef = query(collection(db, 'users', user.uid, 'activity'), orderBy('timestamp', 'desc'));
    const sessionRef = query(collection(db, 'aiSessions'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'), limit(1));

    const unsubConfigs = onSnapshot(configsRef, (snap) => {
      const fetchedConfigs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AiConfiguration);
      if (fetchedConfigs.length > 0) {
        setConfigs(fetchedConfigs);
        
        const active = fetchedConfigs.find(c => c.status === 'ACTIVE');
        if (active) {
          setConfig(active);
          setActiveConfigId(active.id);
        } else {
          setConfig(fetchedConfigs[0]);
          setActiveConfigId(fetchedConfigs[0].id);
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("[TradingEngineContext] configs subscription restricted/denied. Running in high-fidelity local state mode:", error);
      setLoading(false);
    });

    const unsubSession = onSnapshot(sessionRef, (snap) => {
        console.log("[TradingEngineContext] Session snapshot update:", snap.size);
        if (!snap.empty) {
            const newSession = {id: snap.docs[0].id, ...snap.docs[0].data()} as AiSession;
            console.log("[TradingEngineContext] New session from snapshot:", newSession);
            setSession(newSession);
        } else {
            console.log("[TradingEngineContext] No active session in snapshot");
            // Keep existing local active session to avoid resetting active local simulations
        }
    }, (error) => {
      console.warn("[TradingEngineContext] session subscription restricted/denied. Running locally:", error);
    });

    const unsubPositions = onSnapshot(positionsRef, (snap) => {
        setPositions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Position[]);
    }, (error) => {
      console.warn("[TradingEngineContext] positions subscription restricted/denied. Running locally:", error);
    });

    const unsubTrades = onSnapshot(tradesRef, (snap) => {
        const fetchedTrades = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AiTrade[];
        if (fetchedTrades.length > 0) {
          setTrades(fetchedTrades);
        }
    }, (error) => {
      console.warn("[TradingEngineContext] trades subscription restricted/denied. Running locally:", error);
    });

    const unsubActivity = onSnapshot(activityRef, (snap) => {
        const fetchedActivity = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEvent[];
        if (fetchedActivity.length > 0) {
          setActivity(fetchedActivity);
        }
    }, (error) => {
      console.warn("[TradingEngineContext] activity subscription restricted/denied. Running locally:", error);
    });

    const recsRef = query(collection(db, 'aiRecommendations'), where('userId', '==', user.uid));
    const unsubRecs = onSnapshot(recsRef, (snap) => {
        const sortedRecs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }) as AiRecommendation)
          .sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt as any).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt as any).getTime();
            return timeB - timeA;
          });
        if (sortedRecs.length > 0) {
          setRecommendations(sortedRecs);
        }
    }, (error) => {
      console.warn("[TradingEngineContext] recommendations subscription restricted/denied. Running locally:", error);
    });

    return () => {
      unsubConfigs();
      unsubSession();
      unsubPositions();
      unsubTrades();
      unsubActivity();
      unsubRecs();
      stopSimulator();
    };
  }, [user]);

  const logActivity = useCallback(async (type: string, message: string, metadata?: Record<string, any>) => {
    if (!user) return;
    
    const newAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };
    
    setActivity(prev => {
      const updated = [newAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    try {
        await addDoc(collection(db, 'users', user.uid, 'activity'), {
            type,
            message,
            timestamp: serverTimestamp(),
            metadata: metadata || {}
        });
    } catch (error) {
        console.warn("Failed to log activity in Firestore:", error);
    }
  }, [user, setLocalStorageItem]);

  const startSession = useCallback(async (configId: string, markets: string[]) => {
    console.log("[TradingEngineContext] startSession called with configId:", configId);
    if (!user) return;
    
    const newSession: AiSession = {
      id: `session_${Date.now()}`,
      userId: user.uid,
      status: 'ACTIVE',
      startTime: Timestamp.now(),
      marketsScanned: markets,
      activeConfigId: configId
    };
    
    console.log("[TradingEngineContext] Setting session to:", newSession);
    setSession(newSession);
    sessionRefVal.current = newSession;
    console.log("[TradingEngineContext] SessionRefVal updated");
    
    const startAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type: 'SESSION_STARTED',
      message: 'AI Trading Session started',
      timestamp: new Date().toISOString(),
      metadata: { configId, markets }
    };
    setActivity(prev => {
      const updated = [startAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    try {
        await aiTradingService.startSession(user.uid, markets, configId);
        await logActivity('SESSION_STARTED', 'AI Trading Session started');
        console.log("[TradingEngineContext] Session started in Firestore");
    } catch (error) {
        console.warn("Failed to start session in Firestore, running in simulated local engine mode:", error);
    }
  }, [user, logActivity, setLocalStorageItem]);

  const endSession = useCallback(async () => {
    if (!session || !user) return;
    
    setSession(null);
    
    const endAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type: 'SESSION_ENDED',
      message: 'AI Trading Session ended',
      timestamp: new Date().toISOString(),
      metadata: { sessionId: session.id }
    };
    setActivity(prev => {
      const updated = [endAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    try {
        await aiTradingService.endSession(session.id);
        await logActivity('SESSION_ENDED', 'AI Trading Session ended');
    } catch (error) {
        console.warn("Failed to end session in Firestore:", error);
    }
  }, [user, session, logActivity, setLocalStorageItem]);

  const saveConfiguration = useCallback(async (updatedConfig: AiConfiguration) => {
    if (!user) return;
    
    const configToSave = { ...updatedConfig, ownerId: user.uid, lastModified: Timestamp.now() as any, status: 'ACTIVE' as const };
    
    // Immediate state updates
    setConfigs(prev => {
      const exists = prev.some(c => c.id === updatedConfig.id);
      let updated;
      if (exists) {
        updated = prev.map(c => c.id === updatedConfig.id ? configToSave : { ...c, status: 'INACTIVE' as const });
      } else {
        updated = [...prev.map(c => ({...c, status: 'INACTIVE' as const})), configToSave];
      }
      setLocalStorageItem(`aver_configs_${user.uid}`, updated);
      return updated;
    });
    
    setConfig(configToSave);
    setActiveConfigId(configToSave.id);

    try {
      await aiTradingService.saveConfiguration(user.uid, configToSave);
      await aiTradingService.activateConfiguration(user.uid, configToSave.id);
      await logActivity('CONFIG_UPDATED', `Configuration "${updatedConfig.name}" saved successfully.`);
    } catch (error) {
      console.warn("Failed to save configuration in Firestore:", error);
    }
  }, [user, logActivity, setLocalStorageItem]);

  const deleteConfiguration = useCallback(async (configId: string) => {
    if (!user) return;
    
    setConfigs(prev => {
      const filtered = prev.filter(c => c.id !== configId);
      if (activeConfigId === configId) {
        if (filtered.length > 0) {
          setConfig(filtered[0]);
          setActiveConfigId(filtered[0].id);
        } else {
          setConfig(null);
          setActiveConfigId(undefined);
        }
      }
      setLocalStorageItem(`aver_configs_${user.uid}`, filtered);
      return filtered;
    });

    try {
      await aiTradingService.deleteConfiguration(user.uid, configId);
      await logActivity('CONFIG_DELETED', `Configuration deleted successfully.`);
    } catch (error) {
      console.warn("Failed to delete configuration in Firestore:", error);
    }
  }, [user, activeConfigId, logActivity, setLocalStorageItem]);

  const duplicateConfiguration = useCallback(async (configId: string) => {
    if (!user) return;
    try {
      const duplicated = await aiTradingService.duplicateConfiguration(user.uid, configId);
      
      setConfigs(prev => {
        const updated = [...prev, duplicated];
        setLocalStorageItem(`aver_configs_${user.uid}`, updated);
        return updated;
      });
      
      await logActivity('CONFIG_DUPLICATED', `Configuration duplicated as "${duplicated.name}".`);
    } catch (error) {
      console.warn("Failed to duplicate configuration in Firestore, performing local duplication:", error);
      const target = configs.find(c => c.id === configId);
      if (target) {
        const localDuplicated: AiConfiguration = {
          ...target,
          id: `cfg_${Date.now()}`,
          name: `${target.name} (Copy)`,
          createdAt: Timestamp.now(),
          lastModified: Timestamp.now(),
          status: 'INACTIVE'
        };
        setConfigs(prev => {
          const updated = [...prev, localDuplicated];
          setLocalStorageItem(`aver_configs_${user.uid}`, updated);
          return updated;
        });
        await logActivity('CONFIG_DUPLICATED', `Configuration duplicated as "${localDuplicated.name}".`);
      }
    }
  }, [user, configs, logActivity, setLocalStorageItem]);

  const activateConfiguration = useCallback(async (configId: string) => {
    if (!user) return;
    
    setConfigs(prev => {
      const updated = prev.map(c => ({
        ...c,
        status: c.id === configId ? 'ACTIVE' as const : 'INACTIVE' as const
      }));
      const active = updated.find(c => c.id === configId);
      if (active) {
        setConfig(active);
        setActiveConfigId(active.id);
      }
      setLocalStorageItem(`aver_configs_${user.uid}`, updated);
      return updated;
    });

    try {
      await aiTradingService.activateConfiguration(user.uid, configId);
      await logActivity('CONFIG_ACTIVATED', `Configuration activated.`);
    } catch (error) {
      console.warn("Failed to activate configuration in Firestore:", error);
    }
  }, [user, logActivity, setLocalStorageItem]);

  const closeTrade = useCallback(async (tradeId: string, exitPrice: number, reason: AiTrade['reasonClosed']) => {
    if (!user) return;
    
    // 1. Calculate returns & PnL immediately
    let pnl = 0;
    let pnlPercent = 0;
    let closedAsset = '';
    
    setTrades(prev => {
      const target = prev.find(t => t.id === tradeId);
      if (!target) return prev;
      pnl = (exitPrice - target.entry) * target.quantity;
      pnlPercent = ((exitPrice - target.entry) / target.entry) * 100;
      closedAsset = target.asset;

      const updated = prev.map(t => {
        if (t.id === tradeId) {
          return {
            ...t,
            status: 'CLOSED' as const,
            exit: exitPrice,
            closedAt: Timestamp.now() as any,
            pnl,
            pnlPercent,
            reasonClosed: reason
          };
        }
        return t;
      });
      setLocalStorageItem(`aver_trades_${user.uid}`, updated);
      return updated;
    });

    // 2. Perform optimistic financials updates
    try {
      const nextProfit = pnl > 0 ? parseFloat(((user.totalProfit || 0) + pnl).toFixed(2)) : (user.totalProfit || 0);
      const nextLoss = pnl < 0 ? parseFloat(((user.totalLoss || 0) + Math.abs(pnl)).toFixed(2)) : (user.totalLoss || 0);
      const nextTodayPnL = parseFloat(((user.portfolio?.todayPnL || 0) + pnl).toFixed(2));
      const nextAvailable = parseFloat(((user.availableBalance || 0) + pnl).toFixed(2));

      await addFundsToActiveBalance(pnl);

      await updateProfile({
        availableBalance: nextAvailable,
        totalProfit: nextProfit,
        totalLoss: nextLoss,
        portfolio: {
          ...user.portfolio,
          todayPnL: nextTodayPnL,
          todayPnLPercent: (nextTodayPnL / (user.portfolioBalance || 100000)) * 100
        }
      });
    } catch (e) {
      console.warn("Optimistic financial balance update failed:", e);
    }

    // 3. Optimistic activity event log
    const actEvent: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type: reason === 'TARGET_HIT' ? 'TP_HIT' : reason === 'STOP_LOSS_HIT' ? 'SL_HIT' : 'MANUAL_CLOSE',
      message: `Autonomous liquidation completed for ${closedAsset}. Net returns: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%).`,
      timestamp: new Date().toISOString(),
      metadata: { tradeId, asset: closedAsset, pnl }
    };
    setActivity(prev => {
      const updated = [actEvent, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    // 4. Try Firestore
    try {
      await aiTradingService.closeTrade(user.uid, tradeId, exitPrice, reason);
      await logActivity(
        reason === 'TARGET_HIT' ? 'TP_HIT' : reason === 'STOP_LOSS_HIT' ? 'SL_HIT' : 'MANUAL_CLOSE',
        `Autonomous liquidation completed for ${closedAsset}. Net returns: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%).`
      );
    } catch (error) {
      console.warn("Failed to close trade in Firestore (offline/local simulation active):", error);
    }
  }, [user, updateProfile, addFundsToActiveBalance, logActivity, setLocalStorageItem]);

  // Background Trading Simulator Loop
  const tradesRefVal = useRef<AiTrade[]>([]);
  const userRef = useRef<any>(null);
  const sessionRefVal = useRef<AiSession | null>(null);
  const livePricesRef = useRef<Record<string, number>>({});
  const configRefVal = useRef<AiConfiguration | null>(null);
  
  // Refs for loop management
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const orderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    tradesRefVal.current = trades;
  }, [trades]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    sessionRefVal.current = session;
  }, [session]);

  useEffect(() => {
    configRefVal.current = config;
  }, [config]);

  // Unified loop for live ticks, position management, and autonomous orders
  useEffect(() => {
    console.log("[TradingEngineContext] Trading loops useEffect triggered. Session:", session);
    if (!user || !session || session.status !== 'ACTIVE') {
      console.log("[TradingEngineContext] Loops not starting: user/session missing or not ACTIVE");
      return;
    }
    console.log("[TradingEngineContext] Starting trading loops...");
    
    let loggingInterval: NodeJS.Timeout;
    let tickInterval: NodeJS.Timeout;
    let positionInterval: NodeJS.Timeout;
    let orderTimeout: NodeJS.Timeout;

    // Add logging to ensure loops are firing
    loggingInterval = setInterval(() => {
        console.log("[TradingEngineContext] Loops running, session active:", sessionRefVal.current?.status === 'ACTIVE');
    }, 5000);

    // 1. HIGH-FREQUENCY LIVE PRICES TICKER (Every 1 second)
    tickInterval = setInterval(() => {
      if (!sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      
      setLiveTradePrices(prev => {
        const next = { ...prev };
        openTrades.forEach(trade => {
          const basePrice = next[trade.id] || trade.entry;
          const fluctuation = (Math.random() - 0.5) * 0.001 * basePrice;
          next[trade.id] = parseFloat((basePrice + fluctuation).toFixed(2));
        });

        // Also fluctuate general asset prices for BTC, ETH, SOL, AAPL, NVDA, TSLA
        const assets = ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA', 'TSLA'];
        assets.forEach(asset => {
          const basePrice = next[asset] || (asset === 'BTC' ? 64000 : asset === 'ETH' ? 3450 : asset === 'SOL' ? 145 : asset === 'AAPL' ? 172 : asset === 'NVDA' ? 120 : 180);
          const fluctuation = (Math.random() - 0.5) * 0.0005 * basePrice;
          next[asset] = parseFloat((basePrice + fluctuation).toFixed(2));
        });

        livePricesRef.current = next;
        // console.log("[TradingEngineContext] Live prices updated:", next);
        return next;
      });
    }, 1000);

    // 2. POSITION MANAGEMENT & LIFECYCLE (Every 3 seconds)
    positionInterval = setInterval(async () => {
      if (!userRef.current || !sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
      
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      console.log("[TradingEngineContext] Position management, open trades:", openTrades.length);
      if (openTrades.length === 0) return;

      for (const trade of openTrades) {
        const livePrice = livePricesRef.current[trade.id] || trade.currentPrice;
        const pnl = (livePrice - trade.entry) * trade.quantity;
        const pnlPercent = ((livePrice - trade.entry) / trade.entry) * 100;

        const openedTime = trade.openedAt ? (trade.openedAt.toDate ? trade.openedAt.toDate().getTime() : new Date(trade.openedAt as any).getTime()) : Date.now();
        const ageSec = (Date.now() - openedTime) / 1000;
        
        // Take profit and stop loss checks
        const hitTakeProfit = livePrice >= trade.takeProfit;
        const hitStopLoss = livePrice <= trade.stopLoss;
        const shouldTimeout = ageSec > 180 && Math.random() > 0.95; // longer timeout for background simulation

        if (hitTakeProfit || hitStopLoss || shouldTimeout) {
          const reason = hitTakeProfit ? 'TARGET_HIT' : hitStopLoss ? 'STOP_LOSS_HIT' : 'TARGET_HIT';
          
          try {
            await closeTrade(trade.id, livePrice, reason);

            if (addNotification) {
              addNotification(
                'trading',
                pnl >= 0 ? 'medium' : 'high',
                'AI Position Liquidated',
                `Closed ${trade.asset} position with net return of ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}.`
              );
            }
          } catch (e) {
            console.error("Error background auto-closing position:", e);
          }
        }
      }
    }, 3000);

    // 3. AUTONOMOUS ORDER GENERATOR (Every 25 seconds)
    
    const runOrderLoop = async () => {
      console.log("[TradingEngineContext] runOrderLoop called");
      if (!userRef.current || !sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') {
        console.log("[TradingEngineContext] runOrderLoop: aborting - user or session missing or not ACTIVE");
        return;
      }

      const activeConfig = (configRefVal.current || configs.find(c => c.status === 'ACTIVE') || configs[0] || {
        id: 'cfg_default',
        name: 'Default AI Config',
        markets: ['BTC', 'ETH', 'SOL'],
        strategy: 'NEURAL_MOMENTUM',
        riskControls: { maxSimultaneousPositions: 3, maxPositionSize: 50, exposureLimit: 500, positionSizingPreference: 'PERCENTAGE', lossLimit: 2 },
        recommendationRules: { minConfidence: 75, allowedAssetClasses: ['CRYPTO'], indicators: [] },
        schedule: { sessions: [], weekdays: true, weekends: true, timezone: 'UTC', breakPeriods: [], excludeHolidays: false }
      }) as AiConfiguration;
      console.log("[TradingEngineContext] runOrderLoop: Using config:", activeConfig.id, activeConfig);

      // Respect the Neural Schedule Manager
      if (!isWithinSchedule(activeConfig.schedule)) {
        console.log("[TradingEngineContext] Outside schedule window or inside break period. Pausing auto-trading...");
        orderTimeout = setTimeout(runOrderLoop, 15000);
        return;
      }

      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      if (openTrades.length >= (activeConfig.riskControls?.maxSimultaneousPositions || 3)) {
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

      const randomMarket = activeConfig.markets[Math.floor(Math.random() * activeConfig.markets.length)];
      if (!randomMarket) {
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

      // Prevent duplicate open trade for same asset
      if (openTrades.some(t => t.asset === randomMarket)) {
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

      const rsiVal = Math.floor(28 + Math.random() * 45);
      const price = livePricesRef.current[randomMarket] || (randomMarket === 'BTC' ? 64200 : randomMarket === 'ETH' ? 3450 : randomMarket === 'SOL' ? 145 : randomMarket === 'AAPL' ? 172 : 125);
      const mockMarketData = { asset: randomMarket, price, rsi: rsiVal };

      try {
        let rec: AiRecommendation;
        try {
          rec = await aiTradingService.generateRecommendation(sessionRefVal.current.id, userRef.current.uid, mockMarketData, activeConfig);
        } catch (e) {
          console.warn("[TradingEngineContext] Firestore recommendation fail, using local simulation model:", e);
          const currentPrice = mockMarketData.price || 100;
          const suggestedAction = Math.random() > 0.4 ? 'BUY' : 'SELL';
          const entry = parseFloat(currentPrice.toFixed(2));
          const stopLoss = parseFloat((suggestedAction === 'BUY' ? entry * 0.95 : entry * 1.05).toFixed(2));
          const takeProfit = parseFloat((suggestedAction === 'BUY' ? entry * 1.15 : entry * 0.85).toFixed(2));
          const confidence = Math.floor(80 + Math.random() * 18);
          const rsiValue = Math.floor(mockMarketData.rsi || 50);
          const indicators = ['RSI Over-Extended', 'MACD Bullish Cross', 'EMA 200 Support', 'Volume Delta Spike'];
          const explanation = `The asset ${mockMarketData.asset} exhibits strong oversold characteristics. RSI stands at ${rsiValue}, indicating localized exhaustion.`;

          rec = {
            id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            sessionId: sessionRefVal.current.id,
            userId: userRef.current.uid,
            asset: mockMarketData.asset,
            entry,
            stopLoss,
            takeProfit,
            confidence,
            suggestedAction,
            riskRating: confidence > 90 ? 'LOW' : 'MEDIUM',
            holdingWindow: '4-8 hours',
            volatility: 'MEDIUM',
            explanation,
            indicators,
            currentPrice: entry,
            status: 'PENDING',
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromMillis(Date.now() + 3600000)
          };
        }

        // Add to recommendations list locally
        setRecommendations(prev => {
          const updated = [rec, ...prev].slice(0, 50);
          setLocalStorageItem(`aver_recommendations_${userRef.current.uid}`, updated);
          return updated;
        });

        const recAct: ActivityEvent = {
          id: `act_${Date.now()}`,
          userId: userRef.current.uid,
          type: 'TRADE_OPENED',
          message: `Neural opportunity compiled for ${randomMarket} with confidence score: ${rec.confidence}%.`,
          timestamp: new Date().toISOString(),
          metadata: { recId: rec.id, asset: randomMarket }
        };
        setActivity(prev => {
          const updated = [recAct, ...prev].slice(0, 100);
          setLocalStorageItem(`aver_activity_${userRef.current.uid}`, updated);
          return updated;
        });

      // Recommendation rules check
      if (rec.confidence < (activeConfig.recommendationRules?.minConfidence || 0)) {
        console.log("[TradingEngineContext] Recommendation confidence too low, skipping:", rec.confidence);
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

        // Execute trade after a brief delay
        setTimeout(async () => {
          if (!sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
          try {
            // Determine size based on risk profile
            // High risk (e.g. lossLimit >= 5, maxPositionSize >= 100, or Volatility Breakout strategy) -> trade high amounts like $156+ per trade.
            // Low risk -> trade lower like $22 per trade.
            const isHighRisk = 
              activeConfig.strategy === 'VOLATILITY_BREAKOUT' || 
              (activeConfig.riskControls?.lossLimit !== undefined && activeConfig.riskControls.lossLimit >= 5) || 
              (activeConfig.riskControls?.maxPositionSize !== undefined && activeConfig.riskControls.maxPositionSize >= 100);
            
            let tradeAmount = 22; // default low risk
            if (isHighRisk) {
              // High risk: trade high amounts like $156 or more per trade
              tradeAmount = activeConfig.riskControls?.maxPositionSize ? Math.max(156, activeConfig.riskControls.maxPositionSize) : 156;
            } else {
              // Low risk: trade lower like $22
              tradeAmount = activeConfig.riskControls?.maxPositionSize ? Math.min(22, activeConfig.riskControls.maxPositionSize) : 22;
            }
            
            let quantity = parseFloat((tradeAmount / rec.entry).toFixed(6));
            if (quantity <= 0) {
              quantity = 0.0001;
            }
            
            let newTrade: AiTrade;
            
            try {
              newTrade = await aiTradingService.executeTrade(userRef.current.uid, rec, quantity);
            } catch (ex) {
              console.warn("[TradingEngineContext] executeTrade Firestore failed, executing locally:", ex);
              newTrade = {
                id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                recommendationId: rec.id,
                userId: userRef.current.uid,
                asset: rec.asset,
                entry: rec.entry,
                quantity,
                currentPrice: rec.entry,
                status: 'OPEN',
                stopLoss: rec.stopLoss,
                takeProfit: rec.takeProfit,
                riskExposure: Math.abs((rec.entry - rec.stopLoss) * quantity),
                openedAt: Timestamp.now()
              };
            }

            // Update trades state locally
            setTrades(prev => {
              if (prev.some(t => t.id === newTrade.id)) return prev;
              const updated = [...prev, newTrade].slice(-100);
              setLocalStorageItem(`aver_trades_${userRef.current.uid}`, updated);
              console.log("[TradingEngineContext] New trade added:", newTrade);
              return updated;
            });

            // Update recommendation status locally
            setRecommendations(prev => {
              const updated = prev.map(r => r.id === rec.id ? { ...r, status: 'EXECUTED' as any } : r);
              setLocalStorageItem(`aver_recommendations_${userRef.current.uid}`, updated);
              return updated;
            });

            const tradeAct: ActivityEvent = {
              id: `act_${Date.now()}`,
              userId: userRef.current.uid,
              type: 'COPY_TRADE',
              message: `Autonomous position established for ${randomMarket}: ${quantity} units at $${rec.entry}.`,
              timestamp: new Date().toISOString(),
              metadata: { tradeId: newTrade.id, asset: randomMarket }
            };
            setActivity(prev => {
              const updated = [tradeAct, ...prev].slice(0, 100);
              setLocalStorageItem(`aver_activity_${userRef.current.uid}`, updated);
              return updated;
            });
            
            if (addNotification) {
              addNotification(
                'trading',
                'medium',
                'AI Position Executed',
                `Neural engine successfully opened BUY position for ${randomMarket} at $${rec.entry}.`
              );
            }
          } catch (ex) {
            console.error("Failed to execute autonomous background trade:", ex);
          }
        }, 1500);

      } catch (ex) {
        console.error("Failed to generate autonomous background recommendation:", ex);
      }
      
      // Loop with randomness between 8-15 seconds
      orderTimeout = setTimeout(runOrderLoop, 8000 + Math.random() * 7000);
    };

    runOrderLoop();

    // 4. BALANCE DRIFT SIMULATION (Every 5 seconds)
    // Removed as requested
    /*
    const driftInterval = setInterval(() => {
      if (!sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE' || !addFundsRef.current) return;
      
      // Small random drift between -$2.50 and +$5.50 to simulate micro-pnl/fees/interest
      const drift = (Math.random() * 8) - 2.5;
      addFundsRef.current(drift);
    }, 5000);
    */

    return () => {
      clearInterval(tickInterval);
      clearInterval(positionInterval);
      clearInterval(loggingInterval);
      // clearInterval(driftInterval);
      clearTimeout(orderTimeout);
    };
  }, [user, session?.id, session?.status]);

  const updateConfig = useCallback(async (newConfig: Partial<AiConfiguration>) => {
    if (!user || !config) return;
    
    // Immediate state updates
    setConfig(prev => prev ? { ...prev, ...newConfig } as AiConfiguration : null);
    setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, ...newConfig } as AiConfiguration : c));
    
    try {
      const configRef = doc(db, 'users', user.uid, 'aiConfigurations', config.id);
      await updateDoc(configRef, {
        ...newConfig,
        lastModified: serverTimestamp()
      });
      await logActivity('CONFIG_UPDATED', `Configuration "${config.name}" updated successfully`);
    } catch (error) {
      console.warn("Failed to update config in Firestore (running locally):", error);
    }
  }, [user, config, logActivity]);

  return (
    <TradingEngineContext.Provider value={{
      configs,
      config,
      activeConfigId,
      session,
      positions,
      trades,
      activity,
      recommendations,
      updateConfig,
      logActivity,
      startSession,
      endSession,
      loading,
      liveTradePrices,
      saveConfiguration,
      deleteConfiguration,
      duplicateConfiguration,
      activateConfiguration,
      closeTrade
    }}>
      {children}
    </TradingEngineContext.Provider>
  );
};

export const useTradingEngine = () => useContext(TradingEngineContext);
