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
  writeBatch,
  increment,
  arrayUnion
} from "firebase/firestore";
import { ref, uploadBytes, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { getDocs } from "firebase/firestore";
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { safeStorage } from '../utils/storage';
import { NotificationItem, NotificationCategory, NotificationPriority } from '../types/notifications';
import { UserProfile, Theme, Language, Holding, TradeHistoryItem, PortfolioSnapshot } from '../types';
import { NotificationManager } from '../services/NotificationManager';
import { getAvatarDataUrl } from '../utils/avatarGenerator';
import { TradingEngineConfig } from '../types/trading';
import { portfolioPersistenceService } from '../services/portfolioPersistenceService';
import { walletService } from '../services/walletService';

export interface UserPreferences {
  language: string;
  theme: string;
  currency: string;
  notifications: {
    marketing?: boolean;
    security?: boolean;
    signals?: boolean;
    master?: boolean;
    profile?: boolean;
    deposits?: boolean;
    withdrawals?: boolean;
    trading?: boolean;
    system?: boolean;
    referrals?: boolean;
    rewards?: boolean;
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
  watchlist: string[];
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
  tradingConfig?: TradingEngineConfig;
  watchlist: string[];
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
  updateTradingConfig: (config: Partial<TradingEngineConfig>) => Promise<void>;
  toggleWatchlist: (symbol: string) => Promise<void>;
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
  updateProfile: (dataOrDisplayName: Partial<User> | string, username?: string, email?: string, silent?: boolean) => Promise<void>;
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
  updateTradingConfig: async () => {},
  toggleWatchlist: async () => {},
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
  const dbStr = safeStorage.getItem('aver_local_db');
  return dbStr ? JSON.parse(dbStr) : [];
};

const saveLocalDB = (dbList: any[]) => {
  safeStorage.setItem('aver_local_db', JSON.stringify(dbList));
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
  const notificationManagerRef = useRef<NotificationManager | null>(null);
  const avatarSetupRef = useRef<boolean>(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const userWithPreview = useMemo(() => {
    if (!user) return null;
    
    // Determine the effective avatar: preview (if set) -> user.avatarUrl -> user.profilePhotoURL
    let effectiveAvatar = user.avatarUrl || user.profilePhotoURL || "";
    let hasCustomPhoto = !!user.hasCustomPhoto;
    
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
    let unsubTradingConfig: (() => void) | null = null;
    let unsubPortfolioCurrent: (() => void) | null = null;
    let unsubWallet: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthContext] Auth state changed, user:", firebaseUser ? firebaseUser.uid : "null");
      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
      if (unsubHoldings) { unsubHoldings(); unsubHoldings = null; }
      if (unsubTrades) { unsubTrades(); unsubTrades = null; }
      if (unsubSnapshots) { unsubSnapshots(); unsubSnapshots = null; }
      if (unsubTradingConfig) { unsubTradingConfig(); unsubTradingConfig = null; }
      if (unsubPortfolioCurrent) { unsubPortfolioCurrent(); unsubPortfolioCurrent = null; }
      if (unsubWallet) { unsubWallet(); unsubWallet = null; }

      if (firebaseUser) {
        notificationManagerRef.current = new NotificationManager(firebaseUser.uid);
        notificationManagerRef.current.subscribe(setNotifications);

        // Fetch or create initial wallet document in 'wallets/{userId}'
        unsubWallet = walletService.subscribeWallet(firebaseUser.uid, (wData) => {
          if (!wData) return;
          setUser(prev => {
            if (!prev) return null;
            const portVal = wData.portfolioValue || wData.portfolioBalance || prev.portfolio?.totalValue || 0;
            if (
              prev.portfolioBalance === wData.portfolioBalance &&
              prev.availableBalance === wData.availableBalance &&
              prev.vaultBalance === wData.vaultBalance &&
              prev.totalDeposits === wData.totalDeposits &&
              prev.totalWithdrawals === wData.totalWithdrawals &&
              prev.portfolio?.totalValue === portVal &&
              prev.tokenBalance === wData.tokenBalance
            ) {
              return prev;
            }
            const updated: User = {
              ...prev,
              portfolioBalance: wData.portfolioBalance ?? prev.portfolioBalance,
              availableBalance: wData.availableBalance ?? prev.availableBalance,
              vaultBalance: wData.vaultBalance ?? prev.vaultBalance,
              totalDeposits: wData.totalDeposits ?? prev.totalDeposits,
              totalWithdrawals: wData.totalWithdrawals ?? prev.totalWithdrawals,
              tokenBalance: wData.tokenBalance ?? prev.tokenBalance,
              portfolio: {
                ...prev.portfolio,
                totalValue: portVal
              }
            };
            safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
            return updated;
          });
        });

        // Subscribe to dedicated portfolio current persistence document
        unsubPortfolioCurrent = portfolioPersistenceService.subscribePortfolioCurrent(firebaseUser.uid, (pState) => {
          if (!pState) return;
          setUser(prev => {
            if (!prev) return null;
            if (
              (pState.walletState.portfolioBalance === undefined || prev.portfolioBalance === pState.walletState.portfolioBalance) &&
              (pState.walletState.availableBalance === undefined || prev.availableBalance === pState.walletState.availableBalance) &&
              (pState.walletState.vaultBalance === undefined || prev.vaultBalance === pState.walletState.vaultBalance) &&
              (pState.walletState.totalDeposits === undefined || prev.totalDeposits === pState.walletState.totalDeposits) &&
              (pState.walletState.totalWithdrawals === undefined || prev.totalWithdrawals === pState.walletState.totalWithdrawals) &&
              (pState.walletState.totalProfit === undefined || prev.totalProfit === pState.walletState.totalProfit) &&
              (pState.walletState.totalLoss === undefined || prev.totalLoss === pState.walletState.totalLoss) &&
              (pState.walletState.tokenBalance === undefined || prev.tokenBalance === pState.walletState.tokenBalance)
            ) {
              return prev;
            }
            const updated: User = {
              ...prev,
              portfolioBalance: pState.walletState.portfolioBalance ?? prev.portfolioBalance,
              availableBalance: pState.walletState.availableBalance ?? prev.availableBalance,
              vaultBalance: pState.walletState.vaultBalance ?? prev.vaultBalance,
              totalDeposits: pState.walletState.totalDeposits ?? prev.totalDeposits,
              totalWithdrawals: pState.walletState.totalWithdrawals ?? prev.totalWithdrawals,
              totalProfit: pState.walletState.totalProfit ?? prev.totalProfit,
              totalLoss: pState.walletState.totalLoss ?? prev.totalLoss,
              tokenBalance: pState.walletState.tokenBalance ?? prev.tokenBalance,
              portfolio: {
                ...prev.portfolio,
                ...(pState.portfolioMetrics || {})
              },
              aiSettings: {
                ...prev.aiSettings,
                ...(pState.commandCenter?.aiSettings || {})
              }
            };
            safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(updated));
            return updated;
          });
        });

        // Retrieve and apply cached user profile immediately to avoid flickering
        const cachedUserStr = safeStorage.getItem(`user_profile_${firebaseUser.uid}`);
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
          console.log("[AuthContext] User document snapshot received");
          try {
            if (docSnap.exists()) {
              const userData = docSnap.data() as User;
              console.log("[AuthContext] User data updated from Firestore for uid:", firebaseUser.uid);

              // Only initialize if there is no seed AND no custom photo/avatar URL at all
              const needsSeed = !userData.avatarSeed && !userData.avatarUrl && !userData.profilePhotoURL;

              if (needsSeed && !avatarSetupRef.current) {
                avatarSetupRef.current = true;
                console.log("[AuthContext] User profile requires initial avatar setup...");
                (async () => {
                  try {
                    const resolvedSeed = userData.avatarSeed || firebaseUser.uid;
                    const newDataUrl = getAvatarDataUrl(resolvedSeed);
                    await updateDoc(userDocRef, {
                      avatarSeed: resolvedSeed,
                      hasCustomPhoto: false,
                      profilePhotoURL: newDataUrl,
                      avatarUrl: newDataUrl,
                      lastUpdated: new Date().toISOString()
                    });
                    console.log("[AuthContext] Successfully initialized profile avatar for user:", firebaseUser.uid);
                  } catch (assignErr) {
                    console.error("[AuthContext] Failed to initialize profile avatar:", assignErr);
                    // Reset so we can try again later if it failed
                    avatarSetupRef.current = false;
                  }
                })();
              }
              const updatedUser = {
                ...userData,
                hasCustomPhoto: !!userData.hasCustomPhoto,
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
                },
                aiSettings: userData.aiSettings || {
                  copilotMode: 'copilot',
                  maxActiveTrades: 3,
                  riskProfile: 'Balanced',
                  drawdownStopLimit: 2.5,
                  maxCapitalExposure: 40,
                  consecutiveLosses: 0
                }
              } as User;
              setUser(prev => {
                if (
                  prev &&
                  prev.portfolioBalance === updatedUser.portfolioBalance &&
                  prev.availableBalance === updatedUser.availableBalance &&
                  prev.vaultBalance === updatedUser.vaultBalance &&
                  prev.totalDeposits === updatedUser.totalDeposits &&
                  prev.totalWithdrawals === updatedUser.totalWithdrawals &&
                  prev.tokenBalance === updatedUser.tokenBalance &&
                  prev.portfolio?.totalValue === updatedUser.portfolio?.totalValue
                ) {
                  return prev;
                }
                const merged = {
                  ...updatedUser,
                  holdings: prev?.holdings || [],
                  trades: prev?.trades || [],
                  snapshots: prev?.snapshots || []
                } as User;
                
                // Selective caching to prevent QuotaExceededError
                const profileToCache = { ...merged };
                delete (profileToCache as any).trades;
                delete (profileToCache as any).holdings;
                delete (profileToCache as any).snapshots;
                delete (profileToCache as any).history;
                delete (profileToCache as any).notificationsList;
                
                safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
                return merged;
              });
              
              const notifs = userData.notificationsList || [];
              notifs.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
              setNotifications(notifs);
            } else {
              console.warn("[AuthContext] User profile document not found in Firestore for uid:", firebaseUser.uid);
            }
          } catch (err) {
            console.error("[AuthContext] Error processing user document snapshot:", err);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error("[AuthContext] Firestore user document snapshot error:", error);
          if (isPermissionError(error)) {
            console.warn("[AuthContext] Firestore access denied. Using cached/local profile.");
            const cachedUserStr = safeStorage.getItem(`user_profile_${firebaseUser.uid}`);
            if (cachedUserStr) {
              try {
                const cachedUser = JSON.parse(cachedUserStr);
                setUser(cachedUser);
                const notifs = cachedUser.notificationsList || [];
                setNotifications(notifs);
              } catch (e) {
                console.error("[AuthContext] Error loading cached user in fallback:", e);
              }
            }
          } else {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
          setLoading(false);
        });

        // Subcollection Listeners for Portfolio Intelligence
        const holdingsRef = collection(db, 'users', firebaseUser.uid, 'holdings');
        unsubHoldings = onSnapshot(holdingsRef, (snap) => {
          const holdings = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Holding[];
          setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, holdings };
            
            // Selective caching
            const profileToCache = { ...updated };
            delete (profileToCache as any).trades;
            delete (profileToCache as any).holdings;
            delete (profileToCache as any).snapshots;
            delete (profileToCache as any).history;
            delete (profileToCache as any).notificationsList;
            
            safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
            return updated;
          });
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore subcollection 'holdings' access denied. Falling back to local/cached profile data.");
            setUser(prev => {
              if (!prev) return null;
              const defaultHoldings: Holding[] = [];
              const updated = {
                ...prev,
                holdings: prev.holdings && prev.holdings.length > 0 ? prev.holdings : defaultHoldings
              };
              // Selective caching
              const profileToCache = { ...updated };
              delete (profileToCache as any).trades;
              delete (profileToCache as any).holdings;
              delete (profileToCache as any).snapshots;
              delete (profileToCache as any).history;
              delete (profileToCache as any).notificationsList;
              
              safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
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
            
            // Selective caching
            const profileToCache = { ...updated };
            delete (profileToCache as any).trades;
            delete (profileToCache as any).holdings;
            delete (profileToCache as any).snapshots;
            delete (profileToCache as any).history;
            delete (profileToCache as any).notificationsList;
            
            safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
            return updated;
          });
        }, (error) => {
          if (isPermissionError(error)) {
            console.warn("Firestore subcollection 'trades' access denied. Falling back to local/cached profile data.");
            setUser(prev => {
              if (!prev) return null;
              const updated = {
                ...prev,
                trades: prev.trades && prev.trades.length > 0 ? prev.trades : []
              };
              
              // Selective caching
              const profileToCache = { ...updated };
              delete (profileToCache as any).trades;
              delete (profileToCache as any).holdings;
              delete (profileToCache as any).snapshots;
              delete (profileToCache as any).history;
              delete (profileToCache as any).notificationsList;
              
              safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
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
            
            // Selective caching
            const profileToCache = { ...updated };
            delete (profileToCache as any).trades;
            delete (profileToCache as any).holdings;
            delete (profileToCache as any).snapshots;
            delete (profileToCache as any).history;
            delete (profileToCache as any).notificationsList;
            
            safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
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
              
              // Selective caching
              const profileToCache = { ...updated };
              delete (profileToCache as any).trades;
              delete (profileToCache as any).holdings;
              delete (profileToCache as any).snapshots;
              delete (profileToCache as any).history;
              delete (profileToCache as any).notificationsList;
              
              safeStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(profileToCache));
              return updated;
            });
          } else {
            handleFirestoreError(error, OperationType.LIST, `users/${firebaseUser.uid}/snapshots`);
          }
        });

        // Trading Engine Config Listener
        const configRef = doc(db, 'users', firebaseUser.uid, 'tradingConfig', 'default');
        unsubTradingConfig = onSnapshot(configRef, (docSnap) => {
          if (docSnap.exists()) {
            const config = docSnap.data() as TradingEngineConfig;
            setUser(prev => prev ? { ...prev, tradingConfig: config } : null);
          }
        });
      } else {
        // User is signed out from Firebase, check for active local user
        const activeLocalUserStr = safeStorage.getItem('aver_active_user');
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

    const handleLocalUserUpdate = () => {
      if (!auth.currentUser) {
        const activeLocalUserStr = safeStorage.getItem('aver_active_user');
        if (activeLocalUserStr) {
          try {
            const activeLocalUser = JSON.parse(activeLocalUserStr) as User;
            setUser(activeLocalUser);
            setNotifications(activeLocalUser.notificationsList || []);
          } catch (e) {
            console.error("Error loading active local user on update event:", e);
          }
        }
      }
    };
    window.addEventListener('aver_user_updated', handleLocalUserUpdate);
    window.addEventListener('storage', handleLocalUserUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('aver_user_updated', handleLocalUserUpdate);
      window.removeEventListener('storage', handleLocalUserUpdate);
      if (unsubUserDoc) unsubUserDoc();
      if (unsubNotifications) unsubNotifications();
      if (unsubHoldings) unsubHoldings();
      if (unsubTrades) unsubTrades();
      if (unsubSnapshots) unsubSnapshots();
      if (unsubTradingConfig) unsubTradingConfig();
      if (unsubPortfolioCurrent) unsubPortfolioCurrent();
      if (unsubWallet) unsubWallet();
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

      let assignedUrls: string[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(uDoc => {
          const uData = uDoc.data();
          if (uData.avatarUrl) assignedUrls.push(uData.avatarUrl);
          if (uData.profilePhotoURL) assignedUrls.push(uData.profilePhotoURL);
        });
      } catch (err) {
        console.warn("Could not query existing users for signUp uniqueness check:", err);
      }

      const targetUid = userCredential?.user.uid || `local-${Math.random().toString(36).substring(2, 11)}`;
      const avatarSeed = data.email.toLowerCase();
      const dataUrl = getAvatarDataUrl(avatarSeed);

      const username = data.username || data.email.split('@')[0];
      const newUser: User = {
        uid: targetUid,
        username: username,
        email: data.email,
        avatarSeed,
        avatarUrl: dataUrl,
        profilePhotoURL: dataUrl,
        hasCustomPhoto: true,
        country: data.country,
        phoneNumber: data.phoneNumber || '',
        accountType: 'Standard',
        accountStatus: 'Active',
        portfolioBalance: 0,
        availableBalance: 0,
        vaultBalance: 0,
        activeOffset: 0,
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
        aiSettings: {
          copilotMode: 'copilot',
          maxActiveTrades: 3,
          riskProfile: 'Balanced',
          drawdownStopLimit: 2.5,
          maxCapitalExposure: 40,
          consecutiveLosses: 0
        },
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
        },
        holdings: [],
        trades: [],
        snapshots: [],
        watchlist: []
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
        safeStorage.setItem('aver_active_user', JSON.stringify(newUser));
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
            const localUid = `local-${Math.random().toString(36).substring(2, 11)}`;
            const seed = email.toLowerCase();
            const dataUrl = getAvatarDataUrl(seed);
            const autoUser: User = {
              uid: localUid,
              username: username,
              email: email,
              avatarSeed: seed,
              avatarUrl: dataUrl,
              profilePhotoURL: dataUrl,
              hasCustomPhoto: true,
              country: "US",
              phoneNumber: '',
              accountType: 'Standard',
              accountStatus: 'Active',
              portfolioBalance: 0,
              availableBalance: 0,
              vaultBalance: 0,
              activeOffset: 0,
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
              },
              holdings: [],
              trades: [],
              snapshots: [],
              watchlist: []
            };

            dbList.push({
              email: email.toLowerCase(),
              password: password,
              profile: autoUser
            });
            saveLocalDB(dbList);

            safeStorage.setItem('aver_active_user', JSON.stringify(autoUser));
            setUser(autoUser);
            setNotifications([]);
            setLoading(false);
            return;
          }
          
          if (localRecord.password !== password) {
            throw new Error("Password or Email Incorrect.");
          }

          // Local login success!
          // Auto-heal local avatar if missing or if no avatarUrl
          let updatedProfile = { ...localRecord.profile };
          if (!updatedProfile.avatarSeed || !updatedProfile.avatarUrl) {
            updatedProfile.avatarSeed = updatedProfile.avatarSeed || updatedProfile.uid;
            const dataUrl = getAvatarDataUrl(updatedProfile.avatarSeed);
            updatedProfile.avatarUrl = dataUrl;
            updatedProfile.profilePhotoURL = dataUrl;
            updatedProfile.hasCustomPhoto = true;
            updatedProfile.lastUpdated = new Date().toISOString();
          }

          const userProfile = {
            ...updatedProfile,
            lastLogin: new Date().toISOString()
          } as User;

          localRecord.profile = userProfile;
          saveLocalDB(dbList);

          safeStorage.setItem('aver_active_user', JSON.stringify(userProfile));
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
      safeStorage.removeItem('aver_active_user');
      safeStorage.removeItem('portfolio_vault_balance');
      safeStorage.removeItem('portfolio_active_offset');
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
        let isDup = false;
        setUser(prev => {
          if (!prev) return null;
          const notifs = prev.notificationsList || [];
          isDup = notifs.some(n => n.category === category && n.title === title && n.body === body);
          if (isDup) return prev;
          const updatedNotifs = [newNotif, ...notifs];
          const updated = { ...prev, notificationsList: updatedNotifs } as User;
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) {
            dbList[idx].profile = updated;
            saveLocalDB(dbList);
          }
          return updated;
        });
        if (isDup) return;
        setNotifications(prev => {
          if (prev.some(n => n.category === category && n.title === title && n.body === body)) {
            return prev;
          }
          return [newNotif, ...prev];
        });
        return;
      }

      if (notificationManagerRef.current) {
        await notificationManagerRef.current.addNotification(category, priority, title, body, actionUrl, action, metadata);
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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: readState !== undefined ? readState : !n.read } : n));
        return;
      }

      try {
        if (notificationManagerRef.current) {
          await notificationManagerRef.current.markAsRead(id, readState);
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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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

function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("[AuthContext] Error in dataURLtoBlob conversion:", err);
    throw new Error("Failed to process cropped image data format.");
  }
}

   const updateProfilePhoto = useCallback(async (file: File | string | null) => {
    console.log("[AuthContext] updateProfilePhoto called with type:", typeof file);
    if (userRef.current) {
      const uid = userRef.current.uid;
      const userDocRef = doc(db, 'users', uid);

      try {
        if (!auth.currentUser) {
          console.log("[AuthContext] updateProfilePhoto: No current auth user, using local persistence");
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
            
            try {
              safeStorage.setItem('aver_active_user', JSON.stringify(updated));
              safeStorage.setItem(`user_profile_${uid}`, JSON.stringify(updated));
            } catch (storageErr) {
              console.warn("[AuthContext] Failed to cache user profile in safeStorage (quota exceeded fallback):", storageErr);
            }

            try {
              const dbList = getLocalDB();
              const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
              if (idx !== -1) { 
                dbList[idx].profile = updated; 
                saveLocalDB(dbList); 
              }
            } catch (dbErr) {
              console.warn("[AuthContext] Failed to save updated profile to local database:", dbErr);
            }
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

        let photoURL = "";
        if (typeof file === 'string') {
          if (file.startsWith('blob:')) {
            console.log("[AuthContext] updateProfilePhoto: Handling blob URL for preview");
            setPreviewPhotoURL(file);
            return;
          }

          const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
          console.log("[AuthContext] updateProfilePhoto: Converting data string to Blob for upload");
          
          try {
            // Synchronous, iframe-safe conversion avoiding any network hang in fetch()
            const blob = dataURLtoBlob(file);
            console.log("[AuthContext] updateProfilePhoto: Blob created synchronously, size:", blob.size);
            
            console.log("[AuthContext] updateProfilePhoto: Uploading Blob to storage");
            await uploadBytes(storageRef, blob);
            console.log("[AuthContext] updateProfilePhoto: Storage upload successful");
          } catch (uploadErr) {
            console.warn("[AuthContext] uploadBytes failed, falling back to uploadString:", uploadErr);
            await uploadString(storageRef, file, 'data_url');
            console.log("[AuthContext] updateProfilePhoto: uploadString fallback successful");
          }
          
          photoURL = await getDownloadURL(storageRef);
          console.log("[AuthContext] updateProfilePhoto: Download URL received:", photoURL);
        } else {
          const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
          console.log("[AuthContext] updateProfilePhoto: Uploading bytes to storage");
          await uploadBytes(storageRef, file);
          console.log("[AuthContext] updateProfilePhoto: Storage upload successful");
          photoURL = await getDownloadURL(storageRef);
          console.log("[AuthContext] updateProfilePhoto: Download URL received:", photoURL);
        }

        if (photoURL) {
          console.log("[AuthContext] updateProfilePhoto: Updating Firestore doc");
          // Update Firestore and also update the local state immediately for responsiveness
          const updates = { 
            profilePhotoURL: photoURL,
            avatarUrl: photoURL,
            hasCustomPhoto: true,
            lastUpdated: serverTimestamp()
          };

          await updateDoc(userDocRef, updates);
          console.log("[AuthContext] updateProfilePhoto: Firestore update successful");
          
          // Force an immediate UI update before the snapshot listener triggers
          setUser(prev => {
            if (!prev) return null;
            const updated = { 
              ...prev, 
              profilePhotoURL: photoURL,
              avatarUrl: photoURL,
              hasCustomPhoto: true, 
              lastUpdated: new Date().toISOString() 
            } as User;
            try {
              safeStorage.setItem(`user_profile_${uid}`, JSON.stringify(updated));
              safeStorage.setItem('aver_active_user', JSON.stringify(updated));
            } catch (storageErr) {
              console.warn("[AuthContext] Failed to cache user profile in safeStorage (quota exceeded fallback):", storageErr);
            }
            return updated;
          });

          setPreviewPhotoURL(null);

          await addNotification(
            'account',
            'low',
            'Profile Picture Changed',
            'Your profile picture has been successfully updated.'
          );
        }
      } catch (err: any) {
        console.error("[AuthContext] CRITICAL ERROR in updateProfilePhoto:", err);
        if (auth.currentUser) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/profile_photo`);
        } else {
          throw err;
        }
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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

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

      setUser(prev => {
        if (!prev) return null;
        return { ...prev, ...updates, lastUpdated: new Date().toISOString() } as User;
      });

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

      let activeSessionCapital = 0;
      try {
        const sessionStr = safeStorage.getItem(`aver_session_${userRef.current.uid}`);
        if (sessionStr) {
          const s = JSON.parse(sessionStr);
          if (s && s.status === 'ACTIVE') {
            activeSessionCapital = s.tradingCapital || 0;
          }
        }
      } catch (e) {}

      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const nextPort = (prev.portfolioBalance || 0) + amount;
          const nextAvail = (prev.availableBalance || 0) + amount; // Already has activeSessionCapital subtracted in state
          const nextDep = (prev.totalDeposits || 0) + amount;
          const nextTokenBal = nextPort - activeSessionCapital;
          const updated = {
            ...prev,
            portfolioBalance: nextPort,
            availableBalance: nextAvail,
            tokenBalance: nextTokenBal,
            totalDeposits: nextDep,
            deposits: [newDeposit, ...(prev.deposits || [])],
            history: [newHistoryItem, ...(prev.history || [])],
            portfolio: {
              ...prev.portfolio,
              totalValue: nextPort + (prev.vaultBalance || 0)
            },
            lastUpdated: new Date().toISOString()
          } as User;
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          
          portfolioPersistenceService.savePortfolioCurrent(prev.uid, {
            walletState: {
              portfolioBalance: nextPort,
              availableBalance: nextAvail,
              vaultBalance: prev.vaultBalance || 0,
              activeOffset: prev.activeOffset || 0,
              totalDeposits: nextDep,
              totalWithdrawals: prev.totalWithdrawals || 0,
              totalProfit: prev.totalProfit || 0,
              totalLoss: prev.totalLoss || 0,
              tokenBalance: nextTokenBal,
              aiTradingCapital: activeSessionCapital
            },
            portfolioMetrics: {
              ...prev.portfolio,
              totalValue: nextPort + (prev.vaultBalance || 0)
            }
          });

          walletService.updateWallet(prev.uid, {
            portfolioBalance: nextPort,
            availableBalance: nextAvail,
            totalDeposits: nextDep,
            portfolioValue: nextPort + (prev.vaultBalance || 0),
            cashBalance: nextPort,
            tokenBalance: nextTokenBal,
            aiTradingCapital: activeSessionCapital
          });

          return updated;
        });

        await addNotification('deposit', 'medium', 'Deposit Submitted', `Your deposit of $${amount.toLocaleString()} has been submitted for processing.`);
        await addNotification('deposit', 'medium', 'Deposit Approved', `Successfully deposited $${amount.toLocaleString()} to your wallet.`);
        return;
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
      await updateDoc(userDocRef, {
        portfolioBalance: increment(amount),
        availableBalance: increment(amount),
        tokenBalance: increment(amount),
        totalDeposits: increment(amount),
        deposits: arrayUnion(newDeposit),
        history: arrayUnion(newHistoryItem),
        'portfolio.totalValue': increment(amount),
        lastUpdated: serverTimestamp()
      });

      const updatedPort = (userRef.current.portfolioBalance || 0) + amount;
      const updatedAvail = (userRef.current.availableBalance || 0) + amount; // Already has activeSessionCapital subtracted in state
      const updatedTotalDep = (userRef.current.totalDeposits || 0) + amount;
      const updatedTokenBal = updatedPort - activeSessionCapital;

      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          portfolioBalance: updatedPort,
          availableBalance: updatedAvail,
          tokenBalance: updatedTokenBal,
          totalDeposits: updatedTotalDep,
          deposits: [newDeposit, ...(prev.deposits || [])],
          history: [newHistoryItem, ...(prev.history || [])],
          portfolio: {
            ...prev.portfolio,
            totalValue: updatedPort + (prev.vaultBalance || 0)
          },
          lastUpdated: new Date().toISOString()
        } as User;
        safeStorage.setItem(`user_profile_${prev.uid}`, JSON.stringify(updated));
        safeStorage.setItem('aver_active_user', JSON.stringify(updated));
        return updated;
      });

      await portfolioPersistenceService.savePortfolioCurrent(userRef.current.uid, {
        walletState: {
          portfolioBalance: updatedPort,
          availableBalance: updatedAvail,
          vaultBalance: userRef.current.vaultBalance || 0,
          activeOffset: userRef.current.activeOffset || 0,
          totalDeposits: updatedTotalDep,
          totalWithdrawals: userRef.current.totalWithdrawals || 0,
          totalProfit: userRef.current.totalProfit || 0,
          totalLoss: userRef.current.totalLoss || 0,
          tokenBalance: updatedTokenBal,
          aiTradingCapital: activeSessionCapital
        },
        portfolioMetrics: {
          ...(userRef.current.portfolio || {}),
          totalValue: updatedPort + (userRef.current.vaultBalance || 0)
        }
      });

      await walletService.updateWallet(userRef.current.uid, {
        portfolioBalance: updatedPort,
        availableBalance: updatedAvail,
        totalDeposits: updatedTotalDep,
        portfolioValue: updatedPort + (userRef.current.vaultBalance || 0),
        cashBalance: updatedPort,
        tokenBalance: updatedTokenBal,
        aiTradingCapital: activeSessionCapital
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

      let activeSessionCapital = 0;
      try {
        const sessionStr = safeStorage.getItem(`aver_session_${userRef.current.uid}`);
        if (sessionStr) {
          const s = JSON.parse(sessionStr);
          if (s && s.status === 'ACTIVE') {
            activeSessionCapital = s.tradingCapital || 0;
          }
        }
      } catch (e) {}

      if (!auth.currentUser) {
        setUser(prev => {
          if (!prev) return null;
          const nextPort = (prev.portfolioBalance || 0) - amount;
          const nextAvail = (prev.availableBalance || 0) - amount; // Already has activeSessionCapital subtracted in state
          const nextWth = (prev.totalWithdrawals || 0) + amount;
          const nextTokenBal = nextPort - activeSessionCapital;
          const updated = {
            ...prev,
            portfolioBalance: nextPort,
            availableBalance: nextAvail,
            tokenBalance: nextTokenBal,
            totalWithdrawals: nextWth,
            withdrawals: [newWithdrawal, ...(prev.withdrawals || [])],
            history: [newHistoryItem, ...(prev.history || [])],
            portfolio: {
              ...prev.portfolio,
              totalValue: nextPort + (prev.vaultBalance || 0)
            },
            lastUpdated: new Date().toISOString()
          } as User;
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }

          portfolioPersistenceService.savePortfolioCurrent(prev.uid, {
            walletState: {
              portfolioBalance: nextPort,
              availableBalance: nextAvail,
              vaultBalance: prev.vaultBalance || 0,
              activeOffset: prev.activeOffset || 0,
              totalDeposits: prev.totalDeposits || 0,
              totalWithdrawals: nextWth,
              totalProfit: prev.totalProfit || 0,
              totalLoss: prev.totalLoss || 0,
              tokenBalance: nextTokenBal,
              aiTradingCapital: activeSessionCapital
            },
            portfolioMetrics: {
              ...prev.portfolio,
              totalValue: nextPort + (prev.vaultBalance || 0)
            }
          });

          walletService.updateWallet(prev.uid, {
            portfolioBalance: nextPort,
            availableBalance: nextAvail,
            totalWithdrawals: nextWth,
            portfolioValue: nextPort + (prev.vaultBalance || 0),
            tokenBalance: nextTokenBal,
            aiTradingCapital: activeSessionCapital
          });

          return updated;
        });

        await addNotification('withdrawal', 'medium', 'Withdrawal Requested', `Your withdrawal request of $${amount.toLocaleString()} has been received.`);
        await addNotification('withdrawal', 'medium', 'Withdrawal Completed', `Successfully withdrew $${amount.toLocaleString()} from your wallet.`);
        return;
      }

      const userDocRef = doc(db, 'users', userRef.current.uid);
      await updateDoc(userDocRef, {
        portfolioBalance: increment(-amount),
        availableBalance: increment(-amount),
        tokenBalance: increment(-amount),
        totalWithdrawals: increment(amount),
        withdrawals: arrayUnion(newWithdrawal),
        history: arrayUnion(newHistoryItem),
        'portfolio.totalValue': increment(-amount),
        lastUpdated: serverTimestamp()
      });

      const updatedPort = (userRef.current.portfolioBalance || 0) - amount;
      const updatedAvail = (userRef.current.availableBalance || 0) - amount; // Already has activeSessionCapital subtracted in state
      const updatedTotalWth = (userRef.current.totalWithdrawals || 0) + amount;
      const updatedTokenBal = updatedPort - activeSessionCapital;

      setUser(prev => {
        if (!prev) return null;
        const updated = {
          ...prev,
          portfolioBalance: updatedPort,
          availableBalance: updatedAvail,
          tokenBalance: updatedTokenBal,
          totalWithdrawals: updatedTotalWth,
          withdrawals: [newWithdrawal, ...(prev.withdrawals || [])],
          history: [newHistoryItem, ...(prev.history || [])],
          portfolio: {
            ...prev.portfolio,
            totalValue: updatedPort + (prev.vaultBalance || 0)
          },
          lastUpdated: new Date().toISOString()
        } as User;
        safeStorage.setItem(`user_profile_${prev.uid}`, JSON.stringify(updated));
        safeStorage.setItem('aver_active_user', JSON.stringify(updated));
        return updated;
      });

      await portfolioPersistenceService.savePortfolioCurrent(userRef.current.uid, {
        walletState: {
          portfolioBalance: updatedPort,
          availableBalance: updatedAvail,
          vaultBalance: userRef.current.vaultBalance || 0,
          activeOffset: userRef.current.activeOffset || 0,
          totalDeposits: userRef.current.totalDeposits || 0,
          totalWithdrawals: updatedTotalWth,
          totalProfit: userRef.current.totalProfit || 0,
          totalLoss: userRef.current.totalLoss || 0,
          tokenBalance: updatedTokenBal,
          aiTradingCapital: activeSessionCapital
        },
        portfolioMetrics: {
          ...(userRef.current.portfolio || {}),
          totalValue: updatedPort + (userRef.current.vaultBalance || 0)
        }
      });

      await walletService.updateWallet(userRef.current.uid, {
        portfolioBalance: updatedPort,
        availableBalance: updatedAvail,
        totalWithdrawals: updatedTotalWth,
        portfolioValue: updatedPort + (userRef.current.vaultBalance || 0),
        tokenBalance: updatedTokenBal,
        aiTradingCapital: activeSessionCapital
      });

      await addNotification('withdrawal', 'medium', 'Withdrawal Requested', `Your withdrawal request of $${amount.toLocaleString()} has been received.`);
      await addNotification('withdrawal', 'medium', 'Withdrawal Completed', `Successfully withdrew $${amount.toLocaleString()} from your wallet.`);
    }
  }, [addNotification]);

  const updateProfile = useCallback(async (dataOrDisplayName: Partial<User> | string, username?: string, email?: string, silent?: boolean) => {
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
          safeStorage.setItem('aver_active_user', JSON.stringify(updated));

          const dbList = getLocalDB();
          const idx = dbList.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (idx !== -1) { dbList[idx].profile = updated; saveLocalDB(dbList); }
          return updated;
        });

        if (!silent) {
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
        }
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

      if (!silent) {
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
    }
  }, [addNotification]);

  const updateTradingConfig = useCallback(async (config: Partial<TradingEngineConfig>) => {
    if (!userRef.current) return;
    try {
      const configRef = doc(db, 'users', userRef.current.uid, 'tradingConfig', 'default');
      await updateDoc(configRef, { ...config, lastUpdated: serverTimestamp() });
    } catch (err) {
      console.error("Error updating trading config:", err);
    }
  }, []);

  const toggleWatchlist = useCallback(async (symbol: string) => {
    if (!userRef.current) return;
    try {
      const watchlist = userRef.current.watchlist || [];
      const newWatchlist = watchlist.includes(symbol)
        ? watchlist.filter(s => s !== symbol)
        : [...watchlist, symbol];
      
      const updated = {
        ...userRef.current,
        watchlist: newWatchlist
      };

      // Always update local state first for instant UX
      setUser(updated);
      safeStorage.setItem('aver_active_user', JSON.stringify(updated));

      // Also update the local database if running locally/fallback
      const dbList = getLocalDB();
      const localIdx = dbList.findIndex(u => u.email.toLowerCase() === userRef.current!.email.toLowerCase());
      if (localIdx !== -1) {
        dbList[localIdx].profile = updated;
        saveLocalDB(dbList);
      }

      // If registered with Firebase, sync to Firestore
      if (!userRef.current.uid.startsWith('local-')) {
        await updateDoc(doc(db, 'users', userRef.current.uid), {
          watchlist: newWatchlist
        });
      }
    } catch (err) {
      console.error("Error updating watchlist:", err);
    }
  }, []);

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
    updateTradingConfig,
    toggleWatchlist,
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
    updateTradingConfig,
    toggleWatchlist,
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
