import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { generateInitialsAvatar } from '../utils/avatarUtils';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string;
  onboardingCompleted?: boolean;
  subscriptionPlan?: 'Free' | 'Pro' | 'Enterprise';
  referralCode?: string;
  referredBy?: string;
  referralRewards?: number;
  aiTradingStatus?: 'active' | 'paused' | 'stopped';
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycDocumentURL?: string;
  settings?: {
    language: string;
    theme: string;
    currency: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  updateUserKyc: (kycDocumentURL: string) => Promise<void>;
  updateUserTradingStatus: (aiTradingStatus: 'active' | 'paused' | 'stopped') => Promise<void>;
  updateUserSettings: (settings: { language: string; theme: string; currency: string }) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  forgotPassword: async () => {},
  completeOnboarding: async () => {},
  updateProfilePhoto: async () => {},
  updateUserKyc: async () => {},
  updateUserTradingStatus: async () => {},
  updateUserSettings: async () => {},
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSyncUserData = async (firebaseUser: any) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...data } as User);
      } else {
        // Generate a referral code for this user
        const refCode = 'AVR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Create user doc if it doesn't exist
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || generateInitialsAvatar(firebaseUser.displayName || 'U'),
          onboardingCompleted: false,
          subscriptionPlan: 'Free',
          referralCode: refCode,
          referredBy: '',
          referralRewards: 0,
          aiTradingStatus: 'paused',
          kycStatus: 'unverified',
          kycDocumentURL: '',
          settings: {
            language: 'EN',
            theme: 'dark',
            currency: 'USD'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(userDocRef, newUser);
        
        // Initialize Portfolio collection securely
        const portfolioRef = doc(db, `users/${firebaseUser.uid}/portfolio/main`);
        await setDoc(portfolioRef, {
          userId: firebaseUser.uid,
          balance: 1000.00, // Pre-seeded $1,000.00 welcome bonus as teased in welcome cards!
          totalDeposits: 1000.00,
          totalWithdrawals: 0.00,
          todayPnL: 12.50,
          todayPnLPercent: 1.25,
          overallReturn: 1.25,
          updatedAt: new Date().toISOString()
        });

        // Initialize first Transaction
        const welcomeTxId = 'welcome_' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, `users/${firebaseUser.uid}/transactions`, welcomeTxId), {
          id: welcomeTxId,
          userId: firebaseUser.uid,
          type: 'deposit',
          asset: 'USD',
          amount: 1000.00,
          status: 'completed',
          txHash: 'WELCOME-BONUS-AVER-CORE',
          createdAt: new Date().toISOString()
        });

        // Initialize welcome notification
        const welcomeNotifId = 'notif_welcome';
        await setDoc(doc(db, `users/${firebaseUser.uid}/notifications`, welcomeNotifId), {
          id: welcomeNotifId,
          userId: firebaseUser.uid,
          type: 'deposit',
          title: 'Welcome to AverCore AI™!',
          message: 'Your account has been successfully created. We have credited a $1,000.00 welcome bonus to your portfolio!',
          read: false,
          createdAt: new Date().toISOString()
        });

        setUser(newUser);
      }
    } catch (error) {
      console.error("Error fetching/syncing user data", error);
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser?.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchAndSyncUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    if (auth.currentUser) {
      await fetchAndSyncUserData(auth.currentUser);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send security email verification!
    try {
      await sendEmailVerification(user);
    } catch (e) {
      console.warn("Could not send email verification instantly", e);
    }
    
    const refCode = 'AVR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newUser: User = {
      uid: user.uid,
      email: email,
      displayName: fullName,
      photoURL: generateInitialsAvatar(fullName),
      onboardingCompleted: false,
      subscriptionPlan: 'Free',
      referralCode: refCode,
      referredBy: referralCode || '',
      referralRewards: 0,
      aiTradingStatus: 'paused',
      kycStatus: 'unverified',
      kycDocumentURL: '',
      settings: {
        language: 'EN',
        theme: 'dark',
        currency: 'USD'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // Initialize Portfolio collection securely
      const portfolioRef = doc(db, `users/${user.uid}/portfolio/main`);
      await setDoc(portfolioRef, {
        userId: user.uid,
        balance: 1000.00, // Pre-seeded $1,000.00 welcome bonus as teased in welcome cards!
        totalDeposits: 1000.00,
        totalWithdrawals: 0.00,
        todayPnL: 12.50,
        todayPnLPercent: 1.25,
        overallReturn: 1.25,
        updatedAt: new Date().toISOString()
      });

      // Initialize first Transaction
      const welcomeTxId = 'welcome_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, `users/${user.uid}/transactions`, welcomeTxId), {
        id: welcomeTxId,
        userId: user.uid,
        type: 'deposit',
        asset: 'USD',
        amount: 1000.00,
        status: 'completed',
        txHash: 'WELCOME-BONUS-AVER-CORE',
        createdAt: new Date().toISOString()
      });

      // Initialize welcome notification
      const welcomeNotifId = 'notif_welcome';
      await setDoc(doc(db, `users/${user.uid}/notifications`, welcomeNotifId), {
        id: welcomeNotifId,
        userId: user.uid,
        type: 'deposit',
        title: 'Welcome to AverCore AI™!',
        message: 'Your account has been successfully created. We have credited a $1,000.00 welcome bonus to your portfolio!',
        read: false,
        createdAt: new Date().toISOString()
      });

      // Securely process referral rewards in backend if a referral code is present!
      if (referralCode) {
        try {
          await fetch('/api/referral-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, referralCode })
          });
        } catch (err) {
          console.error("Failed to securely award referral rewards on backend", err);
        }
      }

      setUser(newUser);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const completeOnboarding = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { onboardingCompleted: true });
        setUser({ ...user, onboardingCompleted: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { photoURL });
        setUser({ ...user, photoURL });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateUserKyc = async (kycDocumentURL: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { 
          kycStatus: 'pending',
          kycDocumentURL
        });
        setUser({ ...user, kycStatus: 'pending', kycDocumentURL });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateUserTradingStatus = async (aiTradingStatus: 'active' | 'paused' | 'stopped') => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { aiTradingStatus });
        setUser({ ...user, aiTradingStatus });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const updateUserSettings = async (settings: { language: string; theme: string; currency: string }) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { settings });
        setUser({ ...user, settings });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signOutUser, 
      signUp, 
      signIn, 
      forgotPassword, 
      completeOnboarding, 
      updateProfilePhoto,
      updateUserKyc,
      updateUserTradingStatus,
      updateUserSettings,
      refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
