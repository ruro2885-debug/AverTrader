import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, Edit3, Key, ShieldCheck, 
  Bell, Share2, Wallet, Settings, HelpCircle, 
  FileText, LogOut, ChevronRight, Award, Copy, CheckCircle2
} from 'lucide-react';
import KycPanel from './KycPanel';

export default function ProfileView({ theme }: { theme: 'light' | 'dark' }) {
  const { user, signOutUser, updateProfilePhoto } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('Image too large. Please upload an image under 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateProfilePhoto(reader.result);
        }
      };
      reader.onerror = () => {
        alert('Failed to upload image.');
      };
      reader.readAsDataURL(file);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      alert('Referral code copied to clipboard!');
    }
  };
  
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50";
    
  const itemHover = isDark ? "hover:bg-white/5" : "hover:bg-slate-50";

  const menuSections = [
    {
      title: 'Account Settings',
      items: [
        { icon: Edit3, label: 'Edit Profile Name', id: 'edit' },
        { icon: Key, label: 'Change Password', id: 'password' },
        { icon: ShieldCheck, label: 'Two-Factor Authentication', id: '2fa' },
        { icon: Bell, label: 'Notification Settings', id: 'notifications' },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { icon: Settings, label: 'Preferences', id: 'preferences' },
        { icon: HelpCircle, label: 'Help & Support', id: 'support' },
        { icon: FileText, label: 'Privacy Policy & Terms', id: 'terms' },
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-6"
    >
      {/* Profile Card */}
      <div className={`rounded-[24px] p-6 ${cardClasses} flex flex-col items-center text-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        {/* Profile Avatar Selection */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 mb-4 relative group shadow-lg">
          <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-black rounded-full hover:scale-110 transition-transform shadow-lg cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <h2 className={`text-2xl font-black tracking-tight mb-0.5 ${textPrimary}`}>
          {user?.displayName || 'Aver Trader'}
        </h2>
        <p className={`text-xs font-mono text-slate-500`}>
          @{user?.displayName?.toLowerCase().replace(/\s+/g, '') || user?.email?.split('@')[0] || 'user'}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 w-full mt-3">
          <div className={`flex items-center text-xs ${textSecondary} font-medium`}>
            <Mail className="w-4 h-4 mr-2 opacity-70 text-emerald-500" />
            {user?.email || 'user@example.com'}
          </div>
          <div className={`flex items-center text-xs ${textSecondary} font-medium`}>
            <Award className="w-4 h-4 mr-2 opacity-70 text-amber-500" />
            Plan: <span className="text-emerald-500 font-extrabold ml-1 uppercase">{user?.subscriptionPlan || 'Free'}</span>
          </div>
        </div>
      </div>

      {/* Referral Program Panel */}
      <div className={`rounded-[24px] p-6 ${cardClasses} space-y-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-[35px] rounded-full pointer-events-none" />
        <div className="flex items-center space-x-2 text-teal-400">
          <Share2 className="w-5 h-5" />
          <h4 className={`text-base font-black tracking-tight ${textPrimary}`}>Partner Referral Program</h4>
        </div>
        <p className={`text-xs leading-relaxed ${textSecondary}`}>
          Earn massive commissions and lifetime loyalty yield. Invite colleagues to copy-trade or build trading algorithms under your master referral loop.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Code */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block">YOUR PARTNER CODE</span>
              <span className={`text-sm font-mono font-black ${textPrimary} mt-1 block`}>{user?.referralCode || 'AVR-XXXXXX'}</span>
            </div>
            <button 
              onClick={copyReferralCode}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Rewards */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 block">TOTAL COMMISSIONS</span>
              <span className="text-sm font-sans font-black text-emerald-400 mt-1 block">
                ${(user?.referralRewards || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* KYC Compliance Uploader */}
      <KycPanel theme={theme} />

      {/* Settings Menu Categories */}
      <div className="space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <h3 className={`text-xs font-bold ml-4 mb-3 uppercase tracking-wider font-mono ${textSecondary}`}>
              {section.title}
            </h3>
            <div className={`rounded-[24px] overflow-hidden ${cardClasses}`}>
              {section.items.map((item, i) => (
                <button 
                  key={item.id} 
                  onClick={() => item.id === 'edit' ? fileInputRef.current?.click() : null}
                  className={`w-full flex items-center justify-between p-4 transition-colors cursor-pointer ${itemHover} ${
                    i !== section.items.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-slate-100') : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className={`font-bold text-xs ${textPrimary}`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Log Out button */}
      <div className={`rounded-[24px] overflow-hidden ${cardClasses} mt-8`}>
        <button 
          onClick={signOutUser}
          className={`w-full flex items-center justify-between p-4 transition-colors ${
            isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
          }`}
        >
          <div className="flex items-center space-x-4 text-red-500">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-red-500/10' : 'bg-red-100'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-black text-xs">Log Out</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
