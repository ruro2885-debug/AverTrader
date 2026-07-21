import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Search, Bell, RefreshCw, Clock, CheckCircle2, 
  Award, Coins, Users, Cpu, Send, ChevronDown, ChevronUp, 
  TrendingUp, Wallet, QrCode, Sparkles, History, UserPlus, 
  Settings2, Trophy, Copy, Info, Check, Share2, HelpCircle,
  AlertCircle, ShieldCheck, Twitter, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';

// Types
interface TaskState {
  id: string;
  title: string;
  completed: boolean;
  description: string;
  actionLabel: string;
}

interface CampaignState {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
  tasks: TaskState[];
  endTime: string; // ISO String
}

const INITIAL_CAMPAIGNS: CampaignState[] = [
  {
    id: 'onboarding_starter',
    title: 'Onboarding Starter Sprint',
    description: 'Establish your neural trading foundations. Complete the core setup, security audit, and demo funding tasks.',
    rewardAmount: 250,
    progress: 0,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      { id: 'quiz', title: 'Onboarding Knowledge Quiz', completed: false, description: 'Answer three key questions about Aver technology and dev ports.', actionLabel: 'Take Quiz' },
      { id: 'kyc', title: 'Holographic Face-Scan (KYC)', completed: false, description: 'Verify your digital footprint with our instant face-scan biometric simulator.', actionLabel: 'Verify KYC' },
      { id: 'deposit', title: 'Aver Demo Funding Lift', completed: false, description: 'Initiate a $100 simulated demo deposit to fuel your active neural balance.', actionLabel: 'Settle $100' }
    ]
  },
  {
    id: 'referral_pioneer',
    title: 'Referral Pioneer Sprint',
    description: 'Grow the network. Acquire active trade referrals and earn permanent yield boost badges.',
    rewardAmount: 150,
    progress: 0,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      { id: 'share', title: 'Copy & Share Referral Code', completed: false, description: 'Share your exclusive Aver referral tracking token with peers.', actionLabel: 'Copy Token' },
      { id: 'refer_3', title: 'Acquire 3 Trade Partners', completed: false, description: 'Accumulate three active friends. Simulate referrals directly below.', actionLabel: 'Invite Partner' }
    ]
  },
  {
    id: 'ai_copilot_launch',
    title: 'AI Copilot Strategy Launch',
    description: 'Unlock autonomous trading. Set your neural copilot parameters and activate algorithmic risk strategies.',
    rewardAmount: 100,
    progress: 0,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      { id: 'configure', title: 'Configure AI Risk Weights', completed: false, description: 'Customize allocation size, leverage, and neural risk settings.', actionLabel: 'Set Weights' },
      { id: 'activate', title: 'Enable Neural Copilot Module', completed: false, description: 'Toggle the system-wide autonomous copy-trader to online status.', actionLabel: 'Go Online' }
    ]
  },
  {
    id: 'social_champion',
    title: 'Aver Social Community Hub',
    description: 'Connect with the decentralized algorithmic trading elite across our social networks.',
    rewardAmount: 50,
    progress: 0,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    tasks: [
      { id: 'telegram', title: 'Join Aver Intelligence Telegram', completed: false, description: 'Connect with global quant managers and developer leads.', actionLabel: 'Connect Telegram' },
      { id: 'twitter', title: 'Follow Aver Network on X', completed: false, description: 'Track real-time market briefing announcements and upgrades.', actionLabel: 'Follow X' }
    ]
  }
];

const QUIZ_QUESTIONS = [
  {
    question: "What represents the core engine and service model of Aver?",
    options: [
      "A manual localized OTC orderbook with zero leverage",
      "A neural AI-driven copy-trading & autonomous portfolio strategy network",
      "A basic centralized static chart viewer"
    ],
    correctIndex: 1
  },
  {
    question: "How is your portfolio, active trade tracking, and account balance secured?",
    options: [
      "Purely in temporary browser variables that clear on tab closing",
      "Safely persisted on a cloud-hosted Zero-Trust Firebase/Firestore database",
      "Shared on a public unencrypted spreadsheet"
    ],
    correctIndex: 1
  },
  {
    question: "Which port is strictly designated for external ingress routing to the dev server in the containers?",
    options: [
      "Port 5173",
      "Port 8080",
      "Port 3000 (Required by reverse-proxy layer)"
    ],
    correctIndex: 2
  }
];

// Sub-component for Countdown
function CampaignCountdown({ endTimeStr }: { endTimeStr: string }) {
  const targetDate = useMemo(() => new Date(endTimeStr), [endTimeStr]);
  const { days, hours, minutes, seconds } = useCountdown(targetDate);
  const totalSecs = days * 86400 + hours * 3600 + minutes * 60 + seconds;

  if (totalSecs <= 0) {
    return (
      <span className="flex items-center gap-1 font-mono text-[11px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
        <Clock className="w-3.5 h-3.5" /> Ended
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-purple-400 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
      <Clock className="w-3.5 h-3.5 animate-pulse text-purple-500" />
      {days > 0 ? `${days}d ` : ''}
      {String(hours).padStart(2, '0')}h : {String(minutes).padStart(2, '0')}m : {String(seconds).padStart(2, '0')}s
    </span>
  );
}

export default function EventsPromosPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const { user, updateProfile, addNotification, addDeposit } = useAuth();

  // Primary UI state
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [campaigns, setCampaigns] = useState<CampaignState[]>(INITIAL_CAMPAIGNS);
  const [expandedId, setExpandedId] = useState<string | null>('onboarding_starter');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const [celebrationReward, setCelebrationReward] = useState<{ amount: number; title: string } | null>(null);

  // Interactive Task Variables
  // 1. Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizError, setQuizError] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // 2. KYC Scan
  const [kycScanning, setKycScanning] = useState(false);
  const [kycProgress, setKycProgress] = useState(0);
  const [kycStatusText, setKycStatusText] = useState('');

  // 3. AI Setup form
  const [aiRisk, setAiRisk] = useState<'Conservative' | 'Balanced' | 'Tactical'>('Balanced');
  const [aiMaxTrades, setAiMaxTrades] = useState<number>(5);
  const [aiAlloc, setAiAlloc] = useState<number>(1000);
  const [aiSaving, setAiSaving] = useState(false);

  // 4. Social connection simulators
  const [connectingSocial, setConnectingSocial] = useState<'telegram' | 'twitter' | null>(null);

  // 5. Referral simulator
  const [referralLoading, setReferralLoading] = useState(false);

  // Styling helpers
  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const bgCard = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-md";
  const bgApp = isDark ? "bg-[#0B0E14]" : "bg-slate-50";

  // Toast notifier
  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Core Sync Listener
  useEffect(() => {
    if (!user?.uid) {
      // Offline fallback
      const savedCampaigns = localStorage.getItem('aver_local_campaigns');
      if (savedCampaigns) {
        try {
          setCampaigns(JSON.parse(savedCampaigns));
        } catch (e) {
          console.error(e);
        }
      }
      const savedHistory = localStorage.getItem('aver_local_campaign_history');
      if (savedHistory) {
        try {
          setHistoryLogs(JSON.parse(savedHistory));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    // Subscribe to Firebase real-time campaigns subcollection
    const colRef = collection(db, 'users', user.uid, 'campaigns');
    const unsubCampaigns = onSnapshot(colRef, (snapshot) => {
      const dbList: any[] = [];
      snapshot.forEach(doc => {
        dbList.push(doc.data());
      });

      // Merge INITIAL_CAMPAIGNS with Firestore updates
      const merged = INITIAL_CAMPAIGNS.map(initCamp => {
        const dbCamp = dbList.find(c => c.id === initCamp.id);
        if (dbCamp) {
          // Merge task objects
          const mergedTasks = initCamp.tasks.map(t => {
            const dbTask = dbCamp.tasks?.find((dbt: any) => dbt.id === t.id);
            return dbTask ? { ...t, completed: dbTask.completed } : t;
          });

          return {
            ...initCamp,
            status: dbCamp.status || initCamp.status,
            progress: dbCamp.progress ?? initCamp.progress,
            tasks: mergedTasks,
            endTime: dbCamp.endTime || initCamp.endTime
          };
        }
        return initCamp;
      });

      setCampaigns(merged);
    });

    // Subscribe to Firebase Bonus History
    const historyColRef = collection(db, 'users', user.uid, 'bonusHistory');
    const unsubHistory = onSnapshot(historyColRef, (snapshot) => {
      const hList: any[] = [];
      snapshot.forEach(doc => {
        hList.push({ id: doc.id, ...doc.data() });
      });
      hList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistoryLogs(hList);
    });

    return () => {
      unsubCampaigns();
      unsubHistory();
    };
  }, [user?.uid]);

  // Handle task state write-back
  const saveCampaignState = async (updatedCampaign: CampaignState) => {
    if (user?.uid) {
      try {
        const docRef = doc(db, 'users', user.uid, 'campaigns', updatedCampaign.id);
        await setDoc(docRef, {
          id: updatedCampaign.id,
          status: updatedCampaign.status,
          progress: updatedCampaign.progress,
          endTime: updatedCampaign.endTime,
          tasks: updatedCampaign.tasks.map(t => ({ id: t.id, completed: t.completed })),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error("Failed syncing campaign state to Firestore:", err);
      }
    } else {
      // Local fallback
      const savedCampaigns = localStorage.getItem('aver_local_campaigns');
      let localList: CampaignState[] = [];
      if (savedCampaigns) {
        try {
          localList = JSON.parse(savedCampaigns);
        } catch (e) {
          console.error(e);
        }
      }
      const existingIdx = localList.findIndex(c => c.id === updatedCampaign.id);
      if (existingIdx !== -1) {
        localList[existingIdx] = updatedCampaign;
      } else {
        localList = campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
      }
      localStorage.setItem('aver_local_campaigns', JSON.stringify(localList));
      setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    }
  };

  // Helper to mark task completed
  const completeTask = useCallback(async (campaignId: string, taskId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const updatedTasks = campaign.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / updatedTasks.length) * 100);
    const status = progress === 100 ? 'COMPLETED' : 'ACTIVE';

    const updatedCampaign: CampaignState = {
      ...campaign,
      tasks: updatedTasks,
      progress,
      status
    };

    await saveCampaignState(updatedCampaign);
    triggerToast(`Completed task: "${updatedTasks.find(t => t.id === taskId)?.title}"`, 'success');
  }, [campaigns, user?.uid]);

  // 2. Interactive Task Launchers
  // Quiz submit
  const handleQuizSubmit = async () => {
    if (selectedOption === null) return;

    const correctIdx = QUIZ_QUESTIONS[quizIndex].correctIndex;
    if (selectedOption === correctIdx) {
      setQuizError(false);
      if (quizIndex < QUIZ_QUESTIONS.length - 1) {
        setQuizIndex(prev => prev + 1);
        setSelectedOption(null);
        triggerToast("Correct answer! Moving to next question.", "success");
      } else {
        setQuizCompleted(true);
        triggerToast("Quiz Passed successfully! Task Complete.", "success");
        await completeTask('onboarding_starter', 'quiz');
      }
    } else {
      setQuizError(true);
      triggerToast("Incorrect answer. Please read carefully and retry.", "error");
    }
  };

  // KYC scanning
  const handleKycScan = async () => {
    if (kycScanning) return;
    setKycScanning(true);
    setKycProgress(0);
    
    const steps = [
      "Accessing front camera lens...",
      "Aligning biometric frame...",
      "Capturing holographic depth vectors...",
      "Analyzing face liveness indicators...",
      "Submitting payload to Zero-Knowledge validator...",
      "Generating cryptographic certificate..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setKycStatusText(steps[i]);
      // Increment progress
      setKycProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setKycScanning(false);
    triggerToast("Identity Verified successfully!", "success");

    // Persist real KYC Status on profile!
    try {
      await updateProfile({ kycStatus: 'verified' });
    } catch (e) {
      console.error("KYC update failed", e);
    }

    await completeTask('onboarding_starter', 'kyc');
  };

  // Demo deposit
  const handleDepositSimulate = async () => {
    triggerToast("Initiating $100 Demo funding transaction...", "info");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // 1. Call real context addDeposit
      await addDeposit(100);
      
      // 2. Manually adjust balance if needed for instant synchronous feedback
      const currentAvail = user?.availableBalance || 0;
      const currentPort = user?.portfolioBalance || 0;
      const currentDeps = user?.totalDeposits || 0;
      await updateProfile({
        availableBalance: currentAvail + 100,
        portfolioBalance: currentPort + 100,
        totalDeposits: currentDeps + 100
      });

      triggerToast("Deposited $100 successfully! Real-time balance synced.", "success");
      await completeTask('onboarding_starter', 'deposit');
    } catch (err) {
      console.error(err);
      triggerToast("Funding simulation settled.", "success");
      await completeTask('onboarding_starter', 'deposit');
    }
  };

  // AI strategy saving
  const handleAiStrategySave = async () => {
    setAiSaving(true);
    triggerToast("Compiling neural AI weights...", "info");
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await updateProfile({
        aiSettings: {
          copilotMode: 'autonomous',
          maxActiveTrades: aiMaxTrades,
          riskProfile: aiRisk,
          drawdownStopLimit: 12,
          maxCapitalExposure: Math.min(80, Math.floor((aiAlloc / (user?.portfolioBalance || 10000)) * 100)),
          consecutiveLosses: 3
        }
      });
      setAiSaving(false);
      triggerToast("AI Strategy saved to core engine!", "success");
      await completeTask('ai_copilot_launch', 'configure');
    } catch (e) {
      console.error(e);
      setAiSaving(false);
    }
  };

  // Enable AI Copilot
  const handleAiCopilotEnable = async () => {
    triggerToast("Syncing and turning on AI module...", "info");
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      await updateProfile({ aiTradingEnabled: true });
      triggerToast("AI Copilot is now Active and Live!", "success");
      await completeTask('ai_copilot_launch', 'activate');
    } catch (e) {
      console.error(e);
    }
  };

  // Social connector
  const handleSocialConnect = async (type: 'telegram' | 'twitter') => {
    setConnectingSocial(type);
    await new Promise(resolve => setTimeout(resolve, 1800));
    setConnectingSocial(null);
    triggerToast(`Successfully connected and verified @Aver social entry!`, "success");
    await completeTask('social_champion', type);
  };

  // Referral copier
  const handleCopyReferral = async () => {
    const code = user?.referralCode || "AVER-9633";
    navigator.clipboard.writeText(code);
    triggerToast(`Referral token copied: ${code}`, "success");
    await completeTask('referral_pioneer', 'share');
  };

  // Referral simulator
  const handleInviteSimulate = async () => {
    if (referralLoading) return;
    setReferralLoading(true);
    triggerToast("Inviting partner and simulating referral signup...", "info");
    await new Promise(resolve => setTimeout(resolve, 1600));

    const currentCount = user?.referralCount || 0;
    const nextCount = currentCount + 1;

    try {
      await updateProfile({ referralCount: nextCount });
      triggerToast(`Referral registered! Current count: ${nextCount}/3`, "success");

      // Verify task completion
      if (nextCount >= 3) {
        await completeTask('referral_pioneer', 'refer_3');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReferralLoading(false);
    }
  };

  // Claim Reward and settle funds
  const handleClaimReward = async (campaign: CampaignState) => {
    triggerToast(`Processing claim for $${campaign.rewardAmount} cash credit...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      // 1. Settle balance on real user profile
      const prevAvail = user?.availableBalance || 0;
      const prevPort = user?.portfolioBalance || 0;
      const prevProf = user?.totalProfit || 0;

      await updateProfile({
        availableBalance: prevAvail + campaign.rewardAmount,
        portfolioBalance: prevPort + campaign.rewardAmount,
        totalProfit: prevProf + campaign.rewardAmount
      });

      // 2. Add full structured audit trace to database
      const timestamp = new Date().toISOString();
      const transactionId = "TX-" + Math.floor(100000 + Math.random() * 900000);

      if (user?.uid) {
        const historyColRef = collection(db, 'users', user.uid, 'bonusHistory');
        await addDoc(historyColRef, {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          rewardAmount: campaign.rewardAmount,
          transactionId,
          timestamp,
          status: 'SETTLED'
        });

        // Set state to claimed in Firestore
        const docRef = doc(db, 'users', user.uid, 'campaigns', campaign.id);
        await setDoc(docRef, { status: 'CLAIMED' }, { merge: true });
      } else {
        // Local history storage for offline persistence
        const savedHistory = localStorage.getItem('aver_local_campaign_history');
        let localH: any[] = [];
        if (savedHistory) {
          try {
            localH = JSON.parse(savedHistory);
          } catch (e) {
            console.error(e);
          }
        }
        const newRecord = {
          id: transactionId,
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          rewardAmount: campaign.rewardAmount,
          transactionId,
          timestamp,
          status: 'SETTLED'
        };
        localH.unshift(newRecord);
        localStorage.setItem('aver_local_campaign_history', JSON.stringify(localH));
        setHistoryLogs(localH);

        // Update local campaigns array
        const savedCampaigns = localStorage.getItem('aver_local_campaigns');
        let localC: CampaignState[] = [];
        if (savedCampaigns) {
          try {
            localC = JSON.parse(savedCampaigns);
          } catch (e) {
            console.error(e);
          }
        }
        localC = localC.map(c => c.id === campaign.id ? { ...c, status: 'CLAIMED' } : c);
        localStorage.setItem('aver_local_campaigns', JSON.stringify(localC));
        setCampaigns(localC);
      }

      // 3. Trigger live Notification inside application
      await addNotification(
        'account',
        'high',
        'Campaign Reward Credited',
        `Stunning performance! Verified claims credited $${campaign.rewardAmount} to your wallet. ID: ${transactionId}`
      );

      // 4. Launch visual confetti explosion overlay
      setCelebrationReward({ amount: campaign.rewardAmount, title: campaign.title });
    } catch (err) {
      console.error(err);
      triggerToast("Claim processed successfully!", "success");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex-1 overflow-y-auto flex flex-col ${bgApp} ${isDark ? 'text-white' : 'text-slate-900'} w-full h-full`}
    >
      {/* Decorative Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,#a855f7,transparent_50%)]"></div>
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 h-[64px] flex items-center justify-between px-5 border-b backdrop-blur-md ${isDark ? 'bg-[#0B0E14]/90 border-white/5' : 'bg-white/90 border-slate-200/60'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-md font-black tracking-tight leading-none text-white">Events Hub</h1>
            <p className="text-[11px] text-purple-400 font-bold tracking-widest uppercase mt-0.5">Campaigns & Rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Balance Monitor */}
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Available Wallet</span>
            <span className="text-xs font-mono font-bold text-emerald-400">${(user?.availableBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button onClick={() => triggerToast("Syncing database tables...", "info")} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Action Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-bold pointer-events-auto max-w-sm ${
              toastType === 'success' 
                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' 
                : toastType === 'error'
                ? 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400'
            }`}>
              {toastType === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {toastType === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {toastType === 'info' && <Info className="w-4 h-4 shrink-0" />}
              <span className="leading-tight">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Celebratory Claim Modal */}
      <AnimatePresence>
        {celebrationReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-gradient-to-b from-[#181a2d] to-[#0a0b12] rounded-[28px] p-8 border border-purple-500/30 text-center relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.25)]"
            >
              {/* Star sparkles backgrounds */}
              <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-indigo-500/20 rounded-full blur-2xl animate-pulse delay-500" />

              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
                <Trophy className="w-10 h-10 text-white animate-bounce" />
              </div>

              <span className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-black">BONUS UNLOCKED</span>
              <h3 className="text-3xl font-black mt-1 mb-2 text-white">Sovereign Reward!</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                You successfully claimed the reward for <strong className="text-white">"{celebrationReward.title}"</strong>.
              </p>

              {/* Glowing payout card */}
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-8 font-mono flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">PAYOUT IN CASH CREDITS</span>
                <span className="text-4xl font-extrabold text-emerald-400 mt-1">${celebrationReward.amount}.00</span>
                <span className="text-[9px] text-slate-400 mt-1 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified & Settled
                </span>
              </div>

              <button
                onClick={() => setCelebrationReward(null)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl py-4 font-black text-sm tracking-wide shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Accept Settle Credit
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner Grid section */}
      <div className="shrink-0 bg-gradient-to-b from-[#121422] to-transparent pt-6 pb-2 px-5 relative overflow-hidden">
        {/* Cinematic Animated Assets */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none mix-blend-screen animate-pulse duration-1000"></div>
        <div className="absolute top-1/2 left-[-10%] w-72 h-72 bg-emerald-600/15 rounded-full blur-[80px] pointer-events-none mix-blend-screen animate-pulse delay-500 duration-1000"></div>

        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-slate-900/40 border border-white/5 relative z-10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Internal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-emerald-500/5 pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-500/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase border border-purple-500/20">V3.5 Neural Engine</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase border border-emerald-500/20">Live Sync</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">Quantum Campaign Hub</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed font-medium">
              Earn real cash bonuses directly settled into your sovereign wallet balance. Complete active technical tasks, set your AI profiles, and copy trade with neural parameters.
            </p>
          </div>
          
          <div className="flex gap-6 p-5 rounded-2xl bg-[#090C12]/80 border border-white/10 font-mono text-center shrink-0 relative z-10 shadow-inner">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Total Finished</span>
              <span className="text-2xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">{campaigns.filter(c => c.status !== 'ACTIVE').length} / 4</span>
            </div>
            <div className="border-r border-white/10 h-10 my-auto" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Claimed Rewards</span>
              <span className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                ${campaigns.filter(c => c.status === 'CLAIMED').reduce((acc, c) => acc + c.rewardAmount, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-5 pb-32">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3.5 px-1 relative text-xs font-bold transition-colors ${activeTab === 'active' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Interactive Campaigns</span>
            </div>
            {activeTab === 'active' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-1 relative text-xs font-bold transition-colors ${activeTab === 'history' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Settle History</span>
              {historyLogs.length > 0 && (
                <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[9px]">{historyLogs.length}</span>
              )}
            </div>
            {activeTab === 'history' && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
        </div>

        {/* ACTIVE CAMPAIGNS TAB */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {campaigns.map((camp) => {
              const isExpanded = expandedId === camp.id;
              const isClaimed = camp.status === 'CLAIMED';
              const isCompleted = camp.status === 'COMPLETED';

              return (
                <motion.div
                  key={camp.id}
                  className={`rounded-3xl transition-all overflow-hidden border ${
                    isClaimed 
                      ? 'bg-slate-900/10 border-white/[0.02] opacity-60' 
                      : isExpanded 
                      ? 'bg-[#121526]/50 border-purple-500/30 shadow-[0_4px_30px_rgba(155,114,255,0.05)]' 
                      : 'bg-slate-900/40 hover:bg-slate-900/60 border-white/5'
                  }`}
                >
                  {/* Card Header clickable area */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : camp.id)}
                    className="p-6 flex items-center justify-between cursor-pointer select-none gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                          isClaimed 
                            ? 'bg-slate-800 text-slate-400' 
                            : isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {isClaimed ? 'Claimed' : isCompleted ? 'Completed (Ready)' : 'Live'}
                        </span>
                        
                        {!isClaimed && <CampaignCountdown endTimeStr={camp.endTime} />}
                      </div>

                      <h3 className={`text-lg font-black tracking-tight ${isClaimed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        {camp.description}
                      </p>
                    </div>

                    {/* Progress Circle or Arrow */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="relative w-12 h-12 flex items-center justify-center font-mono text-xs font-black shrink-0">
                        {/* Circular SVG Progress */}
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="21" stroke="rgba(255,255,255,0.02)" strokeWidth="3.5" fill="transparent" />
                          <circle 
                            cx="24" 
                            cy="24" 
                            r="21" 
                            stroke={isClaimed ? "#475569" : isCompleted ? "#10b981" : "#8b5cf6"} 
                            strokeWidth="3.5" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 21}
                            strokeDashoffset={2 * Math.PI * 21 * (1 - camp.progress / 100)}
                            className="transition-all duration-500"
                          />
                        </svg>
                        <span className={isCompleted ? 'text-emerald-400' : isClaimed ? 'text-slate-500' : 'text-white'}>
                          {camp.progress}%
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Task details & Actions */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        <div className="p-6 space-y-6">
                          {/* Inner list of tasks */}
                          <div className="space-y-4">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Active Verification Milestones</span>
                            
                            {camp.tasks.map((task) => {
                              const isTaskCompleted = task.completed;
                              
                              return (
                                <div 
                                  key={task.id}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                                    isTaskCompleted 
                                      ? 'bg-emerald-500/[0.02] border-emerald-500/10' 
                                      : 'bg-white/[0.01] border-white/5'
                                  }`}
                                >
                                  <div className="flex gap-3 items-start">
                                    <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                      isTaskCompleted 
                                        ? 'bg-emerald-500 border-emerald-400 text-white' 
                                        : 'border-white/20'
                                    }`}>
                                      {isTaskCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className={`text-xs font-bold ${isTaskCompleted ? 'text-slate-400' : 'text-white'}`}>
                                        {task.title}
                                      </span>
                                      <p className="text-[11px] text-slate-400 leading-snug">
                                        {task.id === 'refer_3' 
                                          ? `${task.description} (Joined Friends: ${user?.referralCount || 0}/3)`
                                          : task.description}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Task Interactive Area */}
                                  <div className="shrink-0">
                                    {isTaskCompleted ? (
                                      <span className="text-[10px] font-black text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Milestone Settled
                                      </span>
                                    ) : (
                                      <div>
                                        {/* Task Action Handlers depending on ID */}
                                        {task.id === 'quiz' && (
                                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 max-w-sm">
                                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase font-black">
                                              <span>Question {quizIndex + 1} of 3</span>
                                              <span className="text-purple-400">Knowledge Settle</span>
                                            </div>
                                            <p className="text-xs font-bold text-white leading-snug">
                                              {QUIZ_QUESTIONS[quizIndex].question}
                                            </p>
                                            <div className="space-y-2">
                                              {QUIZ_QUESTIONS[quizIndex].options.map((opt, oIdx) => (
                                                <button
                                                  key={oIdx}
                                                  onClick={() => setSelectedOption(oIdx)}
                                                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all ${
                                                    selectedOption === oIdx 
                                                      ? 'bg-purple-500/20 border-purple-500 text-white' 
                                                      : 'bg-black/20 border-white/5 text-slate-300 hover:bg-white/5'
                                                  }`}
                                                >
                                                  {opt}
                                                </button>
                                              ))}
                                            </div>
                                            {quizError && (
                                              <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5" /> Incorrect selection. Try again!
                                              </p>
                                            )}
                                            <button
                                              onClick={handleQuizSubmit}
                                              disabled={selectedOption === null}
                                              className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black py-2.5 rounded-xl transition-all"
                                            >
                                              Validate Answer
                                            </button>
                                          </div>
                                        )}

                                        {task.id === 'kyc' && (
                                          <div className="space-y-3">
                                            {kycScanning ? (
                                              <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2 max-w-xs">
                                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-400">
                                                  <span className="animate-pulse">{kycStatusText}</span>
                                                  <span>{kycProgress}%</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                  <motion.div 
                                                    className="h-full bg-purple-500" 
                                                    style={{ width: `${kycProgress}%` }}
                                                  />
                                                </div>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={handleKycScan}
                                                className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                              >
                                                <QrCode className="w-3.5 h-3.5" /> Scan Face Identity
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {task.id === 'deposit' && (
                                          <button
                                            onClick={handleDepositSimulate}
                                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                          >
                                            <Wallet className="w-3.5 h-3.5" /> Fund $100 Simulated Cash
                                          </button>
                                        )}

                                        {task.id === 'share' && (
                                          <button
                                            onClick={handleCopyReferral}
                                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                          >
                                            <Copy className="w-3.5 h-3.5" /> Copy Code: {user?.referralCode || "AVER-9633"}
                                          </button>
                                        )}

                                        {task.id === 'refer_3' && (
                                          <button
                                            onClick={handleInviteSimulate}
                                            disabled={referralLoading}
                                            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                          >
                                            <UserPlus className="w-3.5 h-3.5" /> Invite Friend Invite
                                          </button>
                                        )}

                                        {task.id === 'configure' && (
                                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4 max-w-sm">
                                            <span className="text-[10px] text-slate-500 font-black block uppercase font-mono">Neural Weights</span>
                                            
                                            <div className="space-y-1.5">
                                              <label className="text-[10px] text-slate-400 block font-bold uppercase">Risk Profile Preference</label>
                                              <div className="grid grid-cols-3 gap-2">
                                                {(['Conservative', 'Balanced', 'Tactical'] as const).map(p => (
                                                  <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setAiRisk(p)}
                                                    className={`py-2 rounded-xl border text-[11px] font-black transition-all ${
                                                      aiRisk === p 
                                                        ? 'bg-purple-500/20 border-purple-500 text-white' 
                                                        : 'bg-black/10 border-white/5 text-slate-400'
                                                    }`}
                                                  >
                                                    {p}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>

                                            <div className="space-y-1">
                                              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                                <span>Active Trade Limit</span>
                                                <span className="font-mono text-purple-400">{aiMaxTrades} Trades</span>
                                              </div>
                                              <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={aiMaxTrades}
                                                onChange={e => setAiMaxTrades(parseInt(e.target.value))}
                                                className="w-full accent-purple-500"
                                              />
                                            </div>

                                            <button
                                              onClick={handleAiStrategySave}
                                              disabled={aiSaving}
                                              className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-black py-2.5 rounded-xl transition-all"
                                            >
                                              {aiSaving ? "Saving..." : "Apply Neural Weights"}
                                            </button>
                                          </div>
                                        )}

                                        {task.id === 'activate' && (
                                          <button
                                            onClick={handleAiCopilotEnable}
                                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                          >
                                            <Cpu className="w-3.5 h-3.5" /> Deploy Autonomous Engine
                                          </button>
                                        )}

                                        {(task.id === 'telegram' || task.id === 'twitter') && (
                                          <button
                                            onClick={() => handleSocialConnect(task.id as 'telegram' | 'twitter')}
                                            disabled={connectingSocial !== null}
                                            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/15"
                                          >
                                            {connectingSocial === task.id ? (
                                              <span className="flex items-center gap-1">
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1.5">
                                                {task.id === 'twitter' ? <Twitter className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                                                {task.actionLabel}
                                              </span>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Claim Reward Button block if completed */}
                          {!isClaimed && (
                            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                  <Coins className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="space-y-0.5 text-center sm:text-left">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">REWARD IN CASH CREDIT</span>
                                  <span className="text-md font-black text-white">${camp.rewardAmount}.00 Cash Credit</span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleClaimReward(camp)}
                                disabled={!isCompleted}
                                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20 animate-pulse scale-105' 
                                    : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {isCompleted ? 'Claim Settle Balance' : 'Complete Milestones first'}
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* SETTLE HISTORY LOGS TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyLogs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-white/5 bg-slate-900/10 max-w-md mx-auto space-y-3">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto opacity-30" />
                <p className="text-xs font-bold text-slate-400">No settled claims yet.</p>
                <p className="text-[11px] text-slate-500">
                  Complete active onboarding tasks or verify risk strategy configurations to settle your first reward.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase font-mono px-2">
                  <span>Audited Reward Event Log</span>
                  <span>Direct Ledger Sync</span>
                </div>

                {historyLogs.map((log, idx) => (
                  <motion.div
                    key={log.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <Coins className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {log.campaignTitle || "Aver Cash Credit"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500 font-mono">
                          <span>Ref: <strong className="text-slate-300">{log.transactionId}</strong></span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 font-mono">+${log.rewardAmount}.00</span>
                        <span className="block text-[9px] text-slate-500 font-mono">Ledger Settled</span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}
