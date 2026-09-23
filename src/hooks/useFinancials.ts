import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
  walletData: WalletData | null;
}

// Per-user in-memory cache to prevent flickering during brief listener reconciliation
const lastKnownWalletBalances = new Map<string, number>();

export function clearFinancialsCache(uid?: string) {
  if (uid) {
    lastKnownWalletBalances.delete(uid);
  } else {
    lastKnownWalletBalances.clear();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('aver_clear_financials_cache', () => {
    lastKnownWalletBalances.clear();
  });
}

export const useFinancials = () => {
  const { user, updateProfile } = useAuth();
  const [activeSessionCapital, setActiveSessionCapital] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const uId = user?.uid || auth.currentUser?.uid;
        if (uId) {
          const raw = localStorage.getItem(`aver_session_${uId}`);
          if (raw) {
            const sessionData = JSON.parse(raw);
            if (sessionData && sessionData.status === 'ACTIVE') {
              return sessionData.equity !== undefined ? sessionData.equity : (sessionData.tradingCapital || 0);
            }
          }
        }
      } catch (e) {}
    }
    return user?.aiTradingCapital || 0;
  });

  const previousUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (user?.uid !== previousUidRef.current) {
      if (previousUidRef.current) {
        lastKnownWalletBalances.delete(previousUidRef.current);
      }
      previousUidRef.current = user?.uid || null;
      setActiveSessionCapital(0);
    }
  }, [user?.uid]);

  // Listen to active AI session(s) to get isolated capital & session equity
  useEffect(() => {
    const uId = user?.uid || auth.currentUser?.uid;
    if (uId) {
      const calculateActiveSessionCapital = () => {
        let total = 0;
        try {
          // Check session registry first
          const regRaw = localStorage.getItem('aver_active_sessions_registry');
          if (regRaw) {
            const reg = JSON.parse(regRaw);
            Object.values(reg).forEach((s: any) => {
              if (s && (s.status === 'ACTIVE' || s.status === 'RUNNING') && (s.userId === uId || !s.userId)) {
                const cap = typeof s.equity === 'number' ? s.equity : (typeof s.tradingCapital === 'number' ? s.tradingCapital : (s.initialCapital || 0));
                total += cap;
              }
            });
          }
          if (total === 0) {
            const singleRaw = localStorage.getItem(`aver_session_${uId}`);
            if (singleRaw) {
              const s = JSON.parse(singleRaw);
              if (s && (s.status === 'ACTIVE' || s.status === 'RUNNING')) {
                total = typeof s.equity === 'number' ? s.equity : (typeof s.tradingCapital === 'number' ? s.tradingCapital : (s.initialCapital || 0));
              }
            }
          }
        } catch (e) {}
        return total;
      };

      const handleSessionUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        const s = customEvent?.detail;
        if (s && (s.status === 'ACTIVE' || s.status === 'RUNNING')) {
          const cap = s.equity !== undefined ? s.equity : (s.tradingCapital || 0);
          setActiveSessionCapital(cap);
        } else {
          // Explicitly clear session capital when stopped or null; do not revive stale local data
          setActiveSessionCapital(0);
        }
      };

      const handleRegistryUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        const reg = customEvent?.detail;
        if (reg && typeof reg === 'object') {
          let total = 0;
          Object.values(reg).forEach((s: any) => {
            if (s && (s.status === 'ACTIVE' || s.status === 'RUNNING') && (s.userId === uId || !s.userId)) {
              const cap = typeof s.equity === 'number' ? s.equity : (typeof s.tradingCapital === 'number' ? s.tradingCapital : (s.initialCapital || 0));
              total += cap;
            }
          });
          setActiveSessionCapital(total);
        } else {
          setActiveSessionCapital(0);
        }
      };

      window.addEventListener('aver_session_updated', handleSessionUpdate);
      window.addEventListener('aver_sessions_registry_updated', handleRegistryUpdate);

      // Initialize from active session registry/local only if verified active
      const initialCap = calculateActiveSessionCapital();
      if (initialCap > 0) {
        setActiveSessionCapital(initialCap);
      } else {
        setActiveSessionCapital(0);
      }

      const isLocal = uId.startsWith('local-') || uId === 'guest_user';
      if (isLocal) {
        return () => {
          window.removeEventListener('aver_session_updated', handleSessionUpdate);
          window.removeEventListener('aver_sessions_registry_updated', handleRegistryUpdate);
        };
      } else {
        const q = query(
          collection(db, 'aiSessions'),
          where('userId', '==', uId),
          where('status', '==', 'ACTIVE')
        );

        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const total = snap.docs.reduce((sum, docSnap) => {
              const sessionData = docSnap.data();
              if (sessionData.status === 'ACTIVE' || sessionData.status === 'RUNNING') {
                const cap = typeof sessionData.equity === 'number' ? sessionData.equity : (typeof sessionData.tradingCapital === 'number' ? sessionData.tradingCapital : (sessionData.initialCapital || 0));
                return sum + cap;
              }
              return sum;
            }, 0);
            setActiveSessionCapital(total);
          } else {
            // Firestore authoritative query confirms no active sessions!
            setActiveSessionCapital(0);
          }
        }, (err) => {
          console.warn("Firestore sessions listener failed, using local/event state:", err);
        });

        return () => {
          window.removeEventListener('aver_session_updated', handleSessionUpdate);
          window.removeEventListener('aver_sessions_registry_updated', handleRegistryUpdate);
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

    // 2. Active trading capital (Isolated funds in active AI trading session)
    let aiTradingCapital = 0;
    if (activeSessionCapital > 0) {
      aiTradingCapital = activeSessionCapital;
    } else if (typeof user?.aiTradingCapital === 'number' && user.aiTradingCapital > 0) {
      aiTradingCapital = user.aiTradingCapital;
    }

    // 3. Vault Balance - Scoped strictly to current user UID
    const vaultBalance = (user?.vaultBalance !== undefined && user?.vaultBalance !== null) 
      ? user.vaultBalance 
      : 0;

    // 4. Determine Authoritative Total Portfolio Net Equity
    // This is the "Anchor" value - Total Net Worth in the platform
    let totalPortfolioNetEquity = 0;
    if (typeof user?.portfolioBalance === 'number' && user.portfolioBalance > 0) {
      totalPortfolioNetEquity = user.portfolioBalance;
    } else if (typeof user?.portfolio?.totalValue === 'number' && user.portfolio.totalValue > 0) {
      totalPortfolioNetEquity = user.portfolio.totalValue;
    } else {
      // Fallback if everything is 0 or null during a transition
      totalPortfolioNetEquity = (user?.tokenBalance || user?.availableBalance || 0) + aiTradingCapital + vaultBalance + totalHoldingsValue;
    }

    // 5. Liquid Cash Balance (Available funds NOT in session, NOT in vault, NOT in holdings)
    // We derive this to ensure (Cash + Session + Vault + Holdings) ALWAYS = Total Equity
    let tokenBalance = Math.max(0, totalPortfolioNetEquity - aiTradingCapital - vaultBalance - totalHoldingsValue);
    
    // Safety check: if user.tokenBalance is explicitly set and consistent, prefer it
    if (user?.tokenBalance !== undefined && Math.abs(user.tokenBalance - tokenBalance) < 0.01) {
      tokenBalance = user.tokenBalance;
    }

    const portfolioTotalNetBalance = totalPortfolioNetEquity;
    const homeNetBalance = tokenBalance;

    return {
      totalNetBalance: portfolioTotalNetBalance,
      portfolioTotalNetBalance,
      homeNetBalance,
      activeTradingBalance: tokenBalance, 
      vaultBalance,
      totalHoldingsValue,
      aiTradingCapital,
      portfolioValue: portfolioTotalNetBalance,
      cashBalance: tokenBalance,
      tokenBalance,
      walletData: null // Redundant state removed
    };
  }, [user?.uid, user?.portfolioBalance, user?.tokenBalance, user?.availableBalance, user?.cashBalance, user?.vaultBalance, user?.holdings, user?.portfolio?.totalValue, activeSessionCapital]);

  function walletBalanceInvalid(wBal: number, tCap: number): boolean {
    return wBal < 0 || tCap < 0;
  }

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
      safeStorage.setItem(`portfolio_vault_balance_${uid}`, String(newBalance));
      try {
        const profileKey = `user_profile_${uid}`;
        const activeLocalUserStr = localStorage.getItem(profileKey);
        if (activeLocalUserStr) {
          const activeLocalUser = JSON.parse(activeLocalUserStr);
          if (activeLocalUser.uid === uid) {
            activeLocalUser.vaultBalance = newBalance;
            localStorage.setItem(profileKey, JSON.stringify(activeLocalUser));
            window.dispatchEvent(new Event('storage'));
          }
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
        const profileKey = `user_profile_${uid}`;
        const activeLocalUserStr = localStorage.getItem(profileKey);
        if (activeLocalUserStr) {
          const activeLocalUser = JSON.parse(activeLocalUserStr);
          if (activeLocalUser.uid === uid) {
            activeLocalUser.activeOffset = finalOffset;
            localStorage.setItem(profileKey, JSON.stringify(activeLocalUser));
            window.dispatchEvent(new Event('storage'));
          }
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
      : (Number(safeStorage.getItem('portfolio_vault_balance')) || 0);

    // Read current cash balance accurately
    const currentCash = (typeof user?.tokenBalance === 'number' && user.tokenBalance > 0)
      ? user.tokenBalance
      : ((typeof user?.availableBalance === 'number' && user.availableBalance > 0)
        ? user.availableBalance
        : ((typeof user?.portfolioBalance === 'number' && user.portfolioBalance > 0)
          ? user.portfolioBalance
          : 0));

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
  }, [user, updateProfile]);

  return {
    ...financials,
    updateVaultBalance,
    addFundsToActiveBalance,
    executeVaultTransfer,
    formatCurrency
  };
};
