import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { X, DollarSign, Wallet, ArrowUpRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface WithdrawalModalProps {
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function WithdrawalModal({ theme, onClose }: WithdrawalModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDT');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  const isDark = theme === 'dark';

  // Load current balance from Firestore to show limits
  useEffect(() => {
    if (!user) return;
    const loadBalance = async () => {
      const snap = await getDoc(doc(db, `users/${user.uid}/portfolio/main`));
      if (snap.exists()) {
        setCurrentBalance(snap.data().balance || 0);
      }
    };
    loadBalance();
  }, [user]);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !address) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/validate-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          asset,
          amount,
          address
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error || 'Withdrawal validation failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error validating withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark ? "bg-[#0b0f19] border border-white/5" : "bg-white border border-slate-200 shadow-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Main dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`relative w-full max-w-md rounded-3xl p-6 overflow-hidden z-10 ${cardClasses}`}
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full hover:scale-105 transition-transform ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form 
              key="form"
              onSubmit={handleWithdrawalSubmit}
              className="space-y-4 pt-2"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>Security Guarded Withdrawal</h3>
                  <p className={`text-xs ${textSecondary}`}>Enforced by automated anti-money laundering checks</p>
                </div>
              </div>

              {/* KYC Status Warn */}
              {user?.kycStatus === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start space-x-2.5 text-[11px] font-medium leading-relaxed">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>KYC Action Required:</strong> Your profile is currently unverified. Document uploads (under Profile settings) must be approved before withdrawals can be processed.
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start space-x-2.5 text-[11px] font-bold leading-normal">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Asset Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Select Digital Asset</label>
                <div className="grid grid-cols-4 gap-2">
                  {['USDT', 'BTC', 'ETH', 'USDC'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAsset(item)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        asset === item
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 font-black'
                          : isDark
                          ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">
                  <label>Amount ($ Equivalent)</label>
                  <span>Max: ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-[15px]" />
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="50.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-9 pr-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                      isDark 
                        ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/40' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500/40'
                    }`}
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Destination Wallet Address</label>
                <input 
                  type="text"
                  required
                  placeholder="0x918f0de2093e981ba203db8cfb934bda7d018d"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-indigo-500/40' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500/40'
                  }`}
                />
                <p className="text-[9px] text-slate-500 leading-normal font-medium">
                  Ensure the target network matches your selected asset perfectly. Withdrawals made to incorrect addresses are completely irreversible.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !amount || !address}
                className={`w-full py-3.5 rounded-xl text-xs font-black tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                  amount && address && !loading
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black shadow-[0_2px_10px_rgba(99,102,241,0.3)]'
                    : isDark
                    ? 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>Authorize Secure Withdrawal</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xl font-black tracking-tight ${textPrimary}`}>Withdrawal Success</h4>
                <p className={`text-xs ${textSecondary}`}>The quantitative contract was successfully finalized</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">DISBURSED AMOUNT</span>
                <span className="text-xl font-mono font-black text-indigo-400 mt-1 block">
                  -{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {asset}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black rounded-xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
