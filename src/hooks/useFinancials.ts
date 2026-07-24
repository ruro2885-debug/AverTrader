import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { doc, updateDoc, increment, serverTimestamp, collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeStorage } from '../utils/storage';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService, WalletData } from '../services/walletService';

export interface UnifiedFinancials {
  totalNetBalance: number;
  portfolioTotalNetBalance: number;
  homeNetBalance: number;
  activeTradingBalance: number;
  vaultBalance: number;
  totalHoldingsValue: number;
  aiTradingCapital: number;
  portfolioValue: number;
  cashBalance: number;
  tokenBalance: number;
}

export const useFinancials = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      try {
        const cached = localStorage.getItem(`aver_wallet_${user.uid}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn("Failed to parse cached wallet:", e);
      }
    }
    return null;
  });
  const [activeSessionCapital, setActiveSessionCapital] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      try {
        const cached = localStorage.getItem(`aver_wallet_${user.uid}`);
        if (cached) {
          setWalletData(JSON.parse(cached));
        }
      } catch (e) {}

      const unsub = walletService.subscribeWallet(user.uid, (data) => {
        if (data) {
          setWalletData(prev => {
            if (
              prev &&
              prev.portfolioBalance === data.portfolioBalance &&
              prev.availableBalance === data.availableBalance &&
              prev.vaultBalance === data.vaultBalance &&
              prev.aiTradingCapital === data.aiTradingCapital &&
              prev.portfolioValue === data.portfolioValue &&
              prev.tokenBalance === data.tokenBalance
            ) {
              return prev;
            }
            return data;
          });
        }
      });
      return () => unsub();
    } else {
      setWalletData(null);
    }
  }, [user?.uid]);

  // Listen to active AI session to get isolated capital & session equity
  useEffect(() => {
    if (user?.uid) {
      const handleSessionUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        const s = customEvent?.detail;
        if (s && s.status === 'ACTIVE') {
          const cap = s.equity !== undefined ? s.equity : (s.tradingCapital || 0);
          setActiveSessionCapital(cap);
        } else {
          setActiveSessionCapital(0);
        }
      };

      window.addEventListener('aver_session_updated', handleSessionUpdate);

      // Initialize from local storage first for instant feedback
      const localKey = `aver_session_${user.uid}`;
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) {
          const sessionData = JSON.parse(raw);
          if (sessionData && sessionData.status === 'ACTIVE') {
            const cap = sessionData.equity !== undefined ? sessionData.equity : (sessionData.tradingCapital || 0);
            setActiveSessionCapital(cap);
          }
        }
      } catch (e) {
        console.warn("Failed to parse cached session on mount:", e);
      }

      const isLocal = user.uid.startsWith('local-') || user.uid === 'guest_user';
      if (isLocal) {
        return () => {
          window.removeEventListener('aver_session_updated', handleSessionUpdate);
        };
      } else {
        const q = query(
          collection(db, 'aiSessions'),
          where('userId', '==', user.uid),
          where('status', '==', 'ACTIVE'),
          limit(1)
        );

        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const sessionData = snap.docs[0].data();
            const cap = sessionData.equity !== undefined ? sessionData.equity : (sessionData.tradingCapital || 0);
            setActiveSessionCapital(cap);
          } else {
            setActiveSessionCapital(0);
          }
        }, (err) => {
          console.warn("Firestore sessions listener failed, using local/event state:", err);
        });

        return () => {
          window.removeEventListener('aver_session_updated', handleSessionUpdate);
          unsub();
        };
      }
    }
  }, [user?.uid]);

  const financials = useMemo<UnifiedFinancials>(() => {
    // 1. Calculate total holdings value
    const totalHoldingsValue = (user?.holdings || []).reduce((sum, h) => {
      return sum + ((h.quantity || 0) * (h.currentPrice || 0));
    }, 0);

    // 2. Active trading capital (This is the isolated funds being managed by AI)
    // Prioritize active session dynamic capital when active, falling back to wallet value or 0
    const aiTradingCapital = activeSessionCapital > 0 ? activeSessionCapital : (walletData?.aiTradingCapital || 0);

    // 3. Base Cash Balance (Wallet Balance)
    // tokenBalance represents the funds available in the wallet (not locked in a session)
    // We strictly subtract aiTradingCapital if the source values are undeducted to prevent double-counting.
    let tokenBalance = 0;
    if (walletData) {
      if (walletData.tokenBalance !== undefined) {
        tokenBalance = walletData.tokenBalance;
      } else if (walletData.portfolioBalance !== undefined) {
        tokenBalance = walletData.portfolioBalance - aiTradingCapital;
      }
    } else if (user) {
      if (user.tokenBalance !== undefined) {
        tokenBalance = user.tokenBalance;
      } else if (user.portfolioBalance !== undefined) {
        tokenBalance = user.portfolioBalance - aiTradingCapital;
      } else if (user.portfolio?.totalValue !== undefined) {
        tokenBalance = user.portfolio.totalValue - aiTradingCapital;
      }
    }
    tokenBalance = Math.max(0, tokenBalance);

    // 4. Vault Balance
    const wVault = walletData?.vaultBalance || 0;
    const uVault = user?.vaultBalance || 0;
    const vaultBalance = wVault > 0 ? wVault : uVault;

    // 5. Separate Calculations for Home (Available Funds) and Portfolio (Total Funds)
    // Home Net Balance represents liquid available funds (Cash in Wallet + Vault Savings)
    const homeNetBalance = tokenBalance + vaultBalance;

    // Portfolio Total Net Balance is Wallet + Vault + Holdings + AI Trading Capital
    // Active session allocated capital is transferred out but is still part of user's total net balance!
    const portfolioTotalNetBalance = tokenBalance + vaultBalance + totalHoldingsValue + aiTradingCapital;

    // 6. Portfolio Value (Same as portfolio total net balance but often used for ROI calcs)
    const portfolioValue = portfolioTotalNetBalance;

    return {
      totalNetBalance: portfolioTotalNetBalance, // Preserve backward compatibility
      portfolioTotalNetBalance,
      homeNetBalance,
      activeTradingBalance: tokenBalance, // Wallet acts as the base trading balance when idle
      vaultBalance,
      totalHoldingsValue,
      aiTradingCapital,
      portfolioValue,
      cashBalance: tokenBalance,
      tokenBalance
    };
  }, [user?.uid, user?.portfolioBalance, user?.tokenBalance, user?.vaultBalance, user?.holdings, walletData, activeSessionCapital]);

  const updateVaultBalance = useCallback(async (newBalance: number) => {
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          vaultBalance: newBalance,
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to sync vault balance to Firestore", e);
      }
    } else {
      // Fallback for local user
      try {
        const activeLocalUserStr = localStorage.getItem('aver_active_user');
        if (activeLocalUserStr) {
          const activeLocalUser = JSON.parse(activeLocalUserStr);
          activeLocalUser.vaultBalance = newBalance;
          localStorage.setItem('aver_active_user', JSON.stringify(activeLocalUser));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.warn("Failed to update local vault balance:", e);
      }
    }

    // Immediate write-through to dedicated portfolio persistence path
    await portfolioPersistenceService.updateWalletState(uid, {
      vaultBalance: newBalance
    });
  }, [auth.currentUser, user?.uid]);

  const updateActiveBalanceOffset = useCallback(async (newOffset: number | ((prev: number) => number)) => {
    let finalOffset: number;
    const currentOffset = user?.activeOffset || 0;

    if (typeof newOffset === 'function') {
      finalOffset = newOffset(currentOffset);
    } else {
      finalOffset = newOffset;
    }
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          activeOffset: finalOffset,
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to sync active offset to Firestore", e);
      }
    } else {
      try {
        const activeLocalUserStr = localStorage.getItem('aver_active_user');
        if (activeLocalUserStr) {
          const activeLocalUser = JSON.parse(activeLocalUserStr);
          activeLocalUser.activeOffset = finalOffset;
          localStorage.setItem('aver_active_user', JSON.stringify(activeLocalUser));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.warn("Failed to update local offset:", e);
      }
    }

    await portfolioPersistenceService.updateWalletState(uid, {
      activeOffset: finalOffset
    });
  }, [auth.currentUser, user?.activeOffset, user?.uid]);

  // Helper to process a trade PnL or deposit
  const addFundsToActiveBalance = useCallback(async (amount: number, skipSync: boolean = false) => {
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    if (!skipSync && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          portfolioBalance: increment(amount),
          availableBalance: increment(amount),
          tokenBalance: increment(amount),
          'portfolio.totalValue': increment(amount),
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to sync funds addition to Firestore", e);
      }
    }

    const currentPort = user?.portfolioBalance || 0;
    const currentAvail = user?.availableBalance || 0;
    await portfolioPersistenceService.updateWalletState(uid, {
      portfolioBalance: currentPort + amount,
      availableBalance: currentAvail + amount
    });
  }, [auth.currentUser, user?.uid, user?.portfolioBalance, user?.availableBalance]);

  return {
    ...financials,
    updateVaultBalance,
    addFundsToActiveBalance,
    formatCurrency
  };
};
