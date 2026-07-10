import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Share2, Check, Users, Gift, TrendingUp, DollarSign, Calendar, ChevronDown, Award, HelpCircle } from 'lucide-react';
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
      } catch (err) {
        console.error("Error fetching referrals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user]);

  const referralLink = `https://avernox.com/signup?ref=${user?.referralCode || ''}`;

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
          text: `Use my referral code ${user?.referralCode} to join AverNoxTrader!`,
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
      className={`min-h-screen w-full ${isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} font-sans pb-24`}
    >
      <header className={`sticky top-0 z-30 flex items-center justify-between p-5 border-b backdrop-blur-md ${isDark ? 'border-white/5 bg-[#050505]/80' : 'border-slate-200 bg-slate-50/80'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Referral Program</h2>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Hero Card */}
        <div className={`p-8 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black`}>
          <h1 className="text-3xl font-black mb-2">Referral Program</h1>
          <p className="font-medium opacity-90 mb-6">Earn rewards by inviting friends to join AverNoxTrader.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/10 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-bold opacity-70 uppercase">Total Earnings</p>
                <p className="text-2xl font-black">${totalEarned.toFixed(2)}</p>
            </div>
            <div className="bg-black/10 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-bold opacity-70 uppercase">Referral Level</p>
                <p className="text-2xl font-black">Level 1</p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Earnings', value: `$${totalEarned.toFixed(2)}`, icon: DollarSign },
            { label: 'Successful Referrals', value: successfulReferrals.toString(), icon: Users },
            { label: 'Pending Rewards', value: `$${(pendingReferrals * 50).toFixed(2)}`, icon: Gift },
            { label: 'Total Invites', value: referrals.length.toString(), icon: TrendingUp },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-bold font-mono text-gray-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Referral Link Card */}
        <div className={`p-8 rounded-3xl border ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="text-sm font-bold font-mono text-gray-500 uppercase tracking-wider mb-4">Referral Details</h3>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1">Your Code</p>
                    <div className="bg-black/5 p-4 rounded-xl font-mono font-bold text-xl text-emerald-500 mb-4">{user?.referralCode}</div>
                    <p className="text-xs font-bold text-gray-500 mb-1">Your Link</p>
                    <div className="bg-black/5 p-4 rounded-xl font-mono text-sm truncate mb-4">https://avernox.com/signup?ref={user?.referralCode}</div>
                    <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(user?.referralCode || '')} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold flex items-center justify-center gap-2">
                            {copiedCode ? <Check size={18}/> : <Copy size={18}/>} Copy
                        </button>
                        <button onClick={handleShare} className="px-4 py-3 rounded-xl bg-emerald-500 text-black font-bold flex items-center justify-center gap-2">
                            <Share2 size={18}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* History */}
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-500 mb-6">Referral History</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 font-bold font-mono uppercase tracking-wider text-emerald-500 animate-pulse">Loading...</div>
            ) : referrals.length === 0 ? (
                <div className="text-center py-10">
                    <Users size={48} className="mx-auto text-gray-400 mb-4"/>
                    <p className="text-gray-500 font-medium">No referrals yet.</p>
                    <button className="mt-4 px-6 py-3 rounded-xl bg-emerald-500 text-black font-bold">Invite Friends</button>
                </div>
            ) : (
              referrals.map((ref, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="font-bold">Referral #{ref.referredId.substring(0, 5)}</p>
                      <p className="text-xs text-gray-500 font-mono">{new Date(ref.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${ref.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{ref.status}</p>
                    <p className="font-bold font-mono">+$ {ref.rewardAmount.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
