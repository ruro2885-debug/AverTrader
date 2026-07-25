import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldAlert, KeyRound, Loader2, LogOut } from 'lucide-react';
import AverLogo from '../AverLogo';

interface AdminAuthGateProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

export default function AdminAuthGate({ children, theme, onBackToApp }: AdminAuthGateProps & { onBackToApp: () => void }) {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isSecondaryUnlocked, setIsSecondaryUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setIsAuthorized(false);
      } else {
        // Validation now depends strictly on the role field from Firestore
        // which is managed by the server and sync'd to the client.
        const isSuperAdmin = user.role === 'super_admin';
        setIsAuthorized(isSuperAdmin);
      }
    }
  }, [user, authLoading]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPassError('');

    try {
      // Get fresh ID token for backend verification
      const { auth } = await import('../../lib/firebase');
      const idToken = await auth.currentUser?.getIdToken(true);

      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          idToken
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsSecondaryUnlocked(true);
        // Optional: save session state for this login
      } else {
        setPassError(data.message || 'Verification failed');
      }
    } catch (err) {
      setPassError('Server connection failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (authLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070A]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070A] p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0D1117] border border-red-500/20 rounded-3xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-8">
            You do not have the required administrative permissions to access this area.
          </p>
          <button 
            onClick={onBackToApp}
            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Back to Application
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isSecondaryUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070A] p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="flex justify-center mb-12">
            <AverLogo size={48} className="text-white" />
          </div>

          <div className="bg-[#0D1117] border border-white/[0.05] rounded-[32px] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Security Gate</h2>
                <p className="text-sm text-slate-400">Restricted Admin Access</p>
              </div>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">
                  Admin Access Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-14 pr-5 py-5 bg-[#161B22] border border-white/[0.05] rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-mono"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
                {passError && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-3 text-sm text-red-400 px-1 font-medium"
                  >
                    {passError}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-5 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 group"
              >
                {isVerifying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Unlock Terminal
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={onBackToApp}
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Cancel and Return to Main App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
