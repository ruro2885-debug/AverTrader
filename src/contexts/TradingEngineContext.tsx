import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, where, limit, getDocs, Timestamp, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useFinancials } from '../hooks/useFinancials';
import { AiConfiguration, AiTrade, AiSession, AiRecommendation, TradingSchedule } from '../types/aiTrading';
import { Position, ActivityEvent } from '../types/trading';
import { seedTraders, startTraderSimulator } from '../services/traderSimulator';
import { aiTradingService } from '../services/aiTradingService';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService } from '../services/walletService';

function isWithinSchedule(schedule?: TradingSchedule): boolean {
  if (!schedule) return true;
  
  let tz = 'UTC';
  if (schedule.timezone === 'EST') tz = 'America/New_York';
  else if (schedule.timezone === 'PST') tz = 'America/Los_Angeles';
  else if (schedule.timezone === 'GMT') tz = 'Europe/London';
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    parts.forEach(p => {
      partMap[p.type] = p.value;
    });
    
    const weekday = partMap['weekday'];
    const hours = partMap['hour'] || '00';
    const minutes = partMap['minute'] || '00';
    const currentTimeStr = `${hours}:${minutes}`;
    
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const isWeekday = !isWeekend;
    
    if (isWeekend && !schedule.weekends) return false;
    if (isWeekday && !schedule.weekdays) return false;
    
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
  } catch (e) {
    console.error("Error calculating schedule with timezone, falling back to local time", e);
    const now = new Date();
    const day = now.getDay();
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
  const { activeTradingBalance, addFundsToActiveBalance, tokenBalance } = useFinancials();
  
  const activeTradingBalanceRef = useRef(activeTradingBalance);
  const tokenBalanceRef = useRef(tokenBalance);
  const addFundsRef = useRef(addFundsToActiveBalance);

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
    
    // Prioritize cached configs but don't seed if it's already in localStorage
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
    } else {
      // Seed a default config only if absolutely nothing exists
      const defaultSeedConfig: AiConfiguration = {
          id: `cfg_default`,
          ownerId: user.uid,
          name: 'Alpha Quant Momentum',
          createdAt: Timestamp.now(),
          lastModified: Timestamp.now(),
          status: 'ACTIVE',
          sessionSetup: {
            amountToAllocate: 1000,
            fundingSource: 'WALLET',
            sessionDuration: 24
          },
          profitRiskManagement: {
            sessionTakeProfit: 5,
            sessionStopLoss: 2,
            maxRiskPerTrade: 1,
            maxPositionSize: 500
          },
          aiTradingRules: {
            minConfidence: 85,
            maxSimultaneousPositions: 3,
            assetSelection: ['BTC', 'ETH', 'SOL'],
            tradingStrategy: 'NEURAL_MOMENTUM'
          },
          configurationDetails: {
            description: 'Aggressive alpha-capture strategy targeting neural momentum patterns.',
            category: 'Scalping',
            version: '1.2.0'
          },
          analyticsAndNotes: {
            riskScore: 65,
            strategyNotes: 'Focus on 5m timeframe crossovers with volume validation.',
            performanceStats: {
              winRate: 0,
              totalReturn: 0,
              drawdown: 0
            }
          },
          notificationPreferences: {
            newRecommendations: true,
            tradeExecutions: true,
            marketAlerts: false
          }
        };
        
        setConfigs([defaultSeedConfig]);
        setConfig(defaultSeedConfig);
        setActiveConfigId(defaultSeedConfig.id);
        setLocalStorageItem(`aver_configs_${user.uid}`, [defaultSeedConfig]);
        
        // Also try to sync it to firestore
        try {
          setDoc(doc(db, 'users', user.uid, 'aiConfigurations', defaultSeedConfig.id), defaultSeedConfig).catch(() => {});
        } catch (err) {}
    }
    
    // Try to restore active session from localStorage on initial boot
    const cachedSession = getLocalStorageItem(`aver_session_${user.uid}`, null);
    if (cachedSession) {
      setSession(cachedSession);
      sessionRefVal.current = cachedSession;
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
  }, [user?.uid, getLocalStorageItem, setLocalStorageItem]);

  // Fetch saved AI Preferences & Risk Settings directly from Firestore aiPreferences/{userId}
  useEffect(() => {
    if (!user?.uid) return;

    async function loadSavedAiPreferences() {
      try {
        const savedPrefs = await aiTradingService.getPreferences(user.uid);
        if (savedPrefs) {
          setConfigs(prevConfigs => {
            if (prevConfigs.length === 0) return prevConfigs;
            return prevConfigs.map(c => ({
              ...c,
              profitRiskManagement: {
                ...c.profitRiskManagement,
                maxPositionSize: savedPrefs.maxPositionSize ?? c.profitRiskManagement.maxPositionSize,
                maxRiskPerTrade: savedPrefs.maxRiskPerTrade ?? c.profitRiskManagement.maxRiskPerTrade,
                sessionStopLoss: savedPrefs.lossLimit ?? c.profitRiskManagement.sessionStopLoss,
              },
              aiTradingRules: {
                ...c.aiTradingRules,
                minConfidence: savedPrefs.minConfidence ?? savedPrefs.minimumConfidenceScore ?? c.aiTradingRules.minConfidence,
                maxSimultaneousPositions: savedPrefs.maxSimultaneousPositions ?? c.aiTradingRules.maxSimultaneousPositions,
                assetSelection: savedPrefs.preferredMarkets && savedPrefs.preferredMarkets.length > 0 ? savedPrefs.preferredMarkets : c.aiTradingRules.assetSelection
              }
            }));
          });

          setConfig(prevConfig => {
            if (!prevConfig) return prevConfig;
            return {
              ...prevConfig,
              profitRiskManagement: {
                ...prevConfig.profitRiskManagement,
                maxPositionSize: savedPrefs.maxPositionSize ?? prevConfig.profitRiskManagement.maxPositionSize,
                maxRiskPerTrade: savedPrefs.maxRiskPerTrade ?? prevConfig.profitRiskManagement.maxRiskPerTrade,
                sessionStopLoss: savedPrefs.lossLimit ?? prevConfig.profitRiskManagement.sessionStopLoss,
              },
              aiTradingRules: {
                ...prevConfig.aiTradingRules,
                minConfidence: savedPrefs.minConfidence ?? savedPrefs.minimumConfidenceScore ?? prevConfig.aiTradingRules.minConfidence,
                maxSimultaneousPositions: savedPrefs.maxSimultaneousPositions ?? prevConfig.aiTradingRules.maxSimultaneousPositions,
                assetSelection: savedPrefs.preferredMarkets && savedPrefs.preferredMarkets.length > 0 ? savedPrefs.preferredMarkets : prevConfig.aiTradingRules.assetSelection
              }
            };
          });
        }
      } catch (err) {
        console.warn("Failed to load saved aiPreferences from Firestore:", err);
      }
    }

    loadSavedAiPreferences();
  }, [user?.uid]);

  // Sync state FROM custom events (e.g., when copying a trader's AI config)
  useEffect(() => {
    const handleConfigsSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.userId === user?.uid) {
        setConfigs(customEvent.detail.configs);
        const active = customEvent.detail.configs.find((c: any) => c.status === 'ACTIVE');
        if (active) {
          setConfig(active);
          setActiveConfigId(active.id);
        } else if (customEvent.detail.configs.length > 0 && !activeConfigId) {
          setConfig(customEvent.detail.configs[0]);
          setActiveConfigId(customEvent.detail.configs[0].id);
        }
      }
    };
    window.addEventListener('configs_updated', handleConfigsSync);
    return () => window.removeEventListener('configs_updated', handleConfigsSync);
  }, [user?.uid, activeConfigId]);

  // Sync state TO localStorage on any state modification
  useEffect(() => {
    if (user && configs.length > 0) {
      setLocalStorageItem(`aver_configs_${user.uid}`, configs);
    }
  }, [configs, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user) {
      setLocalStorageItem(`aver_session_${user.uid}`, session);
    }
  }, [session, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user && positions.length > 0) {
      setLocalStorageItem(`aver_positions_${user.uid}`, positions);
    }
  }, [positions, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user && trades.length > 0) {
      setLocalStorageItem(`aver_trades_${user.uid}`, trades);
    }
  }, [trades, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user && activity.length > 0) {
      setLocalStorageItem(`aver_activity_${user.uid}`, activity);
    }
  }, [activity, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user && recommendations.length > 0) {
      setLocalStorageItem(`aver_recommendations_${user.uid}`, recommendations);
    }
  }, [recommendations, user?.uid, setLocalStorageItem]);

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
        if (!snap.empty) {
          const fetchedSession = { id: snap.docs[0].id, ...snap.docs[0].data() } as AiSession;
          console.log("[TradingEngineContext] Session synchronized from Firestore:", fetchedSession.id);
          setSession(fetchedSession);
          sessionRefVal.current = fetchedSession;
        } else {
          // If no active session found in Firestore, but we have one locally, 
          // we might want to check if it's just a sync delay or if it was truly ended.
          // Only clear local session if we have finished initial loading to avoid race conditions.
          if (!loading && sessionRefVal.current) {
            console.log("[TradingEngineContext] No active session in Firestore, clearing local session.");
            setSession(null);
            sessionRefVal.current = null;
          }
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
        setTrades(fetchedTrades);
    }, (error) => {
      console.warn("[TradingEngineContext] trades subscription restricted/denied. Running locally:", error);
    });

    const unsubActivity = onSnapshot(activityRef, (snap) => {
        const fetchedActivity = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEvent[];
        setActivity(fetchedActivity);
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
  }, [user?.uid]);

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
  }, [user?.uid, setLocalStorageItem]);

  const startSession = useCallback(async (configId: string, markets: string[]) => {
    console.log("[TradingEngineContext] startSession called with configId:", configId);
    if (!user) return;
    
    const activeConfig = configs.find(c => c.id === configId) || config;
    if (!activeConfig) return;

    const allocationAmount = activeConfig.sessionSetup.amountToAllocate;
    const fundingSource = activeConfig.sessionSetup.fundingSource;
    
    // Validate funds
    const sourceBalance = fundingSource === 'WALLET' ? tokenBalanceRef.current : user.vaultBalance || 0;
    if (sourceBalance < allocationAmount) {
      addNotification?.('trading', 'high', 'Insufficient Funds', `Your ${fundingSource.toLowerCase()} balance is insufficient to start this session.`);
      return;
    }

    // Deduct funds from source to isolate them for trading
    try {
      const userRef = doc(db, 'users', user.uid);
      if (fundingSource === 'WALLET') {
        await updateDoc(userRef, {
          tokenBalance: increment(-allocationAmount),
          availableBalance: increment(-allocationAmount)
        });
      } else {
        await updateDoc(userRef, {
          vaultBalance: increment(-allocationAmount)
        });
      }
    } catch (err) {
      console.error("Failed to isolate trading funds:", err);
      addNotification?.('system', 'high', 'Engine Error', 'Could not secure trading funds. Please try again.');
      return;
    }

    const newSession: AiSession = {
      id: `session_${Date.now()}`,
      userId: user.uid,
      status: 'ACTIVE',
      startTime: Timestamp.now(),
      activeConfigId: configId,
      tradingCapital: allocationAmount,
      initialCapital: allocationAmount,
      openPositionsCount: 0,
      totalProfit: 0,
      totalLoss: 0,
      lastUpdate: Timestamp.now()
    };
    
    console.log("[TradingEngineContext] Setting session to:", newSession);
    setSession(newSession);
    sessionRefVal.current = newSession;
    
    // Deduct funds from source if necessary (simulation)
    // For now, we'll just track it in the session
    
    const startAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type: 'SESSION_STARTED',
      message: `AI Trading Session started with $${allocationAmount} from ${fundingSource}`,
      timestamp: new Date().toISOString(),
      metadata: { configId, markets, allocationAmount }
    };
    setActivity(prev => {
      const updated = [startAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    try {
        await setDoc(doc(db, 'aiSessions', newSession.id), newSession);
        // Lock config status
        await updateDoc(doc(db, 'users', user.uid, 'aiConfigurations', configId), {
          status: 'ACTIVE',
          lastModified: serverTimestamp()
        });
        
        await portfolioPersistenceService.updateSessionDetails(user.uid, {
          sessionId: newSession.id,
          status: 'ACTIVE',
          marketsScanned: markets,
          activeConfigId: configId || null,
          startTime: new Date().toISOString(),
          engineState: 'ACTIVE'
        });
        await logActivity('SESSION_STARTED', `AI Trading Session started with $${allocationAmount} from ${fundingSource}`);
    } catch (error) {
        console.warn("Failed to start session in Firestore:", error);
    }
  }, [user, configs, config, addNotification, logActivity, setLocalStorageItem]);

  const endSession = useCallback(async () => {
    if (!session || !user) return;
    
    const finalCapital = session.tradingCapital;
    const fundingSource = config?.sessionSetup.fundingSource || 'WALLET';

    setSession(null);
    
    const endAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: user.uid,
      type: 'SESSION_ENDED',
      message: `AI Trading Session ended. Returning $${finalCapital.toFixed(2)} to ${fundingSource.toLowerCase()}.`,
      timestamp: new Date().toISOString(),
      metadata: { sessionId: session.id, finalCapital }
    };
    setActivity(prev => {
      const updated = [endAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${user.uid}`, updated);
      return updated;
    });

    try {
        // Return isolated funds + profit/loss to the main wallet
        const userRef = doc(db, 'users', user.uid);
        if (fundingSource === 'WALLET') {
          await updateDoc(userRef, {
            tokenBalance: increment(finalCapital),
            availableBalance: increment(finalCapital)
          });
        } else {
          await updateDoc(userRef, {
            vaultBalance: increment(finalCapital)
          });
        }

        await aiTradingService.endSession(session.id);
        await portfolioPersistenceService.updateSessionDetails(user.uid, {
          sessionId: null,
          status: 'INACTIVE',
          engineState: 'IDLE'
        });
        await logActivity('SESSION_ENDED', `AI Trading Session ended. Funds settled: $${finalCapital.toFixed(2)}`);
    } catch (error) {
        console.warn("Failed to end session in Firestore:", error);
        await portfolioPersistenceService.updateSessionDetails(user.uid, {
          sessionId: null,
          status: 'INACTIVE',
          engineState: 'IDLE'
        });
    }
  }, [user?.uid, session, logActivity, setLocalStorageItem]);

  const endSessionRef = useRef(endSession);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  useEffect(() => {
    activeTradingBalanceRef.current = activeTradingBalance;
    tokenBalanceRef.current = tokenBalance;
    addFundsRef.current = addFundsToActiveBalance;

    const currentTokenBalance = tokenBalance !== undefined ? tokenBalance : activeTradingBalance;

    if (!loading && currentTokenBalance <= 0 && session?.status === 'ACTIVE') {
      console.log("[TradingEngineContext] Insufficient funds detected. Terminating AI session.");
      endSessionRef.current();
    }
  }, [activeTradingBalance, tokenBalance, addFundsToActiveBalance, session?.status, user?.uid, loading]);

  const saveConfiguration = useCallback(async (updatedConfig: AiConfiguration) => {
    if (!user) return;
    
    const configToSave = { ...updatedConfig, ownerId: user.uid, lastModified: Timestamp.now() as any };
    
    // Immediate state updates
    setConfigs(prev => {
      const updated = prev.map(c => c.id === updatedConfig.id ? configToSave : c);
      if (!prev.some(c => c.id === updatedConfig.id)) {
        updated.push(configToSave);
      }
      setLocalStorageItem(`aver_configs_${user.uid}`, updated);
      return updated;
    });
    
    if (activeConfigId === configToSave.id) {
      setConfig(configToSave);
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'aiConfigurations', configToSave.id), configToSave);
      await aiTradingService.savePreferences(user.uid, {
        maxPositionSize: configToSave.profitRiskManagement.maxPositionSize,
        maxRiskPerTrade: configToSave.profitRiskManagement.maxRiskPerTrade,
        lossLimit: configToSave.profitRiskManagement.sessionStopLoss,
        minConfidence: configToSave.aiTradingRules.minConfidence,
        maxSimultaneousPositions: configToSave.aiTradingRules.maxSimultaneousPositions,
        preferredMarkets: configToSave.aiTradingRules.assetSelection
      });
      await logActivity('CONFIG_UPDATED', `Configuration "${updatedConfig.name}" saved successfully.`);
    } catch (error) {
      console.warn("Failed to save configuration in Firestore:", error);
    }
  }, [user?.uid, activeConfigId, logActivity, setLocalStorageItem]);

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
  }, [user?.uid, activeConfigId, logActivity, setLocalStorageItem]);

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
  }, [user?.uid, configs, logActivity, setLocalStorageItem]);

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
  }, [user?.uid, logActivity, setLocalStorageItem]);

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

    // Update active session metrics
    setSession(prev => {
      if (!prev || prev.status !== 'ACTIVE') return prev;
      const updated = {
        ...prev,
        tradingCapital: prev.tradingCapital + pnl,
        totalProfit: pnl > 0 ? prev.totalProfit + pnl : prev.totalProfit,
        totalLoss: pnl < 0 ? prev.totalLoss + Math.abs(pnl) : prev.totalLoss,
        lastUpdate: Timestamp.now()
      };
      setLocalStorageItem(`aver_session_${user.uid}`, updated);
      sessionRefVal.current = updated;
      
      // Sync the session P/L to Firestore so it reflects on Dashboard/Portfolio as part of "Active Engine Capital"
      updateDoc(doc(db, 'aiSessions', prev.id), {
        tradingCapital: updated.tradingCapital,
        totalProfit: updated.totalProfit,
        totalLoss: updated.totalLoss,
        lastUpdate: serverTimestamp()
      }).catch(err => console.warn("Session financial sync failed:", err));

      return updated;
    });

    // 2. We DO NOT update tokenBalance or availableBalance here anymore.
    // Profits/Losses stay within the session until endSession is called.
    try {
      const userId = user.uid;
      
      // We still update historical stats and overall portfolio tracking for charts
      const userUpdate = {
        totalProfit: pnl > 0 ? increment(pnl) : increment(0),
        totalLoss: pnl < 0 ? increment(Math.abs(pnl)) : increment(0),
        'portfolio.todayPnL': increment(pnl),
        'portfolio.overallReturn': increment(pnl),
        lastUpdated: serverTimestamp()
      };
      await updateDoc(doc(db, 'users', userId), userUpdate);

      // Synchronize 'portfolio' collection
      try {
        await updateDoc(doc(db, 'portfolio', userId), {
          todayPnL: increment(pnl),
          overallReturn: increment(pnl),
          lastUpdated: serverTimestamp()
        });
      } catch (portErr) {}

    } catch (e) {
      console.warn("Financial balance update failed:", e);
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
  }, [user?.uid, updateProfile, addFundsToActiveBalance, logActivity, setLocalStorageItem]);

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
    console.log("[TradingEngineContext] Trading loops useEffect triggered. Session ID:", session?.id, "Status:", session?.status);
    if (!user?.uid || !session || session.status !== 'ACTIVE') {
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

        // 1. HIGH-FREQUENCY LIVE PRICES TICKER (Every 5 seconds, real API)
    tickInterval = setInterval(async () => {
      const currentSession = sessionRefVal.current;
      if (!currentSession || currentSession.status !== 'ACTIVE') {
        clearInterval(tickInterval);
        return;
      }

      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22XRPUSDT%22,%22ADAUSDT%22,%22DOGEUSDT%22%5D');
        if (res.ok) {
          const data = await res.json();
          const priceMap = {};
          data.forEach(item => {
            const asset = item.symbol.replace('USDT', '');
            priceMap[asset] = parseFloat(item.price);
          });
          
          setLiveTradePrices(prev => {
            const next = { ...prev };
            // Update open trades with real prices
            const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
            openTrades.forEach(trade => {
              if (priceMap[trade.asset]) {
                next[trade.id] = priceMap[trade.asset];
              } else {
                next[trade.id] = prev[trade.id] || trade.entry; // Fallback
              }
            });
            
            // Update general asset prices
            Object.keys(priceMap).forEach(asset => {
               next[asset] = priceMap[asset];
            });
            
            // Keep non-crypto mock fallbacks static
            const stocks = ['AAPL', 'NVDA', 'TSLA'];
            stocks.forEach(stock => {
               if (!next[stock]) next[stock] = (stock === 'AAPL' ? 172 : stock === 'NVDA' ? 120 : 180);
            });

            livePricesRef.current = next;
            return next;
          });
        }
      } catch (err) {
        console.warn("[TradingEngineContext] Failed to fetch real prices", err);
      }
    }, 5000);

    // 2. POSITION MANAGEMENT & LIFECYCLE (Every 3 seconds)
    positionInterval = setInterval(async () => {
      const currentSession = sessionRefVal.current;
      if (!userRef.current || !currentSession || currentSession.status !== 'ACTIVE') {
        clearInterval(positionInterval);
        return;
      }

      const activeConfig = configs.find(c => c.id === currentSession.activeConfigId) || configRefVal.current;
      if (!activeConfig) return;

      // Check Session Duration
      const startTime = currentSession.startTime ? (currentSession.startTime.toDate ? currentSession.startTime.toDate().getTime() : new Date(currentSession.startTime as any).getTime()) : Date.now();
      const elapsedHours = (Date.now() - startTime) / (1000 * 60 * 60);
      if (elapsedHours >= activeConfig.sessionSetup.sessionDuration) {
        console.log("[TradingEngineContext] Session duration reached. Ending session.");
        endSession();
        return;
      }
      
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      
      // Check Session-Wide Take Profit and Stop Loss
      const currentTradingCapital = currentSession.tradingCapital;
      const initialCapital = currentSession.initialCapital;
      const profitTargetPercent = activeConfig.profitRiskManagement.sessionTakeProfit;
      const lossLimitPercent = activeConfig.profitRiskManagement.sessionStopLoss;

      const currentPnLPercent = ((currentTradingCapital - initialCapital) / initialCapital) * 100;

      if (currentPnLPercent >= profitTargetPercent) {
        console.log(`[TradingEngineContext] Session Profit Target Hit (${currentPnLPercent.toFixed(2)}% >= ${profitTargetPercent}%). Ending session.`);
        if (addNotification) {
          addNotification('trading', 'medium', 'Profit Target Reached', `AI Session ended after reaching the ${profitTargetPercent}% profit target.`);
        }
        endSession();
        return;
      }

      if (currentPnLPercent <= -lossLimitPercent) {
        console.log(`[TradingEngineContext] Session Stop Loss Hit (${currentPnLPercent.toFixed(2)}% <= -${lossLimitPercent}%). Ending session.`);
        if (addNotification) {
          addNotification('trading', 'high', 'Stop Loss Reached', `AI Session ended after hitting the ${lossLimitPercent}% stop loss limit.`);
        }
        endSession();
        return;
      }

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
      const currentSession = sessionRefVal.current;
      console.log("[TradingEngineContext] runOrderLoop called");
      if (!userRef.current || !currentSession || currentSession.status !== 'ACTIVE') {
        console.log("[TradingEngineContext] runOrderLoop: aborting - user or session missing or not ACTIVE");
        clearTimeout(orderTimeout);
        return;
      }
      
      const currentTokenBalance = tokenBalanceRef.current !== undefined ? tokenBalanceRef.current : activeTradingBalanceRef.current;
      if (currentTokenBalance <= 0) {
        console.log("[TradingEngineContext] runOrderLoop: aborting - insufficient funds");
        // End the session automatically if funds run out
        endSession();
        return;
      }

      const sessionConfigId = currentSession.activeConfigId;
      const activeConfig = (configs.find(c => c.id === sessionConfigId) || configRefVal.current || configs[0] || {
        id: 'cfg_default',
        name: 'Default AI Config',
        aiTradingRules: {
          assetSelection: ['BTC', 'ETH', 'SOL'],
          tradingStrategy: 'NEURAL_MOMENTUM',
          minConfidence: 85,
          maxSimultaneousPositions: 3
        },
        profitRiskManagement: {
          maxPositionSize: 500,
          maxRiskPerTrade: 1,
          sessionTakeProfit: 5,
          sessionStopLoss: 2
        }
      }) as AiConfiguration;
      console.log("[TradingEngineContext] runOrderLoop: Using locked session config:", activeConfig.id);

      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      const currentExposure = openTrades.reduce((sum, t) => sum + (t.quantity * t.entry), 0);
      
      // Respect Max Simultaneous Positions
      const maxPositions = activeConfig.aiTradingRules?.maxSimultaneousPositions || 3;
      if (openTrades.length >= maxPositions) {
        console.log(`[TradingEngineContext] Max positions reached (${openTrades.length}/${maxPositions}), skipping scan cycle.`);
        orderTimeout = setTimeout(runOrderLoop, 10000);
        return;
      }

      const randomMarket = activeConfig.aiTradingRules.assetSelection[Math.floor(Math.random() * activeConfig.aiTradingRules.assetSelection.length)];
      if (!randomMarket) {
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

      // Prevent duplicate open trade for same asset
      if (openTrades.some(t => t.asset === randomMarket)) {
        orderTimeout = setTimeout(runOrderLoop, 8000);
        return;
      }

      const price = livePricesRef.current[randomMarket] || (randomMarket === 'BTC' ? 64200 : randomMarket === 'ETH' ? 3450 : randomMarket === 'SOL' ? 145 : randomMarket === 'AAPL' ? 172 : 125);
      
      // Generate mock market data including indicators for neural model
      const rsiVal = Math.floor(25 + Math.random() * 50);
      const mockMarketData = { 
        asset: randomMarket, 
        price, 
        rsi: rsiVal,
        timestamp: new Date().toISOString(),
        indicators: ['RSI', 'MACD', 'EMA', 'Volume Delta']
      };

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

      // Recommendation rules check (MANDATORY)
      const minRequiredConfidence = activeConfig.aiTradingRules?.minConfidence || 85;
      if (rec.confidence < minRequiredConfidence) {
        console.log(`[TradingEngineContext] Recommendation confidence (${rec.confidence}%) below threshold (${minRequiredConfidence}%), ignoring setup.`);
        orderTimeout = setTimeout(runOrderLoop, 12000);
        return;
      }

        // Execute trade after a brief delay
        setTimeout(async () => {
          if (!sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
          try {
            // Respect Max Risk Per Trade (%)
            const balance = currentSession.tradingCapital || 1000;
            const riskPercent = activeConfig.profitRiskManagement?.maxRiskPerTrade || 1;
            const riskAmount = balance * (riskPercent / 100);
            const stopDistance = Math.abs(rec.entry - rec.stopLoss);
            
            // Risk-based quantity: how many units can we lose if SL is hit?
            let quantity = stopDistance > 0 ? riskAmount / stopDistance : 0;
            
            // Respect Max Position Size ($ value)
            const maxPosSize = activeConfig.profitRiskManagement?.maxPositionSize || 500;
            const maxPosQty = maxPosSize / rec.entry;
            
            quantity = Math.min(quantity, maxPosQty);

            quantity = parseFloat(quantity.toFixed(6));
            
            if (quantity <= 0) {
              console.log("[TradingEngineContext] Calculated quantity is 0 or exceeds limits, aborting execution.");
              return;
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
  }, [user?.uid, session?.id, session?.status]);

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
  }, [user?.uid, config, logActivity]);

  const contextValue = React.useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <TradingEngineContext.Provider value={contextValue}>
      {children}
    </TradingEngineContext.Provider>
  );
};

export const useTradingEngine = () => useContext(TradingEngineContext);
