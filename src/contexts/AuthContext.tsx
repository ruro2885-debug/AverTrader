import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string;
  onboardingCompleted?: boolean;
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
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock session
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('mockUser', JSON.stringify(newUser));
  };

  const getUsers = () => {
    const usersStr = localStorage.getItem('mockUsers');
    return usersStr ? JSON.parse(usersStr) : [];
  };

  const saveUsers = (users: any[]) => {
    localStorage.setItem('mockUsers', JSON.stringify(users));
  };

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        if (users.find((u: any) => u.email === emailLower)) {
          reject(new Error("Account already exists. Please sign in or use a different email address."));
          return;
        }

        const newUser = { 
          uid: Math.random().toString(36).substr(2, 9), 
          email: emailLower, 
          displayName: fullName,
          password,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || emailLower)}`,
          onboardingCompleted: false
        };
        
        users.push(newUser);
        saveUsers(users);
        loginUser(newUser);
        resolve();
      }, 800);
    });
  };

  const signIn = async (email: string, password: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        const existingUser = users.find((u: any) => u.email === emailLower);
        
        if (!existingUser) {
          reject(new Error("Account does not exist. Please create an account first."));
          return;
        }
        
        if (existingUser.password !== password) {
            reject(new Error("Invalid email or password."));
            return;
        }

        loginUser(existingUser);
        resolve();
      }, 800);
    });
  };

  const completeOnboarding = async () => {
    if (user) {
      const updatedUser = { ...user, onboardingCompleted: true };
      loginUser(updatedUser);
      
      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.email === user.email);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].onboardingCompleted = true;
        saveUsers(users);
      }
    }
  };

  const updateProfilePhoto = async (photoURL: string) => {
    if (user) {
      const updatedUser = { ...user, photoURL };
      loginUser(updatedUser);
      
      const users = getUsers();
      const existingUserIndex = users.findIndex((u: any) => u.email === user.email);
      if (existingUserIndex >= 0) {
        users[existingUserIndex].photoURL = photoURL;
        saveUsers(users);
      }
    }
  };

  const forgotPassword = async (email: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const emailLower = email.trim().toLowerCase();
        const users = getUsers();
        const existingUser = users.find((u: any) => u.email === emailLower);
        if (!existingUser) {
          reject(new Error("Account does not exist. Please check your email or create a new account."));
          return;
        }
        resolve();
      }, 800);
    });
  };

  const signInWithGoogle = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        loginUser({ uid: Math.random().toString(36).substr(2, 9), email: 'googleuser@example.com', displayName: 'Google User', photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=googleuser`, onboardingCompleted: true });
        resolve();
      }, 800);
    });
  };

  const signOutUser = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setUser(null);
        localStorage.removeItem('mockUser');
        resolve();
      }, 400);
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser, signUp, signIn, forgotPassword, completeOnboarding, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

