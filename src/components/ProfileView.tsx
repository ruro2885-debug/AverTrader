import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Mail, Edit3, Key, ShieldCheck, 
  Bell, Share2, Wallet, Settings, HelpCircle, 
  FileText, LogOut, ChevronRight
} from 'lucide-react';

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
        { icon: Edit3, label: 'Edit Profile', id: 'edit' },
        { icon: Key, label: 'Change Password', id: 'password' },
        { icon: ShieldCheck, label: 'Two-Factor Authentication', id: '2fa' },
        { icon: Bell, label: 'Notification Settings', id: 'notifications' },
      ]
    },
    {
      title: 'Network & Assets',
      items: [
        { icon: Share2, label: 'Referral Program', id: 'referral' },
        { icon: Wallet, label: 'Linked Crypto Wallets', id: 'wallets' },
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
      <div className={`rounded-[24px] p-6 ${cardClasses} flex flex-col items-center text-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 mb-4 relative group">
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
        
        <h2 className={`text-2xl font-bold tracking-tight mb-1 ${textPrimary}`}>
          @{user?.displayName?.toLowerCase().replace(/\s+/g, '') || user?.email?.split('@')[0] || 'user'}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 w-full mt-2">
          <div className={`flex items-center text-sm ${textSecondary}`}>
            <Mail className="w-4 h-4 mr-2 opacity-70" />
            {user?.email || 'user@example.com'}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <h3 className={`text-sm font-bold ml-4 mb-3 uppercase tracking-wider ${textSecondary}`}>
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
                    <span className={`font-medium text-sm ${textPrimary}`}>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

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
            <span className="font-bold text-sm">Log Out</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
