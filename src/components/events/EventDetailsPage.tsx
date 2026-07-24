import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Share2, 
  RotateCw, 
  Clock, 
  Users, 
  Trophy, 
  CheckCircle2, 
  Sparkles, 
  Gift, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Award, 
  Coins, 
  Zap, 
  FileText, 
  HelpCircle, 
  Flame, 
  AlertCircle 
} from 'lucide-react';
import { EventItem } from '../../types/events';
import { joinEventService, claimEventRewardService, subscribeToEvents } from '../../services/eventsService';
import { useAuth } from '../../contexts/AuthContext';
import EventCard from './EventCard';

interface EventDetailsPageProps {
  eventId: string;
  onBack: () => void;
  onNavigateToTrading?: () => void;
  theme?: 'light' | 'dark';
}

function formatCountdownDetail(targetTimeStr?: string): { days: number; hours: number; mins: number; secs: number } {
  if (!targetTimeStr) return { days: 0, hours: 0, mins: 0, secs: 0 };
  const target = new Date(targetTimeStr).getTime();
  const diff = Math.max(0, target - Date.now());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    secs: Math.floor((diff % (1000 * 60)) / 1000)
  };
}

export default function EventDetailsPage({
  eventId,
  onBack,
  onNavigateToTrading,
  theme = 'dark'
}: EventDetailsPageProps) {
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ELIGIBILITY' | 'GUIDE' | 'PRIZES' | 'TIMELINE' | 'FAQS'>('OVERVIEW');
  const [isJoining, setIsJoining] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Timer state
  const [countdown, setCountdown] = useState(formatCountdownDetail(event?.endTime));

  // Subscribe to real-time event updates
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToEvents(
      (eventsList) => {
        setAllEvents(eventsList);
        const found = eventsList.find(e => e.id === eventId);
        if (found) {
          setEvent(found);
          setError(null);
        } else {
          setError("Event not found or has been removed.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading event details:", err);
        setError("Unable to sync live event data.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [eventId]);

  // Update countdown timer
  useEffect(() => {
    if (!event) return;
    const target = event.status === 'UPCOMING' ? event.startTime : event.endTime;
    setCountdown(formatCountdownDetail(target));

    const interval = setInterval(() => {
      setCountdown(formatCountdownDetail(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const handleJoin = async () => {
    if (!event) return;
    setIsJoining(true);
    try {
      await joinEventService(user?.uid, event.id);
      setToastMsg("Successfully registered for this campaign!");
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.error("Failed to join event", e);
    } finally {
      setIsJoining(false);
    }
  };

  const handleClaim = async () => {
    if (!event) return;
    setIsClaiming(true);
    try {
      await claimEventRewardService(user?.uid, event);
      setToastMsg(`Claimed reward successfully! Credited to wallet.`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      console.error("Failed to claim reward", e);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Aver Promotion',
        text: event?.subtitle || 'Check out this campaign on Aver!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMsg("Campaign link copied to clipboard!");
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const relatedEvents = allEvents.filter(e => e.id !== eventId).slice(0, 3);

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-[#07090E] text-white' : 'bg-gray-50 text-gray-900'} space-y-6 animate-pulse`}>
        <div className="h-10 w-24 bg-gray-800 rounded-xl" />
        <div className="h-64 w-full bg-gray-800 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-800 rounded-2xl" />
          <div className="h-24 bg-gray-800 rounded-2xl" />
          <div className="h-24 bg-gray-800 rounded-2xl" />
          <div className="h-24 bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-[#07090E] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-black mb-2">{error || "Campaign Unavailable"}</h2>
        <p className="text-xs text-gray-400 mb-6 text-center max-w-sm">This event might have expired or been moved by the administrator.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-colors"
        >
          Return to Events Hub
        </button>
      </div>
    );
  }

  const isJoined = event.userProgress?.joined;
  const isClaimed = event.userProgress?.status === 'CLAIMED';

  return (
    <div className={`min-h-screen relative pb-32 ${isDark ? 'bg-[#07090E] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-2xl bg-emerald-500 text-black font-black text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Banner */}
      <div className="relative w-full h-[380px] overflow-hidden">
        <img 
          src={event.bannerUrl} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${event.heroGradient || 'from-[#07090E] via-[#07090E]/60 to-black/40'}`} />

        {/* Top Floating Nav Bar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <button
            onClick={onBack}
            className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 text-white transition-all flex items-center gap-2 text-xs font-bold shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Events Hub
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/80 text-white transition-all shadow-xl"
              title="Share Campaign"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Info Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 border border-purple-500/40 text-purple-300 backdrop-blur-md">
              {event.category}
            </span>
            <span className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 ${
              event.status === 'LIVE' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' :
              event.status === 'ENDING_SOON' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 animate-pulse' :
              'bg-blue-500/30 text-blue-300 border border-blue-500/40'
            }`}>
              {event.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
              {event.status.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">
            {event.title}
          </h1>
          <p className="text-xs md:text-sm font-medium text-gray-300 max-w-2xl leading-relaxed drop-shadow-sm">
            {event.subtitle}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 mt-6 space-y-8">
        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Metric 1: Prize Pool */}
          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Total Prize Pool
            </span>
            <div className="text-xl font-black text-white">
              ${event.totalRewardPool.toLocaleString()} <span className="text-xs text-amber-400 font-extrabold">{event.rewardToken}</span>
            </div>
          </div>

          {/* Metric 2: Live Countdown */}
          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              {event.status === 'UPCOMING' ? 'Starts In' : 'Time Remaining'}
            </span>
            <div className="text-sm font-mono font-bold text-emerald-400">
              {countdown.days}d {countdown.hours}h {countdown.mins}m {countdown.secs}s
            </div>
          </div>

          {/* Metric 3: Participants */}
          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Global Participants
            </span>
            <div className="text-xl font-black text-white">
              {event.participantCount.toLocaleString()}
            </div>
          </div>

          {/* Metric 4: My Status */}
          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-1`}>
            <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              My Account Status
            </span>
            <div className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
              {isClaimed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Reward Claimed
                </>
              ) : isJoined ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Enrolled / Active
                </>
              ) : (
                <span className="text-gray-400">Not Registered</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-800/60 no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Overview & Rewards', icon: Sparkles },
            { id: 'ELIGIBILITY', label: 'Eligibility & Tasks', icon: ShieldCheck },
            { id: 'GUIDE', label: 'Step Guide', icon: FileText },
            { id: 'PRIZES', label: 'Prize Breakdown', icon: Trophy },
            { id: 'TIMELINE', label: 'Timeline', icon: Clock },
            { id: 'FAQS', label: 'FAQs & Terms', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW & REWARDS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Campaign Explanation */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-3`}>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Campaign Overview
                </h3>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                  {event.overview}
                </p>
              </div>

              {/* Reward Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.rewardCards.map((rc, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl border ${isDark ? 'bg-gradient-to-br from-purple-900/20 via-[#0E121B] to-gray-900 border-purple-500/30' : 'bg-gray-50 border-gray-200'} space-y-2 relative overflow-hidden`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                      {rc.title}
                    </span>
                    <div className="text-xl font-black text-white">
                      {rc.amount}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      {rc.subtext}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY & TASKS */}
          {activeTab === 'ELIGIBILITY' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-4`}>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Eligibility Checklist & Tasks
              </h3>
              <p className="text-xs text-gray-400">
                Complete all requirements below to qualify for guaranteed prize distribution upon campaign closing.
              </p>

              <div className="space-y-3 pt-2">
                {event.eligibilityRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-gray-800/80 bg-gray-900/40 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        req.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{req.title}</span>
                        <span className="text-[10px] text-gray-400">
                          {req.completed ? 'Requirement verified' : 'Action required'}
                        </span>
                      </div>
                    </div>

                    {!req.completed && onNavigateToTrading && (
                      <button
                        onClick={onNavigateToTrading}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                      >
                        {req.requiredAction || 'Complete'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STEP GUIDE */}
          {activeTab === 'GUIDE' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-6`}>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                How to Participate
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.stepGuide.map((sg) => (
                  <div
                    key={sg.stepNumber}
                    className="p-5 rounded-2xl border border-gray-800/80 bg-gray-900/40 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-black text-sm flex items-center justify-center flex-shrink-0">
                      0{sg.stepNumber}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white">{sg.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{sg.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRIZE BREAKDOWN */}
          {activeTab === 'PRIZES' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-4`}>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Prize Distribution Tiers
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 uppercase text-[10px] font-black">
                      <th className="py-3 px-4">Rank / Tier</th>
                      <th className="py-3 px-4">Reward Value</th>
                      <th className="py-3 px-4">Share %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 font-semibold text-gray-200">
                    {event.prizeBreakdown.map((pb, idx) => (
                      <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-black text-white flex items-center gap-2">
                          {pb.badge === 'gold' && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />}
                          {pb.badge === 'silver' && <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
                          {pb.badge === 'bronze' && <span className="w-2.5 h-2.5 rounded-full bg-amber-700" />}
                          {pb.rankRange}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-bold">{pb.reward}</td>
                        <td className="py-3.5 px-4 text-gray-400">{pb.percentage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE */}
          {activeTab === 'TIMELINE' && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-6`}>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Campaign Roadmap & Milestones
              </h3>

              <div className="relative border-l-2 border-purple-500/30 ml-4 pl-6 space-y-6">
                {event.timeline.map((stage, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${
                      stage.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-400' :
                      stage.status === 'ACTIVE' ? 'bg-purple-500 border-purple-300 animate-ping' :
                      'bg-gray-800 border-gray-700'
                    }`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{stage.title}</span>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          {stage.dateRange}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: FAQS & TERMS */}
          {activeTab === 'FAQS' && (
            <div className="space-y-6">
              {/* FAQs Accordion */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-4`}>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  Frequently Asked Questions
                </h3>

                <div className="space-y-3">
                  {event.faqs.map((faq, idx) => {
                    const isExpanded = expandedFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                          className="w-full p-4 text-left font-bold text-xs text-white flex items-center justify-between gap-3"
                        >
                          <span>{faq.question}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 text-xs text-gray-400 border-t border-gray-800/60 pt-3 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-3`}>
                <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider">
                  Terms & Conditions
                </h3>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-2 leading-relaxed">
                  {event.terms.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Related Events Section */}
        {relatedEvents.length > 0 && (
          <div className="pt-8 border-t border-gray-800/80 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Discover Other Active Campaigns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedEvents.map(rel => (
                <EventCard 
                  key={rel.id} 
                  event={rel} 
                  onSelect={(ev) => setEvent(ev)} 
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-[100] border-t p-4 backdrop-blur-2xl ${
        isDark ? 'bg-[#07090E]/95 border-gray-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]' : 'bg-white/95 border-gray-200 shadow-2xl'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Grand Prize Pool</span>
              <span className="text-base font-black text-white">
                ${event.totalRewardPool.toLocaleString()} <span className="text-xs text-amber-400">{event.rewardToken}</span>
              </span>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Time Remaining</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {countdown.days}d {countdown.hours}h {countdown.mins}m {countdown.secs}s
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            {isClaimed ? (
              <button
                disabled
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-sm flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle2 className="w-5 h-5" />
                Reward Claimed
              </button>
            ) : isJoined ? (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Gift className="w-5 h-5" />
                )}
                Claim Campaign Reward
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {event.status === 'UPCOMING' ? 'Pre-Register for Event' : 'Join Campaign Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
