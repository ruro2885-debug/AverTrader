import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Load Firebase Config securely
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase App in Backend
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes - "Cloud Functions" secure equivalent running on the backend
  
  // 1. Calculate Referral Rewards
  app.post('/api/referral-reward', async (req, res) => {
    const { userId, referralCode } = req.body;
    if (!userId || !referralCode) {
      return res.status(400).json({ error: 'Missing userId or referralCode' });
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnap.data();
      if (userData.referredBy) {
        return res.status(400).json({ error: 'Referral reward already processed' });
      }

      // Check if code matches any user
      // Since querying is robust, we will look for a user with this referralCode
      // For simplified demonstration, let's verify if the code is valid and award $50
      if (!referralCode.startsWith('AVR-')) {
        return res.status(400).json({ error: 'Invalid referral code format' });
      }

      // Update user to state they were referred
      await updateDoc(userRef, {
        referredBy: referralCode,
        referralRewards: (userData.referralRewards || 0) + 50.00,
        updatedAt: new Date().toISOString()
      });

      // Update Portfolio with a bonus
      const portfolioRef = doc(db, `users/${userId}/portfolio/main`);
      const portfolioSnap = await getDoc(portfolioRef);
      if (portfolioSnap.exists()) {
        const pData = portfolioSnap.data();
        await updateDoc(portfolioRef, {
          balance: (pData.balance || 0) + 50.00,
          totalDeposits: (pData.totalDeposits || 0) + 50.00
        });
      }

      // Record transaction
      const txId = 'ref_bonus_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/transactions`, txId), {
        id: txId,
        userId,
        type: 'deposit',
        asset: 'USD',
        amount: 50.00,
        status: 'completed',
        txHash: 'REF-REWARD-' + referralCode,
        createdAt: new Date().toISOString()
      });

      // Create notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/notifications`, notifId), {
        id: notifId,
        userId,
        type: 'deposit',
        title: 'Referral Bonus Received!',
        message: `You received a $50.00 bonus for signing up with referral code ${referralCode}!`,
        read: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, message: 'Referral reward successfully applied!' });
    } catch (err: any) {
      console.error('Referral Reward Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. Process Crypto Deposit
  app.post('/api/process-deposit', async (req, res) => {
    const { userId, asset, amount, txHash } = req.body;
    if (!userId || !asset || !amount || !txHash) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
      const portfolioRef = doc(db, `users/${userId}/portfolio/main`);
      const portfolioSnap = await getDoc(portfolioRef);

      if (!portfolioSnap.exists()) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const pData = portfolioSnap.data();
      const depositAmount = parseFloat(amount);

      // Perform secure calculation
      const updatedBalance = (pData.balance || 0) + depositAmount;
      const updatedDeposits = (pData.totalDeposits || 0) + depositAmount;

      await updateDoc(portfolioRef, {
        balance: updatedBalance,
        totalDeposits: updatedDeposits,
        updatedAt: new Date().toISOString()
      });

      // Add to transaction history
      const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/transactions`, txId), {
        id: txId,
        userId,
        type: 'deposit',
        asset,
        amount: depositAmount,
        status: 'completed',
        txHash,
        createdAt: new Date().toISOString()
      });

      // Create Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/notifications`, notifId), {
        id: notifId,
        userId,
        type: 'deposit',
        title: 'Deposit Confirmed',
        message: `Your deposit of ${depositAmount} ${asset} has been successfully credited to your account.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, balance: updatedBalance });
    } catch (err: any) {
      console.error('Process Deposit Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. Validate and Process Withdrawal
  app.post('/api/validate-withdrawal', async (req, res) => {
    const { userId, asset, amount, address } = req.body;
    if (!userId || !asset || !amount || !address) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
      const portfolioRef = doc(db, `users/${userId}/portfolio/main`);
      const portfolioSnap = await getDoc(portfolioRef);

      if (!portfolioSnap.exists()) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const pData = portfolioSnap.data();
      const withdrawalAmount = parseFloat(amount);

      if (pData.balance < withdrawalAmount) {
        return res.status(400).json({ error: 'Insufficient account balance' });
      }

      // Check KYC status - withdraws require "verified" or "pending" status at least for simulation
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap?.data() || {};
      
      if (userData.kycStatus === 'unverified') {
        return res.status(400).json({ error: 'KYC Verification is required prior to processing withdrawals' });
      }

      // Process withdrawal securely
      const updatedBalance = pData.balance - withdrawalAmount;
      const updatedWithdrawals = (pData.totalWithdrawals || 0) + withdrawalAmount;

      await updateDoc(portfolioRef, {
        balance: updatedBalance,
        totalWithdrawals: updatedWithdrawals,
        updatedAt: new Date().toISOString()
      });

      // Add to transactions
      const txId = 'tx_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/transactions`, txId), {
        id: txId,
        userId,
        type: 'withdrawal',
        asset,
        amount: withdrawalAmount,
        status: 'completed',
        txHash: 'WITHDRAW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString()
      });

      // Create Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/notifications`, notifId), {
        id: notifId,
        userId,
        type: 'withdrawal',
        title: 'Withdrawal Processed',
        message: `Your withdrawal of ${withdrawalAmount} ${asset} to ${address.substring(0, 6)}...${address.substring(address.length - 4)} has been completed.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, balance: updatedBalance });
    } catch (err: any) {
      console.error('Validate Withdrawal Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. Simulated Trading Engine - calculates and records trade results periodically
  app.post('/api/trading-engine/simulate', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnap.data();
      if (userData.aiTradingStatus !== 'active') {
        return res.json({ status: userData.aiTradingStatus, message: 'AI trading is not active.' });
      }

      // Simulate a random trade profit
      const portfolioRef = doc(db, `users/${userId}/portfolio/main`);
      const portfolioSnap = await getDoc(portfolioRef);
      if (!portfolioSnap.exists()) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }

      const pData = portfolioSnap.data();
      const assets = ['BTC', 'ETH', 'SOL', 'AVR'];
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const profit = Number(((Math.random() * 45) + 5).toFixed(2)); // $5 to $50 profit
      
      const newBalance = pData.balance + profit;
      const newTodayPnL = (pData.todayPnL || 0) + profit;
      const originalBalance = pData.balance - (pData.todayPnL || 0);
      const newTodayPnLPercent = Number(((newTodayPnL / originalBalance) * 100).toFixed(2));
      const newOverallReturn = Number(((newBalance - pData.totalDeposits) / pData.totalDeposits * 100).toFixed(2));

      await updateDoc(portfolioRef, {
        balance: newBalance,
        todayPnL: newTodayPnL,
        todayPnLPercent: newTodayPnLPercent,
        overallReturn: newOverallReturn,
        updatedAt: new Date().toISOString()
      });

      // Add transaction history for trade
      const txId = 'trade_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/transactions`, txId), {
        id: txId,
        userId,
        type: 'trade',
        asset,
        amount: profit,
        status: 'completed',
        txHash: 'AI-TRADE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString()
      });

      // Notification
      const notifId = 'notif_' + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, `users/${userId}/notifications`, notifId), {
        id: notifId,
        userId,
        type: 'profit',
        title: 'AI Trade Executed successfully',
        message: `AverCore AI™ closed a long position on ${asset}/USDT with a profit of +$${profit}!`,
        read: false,
        createdAt: new Date().toISOString()
      });

      return res.json({ success: true, profit, balance: newBalance });
    } catch (err: any) {
      console.error('Simulation Error:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
