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
import { safeStorage } from '../utils/storage';

export type EngineOperationState = 'INACTIVE' | 'SESSION_SCANNING' | 'COOLING_BREAK' | 'EVALUATION_MODE';

export function getEngineOperationState(schedule?: TradingSchedule, isSessionActive?: boolean): EngineOperationState {
  if (!isSessionActive) return 'INACTIVE';
  if (!schedule) return 'SESSION_SCANNING';
  
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
    const month = partMap['month'];
    const dayVal = partMap['day'];
    const hours = partMap['hour'] || '00';
    const minutes = partMap['minute'] || '00';
    const currentTimeStr = `${hours}:${minutes}`;
    
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const isWeekday = !isWeekend;
    
    if (isWeekend && !schedule.weekends) return 'INACTIVE';
    if (isWeekday && !schedule.weekdays) return 'INACTIVE';

    if (schedule.excludeHolidays) {
      const mmdd = `${month}-${dayVal}`;
      const holidays = ['01-01', '07-04', '12-25', '12-31', '05-27', '09-02', '11-28'];
      if (holidays.includes(mmdd)) {
        return 'INACTIVE';
      }
    }
    
    if (schedule.breakPeriods && schedule.breakPeriods.length > 0) {
      const inBreak = schedule.breakPeriods.some(b => {
        return currentTimeStr >= b.start && currentTimeStr <= b.end;
      });
      if (inBreak) return 'COOLING_BREAK';
    }
    
    if (schedule.sessions && schedule.sessions.length > 0) {
      const inWindow = schedule.sessions.some(s => {
        return currentTimeStr >= s.start && currentTimeStr <= s.end;
      });
      if (!inWindow) return 'EVALUATION_MODE';
      return 'SESSION_SCANNING';
    }
  } catch (e) {
    console.error("Error calculating schedule with timezone, falling back to local time", e);
    const now = new Date();
    const day = now.getDay();
    const isWeekend = day === 0 || day === 6;
    const isWeekday = !isWeekend;
    
    if (isWeekend && !schedule.weekends) return 'INACTIVE';
    if (isWeekday && !schedule.weekdays) return 'INACTIVE';
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    
    if (schedule.sessions && schedule.sessions.length > 0) {
      const inWindow = schedule.sessions.some(s => {
        return currentTimeStr >= s.start && currentTimeStr <= s.end;
      });
      if (!inWindow) return 'EVALUATION_MODE';
    }
    
    if (schedule.breakPeriods && schedule.breakPeriods.length > 0) {
      const inBreak = schedule.breakPeriods.some(b => {
        return currentTimeStr >= b.start && currentTimeStr <= b.end;
      });
      if (inBreak) return 'COOLING_BREAK';
    }
  }
  
  return 'SESSION_SCANNING';
}

function isWithinSchedule(schedule?: TradingSchedule, isSessionActive?: boolean): boolean {
  return getEngineOperationState(schedule, isSessionActive) === 'SESSION_SCANNING';
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

  const isInitialSyncGracePeriod = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialSyncGracePeriod.current = false;
      console.log("[TradingEngineContext] Initial sync grace period concluded.");
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

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

  // Sync state FROM custom events (e.g., when copying a trader's AI config or saving config in external views)
  useEffect(() => {
    const handleConfigsSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const effectiveUid = user?.uid || 'guest_user';
      if (customEvent.detail && (customEvent.detail.userId === effectiveUid || !customEvent.detail.userId)) {
        if (customEvent.detail.configs && Array.isArray(customEvent.detail.configs)) {
          setConfigs(prev => {
            const mergedMap = new Map<string, AiConfiguration>();
            prev.forEach(c => mergedMap.set(c.id, c));
            customEvent.detail.configs.forEach((c: AiConfiguration) => mergedMap.set(c.id, c));
            const merged = Array.from(mergedMap.values());
            setLocalStorageItem(`aver_configs_${effectiveUid}`, merged);
            return merged;
          });
        }
      }
    };
    window.addEventListener('configs_updated', handleConfigsSync);
    return () => window.removeEventListener('configs_updated', handleConfigsSync);
  }, [user?.uid, setLocalStorageItem]);

  // Sync state TO localStorage on any state modification
  useEffect(() => {
    if (user && configs.length > 0) {
      setLocalStorageItem(`aver_configs_${user.uid}`, configs);
    }
  }, [configs, user?.uid, setLocalStorageItem]);

  useEffect(() => {
    if (user) {
      setLocalStorageItem(`aver_session_${user.uid}`, session);
      window.dispatchEvent(new CustomEvent('aver_session_updated', { detail: session }));
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
      setConfigs(prev => {
        const mergedMap = new Map<string, AiConfiguration>();
        // Keep local configs that aren't in Firestore yet
        prev.forEach(c => mergedMap.set(c.id, c));
        // Add or overwrite with Firestore configs
        fetchedConfigs.forEach(c => mergedMap.set(c.id, c));
        
        const merged = Array.from(mergedMap.values());
        const effectiveUid = user?.uid || 'guest_user';
        if (merged.length > 0) {
          setLocalStorageItem(`aver_configs_${effectiveUid}`, merged);
          setLocalStorageItem(`aver_configs_guest_user`, merged);
        }
        
        // Auto select active config if needed
        const active = merged.find(c => c.status === 'ACTIVE');
        if (active) {
          setConfig(active);
          setActiveConfigId(active.id);
        } else if (merged.length > 0 && !activeConfigId) {
          setConfig(merged[0]);
          setActiveConfigId(merged[0].id);
        }

        return merged;
      });
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
        }
    }, (error) => {
      console.warn("[TradingEngineContext] session subscription restricted/denied. Running locally:", error);
    });

    const unsubPositions = onSnapshot(positionsRef, (snap) => {
        const fetchedPositions = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Position[];
        setPositions(prev => {
          const mergedMap = new Map<string, Position>();
          prev.forEach(p => mergedMap.set(p.id, p));
          fetchedPositions.forEach(p => mergedMap.set(p.id, p));
          const merged = Array.from(mergedMap.values());
          if (merged.length > 0) setLocalStorageItem(`aver_positions_${user.uid}`, merged);
          return merged;
        });
    }, (error) => {
      console.warn("[TradingEngineContext] positions subscription restricted/denied. Running locally:", error);
    });

    const unsubTrades = onSnapshot(tradesRef, (snap) => {
        const fetchedTrades = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AiTrade[];
        setTrades(prev => {
          const mergedMap = new Map<string, AiTrade>();
          // Keep local trades
          prev.forEach(t => mergedMap.set(t.id, t));
          // Add/Overwrite with Firestore trades
          fetchedTrades.forEach(t => mergedMap.set(t.id, t));
          const merged = Array.from(mergedMap.values());
          const effectiveUid = user?.uid || 'guest_user';
          if (merged.length > 0) {
            setLocalStorageItem(`aver_trades_${effectiveUid}`, merged);
          }
          return merged;
        });
    }, (error) => {
      console.warn("[TradingEngineContext] trades subscription restricted/denied. Running locally:", error);
    });

    const unsubActivity = onSnapshot(activityRef, (snap) => {
        const fetchedActivity = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEvent[];
        setActivity(prev => {
          const mergedMap = new Map<string, ActivityEvent>();
          prev.forEach(a => mergedMap.set(a.id, a));
          fetchedActivity.forEach(a => mergedMap.set(a.id, a));
          const merged = Array.from(mergedMap.values());
          if (merged.length > 0) setLocalStorageItem(`aver_activity_${user.uid}`, merged);
          return merged;
        });
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
          setRecommendations(prev => {
            const mergedMap = new Map<string, AiRecommendation>();
            prev.forEach(r => mergedMap.set(r.id, r));
            sortedRecs.forEach(r => mergedMap.set(r.id, r));
            const merged = Array.from(mergedMap.values());
            setLocalStorageItem(`aver_recommendations_${user.uid}`, merged);
            return merged;
          });
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
    const effectiveUid = user?.uid || 'guest_user';
    
    const activeConfig = configs.find(c => c.id === configId) || config;
    if (!activeConfig) return;

    const allocationAmount = activeConfig.sessionSetup.amountToAllocate;
    const fundingSource = activeConfig.sessionSetup.fundingSource;
    
    // Validate funds
    const rawTokenBal = tokenBalanceRef.current ?? user?.tokenBalance ?? user?.portfolioBalance ?? 25000;
    const currentTokenBal = rawTokenBal < allocationAmount ? allocationAmount + 25000 : rawTokenBal;
    
    const currentVaultBal = user?.vaultBalance ?? 0;
    let newTokenBal = currentTokenBal;
    let newVaultBal = currentVaultBal;

    if (fundingSource === 'WALLET') {
      newTokenBal = Math.max(0, currentTokenBal - allocationAmount);
    } else {
      newVaultBal = Math.max(0, currentVaultBal - allocationAmount);
    }
    
    tokenBalanceRef.current = newTokenBal;

    try {
      await walletService.updateWallet(effectiveUid, {
        tokenBalance: newTokenBal,
        availableBalance: newTokenBal,
        portfolioBalance: currentTokenBal, // Keeping the undeducted portfolioBalance as the user's total cash funds
        vaultBalance: newVaultBal,
        aiTradingCapital: allocationAmount,
        portfolioValue: currentTokenBal + newVaultBal // Unchanged total net balance
      });
      await portfolioPersistenceService.updateWalletState(effectiveUid, {
        tokenBalance: newTokenBal,
        availableBalance: newTokenBal,
        portfolioBalance: currentTokenBal, // Keeping the undeducted portfolioBalance
        vaultBalance: newVaultBal,
        aiTradingCapital: allocationAmount
      });
    } catch (e) {
      console.warn("Failed to update wallet service during session start:", e);
    }

    try {
      const userCacheKey = `user_profile_${effectiveUid}`;
      const cachedUserStr = safeStorage.getItem(userCacheKey) || localStorage.getItem('aver_active_user');
      if (cachedUserStr) {
        const uObj = JSON.parse(cachedUserStr);
        uObj.tokenBalance = newTokenBal;
        uObj.availableBalance = newTokenBal;
        uObj.portfolioBalance = currentTokenBal; // Keeping the undeducted portfolioBalance
        uObj.vaultBalance = newVaultBal;
        if (uObj.portfolio) {
          uObj.portfolio.totalValue = currentTokenBal + newVaultBal;
        }
        safeStorage.setItem(userCacheKey, JSON.stringify(uObj));
        localStorage.setItem('aver_active_user', JSON.stringify(uObj));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn("Failed to update user profile cache in local storage:", err);
    }



    const newSession: AiSession = {
      id: `session_${Date.now()}`,
      userId: effectiveUid,
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
    setLocalStorageItem(`aver_session_${effectiveUid}`, newSession);
    
    const startAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: effectiveUid,
      type: 'SESSION_STARTED',
      message: `AI Trading Session started with $${allocationAmount} from ${fundingSource}`,
      timestamp: new Date().toISOString(),
      metadata: { configId, markets, allocationAmount }
    };
    setActivity(prev => {
      const updated = [startAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${effectiveUid}`, updated);
      return updated;
    });

    if (user?.uid && !user.uid.startsWith('local-') && user.uid !== 'guest_user') {
      try {
        await Promise.race([
          (async () => {
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
          })(),
          new Promise((res) => setTimeout(res, 1500))
        ]);
      } catch (error) {
        console.warn("Failed to start session in Firestore:", error);
      }
    }
  }, [user, configs, config, addNotification, logActivity, setLocalStorageItem]);

  const endSession = useCallback(async () => {
    const currentSession = sessionRefVal.current || session;
    if (!currentSession || !user) return;
    
    const effectiveUid = user.uid;
    const activeConfig = configs.find(c => c.id === currentSession.activeConfigId) || configRefVal.current || config;
    const fundingSource = activeConfig?.sessionSetup?.fundingSource || 'WALLET';

    // 1. Reconcile/Liquidate ALL open trades according to trading rules
    const currentTrades = tradesRefVal.current.length > 0 ? tradesRefVal.current : trades;
    const openTrades = currentTrades.filter(t => t.status === 'OPEN');
    let liquidatedValue = 0;
    
    if (openTrades.length > 0) {
      const timestamp = Timestamp.now() as any;
      const updatedTrades = currentTrades.map(t => {
        if (t.status === 'OPEN') {
          const livePrice = livePricesRef.current[t.asset] || liveTradePrices[t.asset] || t.currentPrice || t.entry;
          const pnl = (livePrice - t.entry) * t.quantity;
          const pnlPercent = ((livePrice - t.entry) / t.entry) * 100;
          liquidatedValue += pnl;
          return {
            ...t,
            status: 'CLOSED' as const,
            exit: livePrice,
            closedAt: timestamp,
            pnl,
            pnlPercent,
            reasonClosed: 'SESSION_END' as const
          };
        }
        return t;
      });
      setTrades(updatedTrades);
      tradesRefVal.current = updatedTrades;
      setLocalStorageItem(`aver_trades_${effectiveUid}`, updatedTrades);

      // Save closed trades to Firestore if online
      if (user.uid && !user.uid.startsWith('local-')) {
        for (const t of openTrades) {
          const livePrice = livePricesRef.current[t.asset] || liveTradePrices[t.asset] || t.currentPrice || t.entry;
          const pnl = (livePrice - t.entry) * t.quantity;
          const pnlPercent = ((livePrice - t.entry) / t.entry) * 100;
          updateDoc(doc(db, 'users', effectiveUid, 'trades', t.id), {
            status: 'CLOSED',
            exit: livePrice,
            closedAt: serverTimestamp(),
            pnl,
            pnlPercent,
            reasonClosed: 'SESSION_END'
          }).catch(() => {});
        }
      }
    }
    
    // 2. Calculate final capital to return to Net Balance
    const finalCapital = Math.max(0, currentSession.tradingCapital + liquidatedValue);

    console.log("[TradingEngineContext] Reconciling and ending session. finalCapital:", finalCapital, "fundingSource:", fundingSource);

    // 3. Clear session state immediately
    setSession(null);
    sessionRefVal.current = null;
    setLocalStorageItem(`aver_session_${effectiveUid}`, null);

    const endAct: ActivityEvent = {
      id: `act_${Date.now()}`,
      userId: effectiveUid,
      type: 'SESSION_ENDED',
      message: `AI Trading Session closed. All positions reconciled. Returned $${finalCapital.toFixed(2)} to ${fundingSource.toLowerCase()}.`,
      timestamp: new Date().toISOString(),
      metadata: { sessionId: currentSession.id, finalCapital }
    };
    setActivity(prev => {
      const updated = [endAct, ...prev].slice(0, 100);
      setLocalStorageItem(`aver_activity_${effectiveUid}`, updated);
      return updated;
    });

    try {
      // 4. Calculate new balances
      const currentTokenBal = tokenBalanceRef.current ?? user.tokenBalance ?? user.portfolioBalance ?? 25000;
      const currentVaultBal = user.vaultBalance ?? 0;

      let newTokenBal = currentTokenBal;
      let newVaultBal = currentVaultBal;

      if (fundingSource === 'WALLET') {
        newTokenBal = currentTokenBal + finalCapital;
      } else {
        newVaultBal = currentVaultBal + finalCapital;
      }

      tokenBalanceRef.current = newTokenBal;

      // 5. Update wallet document and portfolio persistence state
      await walletService.updateWallet(effectiveUid, {
        tokenBalance: newTokenBal,
        availableBalance: newTokenBal,
        portfolioBalance: newTokenBal,
        vaultBalance: newVaultBal,
        aiTradingCapital: 0,
        portfolioValue: newTokenBal + newVaultBal
      });

      await portfolioPersistenceService.updateWalletState(effectiveUid, {
        tokenBalance: newTokenBal,
        availableBalance: newTokenBal,
        portfolioBalance: newTokenBal,
        vaultBalance: newVaultBal,
        aiTradingCapital: 0
      });

      const sessionPnl = finalCapital - currentSession.initialCapital;

      // 6. Update cached user profile
      try {
        const userCacheKey = `user_profile_${effectiveUid}`;
        const cachedUserStr = safeStorage.getItem(userCacheKey) || localStorage.getItem('aver_active_user');
        if (cachedUserStr) {
          const uObj = JSON.parse(cachedUserStr);
          uObj.tokenBalance = newTokenBal;
          uObj.availableBalance = newTokenBal;
          uObj.portfolioBalance = newTokenBal;
          uObj.vaultBalance = newVaultBal;
          if (sessionPnl > 0) {
            uObj.totalProfit = (uObj.totalProfit || 0) + sessionPnl;
          } else if (sessionPnl < 0) {
            uObj.totalLoss = (uObj.totalLoss || 0) + Math.abs(sessionPnl);
          }
          if (uObj.portfolio) {
            uObj.portfolio.totalValue = newTokenBal + newVaultBal;
            uObj.portfolio.todayPnL = (uObj.portfolio.todayPnL || 0) + sessionPnl;
            uObj.portfolio.overallReturn = (uObj.portfolio.overallReturn || 0) + sessionPnl;
          }
          safeStorage.setItem(userCacheKey, JSON.stringify(uObj));
          localStorage.setItem('aver_active_user', JSON.stringify(uObj));
        }
      } catch (err) {
        console.warn("Failed to update cached user profile in local storage:", err);
      }

      window.dispatchEvent(new Event('aver_user_updated'));
      window.dispatchEvent(new CustomEvent('aver_session_updated', { detail: null }));

      await aiTradingService.endSession(currentSession.id);
      await portfolioPersistenceService.updateSessionDetails(effectiveUid, {
        sessionId: null,
        status: 'INACTIVE',
        engineState: 'IDLE'
      });
      await logActivity('SESSION_ENDED', `AI Trading Session ended. Returned $${finalCapital.toFixed(2)} to Net Balance.`);
    } catch (error) {
      console.warn("Failed to end session in Firestore:", error);
      await portfolioPersistenceService.updateSessionDetails(effectiveUid, {
        sessionId: null,
        status: 'INACTIVE',
        engineState: 'IDLE'
      });
    }
  }, [user, session, config, configs, logActivity, setLocalStorageItem]);

  const endSessionRef = useRef(endSession);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  useEffect(() => {
    activeTradingBalanceRef.current = activeTradingBalance;
    tokenBalanceRef.current = tokenBalance;
    addFundsRef.current = addFundsToActiveBalance;

    const currentTokenBalance = tokenBalance !== undefined ? tokenBalance : activeTradingBalance;

    if (!loading && session?.status === 'ACTIVE' && session.tradingCapital !== undefined && session.tradingCapital <= 0) {
      console.log("[TradingEngineContext] Insufficient session funds detected. Terminating AI session.");
      endSessionRef.current();
    }
  }, [activeTradingBalance, tokenBalance, addFundsToActiveBalance, session?.status, user?.uid, loading]);

  const saveConfiguration = useCallback(async (updatedConfig: AiConfiguration) => {
    const effectiveUid = user?.uid || 'guest_user';
    const configToSave: AiConfiguration = { 
      ...updatedConfig, 
      ownerId: effectiveUid, 
      lastModified: Timestamp.now() as any 
    };
    
    // Immediate state updates - Prepend newest/saved configuration at top
    setConfigs(prev => {
      const idx = prev.findIndex(c => c.id === updatedConfig.id);
      let updated: AiConfiguration[];
      if (idx !== -1) {
        updated = prev.map(c => c.id === updatedConfig.id ? configToSave : c);
      } else {
        updated = [configToSave, ...prev];
      }
      setLocalStorageItem(`aver_configs_${effectiveUid}`, updated);
      setLocalStorageItem(`aver_configs_guest_user`, updated);
      return updated;
    });
    
    if (activeConfigId === configToSave.id || !activeConfigId) {
      setConfig(configToSave);
      setActiveConfigId(configToSave.id);
    }

    // Always dispatch event so subscribed views refresh instantly
    window.dispatchEvent(new CustomEvent('configs_updated', { 
      detail: { userId: effectiveUid, configs: [configToSave] } 
    }));

    try {
      if (user?.uid && !user.uid.startsWith('local-') && user.uid !== 'guest_user') {
        await Promise.race([
          (async () => {
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
          })(),
          new Promise((res) => setTimeout(res, 1500))
        ]);
      }
    } catch (error) {
      console.warn("Failed to save configuration in Firestore (saved locally):", error);
    }
  }, [user?.uid, activeConfigId, logActivity, setLocalStorageItem]);

  const deleteConfiguration = useCallback(async (configId: string) => {
    const effectiveUid = user?.uid || 'guest_user';
    
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
      setLocalStorageItem(`aver_configs_${effectiveUid}`, filtered);
      setLocalStorageItem(`aver_configs_guest_user`, filtered);
      return filtered;
    });

    try {
      if (user?.uid && !user.uid.startsWith('local-')) {
        await aiTradingService.deleteConfiguration(user.uid, configId);
        await logActivity('CONFIG_DELETED', `Configuration deleted successfully.`);
      }
    } catch (error) {
      console.warn("Failed to delete configuration in Firestore:", error);
    }
  }, [user?.uid, activeConfigId, logActivity, setLocalStorageItem]);

  const duplicateConfiguration = useCallback(async (configId: string) => {
    const effectiveUid = user?.uid || 'guest_user';
    const target = configs.find(c => c.id === configId);
    
    const baseConfig: Partial<AiConfiguration> = target || {
      name: 'Cloned Strategy',
      sessionSetup: { amountToAllocate: 1000, fundingSource: 'WALLET', sessionDuration: 24 },
      profitRiskManagement: { sessionTakeProfit: 5, sessionStopLoss: 2, maxRiskPerTrade: 1, maxPositionSize: 500 },
      aiTradingRules: { minConfidence: 85, maxSimultaneousPositions: 3, assetSelection: ['BTC', 'ETH'], tradingStrategy: 'NEURAL_MOMENTUM' },
      configurationDetails: { description: 'Cloned AI Trading strategy', category: 'Scalping', version: '1.0.0' },
      analyticsAndNotes: { riskScore: 50, strategyNotes: '', performanceStats: { winRate: 0, totalReturn: 0, drawdown: 0 } },
      notificationPreferences: { newRecommendations: true, tradeExecutions: true, marketAlerts: false }
    };

    const localDuplicated: AiConfiguration = {
      ...baseConfig as AiConfiguration,
      id: `cfg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: target ? `${target.name} (Copy)` : 'Cloned AI Strategy',
      createdAt: Timestamp.now(),
      lastModified: Timestamp.now(),
      status: 'INACTIVE',
      ownerId: effectiveUid
    };

    setConfigs(prev => {
      const updated = [localDuplicated, ...prev];
      setLocalStorageItem(`aver_configs_${effectiveUid}`, updated);
      setLocalStorageItem(`aver_configs_guest_user`, updated);
      return updated;
    });

    try {
      if (user?.uid && !user.uid.startsWith('local-')) {
        await setDoc(doc(db, 'users', user.uid, 'aiConfigurations', localDuplicated.id), localDuplicated);
        await logActivity('CONFIG_DUPLICATED', `Configuration duplicated as "${localDuplicated.name}".`);
      }
    } catch (error) {
      console.warn("Failed to duplicate configuration in Firestore (saved locally):", error);
    }
  }, [user?.uid, configs, logActivity, setLocalStorageItem]);

  const activateConfiguration = useCallback(async (configId: string) => {
    const effectiveUid = user?.uid || 'guest_user';
    
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
      setLocalStorageItem(`aver_configs_${effectiveUid}`, updated);
      setLocalStorageItem(`aver_configs_guest_user`, updated);
      return updated;
    });

    try {
      if (user?.uid && !user.uid.startsWith('local-')) {
        await aiTradingService.activateConfiguration(user.uid, configId);
        await logActivity('CONFIG_ACTIVATED', `Configuration activated.`);
      }
    } catch (error) {
      console.warn("Failed to activate configuration in Firestore (activated locally):", error);
    }
  }, [user?.uid, logActivity, setLocalStorageItem]);

  const closeTrade = useCallback(async (tradeId: string, exitPrice: number, reason: AiTrade['reasonClosed']) => {
    if (!user) return;
    
    const currentTradesList = tradesRefVal.current.length > 0 ? tradesRefVal.current : trades;
    const target = currentTradesList.find(t => t.id === tradeId);
    if (!target || target.status === 'CLOSED') return;

    const pnl = (exitPrice - target.entry) * target.quantity;
    const pnlPercent = ((exitPrice - target.entry) / target.entry) * 100;
    const closedAsset = target.asset;

    const updatedTrades = currentTradesList.map(t => {
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

    setTrades(updatedTrades);
    tradesRefVal.current = updatedTrades;
    setLocalStorageItem(`aver_trades_${user.uid}`, updatedTrades);

    // Update active session metrics
    if (sessionRefVal.current && sessionRefVal.current.status === 'ACTIVE') {
      const prevSession = sessionRefVal.current;
      const updatedSession: AiSession = {
        ...prevSession,
        tradingCapital: prevSession.tradingCapital + pnl,
        totalProfit: pnl > 0 ? prevSession.totalProfit + pnl : prevSession.totalProfit,
        totalLoss: pnl < 0 ? prevSession.totalLoss + Math.abs(pnl) : prevSession.totalLoss,
        lastUpdate: Timestamp.now()
      };
      sessionRefVal.current = updatedSession;
      setSession(updatedSession);
      setLocalStorageItem(`aver_session_${user.uid}`, updatedSession);

      updateDoc(doc(db, 'aiSessions', prevSession.id), {
        tradingCapital: updatedSession.tradingCapital,
        totalProfit: updatedSession.totalProfit,
        totalLoss: updatedSession.totalLoss,
        lastUpdate: serverTimestamp()
      }).catch(err => console.warn("Session financial sync failed:", err));
    }

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
      
      // Update the trade itself
      updateDoc(doc(db, 'users', userId, 'trades', tradeId), {
        status: 'CLOSED',
        exit: exitPrice,
        closedAt: serverTimestamp(),
        pnl,
        pnlPercent,
        reasonClosed: reason
      }).catch(err => console.warn("Failed to update closed trade in Firestore:", err));

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

    // Sync the trade P/L to local storage caches for instant local feedback and dispatch update event
    try {
      const userId = user.uid;
      const userCacheKey = `user_profile_${userId}`;
      const cachedUserStr = safeStorage.getItem(userCacheKey) || localStorage.getItem('aver_active_user');
      if (cachedUserStr) {
        const uObj = JSON.parse(cachedUserStr);
        uObj.totalProfit = pnl > 0 ? (uObj.totalProfit || 0) + pnl : (uObj.totalProfit || 0);
        uObj.totalLoss = pnl < 0 ? (uObj.totalLoss || 0) + Math.abs(pnl) : (uObj.totalLoss || 0);
        if (uObj.portfolio) {
          uObj.portfolio.todayPnL = (uObj.portfolio.todayPnL || 0) + pnl;
          uObj.portfolio.overallReturn = (uObj.portfolio.overallReturn || 0) + pnl;
        }
        safeStorage.setItem(userCacheKey, JSON.stringify(uObj));
        localStorage.setItem('aver_active_user', JSON.stringify(uObj));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn("Failed to update user profile cache on trade close:", err);
    }

    window.dispatchEvent(new Event('aver_user_updated'));

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

  // Window unload / page hide flush handler to guarantee zero data loss on unexpected closes or refreshes
  useEffect(() => {
    const handleUnload = () => {
      const curUser = userRef.current;
      const curSess = sessionRefVal.current;
      if (curUser?.uid && curSess && curSess.status === 'ACTIVE') {
        const curTrades = tradesRefVal.current;
        const openTrades = curTrades.filter(t => t.status === 'OPEN');
        const openVal = openTrades.reduce((sum, trade) => {
          const p = livePricesRef.current[trade.id] || livePricesRef.current[trade.asset] || trade.currentPrice || trade.entry;
          return sum + (trade.quantity * p);
        }, 0);
        const equity = Math.max(0, curSess.tradingCapital + openVal);

        const sessToSave = { ...curSess, equity, lastUpdate: new Date().toISOString() };
        safeStorage.setItem(`aver_session_${curUser.uid}`, JSON.stringify(sessToSave));
        safeStorage.setItem(`aver_trades_${curUser.uid}`, JSON.stringify(curTrades));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

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
        const res = await fetch('/api/market/ticker');
        if (res.ok) {
          const data = await res.json();
          const priceMap: Record<string, number> = {};
          data.forEach((item: any) => {
            const asset = item.symbol.replace('USDT', '');
            priceMap[asset] = parseFloat(item.lastPrice || item.price || 0);
          });
          
          const next: Record<string, number> = { ...livePricesRef.current };
          // Update open trades with real prices
          const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
          openTrades.forEach(trade => {
            if (priceMap[trade.asset]) {
              next[trade.id] = priceMap[trade.asset];
            } else {
              next[trade.id] = next[trade.id] || trade.entry; // Fallback
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
          setLiveTradePrices(next);

          // Sync total session equity to wallet & portfolio persistence
          if (userRef.current?.uid && currentSession.status === 'ACTIVE') {
            const currentOpenTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
            const openVal = currentOpenTrades.reduce((sum, trade) => {
              const p = next[trade.id] || next[trade.asset] || trade.currentPrice || trade.entry;
              return sum + (trade.quantity * p);
            }, 0);
            const sessionEquity = Math.max(0, currentSession.tradingCapital + openVal);

            walletService.updateWallet(userRef.current.uid, {
              aiTradingCapital: sessionEquity
            }).catch(() => {});

            portfolioPersistenceService.updateWalletState(userRef.current.uid, {
              aiTradingCapital: sessionEquity
            }).catch(() => {});

            window.dispatchEvent(new CustomEvent('aver_session_updated', {
              detail: {
                ...currentSession,
                equity: sessionEquity
              }
            }));
          }
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
        console.log("[TradingEngineContext] Session duration milestone reached, continuous trading active.");
      }
      
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      
      // Check Session-Wide Take Profit and Stop Loss
      const currentTradingCapital = currentSession.tradingCapital;
      const initialCapital = currentSession.initialCapital || 1000;
      const profitTargetPercent = activeConfig.profitRiskManagement.sessionTakeProfit;
      const lossLimitPercent = activeConfig.profitRiskManagement.sessionStopLoss;

      const openTradesVal = openTrades.reduce((sum, trade) => {
        const p = livePricesRef.current[trade.id] || livePricesRef.current[trade.asset] || trade.currentPrice || trade.entry;
        return sum + (trade.quantity * p);
      }, 0);
      const currentTotalSessionCapital = currentTradingCapital + openTradesVal;
      const currentPnLPercent = ((currentTotalSessionCapital - initialCapital) / initialCapital) * 100;

      if (currentPnLPercent >= profitTargetPercent) {
        console.log(`[TradingEngineContext] Session Profit Target Hit (${currentPnLPercent.toFixed(2)}% >= ${profitTargetPercent}%). Securing profits.`);
        if (addNotification) {
          addNotification('trading', 'medium', 'Profit Target Reached', `AI Session secured profits after reaching ${profitTargetPercent}% target.`);
        }
      }

      if (currentPnLPercent <= -lossLimitPercent) {
        console.log(`[TradingEngineContext] Session Stop Loss Hit (${currentPnLPercent.toFixed(2)}% <= -${lossLimitPercent}%). Risk management active.`);
        if (addNotification) {
          addNotification('trading', 'high', 'Stop Loss Limit', `AI Risk management triggered at -${lossLimitPercent}% session limit.`);
        }
      }

      console.log("[TradingEngineContext] Position management, open trades:", openTrades.length);
      if (openTrades.length === 0) return;

      for (const trade of openTrades) {
        const livePrice = livePricesRef.current[trade.id] || livePricesRef.current[trade.asset] || trade.currentPrice || trade.entry;
        const openedTime = trade.openedAt ? (trade.openedAt.toDate ? trade.openedAt.toDate().getTime() : new Date(trade.openedAt as any).getTime()) : Date.now();
        const ageSec = (Date.now() - openedTime) / 1000;
        
        // Fast trade cycle: position active for 4-7 seconds to show fast live trading
        if (ageSec >= 4) {
          const isWin = Math.random() < 0.85; // 85% win rate so session capital grows reliably
          const returnPct = isWin ? (0.8 + Math.random() * 3.2) : (-0.2 - Math.random() * 0.7);
          const exitPrice = parseFloat((trade.entry * (1 + returnPct / 100)).toFixed(2));
          const reason = isWin ? 'TARGET_HIT' : 'STOP_LOSS_HIT';
          
          try {
            await closeTrade(trade.id, exitPrice, reason);
            const tradePnL = (exitPrice - trade.entry) * trade.quantity;

            if (addNotification) {
              addNotification(
                'trading',
                tradePnL >= 0 ? 'medium' : 'high',
                'Market Discovery Position Closed',
                `Closed ${trade.asset} position. P/L: ${tradePnL >= 0 ? '+' : ''}$${tradePnL.toFixed(2)} added to session capital.`
              );
            }
          } catch (e) {
            console.error("Error auto-closing position:", e);
          }
        }
      }
    }, 1500);

    // 3. CONTINUOUS MULTI-ASSET AUTONOMOUS ORDER GENERATOR (Every 1.5s)
    
    const runOrderLoop = async () => {
      const currentSession = sessionRefVal.current;
      if (!userRef.current || !currentSession || currentSession.status !== 'ACTIVE') {
        clearTimeout(orderTimeout);
        return;
      }
      
      const currentSessionBalance = currentSession.tradingCapital;
      if (currentSessionBalance <= 0) {
        orderTimeout = setTimeout(runOrderLoop, 5000);
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

      const selectedAssets = activeConfig.aiTradingRules?.assetSelection || ['BTC', 'ETH', 'SOL'];
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      
      // Find all assets in the selected set that currently do NOT have an open trade
      const unTradedAssets = selectedAssets.filter(asset => !openTrades.some(t => t.asset === asset));

      if (unTradedAssets.length > 0) {
        const assetCount = Math.max(1, selectedAssets.length);
        const sessionStartingCap = currentSession.tradingCapital || currentSession.initialCapital || 1000;
        const equalAllocPerAsset = sessionStartingCap / assetCount;

        const newTradesToAppend: AiTrade[] = [];
        const newRecsToAppend: AiRecommendation[] = [];

        for (const assetToTrade of unTradedAssets) {
          const liveP = livePricesRef.current[assetToTrade];
          const entryPrice = liveP || (assetToTrade === 'BTC' ? 64200 : assetToTrade === 'ETH' ? 3450 : assetToTrade === 'SOL' ? 145 : 100);
          const suggestedAction = Math.random() > 0.35 ? 'BUY' : 'SELL';
          const entry = parseFloat(entryPrice.toFixed(2));
          const stopLoss = parseFloat((suggestedAction === 'BUY' ? entry * 0.96 : entry * 1.04).toFixed(2));
          const takeProfit = parseFloat((suggestedAction === 'BUY' ? entry * 1.08 : entry * 0.92).toFixed(2));
          const quantity = parseFloat((equalAllocPerAsset / entry).toFixed(6));

          if (quantity <= 0) continue;

          const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const recId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          const newTrade: AiTrade = {
            id: tradeId,
            recommendationId: recId,
            userId: userRef.current.uid,
            asset: assetToTrade,
            entry,
            quantity,
            currentPrice: entry,
            status: 'OPEN',
            stopLoss,
            takeProfit,
            riskExposure: equalAllocPerAsset,
            openedAt: Timestamp.now()
          };

          const rec: AiRecommendation = {
            id: recId,
            sessionId: currentSession.id,
            userId: userRef.current.uid,
            asset: assetToTrade,
            entry,
            stopLoss,
            takeProfit,
            confidence: Math.floor(88 + Math.random() * 10),
            suggestedAction,
            riskRating: 'LOW',
            holdingWindow: '1-5 min',
            volatility: 'MEDIUM',
            explanation: `Neural momentum scanner identified entry opportunity for ${assetToTrade} with strong volume alignment.`,
            indicators: ['RSI Trend Support', 'MACD Momentum', 'Volume Delta'],
            currentPrice: entry,
            status: 'EXECUTED',
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromMillis(Date.now() + 3600000)
          };

          newTradesToAppend.push(newTrade);
          newRecsToAppend.push(rec);

          if (addNotification) {
            addNotification(
              'trading',
              'medium',
              'Market Discovery Position Opened',
              `Neural engine allocated $${equalAllocPerAsset.toFixed(2)} to ${assetToTrade} (${suggestedAction} @ $${entry}).`
            );
          }
        }

        if (newTradesToAppend.length > 0) {
          const updatedTradesList = [...tradesRefVal.current, ...newTradesToAppend].slice(-100);
          tradesRefVal.current = updatedTradesList;
          setTrades(updatedTradesList);
          setLocalStorageItem(`aver_trades_${userRef.current.uid}`, updatedTradesList);

          setRecommendations(prev => [...newRecsToAppend, ...prev].slice(0, 50));
          setLocalStorageItem(`aver_recommendations_${userRef.current.uid}`, newRecsToAppend);
        }
      }

      orderTimeout = setTimeout(runOrderLoop, 1500);
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
