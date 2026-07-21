import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeStorage } from '../utils/storage';

export interface UnifiedFinancials {
  totalNetBalance: number;
  activeTradingBalance: number;
  vaultBalance: number;
  totalHoldingsValue: number;
}

export const useFinancials = () => {
  const { user } = useAuth();
  
  const financials = useMemo<UnifiedFinancials>(() => {
    // 1. Calculate total holdings value
    const totalHoldingsValue = (user?.holdings || []).reduce((sum, h) => {
      return sum + ((h.quantity || 0) * (h.currentPrice || 0));
    }, 0);

    // 2. Base Cash Balance (from user profile or fallback to 0)
    // In our system, 'portfolio.totalValue' or 'portfolioBalance' might be populated
    const baseCash = user?.portfolioBalance || user?.portfolio?.totalValue || 0;
    
    // 3. Active capital is derived directly from the master portfolio balance
    let activeTradingBalance = Math.max(0, baseCash);

    // 4. Vault Balance from user doc
    const vaultBalance = user?.vaultBalance || 0;

    // 5. Net Balance is the sum of Active Trading Capital + Vault + Holdings
    const totalNetBalance = activeTradingBalance + vaultBalance + totalHoldingsValue;

    return {
      totalNetBalance,
      activeTradingBalance,
      vaultBalance,
      totalHoldingsValue
    };
  }, [user]);

  const updateVaultBalance = useCallback(async (newBalance: number) => {
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
          // Dispatch event to notify AuthContext or other listeners
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.warn("Failed to update local vault balance:", e);
      }
    }
  }, [auth.currentUser]);

  const updateActiveBalanceOffset = useCallback(async (newOffset: number | ((prev: number) => number)) => {
    // Note: We are phasing out activeOffset in favor of direct portfolioBalance increments,
    // but keeping this for compatibility if needed for other adjustments.
    let finalOffset: number;
    const currentOffset = user?.activeOffset || 0;

    if (typeof newOffset === 'function') {
      finalOffset = newOffset(currentOffset);
    } else {
      finalOffset = newOffset;
    }
    
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
  }, [auth.currentUser, user?.activeOffset]);

  // Helper to process a trade PnL or deposit
  const addFundsToActiveBalance = useCallback(async (amount: number, skipSync: boolean = false) => {
    if (!skipSync && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          portfolioBalance: increment(amount),
          availableBalance: increment(amount),
          'portfolio.totalValue': increment(amount),
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to sync funds addition to Firestore", e);
      }
    }
  }, [auth.currentUser]);

  return {
    ...financials,
    activeBalanceOffset: user?.activeOffset || 0,
    updateVaultBalance,
    updateActiveBalanceOffset,
    addFundsToActiveBalance,
    formatCurrency
  };
};
