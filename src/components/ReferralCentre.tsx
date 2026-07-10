import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Share2, Check, Users, Gift, TrendingUp, Link as LinkIcon, DollarSign, Facebook, Twitter, Mail, Send, Award, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export default function ReferralCentre({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [recentReferrals, setRecentReferrals] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = user?.referralCode || '';
  const referralLink = `https://myapp.vercel.app/signup?ref=${referralCode}`;
  
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'users'), 
          where('referredBy', '==', referralCode)
        );
        const snapshot = await getDocs(q);
        const refs: UserProfile[] = [];
        snapshot.forEach((doc) => {
          refs.push(doc.data() as UserProfile);
        });
        // Sort by join date descending
        refs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setRecentReferrals(refs);
      } catch (err) {
        console.error("Error fetching referrals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [user, referralCode]);

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (e) {
      console.error("Failed to copy");
    }
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join Aver',
          text: `Check out Aver! Use my code: ${referralCode}`,
          url: referralLink,
        });
      } else {
        copyToClipboard(referralLink, 'link');
      }
    } catch (err: any) {
        // Silent failure if cancelled
    }
  };

  const openShare = (platform: string) => {
    const text = encodeURIComponent(`Check out Aver! Use my code: ${referralCode}`);
    const url = encodeURIComponent(referralLink);
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
      case 'telegram': shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
      case 'x': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'email': shareUrl = `mailto:?subject=Join Aver&body=${text} ${url}`; break;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const totalRewardsEarned = recentReferrals.length * 50; // Assume $50 per referral

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`min-h-screen w-full ${isDark ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} font-sans pb-24`}
    >
      <header className={`sticky top-0 z-30 flex items-center justify-between p-5 border-b backdrop-blur-md ${isDark ? 'border-white/5 bg-[#050505]/80' : 'border-slate-200 bg-slate-50/80'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Referral Centre</h2>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Hero Banner */}
        <div className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 ${
          isDark ? 'bg-gradient-to-br from-[#0a0f12] to-[#050505] border-emerald-500/20' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-500/20 shadow-lg'
        }`}>
          <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-4 max-w-lg">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Gift className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Rewards Program</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tighter">
              Invite Friends.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Earn Rewards.</span>
            </h1>
            <p className={`text-base font-medium leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Share your unique referral link to invite friends. Earn bonuses when they complete their first deposit.
            </p>
          </div>
          <div className="relative z-10">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 border-dashed animate-[spin_20s_linear_infinite] ${isDark ? 'border-emerald-500/20' : 'border-emerald-500/30'}`}>
              <div className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center animate-[spin_20s_linear_infinite_reverse] shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Users className="w-12 h-12 text-black" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Action Area (Left) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Referral Code Card */}
            <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-500">Your Referral Code</h3>
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-3xl font-mono font-black text-emerald-500 tracking-widest">{referralCode}</span>
                <button 
                  onClick={() => copyToClipboard(referralCode, 'code')} 
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                >
                  {copiedCode ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            {/* Referral Link Card */}
            <div className={`p-6 rounded-3xl border space-y-4 ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-500">Your Referral Link</h3>
              <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'} overflow-hidden`}>
                <span className="font-mono text-sm sm:text-base font-semibold truncate mr-4 text-emerald-400">{referralLink}</span>
                <button 
                  onClick={() => copyToClipboard(referralLink, 'link')} 
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>

              {/* Share Options */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button onClick={() => openShare('whatsapp')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#25D366]/50' : 'bg-slate-50 border-slate-200 hover:border-[#25D366]/50'} group`}>
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Send size={18} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
                </button>
                <button onClick={() => openShare('telegram')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-[#0088cc]/50' : 'bg-slate-50 border-slate-200 hover:border-[#0088cc]/50'} group`}>
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Send size={18} className="-rotate-45 ml-1 mt-1" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Telegram</span>
                </button>
                <button onClick={() => openShare('x')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/30' : 'bg-slate-50 border-slate-200 hover:border-black/30'} group`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-black'}`}>
                    <span className="font-bold font-mono">X</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">X</span>
                </button>
                <button onClick={() => openShare('email')} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-400/50' : 'bg-slate-50 border-slate-200 hover:border-blue-400/50'} group`}>
                  <div className="w-10 h-10 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Mail size={18} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
                </button>
              </div>

              <button onClick={shareNative} className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors">
                <Share2 size={18} /> Share via Device
              </button>
            </div>
          </div>

          {/* Stats & Activity (Right) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Statistics */}
            <div className={`p-6 rounded-3xl border grid grid-cols-2 gap-4 ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="col-span-2 flex items-center justify-between pb-2">
                <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-500">Statistics</h3>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider mb-1">Total Referrals</p>
                <p className="text-2xl font-black">{recentReferrals.length}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[10px] font-bold font-mono text-gray-500 uppercase tracking-wider mb-1">Successful</p>
                <p className="text-2xl font-black text-emerald-400">{recentReferrals.length}</p>
              </div>
              <div className={`col-span-2 p-4 rounded-2xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className="text-[10px] font-bold font-mono text-emerald-600 uppercase tracking-wider mb-1">Total Earnings</p>
                <p className="text-3xl font-black text-emerald-500">${totalRewardsEarned.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent Referrals List */}
            <div className={`p-6 rounded-3xl border flex flex-col h-[400px] ${isDark ? 'bg-[#0a0f12] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-gray-500 mb-4">Recent Referrals</h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-emerald-500">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <span className="text-sm font-bold font-mono uppercase tracking-wider">Loading...</span>
                  </div>
                ) : recentReferrals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm font-bold mb-1">No Referrals Yet</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Invite friends using your link to start earning rewards.</p>
                  </div>
                ) : (
                  recentReferrals.map((refUser, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <img 
                          src={refUser.profilePhotoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${refUser.username}`} 
                          alt={refUser.username} 
                          className="w-10 h-10 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-sm font-bold">{refUser.username}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{refUser.createdAt ? new Date(refUser.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                          Completed
                        </span>
                        <p className="text-xs font-bold font-mono text-emerald-400 mt-1">+$50.00</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
