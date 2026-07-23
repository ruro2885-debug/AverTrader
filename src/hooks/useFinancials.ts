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
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [activeSessionCapital, setActiveSessionCapital] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      const unsub = walletService.subscribeWallet(user.uid, (data) => {
        if (data) {
          setWalletData(prev => {
            if (
              prev &&
              prev.portfolioBalance === data.portfolioBalance &&
              prev.availableBalance === data.availableBalance &&
              prev.vaultBalance === data.vaultBalance &&
              prev.aiTradingCapital === data.aiTradingCapital &&
              prev.portfolioValue === data.portfolioValue
            ) {
              return prev;
            }
            return data;
          });
        }
      });
      return () => unsub();
    }
  }, [user?.uid]);

  // Listen to active AI session to get isolated capital
  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'aiSessions'),
        where('userId', '==', user.uid),
        where('status', '==', 'ACTIVE'),
        limit(1)
      );

      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const sessionData = snap.docs[0].data();
          setActiveSessionCapital(sessionData.tradingCapital || 0);
        } else {
          setActiveSessionCapital(0);
        }
      });

      return () => unsub();
    }
  }, [user?.uid]);

  const financials = useMemo<UnifiedFinancials>(() => {
    // 1. Calculate total holdings value
    const totalHoldingsValue = (user?.holdings || []).reduce((sum, h) => {
      return sum + ((h.quantity || 0) * (h.currentPrice || 0));
    }, 0);

    // 2. Base Cash Balance (Wallet Balance)
    // tokenBalance represents the funds available in the wallet (not locked in a session)
    const tokenBalance = walletData?.tokenBalance ?? user?.tokenBalance ?? user?.portfolioBalance ?? 0;
    
    // 3. Active trading capital (This is the isolated funds being managed by AI)
    const aiTradingCapital = activeSessionCapital;

    // 4. Vault Balance
    const vaultBalance = walletData?.vaultBalance ?? user?.vaultBalance ?? 0;

    // 5. Total Net Balance is Wallet + Active Session + Vault + Holdings
    const totalNetBalance = tokenBalance + aiTradingCapital + vaultBalance + totalHoldingsValue;

    // 6. Portfolio Value (Same as net balance but often used for ROI calcs)
    const portfolioValue = totalNetBalance;

    return {
      totalNetBalance,
      activeTradingBalance: tokenBalance, // Wallet acts as the base trading balance when idle
      vaultBalance,
      totalHoldingsValue,
      aiTradingCapital,
      portfolioValue,
      cashBalance: tokenBalance,
      tokenBalance
    };
  }, [user?.uid, user?.portfolioBalance, user?.tokenBalance, user?.vaultBalance, walletData, activeSessionCapital]);

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
