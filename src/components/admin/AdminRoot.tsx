import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Key, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAppNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import AverLogo from '../AverLogo';

export default function AdminRoot({ theme }: { theme: 'light' | 'dark' }) {
  const { navigate, navigateView } = useAppNavigation();
  const { user } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [promoting, setPromoting] = useState(false);

  const isDark = theme === 'dark';

  const isUserAdmin = 
    user?.email?.toLowerCase() === 'ruro2885@gmail.com' ||
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    (user as any)?.isAdmin === true ||
    (user as any)?.isSuperAdmin === true;

  // Auto-authorize admin if user has the admin email or role or an existing session
  useEffect(() => {
    const session = localStorage.getItem('admin_session_active');
    if (session === 'true' || isUserAdmin) {
      localStorage.setItem('admin_session_active', 'true');
      setShowAdmin(true);

      // Automatic Role Promotion for the current logged-in user in Firestore
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        setDoc(userRef, {
          role: 'super_admin',
          isAdmin: true,
          isSuperAdmin: true,
          lastAdminAccess: serverTimestamp(),
          email: auth.currentUser.email || '',
          uid: auth.currentUser.uid
        }, { merge: true }).catch((err) => {
          console.warn("[AdminRoot] Non-fatal profile sync note:", err);
        });
      }
    }
  }, [user?.uid, user?.email, user?.role, isUserAdmin]);

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.trim();
    if (code === 'Ruro2008$' || code === 'Ruro2008') {
      localStorage.setItem('admin_session_active', 'true');
      
      // Automatic Role Promotion for the current logged in user
      if (auth.currentUser) {
        try {
          setPromoting(true);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, {
            role: 'super_admin',
            isAdmin: true,
            isSuperAdmin: true,
            lastAdminAccess: serverTimestamp(),
            email: auth.currentUser.email || '',
            uid: auth.currentUser.uid
          }, { merge: true });
        } catch (err) {
          console.warn("[AdminRoot] Role promote note:", err);
        } finally {
          setPromoting(false);
        }
      }

      setShowAdmin(true);
      if (navigateView) {
        navigateView('admin');
      }
    } else {
      setError('Invalid access credentials. Please try again.');
      setTimeout(() => setError(''), 3500);
    }
  };

  const handleReturnToWorkspace = () => {
    navigate({ view: 'dashboard', tab: 'home' });
  };

  useEffect(() => {
    // Sovereign Admin setup: purge user translation cookies & force English
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    if (window.location.hostname !== 'localhost') {
      const domainParts = window.location.hostname.split('.');
      if (domainParts.length > 2) {
        const rootDomain = domainParts.slice(-2).join('.');
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${rootDomain}; path=/;`;
      }
    }

    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select && select.value !== 'en') {
      select.value = 'en';
      select.dispatchEvent(new Event('change'));
    }
  }, []);

  if (showAdmin) {
    return (
      <div className="notranslate" translate="no">
        <AdminLayout 
          theme={theme} 
          onLogout={() => {
            localStorage.removeItem('admin_session_active');
            setShowAdmin(false);
            navigate({ view: 'dashboard', tab: 'home' });
          }} 
          onReturnToWorkspace={handleReturnToWorkspace}
        />
      </div>
    );
  }

  return (
    <div className={`notranslate min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${isDark ? 'bg-[#05080c] text-white' : 'bg-slate-50 text-slate-900'}`} translate="no">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop')] bg-cover opacity-15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-md mx-auto p-8 rounded-3xl border shadow-2xl relative z-20 backdrop-blur-xl ${
          isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white/95 border-slate-200'
        }`}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <AverLogo theme={theme} size={42} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Executive Command Terminal</span>
          </div>
          <h2 className={`text-2xl font-black tracking-tight text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Admin Authentication
          </h2>
          <p className={`text-xs text-center mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter institutional master credentials to access system telemetry, user accounts, and financial controls.
          </p>
        </div>

        {/* If user is logged in as the master admin, show one-click unlock */}
        {isUserAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recognized Administrator: {user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('admin_session_active', 'true');
                setShowAdmin(true);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Direct Unlock as Super Admin
            </button>
          </div>
        )}

        <form onSubmit={handleAccessSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Security Access Key</span>
              <span className="text-[9px] text-slate-500 font-normal">Level 5 Security</span>
            </label>
            <div className="relative">
              <input 
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter admin passcode..."
                className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono ${
                  isDark ? 'border-white/10 text-white placeholder-slate-500' : 'border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
                autoFocus
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-1.5 text-rose-500 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={promoting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {promoting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing Master Session...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Launch Admin Console</span>
              </>
            )}
          </button>

          <button 
            type="button"
            onClick={handleReturnToWorkspace}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Trading Workspace</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}

