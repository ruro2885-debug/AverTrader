import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ArrowLeft, ArrowRight, Eye, EyeOff, Check, X, Bell, TrendingUp, Monitor as MonitorIcon, Tablet as TabletIcon, Phone as PhoneIcon, Cpu, Zap, Lock, DollarSign, Globe } from 'lucide-react';
import AverLogo from './AverLogo';
import PolicyReader from './PolicyReader';
import { useAuth, auth } from '../contexts/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

interface AuthPageProps {
  theme: 'light' | 'dark';
  onBack: () => void;
  onSuccess: () => void;
  key?: string;
}

export default function AuthPage({ theme, onBack, onSuccess }: AuthPageProps) {
  const isDark = theme === 'dark';
  const { signInWithGoogle, signUp, signIn, forgotPassword } = useAuth();
  const [view, setView] = useState<'register' | 'login' | 'forgot-password'>('register');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Active policy reader state
  const [activePolicyId, setActivePolicyId] = useState<string | null>(null);

  // Success screen state after creating account or logging in
  const [authSuccess, setAuthSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation state
  const pwdCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, text: 'No Password', color: 'bg-gray-500' };
    const score = Object.values(pwdCriteria).filter(Boolean).length;
    if (score <= 1) return { score, text: 'Weak', color: 'bg-red-500 shadow-red-500/30' };
    if (score === 2) return { score, text: 'Fair', color: 'bg-amber-500 shadow-amber-500/30' };
    if (score === 3) return { score, text: 'Good', color: 'bg-blue-500 shadow-blue-500/30' };
    if (score === 4) return { score, text: 'Strong', color: 'bg-emerald-400 shadow-emerald-400/30' };
    return { score, text: 'Very Strong', color: 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' };
  }, [password, pwdCriteria]);

  const isFormValid = useMemo(() => {
    return (
      fullName.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      Object.values(pwdCriteria).every(Boolean) &&
      password === confirmPassword &&
      password !== ''
    );
  }, [fullName, email, pwdCriteria, password, confirmPassword]);

  const isLoginFormValid = useMemo(() => {
    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) &&
      loginPassword.length >= 6
    );
  }, [loginEmail, loginPassword]);

  // Handle Register Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccessMsg(`Welcome aboard! Establishing secure session...`);
      setAuthSuccess(true);
      setTimeout(onSuccess, 3000);
    } catch (error: any) {
      setSuccessMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoginFormValid) return;
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      setSuccessMsg(`Access Authorized. Resuming connection to AverCore AI™ nodes...`);
      setAuthSuccess(true);
      setTimeout(onSuccess, 3000);
    } catch (error: any) {
      setSuccessMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setSuccessMsg("Password reset email sent successfully. Check your inbox and spam folder for further instructions.");
      setAuthSuccess(true);
    } catch (error: any) {
      setSuccessMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      setSuccessMsg(`Access Authorized via Google. Resuming connection to AverCore AI™ nodes...`);
      setAuthSuccess(true);
      setTimeout(onSuccess, 3000);
    } catch (error: any) {
      setSuccessMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulated live-updating statistics inside Device Mockups
  const [btcPrice, setBtcPrice] = useState(84291.45);
  const [pnl, setPnl] = useState(14820.24);
  const [pnlPct, setPnlPct] = useState(12.45);
  const [chartPoints, setChartPoints] = useState([45, 55, 48, 62, 58, 70, 64, 82, 78, 88, 84, 94]);
  const [notifications, setNotifications] = useState<string[]>([
    "Signal Detected: BTC/USDT Long entry confirmed by PEO™ (94.8% Confidence)",
    "Position Executed: Bought 0.45 BTC at $84,120.00",
    "Smart Contract Audit: Security Vault nodes validated"
  ]);
  const [activeNotifyIdx, setActiveNotifyIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // Small randomized fluctuations for premium realism
      setBtcPrice(prev => {
        const delta = (Math.random() - 0.48) * 12.5;
        return Number((prev + delta).toFixed(2));
      });
      setPnl(prev => {
        const delta = (Math.random() - 0.46) * 5.2;
        return Number((prev + delta).toFixed(2));
      });
      setPnlPct(prev => {
        const delta = (Math.random() - 0.46) * 0.02;
        return Number((prev + delta).toFixed(2));
      });
      setChartPoints(prev => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.42) * 8;
        next.push(Math.max(20, Math.min(100, Math.round(last + change))));
        return next;
      });
    }, 1500);

    const notifyTimer = setInterval(() => {
      setActiveNotifyIdx(prev => (prev + 1) % notifications.length);
    }, 4500);

    return () => {
      clearInterval(timer);
      clearInterval(notifyTimer);
    };
  }, [notifications.length]);

  if (activePolicyId) {
    return (
      <PolicyReader 
        initialPolicyId={activePolicyId} 
        theme={theme} 
        onClose={() => setActivePolicyId(null)} 
      />
    );
  }

  return (
    <div className={`min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden relative ${
      isDark ? 'bg-[#050505] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Background premium glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-blue-900/5 rounded-full blur-[120px]" />
      </div>

      {/* LEFT SIDE: Beautiful Authentication Console */}
      <div className="lg:col-span-6 flex flex-col justify-between px-6 sm:px-12 py-10 relative z-10 max-w-2xl mx-auto lg:mx-0 w-full lg:max-w-none border-r border-white/5 bg-[#050505]/40 backdrop-blur-md">
        
        {/* Top bar with back option and logo */}
        <div className="flex items-center justify-between w-full mb-10">
          <button 
            onClick={onBack}
            className={`flex items-center space-x-2 text-xs font-bold font-mono tracking-wider uppercase py-2 px-3 rounded-lg border transition-all cursor-pointer ${
              isDark 
                ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5' 
                : 'border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <AverLogo theme={theme} size={36} showText={true} />
        </div>

        {/* Main interactive cards area */}
        <div className="my-auto py-4">
          <AnimatePresence mode="wait">
            {authSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`p-8 rounded-3xl border text-center space-y-6 ${
                  isDark ? 'bg-gradient-to-b from-[#0a0f12] to-black border-emerald-500/30' : 'bg-white border-emerald-500/20 shadow-xl'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto animate-bounce">
                  <Shield className="w-8 h-8 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                  Authorization Confirmed
                </h3>
                <p className={`text-sm sm:text-base font-sans font-medium leading-relaxed max-w-md mx-auto ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  {successMsg}
                </p>
                <button
                  onClick={onBack}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center space-x-2 mx-auto cursor-pointer"
                >
                  <span>Launch Aver Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : view === 'register' ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Welcome headings */}
                <div className="space-y-2">
                  <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tighter">
                    Create Your Aver Account
                  </h2>
                  <p className={`text-base leading-relaxed font-sans font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Join Aver and experience an AI-powered trading platform built for intelligent investing, advanced analytics, and professional market insights.
                  </p>
                </div>

                {/* Social Authentication */}
                <div className="w-full">
                  {/* Google Button */}
                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    className={`w-full py-3.5 px-4 rounded-xl border font-sans font-bold text-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer ${
                      isDark 
                        ? 'bg-[#0f111a] border-white/10 hover:bg-white/5 hover:border-emerald-500/30' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.51 15.01 1 12 1 7.24 1 3.19 3.73 1.24 7.73l3.87 3C6.01 7.42 8.78 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.97 3.71-8.61z" />
                      <path fill="#FBBC05" d="M5.11 14.73c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.24 7.13C.45 8.75 0 10.57 0 12.5s.45 3.75 1.24 5.37l3.87-3.14z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.72-2.88c-1.04.7-2.38 1.12-4.24 1.12-3.22 0-5.99-2.38-6.89-5.69l-3.87 3.14C3.19 20.27 7.24 23 12 23z" />
                    </svg>
                    <span className="truncate">Continue with Google</span>
                  </button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Email Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe" 
                      className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@enterprise.com" 
                      className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Secure Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border pr-12 focus:outline-none transition-all ${
                          isDark 
                            ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Monitor */}
                    {password && (
                      <div className="space-y-2.5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500">
                            Security Rating:
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                            passwordStrength.score <= 1 
                              ? 'text-red-400' 
                              : passwordStrength.score === 2 
                                ? 'text-amber-500' 
                                : passwordStrength.score === 3 
                                  ? 'text-blue-400' 
                                  : passwordStrength.score === 4 
                                    ? 'text-emerald-400' 
                                    : 'text-emerald-500 animate-pulse'
                          }`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        
                        {/* Progressive multi-bar layout */}
                        <div className="grid grid-cols-5 gap-1.5 h-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div 
                              key={i} 
                              className={`h-full rounded-full transition-all duration-300 ${
                                i <= passwordStrength.score 
                                  ? passwordStrength.color 
                                  : isDark ? 'bg-white/5' : 'bg-slate-200'
                              }`} 
                            />
                          ))}
                        </div>

                        {/* Staggered requirements checklists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-white/5">
                          {/* Requirement 1 */}
                          <div className="flex items-center space-x-2">
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {pwdCriteria.length ? (
                                  <motion.div
                                    key="check-len"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dot-len"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] font-medium font-sans transition-colors duration-300 ${pwdCriteria.length ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>At least 8 characters</span>
                          </div>

                          {/* Requirement 2 */}
                          <div className="flex items-center space-x-2">
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {pwdCriteria.uppercase ? (
                                  <motion.div
                                    key="check-up"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dot-up"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] font-medium font-sans transition-colors duration-300 ${pwdCriteria.uppercase ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>At least one uppercase letter</span>
                          </div>

                          {/* Requirement 3 */}
                          <div className="flex items-center space-x-2">
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {pwdCriteria.lowercase ? (
                                  <motion.div
                                    key="check-low"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dot-low"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] font-medium font-sans transition-colors duration-300 ${pwdCriteria.lowercase ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>At least one lowercase letter</span>
                          </div>

                          {/* Requirement 4 */}
                          <div className="flex items-center space-x-2">
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {pwdCriteria.number ? (
                                  <motion.div
                                    key="check-num"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dot-num"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] font-medium font-sans transition-colors duration-300 ${pwdCriteria.number ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>At least one number</span>
                          </div>

                          {/* Requirement 5 */}
                          <div className="flex items-center space-x-2 col-span-1 sm:col-span-2">
                            <div className="relative w-3.5 h-3.5 flex items-center justify-center flex-shrink-0">
                              <AnimatePresence mode="wait">
                                {pwdCriteria.special ? (
                                  <motion.div
                                    key="check-spec"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="dot-spec"
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-gray-500 absolute"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] font-medium font-sans transition-colors duration-300 ${pwdCriteria.special ? 'text-emerald-400 font-bold' : 'text-gray-500'}`}>At least one special character</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border pr-12 focus:outline-none transition-all ${
                          isDark 
                            ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Matching Confirmation Indicator */}
                    {confirmPassword && (
                      <motion.div 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-1 flex items-center"
                      >
                        {password === confirmPassword ? (
                          <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-bold font-mono uppercase tracking-wider">
                            <Check className="w-3.5 h-3.5" />
                            <span>✓ Passwords match</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 text-red-400 text-[10px] font-bold font-mono uppercase tracking-wider">
                            <X className="w-3.5 h-3.5" />
                            <span>✕ Passwords do not match</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Create Account Button */}
                  <button 
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full py-4 rounded-xl font-sans font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 mt-6 cursor-pointer ${
                      isFormValid 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/25 active:scale-[0.99]' 
                        : isDark
                          ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-extrabold text-base">Create Account</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>

                  {/* Legal disclosures */}
                  <p className="text-[10px] leading-relaxed text-gray-500 font-medium text-center pt-2 max-w-lg mx-auto">
                    By continuing, you agree to Aver's{' '}
                    <button type="button" onClick={() => setActivePolicyId('terms')} className="text-emerald-400 font-bold hover:underline">Terms of Service</button>{' '}
                    and acknowledge our{' '}
                    <button type="button" onClick={() => setActivePolicyId('privacy')} className="text-emerald-400 font-bold hover:underline">Privacy Policy</button>.
                    Additional legal information is available in the{' '}
                    <button type="button" onClick={() => setActivePolicyId('legal-center')} className="text-gray-400 hover:text-gray-300 hover:underline">Legal Center</button>.
                  </p>
                </form>

                {/* Switch view footer */}
                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-xs font-sans font-bold text-gray-500">
                    Already have an account?{' '}
                    <button 
                      onClick={() => {
                        setView('login');
                        setPassword('');
                        setConfirmPassword('');
                      }} 
                      className="text-emerald-400 hover:text-emerald-300 font-extrabold focus:outline-none cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Welcome headings */}
                <div className="space-y-2">
                  <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tighter">
                    Sign In to Aver
                  </h2>
                  <p className={`text-base leading-relaxed font-sans font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Welcome back. Enter your secure credentials to resume institutional execution.
                  </p>
                </div>

                {/* Social Authentication */}
                <div className="w-full">
                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    className={`w-full py-3.5 px-4 rounded-xl border font-sans font-bold text-xs flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer ${
                      isDark 
                        ? 'bg-[#0f111a] border-white/10 hover:bg-white/5 hover:border-emerald-500/30' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.51 15.01 1 12 1 7.24 1 3.19 3.73 1.24 7.73l3.87 3C6.01 7.42 8.78 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.97 3.71-8.61z" />
                      <path fill="#FBBC05" d="M5.11 14.73c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.24 7.13C.45 8.75 0 10.57 0 12.5s.45 3.75 1.24 5.37l3.87-3.14z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.72-2.88c-1.04.7-2.38 1.12-4.24 1.12-3.22 0-5.99-2.38-6.89-5.69l-3.87 3.14C3.19 20.27 7.24 23 12 23z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">
                    or continue with email
                  </span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                {/* Email Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="john.doe@enterprise.com" 
                      className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Security Password</label>
                      <button 
                        type="button" 
                        onClick={() => setView('forgot-password')}
                        className="text-[10px] font-mono font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        FORGOT PASSWORD?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border pr-12 focus:outline-none transition-all ${
                          isDark 
                            ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button 
                    type="submit"
                    disabled={!isLoginFormValid}
                    className={`w-full py-4 rounded-xl font-sans font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 mt-6 cursor-pointer ${
                      isLoginFormValid 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/25 active:scale-[0.99]' 
                        : isDark
                          ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-extrabold text-base">Sign In</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </form>

                {/* Switch view footer */}
                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-xs font-sans font-bold text-gray-500">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => {
                        setView('register');
                        setLoginPassword('');
                        setPassword('');
                        setConfirmPassword('');
                      }} 
                      className="text-emerald-400 hover:text-emerald-300 font-extrabold focus:outline-none cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-display font-black tracking-tighter">Reset Your Password</h2>
                  <p className={`text-base font-sans font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    Enter the email address associated with your Aver account. We’ll send you a secure password reset link.
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john.doe@enterprise.com" 
                      className={`w-full px-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                        isDark 
                          ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                      }`}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !forgotEmail}
                    className="w-full py-4 rounded-xl font-sans font-bold text-sm tracking-wide transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                  <button 
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full py-4 rounded-xl font-sans font-bold text-sm tracking-wide transition-all bg-white/5 text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom secure footnote */}
        <div className="flex items-center justify-center space-x-2 text-[9px] font-mono font-bold tracking-wider text-gray-500 uppercase mt-10">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>AES-256 Client-Side Cryptographic Isolation Enabled</span>
        </div>
      </div>

      {/* RIGHT SIDE: Gorgeous, immersive 3D Device mockups showcasing live platform features */}
      <div className="lg:col-span-6 hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-[#020508] via-slate-950 to-black overflow-hidden px-8 select-none border-l border-white/5 py-12">
        
        {/* Dynamic backdrop grid */}
        <div className="absolute inset-0 z-0">
          <img src="/images/trading_bg_v1.jpg" alt="Trading Background" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#020508]/60 to-[#020508] z-0" />
        <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* THREE DEVICES WRAPPER WITH MOTION STAGGER */}
        <div className="w-full max-w-xl flex flex-col space-y-10 z-10 relative items-center">
          
          {/* TITLE BADGE FOR THE PREVIEW SECTION */}
          <div className="text-center space-y-1 max-w-md animate-fade-in">
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold font-mono tracking-wider uppercase">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>AverCore Active Ecosystem</span>
            </span>
            <p className="text-xs font-sans text-gray-400 font-medium leading-relaxed">
              Real-time neural feedback displaying current telemetry feeds and autonomous execution patterns.
            </p>
          </div>

          <div className="relative w-full h-[480px] flex items-center justify-center">
            
            {/* 1. PREMIUM DESKTOP MONITOR (Back Layer, gently floating) */}
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotateX: [12, 10, 12],
                rotateY: [-16, -14, -16],
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ perspective: 1000 }}
              className="absolute top-0 w-[420px] h-[250px] rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-10 hover:border-emerald-500/30 transition-colors"
            >
              {/* Glass Reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none z-20" />
              
              {/* Monitor bezel top bar */}
              <div className="px-3.5 py-2.5 border-b border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/30" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest pl-2">AverCore Trading Terminal v4.8</span>
                </div>
                <div className="flex items-center space-x-2 text-[8px] font-mono font-bold">
                  <span className="text-emerald-400 animate-pulse">● FEED ONLINE</span>
                </div>
              </div>

              {/* Monitor Main Panel Content */}
              <div className="flex-1 p-3 grid grid-cols-12 gap-3 bg-[#04060a]">
                
                {/* Visual Chart area (Col-span 8) */}
                <div className="col-span-8 flex flex-col justify-between border border-white/5 bg-slate-950/60 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">BTC / USDT Perpetual</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold">${btcPrice.toLocaleString()}</span>
                  </div>
                  
                  {/* Glowing custom dynamic Sparkline SVG representation */}
                  <div className="flex-1 h-20 flex items-end relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 80">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Filled path */}
                      <path 
                        d={`M 0,80 ${chartPoints.map((p, idx) => `L ${(idx / (chartPoints.length - 1)) * 200},${80 - p}`).join(' ')} L 200,80 Z`} 
                        fill="url(#chartGrad)"
                      />
                      {/* Glowing Line */}
                      <path 
                        d={chartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${(idx / (chartPoints.length - 1)) * 200},${80 - p}`).join(' ')} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                      />
                      {/* Pulsing indicator dot */}
                      <circle 
                        cx="200" 
                        cy={80 - chartPoints[chartPoints.length - 1]} 
                        r="3" 
                        fill="#34d399" 
                        className="animate-ping" 
                      />
                    </svg>
                  </div>

                  <div className="flex justify-between items-center text-[7px] font-mono text-gray-500 font-bold border-t border-white/5 pt-1.5">
                    <span>EMA 12/26 CROSS</span>
                    <span>VOL: 284K BTC</span>
                    <span className="text-emerald-400 font-extrabold">+14.28%</span>
                  </div>
                </div>

                {/* Live orders pane (Col-span 4) */}
                <div className="col-span-4 flex flex-col justify-between border border-white/5 bg-slate-950/60 p-2 rounded-xl text-[7px] font-mono text-gray-400 font-bold">
                  <div className="border-b border-white/5 pb-1 flex justify-between">
                    <span>LIVE EXECUTIONS</span>
                    <span className="text-emerald-400">99.98%</span>
                  </div>
                  <div className="space-y-1.5 py-1 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between text-emerald-400 bg-emerald-500/5 px-1 py-0.5 rounded">
                      <span>BUY BTC</span>
                      <span>$84,120</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 bg-emerald-500/5 px-1 py-0.5 rounded">
                      <span>BUY ETH</span>
                      <span>$3,425</span>
                    </div>
                    <div className="flex justify-between text-red-400 bg-red-500/5 px-1 py-0.5 rounded">
                      <span>SELL SOL</span>
                      <span>$138.45</span>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-1 text-center text-gray-500 text-[6px]">
                    AUTONOMOUS TELEMETRY ENABLED
                  </div>
                </div>

              </div>

              {/* Sub-monitor logo stand overlay mock */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded bg-black border border-white/10 text-[6px] font-mono text-gray-500 font-bold">
                AVERCORE™ MODULE
              </div>
            </motion.div>

            {/* 2. REALISTIC TABLET (Middle Layer, overlapping right/bottom) */}
            <motion.div 
              animate={{ 
                y: [0, 8, 0],
                rotateX: [6, 4, 6],
                rotateY: [15, 17, 15],
              }}
              transition={{ 
                duration: 5.2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ perspective: 1000 }}
              className="absolute bottom-6 left-[-10px] w-[260px] h-[190px] rounded-3xl border-2 border-white/10 bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-20 hover:border-emerald-500/30 transition-colors"
            >
              {/* Screen gloss */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] pointer-events-none z-20" />
              
              {/* Tablet Header */}
              <div className="px-3.5 py-2 border-b border-white/5 bg-slate-900/80 flex justify-between items-center text-[7px] font-mono text-gray-400">
                <span className="font-bold">Aver Analytics Terminal</span>
                <span className="text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                  <span>PEO™ CALIBRATED</span>
                </span>
              </div>

              {/* Tablet Content */}
              <div className="flex-1 p-3 bg-[#05070c] flex flex-col justify-between space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1.5 border border-white/5 bg-slate-950 rounded-lg text-center">
                    <p className="text-[6px] font-mono text-gray-500 uppercase">Aver AI Portfolio Balance</p>
                    <p className="text-xs font-mono font-bold text-white">${pnl.toLocaleString()}</p>
                    <p className="text-[6px] font-mono text-emerald-400">+{pnlPct}% (Today)</p>
                  </div>
                  <div className="p-1.5 border border-white/5 bg-slate-950 rounded-lg text-center">
                    <p className="text-[6px] font-mono text-gray-500 uppercase">Active Risk Factor</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">Low-Risk (0.24)</p>
                    <p className="text-[6px] font-mono text-gray-400">Vault Shields: 100%</p>
                  </div>
                </div>

                <div className="p-2 border border-white/5 bg-slate-950 rounded-lg flex-1 flex flex-col justify-between text-[7px] font-mono text-gray-400 font-bold">
                  <span className="text-gray-500 uppercase tracking-widest text-[6px]">AverCore AI™ Active State</span>
                  <div className="space-y-1 pt-1.5">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>✓ Neural Pattern Scanned</span>
                      <span>100%</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>✓ Decentralized Ledger Connect</span>
                      <span>Connected</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>✓ PEO™ Execution Ready</span>
                      <span>Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. FLAGSHIP SMARTPHONE (Front Layer, overlapping right/bottom) */}
            <motion.div 
              animate={{ 
                y: [0, -12, 0],
                rotateX: [10, 12, 10],
                rotateY: [-8, -6, -8],
              }}
              transition={{ 
                duration: 4.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{ perspective: 1000 }}
              className="absolute bottom-2 right-[-20px] w-[145px] h-[260px] rounded-[32px] border-4 border-white/10 bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden z-30 hover:border-emerald-500/30 transition-colors"
            >
              {/* Dynamic Island phone speaker mockup */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-full bg-black z-30 border border-white/5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
              </div>

              {/* Smartphone layout */}
              <div className="flex-1 p-3 pt-8 bg-[#030508] flex flex-col justify-between space-y-2">
                
                {/* Mobile app header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-[7px] font-mono text-gray-400 font-bold uppercase tracking-wider">AverMobile</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[6px] font-mono text-emerald-400">SECURE</span>
                  </div>
                </div>

                {/* Mobile stats panel */}
                <div className="p-1.5 border border-white/5 bg-slate-950 rounded-xl text-center">
                  <p className="text-[6px] font-mono text-gray-500 uppercase">BTC Price</p>
                  <p className="text-[11px] font-mono font-bold text-emerald-400">${btcPrice.toLocaleString()}</p>
                </div>

                {/* iOS-Style Push Notification Popup */}
                <div className="flex-1 flex items-center justify-center py-2">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeNotifyIdx}
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="p-2 border border-emerald-500/20 bg-emerald-950/40 backdrop-blur-md rounded-xl space-y-1.5 shadow-[0_5px_15px_rgba(16,185,129,0.15)] w-full"
                    >
                      <div className="flex items-center justify-between text-emerald-400">
                        <div className="flex items-center space-x-1">
                          <Bell className="w-2.5 h-2.5 animate-bounce" />
                          <span className="text-[6px] font-mono font-bold uppercase tracking-wider">Aver Alert</span>
                        </div>
                        <span className="text-[5px] font-mono text-gray-500">NOW</span>
                      </div>
                      <p className="text-[7px] font-sans font-bold leading-normal text-gray-200">
                        {notifications[activeNotifyIdx]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom button indicator */}
                <div className="py-1 bg-emerald-500 text-black text-center text-[7px] font-mono font-extrabold rounded-lg uppercase tracking-wider shadow-lg shadow-emerald-500/10">
                  TAP TO ACTIVATE BOT
                </div>

              </div>
            </motion.div>

          </div>

          {/* SECURITY TRUST BADGES */}
          <div className="flex items-center justify-center space-x-6 text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SOC2 CERTIFIED</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>256-BIT CRYPTO</span>
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
