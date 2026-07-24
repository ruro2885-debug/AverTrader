import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  RotateCw, 
  ShieldAlert, 
  Sparkles, 
  Trophy, 
  Flame, 
  Users, 
  Coins, 
  SlidersHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  Gift 
} from 'lucide-react';
import { EventItem, EventCategory, EventStatus } from '../types/events';
import { subscribeToEvents, joinEventService, claimEventRewardService } from '../services/eventsService';
import { useAuth } from '../contexts/AuthContext';
import EventCard from './events/EventCard';
import EventAdminModal from './events/EventAdminModal';
import EventDetailsPage from './events/EventDetailsPage';

interface EventsPromosPageProps {
  onBack?: () => void;
  onNavigateToTrading?: () => void;
  theme?: 'light' | 'dark';
}

const CATEGORIES: { id: EventCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Promotions' },
  { id: 'Trading Competition', label: 'Trading Competitions' },
  { id: 'Airdrop Sprint', label: 'Airdrop Sprints' },
  { id: 'Staking & Yield', label: 'Staking & Yield' },
  { id: 'VIP Quest', label: 'VIP Quests' },
  { id: 'New Listing', label: 'New Listings' }
];

const STATUS_FILTERS: { id: EventStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'LIVE', label: 'Live Now' },
  { id: 'ENDING_SOON', label: 'Ending Soon' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'COMPLETED', label: 'Completed' }
];

export default function EventsPromosPage({
  onBack,
  onNavigateToTrading,
  theme = 'dark'
}: EventsPromosPageProps) {
  const isDark = theme === 'dark';
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'ALL'>('ALL');
  const [activeStatus, setActiveStatus] = useState<EventStatus | 'ALL'>('ALL');

  // Hero Carousel Index
  const [heroIndex, setHeroIndex] = useState<number>(0);

  // Subscribe to Firestore events stream
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToEvents(
      (data) => {
        setEvents(data);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Failed fetching events:", err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsub();
  }, []);

  const featuredEvents = useMemo(() => {
    return events.filter(e => e.featured || e.status === 'LIVE').slice(0, 4);
  }, [events]);

  // Hero Carousel auto-rotation
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % featuredEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.status === 'ARCHIVED' || e.status === 'PAUSED') return false;

      // Category filter
      if (activeCategory !== 'ALL' && e.category !== activeCategory) return false;

      // Status filter
      if (activeStatus !== 'ALL') {
        if (activeStatus === 'ENDING_SOON') {
          if (e.status !== 'ENDING_SOON' && e.status !== 'LIVE') return false;
        } else if (e.status !== activeStatus) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSub = e.subtitle.toLowerCase().includes(q);
        const matchToken = e.rewardToken.toLowerCase().includes(q);
        const matchCat = e.category.toLowerCase().includes(q);
        const matchTags = e.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSub && !matchToken && !matchCat && !matchTags) return false;
      }

      return true;
    });
  }, [events, activeCategory, activeStatus, searchQuery]);

  // Total Platform Metrics
  const totalPrizePool = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.totalRewardPool || 0), 0);
  }, [events]);

  const totalParticipants = useMemo(() => {
    return events.reduce((sum, e) => sum + (e.participantCount || 0), 0);
  }, [events]);

  const activeEventsCount = useMemo(() => {
    return events.filter(e => e.status === 'LIVE' || e.status === 'ENDING_SOON').length;
  }, [events]);

  const myJoinedCount = useMemo(() => {
    return events.filter(e => e.userProgress?.joined).length;
  }, [events]);

  const handleJoinQuick = async (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await joinEventService(user?.uid, event.id);
  };

  const handleClaimQuick = async (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    await claimEventRewardService(user?.uid, event);
  };

  // If a full-screen event is selected, render EventDetailsPage
  if (selectedEventId) {
    return (
      <EventDetailsPage
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
        onNavigateToTrading={onNavigateToTrading}
        theme={theme}
      />
    );
  }

  const currentHero = featuredEvents[heroIndex] || events[0];

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#07090E] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Bar Header */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-2xl ${
        isDark ? 'bg-[#07090E]/90 border-gray-800/80' : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                Events & Promos
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Aver Hub
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-medium hidden sm:block">
                Participate in world-class trading competitions, airdrops, and yield carnivals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-gray-300 transition-all ${
                refreshing ? 'animate-spin text-purple-400' : ''
              }`}
              title="Refresh Campaigns"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/10"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Admin Console</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-8">
        {/* Featured Hero Carousel Banner */}
        {currentHero && (
          <div className="relative w-full rounded-3xl overflow-hidden border border-gray-800/80 shadow-2xl bg-gray-900">
            <div className="relative h-[260px] md:h-[320px] w-full">
              <img 
                src={currentHero.bannerUrl} 
                alt={currentHero.title} 
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${currentHero.heroGradient || 'from-[#07090E] via-[#07090E]/80 to-transparent'}`} />

              {/* Hero Content Overlay */}
              <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Campaign
                  </span>

                  {featuredEvents.length > 1 && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10">
                      {featuredEvents.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            heroIndex === idx ? 'w-6 bg-purple-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-w-2xl">
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    {currentHero.title}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-300 font-medium line-clamp-2 leading-relaxed">
                    {currentHero.subtitle}
                  </p>

                  <div className="pt-2 flex items-center gap-4">
                    <button
                      onClick={() => setSelectedEventId(currentHero.id)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group"
                    >
                      Explore Campaign
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="hidden sm:block">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Reward Pool</span>
                      <span className="text-base font-black text-white">
                        ${currentHero.totalRewardPool.toLocaleString()} <span className="text-xs text-amber-400">{currentHero.rewardToken}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Platform Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Active Campaigns</span>
              <span className="text-lg font-black text-white">{activeEventsCount} Live Now</span>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Total Reward Pool</span>
              <span className="text-lg font-black text-white">${totalPrizePool.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Global Traders</span>
              <span className="text-lg font-black text-white">{totalParticipants.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block">My Enrolled</span>
              <span className="text-lg font-black text-purple-400">{myJoinedCount} Joined</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, token ticker (SOL, USDT), tag, or category..."
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-xs font-semibold focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-[#0E121B] border-gray-800 text-white focus:border-purple-500' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500'
                }`}
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {STATUS_FILTERS.map(st => (
                <button
                  key={st.id}
                  onClick={() => setActiveStatus(st.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeStatus === st.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-gray-900/60 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/60 border border-gray-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Promotion Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 rounded-3xl bg-gray-800/50" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center ${isDark ? 'bg-[#0E121B] border-gray-800' : 'bg-white border-gray-200'} space-y-3`}>
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-black text-white">No promotions found</h3>
            <p className="text-xs text-gray-400">Try adjusting your search query or switching filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); setActiveStatus('ALL'); }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={(ev) => setSelectedEventId(ev.id)}
                onJoin={handleJoinQuick}
                onClaim={handleClaimQuick}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin Management Modal */}
      <EventAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        events={events}
        theme={theme}
      />
    </div>
  );
}
