import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { 
  User, Mail, Edit3, Key, ShieldCheck, 
  Bell, Share2, Wallet, Settings, HelpCircle, 
  FileText, LogOut, ChevronRight, Camera, X, Check, Copy, AlertTriangle, Medal
} from 'lucide-react';

export default function ProfileView({ theme, onOpenBonusCenter }: { theme: 'light' | 'dark', onOpenBonusCenter?: () => void }) {
  const { 
    user, 
    signOutUser, 
    updateProfilePhoto,
    updateProfile,
    changePassword,
    updateUserPreferences,
    addNotification,
    verifyCurrentPassword,
    hashPassword
  } = useAuth();
  const { preferences, updatePreference } = usePreferences();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  // Modal states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Form States
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password interactive states
  const [shakeCurrentPassword, setShakeCurrentPassword] = useState(false);
  const [currentPasswordIncorrect, setCurrentPasswordIncorrect] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [simulatedEmailToast, setSimulatedEmailToast] = useState<{ show: boolean; email: string; subject: string; body: string } | null>(null);

  const closeModal = () => {
    setActiveModal(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordIncorrect(false);
    setShakeCurrentPassword(false);
    setIsUpdatingPassword(false);
    setPasswordUpdateSuccess(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50";
  const modalBgClasses = isDark
    ? "bg-[#0b0f19] border border-white/10 shadow-2xl text-white"
    : "bg-white border border-slate-200 shadow-2xl text-slate-950";
  const itemHover = isDark ? "hover:bg-white/5" : "hover:bg-slate-50";

  const resizeImage = (dataUrl: string, maxWidth = 450, maxHeight = 450): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  };

  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size exceeds the 5 MB limit.");
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
      
      const isAllowed = allowedTypes.includes(file.type) || allowedExts.includes(fileExt);
      
      if (!isAllowed) {
        setErrorMsg("Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP.");
        return;
      }
      
      // Update preview immediately via global auth context (under 1ms response time!)
      const previewUrl = URL.createObjectURL(file);
      updateProfilePhoto(previewUrl);
      setIsPhotoLoading(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            const resized = await resizeImage(reader.result, 800, 800);
            await updateProfilePhoto(resized); // Await the persistence operation
            setIsPhotoLoading(false); // Hide spinner
            setErrorMsg('');
            if (addNotification) {
              addNotification( // Do not await
                'account',
                'medium',
                'Profile Picture Updated',
                'Your new profile picture was successfully uploaded and is now active.'
              );
            }
          } catch (err) {
            await updateProfilePhoto(reader.result);
            setIsPhotoLoading(false);
            setErrorMsg('');
          }
        }
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read image file.");
        setIsPhotoLoading(false);
      };
      reader.readAsDataURL(file);

      // Reset file input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!username.trim() || !email.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    try {
      await updateProfile(displayName.trim() || user?.displayName || '', username.trim().toLowerCase().replace(/\s+/g, ''), email.trim());
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setActiveModal(null), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  const ruleLength = newPassword.length >= 8;
  const ruleUppercase = /[A-Z]/.test(newPassword);
  const ruleLowercase = /[a-z]/.test(newPassword);
  const ruleNumber = /[0-9]/.test(newPassword);
  const ruleSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const allRulesSatisfied = ruleLength && ruleUppercase && ruleLowercase && ruleNumber && ruleSpecial;

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setCurrentPasswordIncorrect(false);

    if (!navigator.onLine) {
      setErrorMsg("Unable to update password. Please check your connection.");
      return;
    }

    if (!currentPassword) {
      setErrorMsg('Current password is required.');
      setCurrentPasswordIncorrect(true);
      setShakeCurrentPassword(true);
      setTimeout(() => setShakeCurrentPassword(false), 500);
      return;
    }

    const isCurrentPasswordCorrect = await verifyCurrentPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      setCurrentPasswordIncorrect(true);
      setShakeCurrentPassword(true);
      setTimeout(() => setShakeCurrentPassword(false), 500);
      setErrorMsg('Current password is incorrect.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (!allRulesSatisfied) {
      setErrorMsg('New password does not meet security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!navigator.onLine) {
            reject(new Error("Unable to update password. Please check your connection."));
          } else {
            resolve(true);
          }
        }, 1100);
      });

      await changePassword(newPassword);

      const userEmail = user?.email || 'user@example.com';
      const userName = user?.displayName || user?.username || 'Trader';
      const emailSubject = "Password Changed Successfully";
      const emailBody = `Hello ${userName},\n\nYour account password was successfully changed.\n\nIf this wasn’t you, please secure your account immediately.`;

      setSimulatedEmailToast({
        show: true,
        email: userEmail,
        subject: emailSubject,
        body: emailBody
      });

      setPasswordUpdateSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to update password. Please check your connection.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (twoFactorCode !== '123456') {
      setErrorMsg('Invalid verification code. Enter "123456" for testing.');
      return;
    }
    try {
      const targetState = !user?.preferences?.twoFactorEnabled;
      await updateUserPreferences({ twoFactorEnabled: targetState });
      setSuccessMsg(targetState ? '2FA Enabled Successfully!' : '2FA Disabled.');
      setTwoFactorCode('');
      setTimeout(() => setActiveModal(null), 1200);
    } catch (err: any) {
      setErrorMsg('Failed to update 2FA configuration.');
    }
  };

  const handleConnectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!walletAddress.startsWith('0x') && walletAddress.length < 30) {
      setErrorMsg('Please enter a valid Ethereum or Solana wallet address.');
      return;
    }
    try {
      setSuccessMsg('Wallet connected successfully!');
      if (addNotification) {
        await addNotification(
          'security',
          'high',
          'Cryptocurrency Wallet Linked',
          `Your wallet address (${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}) has been securely linked to your portfolio.`
        );
      }
      setWalletAddress('');
      setTimeout(() => setActiveModal(null), 1200);
    } catch (err) {
      setErrorMsg('Failed to link wallet.');
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode || 'AVER-7788-X9');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuSections = [
    {
      title: 'Account Settings',
      items: [
        { icon: Edit3, label: 'Edit Profile', id: 'edit' },
        { icon: Key, label: 'Change Password', id: 'password' },
        { icon: ShieldCheck, label: `Two-Factor Auth (${user?.preferences?.twoFactorEnabled ? 'On' : 'Off'})`, id: '2fa' },
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
      {/* Header Profile Info */}
      <div className={`rounded-[24px] p-6 ${cardClasses} flex flex-col items-center text-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 mb-4 relative group">
          <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center relative ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
            {isPhotoLoading && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center space-y-1 backdrop-blur-[1px]">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider">Saving</span>
              </div>
            )}
          </div>
          
          {/* Enhanced Camera Button */}
          <button 
            disabled={isPhotoLoading}
            onClick={() => fileInputRef.current?.click()}
            className={`absolute -bottom-1 -right-1 p-2 bg-emerald-500 text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer z-10 group/cam ${isPhotoLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className="w-4 h-4" />
            
            {!isPhotoLoading && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] font-bold rounded opacity-0 group-hover/cam:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                Change Photo
              </div>
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        {errorMsg && !activeModal && (
          <div className="mb-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl max-w-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-white/5 rounded-lg ml-2 cursor-pointer text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        <h2 className={`text-2xl font-bold tracking-tight mb-1 ${textPrimary}`}>
          @{user?.username || user?.email?.split('@')[0] || 'user'}
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 w-full mt-2">
          <div className={`flex items-center text-sm ${textSecondary}`}>
            <Mail className="w-4 h-4 mr-2 opacity-70" />
            {user?.email || 'user@example.com'}
          </div>
        </div>

        {/* Membership Tier Badge */}
        <div className="mt-4 flex justify-center">
          <button 
            onClick={onOpenBonusCenter}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#cd7f32]/30 bg-gradient-to-r from-[#cd7f32]/20 to-[#cd7f32]/5 hover:from-[#cd7f32]/30 hover:to-[#cd7f32]/10 transition-colors shadow-[0_0_15px_rgba(205,127,50,0.15)] cursor-pointer backdrop-blur-sm"
          >
            <span className="text-lg">🥉</span>
            <span className="text-xs font-bold text-[#e6a865] uppercase tracking-wider">Bronze Member</span>
          </button>
        </div>
      </div>

      {/* Settings Menu List */}
      <div className="space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <h3 className={`text-xs font-bold ml-4 mb-3 uppercase tracking-wider text-gray-500`}>
              {section.title}
            </h3>
            <div className={`rounded-[24px] overflow-hidden ${cardClasses}`}>
              {section.items.map((item, i) => (
                <button 
                  key={item.id} 
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setActiveModal(item.id);
                  }}
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

      {/* Log Out button */}
      <div className={`rounded-[24px] overflow-hidden ${cardClasses} mt-8`}>
        <button 
          onClick={signOutUser}
          className={`w-full flex items-center justify-between p-4 transition-colors ${
            isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
          }`}
        >
          <div className="flex items-center space-x-4 text-rose-500">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-rose-500/10' : 'bg-rose-100'
            }`}>
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Log Out</span>
          </div>
        </button>
      </div>

      {/* Interactive Modals Backdrop */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-[28px] p-6 max-h-[85vh] overflow-y-auto flex flex-col ${modalBgClasses}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black tracking-tight flex items-center">
                  {activeModal === 'edit' && <Edit3 className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === 'password' && <Key className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === '2fa' && <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === 'referral' && <Share2 className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === 'wallets' && <Wallet className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === 'notifications' && <Bell className="w-5 h-5 mr-2 text-emerald-500" />}
                  {activeModal === 'preferences' && <Settings className="w-5 h-5 mr-2 text-emerald-500" />}
                  
                  {activeModal === 'edit' && 'Edit Profile'}
                  {activeModal === 'password' && 'Change Password'}
                  {activeModal === '2fa' && 'Two-Factor Auth'}
                  {activeModal === 'referral' && 'Referral Program'}
                  {activeModal === 'wallets' && 'Linked Crypto Wallets'}
                  {activeModal === 'notifications' && 'Notification Toggles'}
                  {activeModal === 'preferences' && 'User Preferences'}
                </h3>
                <button 
                  onClick={closeModal} 
                  className={`p-1.5 rounded-full ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl flex items-start">
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-xl flex items-start">
                  <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Edit Profile Modal Content */}
              {activeModal === 'edit' && (
                <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 font-bold">@</span>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full pl-8 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                        isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl mt-6 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer"
                  >
                    Save Profile Changes
                  </button>
                </form>
              )}

              {/* Change Password Content */}
              {activeModal === 'password' && (
                passwordUpdateSuccess ? (
                  <div className="text-center py-6 space-y-5">
                    <div className="flex justify-center">
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20"
                      >
                        <Check className="w-8 h-8" />
                      </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold tracking-tight text-white flex items-center justify-center space-x-1.5">
                        <span>✅</span>
                        <span>Password Updated Successfully</span>
                      </h4>
                      <p className={`text-xs leading-relaxed ${textSecondary}`}>
                        Your account password has been changed successfully.
                      </p>
                    </div>
                    <button 
                      onClick={closeModal}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Current Password</label>
                      <motion.input 
                        type="password" 
                        placeholder="••••••••"
                        value={currentPassword} 
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          setCurrentPasswordIncorrect(false);
                          setErrorMsg('');
                        }}
                        animate={shakeCurrentPassword ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
                        } ${
                          currentPasswordIncorrect 
                            ? 'border-rose-500 ring-2 ring-rose-500/20' 
                            : isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      />
                      {currentPasswordIncorrect && (
                        <p className="text-rose-400 text-[11px] font-semibold mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Current password is incorrect.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={newPassword} 
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrorMsg('');
                        }}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
                        } ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                      />
                      
                      {/* Live Password Rules Checklist */}
                      <div className={`mt-2.5 space-y-1.5 p-3 rounded-xl border text-xs ${
                        isDark ? 'bg-slate-950/50 border-white/5' : 'bg-slate-100/50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Check className={`w-3.5 h-3.5 transition-colors ${ruleLength ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span className={ruleLength ? 'text-emerald-400 font-medium' : 'text-gray-400'}>✓ 8+ characters</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className={`w-3.5 h-3.5 transition-colors ${ruleUppercase ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span className={ruleUppercase ? 'text-emerald-400 font-medium' : 'text-gray-400'}>✓ Uppercase letter</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className={`w-3.5 h-3.5 transition-colors ${ruleLowercase ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span className={ruleLowercase ? 'text-emerald-400 font-medium' : 'text-gray-400'}>✓ Lowercase letter</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className={`w-3.5 h-3.5 transition-colors ${ruleNumber ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span className={ruleNumber ? 'text-emerald-400 font-medium' : 'text-gray-400'}>✓ Number</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className={`w-3.5 h-3.5 transition-colors ${ruleSpecial ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span className={ruleSpecial ? 'text-emerald-400 font-medium' : 'text-gray-400'}>✓ Special character</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Confirm New Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={confirmPassword} 
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrorMsg('');
                        }}
                        className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
                        } ${
                          confirmPassword && confirmPassword !== newPassword 
                            ? 'border-rose-500 ring-2 ring-rose-500/20' 
                            : isDark ? 'border-white/10' : 'border-slate-200'
                        }`}
                      />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-rose-400 text-[11px] font-semibold mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Passwords do not match.
                        </p>
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={isUpdatingPassword || !currentPassword || !allRulesSatisfied || newPassword !== confirmPassword}
                      className={`w-full py-3 font-bold rounded-xl mt-6 transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                        isUpdatingPassword || !currentPassword || !allRulesSatisfied || newPassword !== confirmPassword
                          ? 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-50 border border-white/5'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/15'
                      }`}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Saving Securely...</span>
                        </>
                      ) : (
                        <span>Update Secure Password</span>
                      )}
                    </button>
                  </form>
                )
              )}

              {/* Two-Factor Auth Configuration */}
              {activeModal === '2fa' && (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`p-4 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <ShieldCheck className="w-10 h-10" />
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${textSecondary}`}>
                    Two-Factor Authentication adds an extra layer of protection by requiring a security code on logins.
                  </p>
                  
                  <div className={`p-4 rounded-2xl border text-left ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Aver 2FA Backup Key</p>
                    <div className="flex justify-between items-center bg-black/10 px-3 py-2 rounded-lg border border-white/5">
                      <span className="font-mono text-xs font-bold text-emerald-400">AV7X-98PQ-LK52-MS90</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText("AV7X-98PQ-LK52-MS90");
                        alert('Backup key copied to clipboard.');
                      }} className="text-gray-400 hover:text-white cursor-pointer"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <form onSubmit={handleToggle2FA} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Verification Code</label>
                      <input 
                        type="text" 
                        placeholder="Enter 123456 to verify"
                        maxLength={6}
                        value={twoFactorCode} 
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className={`w-full text-center tracking-widest font-mono font-bold text-lg px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <button 
                      type="submit"
                      className={`w-full py-3 font-bold rounded-xl mt-4 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer ${
                        preferences.twoFactorEnabled 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-emerald-500 text-black'
                      }`}
                    >
                      {preferences.twoFactorEnabled ? 'Deactivate 2FA Security' : 'Activate 2FA Security'}
                    </button>
                  </form>
                </div>
              )}

              {/* Referral Program */}
              {activeModal === 'referral' && (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`p-4 rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Share2 className="w-10 h-10" />
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${textSecondary}`}>
                    Invite your friends and earn 10% of their staking and AI trading optimizer fees forever.
                  </p>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-lg font-black text-emerald-500">3</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Invites Joined</p>
                    </div>
                    <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-lg font-black text-emerald-500">$75.00</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Total Earned</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border text-left ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Referral Code</p>
                    <div className="flex justify-between items-center bg-black/10 px-3 py-2.5 rounded-xl border border-white/5">
                      <span className="font-mono text-sm font-bold text-emerald-400">{user?.referralCode || 'AVER-7788-X9'}</span>
                      <button 
                        onClick={handleCopyReferral} 
                        className={`flex items-center space-x-1 text-xs font-bold font-mono uppercase tracking-wider px-2 py-1 rounded-md transition-all ${
                          copied ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Crypto Wallets */}
              {activeModal === 'wallets' && (
                <div className="space-y-4">
                  <p className={`text-xs leading-relaxed text-center ${textSecondary}`}>
                    Connect external Web3 wallet addresses to synchronize token balances and secure transaction histories.
                  </p>

                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/10'}`}>
                    <p className={`text-xs font-bold flex items-center ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Multichain Support
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                      We support MetaMask, WalletConnect, Phantom, and Ledger secure addresses on Ethereum, Solana, and BSC networks.
                    </p>
                  </div>

                  <form onSubmit={handleConnectWallet} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Wallet Public Key Address</label>
                      <input 
                        type="text" 
                        placeholder="0x... or Solana Key Address"
                        value={walletAddress} 
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl mt-4 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer"
                    >
                      Establish Secure Connection
                    </button>
                  </form>
                </div>
              )}

              {/* Notification Toggles */}
              {activeModal === 'notifications' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className={`text-sm font-bold ${textPrimary}`}>Enable All Notifications</p>
                        <p className="text-[10px] text-gray-500">Master switch for all notifications.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={preferences.notifications?.master ?? true}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updatePreference('notifications', {
                            ...preferences.notifications,
                            master: val
                          });
                        }}
                        className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className={`space-y-3 pt-2 ${(preferences.notifications?.master ?? true) ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Security Alerts</p>
                          <p className="text-[10px] text-gray-500">Logins, password changes, key security events.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.security ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            security: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Profile Updates</p>
                          <p className="text-[10px] text-gray-500">Changes to your account settings.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.profile ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            profile: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Deposits</p>
                          <p className="text-[10px] text-gray-500">When funds arrive in your account.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.deposits ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            deposits: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Withdrawals</p>
                          <p className="text-[10px] text-gray-500">Updates on your withdrawal requests.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.withdrawals ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            withdrawals: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Trading Activity</p>
                          <p className="text-[10px] text-gray-500">Updates on your open positions.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.trading ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            trading: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>AI Signals</p>
                          <p className="text-[10px] text-gray-500">Real-time alerts for optimizer entry & exit points.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.signals ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            signals: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>System Updates</p>
                          <p className="text-[10px] text-gray-500">Maintenance and new feature announcements.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.system ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            system: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Referral Updates</p>
                          <p className="text-[10px] text-gray-500">When your invites join or you earn fees.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.referrals ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            referrals: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className={`text-sm font-bold ${textPrimary}`}>Marketing Messages</p>
                          <p className="text-[10px] text-gray-500">Platform updates, promotions, staking rewards.</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={preferences.notifications?.marketing ?? true}
                          onChange={(e) => updatePreference('notifications', {
                            ...preferences.notifications,
                            marketing: e.target.checked
                          })}
                          className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                        />
                      </div>

                      {/* Divider and Sound Settings */}
                      <div className="border-t border-white/5 mt-4 pt-3">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sound Settings</p>
                        <div className="flex justify-between items-center py-1">
                          <div>
                            <p className={`text-sm font-bold ${textPrimary}`}>Critical Alert Sounds</p>
                            <p className="text-[10px] text-gray-500">Play an elegant synth chime when a new critical market alert arrives.</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={preferences.notifications?.criticalAlertsSound ?? true}
                            onChange={(e) => updatePreference('notifications', {
                              ...preferences.notifications,
                              criticalAlertsSound: e.target.checked
                            })}
                            className="w-10 h-5 accent-emerald-500 bg-slate-900 border-white/5 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Modal */}
              {activeModal === 'preferences' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Display Currency</p>
                      <div className="grid grid-cols-4 gap-2">
                        {['USD', 'EUR', 'GBP', 'BTC'].map((curr) => (
                          <button 
                            key={curr} 
                            onClick={async () => {
                              updatePreference('currency', curr);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              preferences.currency === curr 
                                ? 'bg-emerald-500 text-black' 
                                : (isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                            }`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Interface Language</p>
                      <div className="grid grid-cols-5 gap-2">
                        {['EN', 'ES', 'ZH', 'DE', 'FR'].map((lang) => (
                          <button 
                            key={lang} 
                            onClick={async () => {
                              updatePreference('language', lang);
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              preferences.language === lang 
                                ? 'bg-emerald-500 text-black' 
                                : (isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Remember Me Security</p>
                      <div className="flex justify-between items-center bg-black/5 px-3 py-2 rounded-xl border border-white/5">
                        <span className="text-xs text-gray-400">Save login credentials locally</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.rememberMeEnabled ?? false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updatePreference('rememberMeEnabled', val);
                            if (addNotification) {
                              addNotification(
                                'security',
                                'low',
                                val ? 'Remember Me Enabled' : 'Remember Me Disabled',
                                val ? 'Your session will persist until you manually log out.' : 'You will be logged out when your session expires.'
                              );
                            }
                          }}
                          className="w-8 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Biometrics Recognition</p>
                      <div className="flex justify-between items-center bg-black/5 px-3 py-2 rounded-xl border border-white/5">
                        <span className="text-xs text-gray-400">Unlock with biometric sensors</span>
                        <input 
                          type="checkbox" 
                          checked={preferences.biometricsEnabled ?? false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updatePreference('biometricsEnabled', val);
                            if (addNotification) {
                              addNotification(
                                'security',
                                'low',
                                val ? 'Biometric Login Enabled' : 'Biometric Login Disabled',
                                val ? 'You can now use Face ID/Touch ID to unlock.' : 'Biometric login has been deactivated.'
                              );
                            }
                          }}
                          className="w-8 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulated Email Notification Toast */}
      <AnimatePresence>
        {simulatedEmailToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-xs text-white"
          >
            <div className="bg-slate-950 p-3 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <Mail className="w-4 h-4" />
                <span>Outbox Simulation</span>
              </div>
              <button 
                onClick={() => setSimulatedEmailToast(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <div>
                <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">To:</span>
                <span className="text-white font-medium">{simulatedEmailToast.email}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px]">Subject:</span>
                <span className="text-emerald-400 font-bold">{simulatedEmailToast.subject}</span>
              </div>
              <div className="border-t border-white/5 pt-2 mt-2">
                <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">Body:</span>
                <pre className="text-gray-300 font-mono bg-black/40 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed text-[11px]">
                  {simulatedEmailToast.body}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
