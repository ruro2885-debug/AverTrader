import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { doc, updateDoc, increment, serverTimestamp, collection, query, where, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeStorage } from '../utils/storage';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService, WalletData } from '../services/walletService';
import { equityService } from '../services/equityService';

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

    // 3. Base Cash Balance (Wallet Balance)
    // tokenBalance represents the funds available in the wallet (not locked in a session)
    // We strictly subtract aiTradingCapital if the source values are undeducted to prevent double-counting.
    let tokenBalance = 0;
    if (walletData) {
      tokenBalance = walletData.tokenBalance ?? walletData.cashBalance ?? (walletData.portfolioBalance !== undefined ? walletData.portfolioBalance - aiTradingCapital : 0);
    } else if (user) {
      tokenBalance = user.tokenBalance ?? user.cashBalance ?? (user.portfolioBalance !== undefined ? user.portfolioBalance - aiTradingCapital : (user.portfolio?.totalValue !== undefined ? user.portfolio.totalValue - aiTradingCapital : 0));
    }
    tokenBalance = Math.max(0, tokenBalance);

    // 4. Vault Balance
    const wVault = walletData?.vaultBalance || 0;
    const uVault = user?.vaultBalance || 0;
    const vaultBalance = wVault > 0 ? wVault : uVault;

    // 5. Separate Calculations for Home (Available Funds) and Portfolio (Total Funds)
    // Portfolio Total Net Balance is Wallet + Vault + Holdings + AI Trading Capital
    // Active session allocated capital is transferred out but is still part of user's total net balance!
    const portfolioTotalNetBalance = tokenBalance + vaultBalance + totalHoldingsValue + aiTradingCapital;

    // Home Net Balance represents the primary display balance (Total Net Value)
    const homeNetBalance = portfolioTotalNetBalance;

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
      tokenBalance,
      walletData
    };
  }, [user?.uid, user?.portfolioBalance, user?.tokenBalance, user?.vaultBalance, user?.holdings, walletData, activeSessionCapital]);

  const updateVaultBalance = useCallback(async (newBalance: number) => {
    const uid = user?.uid || auth.currentUser?.uid || 'local-user';
    
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

  return {
    ...financials,
    updateVaultBalance,
    addFundsToActiveBalance,
    formatCurrency
  };
};
