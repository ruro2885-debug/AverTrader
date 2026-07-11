const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Share2, Check, Users, Gift, TrendingUp, DollarSign, ChevronRight, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ReferralCentre({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'referrals'),
          where('referrerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReferrals(refs);
      } catch (err: any) {
        if (err?.code === 'permission-denied' || (err?.message && err.message.includes('Missing or insufficient permissions'))) {
          console.warn("Referral feature is disabled: Firebase rules need to be updated by the project owner.", err.message);
        } else {
          console.error("Error fetching referrals:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user]);

  const referralLink = \`https://avernox.com/signup?ref=\${user?.referralCode || ''}\`;

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AverNoxTrader',
          text: \`Use my referral code \${user?.referralCode} to join AverNoxTrader!\`,
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const totalEarned = referrals.reduce((sum, ref) => sum + (ref.rewardAmount || 0), 0);
  const successfulReferrals = referrals.filter(ref => ref.status === 'completed').length;
  const pendingReferrals = referrals.filter(ref => ref.status === 'pending').length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={\`min-h-screen w-full \${isDark ? 'bg-[#000000] text-white' : 'bg-slate-50 text-slate-900'} font-sans pb-24\`}
    >
      <header className={\`sticky top-0 z-40 flex items-center justify-between p-5 border-b backdrop-blur-md \${isDark ? 'border-white/5 bg-[#000000]/80' : 'border-slate-200 bg-slate-50/80'}\`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={\`p-2 rounded-xl transition-colors \${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}\`}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Referral Program</h2>
        </div>
        <button onClick={handleShare} className={\`p-2 rounded-xl transition-colors \${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}\`}>
          <Share2 size={20} />
        </button>
      </header>

      {/* 1. Full-Width Gradient Hero */}
      <div className="w-full bg-gradient-to-br from-emerald-500 to-cyan-500 px-6 py-12 text-center rounded-b-[40px] shadow-2xl shadow-emerald-500/20 mb-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/10 rotate-12 blur-3xl rounded-full"></div>
        </div>

        <div className="relative z-10">
            <motion.div 
                animate={{ y: [0, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="inline-block mb-6 filter drop-shadow-xl"
            >
                <div className="w-20 h-20 bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-4xl shadow-inner">
                    🎁
                </div>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl font-black mb-4 text-black tracking-tight">Unlock the Power of Aver:<br/>Earn Together</h1>
            <p className="text-sm sm:text-base text-black/80 font-medium max-w-md mx-auto mb-8 leading-relaxed">
                Share Aver with your friends and earn generous rewards for every successful sign-up and active portfolio.
            </p>
            
            <button 
                onClick={() => copyToClipboard(referralLink)}
                className="bg-black text-emerald-400 px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:scale-105 active:scale-95 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.3)] flex items-center gap-3 mx-auto group"
            >
                {copiedCode ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} className="text-emerald-400" />}
                {copiedCode ? "Copied to Clipboard!" : "Copy Your Unique Link"}
            </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 w-full max-w-5xl mx-auto space-y-10">
        {/* 2. Stats Dashboard (Three Columns with Glassmorphism) */}
        <div className={\`flex flex-row justify-between items-stretch gap-4 p-5 rounded-3xl border \${isDark ? 'bg-white/[0.03] border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-sm'}\`}>
            
            <div className="flex-1 text-center flex flex-col justify-center">
                <span className={\`text-xs font-bold uppercase tracking-wider mb-2 \${isDark ? 'text-white/60' : 'text-slate-500'}\`}>Total Earnings</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-500">\${totalEarned.toFixed(2)}</span>
            </div>
            
            <div className={\`w-[1px] \${isDark ? 'bg-white/10' : 'bg-slate-200'}\`}></div>
            
            <div className="flex-1 text-center flex flex-col justify-center">
                <span className={\`text-xs font-bold uppercase tracking-wider mb-2 \${isDark ? 'text-white/60' : 'text-slate-500'}\`}>Referral Level</span>
                <span className="text-2xl sm:text-3xl font-black">Level 1</span>
                <div className="w-full max-w-[80px] h-1.5 bg-black/20 rounded-full mx-auto mt-3 overflow-hidden">
                    <div className="w-[20%] h-full bg-emerald-500 rounded-full"></div>
                </div>
            </div>

            <div className={\`w-[1px] \${isDark ? 'bg-white/10' : 'bg-slate-200'}\`}></div>

            <div className="flex-1 text-center flex flex-col justify-center">
                <span className={\`text-xs font-bold uppercase tracking-wider mb-2 \${isDark ? 'text-white/60' : 'text-slate-500'}\`}>Total Invites</span>
                <span className="text-2xl sm:text-3xl font-black">{referrals.length}</span>
            </div>

        </div>

        {/* 3. Empty State or History */}
        <div className="mt-8">
            {loading ? (
                <div className="text-center py-20">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-emerald-500 font-bold uppercase tracking-wider text-sm animate-pulse">Syncing Network...</p>
                </div>
            ) : referrals.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="w-32 h-32 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20"
                    >
                        <Bot size={64} className="text-emerald-500 opacity-80" />
                    </motion.div>
                    <h3 className="text-xl font-black mb-3">Your network is waiting!</h3>
                    <p className={\`text-sm max-w-xs mx-auto leading-relaxed \${isDark ? 'text-white/50' : 'text-slate-500'}\`}>
                        Invite your first friend to start earning rewards from the Aver Referral Program.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 ml-2 mb-4">Recent Activity</h3>
                    {referrals.map((ref, idx) => (
                        <div key={idx} className={\`flex items-center justify-between p-5 rounded-2xl border transition-all hover:scale-[1.01] \${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-white border-slate-200 shadow-sm'}\`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-base">Friend Joined</p>
                                    <p className="text-xs text-emerald-500 font-mono font-medium opacity-80">{new Date(ref.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={\`font-black text-lg \${ref.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}\`}>
                                    {ref.status === 'completed' ? '+$50.00' : 'Pending'}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mt-1">{ref.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </motion.div>
  );
}
`;

fs.writeFileSync('src/components/ReferralCentre.tsx', code);
