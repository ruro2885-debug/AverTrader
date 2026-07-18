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

  const updateActiveBalanceOffset = async (newOffset: number) => {
    setActiveOffsetState(newOffset);
    safeStorage.setItem('portfolio_active_offset', newOffset.toString());
    
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          activeOffset: newOffset
        });
      } catch (e) {
        console.error("Failed to sync active offset to Firestore", e);
      }
    }
  };

  // Helper to process a trade PnL or deposit
  const addFundsToActiveBalance = async (amount: number) => {
    const nextOffset = activeOffset + amount;
    await updateActiveBalanceOffset(nextOffset);
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
