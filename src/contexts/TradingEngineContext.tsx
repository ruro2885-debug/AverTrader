import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, where, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useFinancials } from '../hooks/useFinancials';
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
  liveTradePrices: Record<string, number>;
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
  liveTradePrices: {},
});

export const TradingEngineProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, updateProfile, addNotification } = useAuth();
  const { activeTradingBalance, addFundsToActiveBalance } = useFinancials();
  const [config, setConfig] = useState<AiConfiguration | null>(null);
  const [session, setSession] = useState<AiSession | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<AiTrade[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTradePrices, setLiveTradePrices] = useState<Record<string, number>>({});

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
    const sessionRef = query(collection(db, 'aiSessions'), where('userId', '==', user.uid), where('status', '==', 'ACTIVE'), limit(1));

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

  // Background Trading Simulator Loop
  const tradesRefVal = useRef<AiTrade[]>([]);
  const userRef = useRef<any>(null);
  const sessionRefVal = useRef<AiSession | null>(null);
  const livePricesRef = useRef<Record<string, number>>({});
  const configRefVal = useRef<AiConfiguration | null>(null);

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
    if (!user || !session || session.status !== 'ACTIVE') {
      return;
    }

    // 1. HIGH-FREQUENCY LIVE PRICES TICKER (Every 1 second)
    const tickInterval = setInterval(() => {
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
        return next;
      });
    }, 1000);

    // 2. POSITION MANAGEMENT & LIFECYCLE (Every 3 seconds)
    const positionInterval = setInterval(async () => {
      if (!userRef.current || !sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
      
      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      if (openTrades.length === 0) return;

      for (const trade of openTrades) {
        const livePrice = livePricesRef.current[trade.id] || trade.currentPrice;
        const pnl = (livePrice - trade.entry) * trade.quantity;
        const pnlPercent = ((livePrice - trade.entry) / trade.entry) * 100;

        const ageSec = (Date.now() - (trade.openedAt as any).toDate().getTime()) / 1000;
        
        // Take profit and stop loss checks
        const hitTakeProfit = livePrice >= trade.takeProfit;
        const hitStopLoss = livePrice <= trade.stopLoss;
        const shouldTimeout = ageSec > 180 && Math.random() > 0.95; // longer timeout for background simulation

        if (hitTakeProfit || hitStopLoss || shouldTimeout) {
          const reason = hitTakeProfit ? 'TARGET_HIT' : hitStopLoss ? 'STOP_LOSS_HIT' : 'TARGET_HIT';
          
          try {
            await aiTradingService.closeTrade(userRef.current.uid, trade.id, livePrice, reason);

            // Calculate balance updates
            const nextProfit = pnl > 0 ? parseFloat(((userRef.current.totalProfit || 0) + pnl).toFixed(2)) : (userRef.current.totalProfit || 0);
            const nextLoss = pnl < 0 ? parseFloat(((userRef.current.totalLoss || 0) + Math.abs(pnl)).toFixed(2)) : (userRef.current.totalLoss || 0);
            const nextTodayPnL = parseFloat(((userRef.current.portfolio?.todayPnL || 0) + pnl).toFixed(2));
            const nextAvailable = parseFloat(((userRef.current.availableBalance || 0) + pnl).toFixed(2));

            await addFundsToActiveBalance(pnl);

            await updateProfile({
              availableBalance: nextAvailable,
              totalProfit: nextProfit,
              totalLoss: nextLoss,
              portfolio: {
                ...userRef.current.portfolio,
                todayPnL: nextTodayPnL,
                todayPnLPercent: (nextTodayPnL / (userRef.current.portfolioBalance || 100000)) * 100
              }
            });

            // Log activity log timeline
            await logActivity(
              reason === 'TARGET_HIT' ? 'TP_HIT' : 'SL_HIT',
              `Autonomous liquidation completed for ${trade.asset}. Net returns: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%).`
            );

            // Add notification
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
    const orderInterval = setInterval(async () => {
      if (!userRef.current || !sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;

      const activeConfig = configRefVal.current || {
        markets: ['BTC', 'ETH', 'SOL'],
        riskControls: { maxSimultaneousPositions: 3 }
      };

      const openTrades = tradesRefVal.current.filter(t => t.status === 'OPEN');
      if (openTrades.length >= (activeConfig.riskControls?.maxSimultaneousPositions || 3)) {
        return;
      }

      const randomMarket = activeConfig.markets[Math.floor(Math.random() * activeConfig.markets.length)];
      if (!randomMarket) return;

      // Prevent duplicate open trade for same asset
      if (openTrades.some(t => t.asset === randomMarket)) return;

      const rsiVal = Math.floor(28 + Math.random() * 45);
      const price = livePricesRef.current[randomMarket] || (randomMarket === 'BTC' ? 64200 : randomMarket === 'ETH' ? 3450 : randomMarket === 'SOL' ? 145 : randomMarket === 'AAPL' ? 172 : 125);
      const mockMarketData = { asset: randomMarket, price, rsi: rsiVal };

      try {
        const rec = await aiTradingService.generateRecommendation(sessionRefVal.current.id, userRef.current.uid, mockMarketData, activeConfig);
        await logActivity('TRADE_OPENED', `Neural opportunity compiled for ${randomMarket} with confidence score: ${rec.confidence}%.`);

        // Execute trade after a brief delay
        setTimeout(async () => {
          if (!sessionRefVal.current || sessionRefVal.current.status !== 'ACTIVE') return;
          try {
            const quantity = parseFloat((100 / rec.entry).toFixed(4));
            await aiTradingService.executeTrade(userRef.current.uid, rec, quantity);
            
            await logActivity('COPY_TRADE', `Autonomous position established for ${randomMarket}: ${quantity} units at $${rec.entry}.`);
            
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
        }, 3000);

      } catch (ex) {
        console.error("Failed to generate autonomous background recommendation:", ex);
      }
    }, 25000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(positionInterval);
      clearInterval(orderInterval);
    };
  }, [user, session]);

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
    <TradingEngineContext.Provider value={{ config, session, positions, trades, activity, updateConfig, logActivity, startSession, endSession, loading, liveTradePrices }}>
      {children}
    </TradingEngineContext.Provider>
  );
};

export const useTradingEngine = () => useContext(TradingEngineContext);
