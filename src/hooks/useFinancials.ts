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
    if (typeof window !== 'undefined') {
      try {
        const uId = user?.uid || auth.currentUser?.uid;
        if (uId) {
          const cached = localStorage.getItem(`aver_wallet_${uId}`);
          if (cached) {
            return JSON.parse(cached);
          }
        }
      } catch (e) {
        console.warn("Failed to parse cached wallet:", e);
      }
    }
    return null;
  });
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

  useEffect(() => {
    if (user) {
      setWalletData(prev => {
        const pBal = typeof user.portfolioBalance === 'number' ? user.portfolioBalance : (prev?.portfolioBalance ?? 0);
        const aBal = typeof user.availableBalance === 'number' ? user.availableBalance : (prev?.availableBalance ?? 0);
        const vBal = typeof user.vaultBalance === 'number' ? user.vaultBalance : (prev?.vaultBalance ?? 0);
        const tBal = typeof user.tokenBalance === 'number' ? user.tokenBalance : (prev?.tokenBalance ?? aBal);
        const cBal = typeof user.cashBalance === 'number' ? user.cashBalance : (prev?.cashBalance ?? aBal);
        const aiCap = typeof user.aiTradingCapital === 'number' ? user.aiTradingCapital : (prev?.aiTradingCapital ?? 0);
        const portVal = user.portfolio?.totalValue || prev?.portfolioValue || pBal;

        return {
          userId: user.uid,
          portfolioBalance: pBal,
          availableBalance: aBal,
          vaultBalance: vBal,
          aiTradingCapital: aiCap,
          totalDeposits: user.totalDeposits ?? prev?.totalDeposits ?? 0,
          totalWithdrawals: user.totalWithdrawals ?? prev?.totalWithdrawals ?? 0,
          tokenBalance: tBal,
          cashBalance: cBal,
          portfolioValue: portVal,
          lastUpdated: user.lastUpdated
        } as WalletData;
      });
    } else {
      // Don't wipe walletData immediately on temporary auth hydration gap
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
        } else if (s && s.status !== 'ACTIVE' && s.status !== 'RUNNING') {
          setActiveSessionCapital(0);
        } else {
          setActiveSessionCapital(calculateActiveSessionCapital());
        }
      };

      const handleRegistryUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        const reg = customEvent?.detail;
        if (reg) {
          let total = 0;
          Object.values(reg).forEach((s: any) => {
            if (s && (s.status === 'ACTIVE' || s.status === 'RUNNING') && (s.userId === uId || !s.userId)) {
              const cap = typeof s.equity === 'number' ? s.equity : (typeof s.tradingCapital === 'number' ? s.tradingCapital : (s.initialCapital || 0));
              total += cap;
            }
          });
          setActiveSessionCapital(total);
        }
      };

      window.addEventListener('aver_session_updated', handleSessionUpdate);
      window.addEventListener('aver_sessions_registry_updated', handleRegistryUpdate);

      // Initialize from local storage first for instant feedback
      const initialCap = calculateActiveSessionCapital();
      if (initialCap > 0) {
        setActiveSessionCapital(initialCap);
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
            const localCap = calculateActiveSessionCapital();
            setActiveSessionCapital(localCap);
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

    // 2. Active trading capital (Total isolated funds inside active AI trading engine(s))
    let aiTradingCapital = 0;
    if (activeSessionCapital > 0) {
      aiTradingCapital = activeSessionCapital;
    } else if (typeof walletData?.aiTradingCapital === 'number' && walletData.aiTradingCapital > 0) {
      aiTradingCapital = walletData.aiTradingCapital;
    } else if (typeof user?.aiTradingCapital === 'number' && user.aiTradingCapital > 0) {
      aiTradingCapital = user.aiTradingCapital;
    }

    // 3. Authoritative Base Cash Balance (Wallet Balance / Available unallocated funds)
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
    } else if (user?.portfolio?.totalValue !== undefined && user.portfolio.totalValue > 0) {
      tokenBalance = Math.max(0, user.portfolio.totalValue - aiTradingCapital);
    }
    tokenBalance = Math.max(0, tokenBalance);

    // Fallback to local storage cache if user and walletData are both hydrating and tokenBalance + aiTradingCapital is 0
    if (tokenBalance === 0 && aiTradingCapital === 0) {
      const uId = user?.uid || auth.currentUser?.uid;
      if (uId) {
        try {
          const cachedUser = safeStorage.getItem(`user_profile_${uId}`) || localStorage.getItem('aver_active_user');
          if (cachedUser) {
            const parsed = JSON.parse(cachedUser);
            if (typeof parsed.tokenBalance === 'number' && parsed.tokenBalance > 0) {
              tokenBalance = parsed.tokenBalance;
            } else if (typeof parsed.availableBalance === 'number' && parsed.availableBalance > 0) {
              tokenBalance = parsed.availableBalance;
            } else if (typeof parsed.portfolioBalance === 'number' && parsed.portfolioBalance > 0) {
              tokenBalance = parsed.portfolioBalance;
            }
          }
        } catch (e) {}
      }
    }

    // 4. Vault Balance
    const savedVaultBalStr = safeStorage.getItem('portfolio_vault_balance');
    const savedVaultBal = savedVaultBalStr !== null && savedVaultBalStr !== undefined && !isNaN(parseFloat(savedVaultBalStr)) ? parseFloat(savedVaultBalStr) : null;
    const vaultBalance = (user?.vaultBalance !== undefined && user?.vaultBalance !== null) 
      ? user.vaultBalance 
      : (savedVaultBal !== null ? savedVaultBal : (walletData?.vaultBalance ?? 0));

    // 5. Unified Accounting Invariants:
    // TOTAL NET BALANCE = WALLET BALANCE + ACTIVE ALLOCATED TRADING CAPITAL + VAULT + HOLDINGS
    const calculatedConsolidatedTotal = tokenBalance + aiTradingCapital + vaultBalance + totalHoldingsValue;

    const portfolioTotalNetBalance = calculatedConsolidatedTotal;
    // HOME NET BALANCE = PORTFOLIO WALLET BALANCE (Authoritative single wallet balance)
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
