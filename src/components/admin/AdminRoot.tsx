import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Shield, Lock, Key, Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAppNavigation } from '../../contexts/NavigationContext';

import bgMobile from '../../assets/images/admin_404_cube_bg_1790754808719.jpg';
import bgDesktop from '../../assets/images/admin_404_cube_desktop_1790754826768.jpg';

export default function AdminRoot({ theme }: { theme: 'light' | 'dark' }) {
  const { navigateToView } = useAppNavigation() as any;
  const [showAdmin, setShowAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showAccessPrompt, setShowAccessPrompt] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [promoting, setPromoting] = useState(false);

  // Hidden gesture: Click the 404 header 6 times to open system auth prompt
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
          await setDoc(userRef, {
            role: 'super_admin',
            isAdmin: true,
            isSuperAdmin: true,
            lastAdminAccess: serverTimestamp(),
            email: auth.currentUser.email || '',
            uid: auth.currentUser.uid
          }, { merge: true });
          console.log("[AdminRoot] Role promoted to super_admin successfully.");
        } catch (err) {
          console.error("[AdminRoot] Failed to promote role during terminal authentication:", err);
        } finally {
          setPromoting(false);
        }
      }

      setShowAdmin(true);
      setShowAccessPrompt(false);
      
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
          setShowAccessPrompt(false);
        }} />
      </div>
    );
  }

  return (
    <div className="notranslate min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#030612] text-white select-none" translate="no">
      {/* 3D Isometric Server Cube Field Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Responsive Background Images */}
        <picture>
          <source media="(min-width: 768px)" srcSet={bgDesktop} />
          <img 
            src={bgMobile} 
            alt="3D Futuristic Server Grid" 
            className="w-full h-full object-cover object-center opacity-85 scale-105 filter contrast-125 brightness-90"
            referrerPolicy="no-referrer"
          />
        </picture>

        {/* Deep Dark Vignette and Atmospheric Lighting Scrims */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050d]/80 via-[#030716]/40 to-[#02050d]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#02050d_95%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <AnimatePresence mode="wait">
        {!showAccessPrompt ? (
          <motion.div 
            key="404-visual-reference"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg w-full text-center relative z-10 flex flex-col items-center justify-center my-auto"
          >
            {/* Centered Oversized 404 Typography */}
            <div className="relative inline-block mb-3 select-none group">
              <div 
                onClick={handleLogoClick}
                className="absolute inset-0 z-20 cursor-pointer touch-none"
                title="Institutional Access Point"
              />
              <h1 
                className="text-[130px] sm:text-[180px] md:text-[220px] font-extrabold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white/90 via-white/60 to-white/20 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10"
                style={{
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.15)',
                  paintOrder: 'stroke fill'
                }}
              >
                404

                {/* Secret Gesture Tap Pulse */}
                <AnimatePresence mode="popLayout">
                  {clickCount > 0 && (
                    <motion.div
                      key={clickCount}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.3, opacity: 0.2 }}
                      exit={{ scale: 1.6, opacity: 0 }}
                      className="absolute inset-0 bg-blue-500 rounded-full blur-3xl -z-10"
                    />
                  )}
                </AnimatePresence>
              </h1>
              
              {/* Progress Indicator for Secret Admin Gesture */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-opacity duration-300" style={{ opacity: clickCount > 0 ? 1 : 0 }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    initial={false}
                    animate={{ 
                      scale: i < clickCount ? 1.2 : 1,
                      backgroundColor: i < clickCount ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow: i < clickCount ? '0 0 10px rgba(59, 130, 246, 0.6)' : 'none'
                    }}
                    className="w-1.5 h-1.5 rounded-full" 
                  />
                ))}
              </div>
            </div>

            {/* Page Not Found Heading */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md"
            >
              Page Not Found
            </motion.h2>

            {/* Explanatory Message */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-slate-300/80 font-medium max-w-xs sm:max-w-md mx-auto leading-relaxed mb-8 drop-shadow"
            >
              The page you are looking for does not exist.
            </motion.p>

            {/* Translucent Glass "Back to Home" Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button 
                onClick={() => {
                  if (navigateToView) {
                    navigateToView('home');
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="px-8 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 backdrop-blur-xl text-white font-bold text-sm transition-all shadow-2xl flex items-center justify-center gap-2.5 mx-auto hover:border-white/40 cursor-pointer"
              >
                <Home className="w-4 h-4 text-white/90" />
                <span>Back to Home</span>
              </button>
            </motion.div>

            {/* Subtle Terminal Trigger Icons */}
            <div className="mt-16 flex items-center justify-center gap-6 opacity-25 hover:opacity-75 transition-opacity">
              <span title="Security Governance" onClick={() => setShowAccessPrompt(true)} className="cursor-pointer">
                <Shield className="w-5 h-5 text-slate-400 hover:text-blue-400 transition-colors" />
              </span>
              <Cpu className="w-5 h-5 text-slate-400" />
              <span title="Terminal Access" onClick={() => setShowAccessPrompt(true)} className="cursor-pointer">
                <Lock className="w-5 h-5 text-slate-400 hover:text-blue-400 transition-colors" />
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="access"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm mx-auto p-8 rounded-3xl border border-white/15 bg-[#080d22]/90 backdrop-blur-2xl shadow-2xl relative z-20 text-white"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Key className="w-8 h-8" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-1 text-white">System Authentication</h3>
            <p className="text-xs text-center text-slate-400 mb-8">
              Enter institutional credentials to proceed.
            </p>

            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Access Code</label>
                <input 
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-400 text-[10px] font-bold text-center"
                >
                  {error}
                </motion.p>
              )}

              <button 
                type="submit"
                disabled={promoting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2 text-[10px] font-bold text-slate-400 hover:text-slate-300 transition-colors uppercase tracking-widest cursor-pointer"
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

