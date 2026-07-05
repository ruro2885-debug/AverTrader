import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      console.log('Auth state changed:', user);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In successful');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      console.log('Sign-out successful');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
