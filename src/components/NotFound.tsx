import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Key } from 'lucide-react';

interface NotFoundProps {
  theme?: 'light' | 'dark' | string;
  onBack?: () => void;
  onAdminAccess?: () => void;
}

export default function NotFound({ onBack, onAdminAccess }: NotFoundProps) {
  const [tapCount, setTapCount] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSecretTap = () => {
    if (!onAdminAccess || showAuth) return;
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= 6) {
      setShowAuth(true);
      setTapCount(0);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = password.trim();
    if (code === 'Ruro2008$' || code === 'Ruro2008') {
      localStorage.setItem('admin_session_active', 'true');
      if (onAdminAccess) onAdminAccess();
    } else {
      setError('Invalid credentials');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070A12] flex items-center justify-center p-6 select-none font-sans">
      {/* High-Fidelity 3D Isometric Technological Server Cubes Background matching reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/images/not_found_bg.jpg"
          alt="Abstract 3D Background"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Dark Vignette & Atmospheric Depth Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060911]/90 via-[#0B1220]/40 to-[#050810]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(4,6,12,0.85)_100%)]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            <motion.div
              key="404"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center w-full"
            >
              {/* Translucent 404 Header with Secret Admin Access Tap */}
              <h1 
                onClick={handleSecretTap}
                className="text-[120px] sm:text-[145px] font-black leading-none tracking-tight text-white/35 hover:text-white/45 transition-colors cursor-pointer select-none drop-shadow-sm"
                title="404"
              >
                404
              </h1>

              {/* Title & Description matching reference composition */}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100/90 mt-3 mb-2.5">
                Page Not Found
              </h2>

              <p className="text-sm sm:text-[15px] text-slate-400/80 leading-relaxed max-w-xs mx-auto mb-8 font-normal">
                The page you are looking for does not exist.
              </p>

              {/* Frosted Glass Back to Home Pill Button */}
              <button
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-white/[0.22] hover:bg-white/[0.30] active:scale-95 transition-all duration-200 backdrop-blur-md border border-white/20 shadow-md text-[#222F3E] hover:text-[#0F172A] font-semibold text-sm cursor-pointer"
              >
                <Home className="w-4 h-4 stroke-[2.2] text-[#222F3E]" />
                <span>Back to Home</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="p-7 rounded-3xl border border-white/10 bg-slate-950/85 backdrop-blur-2xl text-white shadow-2xl w-full max-w-sm text-left"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Verification Required</h3>
                  <p className="text-xs text-slate-400">Enter administrative passkey</p>
                </div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access credentials..."
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  autoFocus
                />
                {error && <p className="text-rose-400 text-xs font-medium">{error}</p>}
                
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAuth(false); setPassword(''); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
