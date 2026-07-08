import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { X, DollarSign, Wallet, ArrowDownRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface DepositModalProps {
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function DepositModal({ theme, onClose }: DepositModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDT');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const isDark = theme === 'dark';

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !txHash) return;
    setLoading(true);

    try {
      const response = await fetch('/api/process-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          asset,
          amount,
          txHash
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        alert(data.error || 'Deposit processing failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during deposit validation');
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
              onSubmit={handleDepositSubmit}
              className="space-y-4 pt-2"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-black tracking-tight ${textPrimary}`}>Secure Cryptographic Deposit</h3>
                  <p className={`text-xs ${textSecondary}`}>Credited instantly to your quantitative engine</p>
                </div>
              </div>

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
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-black'
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
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">Deposit Amount ($ Equivalent)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-[15px]" />
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full pl-9 pr-4 py-3 rounded-xl text-sm font-sans font-medium border focus:outline-none transition-all ${
                      isDark 
                        ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                    }`}
                  />
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400">On-Chain Transaction Hash (TxHash)</label>
                <input 
                  type="text"
                  required
                  placeholder="0x7a30ef18d9f1807d9f6b95c...a95ef3"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-mono border focus:outline-none transition-all ${
                    isDark 
                      ? 'bg-[#08090e]/90 border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/40' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500/40'
                  }`}
                />
                <p className="text-[9px] text-slate-500 leading-normal font-medium">
                  Transfer the funds to your unique Aver deposit address and enter the hash. The backend validates blocks and updates your balance securely.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !amount || !txHash}
                className={`w-full py-3.5 rounded-xl text-xs font-black tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                  amount && txHash && !loading
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-[0_2px_10px_rgba(16,185,129,0.3)]'
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
                    <span>Authorize Secure Deposit</span>
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
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xl font-black tracking-tight ${textPrimary}`}>Deposit Authorized</h4>
                <p className={`text-xs ${textSecondary}`}>The transaction was successfully confirmed by secure nodes</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">CREDITED AMOUNT</span>
                <span className="text-xl font-mono font-black text-emerald-400 mt-1 block">
                  +{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {asset}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs tracking-wide transition-all shadow-md cursor-pointer"
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
