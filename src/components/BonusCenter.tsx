import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  History as HistoryIcon, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ChevronRight, 
  Star, 
  Zap, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Calendar,
  Sparkles,
  Award,
  Crown,
  BadgeCheck,
  Check,
  X,
  Smartphone
} from 'lucide-react';

// --- TYPES ---
type SubView = 'main' | 'history' | 'task-details' | 'membership-details';

interface Task {
  id: string;
  title: string;
  progress: number;
  increment: number;
  status: 'pending' | 'completed' | 'locked';
  icon: any;
  actionLabel: string;
  targetTab?: string;
  customAction?: 'deposit' | 'profile';
}

interface Tier {
  id: 'bronze' | 'silver' | 'gold';
  name: string;
  icon: any;
  requirements: string;
  benefits: string[];
  color: string;
}

interface Mission {
  id: string;
  title: string;
  reward: string;
  icon: any;
}

interface Achievement {
  id: string;
  title: string;
  status: 'completed' | 'locked';
  icon: any;
}

// --- CONSTANTS ---
const TIERS: Tier[] = [
  {
    id: 'bronze',
    name: 'Bronze Member',
    icon: Trophy,
    requirements: 'Default Entry Tier',
    benefits: [
      'Beginner trading badge',
      'Small cashback on selected fees',
      'Access to beginner campaigns',
      'Referral rewards',
      'Welcome promotions'
    ],
    color: 'from-orange-700 via-orange-600 to-amber-700'
  },
  {
    id: 'silver',
    name: 'Silver Member',
    icon: Star,
    requirements: 'Complete Bronze progression',
    benefits: [
      'Lower trading fees',
      'Faster withdrawals',
      'Priority support queue',
      'Higher referral rewards',
      'Monthly bonus events',
      'Higher daily limits'
    ],
    color: 'from-slate-400 via-slate-300 to-slate-500'
  },
  {
    id: 'gold',
    name: 'Gold Member',
    icon: Crown,
    requirements: 'Complete Silver progression',
    benefits: [
      'Lowest trading fees',
      'VIP support',
      'Exclusive campaigns',
      'Premium market reports',
      'Highest referral commission',
      'Highest withdrawal limits',
      'Early access to new features'
    ],
    color: 'from-yellow-500 via-amber-400 to-yellow-600'
  }
];

const MISSIONS: Mission[] = [
  { id: 'm1', title: 'Open app', reward: '+0.5% Progress', icon: Zap },
  { id: 'm2', title: 'Trade once', reward: '+1% Progress', icon: TrendingUp },
  { id: 'm3', title: 'View Markets', reward: '+0.3% Progress', icon: Clock },
  { id: 'm4', title: 'Check Portfolio', reward: '+0.3% Progress', icon: Wallet },
  { id: 'm5', title: 'Complete Security Check', reward: '+1% Progress', icon: ShieldCheck }
];

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Deposit', status: 'completed', icon: Wallet },
  { id: 'a2', title: 'First Trade', status: 'completed', icon: TrendingUp },
  { id: 'a3', title: '10 Trades', status: 'completed', icon: Award },
  { id: 'a4', title: '100 Trades', status: 'locked', icon: Trophy },
  { id: 'a5', title: '1 Year Member', status: 'locked', icon: Calendar },
  { id: 'a6', title: 'Invite 10 Friends', status: 'locked', icon: Users }
];

export default function BonusCenter({ 
  theme, 
  onBack, 
  onNavigate, 
  onOpenDeposit 
}: { 
  theme: 'light' | 'dark', 
  onBack: () => void,
  onNavigate?: (tab: string) => void,
  onOpenDeposit?: () => void
}) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<SubView>('main');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [membershipProgress, setMembershipProgress] = useState(42); // Animated mock progress for Bronze

  // Dynamic tasks based on user state (mocking some for the redesign feel)
  const tasks: Task[] = useMemo(() => [
    { 
      id: 'profile', 
      title: 'Complete Profile', 
      progress: user?.displayName ? 100 : 80, 
      increment: 2, 
      status: user?.displayName ? 'completed' : 'pending', 
      icon: Users, 
      actionLabel: 'Continue',
      customAction: 'profile'
    },
    { 
      id: 'email', 
      title: 'Email Verification', 
      progress: 100, 
      increment: 3, 
      status: 'completed', 
      icon: BadgeCheck, 
      actionLabel: 'Verified'
    },
    { 
      id: 'deposit', 
      title: 'First Deposit', 
      progress: (user?.totalDeposits || 0) > 0 ? 100 : 0, 
      increment: 6, 
      status: (user?.totalDeposits || 0) > 0 ? 'completed' : 'pending', 
      icon: Wallet, 
      actionLabel: 'Deposit',
      customAction: 'deposit'
    },
    { 
      id: 'trade', 
      title: 'First Trade', 
      progress: 0, 
      increment: 5, 
      status: 'locked', 
      icon: TrendingUp, 
      actionLabel: 'Trade',
      targetTab: 'markets'
    },
    { 
      id: 'referral', 
      title: 'Referral Milestone', 
      progress: 40, 
      increment: 5, 
      status: 'pending', 
      icon: Users, 
      actionLabel: 'View Details',
      targetTab: 'referral-centre'
    }
  ], [user]);

  const handleTaskAction = (task: Task) => {
    if (task.status === 'completed') return;
    
    if (task.customAction === 'deposit') {
      onOpenDeposit?.();
    } else if (task.customAction === 'profile') {
      onNavigate?.('profile');
    } else if (task.targetTab) {
      onNavigate?.(task.targetTab);
    }
  };

  const renderHeader = (title: string, subtitle?: string, showHistory = false) => (
    <header className="flex justify-between items-center px-5 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20 border-b border-white/5">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-all active:scale-95 text-emerald-500"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white leading-none">{title}</h1>
          {subtitle && <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showHistory && (
          <button 
            onClick={() => setCurrentView('history')}
            className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            aria-label="View history"
          >
            <HistoryIcon className="w-5 h-5 text-emerald-500" />
          </button>
        )}
        <button 
          onClick={onBack}
          className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  const TaskDetailsView = () => {
    if (!selectedTask) return null;
    const isCompleted = selectedTask.status === 'completed';

    return (
      <div className="pb-12 bg-slate-950">
        <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-20 border-b border-white/5">
          <button onClick={() => setCurrentView('main')} className="p-2 rounded-xl hover:bg-white/5 text-emerald-500">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-black text-white">Task Details</h2>
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-white/5 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="px-6 py-6 space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-2xl ${
              isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-gray-400 border border-white/10'
            }`}>
              <selectedTask.icon className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-white">{selectedTask.title}</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-xs">
              Complete this milestone to earn <span className="text-emerald-500 font-bold">{selectedTask.increment}% progress</span> towards your next membership tier.
            </p>
          </div>

          <div className="p-8 rounded-[40px] bg-slate-900 border border-white/5 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500">
                <span>Current Progress</span>
                <span className="text-emerald-500">{selectedTask.progress}%</span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedTask.progress}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Requirements</h4>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : 'text-gray-600'}`} />
                <span className="text-sm text-gray-400">Perform the action: <span className="text-white font-bold">{selectedTask.title}</span></span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Estimated Completion</h4>
              <p className="text-sm text-gray-400">Usually takes <span className="text-white font-bold">1-2 minutes</span> once initiated.</p>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Benefits after unlocking</h4>
              <p className="text-sm text-gray-400">Directly contributes to your next tier rewards and permanent fee reductions.</p>
            </div>
          </div>

          <div className="pt-4">
            {isCompleted ? (
              <div className="w-full py-5 rounded-[28px] bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-emerald-500 font-black text-sm">Reward already claimed and progress added.</p>
              </div>
            ) : (
              <button 
                onClick={() => handleTaskAction(selectedTask)}
                className="w-full py-5 rounded-[28px] bg-emerald-500 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Claim Reward
              </button>
            )}
            {!isCompleted && selectedTask.status === 'locked' && (
              <p className="text-center text-xs text-rose-500 font-bold mt-4">Requirements not yet completed.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MainView = () => (
    <div className="pb-12">
      {renderHeader("Bonus Center", "Trading milestones & rewards.", true)}
      
      {/* SECTION 1: MEMBERSHIP PROGRESS */}
      <section className="px-6 py-6">
        <motion.div 
          onClick={() => setCurrentView('membership-details')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-emerald-500/10 shadow-2xl overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2 block">Current Membership</span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/5">
                  <Trophy className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">🥉 Bronze Member</h3>
                  <p className="text-[11px] text-gray-400 font-bold">Trading Fees: 0.1%</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Next Tier</span>
              <p className="text-sm font-black text-emerald-500">🥈 Silver</p>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px] font-black text-gray-500 uppercase tracking-tighter">
              <span>Bronze</span>
              <span className="text-emerald-500 text-lg">{membershipProgress}%</span>
              <span>Silver</span>
            </div>
            <div className="h-4 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${membershipProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
              </motion.div>
            </div>
            <p className="text-[11px] text-gray-500 font-medium text-center italic">
              “Complete platform activities to gradually unlock higher membership levels.”
            </p>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: MEMBERSHIP JOURNEY */}
      <section className="py-4">
        <div className="px-6 mb-4 flex justify-between items-center">
          <h2 className="text-lg font-black text-white">Membership Journey</h2>
          <button 
            onClick={() => setCurrentView('membership-details')}
            className="text-[10px] font-black text-emerald-500 uppercase tracking-widest"
          >
            View Benefits
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-6 scrollbar-hide snap-x snap-mandatory">
          {TIERS.map((tier, idx) => {
            const isCurrent = tier.id === 'bronze';
            
            return (
              <motion.div 
                key={tier.id}
                onClick={() => setCurrentView('membership-details')}
                whileHover={{ scale: 1.02 }}
                className={`min-w-[280px] p-6 rounded-[32px] border snap-start cursor-pointer transition-all ${
                  isCurrent 
                  ? `bg-gradient-to-br ${tier.color} border-white/20 shadow-2xl shadow-orange-950/20 ring-4 ring-orange-500/20` 
                  : 'bg-slate-900 border-white/5 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl bg-white/10 border border-white/20`}>
                    <tier.icon className={`w-6 h-6 text-white`} />
                  </div>
                  {isCurrent ? (
                    <span className="bg-white/20 text-[10px] font-black px-3 py-1.5 rounded-full border border-white/30 text-white uppercase tracking-widest">Active</span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                      <Lock className="w-3 h-3" /> Locked
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-black text-white mb-1">{tier.name}</h4>
                <p className="text-[11px] text-white/60 font-medium mb-4">{tier.requirements}</p>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                  {tier.benefits.slice(0, 3).map((benefit, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-white/50" />
                      <span className="text-[10px] text-white/80 font-bold">{benefit}</span>
                    </div>
                  ))}
                  {tier.benefits.length > 3 && (
                    <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-2">+{tier.benefits.length - 3} More Benefits</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: HOW TO LEVEL UP */}
      <section className="px-6 py-6">
        <h2 className="text-lg font-black text-white mb-6">How To Level Up</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Complete profile', value: '+2%', icon: Users },
            { label: 'Verify email', value: '+3%', icon: BadgeCheck },
            { label: 'Verify phone', value: '+3%', icon: Smartphone },
            { label: 'Complete first deposit', value: '+6%', icon: Wallet },
            { label: 'Complete KYC', value: '+10%', icon: ShieldCheck },
            { label: 'Complete first trade', value: '+5%', icon: TrendingUp },
            { label: 'Invite an active friend', value: '+5%', icon: Users }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-4 rounded-[24px] bg-slate-900 border border-white/5 group hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                  <item.icon className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                </div>
                <span className="text-sm font-bold text-white">{item.label}</span>
              </div>
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: ACTIVE TASKS */}
      <section className="px-6 py-6">
        <h2 className="text-lg font-black text-white mb-6">Current Tasks</h2>
        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setCurrentView('task-details');
              }}
              whileHover={{ x: 4 }}
              className="p-6 rounded-[32px] bg-slate-900 border border-white/5 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-gray-500'
                }`}>
                  <task.icon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{task.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-24 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-white/20'}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">{task.progress}%</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskAction(task);
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  task.status === 'completed' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                  : task.status === 'locked'
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'
                }`}
              >
                {task.status === 'completed' ? (
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Completed
                  </div>
                ) : task.actionLabel}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 5: DAILY MISSIONS */}
      <section className="px-6 py-6">
        <h2 className="text-lg font-black text-white mb-6">Daily Missions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MISSIONS.map((mission) => (
            <div key={mission.id} className="p-5 rounded-[28px] bg-slate-900 border border-white/5 flex justify-between items-center group overflow-hidden relative">
              <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                  <mission.icon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">{mission.title}</h5>
                  <p className="text-[10px] font-black text-emerald-500 uppercase mt-0.5">{mission.reward}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: ACHIEVEMENTS */}
      <section className="px-6 py-12">
        <h2 className="text-lg font-black text-white mb-8">Achievements</h2>
        <div className="grid grid-cols-3 gap-6">
          {ACHIEVEMENTS.map((ach) => (
            <div key={ach.id} className="flex flex-col items-center gap-3 group">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 relative transition-all duration-500 ${
                ach.status === 'completed'
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 shadow-xl shadow-emerald-500/10'
                : 'bg-slate-900/50 border-white/5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-60'
              }`}>
                {ach.status === 'completed' && (
                  <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1 border-4 border-slate-950">
                    <Check className="w-3 h-3 text-slate-950" />
                  </div>
                )}
                <ach.icon className={`w-10 h-10 ${ach.status === 'completed' ? 'text-emerald-500' : 'text-gray-500'}`} />
              </div>
              <span className={`text-[10px] font-black uppercase text-center tracking-tight ${
                ach.status === 'completed' ? 'text-white' : 'text-gray-600'
              }`}>{ach.title}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const HistoryView = () => (
    <div className="pb-12 bg-slate-950">
      {renderHeader("Reward History")}
      <div className="px-6 py-4 space-y-4">
        {[
          { title: 'Welcome Bonus', amount: '$150', status: 'Claimed', date: '2024-03-20', color: 'text-emerald-500' },
          { title: 'Daily Mission', amount: '+0.5% XP', status: 'Claimed', date: '2024-03-21', color: 'text-emerald-500' },
          { title: 'Level 2 Reward', amount: '$50', status: 'Pending', date: '2024-03-22', color: 'text-amber-500' },
          { title: 'Sign-up Reward', amount: '$10', status: 'Expired', date: '2024-02-15', color: 'text-gray-500' }
        ].map((item, idx) => (
          <div key={idx} className="p-5 rounded-[28px] bg-slate-900 border border-white/5 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <HistoryIcon className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-gray-500 font-medium">{item.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">{item.amount}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${item.color}`}>{item.status}</p>
            </div>
          </div>
        ))}

        {/* EMPTY STATE MOCK */}
        {/* <div className="py-20 flex flex-col items-center text-center px-10">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <HistoryIcon className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-lg font-black text-white">No pending rewards</h3>
          <p className="text-sm text-gray-500 mt-2">Check back later or complete more tasks to earn premium rewards.</p>
        </div> */}
      </div>
    </div>
  );

  const MembershipDetailsView = () => (
    <div className="pb-12 bg-slate-950">
      {renderHeader("Tier Benefits")}
      <div className="px-6 py-6 space-y-8">
        {TIERS.map((tier) => (
          <div key={tier.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tier.color} text-white shadow-lg`}>
                <tier.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white">{tier.name}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {tier.benefits.map((benefit, bIdx) => (
                <div key={bIdx} className="p-4 rounded-[24px] bg-slate-900 border border-white/5 flex items-center gap-4">
                  <div className="p-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden font-sans"
    >
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {currentView === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide"
            >
              <MainView />
            </motion.div>
          )}
          
          {currentView === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide"
            >
              <HistoryView />
            </motion.div>
          )}
  
          {currentView === 'membership-details' && (
            <motion.div 
              key="membership"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide"
            >
              <MembershipDetailsView />
            </motion.div>
          )}
  
          {currentView === 'task-details' && (
            <motion.div 
              key="task-details"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide"
            >
              <TaskDetailsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM SAFE AREA SPACER */}
      <div className="h-[env(safe-area-inset-bottom,20px)] w-full bg-slate-950 border-t border-white/5 flex items-center justify-center">
        <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em]">Avernox Engine</p>
      </div>
    </motion.div>
  );
}


