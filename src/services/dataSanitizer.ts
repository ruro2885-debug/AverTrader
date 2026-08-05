import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeStorage } from '../utils/storage';

/**
 * Ensures all users start with clean, authentic zero-progress state.
 * Purges legacy fake holdings, fake vault balances ($310,179), fake trading ranks, 
 * and active AI sessions so all balances reflect exact actual deposit/wallet funds.
 */
export async function sanitizeAndResetUserData(uid: string, walletBalanceOverride?: number): Promise<void> {
  if (!uid) return;

  try {
    const isLocal = uid.startsWith('local-') || uid === 'guest_user';

    const walletKey = `aver_wallet_${uid}`;
    const profileKey = `user_profile_${uid}`;
    const activeUserKey = `aver_active_user`;
    const portfolioCurrentKey = `aver_portfolio_current_${uid}`;
    const sessionKey = `aver_session_${uid}`;
    const positionsKey = `aver_positions_${uid}`;

    let realBalance = walletBalanceOverride;

    // 1. If Firestore user document exists, prioritize its balances as absolute source of truth
    if (!isLocal) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const fsBal = uData.availableBalance ?? uData.portfolioBalance ?? uData.tokenBalance;
          if (typeof fsBal === 'number' && !isNaN(fsBal)) {
            realBalance = fsBal;
          }
        }
      } catch (err) {
        console.warn("[dataSanitizer] Firestore lookup notice:", err);
      }
    }

    // Fallback to cached balance if realBalance is still undefined
    if (realBalance === undefined) {
      const cachedWallet = safeStorage.getItem(walletKey);
      if (cachedWallet) {
        try {
          const wObj = JSON.parse(cachedWallet);
          if (wObj.portfolioBalance !== undefined) realBalance = wObj.portfolioBalance;
          else if (wObj.availableBalance !== undefined) realBalance = wObj.availableBalance;
          else if (wObj.tokenBalance !== undefined) realBalance = wObj.tokenBalance;
        } catch {}
      }
    }

    if (realBalance === undefined) {
      const cachedProfile = safeStorage.getItem(profileKey);
      if (cachedProfile) {
        try {
          const pObj = JSON.parse(cachedProfile);
          if (pObj.portfolioBalance !== undefined) realBalance = pObj.portfolioBalance;
          else if (pObj.availableBalance !== undefined) realBalance = pObj.availableBalance;
          else if (pObj.tokenBalance !== undefined) realBalance = pObj.tokenBalance;
        } catch {}
      }
    }

    realBalance = realBalance !== undefined && !isNaN(realBalance) ? realBalance : 0;

    // Sanitize Local Storage Wallet Object
    const sanitizedWallet = {
      userId: uid,
      portfolioBalance: realBalance,
      availableBalance: realBalance,
      vaultBalance: 0,
      aiTradingCapital: 0,
      portfolioValue: realBalance,
      totalDeposits: realBalance,
      totalWithdrawals: 0,
      cashBalance: realBalance,
      tokenBalance: realBalance,
      updatedAt: new Date().toISOString()
    };
    safeStorage.setItem(walletKey, JSON.stringify(sanitizedWallet));

    // Sanitize Local Storage Portfolio Current State
    const sanitizedPortfolioCurrent = {
      portfolioMetrics: {
        totalValue: realBalance,
        todayPnL: 0,
        todayPnLPercent: 0,
        overallReturn: 0,
        realizedPnL: 0,
        unrealizedPnL: 0,
        healthScore: 100,
        diversificationScore: 100,
        volatility: 0,
        sharpeRatio: 0,
        winRate: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
        riskAdjustedReturn: 0
      },
      walletState: {
        portfolioBalance: realBalance,
        availableBalance: realBalance,
        vaultBalance: 0,
        activeOffset: 0,
        totalDeposits: realBalance,
        totalWithdrawals: 0,
        totalProfit: 0,
        totalLoss: 0,
        tokenBalance: realBalance,
        aiTradingCapital: 0
      },
      sessionDetails: {
        sessionId: null,
        status: 'INACTIVE',
        marketsScanned: ['BTC', 'ETH', 'SOL'],
        activeConfigId: null,
        startTime: null,
        engineState: 'IDLE',
        cpuUsage: 0,
        memoryUsage: 0,
        latencyMs: 12
      },
      commandCenter: {
        activeConfigId: 'cfg_default',
        aiSettings: {
          copilotMode: 'copilot',
          maxActiveTrades: 3,
          riskProfile: 'Balanced',
          drawdownStopLimit: 2.5,
          maxCapitalExposure: 40,
          consecutiveLosses: 0
        },
        riskProfile: 'Balanced',
        copilotMode: 'copilot',
        maxActiveTrades: 3,
        drawdownStopLimit: 2.5,
        maxCapitalExposure: 40
      },
      lastUpdated: new Date().toISOString()
    };
    safeStorage.setItem(portfolioCurrentKey, JSON.stringify(sanitizedPortfolioCurrent));

    // Sanitize Session
    safeStorage.removeItem(sessionKey);
    safeStorage.removeItem(positionsKey);

    // Sanitize User Profile in Local Storage
    const cachedProfileRaw = safeStorage.getItem(profileKey);
    if (cachedProfileRaw) {
      try {
        const profileObj = JSON.parse(cachedProfileRaw);
        profileObj.vaultBalance = 0;
        profileObj.portfolioBalance = realBalance;
        profileObj.availableBalance = realBalance;
        profileObj.tokenBalance = realBalance;
        profileObj.cashBalance = realBalance;
        profileObj.aiTradingCapital = 0;
        profileObj.holdings = [];
        profileObj.trades = [];
        profileObj.level = 1;
        profileObj.xp = 0;
        profileObj.winRun = 0;
        profileObj.aiTradesCount = 0;
        profileObj.insignias = [];
        profileObj.totalProfit = 0;
        profileObj.totalLoss = 0;
        if (profileObj.portfolio) {
          profileObj.portfolio.totalValue = realBalance;
          profileObj.portfolio.todayPnL = 0;
          profileObj.portfolio.overallReturn = 0;
        }
        safeStorage.setItem(profileKey, JSON.stringify(profileObj));
        safeStorage.setItem(activeUserKey, JSON.stringify(profileObj));
      } catch {}
    }

    if (isLocal) return;

    // 2. Perform Firestore Updates
    const userDocRef = doc(db, 'users', uid);
    const walletDocRef = doc(db, 'wallets', uid);
    const portfolioDocRef = doc(db, 'users', uid, 'portfolio', 'current');

    // Reset user doc
    await updateDoc(userDocRef, {
      vaultBalance: 0,
      portfolioBalance: realBalance,
      availableBalance: realBalance,
      tokenBalance: realBalance,
      cashBalance: realBalance,
      aiTradingCapital: 0,
      holdings: [],
      level: 1,
      xp: 0,
      winRun: 0,
      aiTradesCount: 0,
      insignias: [],
      totalProfit: 0,
      totalLoss: 0,
      'portfolio.totalValue': realBalance,
      'portfolio.todayPnL': 0,
      'portfolio.overallReturn': 0,
      lastUpdated: serverTimestamp()
    }).catch(() => {});

    // Reset wallet doc
    await setDoc(walletDocRef, {
      userId: uid,
      portfolioBalance: realBalance,
      availableBalance: realBalance,
      vaultBalance: 0,
      aiTradingCapital: 0,
      portfolioValue: realBalance,
      totalDeposits: realBalance,
      totalWithdrawals: 0,
      cashBalance: realBalance,
      tokenBalance: realBalance,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});

    // Reset portfolio/current doc
    await setDoc(portfolioDocRef, {
      ...sanitizedPortfolioCurrent,
      lastUpdated: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    // Deactivate active AI sessions in Firestore
    const activeSessionsQuery = query(collection(db, 'aiSessions'), where('userId', '==', uid), where('status', '==', 'ACTIVE'));
    const sessionSnaps = await getDocs(activeSessionsQuery).catch(() => null);
    if (sessionSnaps && !sessionSnaps.empty) {
      for (const sDoc of sessionSnaps.docs) {
        await updateDoc(doc(db, 'aiSessions', sDoc.id), {
          status: 'INACTIVE',
          endTime: serverTimestamp()
        }).catch(() => {});
      }
    }

  } catch (err) {
    console.warn('[dataSanitizer] Error during user data sanitization:', err);
  }
}
