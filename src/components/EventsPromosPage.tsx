import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Bell, RefreshCw, Clock } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';

const getEventEndTime = () => {
  const saved = localStorage.getItem('aver_event_end_time');
  if (saved) {
    const time = parseInt(saved, 10);
    if (time > Date.now()) {
      return new Date(time);
    }
  }
  const newTime = Date.now() + 3 * 24 * 60 * 60 * 1000;
  localStorage.setItem('aver_event_end_time', newTime.toString());
  return new Date(newTime);
};

export default function EventsPromosPage({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const isDark = theme === 'dark';
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl"
    : "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-lg";

  const [eventEndTime, setEventEndTime] = useState(getEventEndTime);
  const { days, hours, minutes, seconds } = useCountdown(eventEndTime);
  const isEnded = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  const [isPromptVisible, setPromptVisible] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isEnded) {
      setActiveEvents([
        {
          id: '3',
          title: 'Next Gen Alpha Tournament',
          subtitle: 'The championship has ended. Join the new alpha tournament.',
          participants: '1,050',
          type: 'new'
        },
        {
          id: '4',
          title: 'Margin Boost Week',
          subtitle: 'Get 2x leverage on selected pairs for this week only.',
          participants: '8,200',
          type: 'promo'
        }
      ]);
    } else {
      setActiveEvents([
        {
          id: '1',
          title: 'AI Trading Championship',
          subtitle: 'Compete for the top spot and share the $50,000 prize pool.',
          participants: '5,230',
          type: 'competition'
        },
        {
          id: '2',
          title: 'Zero-Fee Weekend',
          subtitle: 'Execute high-frequency trades with 0% maker/taker fees.',
          participants: '12,050',
          type: 'promo'
        }
      ]);
    }
  }, [isEnded]);

  const handleJoinConfirm = () => {
    console.log('Joining event with wallet:', walletAddress);
    setPromptVisible(false);
    setWalletAddress('');
  };

  const handleRefresh = () => {
    const newTime = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('aver_event_end_time', newTime.toString());
    setEventEndTime(new Date(newTime));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`absolute inset-0 z-50 overflow-y-auto ${isDark ? 'bg-[#0B0E14] text-white' : 'bg-slate-50 text-slate-900'}`}
    >
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 h-[60px] flex items-center justify-between px-4 border-b backdrop-blur-md ${isDark ? 'bg-[#0B0E14]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white leading-tight">Events &<br/>Promotions</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"><Search className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"><Bell className="w-5 h-5" /></button>
          <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 pt-[76px] space-y-6 pb-32">
        {activeEvents.map((event) => (
          <section key={event.id} className={`rounded-[24px] p-6 ${cardClasses} relative overflow-hidden bg-gradient-to-r from-purple-900/20 to-blue-900/20`}>
            <div className="relative z-10">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isEnded && event.id === '1' ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {isEnded && event.id === '1' ? 'Ended' : 'Live Now'}
              </span>
              <h2 className="text-2xl font-black mt-2 mb-1">{event.title}</h2>
              <p className="text-slate-400 text-sm mb-4">{event.subtitle}</p>
              
              <div className="flex items-center gap-4 text-sm font-bold text-white mb-6">
                  {event.type === 'competition' && !isEnded && (
                    <div className='flex items-center gap-1.5'>
                      <Clock className='w-4 h-4 text-emerald-500' /> 
                      {days}d : {hours}h : {minutes}m : {seconds}s
                    </div>
                  )}
                  {event.type === 'competition' && isEnded && (
                     <div className='flex items-center gap-1.5 text-rose-400'>
                       <Clock className='w-4 h-4' /> Event Ended
                     </div>
                  )}
                  <div>{event.participants} Participants</div>
              </div>
              
              <button 
                onClick={() => setPromptVisible(true)}
                disabled={isEnded && event.id === '1'}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                  isEnded && event.id === '1' 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isEnded && event.id === '1' ? 'Registration Closed' : 'Join Event'}
              </button>
            </div>
          </section>
        ))}
      </div>

      {/* Join Event Prompt Modal */}
      {isPromptVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#16182e] rounded-2xl p-6 border border-[#2a2e43]">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Entry</h3>
            <p className="text-slate-400 text-sm mb-6">
              Enter your designated trading wallet address to register for the championship bracket.
            </p>
            <input
              type="text"
              placeholder="0x..."
              className="w-full bg-[#0a0b10] text-white rounded-xl p-4 mb-6 border border-[#3b2574] focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setPromptVisible(false)}
                className="px-6 py-3 rounded-xl text-purple-400 font-bold text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleJoinConfirm}
                disabled={!walletAddress}
                className={`px-6 py-3 rounded-xl text-white font-bold text-sm transition-colors ${!walletAddress ? 'bg-purple-900 opacity-60 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
