import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { generateInitialsAvatar } from '../utils/avatarUtils';

export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Crypto.subtle not available or failed. Falling back to simple hash.', e);
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

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

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  username: string;
  password?: string;
  photoURL?: string;
  referralCode?: string;
  dateCreated: string;
  lastLogin: string;
  onboardingCompleted?: boolean;
  activeSessions?: string[];
  
  preferences: UserPreferences;
  portfolio: PortfolioData;
  deposits: DepositItem[];
  withdrawals: WithdrawalItem[];
  notificationsList: NotificationItem[];
  history: HistoryItem[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, referralCode?: string, photoURL?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updatePasswordByEmail: (email: string, newPassword: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  addDeposit: (amount: number) => Promise<void>;
  addWithdrawal: (amount: number) => Promise<void>;
  
  // New Notification Engine Methods
  addNotification: (category: NotificationCategory, priority: NotificationPriority, title: string, body: string, actionUrl?: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  pinNotification: (id: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;

  updateProfile: (displayName: string, username: string, email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  hashPassword: (password: string) => Promise<string>;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  forgotPassword: async () => {},
  updatePasswordByEmail: async () => {},
  completeOnboarding: async () => {},
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
  hashPassword: async () => '',
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

const createDefaultPortfolio = (): PortfolioData => ({
  totalValue: 124560.00,
  todayPnL: 1240.50,
  todayPnLPercent: 1.01,
  overallReturn: 24.5,
});

const createDefaultDeposits = (): DepositItem[] => [
  { id: 'dep-1', amount: 50000.00, txHash: '0x3a8c' + Math.random().toString(16).substr(2, 6) + '1a9e', status: 'Completed', date: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString().split('T')[0] },
  { id: 'dep-2', amount: 50000.00, txHash: '0x9f2d' + Math.random().toString(16).substr(2, 6) + '4c8b', status: 'Completed', date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0] },
];

const createDefaultNotifications = (): NotificationItem[] => [
  { id: 'not-1', category: 'account', priority: 'medium', title: 'Welcome to Aver', body: 'Your account has been successfully verified. Welcome to the future of AI trading.', date: new Date().toISOString().split('T')[0], read: false },
  { id: 'not-2', category: 'security', priority: 'high', title: 'Secure Session established', body: 'AverCore AI™ nodes successfully synchronized with your hardware key.', date: new Date().toISOString().split('T')[0], read: true },
];

const createDefaultHistory = (): HistoryItem[] => [
  { id: 'hist-1', type: 'deposit', amount: 50000.00, valueUsd: 50000.00, date: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Completed' },
  { id: 'hist-2', type: 'deposit', amount: 50000.00, valueUsd: 50000.00, date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Completed' },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('mockUser');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse mockUser from localStorage', e);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Use a ref to track if we've already tried restoring the session to avoid race conditions
  const restoreAttempted = useRef(false);

  useEffect(() => {
    if (restoreAttempted.current) {
      setLoading(false);
      return;
    }
    restoreAttempted.current = true;

    const restoreSession = async () => {
      try {
        const storedUserRaw = localStorage.getItem('mockUser');
        if (storedUserRaw) {
          const parsedUser = JSON.parse(storedUserRaw);
          
          const usersStr = localStorage.getItem('mockUsers');
          const users = usersStr ? JSON.parse(usersStr) : [];
          const latestUser = users.find((u: any) => u.uid === parsedUser.uid);
          
          if (latestUser) {
            if (latestUser.activeSessions && parsedUser.sessionId && !latestUser.activeSessions.includes(parsedUser.sessionId)) {
              localStorage.removeItem('mockUser');
              setUser(null);
            } else {
              const { password: _, ...userSafe } = latestUser;
              userSafe.sessionId = parsedUser.sessionId;
              setUser(userSafe);
              localStorage.setItem('mockUser', JSON.stringify(userSafe));
            }
          } else {
            setUser(parsedUser);
          }
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginUser = useCallback((newUser: User) => {
    setUser(newUser);
    try {
      localStorage.setItem('mockUser', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save mockUser, attempting cleanup of other profiles first...', e);
      // Clean up mockUsers first to free up space
      const users = getUsers();
      const optimizedUsers = users.map((u: any) => {
        if (u.uid !== newUser.uid && u.photoURL && u.photoURL.startsWith('data:')) {
          return { ...u, photoURL: undefined };
        }
        return u;
      });
      try {
        localStorage.setItem('mockUsers', JSON.stringify(optimizedUsers));
        localStorage.setItem('mockUser', JSON.stringify(newUser));
      } catch (innerError) {
        // If it still fails, only then we strip the current user's photoURL, but let's try our best to keep it!
        const cleanedUser = { ...newUser };
        if (cleanedUser.photoURL && cleanedUser.photoURL.startsWith('data:')) {
          cleanedUser.photoURL = undefined;
        }
        setUser(cleanedUser);
        localStorage.setItem('mockUser', JSON.stringify(cleanedUser));
      }
    }
  }, []);

  const getUsers = (): User[] => {
    try {
      const usersStr = localStorage.getItem('mockUsers');
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      console.error('Failed to read mockUsers', e);
      return [];
    }
  };

  const saveUsers = (users: any[]) => {
    // Keep photoURL ONLY for the currently logged-in user!
    // Strip photoURL for all other users to save up to 100% of the localStorage limit.
    const optimizedUsers = users.map((u: any) => {
      if (user && u.uid !== user.uid && u.photoURL && u.photoURL.startsWith('data:')) {
        return { ...u, photoURL: undefined };
      }
      return u;
    });

    try {
      localStorage.setItem('mockUsers', JSON.stringify(optimizedUsers));
    } catch (e) {
      console.error('Failed to save users due to storage limit. Cleaning up all other avatars first...');
      const fallbackUsers = users.map((u: any) => {
        if (user && u.uid !== user.uid) {
          return { ...u, photoURL: undefined };
        }
        return u;
      });
      try {
        localStorage.setItem('mockUsers', JSON.stringify(fallbackUsers));
      } catch (innerError) {
        console.error('Fatal: localStorage is completely full.', innerError);
      }
    }
  };

  const playCriticalAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Play a dual-tone high priority chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0.12, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playTone(660, now, 0.12);       // E5
      playTone(880, now + 0.1, 0.25);   // A5
    } catch (error) {
      console.warn('Audio playback failed or blocked by autoplay policy:', error);
    }
  };

  const addNotification = useCallback(async (category: NotificationCategory, priority: NotificationPriority, title: string, body: string, actionUrl?: string) => {
    if (user) {
      const prefs = user.preferences?.notifications || {};
      if (prefs.master === false) return; // Master switch
      if (category === 'security' && prefs.security === false) return;
      if (category === 'account' && prefs.profile === false) return;
      if (category === 'deposit' && prefs.deposits === false) return;
      if (category === 'withdrawal' && prefs.withdrawals === false) return;
      if (category === 'trading' && prefs.trading === false) return;
      if (category === 'system' && prefs.system === false) return;
      
      const newNotification: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        category,
        priority,
        title,
        body,
        date: new Date().toISOString(),
        read: false,
        actionUrl,
      };

      if (priority === 'critical' && prefs.criticalAlertsSound !== false) {
        playCriticalAlertSound();
      }

      const updatedUser: User = {
        ...user,
        notificationsList: [newNotification, ...user.notificationsList],
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedUser.notificationsList;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, referralCode?: string, photoURL?: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        if (users.find((u: any) => u.email === emailLower)) {
          reject(new Error("Account already exists. Please sign in or use a different email address."));
          return;
        }

        const uid = Math.random().toString(36).substr(2, 9);
        const dateCreated = new Date().toISOString();
        const displayName = fullName.trim();
        const username = displayName.toLowerCase().replace(/\s+/g, '');
        const sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);

        const newUser: User = { 
          uid, 
          email: emailLower, 
          displayName,
          username,
          photoURL: photoURL || generateInitialsAvatar(displayName || emailLower),
          onboardingCompleted: true,
          referralCode: referralCode || '',
          dateCreated,
          lastLogin: dateCreated,
          preferences: { ...defaultUserPreferences },
          portfolio: createDefaultPortfolio(),
          deposits: createDefaultDeposits(),
          withdrawals: [],
          notificationsList: [
            {
              id: 'notif_signup_' + Date.now(),
              category: 'account',
              priority: 'high',
              title: 'Account Created Successfully',
              body: 'Welcome to Aver. Your premium real-time trading environment is successfully initialized.',
              date: new Date().toISOString(),
              read: false
            },
            {
              id: 'notif_signin_first_' + Date.now(),
              category: 'security',
              priority: 'medium',
              title: 'Secure Session Established',
              body: 'Your initial secure session has been established from this device.',
              date: new Date().toISOString(),
              read: false
            },
            ...createDefaultNotifications()
          ],
          history: createDefaultHistory(),
        };
        
        // Save password securely in the persistent user store
        const hashedPassword = await hashPassword(password);
        const userWithPassword = { 
          ...newUser, 
          password: hashedPassword,
          activeSessions: [sessionId] 
        };
        users.push(userWithPassword);
        saveUsers(users);

        const userSafe = { ...newUser };
        (userSafe as any).sessionId = sessionId;
        loginUser(userSafe);
        setTimeout(() => resolve(), 800);
      } catch (err) {
        reject(err);
      }
    });
  }, [loginUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        const existingUser = users.find((u: any) => u.email === emailLower);
        
        if (!existingUser) {
          reject(new Error("Account does not exist. Please create an account first."));
          return;
        }
        
        const hashedPassword = await hashPassword(password);
        const storedPassword = (existingUser as any).password;
        const isCorrectPassword = (storedPassword === password) || (storedPassword === hashedPassword);
        
        if (!isCorrectPassword) {
            reject(new Error("Invalid email or password."));
            return;
        }

        // Setup sessionId for multi-session tracking
        const sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
        if (!existingUser.activeSessions) {
          existingUser.activeSessions = [];
        }
        existingUser.activeSessions.push(sessionId);

        // Update last login
        existingUser.lastLogin = new Date().toISOString();
        saveUsers(users);

        // Remove password from active memory user state
        const { password: _, ...userSafe } = existingUser as any;
        userSafe.sessionId = sessionId;
        loginUser(userSafe);
        setTimeout(() => resolve(), 800);
      } catch (err) {
        reject(err);
      }
    });
  }, [loginUser]);

  const completeOnboarding = useCallback(async () => {
    if (user) {
      const onboardingNotification: NotificationItem = {
        id: 'notif_onboarding_' + Date.now(),
        category: 'account',
        priority: 'high',
        title: 'Onboarding Completed',
        body: 'Congratulations! You have completed the Aver onboarding process. All platform features are now unlocked.',
        date: new Date().toISOString(),
        read: false
      };

      const updatedUser = { 
        ...user, 
        onboardingCompleted: true,
        notificationsList: [onboardingNotification, ...(user.notificationsList || [])]
      };
      loginUser(updatedUser);
      
      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].onboardingCompleted = true;
        users[existingUserIndex].notificationsList = updatedUser.notificationsList;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const updateProfilePhoto = useCallback(async (photoURL: string) => {
    if (user) {
      const updatedUser = { ...user, photoURL };
      loginUser(updatedUser);
      
      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].photoURL = photoURL;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const updateProfile = useCallback(async (displayName: string, username: string, email: string) => {
    if (user) {
      const originalDisplayName = user.displayName;
      const originalUsername = user.username;
      const originalEmail = user.email;

      const updatedUser: User = {
        ...user,
        displayName,
        username,
        email,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].displayName = displayName;
        users[existingUserIndex].username = username;
        users[existingUserIndex].email = email;
        saveUsers(users);
      }

      if (originalDisplayName !== displayName) {
        await addNotification(
          'account',
          'medium',
          'Display Name Updated',
          `Your display name has been successfully changed from "${originalDisplayName || ''}" to "${displayName}".`
        );
      }
      if (originalUsername !== username) {
        await addNotification(
          'account',
          'medium',
          'Username Changed',
          `Your username was updated to @${username}.`
        );
      }
      if (originalEmail !== email) {
        await addNotification(
          'account',
          'high',
          'Email Address Updated',
          `Your email address has been successfully updated to ${email}.`
        );
      }
    }
  }, [user, loginUser, addNotification]);

  const verifyCurrentPassword = useCallback(async (passwordToVerify: string): Promise<boolean> => {
    if (!user) return false;
    const users = getUsers();
    const existingUser = users.find((u: any) => u.uid === user.uid);
    if (!existingUser) return false;
    const storedPassword = (existingUser as any).password;
    const hashedInput = await hashPassword(passwordToVerify);
    return (storedPassword === passwordToVerify) || (storedPassword === hashedInput);
  }, [user]);

  const changePassword = useCallback(async (newPassword: string) => {
    if (user) {
      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        const hashedPassword = await hashPassword(newPassword);
        users[existingUserIndex].password = hashedPassword;

        // End every active session except the current one
        const currentSessionId = (user as any).sessionId || 'sess_current';
        users[existingUserIndex].activeSessions = [currentSessionId];

        saveUsers(users);

        const updatedUser = {
          ...user,
          sessionId: currentSessionId
        };
        loginUser(updatedUser);
      }
      await addNotification(
        'security',
        'high',
        'Password Changed',
        'Your account password was successfully updated.'
      );
    }
  }, [user, addNotification, loginUser]);

  const updateUserPreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...newPrefs,
        }
      };
      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].preferences = updatedUser.preferences;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const addDeposit = useCallback(async (amount: number) => {
    if (user) {
      const txHash = '0x' + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
      const dateStr = new Date().toISOString().split('T')[0];
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

      const prefs = user.preferences?.notifications || {};
      const canNotifyDeposit = prefs.master !== false && prefs.deposits !== false;
      const notificationsList = canNotifyDeposit 
        ? [{
            id: 'not-' + Date.now(),
            category: 'deposit',
            priority: 'medium',
            title: 'Deposit Successful',
            body: `Successfully deposited $${amount.toLocaleString()} (Tx: ${txHash.substring(0,6)}...${txHash.substring(txHash.length-4)}).`,
            date: dateStr,
            read: false,
          } as NotificationItem, ...user.notificationsList]
        : user.notificationsList;

      const updatedUser: User = {
        ...user,
        portfolio: {
          ...user.portfolio,
          totalValue: user.portfolio.totalValue + amount,
        },
        deposits: [newDeposit, ...user.deposits],
        history: [newHistoryItem, ...user.history],
        notificationsList,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].portfolio = updatedUser.portfolio;
        users[existingUserIndex].deposits = updatedUser.deposits;
        users[existingUserIndex].history = updatedUser.history;
        users[existingUserIndex].notificationsList = updatedUser.notificationsList;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const addWithdrawal = useCallback(async (amount: number) => {
    if (user) {
      if (user.portfolio.totalValue < amount) {
        throw new Error("Insufficient funds available for withdrawal.");
      }

      const txHash = '0x' + Math.random().toString(16).substr(2, 8) + Math.random().toString(16).substr(2, 8);
      const dateStr = new Date().toISOString().split('T')[0];
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

      const prefs = user.preferences?.notifications || {};
      const canNotifyWithdrawal = prefs.master !== false && prefs.withdrawals !== false;
      const notificationsList = canNotifyWithdrawal
        ? [{
            id: 'not-' + Date.now(),
            category: 'withdrawal',
            priority: 'medium',
            title: 'Withdrawal Successful',
            body: `Successfully withdrew $${amount.toLocaleString()} (Tx: ${txHash.substring(0,6)}...${txHash.substring(txHash.length-4)}).`,
            date: dateStr,
            read: false,
          } as NotificationItem, ...user.notificationsList]
        : user.notificationsList;

      const updatedUser: User = {
        ...user,
        portfolio: {
          ...user.portfolio,
          totalValue: user.portfolio.totalValue - amount,
        },
        withdrawals: [newWithdrawal, ...user.withdrawals],
        history: [newHistoryItem, ...user.history],
        notificationsList,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].portfolio = updatedUser.portfolio;
        users[existingUserIndex].withdrawals = updatedUser.withdrawals;
        users[existingUserIndex].history = updatedUser.history;
        users[existingUserIndex].notificationsList = updatedUser.notificationsList;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (user) {
      const updatedNotifications = user.notificationsList.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const markAllNotificationsRead = useCallback(async () => {
    if (user) {
      const updatedNotifications = user.notificationsList.map(n => ({ ...n, read: true }));
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const deleteNotification = useCallback(async (id: string) => {
    if (user) {
      const updatedNotifications = user.notificationsList.filter(n => n.id !== id);
      
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const pinNotification = useCallback(async (id: string) => {
    if (user) {
      const updatedNotifications = user.notificationsList.map(n => 
        n.id === id ? { ...n, pinned: !n.pinned } : n
      );
      
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const archiveNotification = useCallback(async (id: string) => {
    if (user) {
      const updatedNotifications = user.notificationsList.map(n => 
        n.id === id ? { ...n, archived: !n.archived } : n
      );
      
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const clearNotifications = useCallback(async () => {
    if (user) {
      // Clear non-pinned notifications, keep pinned
      const updatedNotifications = user.notificationsList.filter(n => n.pinned);
      const updatedUser: User = {
        ...user,
        notificationsList: updatedNotifications,
      };

      loginUser(updatedUser);

      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].notificationsList = updatedNotifications;
        saveUsers(users);
      }
    }
  }, [user, loginUser]);

  const forgotPassword = useCallback(async (email: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        const existingUser = users.find((u: any) => u.email === emailLower);
        if (!existingUser) {
          reject(new Error("Account not found."));
          return;
        }
        resolve();
      }, 800);
    });
  }, []);

  const updatePasswordByEmail = useCallback(async (email: string, newPassword: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        const existingIndex = users.findIndex((u: any) => u.email === emailLower);
        if (existingIndex === -1) {
          reject(new Error("Account not found."));
          return;
        }
        const hashedPassword = await hashPassword(newPassword);
        users[existingIndex].password = hashedPassword;
        users[existingIndex].activeSessions = []; // invalidate sessions on forgot password reset
        saveUsers(users);
        setTimeout(() => resolve(), 800);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const email = 'googleuser@example.com';
        const users = getUsers();
        let existingUser = users.find((u: any) => u.email === email);

        if (!existingUser) {
          const uid = Math.random().toString(36).substr(2, 9);
          const dateCreated = new Date().toISOString();
          existingUser = {
            uid,
            email,
            displayName: 'Google User',
            username: 'googleuser',
            photoURL: generateInitialsAvatar('Google User'),
            onboardingCompleted: true,
            referralCode: '',
            dateCreated,
            lastLogin: dateCreated,
            preferences: { ...defaultUserPreferences },
            portfolio: createDefaultPortfolio(),
            deposits: createDefaultDeposits(),
            withdrawals: [],
            notificationsList: [
              { id: 'not-google-1', category: 'account', priority: 'medium', title: 'Welcome to Aver', body: 'Your account has been successfully verified via Google. Welcome to the future of AI trading.', date: new Date().toISOString(), read: false },
            ],
            history: createDefaultHistory(),
          };
          users.push(existingUser);
          saveUsers(users);
        } else {
          existingUser.lastLogin = new Date().toISOString();
          saveUsers(users);
        }

        loginUser(existingUser);
        resolve();
      }, 800);
    });
  }, [loginUser]);

  const signOutUser = useCallback(async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (user) {
          const signOutNotification: NotificationItem = {
            id: 'notif_signout_' + Date.now(),
            category: 'account',
            priority: 'medium',
            title: 'Successfully Signed Out',
            body: 'You have signed out of your Aver account. Your session was securely terminated.',
            date: new Date().toISOString(),
            read: false
          };
          
          const users = getUsers();
          const existingUserIndex = users.findIndex((u: any) => u.uid === user.uid);
          if (existingUserIndex >= 0) {
            users[existingUserIndex].notificationsList = [signOutNotification, ...(users[existingUserIndex].notificationsList || [])];
            const currentSessionId = (user as any).sessionId;
            if (currentSessionId && users[existingUserIndex].activeSessions) {
              users[existingUserIndex].activeSessions = users[existingUserIndex].activeSessions.filter((id: string) => id !== currentSessionId);
            }
            saveUsers(users);
          }
        }
        setUser(null);
        localStorage.removeItem('mockUser');
        resolve();
      }, 400);
    });
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    signUp,
    signOutUser,
    signInWithGoogle,
    signIn,
    forgotPassword,
    updatePasswordByEmail,
    completeOnboarding,
    updateProfilePhoto,
    updateUserPreferences,
    addDeposit,
    addWithdrawal,
    clearNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    pinNotification,
    archiveNotification,
    updateProfile,
    changePassword,
    hashPassword,
    verifyCurrentPassword,
  }), [
    user,
    loading,
    signUp,
    signOutUser,
    signInWithGoogle,
    signIn,
    forgotPassword,
    updatePasswordByEmail,
    completeOnboarding,
    updateProfilePhoto,
    updateUserPreferences,
    addDeposit,
    addWithdrawal,
    clearNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
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
