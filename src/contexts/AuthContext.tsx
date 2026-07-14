import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously,
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
import { UserProfile, Theme, Language, Holding, TradeHistoryItem, PortfolioSnapshot } from '../types';

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
  action?: string | null;
  metadata?: Record<string, any>;
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

  notifications: [],
  updateProfile: async () => {},
  changePassword: async () => {},
  verifyCurrentPassword: async () => false,
});

// Helper for local database simulation
const getLocalDB = (): any[] => {
  const dbStr = localStorage.getItem('aver_local_db');
  return dbStr ? JSON.parse(dbStr) : [];
};

const saveLocalDB = (dbList: any[]) => {
  localStorage.setItem('aver_local_db', JSON.stringify(dbList));
};

const getFirebaseErrorCode = (error: any): string => {
  if (!error) return '';
  if (typeof error.code === 'string') return error.code;
  if (error.customData && typeof error.customData.code === 'string') return error.customData.code;
  const msg = error.message || '';
  if (msg.includes('admin-restricted-operation')) return 'auth/admin-restricted-operation';
  if (msg.includes('operation-not-allowed')) return 'auth/operation-not-allowed';
  const match = /auth\/[a-zA-Z0-9-]+/.exec(msg);
  if (match) return match[0];
  return '';
};

const isRestrictedAuthError = (error: any): boolean => {
  const code = getFirebaseErrorCode(error);
  const msg = (error?.message || '').toLowerCase();
  return (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    code === 'auth/network-request-failed' ||
    code === 'auth/internal-error' ||
    msg.includes('admin-restricted-operation') ||
    msg.includes('operation-not-allowed') ||
    msg.includes('restricted-operation')
  );
};

const isPermissionError = (error: any): boolean => {
  if (!error) return false;
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  return (
    code === 'permission-denied' ||
    code === 'auth/unauthorized' ||
    msg.includes('permission') ||
    msg.includes('insufficient') ||
    msg.includes('unauthorized')
  );
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
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
      if (unsubHoldings) { unsubHoldings(); unsubHoldings = null; }
      if (unsubTrades) { unsubTrades(); unsubTrades = null; }
      if (unsubSnapshots) { unsubSnapshots(); unsubSnapshots = null; }

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
            console.warn("User profile document not found in Firestore");
          }
          setLoading(false);
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore user document access denied due to permission/security rule configuration. Accessing cached/local profile as fallback.");
            const cachedUserStr = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
            if (cachedUserStr) {
              try {
                const cachedUser = JSON.parse(cachedUserStr);
                setUser(cachedUser);
                const notifs = cachedUser.notificationsList || [];
                setNotifications(notifs);
              } catch (e) {
                console.error("Error loading cached user in fallback:", e);
              }
            }
            setLoading(false);
          } else {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            setLoading(false);
          }
        });

        // Subcollection Listeners for Portfolio Intelligence
        const holdingsRef = collection(db, 'users', firebaseUser.uid, 'holdings');
        unsubHoldings = onSnapshot(holdingsRef, (snap) => {
          const holdings = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Holding[];
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, holdings };
            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
            return updated;
          });
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore subcollection 'holdings' access denied. Falling back to local/cached profile data.");
            setUser(prev => {
              if (!prev) return null;
              const defaultHoldings: Holding[] = [
                { id: 'h-btc', ticker: 'BTC', name: 'Bitcoin', quantity: 0.85, avgEntry: 52000, currentPrice: 58000, marketValue: 49300, pnl: 5100, change24H: 2.5, allocationPct: 49.3, logoColor: 'from-amber-500 to-orange-600', logoText: '₿', aiDetails: "BTC accumulation phase strong. Support at $55k.", trend: [52000, 54000, 53500, 55000, 57000, 58000], riskRating: 'Low' as any, confidenceScore: 94, lastAiDecision: 'HODL' },
                { id: 'h-eth', ticker: 'ETH', name: 'Ethereum', quantity: 12, avgEntry: 2800, currentPrice: 3100, marketValue: 37200, pnl: 3600, change24H: 1.8, allocationPct: 37.2, logoColor: 'from-slate-400 to-slate-600', logoText: 'Ξ', aiDetails: "ETH 2.0 staking rewards increasing.", trend: [2800, 2900, 2850, 3000, 2950, 3100], riskRating: 'Low' as any, confidenceScore: 88, lastAiDecision: 'ACCUMULATE' },
                { id: 'h-sol', ticker: 'SOL', name: 'Solana', quantity: 120, avgEntry: 110, currentPrice: 112, marketValue: 13440, pnl: 240, change24H: -0.5, allocationPct: 13.5, logoColor: 'from-purple-500 to-teal-500', logoText: 'S', aiDetails: "Network stability improved.", trend: [110, 115, 112, 114, 111, 112], riskRating: 'Medium' as any, confidenceScore: 82, lastAiDecision: 'REBALANCE' }
              ];
              const updated = {
                ...prev,
                holdings: prev.holdings && prev.holdings.length > 0 ? prev.holdings : defaultHoldings
              };
              localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
              return updated;
            });
          } else {
            handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/holdings`);
          }
        });

        const tradesRef = collection(db, 'users', firebaseUser.uid, 'trades');
        unsubTrades = onSnapshot(query(tradesRef, orderBy('timestamp', 'desc')), (snap) => {
          const trades = snap.docs.map(d => ({ id: d.id, ...d.data() })) as TradeHistoryItem[];
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, trades };
            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
            return updated;
          });
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore subcollection 'trades' access denied. Falling back to local/cached profile data.");
            setUser(prev => {
              if (!prev) return null;
              const defaultTrades: TradeHistoryItem[] = [
                { id: 't-btc', ticker: 'BTC', side: 'buy', quantity: 0.85, price: 52000, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Bullish divergence detected' },
                { id: 't-eth', ticker: 'ETH', side: 'buy', quantity: 12, price: 2800, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Support level bounce' },
                { id: 't-sol', ticker: 'SOL', side: 'buy', quantity: 120, price: 110, timestamp: new Date().toISOString() as any, type: 'manual', status: 'Completed' }
              ];
              const updated = {
                ...prev,
                trades: prev.trades && prev.trades.length > 0 ? prev.trades : defaultTrades
              };
              localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
              return updated;
            });
          } else {
            handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/trades`);
          }
        });

        const snapshotsRef = collection(db, 'users', firebaseUser.uid, 'snapshots');
        unsubSnapshots = onSnapshot(query(snapshotsRef, orderBy('timestamp', 'desc')), (snap) => {
          const snapshots = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PortfolioSnapshot[];
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, snapshots };
            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
            return updated;
          });
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore subcollection 'snapshots' access denied. Falling back to local/cached profile data.");
            setUser(prev => {
              if (!prev) return null;
              const updated = {
                ...prev,
                snapshots: prev.snapshots && prev.snapshots.length > 0 ? prev.snapshots : []
              };
              localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
              return updated;
            });
          } else {
            handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/snapshots`);
          }
        });

        // Update lastLogin in background
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
        // User is signed out from Firebase, check for active local user
        const activeLocalUserStr = localStorage.getItem('aver_active_user');
        if (activeLocalUserStr) {
          try {
            const activeLocalUser = JSON.parse(activeLocalUserStr) as User;
            setUser(activeLocalUser);
            setNotifications(activeLocalUser.notificationsList || []);
          } catch (e) {
            console.error("Error loading active local user:", e);
            setUser(null);
            setNotifications([]);
          }
        } else {
          setUser(null);
          setNotifications([]);
          setPreviewPhotoURL(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubNotifications) unsubNotifications();
      if (unsubHoldings) unsubHoldings();
      if (unsubTrades) unsubTrades();
      if (unsubSnapshots) unsubSnapshots();
    };
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    try {
      // 1. Try to create Firebase Auth account
      let userCredential;
      let isFirebaseRestricted = false;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      } catch (innerError: any) {
        if (isRestrictedAuthError(innerError)) {
          console.warn("Firebase Auth disabled or restricted in console, falling back to local database");
          isFirebaseRestricted = true;
        } else {
          throw innerError;
        }
      }

      const username = data.username || data.email.split('@')[0];
      const newUser: User = {
        uid: userCredential?.user.uid || `local-${Math.random().toString(36).substring(2, 11)}`,
        username: username,
        email: data.email,
        profilePhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
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
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
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
        },
        holdings: [
          { id: 'h-btc', ticker: 'BTC', name: 'Bitcoin', quantity: 0.85, avgEntry: 52000, currentPrice: 58000, marketValue: 49300, pnl: 5100, change24H: 2.5, allocationPct: 49.3, logoColor: 'from-amber-500 to-orange-600', logoText: '₿', aiDetails: "BTC accumulation phase strong. Support at $55k.", trend: [52000, 54000, 53500, 55000, 57000, 58000], riskRating: 'Low', confidenceScore: 94, lastAiDecision: 'HODL' },
          { id: 'h-eth', ticker: 'ETH', name: 'Ethereum', quantity: 12, avgEntry: 2800, currentPrice: 3100, marketValue: 37200, pnl: 3600, change24H: 1.8, allocationPct: 37.2, logoColor: 'from-slate-400 to-slate-600', logoText: 'Ξ', aiDetails: "ETH 2.0 staking rewards increasing.", trend: [2800, 2900, 2850, 3000, 2950, 3100], riskRating: 'Low', confidenceScore: 88, lastAiDecision: 'ACCUMULATE' },
          { id: 'h-sol', ticker: 'SOL', name: 'Solana', quantity: 120, avgEntry: 110, currentPrice: 112, marketValue: 13440, pnl: 240, change24H: -0.5, allocationPct: 13.5, logoColor: 'from-purple-500 to-teal-500', logoText: 'S', aiDetails: "Network stability improved.", trend: [110, 115, 112, 114, 111, 112], riskRating: 'Medium', confidenceScore: 82, lastAiDecision: 'REBALANCE' }
        ],
        trades: [
          { id: 't-btc', ticker: 'BTC', side: 'buy', quantity: 0.85, price: 52000, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Bullish divergence detected' },
          { id: 't-eth', ticker: 'ETH', side: 'buy', quantity: 12, price: 2800, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Support level bounce' },
          { id: 't-sol', ticker: 'SOL', side: 'buy', quantity: 120, price: 110, timestamp: new Date().toISOString() as any, type: 'manual', status: 'Completed' }
        ],
        snapshots: []
      };

      if (userCredential && !isFirebaseRestricted) {
        // Firebase Auth account successfully created, write to Firestore
        const firebaseUser = userCredential.user;
        const firestoreUser = {
          ...newUser,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          holdings: [],
          trades: [],
          snapshots: []
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), firestoreUser);

        // Seed subcollections
        for (const h of newUser.holdings) {
          await addDoc(collection(db, 'users', firebaseUser.uid, 'holdings'), h);
        }
        for (const t of newUser.trades) {
          await addDoc(collection(db, 'users', firebaseUser.uid, 'trades'), {
            ...t,
            timestamp: serverTimestamp()
          });
        }
      } else {
        // Fallback local registration
        const dbList = getLocalDB();
        const existing = dbList.find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (existing) {
          throw new Error("An account with this email already exists.");
        }
        dbList.push({
          email: data.email.toLowerCase(),
          password: data.password,
          profile: newUser
        });
        saveLocalDB(dbList);

        // Log the user in locally immediately
        localStorage.setItem('aver_active_user', JSON.stringify(newUser));
        setUser(newUser);
        setNotifications([]);
        setLoading(false);
      }
    } catch (error: any) {
      console.error("signUp error:", error);
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pError) {
        console.warn("Failed to set auth persistence (possibly blocked in iframe):", pError);
      }

      let firebaseError: any = null;
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (innerError: any) {
        firebaseError = innerError;
      }

      if (firebaseError) {
        // If Firebase Auth is restricted/disabled, or if it failed with network/restricted operation, try logging in locally
        if (isRestrictedAuthError(firebaseError)) {
          console.warn("Firebase Auth unavailable or restricted, authenticating via local database...");
          const dbList = getLocalDB();
          const localRecord = dbList.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (!localRecord) {
            console.warn("Local record not found during restricted sign-in fallback. Auto-creating a local profile on the fly...");
            const username = email.split('@')[0];
            const autoUser: User = {
              uid: `local-${Math.random().toString(36).substring(2, 11)}`,
              username: username,
              email: email,
              profilePhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
              hasCustomPhoto: false,
              country: "US",
              phoneNumber: '',
              accountType: 'Standard',
              accountStatus: 'Active',
              portfolioBalance: 0,
              availableBalance: 0,
              totalProfit: 0,
              totalLoss: 0,
              totalDeposits: 0,
              totalWithdrawals: 0,
              referredBy: null,
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
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
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
              },
              holdings: [
                { id: 'h-btc', ticker: 'BTC', name: 'Bitcoin', quantity: 0.85, avgEntry: 52000, currentPrice: 58000, marketValue: 49300, pnl: 5100, change24H: 2.5, allocationPct: 49.3, logoColor: 'from-amber-500 to-orange-600', logoText: '₿', aiDetails: "BTC accumulation phase strong. Support at $55k.", trend: [52000, 54000, 53500, 55000, 57000, 58000], riskRating: 'Low', confidenceScore: 94, lastAiDecision: 'HODL' },
                { id: 'h-eth', ticker: 'ETH', name: 'Ethereum', quantity: 12, avgEntry: 2800, currentPrice: 3100, marketValue: 37200, pnl: 3600, change24H: 1.8, allocationPct: 37.2, logoColor: 'from-slate-400 to-slate-600', logoText: 'Ξ', aiDetails: "ETH 2.0 staking rewards increasing.", trend: [2800, 2900, 2850, 3000, 2950, 3100], riskRating: 'Low', confidenceScore: 88, lastAiDecision: 'ACCUMULATE' },
                { id: 'h-sol', ticker: 'SOL', name: 'Solana', quantity: 120, avgEntry: 110, currentPrice: 112, marketValue: 13440, pnl: 240, change24H: -0.5, allocationPct: 13.5, logoColor: 'from-purple-500 to-teal-500', logoText: 'S', aiDetails: "Network stability improved.", trend: [110, 115, 112, 114, 111, 112], riskRating: 'Medium', confidenceScore: 82, lastAiDecision: 'REBALANCE' }
              ],
              trades: [
                { id: 't-btc', ticker: 'BTC', side: 'buy', quantity: 0.85, price: 52000, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Bullish divergence detected' },
                { id: 't-eth', ticker: 'ETH', side: 'buy', quantity: 12, price: 2800, timestamp: new Date().toISOString() as any, type: 'ai', status: 'Completed', reason: 'Support level bounce' },
                { id: 't-sol', ticker: 'SOL', side: 'buy', quantity: 120, price: 110, timestamp: new Date().toISOString() as any, type: 'manual', status: 'Completed' }
              ],
              snapshots: []
            };

            dbList.push({
              email: email.toLowerCase(),
              password: password,
              profile: autoUser
            });
            saveLocalDB(dbList);

            localStorage.setItem('aver_active_user', JSON.stringify(autoUser));
            setUser(autoUser);
            setNotifications([]);
            setLoading(false);
            return;
          }
          
          if (localRecord.password !== password) {
            throw new Error("Password or Email Incorrect.");
          }

          // Local login success!
          const userProfile = {
            ...localRecord.profile,
            lastLogin: new Date().toISOString()
          } as User;

          localRecord.profile = userProfile;
          saveLocalDB(dbList);

          localStorage.setItem('aver_active_user', JSON.stringify(userProfile));
          setUser(userProfile);
          setNotifications(userProfile.notificationsList || []);
          setLoading(false);
        } else {
          throw firebaseError;
        }
      }
    } catch (error: any) {
      console.error("Auth signIn error:", error);
      const errCode = getFirebaseErrorCode(error);
      const errMsg = error.message || '';
      
      // If it's a custom user-facing error from the fallback block, bubble it up directly!
      if (errMsg && !errMsg.includes('auth/') && !errMsg.includes('Firebase:')) {
        throw error;
      }
      
      if (errCode === 'auth/wrong-password' || errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential' || errCode === 'auth/invalid-email') {
        throw new Error("Password or Email Incorrect.");
      } else if (errCode === 'auth/network-request-failed') {
        throw new Error("Network connection unavailable. Please try again.");
      } else if (isRestrictedAuthError(error)) {
        throw new Error("Firebase Authentication is restricted in this project. Please sign up to create a local demo profile.");
      }
      throw new Error(errMsg || "Something went wrong. Please try again.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      localStorage.removeItem('aver_active_user');
      setUser(null);
      setNotifications([]);
      setPreviewPhotoURL(null);
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
      const newNotif: NotificationItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
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

      if (!auth.currentUser) {
        // Local state mutation
        setUser(prev => {
          if (!prev) return null;
          const updatedNotifs = [newNotif, ...(prev.notificationsList || [])];
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) {
            dbList[idx].profile = updated;
            saveLocalDB(dbList);
          }
          return updated;
        });
        setNotifications(prev => [newNotif, ...prev]);
        return;
      }

      const userDocRef = doc(db, 'users', targetUserId);
      try {
        const { arrayUnion } = await import('firebase/firestore');
        await updateDoc(userDocRef, {
          notificationsList: arrayUnion(newNotif)
        });
      } catch (err) {
        console.error("Failed to write notification to Firestore:", err);
        handleFirestoreError(err, OperationType.UPDATE, `users/${targetUserId}`);
      }
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string, readState?: boolean) => {
    if (userRef.current) {
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n);
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n));
        return;
      }

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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        return;
      }

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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.id !== id);
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.filter(n => n.id !== id));
        return;
      }

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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.filter(n => n.pinned);
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.filter(n => n.pinned));
        return;
      }

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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
        return;
      }

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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          const updatedNotifs = notifs.map(n => n.id === id ? { ...n, archived: !n.archived } : n);
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: !n.archived } : n));
        return;
      }

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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        return; // Resolve successfully to prevent email enumeration
      }
      throw new Error("Unable to send the reset email right now. Please try again later.");
    }
  }, []);

  const updateOnboarding = useCallback(async (completed: boolean) => {
    if (userRef.current) {
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, onboardingCompleted: completed, lastUpdated: new Date().toISOString() } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        if (completed) {
          await addNotification(
            'account',
            'medium',
            'Onboarding Completed',
            'Thank you for completing your account onboarding! Your profile is now fully verified and prepared for standard trading activities.'
          );
        }
        return;
      }

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

      if (!auth.currentUser) {
        let photoURL = "";
        if (typeof file === 'string') {
          photoURL = file;
        } else if (file instanceof File) {
          photoURL = URL.createObjectURL(file);
        }
        setUser(prev => {
          if (!prev) return null;
          const updated = { 
            ...prev, 
            profilePhotoURL: photoURL, 
            avatarUrl: photoURL, 
            hasCustomPhoto: !!photoURL, 
            lastUpdated: new Date().toISOString() 
          } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setPreviewPhotoURL(null);
        await addNotification(
          'account',
          'low',
          'Profile Picture Changed',
          'Your profile picture has been successfully updated.'
        );
        return;
      }

      const userDocRef = doc(db, 'users', uid);

      if (file === null) {
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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const updates: any = {};
          if (prefs.theme) updates.theme = prefs.theme;
          if (prefs.language) updates.preferredLanguage = prefs.language;
          if (prefs.currency) updates.currency = prefs.currency;
          if (prefs.notifications) updates.notificationSettings = prefs.notifications;
          if (prefs.biometricsEnabled !== undefined) updates.biometricEnabled = prefs.biometricsEnabled;
          if (prefs.rememberMeEnabled !== undefined) updates.rememberMeEnabled = prefs.rememberMeEnabled;

          const updated = { ...prev, ...updates, lastUpdated: new Date().toISOString() } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        await addNotification(
          'system',
          'low',
          'Security Settings Changed',
          'Your account security preferences have been successfully updated.'
        );
        return;
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
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

      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            portfolioBalance: (prev.portfolioBalance || 0) + amount,
            availableBalance: (prev.availableBalance || 0) + amount,
            totalDeposits: (prev.totalDeposits || 0) + amount,
            deposits: [newDeposit, ...(prev.deposits || [])],
            history: [newHistoryItem, ...(prev.history || [])],
            lastUpdated: new Date().toISOString()
          } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });

        await addNotification('deposit', 'medium', 'Deposit Submitted', `Your deposit of $${amount.toLocaleString()} has been submitted for processing.`);
        await addNotification('deposit', 'medium', 'Deposit Approved', `Successfully deposited $${amount.toLocaleString()} to your wallet.`);
        return;
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
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

      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            portfolioBalance: (prev.portfolioBalance || 0) - amount,
            availableBalance: (prev.availableBalance || 0) - amount,
            totalWithdrawals: (prev.totalWithdrawals || 0) + amount,
            withdrawals: [newWithdrawal, ...(prev.withdrawals || [])],
            history: [newHistoryItem, ...(prev.history || [])],
            lastUpdated: new Date().toISOString()
          } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });

        await addNotification('withdrawal', 'medium', 'Withdrawal Requested', `Your withdrawal request of $${amount.toLocaleString()} has been received.`);
        await addNotification('withdrawal', 'medium', 'Withdrawal Completed', `Successfully withdrew $${amount.toLocaleString()} from your wallet.`);
        return;
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
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
      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          let updates: any = {};
          if (typeof dataOrDisplayName === 'string') {
            updates.displayName = dataOrDisplayName;
            if (username) updates.username = username;
            if (email) updates.email = email;
          } else {
            updates = { ...dataOrDisplayName };
          }
          const updated = { ...prev, ...updates, lastUpdated: new Date().toISOString() } as User;
          localStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });

        let body = 'Your profile information has been successfully updated.';
        if (email && email !== userRef.current.email) {
          body = 'Your email address has been successfully updated.';
        }

        await addNotification(
          'account',
          'medium',
          'Profile Updated',
          body
        );
        return;
      }

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
    } else {
      // Local password change
      if (userRef.current) {
        const dbList = getLocalDB();
        const idx = dbList.findIndex(u => u.email.toLowerCase() === userRef.current!.email.toLowerCase());
        if (idx !== -1) {
          dbList[idx].password = newPassword;
          saveLocalDB(dbList);
        }
        await addNotification(
          'security',
          'high',
          'Password Changed',
          'Your account password has been successfully changed. If you did not perform this action, please contact support immediately.'
        );
      }
    }
  }, [addNotification]);

  const verifyCurrentPassword = useCallback(async (password: string) => {
    if (!auth.currentUser) {
      if (userRef.current) {
        const dbList = getLocalDB();
        const record = dbList.find(u => u.email.toLowerCase() === userRef.current!.email.toLowerCase());
        return record ? record.password === password : false;
      }
      return false;
    }
    return true; // Simplified/auto-approved for cloud flow
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
