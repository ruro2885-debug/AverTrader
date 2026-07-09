import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Star, ChevronRight, Lock, Calendar, Target, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function BonusCenter({ theme, onBack }: { theme: 'light' | 'dark', onBack?: () => void }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 pt-4 pb-20"
    >
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-2 rounded-full border transition-colors ${isDark ? 'border-white/10 hover:bg-white/5 text-gray-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${textPrimary}`}>Bonus Centre</h2>
            <p className={`text-sm ${textSecondary} mt-1`}>Your exclusive rewards & benefits</p>
          </div>
        </div>
      </div>

      {/* Current Tier Card */}
      <div className={`mx-4 rounded-[24px] p-6 relative overflow-hidden bg-gradient-to-br from-[#cd7f32]/20 to-[#cd7f32]/5 border border-[#cd7f32]/30 shadow-[0_0_30px_rgba(205,127,50,0.15)]`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#cd7f32]/10 blur-[50px] rounded-full" />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider text-[#cd7f32] mb-1`}>Current Tier</p>
            <h3 className={`text-3xl font-black text-white flex items-center`}>
              <span className="mr-2">🥉</span> Bronze
            </h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center">
            <Trophy className="w-4 h-4 text-[#e6a865] mr-1.5" />
            <span className="text-xs font-bold text-[#e6a865]">Level 1</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="flex items-center space-x-2 text-white/70 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Member Since</span>
            </div>
            <p className="text-sm font-bold text-white">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="flex items-center space-x-2 text-white/70 mb-1">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reward Status</span>
            </div>
            <p className="text-sm font-bold text-emerald-400">Active</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-white/80">Progress to Silver</span>
            <span className="text-xs font-bold text-[#cd7f32]">35%</span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#cd7f32] to-[#e6a865] w-[35%] rounded-full shadow-[0_0_10px_rgba(205,127,50,0.5)]" />
          </div>
          <p className="text-[10px] text-white/60 mt-2 text-center">Complete more activity to progress toward the next membership tier.</p>
        </div>
      </div>

      {/* Available Bonuses */}
      <div className="px-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Available Bonuses</h3>
        <div className={`rounded-[24px] p-6 text-center ${cardClasses}`}>
          <div className="flex justify-center mb-3">
            <div className={`p-4 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <Award className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
            </div>
          </div>
          <h4 className={`text-base font-bold mb-1 ${textPrimary}`}>No bonuses available</h4>
          <p className={`text-xs ${textSecondary} mb-4`}>Check back later or complete trading milestones to unlock new rewards.</p>
          <button disabled className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${isDark ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            Claim Bonus
          </button>
        </div>
      </div>

      {/* Tier Progression */}
      <div className="px-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Membership Tiers</h3>
        <div className="space-y-4">
          
          {/* Bronze (Active) */}
          <div className={`rounded-[20px] p-5 border-2 border-[#cd7f32]/50 bg-gradient-to-br ${isDark ? 'from-[#cd7f32]/10 to-transparent' : 'from-[#cd7f32]/5 to-transparent'}`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cd7f32] to-[#8c5722] flex items-center justify-center shadow-lg">
                  <span className="text-xl">🥉</span>
                </div>
                <div>
                  <h4 className={`font-bold ${textPrimary}`}>Bronze Tier</h4>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Current Level</p>
                </div>
              </div>
            </div>
            <ul className="space-y-2">
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Zap className="w-3.5 h-3.5 mr-2 text-[#cd7f32]" /> Standard withdrawal speeds
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Zap className="w-3.5 h-3.5 mr-2 text-[#cd7f32]" /> Standard transaction limits
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Zap className="w-3.5 h-3.5 mr-2 text-[#cd7f32]" /> 24/7 Community Support
              </li>
            </ul>
          </div>

          {/* Silver (Locked) */}
          <div className={`rounded-[20px] p-5 border ${isDark ? 'border-white/5 bg-slate-900/40' : 'border-slate-200 bg-white/60'} opacity-75`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg grayscale">
                  <span className="text-xl">🥈</span>
                </div>
                <div>
                  <h4 className={`font-bold ${textPrimary}`}>Silver Tier</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Locked</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <ul className="space-y-2">
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Shield className="w-3.5 h-3.5 mr-2 text-gray-400" /> Faster withdrawals
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Shield className="w-3.5 h-3.5 mr-2 text-gray-400" /> Higher transaction limits
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Shield className="w-3.5 h-3.5 mr-2 text-gray-400" /> Priority support channel
              </li>
            </ul>
          </div>

          {/* Gold (Locked) */}
          <div className={`rounded-[20px] p-5 border ${isDark ? 'border-white/5 bg-slate-900/40' : 'border-slate-200 bg-white/60'} opacity-50`}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg grayscale">
                  <span className="text-xl">🥇</span>
                </div>
                <div>
                  <h4 className={`font-bold ${textPrimary}`}>Gold Tier</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Locked</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <ul className="space-y-2">
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Star className="w-3.5 h-3.5 mr-2 text-gray-400" /> Instant VIP withdrawals
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Star className="w-3.5 h-3.5 mr-2 text-gray-400" /> Unlimited transactions
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Star className="w-3.5 h-3.5 mr-2 text-gray-400" /> Dedicated account manager
              </li>
              <li className={`flex items-center text-xs ${textSecondary}`}>
                <Star className="w-3.5 h-3.5 mr-2 text-gray-400" /> Exclusive promotions & early access
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bonus History */}
      <div className="px-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Bonus History</h3>
        <div className={`rounded-[24px] p-6 text-center ${cardClasses}`}>
          <p className={`text-xs ${textSecondary}`}>No bonus activity yet.</p>
        </div>
      </div>

    </motion.div>
  );
}
