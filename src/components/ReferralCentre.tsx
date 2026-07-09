import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Share2, Check, History, Users, Gift } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ReferralCentre({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);

  const referralCode = user?.referralCode || 'AVER7XK92';
  const referralLink = `https://aver.app/?ref=${referralCode}`;
  
  const stats = user?.referralStats || {
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0
  };

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareReferral = async () => {
    try {
      await navigator.share({
        title: 'Join Aver',
        text: `Check out Aver! Use my code: ${referralCode}`,
        url: referralLink,
      });
    } catch (err: any) {
        // Silent failure if cancelled
    }
  };

  const cardClass = `p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`;

  return (
    <div className={`min-h-screen w-full ${isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <header className="flex items-center justify-between p-5 border-b border-white/5">
        <button onClick={onBack} className="flex items-center gap-2 hover:opacity-70"><ArrowLeft size={24} /> Back</button>
        <h2 className="text-lg font-bold">Referral Centre</h2>
        <button onClick={() => activityRef.current?.scrollIntoView({ behavior: 'smooth' })} className="p-2 rounded-full hover:bg-white/10"><History size={24} /></button>
      </header>

      <div className="p-5 space-y-6">
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
          <h1 className="text-2xl font-bold mb-1">Invite Friends</h1>
          <p className="text-gray-400 mb-6 text-sm">Share your referral link and track your invitations.</p>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                <span className="text-2xl font-mono font-bold text-emerald-400">{referralCode}</span>
                <button onClick={() => copyToClipboard(referralCode, 'code')} className="flex items-center gap-2 font-bold text-sm bg-white/10 px-4 py-2 rounded-full">
                    {copiedCode ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>} {copiedCode ? 'Copied' : 'Copy'}
                </button>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">Referral Link</p>
            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
              <span className="font-mono text-sm truncate">{referralLink}</span>
              <button onClick={() => copyToClipboard(referralLink, 'link')} className="flex items-center gap-2 font-bold text-sm bg-white/10 px-4 py-2 rounded-full">
                    {copiedLink ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>} {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <button onClick={shareReferral} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold flex items-center justify-center gap-2"><Share2 size={18} /> Share Referral</button>
        </motion.div>

        {/* Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
            {[
                { label: 'Total Referrals', value: stats.totalReferrals },
                { label: 'Successful', value: stats.successfulReferrals },
                { label: 'Pending', value: stats.pendingReferrals },
                { label: 'Total Rewards', value: `${stats.totalRewardsEarned}` },
            ].map((stat, i) => (
                <div key={i} className={cardClass}>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
            ))}
        </motion.div>

        {/* Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardClass} ref={activityRef}>
          <h3 className="text-lg font-bold mb-4">Referral Activity</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={64} className="text-gray-600 mb-4" />
            <p className="text-sm text-gray-400">No referral activity yet.<br />Invite your friends to get started.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

