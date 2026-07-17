import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Bell, RefreshCw, Trophy, Target, Zap, Clock, ChevronRight } from 'lucide-react';

export default function EventsPromosPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Sticky Header */}
      <header className={`sticky top-0 z-40 h-[60px] flex items-center justify-between px-4 border-b backdrop-blur-md ${isDark ? 'bg-black/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white">Events & Promotions</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400"><Search className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400"><Bell className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Featured Live Event */}
        <section className={`rounded-[24px] p-6 ${cardClasses} relative overflow-hidden bg-gradient-to-r from-purple-900/20 to-blue-900/20`}>
          <div className="relative z-10">
            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">Live Now</span>
            <h2 className="text-2xl font-black mt-2 mb-1">AI Trading Championship</h2>
            <p className="text-slate-400 text-sm mb-4">Compete for the top spot and share the $50,000 prize pool.</p>
            <div className="flex items-center gap-4 text-sm font-bold text-white mb-6">
                <div className='flex items-center gap-1.5'><Clock className='w-4 h-4 text-emerald-500' /> 02d : 14h : 30m</div>
                <div>5,230 Participants</div>
            </div>
            <button className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm">Join Event</button>
          </div>
        </section>

        {/* Placeholder for other sections */}
        <div className={`p-6 rounded-[24px] ${cardClasses}`}>
           <p className="text-slate-400 text-sm">Active Campaigns, Missions, Live Competitions, and Reward Center will be implemented.</p>
        </div>
      </div>
    </motion.div>
  );
}
