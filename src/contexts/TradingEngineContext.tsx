import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { AiConfiguration, AiTrade, AiSession } from '../types/aiTrading';
import { Position, ActivityEvent } from '../types/trading';
import { seedTraders, startTraderSimulator } from '../services/traderSimulator';
import { aiTradingService } from '../services/aiTradingService';

interface TradingEngineContextType {
  config: AiConfiguration | null;
  session: AiSession | null;
  positions: Position[];
  trades: AiTrade[];
  activity: ActivityEvent[];
  updateConfig: (newConfig: Partial<AiConfiguration>) => Promise<void>;
  logActivity: (type: string, message: string, metadata?: Record<string, any>) => Promise<void>;
  startSession: (configId: string, markets: string[]) => Promise<void>;
  endSession: () => Promise<void>;
  loading: boolean;
}

export const TradingEngineContext = createContext<TradingEngineContextType>({
  config: null,
  session: null,
  positions: [],
  trades: [],
  activity: [],
  updateConfig: async () => {},
  logActivity: async () => {},
  startSession: async () => {},
  endSession: async () => {},
  loading: true,
});

export const TradingEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AiConfiguration | null>(null);
  const [session, setSession] = useState<AiSession | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<AiTrade[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedTraders();
    const stopSimulator = startTraderSimulator();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const configRef = doc(db, 'users', user.uid, 'tradingConfig', 'default');
    const positionsRef = collection(db, 'users', user.uid, 'positions');
    const tradesRef = collection(db, 'users', user.uid, 'trades');
    const activityRef = query(collection(db, 'users', user.uid, 'activity'), orderBy('timestamp', 'desc'));
    const sessionRef = query(collection(db, 'aiSessions'), where('userId', '==', user.uid), where('status', '==', 'RUNNING'), limit(1));

    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as AiConfiguration);
      } else {
        setConfig(null); 
      }
      setLoading(false);
    });

    const unsubSession = onSnapshot(sessionRef, (snap) => {
        if (!snap.empty) {
            setSession({id: snap.docs[0].id, ...snap.docs[0].data()} as AiSession);
        } else {
            setSession(null);
        }
    });

    const unsubPositions = onSnapshot(positionsRef, (snap) => {
        setPositions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Position[]);
    });

    const unsubTrades = onSnapshot(tradesRef, (snap) => {
        setTrades(snap.docs.map(d => ({ id: d.id, ...d.data() })) as AiTrade[]);
    });

    const unsubActivity = onSnapshot(activityRef, (snap) => {
        setActivity(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ActivityEvent[]);
    });

    return () => {
      unsubConfig();
      unsubSession();
      unsubPositions();
      unsubTrades();
      unsubActivity();
      stopSimulator();
    };
  }, [user]);

  const updateConfig = useCallback(async (newConfig: Partial<AiConfiguration>) => {
    if (!user) return;
    try {
      const configRef = doc(db, 'users', user.uid, 'tradingConfig', 'default');
      await updateDoc(configRef, {
        ...newConfig,
        lastUpdated: serverTimestamp()
      });
      await logActivity('CONFIG_UPDATED', 'Configuration updated successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tradingConfig/default`);
    }
  }, [user]);

  const logActivity = useCallback(async (type: string, message: string, metadata?: Record<string, any>) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'activity'), {
            type,
            message,
            timestamp: serverTimestamp(),
            metadata: metadata || {}
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/activity`);
    }
  }, [user]);

  const startSession = useCallback(async (configId: string, markets: string[]) => {
    if (!user) return;
    try {
        await aiTradingService.startSession(user.uid, markets, configId);
        await logActivity('SESSION_STARTED', 'AI Trading Session started');
    } catch (error) {
        console.error("Failed to start session:", error);
    }
  }, [user]);

  const endSession = useCallback(async () => {
    if (!session) return;
    try {
        await aiTradingService.endSession(session.id);
        await logActivity('SESSION_ENDED', 'AI Trading Session ended');
        setSession(null);
    } catch (error) {
        console.error("Failed to end session:", error);
    }
  }, [user, session]);

  return (
    <TradingEngineContext.Provider value={{ config, session, positions, trades, activity, updateConfig, logActivity, startSession, endSession, loading }}>
      {children}
    </TradingEngineContext.Provider>
  );
};

export const useTradingEngine = () => useContext(TradingEngineContext);
