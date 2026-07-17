import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ReferralCentre({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'referrals'),
          where('referrerId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setReferrals(refs);
      } catch (err: any) {
        if (err?.code === 'permission-denied') {
          console.warn("Permission denied fetching referrals. Assuming empty referral list.");
          setReferrals([]);
        } else {
          console.error("Error fetching referrals:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user]);

  const referralLink = `https://avernox.com/signup?ref=${user?.referralCode || ''}`;
  const totalEarned = referrals.reduce((sum, ref) => sum + (ref.rewardAmount || 0), 0);
  const currentLevel = Math.min(Math.floor(referrals.length / 5) + 1, 5);
  const progressToNextLevel = (referrals.length % 5) * 20;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-[#000000] text-[#ffffff] min-h-screen w-full relative z-10 font-sans m-0 p-0 box-border pb-10">
      {/* Fixed Back Button */}
      <button onClick={onBack} className="fixed z-50 top-[20px] left-[20px] p-2 rounded-xl bg-black/20 backdrop-blur-md hover:bg-black/40 text-white transition-colors border border-white/10 shadow-lg">
        <ArrowLeft size={24} />
      </button>

      {/* 1. Full-Width Gradient Hero */}
      <header className="bg-gradient-to-br from-[#00e676] to-[#00bcd4] w-full pt-[80px] pb-[60px] px-[20px] text-center rounded-b-[30px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] mb-[40px] relative">
        <motion.div 
          animate={{ y: [0, -15, 0] }} 
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
          className="inline-block mb-[20px] drop-shadow-[0_5px_10px_rgba(0,0,0,0.2)]"
        >
          <div className="text-6xl">🎁</div>
        </motion.div>
        <h1 className="text-[32px] font-bold mb-[15px] text-[#000000]">Unlock the Power of Aver: Earn Together</h1>
        <p className="text-[16px] opacity-90 mb-[25px] max-w-[400px] mx-auto text-[#000000]">
          Share Aver with your friends and earn generous rewards for every successful sign-up.
        </p>
        <button 
          onClick={copyToClipboard} 
          className="bg-[#000000] text-[#00e676] py-[15px] px-[40px] rounded-[50px] font-semibold text-[16px] border-none cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_5px_15px_rgba(0,230,118,0.3)]"
        >
          {copied ? "Link Copied!" : "Copy Your Unique Referral Link"}
        </button>
      </header>

      {/* 1.5 Referral Code Section */}
      <section className="flex flex-col items-center justify-center p-6 mx-auto mb-[30px] max-w-[90%] md:max-w-[400px] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px]">
        <span className="text-[12px] text-white/60 mb-[12px] uppercase font-bold tracking-wider">Your Referral Code</span>
        <div className="flex items-center gap-4 bg-black/30 py-3 px-6 rounded-xl border border-dashed border-[#00e676]/50">
          <span className="text-[24px] font-mono font-bold text-[#00e676] tracking-widest">{user?.referralCode}</span>
          <button 
            onClick={copyCodeToClipboard} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            {copiedCode ? <Check size={20} className="text-[#00e676]" /> : <Copy size={20} className="text-white" />}
          </button>
        </div>
      </section>

      {/* 2. Stats Dashboard (Three Columns) */}
      <section className="flex justify-around w-[90%] mx-auto mb-[50px] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-[20px]">
        <div className="text-center flex-1 p-[10px]">
            <span className="text-[12px] text-white/60 mb-[8px] block">Total Earnings</span>
            <span className="text-[20px] font-bold text-[#ffffff]">${totalEarned.toFixed(2)}</span>
        </div>
        <div className="text-center flex-1 p-[10px]">
            <span className="text-[12px] text-white/60 mb-[8px] block">Referral Level</span>
            <span className="text-[20px] font-bold text-[#ffffff]">Level {currentLevel}</span>
            {/* Optional Progress Bar */}
            <div className="h-[4px] bg-[#333333] rounded-[2px] mt-[5px] w-full max-w-[100px] mx-auto overflow-hidden">
                <div className="h-full bg-[#00e676] rounded-[2px]" style={{ width: `${progressToNextLevel}%` }} />
            </div>
        </div>
        <div className="text-center flex-1 p-[10px]">
            <span className="text-[12px] text-white/60 mb-[8px] block">Total Referrals</span>
            <span className="text-[20px] font-bold text-[#ffffff]">{referrals.length}</span>
        </div>
      </section>

      {/* 3. Empty Referral History State / Existing Referrals */}
      <section className="text-center py-[40px] px-[20px] mt-[40px]">
        {loading ? (
            <div className="w-10 h-10 border-4 border-[#00e676] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        ) : referrals.length === 0 ? (
            <>
                <div className="text-[64px] mb-[20px] opacity-80 inline-block">🤖</div>
                <p className="text-[14px] text-white/50 max-w-[250px] mx-auto">
                    Your network is waiting! Invite your first friend to start earning rewards from the Aver Referral Program.
                </p>
            </>
        ) : (
            <div className="space-y-4 max-w-2xl mx-auto text-left px-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 ml-2 mb-4">Recent Activity</h3>
                {referrals.map((ref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 rounded-2xl border bg-white/[0.03] border-white/10 backdrop-blur-sm transition-transform hover:scale-[1.01]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00e676]/20 to-[#00bcd4]/20 flex items-center justify-center text-[#00e676] border border-[#00e676]/20">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-white">Friend Joined</p>
                                <p className="text-xs text-white/60 font-mono">
                                  {ref.createdAt?.seconds ? new Date(ref.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <p className="font-black text-[#00e676]">+$50.00</p>
                    </div>
                ))}
            </div>
        )}
      </section>
    </div>
  );
}
