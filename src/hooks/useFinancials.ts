import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { doc, updateDoc, setDoc, increment, serverTimestamp, collection, query, where, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeStorage } from '../utils/storage';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService, WalletData } from '../services/walletService';
import { equityService } from '../services/equityService';
import { transactionService } from '../services/transactionService';

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
  const { user, updateProfile } = useAuth();
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
    if (user) {
      setWalletData({
        userId: user.uid,
        portfolioBalance: user.portfolioBalance || 0,
        availableBalance: user.availableBalance || 0,
        vaultBalance: user.vaultBalance || 0,
        aiTradingCapital: user.aiTradingCapital || 0,
        totalDeposits: user.totalDeposits || 0,
        totalWithdrawals: user.totalWithdrawals || 0,
        tokenBalance: user.tokenBalance || 0,
        cashBalance: user.cashBalance || 0,
        portfolioValue: user.portfolio?.totalValue || 0,
        lastUpdated: user.lastUpdated
      } as WalletData);
    } else {
      setWalletData(null);
    }
  }, [
    user?.portfolioBalance,
    user?.availableBalance,
    user?.vaultBalance,
    user?.aiTradingCapital,
    user?.totalDeposits,
    user?.totalWithdrawals,
    user?.tokenBalance,
    user?.cashBalance,
    user?.portfolio?.totalValue,
    user?.lastUpdated
  ]);

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
    const aiTradingCapital = activeSessionCapital > 0 ? activeSessionCapital : (walletData?.aiTradingCapital || user?.aiTradingCapital || 0);

    // 3. Base Cash Balance (Wallet Balance / Home Net Balance)
    // tokenBalance represents the available unallocated cash funds in the wallet
    let tokenBalance = 0;
    if (typeof user?.tokenBalance === 'number') {
      tokenBalance = user.tokenBalance;
    } else if (typeof walletData?.tokenBalance === 'number') {
      tokenBalance = walletData.tokenBalance;
    } else if (typeof user?.availableBalance === 'number') {
      tokenBalance = user.availableBalance;
    } else if (typeof walletData?.availableBalance === 'number') {
      tokenBalance = walletData.availableBalance;
    } else if (typeof user?.cashBalance === 'number') {
      tokenBalance = user.cashBalance;
    } else if (typeof walletData?.cashBalance === 'number') {
      tokenBalance = walletData.cashBalance;
    } else if (typeof user?.portfolioBalance === 'number') {
      tokenBalance = Math.max(0, user.portfolioBalance - aiTradingCapital);
    } else if (typeof walletData?.portfolioBalance === 'number') {
      tokenBalance = Math.max(0, walletData.portfolioBalance - aiTradingCapital);
    } else if (user?.portfolio?.totalValue !== undefined) {
      tokenBalance = Math.max(0, user.portfolio.totalValue - aiTradingCapital);
    }
    tokenBalance = Math.max(0, tokenBalance);

    // 4. Vault Balance
    const savedVaultBalStr = safeStorage.getItem('portfolio_vault_balance');
    const savedVaultBal = savedVaultBalStr !== null && savedVaultBalStr !== undefined && !isNaN(parseFloat(savedVaultBalStr)) ? parseFloat(savedVaultBalStr) : null;
    const vaultBalance = (user?.vaultBalance !== undefined && user?.vaultBalance !== null) 
      ? user.vaultBalance 
      : (savedVaultBal !== null ? savedVaultBal : (walletData?.vaultBalance ?? 0));

    // 5. Unified Total Portfolio Balance Calculations
    // Consolidated portfolio net balance is the sum of available wallet cash + active AI trading capital + vault reserves + asset holdings.
    const calculatedConsolidatedTotal = tokenBalance + aiTradingCapital + vaultBalance + totalHoldingsValue;

    const portfolioTotalNetBalance = calculatedConsolidatedTotal;
    const homeNetBalance = tokenBalance;

    // 6. Portfolio Value
    const portfolioValue = portfolioTotalNetBalance;

    return {
      totalNetBalance: portfolioTotalNetBalance,
      portfolioTotalNetBalance,
      homeNetBalance,
      activeTradingBalance: tokenBalance, // Wallet cash available for trading/allocation
      vaultBalance,
      totalHoldingsValue,
      aiTradingCapital,
      portfolioValue,
      cashBalance: tokenBalance,
      tokenBalance,
      walletData
    };
  }, [user?.uid, user?.portfolioBalance, user?.tokenBalance, user?.availableBalance, user?.cashBalance, user?.vaultBalance, user?.holdings, walletData, activeSessionCapital]);

  const updateVaultBalance = useCallback(async (newBalance: number) => {
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    
    safeStorage.setItem('portfolio_vault_balance', newBalance.toString());

    // Optimistically write to profile state & localStorage
    if (updateProfile) {
      updateProfile({ vaultBalance: newBalance }, undefined, undefined, true).catch(() => {});
    }

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

    // Record historical balance
    const portfolio = await portfolioPersistenceService.getPortfolioCurrent(uid);
    await equityService.recordEquity({
      userId: uid,
      timestamp: Timestamp.now(),
      totalNetBalance: portfolio.portfolioMetrics.totalValue,
      trigger: 'MANUAL_ADJUSTMENT' // Or more specific if we knew if it was vault move
    });
  }, [auth.currentUser, user?.uid, updateProfile]);

  const updateActiveBalanceOffset = useCallback(async (newOffset: number | ((prev: number) => number)) => {
    let finalOffset: number;
    const currentOffset = user?.activeOffset || 0;

    if (typeof newOffset === 'function') {
      finalOffset = newOffset(currentOffset);
    } else {
      finalOffset = newOffset;
    }
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    
    // Optimistically write to profile state & localStorage
    if (updateProfile) {
      updateProfile({ activeOffset: finalOffset }, undefined, undefined, true).catch(() => {});
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

    await portfolioPersistenceService.updateWalletState(uid, {
      activeOffset: finalOffset
    });
  }, [auth.currentUser, user?.activeOffset, user?.uid, updateProfile]);

  // Helper to process a trade PnL or deposit
  const addFundsToActiveBalance = useCallback(async (amount: number, skipSync: boolean = false) => {
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    const currentPort = user?.portfolioBalance || 0;
    const currentAvail = user?.availableBalance || 0;
    const currentToken = user?.tokenBalance || 0;
    const currentCash = user?.cashBalance || 0;

    // Optimistically write to profile state & localStorage
    if (updateProfile) {
      updateProfile({
        portfolioBalance: currentPort + amount,
        availableBalance: currentAvail + amount,
        tokenBalance: currentToken + amount,
        cashBalance: currentCash + amount,
      }, undefined, undefined, true).catch(() => {});
    }

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

    await portfolioPersistenceService.updateWalletState(uid, {
      portfolioBalance: currentPort + amount,
      availableBalance: currentAvail + amount
    });

    // Record historical balance
    const portfolio = await portfolioPersistenceService.getPortfolioCurrent(uid);
    await equityService.recordEquity({
      userId: uid,
      timestamp: Timestamp.now(),
      totalNetBalance: portfolio.portfolioMetrics.totalValue,
      trigger: amount >= 0 ? 'DEPOSIT' : 'WITHDRAW'
    });
  }, [auth.currentUser, user?.uid, user?.portfolioBalance, user?.availableBalance, user?.tokenBalance, user?.cashBalance, updateProfile]);

  // Atomic & Idempotent Vault Transfer (Deposit / Withdraw)
  const executeVaultTransfer = useCallback(async (amount: number, direction: 'deposit' | 'withdraw'): Promise<boolean> => {
    if (isNaN(amount) || amount <= 0) return false;
    
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    
    // Read current vault balance
    const currentVault = (user?.vaultBalance !== undefined && user?.vaultBalance !== null) 
      ? user.vaultBalance 
      : (Number(safeStorage.getItem('portfolio_vault_balance')) || walletData?.vaultBalance || 0);

    // Read current cash balance accurately
    const currentCash = (typeof user?.tokenBalance === 'number' && user.tokenBalance > 0)
      ? user.tokenBalance
      : ((typeof user?.availableBalance === 'number' && user.availableBalance > 0)
        ? user.availableBalance
        : ((typeof user?.portfolioBalance === 'number' && user.portfolioBalance > 0)
          ? user.portfolioBalance
          : (walletData?.tokenBalance || walletData?.availableBalance || walletData?.portfolioBalance || 0)));

    let newVaultBal = currentVault;
    let newCashBal = currentCash;

    if (direction === 'deposit') {
      if (amount > currentCash) {
        return false;
      }
      newVaultBal = currentVault + amount;
      newCashBal = Math.max(0, currentCash - amount);
    } else {
      if (amount > currentVault) {
        return false;
      }
      newVaultBal = Math.max(0, currentVault - amount);
      newCashBal = currentCash + amount;
    }

    // 1. Synchronously update localStorage
    safeStorage.setItem('portfolio_vault_balance', newVaultBal.toString());
    
    const localWalletKey = `aver_wallet_${uid}`;

    try {
      const cachedWalletStr = safeStorage.getItem(localWalletKey);
      if (cachedWalletStr) {
        const w = JSON.parse(cachedWalletStr);
        w.vaultBalance = newVaultBal;
        w.portfolioBalance = newCashBal;
        w.availableBalance = newCashBal;
        w.tokenBalance = newCashBal;
        w.cashBalance = newCashBal;
        safeStorage.setItem(localWalletKey, JSON.stringify(w));
      }
    } catch (e) {}

    // 2. Single ATOMIC updateProfile call
    if (updateProfile) {
      await updateProfile({
        vaultBalance: newVaultBal,
        portfolioBalance: newCashBal,
        availableBalance: newCashBal,
        tokenBalance: newCashBal,
        cashBalance: newCashBal,
        portfolio: {
          ...(user?.portfolio || {}),
          totalValue: newCashBal + newVaultBal
        }
      }, undefined, undefined, true).catch(() => {});
    }

    // 3. Sync to Firestore
    if (auth.currentUser && !uid.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          vaultBalance: newVaultBal,
          portfolioBalance: newCashBal,
          availableBalance: newCashBal,
          tokenBalance: newCashBal,
          cashBalance: newCashBal,
          'portfolio.totalValue': newCashBal + newVaultBal,
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.warn("Failed to sync vault transfer to Firestore users doc", e);
      }

      try {
        await setDoc(doc(db, 'wallets', auth.currentUser.uid), {
          userId: auth.currentUser.uid,
          vaultBalance: newVaultBal,
          portfolioBalance: newCashBal,
          availableBalance: newCashBal,
          tokenBalance: newCashBal,
          cashBalance: newCashBal,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to sync vault transfer to Firestore wallets doc", e);
      }
    }

    // 4. Update portfolio persistence service
    await portfolioPersistenceService.updateWalletState(uid, {
      vaultBalance: newVaultBal,
      portfolioBalance: newCashBal,
      availableBalance: newCashBal,
      tokenBalance: newCashBal
    });

    // 5. Record internal transfer transaction
    if (uid) {
      await transactionService.recordTransaction({
        userId: uid,
        type: 'internal_transfer',
        category: 'transactions',
        title: direction === 'deposit' ? 'Vault Deposit' : 'Vault Withdrawal',
        amount: direction === 'deposit' ? amount : -amount,
        asset: 'USDT',
        network: 'Secure Vault',
        status: 'Completed',
        description: direction === 'deposit' ? 'Protected capital transferred into secure savings vault' : 'Unlocked savings transferred back to active balance'
      }).catch(err => console.error("Error recording vault transaction:", err));
    }

    // Record historical balance
    await equityService.recordEquity({
      userId: uid,
      timestamp: Timestamp.now(),
      totalNetBalance: newCashBal + newVaultBal,
      trigger: direction === 'deposit' ? 'MANUAL_ADJUSTMENT' : 'WITHDRAW'
    }).catch(() => {});

    // Notify listeners
    window.dispatchEvent(new Event('aver_user_updated'));
    window.dispatchEvent(new Event('storage'));

    return true;
  }, [user, walletData, updateProfile]);

  return {
    ...financials,
    updateVaultBalance,
    addFundsToActiveBalance,
    executeVaultTransfer,
    formatCurrency
  };
};
