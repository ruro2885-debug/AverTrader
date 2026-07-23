import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { safeStorage } from '../utils/storage';

export interface WalletData {
  userId: string;
  portfolioBalance: number;
  availableBalance: number;
  vaultBalance: number;
  aiTradingCapital: number;
  portfolioValue: number;
  totalDeposits: number;
  totalWithdrawals: number;
  cashBalance?: number;
  tokenBalance?: number;
  updatedAt?: any;
}

const DEFAULT_WALLET_VALUES: Omit<WalletData, 'userId'> = {
  portfolioBalance: 0,
  availableBalance: 0,
  vaultBalance: 0,
  aiTradingCapital: 0,
  portfolioValue: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  cashBalance: 0,
  tokenBalance: 0
};

const inFlightWalletFetches = new Map<string, Promise<WalletData>>();
const createdWalletIds = new Set<string>();

export const walletService = {
  async getOrCreateWallet(userId: string, initialDefaults?: Partial<WalletData>): Promise<WalletData> {
    if (!userId || userId.startsWith('local-')) {
      const localKey = `aver_wallet_${userId}`;
      const cached = safeStorage.getItem(localKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
      const newLocalWallet: WalletData = {
        userId,
        ...DEFAULT_WALLET_VALUES,
        ...(initialDefaults || {})
      };
      safeStorage.setItem(localKey, JSON.stringify(newLocalWallet));
      return newLocalWallet;
    }

    if (inFlightWalletFetches.has(userId)) {
      return inFlightWalletFetches.get(userId)!;
    }

    const fetchPromise = (async () => {
      try {
        const walletRef = doc(db, 'wallets', userId);
        const snap = await getDoc(walletRef);

        if (snap.exists()) {
          const data = snap.data() as WalletData;
          let pBalance = data.portfolioBalance;
          if (!pBalance || pBalance === 0) {
            const userCache = safeStorage.getItem(`user_profile_${userId}`);
            if (userCache) {
              try {
                const uObj = JSON.parse(userCache);
                pBalance = uObj.portfolioBalance || uObj.portfolio?.totalValue || 0;
              } catch {}
            }
          }
          if (!pBalance || pBalance === 0) {
            pBalance = 55; // Default starting balance
          }

          const walletData: WalletData = {
            userId,
            portfolioBalance: pBalance,
            availableBalance: data.availableBalance ?? pBalance,
            vaultBalance: data.vaultBalance ?? 0,
            aiTradingCapital: (data.aiTradingCapital && data.aiTradingCapital > 0) ? data.aiTradingCapital : pBalance,
            portfolioValue: data.portfolioValue ?? pBalance,
            totalDeposits: data.totalDeposits ?? pBalance,
            totalWithdrawals: data.totalWithdrawals ?? 0,
            cashBalance: data.cashBalance ?? pBalance,
            tokenBalance: data.tokenBalance ?? pBalance,
            updatedAt: data.updatedAt
          };
          safeStorage.setItem(`aver_wallet_${userId}`, JSON.stringify(walletData));
          return walletData;
        } else {
          // Document does not exist yet -> check cached user profile or use default starting capital
          let cachedBalance = 0;
          let cachedVault = 0;
          const userCache = safeStorage.getItem(`user_profile_${userId}`);
          if (userCache) {
            try {
              const uObj = JSON.parse(userCache);
              cachedBalance = uObj.portfolioBalance || uObj.portfolio?.totalValue || 0;
              cachedVault = uObj.vaultBalance || 0;
            } catch {}
          }
          if (!cachedBalance || cachedBalance === 0) {
            cachedBalance = 55;
          }

          const newWallet: WalletData = {
            userId,
            portfolioBalance: cachedBalance,
            availableBalance: cachedBalance,
            vaultBalance: cachedVault,
            aiTradingCapital: cachedBalance,
            portfolioValue: cachedBalance,
            totalDeposits: cachedBalance,
            totalWithdrawals: 0,
            cashBalance: cachedBalance,
            tokenBalance: cachedBalance,
            ...(initialDefaults || {})
          };
          createdWalletIds.add(userId);
          await setDoc(walletRef, {
            ...newWallet,
            updatedAt: serverTimestamp()
          }, { merge: true });
          safeStorage.setItem(`aver_wallet_${userId}`, JSON.stringify(newWallet));
          return newWallet;
        }
      } catch (error) {
        console.warn('[walletService] Failed to fetch or create wallet document in Firestore, using cached/local:', error);
        const cached = safeStorage.getItem(`aver_wallet_${userId}`);
        if (cached) {
          try { return JSON.parse(cached); } catch {}
        }
        return {
          userId,
          ...DEFAULT_WALLET_VALUES,
          ...(initialDefaults || {})
        };
      } finally {
        inFlightWalletFetches.delete(userId);
      }
    })();

    inFlightWalletFetches.set(userId, fetchPromise);
    return fetchPromise;
  },

  async updateWallet(userId: string, updates: Partial<WalletData>): Promise<WalletData> {
    const current = await this.getOrCreateWallet(userId);
    const updated: WalletData = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    safeStorage.setItem(`aver_wallet_${userId}`, JSON.stringify(updated));

    if (userId && !userId.startsWith('local-')) {
      try {
        const walletRef = doc(db, 'wallets', userId);
        await setDoc(walletRef, {
          ...updated,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn('[walletService] Failed to update wallet document in Firestore:', error);
      }
    }

    return updated;
  },

  subscribeWallet(userId: string, callback: (wallet: WalletData) => void): () => void {
    if (!userId || userId.startsWith('local-')) {
      this.getOrCreateWallet(userId).then(callback);
      return () => {};
    }

    let isCreating = false;
    const walletRef = doc(db, 'wallets', userId);

    return onSnapshot(walletRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WalletData;
        const pBal = data.portfolioBalance ?? DEFAULT_WALLET_VALUES.portfolioBalance;
        const walletData: WalletData = {
          userId,
          portfolioBalance: pBal,
          availableBalance: data.availableBalance ?? pBal,
          vaultBalance: data.vaultBalance ?? DEFAULT_WALLET_VALUES.vaultBalance,
          aiTradingCapital: (data.aiTradingCapital && data.aiTradingCapital > 0) ? data.aiTradingCapital : pBal,
          portfolioValue: data.portfolioValue ?? pBal,
          totalDeposits: data.totalDeposits ?? pBal,
          totalWithdrawals: data.totalWithdrawals ?? DEFAULT_WALLET_VALUES.totalWithdrawals,
          cashBalance: data.cashBalance ?? pBal,
          tokenBalance: data.tokenBalance ?? pBal,
          updatedAt: data.updatedAt
        };
        safeStorage.setItem(`aver_wallet_${userId}`, JSON.stringify(walletData));
        callback(walletData);
      } else {
        if (!isCreating && !createdWalletIds.has(userId)) {
          isCreating = true;
          this.getOrCreateWallet(userId).then((wallet) => {
            isCreating = false;
            callback(wallet);
          }).catch(() => {
            isCreating = false;
          });
        }
      }
    }, (error) => {
      console.warn('[walletService] Snapshot error for wallets collection:', error);
      this.getOrCreateWallet(userId).then(callback).catch(() => {});
    });
  }
};
