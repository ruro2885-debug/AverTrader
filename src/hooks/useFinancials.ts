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
    return saved ? parseFloat(saved) : (user?.vaultBalance || 150000);
  });

  const [activeOffset, setActiveOffsetState] = useState<number>(() => {
    const saved = safeStorage.getItem('portfolio_active_offset');
    return saved ? parseFloat(saved) : (user?.activeOffset || 0);
  });

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
    if (user?.vaultBalance !== undefined && !safeStorage.getItem('portfolio_vault_balance')) {
      setVaultBalanceState(user.vaultBalance);
    }
    if (user?.activeOffset !== undefined && !safeStorage.getItem('portfolio_active_offset')) {
      setActiveOffsetState(user.activeOffset);
    }
  }, [user?.vaultBalance, user?.activeOffset]);

  const financials = useMemo<UnifiedFinancials>(() => {
    // 1. Calculate total holdings value
    const totalHoldingsValue = (user?.holdings || []).reduce((sum, h) => {
      return sum + ((h.quantity || 0) * (h.currentPrice || 0));
    }, 0);

    // 2. Base Cash Balance (from user profile or fallback to 100k)
    // In our system, 'portfolio.totalValue' or 'portfolioBalance' might be populated
    const baseCash = user?.portfolioBalance || user?.portfolio?.totalValue || 100000;
    
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
