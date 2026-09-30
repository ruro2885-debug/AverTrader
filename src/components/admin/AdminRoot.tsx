import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Home, Search, Shield, Bot, Lock, Key, Cpu, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAppNavigation } from '../../contexts/NavigationContext';

export default function AdminRoot({ theme }: { theme: 'light' | 'dark' }) {
  const { navigateToView } = useAppNavigation() as any;
  const [showAdmin, setShowAdmin] = useState(false); // Default to false, check session in useEffect
  const [clickCount, setClickCount] = useState(0);
  const [showAccessPrompt, setShowAccessPrompt] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [promoting, setPromoting] = useState(false);

  const isDark = theme === 'dark';

  // Hidden gesture: Click the 404 header 6 times
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 6) {
      setShowAccessPrompt(true);
      setClickCount(0);
    }
  };

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
          // Use setDoc with merge:true instead of updateDoc to ensure it works even if doc is missing
          await setDoc(userRef, {
            role: 'super_admin',
            isAdmin: true,
            isSuperAdmin: true,
            lastAdminAccess: serverTimestamp(),
            // Ensure essential fields exist if creating for the first time
            email: auth.currentUser.email || '',
            uid: auth.currentUser.uid
          }, { merge: true });
          console.log("[AdminRoot] Role promoted to super_admin successfully.");
        } catch (err) {
          console.error("[AdminRoot] Failed to promote role during terminal authentication:", err);
          // We still show admin because they have the code, but they might face DB errors
        } finally {
          setPromoting(false);
        }
      }

      setShowAdmin(true);
      setShowAccessPrompt(false);
      
      // Force App.tsx to re-evaluate routing
      if (navigateToView) {
        navigateToView('admin');
      }
    } else {
      setError('Invalid access credentials');
      setTimeout(() => setError(''), 3000);
    }
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
        <AdminLayout theme={theme} onLogout={() => {
          localStorage.removeItem('admin_session_active');
          setShowAdmin(false);
        }} />
      </div>
    );
  }

  return (
    <div className="notranslate min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#070913] text-white" translate="no">
      {/* Background Futuristic Grid & Atmospheric Overlay matching reference image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop" 
          alt="Futuristic Grid" 
          className="w-full h-full object-cover object-center opacity-35 mix-blend-luminosity scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c16]/90 via-[#0a0c16]/75 to-[#0a0c16]/95 backdrop-blur-[2px]" />
      </div>

      <AnimatePresence mode="wait">
        {!showAccessPrompt ? (
          <motion.div 
            key="404"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl w-full text-center relative z-10 flex flex-col items-center justify-center"
          >
            <div className="relative inline-block mb-6 select-none group">
              <div 
                onClick={handleLogoClick}
                className="absolute inset-0 z-20 cursor-pointer touch-none"
                title="Institutional Access Point"
              />
              <h1 className="text-[150px] md:text-[210px] font-black leading-none tracking-tighter text-white/20 select-none relative z-10">
                404
                
                {/* Visual Pulse on each tap */}
                <AnimatePresence mode="popLayout">
                  {clickCount > 0 && (
                    <motion.div
                      key={clickCount}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 0.25 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="absolute inset-0 bg-white rounded-full blur-3xl -z-10"
                    />
                  )}
                </AnimatePresence>
              </h1>
              
              {/* Progress Indicator */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 transition-opacity duration-500" style={{ opacity: clickCount > 0 ? 1 : 0 }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    initial={false}
                    animate={{ 
                      scale: i < clickCount ? 1.2 : 1,
                      backgroundColor: i < clickCount ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow: i < clickCount ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none'
                    }}
                    className="w-1.5 h-1.5 rounded-full" 
                  />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Page Not Found</h2>
              <p className="text-sm md:text-base text-slate-400 max-w-sm mx-auto leading-relaxed">
                The page you are looking for does not exist.
              </p>

              <div className="pt-6 flex items-center justify-center">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-full flex items-center justify-center gap-2.5 transition-all backdrop-blur-md border border-white/20 shadow-lg active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="access"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm mx-auto p-8 rounded-3xl border shadow-2xl relative z-20 ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Key className="w-8 h-8" />
              </div>
            </div>

            <h3 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>System Authentication</h3>
            <p className={`text-xs text-center mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter institutional credentials to proceed.
            </p>

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Access Code</label>
                <input 
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter password..."
                  className={`w-full bg-transparent border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                    isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-500 text-[10px] font-bold text-center"
                >
                  {error}
                </motion.p>
              )}

              <button 
                type="submit"
                disabled={promoting}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {promoting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Configuring Permissions...</span>
                  </>
                ) : (
                  <span>Authenticate Terminal</span>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setShowAccessPrompt(false)}
                className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-slate-400 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
