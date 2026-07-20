import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
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
  
  // We use local state synced to localStorage for vault and offset to ensure instant UI updates 
  // without waiting for Firestore, but we will also sync to Firestore.
  const [vaultBalance, setVaultBalanceState] = useState<number>(() => {
    const saved = safeStorage.getItem('portfolio_vault_balance');
    if (saved !== null) return parseFloat(saved);
    if (user?.vaultBalance !== undefined) return user.vaultBalance;
    return 150000;
  });

  const [activeOffset, setActiveOffsetState] = useState<number>(() => {
    const saved = safeStorage.getItem('portfolio_active_offset');
    if (saved !== null) return parseFloat(saved);
    if (user?.activeOffset !== undefined) return user.activeOffset;
    return 0;
  });

  // Helper to synchronize with local guest user profile if logged in as a guest
  const syncLocalUserBalance = (newOffset: number, newVault: number) => {
    try {
      const activeLocalUserStr = localStorage.getItem('aver_active_user');
      if (activeLocalUserStr) {
        const activeLocalUser = JSON.parse(activeLocalUserStr);
        activeLocalUser.activeOffset = newOffset;
        activeLocalUser.vaultBalance = newVault;
        localStorage.setItem('aver_active_user', JSON.stringify(activeLocalUser));
      }
    } catch (e) {
      console.warn("Failed to sync guest user balance:", e);
    }
  };

  // Listen to custom events to sync state across different hook instances in the same tab
  useEffect(() => {
    const handleSync = () => {
      const savedVault = safeStorage.getItem('portfolio_vault_balance');
      if (savedVault) setVaultBalanceState(parseFloat(savedVault));
      const savedOffset = safeStorage.getItem('portfolio_active_offset');
      if (savedOffset) setActiveOffsetState(parseFloat(savedOffset));
    };
    window.addEventListener('financials_updated', handleSync);
    return () => window.removeEventListener('financials_updated', handleSync);
  }, []);

  // Keep local state in sync with user doc if it updates from another device
  useEffect(() => {
    if (user) {
      if (user.vaultBalance !== undefined) {
        setVaultBalanceState(user.vaultBalance);
        safeStorage.setItem('portfolio_vault_balance', user.vaultBalance.toString());
      }
      if (user.activeOffset !== undefined) {
        setActiveOffsetState(user.activeOffset);
        safeStorage.setItem('portfolio_active_offset', user.activeOffset.toString());
      }
    }
  }, [user?.uid, user?.vaultBalance, user?.activeOffset]);

  const financials = useMemo<UnifiedFinancials>(() => {
    // 1. Calculate total holdings value
    const totalHoldingsValue = (user?.holdings || []).reduce((sum, h) => {
      return sum + ((h.quantity || 0) * (h.currentPrice || 0));
    }, 0);

    // 2. Base Cash Balance (from user profile or fallback to 0)
    // In our system, 'portfolio.totalValue' or 'portfolioBalance' might be populated
    const baseCash = user?.portfolioBalance || user?.portfolio?.totalValue || 0;
    
    // 3. Active capital includes base cash + any offset (profits/losses from trades, deposits)
    // We make sure it doesn't drop below 0
    let activeTradingBalance = Math.max(0, baseCash + activeOffset);

    // 4. Net Balance is the sum of Active Trading Capital + Vault + Holdings
    const totalNetBalance = activeTradingBalance + vaultBalance + totalHoldingsValue;

    return {
      totalNetBalance,
      activeTradingBalance,
      vaultBalance,
      totalHoldingsValue
    };
  }, [user, vaultBalance, activeOffset]);

  const updateVaultBalance = async (newBalance: number) => {
    setVaultBalanceState(newBalance);
    safeStorage.setItem('portfolio_vault_balance', newBalance.toString());
    syncLocalUserBalance(activeOffset, newBalance);
    window.dispatchEvent(new Event('financials_updated'));
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          vaultBalance: newBalance
        });
      } catch (e) {
        console.error("Failed to sync vault balance to Firestore", e);
      }
    }
  };

  const updateActiveBalanceOffset = async (newOffset: number | ((prev: number) => number)) => {
    let finalOffset: number;
    if (typeof newOffset === 'function') {
      setActiveOffsetState(prev => {
        finalOffset = newOffset(prev);
        safeStorage.setItem('portfolio_active_offset', finalOffset.toString());
        syncLocalUserBalance(finalOffset, vaultBalance);
        window.dispatchEvent(new Event('financials_updated'));
        return finalOffset;
      });
      // We'll handle the Firestore sync after the state update if possible, 
      // but for now let's just use the direct value for Firestore if provided as number
      return; 
    } else {
      finalOffset = newOffset;
      setActiveOffsetState(finalOffset);
      safeStorage.setItem('portfolio_active_offset', finalOffset.toString());
      syncLocalUserBalance(finalOffset, vaultBalance);
      window.dispatchEvent(new Event('financials_updated'));
    }
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          activeOffset: finalOffset
        });
      } catch (e) {
        console.error("Failed to sync active offset to Firestore", e);
      }
    }
  };

  // Helper to process a trade PnL or deposit
  const addFundsToActiveBalance = async (amount: number, skipSync: boolean = false) => {
    let finalOffset = 0;
    setActiveOffsetState(prev => {
      finalOffset = prev + amount;
      safeStorage.setItem('portfolio_active_offset', finalOffset.toString());
      syncLocalUserBalance(finalOffset, vaultBalance);
      window.dispatchEvent(new Event('financials_updated'));
      return finalOffset;
    });
    
    // Manual firestore sync for functional updates
    if (!skipSync && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          activeOffset: finalOffset
        });
      } catch (e) {}
    }
  };

  return {
    ...financials,
    activeBalanceOffset: activeOffset,
    updateVaultBalance,
    updateActiveBalanceOffset,
    addFundsToActiveBalance,
    formatCurrency
  };
};
