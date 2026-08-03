import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Lock, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ReferralCenter({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  
  const referredUsersList = Array.isArray((user as any)?.referredUsers) ? (user as any).referredUsers : [];

  const referralCode = user?.referralCode || (user?.uid ? `AVR-${user.uid.slice(0, 6).toUpperCase()}` : 'AVR-29VXT');
  const referralLink = (user as any)?.referralLink || `https://aver.app/ref/${referralCode}`;
  const totalReferralEarnings = (user as any)?.totalReferralEarnings ?? (user as any)?.referralEarnings ?? 0;
  const totalReferrals = (user as any)?.totalReferrals ?? user?.referralCount ?? 0;
  const referralLevel = (user as any)?.referralLevel ?? Math.floor(totalReferrals / 5) + 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-black text-white flex flex-col relative overflow-y-auto overflow-x-hidden"
    >
      {/* Fixed Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 z-50 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 cursor-pointer shadow-xl transition-all"
        title="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* 1. Hero Section - Full Width Gradient */}
      <section className="relative w-full bg-gradient-to-br from-[#00e676] to-[#00bcd4] pt-16 pb-20 px-6 rounded-b-[48px] shadow-2xl shadow-emerald-500/10 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center">
            {/* Floating Animation */}
            <motion.div 
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-8xl mb-8 drop-shadow-2xl filter brightness-110"
            >
              🎁
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-6 leading-[1.1]">
              Unlock the Power of Aver:<br />Earn Together
            </h1>
            
            <p className="text-black/80 font-bold text-lg max-w-lg mb-10 leading-relaxed">
              Share Aver with your friends and earn generous rewards for every successful sign-up.
            </p>

            <button 
              onClick={handleCopy}
              className="bg-black text-[#00e676] px-10 py-5 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/40 flex items-center gap-3 cursor-pointer group"
            >
              <Copy className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {copied ? 'Copied Link!' : 'Copy Your Unique Referral Link'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Stats Dashboard - Glassmorphism */}
      <section className="px-6 -mt-10 relative z-30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-2 p-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Total Earnings</span>
              <span className="text-3xl font-black text-white">${totalReferralEarnings.toFixed(2)}</span>
              <div className="flex items-center gap-1.5 text-[#00e676] text-[10px] font-black uppercase">
                <Zap className="w-3 h-3 fill-[#00e676]" /> Active Program
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 p-4 border-y md:border-y-0 md:border-x border-white/5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Referral Level</span>
              <span className="text-3xl font-black text-white">Level {referralLevel}</span>
              {/* Progress Bar */}
              <div className="w-32 h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (totalReferrals % 5) * 20)}%` }}
                  className="h-full bg-[#00e676] rounded-full"
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-2 p-4">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Total Referrals</span>
              <span className="text-3xl font-black text-white">{totalReferrals}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Friends</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Your Referral Code Display */}
      <section className="px-6 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[24px] space-y-4 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Personal Invitation Code</h3>
            <div 
              onClick={handleCopy}
              className="flex items-center justify-between bg-black/50 border border-dashed border-[#00e676]/30 px-6 py-4 rounded-2xl group cursor-pointer hover:bg-[#00e676]/5 transition-all"
            >
              <span className="text-2xl font-black font-mono text-white tracking-widest">{referralCode}</span>
              <div className="p-2 rounded-xl bg-white/5 group-hover:bg-[#00e676] group-hover:text-black transition-all">
                <Copy className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Referred Users List */}
      <section className="flex-1 px-6 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] text-center mb-6">
            Your Network
          </h3>
          
          {referredUsersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
              <motion.div 
                animate={{ 
                  y: [0, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-8xl drop-shadow-[0_0_30px_rgba(0,230,118,0.1)]"
              >
                🤖
              </motion.div>
              
              <div className="space-y-2 text-center">
                <h4 className="text-xl font-black text-white">Your network is waiting!</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed px-8">
                  Invite your first friend to start earning rewards from the Aver Referral Program.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {referredUsersList.slice(0, showAllReferrals ? undefined : 3).map((refUser: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00e676]/20 to-[#00bcd4]/20 border border-[#00e676]/30 flex items-center justify-center overflow-hidden">
                    {refUser.photoURL || refUser.avatar ? (
                      <img src={refUser.photoURL || refUser.avatar} alt={refUser.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#00e676] font-bold text-lg">
                        {(refUser.name || refUser.displayName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">
                      {refUser.name || refUser.displayName || 'Anonymous User'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {refUser.joinedAt ? new Date(refUser.joinedAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>
              ))}
              
              {!showAllReferrals && referredUsersList.length > 3 && (
                <button
                  onClick={() => setShowAllReferrals(true)}
                  className="w-full py-4 mt-2 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Show More ({referredUsersList.length - 3})
                </button>
              )}
            </div>
          )}
        </div>
      </section>

    </motion.div>
  );
}
