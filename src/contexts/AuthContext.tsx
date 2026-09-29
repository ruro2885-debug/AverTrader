import React, { createContext, useContext, useState } from 'react';

interface User {
  uid: string;
  email: string;
  role?: string;
  displayName?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInUser: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    uid: 'demo_user_1',
    email: 'ruro2885@gmail.com',
    role: 'super_admin',
    displayName: 'Aver Institutional Trader',
    isAdmin: true,
  });
  const [loading] = useState(false);

  const signInUser = async () => {};
  const signOutUser = async () => { setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, signInUser, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
