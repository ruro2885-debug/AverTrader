import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, Theme, Language } from '../types';

export interface UserPreferences {
  language: string;
  theme: string;
  currency: string;
  notifications: {
    marketing: boolean;
    security: boolean;
    signals: boolean;
    master?: boolean;
    profile?: boolean;
    deposits?: boolean;
    withdrawals?: boolean;
    trading?: boolean;
    system?: boolean;
    referrals?: boolean;
    criticalAlertsSound?: boolean;
  };
  dashboardPreferences: {
    showSignals: boolean;
    showWatchlist: boolean;
    showNews: boolean;
  };
  twoFactorEnabled?: boolean;
  biometricsEnabled?: boolean;
  rememberMeEnabled?: boolean;
}

export interface PortfolioData {
  totalValue: number;
  todayPnL: number;
  todayPnLPercent: number;
  overallReturn: number;
  realizedPnL: number;
  unrealizedPnL: number;
  healthScore: number;
  diversificationScore: number;
  volatility: number;
  sharpeRatio: number;
  winRate: number;
  maxDrawdown: number;
  recoveryFactor: number;
  riskAdjustedReturn: number;
}

export interface DepositItem {
  id: string;
  amount: number;
  txHash: string;
  status: string;
  date: string;
}

export interface WithdrawalItem {
  id: string;
  amount: number;
  txHash: string;
  status: string;
  date: string;
}

export type NotificationCategory = 
  | 'account' 
  | 'security' 
  | 'trading' 
  | 'portfolio' 
  | 'deposit' 
  | 'withdrawal' 
  | 'vault' 
  | 'copy_trading' 
  | 'swap' 
  | 'referral' 
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  createdAtTimestamp: number;
  date: string;
  read: boolean;
  actionUrl?: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface HistoryItem {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  asset?: string;
  amount: number;
  valueUsd: number;
  date: string;
  status: string;
}

export interface User extends UserProfile {
  notificationsList: NotificationItem[];
  history: HistoryItem[]; // Kept for legacy if needed, but we'll use trades subcollection
  deposits: DepositItem[];
  withdrawals: WithdrawalItem[];
  portfolio: PortfolioData;
  holdings: Holding[];
  trades: TradeHistoryItem[];
  snapshots: PortfolioSnapshot[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateOnboarding: (completed: boolean) => Promise<void>;
  updateProfilePhoto: (file: File | string | null) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  addDeposit: (amount: number) => Promise<void>;
  addWithdrawal: (amount: number) => Promise<void>;
  
  addNotification: (category: NotificationCategory, priority: NotificationPriority, title: string, body: string, actionUrl?: string, action?: string, metadata?: Record<string, any>, userId?: string) => Promise<void>;
  markNotificationRead: (id: string, readState?: boolean) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  pinNotification: (id: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;

  notifications: NotificationItem[];
  updateProfile: (dataOrDisplayName: Partial<User> | string, username?: string, email?: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  country: string;
  phoneNumber?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signOutUser: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  forgotPassword: async () => {},
  updateOnboarding: async () => {},
  updateProfilePhoto: async () => {},
  updateUserPreferences: async () => {},
  addDeposit: async () => {},
  addWithdrawal: async () => {},
  
  addNotification: async () => {},
  markNotificationRead: async () => {},
  markAllNotificationsRead: async () => {},
  deleteNotification: async () => {},
  clearNotifications: async () => {},
  pinNotification: async () => {},
  archiveNotification: async () => {},

  updateProfile: async () => {},
  changePassword: async () => {},
  verifyCurrentPassword: async () => false,
});

const defaultUserPreferences: UserPreferences = {
  language: 'EN',
  theme: 'dark',
  currency: 'USD',
  notifications: {
    marketing: true,
    security: true,
    signals: true,
    master: true,
    profile: true,
    deposits: true,
    withdrawals: true,
    trading: true,
    system: true,
    referrals: true,
    criticalAlertsSound: true,
  },
  dashboardPreferences: {
    showSignals: true,
    showWatchlist: true,
    showNews: true,
  },
  twoFactorEnabled: false,
  biometricsEnabled: false,
  rememberMeEnabled: false,
};



export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [previewPhotoURL, setPreviewPhotoURL] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const userWithPreview = useMemo(() => {
    if (!user) return null;
    
    // Determine the effective avatar: preview (if set) -> user.avatarUrl -> user.profilePhotoURL
    let effectiveAvatar = user.avatarUrl || user.profilePhotoURL || "";
    let hasCustomPhoto = !!user.avatarUrl || !!user.profilePhotoURL;
    
    if (previewPhotoURL) {
      effectiveAvatar = previewPhotoURL;
      hasCustomPhoto = true;
    }
    
    return {
      ...user,
      profilePhotoURL: effectiveAvatar,
      avatarUrl: effectiveAvatar,
      hasCustomPhoto
    };
  }, [user, previewPhotoURL]);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;
    let unsubHoldings: (() => void) | null = null;
    let unsubTrades: (() => void) | null = null;
    let unsubSnapshots: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubNotifications) {
        unsubNotifications();
        unsubNotifications = null;
      }
      if (unsubHoldings) {
        unsubHoldings();
        unsubHoldings = null;
      }
      if (unsubTrades) {
        unsubTrades();
        unsubTrades = null;
      }
      if (unsubSnapshots) {
        unsubSnapshots();
        unsubSnapshots = null;
      }

      if (firebaseUser) {
        // Retrieve and apply cached user profile immediately to avoid flickering
        const cachedUserStr = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            setUser(cachedUser);
            const notifs = cachedUser.notificationsList || [];
            setNotifications(notifs);
            setLoading(false);
          } catch (e) {
            console.error("Error loading cached user:", e);
          }
        }

        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for real-time updates to the user profile
        unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            const updatedUser = {
              ...userData,
              notificationsList: userData.notificationsList || [],
              history: userData.history || [],
              deposits: userData.deposits || [],
              withdrawals: userData.withdrawals || [],
              portfolio: userData.portfolio || {
                totalValue: 0,
                todayPnL: 0,
                todayPnLPercent: 0,
                overallReturn: 0,
                realizedPnL: 0,
                unrealizedPnL: 0,
                healthScore: 0,
                diversificationScore: 0,
                volatility: 0,
                sharpeRatio: 0,
                winRate: 0,
                maxDrawdown: 0,
                recoveryFactor: 0,
                riskAdjustedReturn: 0
              }
            } as User;
            setUser(prev => {
              const merged = {
                ...updatedUser,
                holdings: prev?.holdings || [],
                trades: prev?.trades || [],
                snapshots: prev?.snapshots || []
              } as User;
              localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(merged));
              return merged;
            });
            
            const notifs = userData.notificationsList || [];
            notifs.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
            setNotifications(notifs);
          } else {
            // Profile doc doesn't exist yet, might be in the middle of registration
            console.warn("User profile document not found in Firestore");
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });

        // Subcollection Listeners for Portfolio Intelligence
        const holdingsRef = collection(db, 'users', firebaseUser.uid, 'holdings');
        unsubHoldings = onSnapshot(holdingsRef, (snap) => {
          const holdings = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Holding[];
          setUser(prev => prev ? { ...prev, holdings } : null);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/holdings`);
        });

        const tradesRef = collection(db, 'users', firebaseUser.uid, 'trades');
        unsubTrades = onSnapshot(query(tradesRef, orderBy('timestamp', 'desc')), (snap) => {
          const trades = snap.docs.map(d => ({ id: d.id, ...d.data() })) as TradeHistoryItem[];
          setUser(prev => prev ? { ...prev, trades } : null);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/trades`);
        });

        const snapshotsRef = collection(db, 'users', firebaseUser.uid, 'snapshots');
        unsubSnapshots = onSnapshot(query(snapshotsRef, orderBy('timestamp', 'desc')), (snap) => {
          const snapshots = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PortfolioSnapshot[];
          setUser(prev => prev ? { ...prev, snapshots } : null);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/snapshots`);
        });

        // Notifications are now parsed in the user document listener.

        // Update lastLogin
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp(),
              lastUpdated: serverTimestamp()
            });
          }
        } catch (err) {
          console.error("Error updating lastLogin:", err);
        }
      } else {
        // User is signed out
        setUser(null);
        setNotifications([]);
        setPreviewPhotoURL(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubNotifications) unsubNotifications();
    };
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      // 1. Create Firebase Auth Account client-side
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // 2. Profile Photo
      const username = data.username || data.email.split('@')[0];
      let profilePhotoURL = "";

      // 3. Create Firestore Document
      const newUser: User = {
        uid: firebaseUser.uid,
        username: username,
        email: data.email,
        profilePhotoURL,
        avatarUrl: "",
        hasCustomPhoto: false,
        country: data.country,
        phoneNumber: data.phoneNumber || '',
        accountType: 'Standard',
        accountStatus: 'Active',
        portfolioBalance: 0,
        availableBalance: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        referredBy: data.referralCode || null,
        referralCode: `AVR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        referralCount: 0,
        preferredLanguage: 'EN',
        theme: 'dark',
        notificationSettings: {
          marketing: true,
          security: true,
          signals: true,
          master: true
        },
        biometricEnabled: false,
        aiTradingEnabled: false,
        riskPreference: 'Moderate',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        onboardingCompleted: false,
        notificationsList: [],
        history: [],
        deposits: [],
        withdrawals: [],
        portfolio: {
          totalValue: 100000,
          todayPnL: 1240.50,
          todayPnLPercent: 1.25,
          overallReturn: 15.4,
          realizedPnL: 8450.20,
          unrealizedPnL: 6950.30,
          healthScore: 94,
          diversificationScore: 88,
          volatility: 12.4,
          sharpeRatio: 2.1,
          winRate: 68,
          maxDrawdown: 8.5,
          recoveryFactor: 3.2,
          riskAdjustedReturn: 18.5
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // Seed initial holdings
      const initialHoldings = [
        { ticker: 'BTC', name: 'Bitcoin', quantity: 0.85, avgEntry: 52000, currentPrice: 58000, marketValue: 49300, pnl: 5100, change24H: 2.5, allocationPct: 49.3, logoColor: 'from-amber-500 to-orange-600', logoText: '₿', aiDetails: "BTC accumulation phase strong. Support at $55k.", riskRating: 'Low', confidenceScore: 94, lastAiDecision: 'HODL' },
        { ticker: 'ETH', name: 'Ethereum', quantity: 12, avgEntry: 2800, currentPrice: 3100, marketValue: 37200, pnl: 3600, change24H: 1.8, allocationPct: 37.2, logoColor: 'from-slate-400 to-slate-600', logoText: 'Ξ', aiDetails: "ETH 2.0 staking rewards increasing.", riskRating: 'Low', confidenceScore: 88, lastAiDecision: 'ACCUMULATE' },
        { ticker: 'SOL', name: 'Solana', quantity: 120, avgEntry: 110, currentPrice: 112, marketValue: 13440, pnl: 240, change24H: -0.5, allocationPct: 13.5, logoColor: 'from-purple-500 to-teal-500', logoText: 'S', aiDetails: "Network stability improved.", riskRating: 'Medium', confidenceScore: 82, lastAiDecision: 'REBALANCE' }
      ];

      for (const h of initialHoldings) {
        await addDoc(collection(db, 'users', firebaseUser.uid, 'holdings'), h);
      }

      // Seed initial trades
      const initialTrades = [
        { ticker: 'BTC', side: 'buy', quantity: 0.85, price: 52000, timestamp: serverTimestamp(), type: 'ai', status: 'Completed', reason: 'Bullish divergence detected' },
        { ticker: 'ETH', side: 'buy', quantity: 12, price: 2800, timestamp: serverTimestamp(), type: 'ai', status: 'Completed', reason: 'Support level bounce' },
        { ticker: 'SOL', side: 'buy', quantity: 120, price: 110, timestamp: serverTimestamp(), type: 'manual', status: 'Completed' }
      ];

      for (const t of initialTrades) {
        await addDoc(collection(db, 'users', firebaseUser.uid, 'trades'), t);
      }

      // Seed initial snapshots for chart
      const initialSnapshots = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        initialSnapshots.push({
          timestamp: d.toISOString(),
          totalValue: 80000 + (30 - i) * 600 + Math.random() * 1000,
          realizedPnl: 5000 + (30 - i) * 100,
          unrealizedPnl: 2000 + (30 - i) * 150,
          exposure: 0.8,
          cash: 20000
        });
      }

      for (const s of initialSnapshots) {
        await addDoc(collection(db, 'users', firebaseUser.uid, 'snapshots'), s);
      }

      // Add Welcome Notifications
      await addNotification(
        'account',
        'medium',
        'Welcome to AverNoxTrader',
        'Welcome to AverNoxTrader! Your professional trading account is successfully initialized. Explore the market terminal and configure your AI settings to begin.',
        undefined,
        undefined,
        undefined,
        firebaseUser.uid
      );

      await addNotification(
        'vault',
        'high',
        'Welcome Bonus Available',
        'Congratulations! A standard $150 sign-up promotional bonus has been successfully credited to your locked vaults. Complete onboarding and platform activities to begin unlocking rules.',
        undefined,
        undefined,
        undefined,
        firebaseUser.uid
      );

      await addNotification(
        'account',
        'medium',
        'Account Created',
        `Welcome to AvernoxTrader, ${data.username}! Your account has been successfully created and secured.`,
        undefined,
        undefined,
        undefined,
        firebaseUser.uid
      );

      // 4. Grant $150 locked bonus directly to Firestore client-side
      try {
        const bonusPath = `userBonuses/${firebaseUser.uid}/instances/signup-150`;
        await setDoc(doc(db, 'userBonuses', firebaseUser.uid, 'instances', 'signup-150'), {
          bonusId: 'signup-150',
          title: 'Sign-Up Bonus',
          description: '$150 Sign-Up Bonus',
          rewardAmount: 150,
          rewardCurrency: 'USD',
          status: 'locked',
          locked: true,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `userBonuses/${firebaseUser.uid}`);
      }

      // 5. Send Email Verification
      await sendEmailVerification(firebaseUser).then(() => {
        addNotification(
          'security',
          'medium',
          'Email Verification Sent',
          'A verification link has been sent to your email address. Please verify your account to access all features.'
        );
      }).catch(err => console.error("Error sending verification email:", err));

    } catch (error: any) {
      // Log for development
      console.error("Firebase Registration Error:", error.code, error.message);

      // Map errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("An account with this email already exists.");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("Your password does not meet the security requirements.");
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error("No internet connection. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error("Too many attempts. Please try again later.");
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Authentication service is temporarily unavailable.");
      }
      
      throw new Error(error.message || "Unable to create account. Please try again later.");
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      // Set persistence based on Remember Me, catching any storage-unsupported error in iframe
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pError) {
        console.warn("Failed to set auth persistence (possibly blocked in iframe):", pError);
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Auth signIn error:", error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        throw new Error("Password or Email Incorrect.");
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error("Network connection unavailable. Please try again.");
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Email/Password sign-in is not enabled in the Firebase Console.");
      }
      throw new Error(error.message || "Something went wrong. Please try again.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const addNotification = useCallback(async (
    category: NotificationCategory,
    priority: NotificationPriority,
    title: string,
    body: string,
    actionUrl?: string,
    action?: string,
    metadata?: Record<string, any>,
    userId?: string
  ) => {
    const targetUserId = userId || userRef.current?.uid;
    if (targetUserId) {
      const userDocRef = doc(db, 'users', targetUserId);
      console.log(`[DEBUG_NOTIFICATION] Creating notification for ${targetUserId}: "${title}" - "${body}" (category: ${category}, priority: ${priority})`);
      try {
        const newNotif = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          userId: targetUserId,
          category,
          priority,
          title,
          body,
          read: false,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAtTimestamp: Date.now(),
          actionUrl: actionUrl || '',
          action: action || null,
          metadata: metadata || {},
          pinned: false,
          archived: false,
        };
        const { arrayUnion } = await import('firebase/firestore');
        await updateDoc(userDocRef, {
          notificationsList: arrayUnion(newNotif)
        });
        console.log(`[DEBUG_NOTIFICATION_SUCCESS] Notification successfully saved to Firestore for user ${targetUserId}`);
      } catch (err) {
        console.error(`[DEBUG_NOTIFICATION_ERROR] Failed to write notification to Firestore for user ${targetUserId}:`, err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUserId}`);
      }
    } else {
      console.warn(`[DEBUG_NOTIFICATION_WARN] Could not create notification "${title}" because no user ID is available`);
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string, readState?: boolean) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.id !== id);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.pinned); // Keep pinned ones
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const pinNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const archiveNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      try {
        const userDocRef = doc(db, 'users', userRef.current.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const notifs = data.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, archived: !n.archived } : n);
          await updateDoc(userDocRef, { notificationsList: updatedNotifs });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userRef.current.uid}`);
      }
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        throw new Error("No internet connection. Please reconnect and try again.");
      }
      // For security, do not leak user-not-found
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        // Resolve successfully to prevent email enumeration
        return;
      }
      throw new Error("Unable to send the reset email right now. Please try again later.");
    }
  }, []);

  const updateOnboarding = useCallback(async (completed: boolean) => {
    if (userRef.current) {
      const userDocRef = doc(db, 'users', userRef.current.uid);
      await updateDoc(userDocRef, { 
        onboardingCompleted: completed,
        lastUpdated: serverTimestamp()
      });
      if (completed) {
        await addNotification(
          'account',
          'medium',
          'Onboarding Completed',
          'Thank you for completing your account onboarding! Your profile is now fully verified and prepared for standard trading activities.'
        );
      }
    }
  }, [addNotification]);

  const updateProfilePhoto = useCallback(async (file: File | string | null) => {
    if (userRef.current) {
      const uid = userRef.current.uid;
      const userDocRef = doc(db, 'users', uid);

      if (file === null || file === '') {
        // Delete avatar files from Firebase Storage if they exist
        try {
          const storageRefNew = ref(storage, `avatars/${uid}/profile.jpg`);
          await deleteObject(storageRefNew);
        } catch (e) {
          console.log("No avatar found at avatars/ path or error deleting:", e);
        }
        try {
          const storageRefOld = ref(storage, `profile_photos/${uid}`);
          await deleteObject(storageRefOld);
        } catch (e) {
          console.log("No profile photo found at profile_photos/ path or error deleting:", e);
        }

        await updateDoc(userDocRef, { 
          profilePhotoURL: "",
          avatarUrl: "",
          hasCustomPhoto: false,
          lastUpdated: serverTimestamp()
        });
        setPreviewPhotoURL(null);
        await addNotification(
          'account',
          'low',
          'Profile Picture Removed',
          'Your profile picture has been successfully removed.'
        );
        return;
      }

      if (typeof file === 'string') {
        if (file.startsWith('blob:')) {
          // Set local preview URL immediately for instantaneous UI updates
          setPreviewPhotoURL(file);
          return;
        }

        const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
        await uploadString(storageRef, file, 'data_url');
        const photoURL = await getDownloadURL(storageRef);
        
        await updateDoc(userDocRef, { 
          profilePhotoURL: photoURL,
          avatarUrl: photoURL,
          hasCustomPhoto: true,
          lastUpdated: serverTimestamp()
        });

        // Reset the local preview URL now that the Firebase storage is synced
        setPreviewPhotoURL(null);

        await addNotification(
          'account',
          'low',
          'Profile Picture Changed',
          'Your profile picture has been successfully updated.'
        );
      } else {
        const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);
        
        await updateDoc(userDocRef, { 
          profilePhotoURL: photoURL,
          avatarUrl: photoURL,
          hasCustomPhoto: true,
          lastUpdated: serverTimestamp()
        });

        setPreviewPhotoURL(null);

        await addNotification(
          'account',
          'low',
          'Profile Picture Changed',
          'Your profile picture has been successfully updated.'
        );
      }
    }
  }, [addNotification]);

  const updateUserPreferences = useCallback(async (prefs: Partial<UserPreferences>) => {
    if (userRef.current) {
      const userDocRef = doc(db, 'users', userRef.current.uid);
      // We map our Preferences interface to the Firestore document structure
      const updates: any = {
        lastUpdated: serverTimestamp()
      };
      
      if (prefs.theme) updates.theme = prefs.theme;
      if (prefs.language) updates.preferredLanguage = prefs.language;
      if (prefs.currency) updates.currency = prefs.currency;
      if (prefs.notifications) updates.notificationSettings = prefs.notifications;
      if (prefs.biometricsEnabled !== undefined) updates.biometricEnabled = prefs.biometricsEnabled;
      if (prefs.rememberMeEnabled !== undefined) updates.rememberMeEnabled = prefs.rememberMeEnabled;

      await updateDoc(userDocRef, updates);

      await addNotification(
        'system',
        'low',
        'Security Settings Changed',
        'Your account security preferences have been successfully updated.'
      );
    }
  }, [addNotification]);

  const addDeposit = useCallback(async (amount: number) => {
    if (userRef.current) {
      const userDocRef = doc(db, 'users', userRef.current.uid);
      const txHash = '0x' + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
      const dateStr = new Date().toISOString();
      
      const newDeposit: DepositItem = {
        id: 'dep-' + Date.now(),
        amount,
        txHash,
        status: 'Completed',
        date: dateStr,
      };

      const newHistoryItem: HistoryItem = {
        id: 'hist-' + Date.now(),
        type: 'deposit',
        amount,
        valueUsd: amount,
        date: dateStr,
        status: 'Completed',
      };

      // In a real app, you'd use a transaction or cloud function to update balances securely
      await updateDoc(userDocRef, {
        portfolioBalance: (userRef.current.portfolioBalance || 0) + amount,
        availableBalance: (userRef.current.availableBalance || 0) + amount,
        totalDeposits: (userRef.current.totalDeposits || 0) + amount,
        deposits: [newDeposit, ...(userRef.current.deposits || [])],
        history: [newHistoryItem, ...(userRef.current.history || [])],
        lastUpdated: serverTimestamp()
      });

      await addNotification('deposit', 'medium', 'Deposit Submitted', `Your deposit of $${amount.toLocaleString()} has been submitted for processing.`);
      await addNotification('deposit', 'medium', 'Deposit Approved', `Successfully deposited $${amount.toLocaleString()} to your wallet.`);
    }
  }, [addNotification]);

  const addWithdrawal = useCallback(async (amount: number) => {
    if (userRef.current) {
      if (userRef.current.availableBalance < amount) {
        throw new Error("Insufficient funds available for withdrawal.");
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
      const txHash = '0x' + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
      const dateStr = new Date().toISOString();
      
      const newWithdrawal: WithdrawalItem = {
        id: 'wth-' + Date.now(),
        amount,
        txHash,
        status: 'Completed',
        date: dateStr,
      };

      const newHistoryItem: HistoryItem = {
        id: 'hist-' + Date.now(),
        type: 'withdrawal',
        amount,
        valueUsd: amount,
        date: dateStr,
        status: 'Completed',
      };

      await updateDoc(userDocRef, {
        portfolioBalance: (userRef.current.portfolioBalance || 0) - amount,
        availableBalance: (userRef.current.availableBalance || 0) - amount,
        totalWithdrawals: (userRef.current.totalWithdrawals || 0) + amount,
        withdrawals: [newWithdrawal, ...(userRef.current.withdrawals || [])],
        history: [newHistoryItem, ...(userRef.current.history || [])],
        lastUpdated: serverTimestamp()
      });

      await addNotification('withdrawal', 'medium', 'Withdrawal Requested', `Your withdrawal request of $${amount.toLocaleString()} has been received.`);
      await addNotification('withdrawal', 'medium', 'Withdrawal Completed', `Successfully withdrew $${amount.toLocaleString()} from your wallet.`);
    }
  }, [addNotification]);

  const updateProfile = useCallback(async (dataOrDisplayName: Partial<User> | string, username?: string, email?: string) => {
    if (userRef.current) {
      const userDocRef = doc(db, 'users', userRef.current.uid);
      
      let updates: any = {
        lastUpdated: serverTimestamp()
      };

      if (typeof dataOrDisplayName === 'string') {
        updates.displayName = dataOrDisplayName;
        if (username) updates.username = username;
        if (email) updates.email = email;
      } else {
        updates = {
          ...updates,
          ...dataOrDisplayName
        };
      }

      const oldProfile = userRef.current;
      await updateDoc(userDocRef, updates);

      let body = 'Your profile information has been successfully updated.';
      if (email && email !== oldProfile.email) {
        body = 'Your email address has been successfully updated.';
      }

      await addNotification(
        'account',
        'medium',
        'Profile Updated',
        body
      );
    }
  }, [addNotification]);

  const changePassword = useCallback(async (newPassword: string) => {
    // Firebase Auth handles password change via updatePassword on the currentUser
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const { updatePassword } = await import('firebase/auth');
        await updatePassword(firebaseUser, newPassword);
        
        await addNotification(
          'security',
          'high',
          'Password Changed',
          'Your account password has been successfully changed. If you did not perform this action, please contact support immediately.'
        );
      } catch (err: any) {
        console.error("Error changing password:", err);
        throw err;
      }
    }
  }, [addNotification]);

  const verifyCurrentPassword = useCallback(async (password: string) => {
    // This usually requires re-authenticating with the current credentials
    return true; // Simplified for now
  }, []);

  const contextValue = useMemo(() => ({
    user: userWithPreview,
    loading,
    notifications,
    signOutUser,
    signUp,
    signIn,
    forgotPassword,
    updateOnboarding,
    updateProfilePhoto,
    updateUserPreferences,
    addDeposit,
    addWithdrawal,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
    pinNotification,
    archiveNotification,
    updateProfile,
    changePassword,
    verifyCurrentPassword,
  }), [
    userWithPreview,
    loading,
    notifications,
    signOutUser,
    signUp,
    signIn,
    forgotPassword,
    updateOnboarding,
    updateProfilePhoto,
    updateUserPreferences,
    addDeposit,
    addWithdrawal,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
    pinNotification,
    archiveNotification,
    updateProfile,
    changePassword,
    verifyCurrentPassword,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
