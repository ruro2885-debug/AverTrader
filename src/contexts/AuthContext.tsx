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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateInitialsAvatar } from '../utils/avatarUtils';
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
  history: HistoryItem[];
  deposits: DepositItem[];
  withdrawals: WithdrawalItem[];
  portfolio: PortfolioData;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateOnboarding: (completed: boolean) => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  addDeposit: (amount: number) => Promise<void>;
  addWithdrawal: (amount: number) => Promise<void>;
  
  addNotification: (category: NotificationCategory, priority: NotificationPriority, title: string, body: string, actionUrl?: string) => Promise<void>;
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;
    let unsubNotifications: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }
      if (unsubNotifications) {
        unsubNotifications();
        unsubNotifications = null;
      }

      if (firebaseUser) {
        // User is signed in, fetch their profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for real-time updates to the user profile
        unsubUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setUser({
              ...userData,
              notificationsList: userData.notificationsList || [],
              history: userData.history || [],
              deposits: userData.deposits || [],
              withdrawals: userData.withdrawals || [],
            });
          } else {
            // Profile doc doesn't exist yet, might be in the middle of registration
            console.warn("User profile document not found in Firestore");
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });

        // Listen for real-time updates to notifications
        const notifPath = 'notifications';
        const notifQuery = query(
          collection(db, notifPath),
          where('userId', '==', firebaseUser.uid),
          orderBy('createdAt', 'desc')
        );

        unsubNotifications = onSnapshot(notifQuery, (snapshot) => {
          const notifs: NotificationItem[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              category: data.category || data.type || 'system',
              priority: data.priority || 'medium',
              title: data.title || '',
              body: data.body || data.message || '',
              date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              read: data.read || false,
              actionUrl: data.actionUrl || '',
              pinned: data.pinned || false,
              archived: data.archived || false,
            };
          });
          setNotifications(notifs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, notifPath);
        });

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
      let profilePhotoURL = generateInitialsAvatar(data.username || data.email);

      // 3. Create Firestore Document
      const newUser: User = {
        uid: firebaseUser.uid,
        username: data.username,
        email: data.email,
        profilePhotoURL,
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
          totalValue: 0,
          todayPnL: 0,
          todayPnLPercent: 0,
          overallReturn: 0
        }
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // Add Welcome Notifications
      await addNotification(
        'account',
        'medium',
        'Welcome to AverNoxTrader',
        'Welcome to AverNoxTrader! Your professional trading account is successfully initialized. Explore the market terminal and configure your AI settings to begin.'
      );

      await addNotification(
        'vault',
        'high',
        'Welcome Bonus Available',
        'Congratulations! A standard $150 sign-up promotional bonus has been successfully credited to your locked vaults. Complete onboarding and platform activities to begin unlocking rules.'
      );

      await addNotification(
        'account',
        'medium',
        'Account Created',
        `Welcome to AvernoxTrader, ${data.username}! Your account has been successfully created and secured.`
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
      await sendEmailVerification(firebaseUser).catch(err => console.error("Error sending verification email:", err));

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

  const addNotification = useCallback(async (category: NotificationCategory, priority: NotificationPriority, title: string, body: string, actionUrl?: string) => {
    if (userRef.current) {
      const notifPath = 'notifications';
      try {
        await addDoc(collection(db, notifPath), {
          userId: userRef.current.uid,
          category,
          priority,
          title,
          body,
          message: body, // requested field name
          type: category, // requested field name
          createdAt: serverTimestamp(),
          read: false,
          actionUrl: actionUrl || '',
          pinned: false,
          archived: false,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, notifPath);
      }
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string, readState?: boolean) => {
    if (userRef.current) {
      const notifPath = `notifications/${id}`;
      try {
        const notifRef = doc(db, 'notifications', id);
        const docSnap = await getDoc(notifRef);
        if (docSnap.exists()) {
          await updateDoc(notifRef, {
            read: readState !== undefined ? readState : !docSnap.data().read
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, notifPath);
      }
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (userRef.current) {
      const notifPath = 'notifications';
      try {
        const { getDocs } = await import('firebase/firestore');
        const batch = writeBatch(db);
        const q = query(
          collection(db, notifPath),
          where('userId', '==', userRef.current.uid),
          where('read', '==', false)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          batch.update(docSnap.ref, { read: true });
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, notifPath);
      }
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      const notifPath = `notifications/${id}`;
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, notifPath);
      }
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    if (userRef.current) {
      const notifPath = 'notifications';
      try {
        const { getDocs } = await import('firebase/firestore');
        const batch = writeBatch(db);
        const q = query(
          collection(db, notifPath),
          where('userId', '==', userRef.current.uid),
          where('pinned', '==', false)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, notifPath);
      }
    }
  }, []);

  const pinNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      const notifPath = `notifications/${id}`;
      try {
        const notifRef = doc(db, 'notifications', id);
        const docSnap = await getDoc(notifRef);
        if (docSnap.exists()) {
          await updateDoc(notifRef, {
            pinned: !docSnap.data().pinned
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, notifPath);
      }
    }
  }, []);

  const archiveNotification = useCallback(async (id: string) => {
    if (userRef.current) {
      const notifPath = `notifications/${id}`;
      try {
        const notifRef = doc(db, 'notifications', id);
        const docSnap = await getDoc(notifRef);
        if (docSnap.exists()) {
          await updateDoc(notifRef, {
            archived: !docSnap.data().archived
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, notifPath);
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

  const updateProfilePhoto = useCallback(async (file: File) => {
    if (userRef.current) {
      const storageRef = ref(storage, `profile_photos/${userRef.current.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      const userDocRef = doc(db, 'users', userRef.current.uid);
      await updateDoc(userDocRef, { 
        profilePhotoURL: photoURL,
        lastUpdated: serverTimestamp()
      });

      await addNotification(
        'account',
        'low',
        'Profile Picture Changed',
        'Your profile picture has been successfully updated.'
      );
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
    }
  }, []);

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

      await addNotification('deposit', 'medium', 'Deposit Successful', `Successfully deposited $${amount.toLocaleString()}.`);
    }
  }, []);

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

      await addNotification('withdrawal', 'medium', 'Withdrawal Successful', `Successfully withdrew $${amount.toLocaleString()}.`);
    }
  }, []);

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

      await updateDoc(userDocRef, updates);

      await addNotification(
        'account',
        'medium',
        'Profile Updated',
        'Your profile information has been successfully updated.'
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
    user,
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
    user,
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
