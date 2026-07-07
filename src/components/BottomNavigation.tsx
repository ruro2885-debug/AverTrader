import React from 'react';
import { House, ChartCandlestick, Bot, Wallet, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItem {
  name: string;
  icon: React.ElementType;
  id: string;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navItems: NavItem[] = [
    { name: 'Home', icon: House, id: 'home' },
    { name: 'Markets', icon: ChartCandlestick, id: 'markets' },
    { name: 'AI', icon: Bot, id: 'ai' },
    { name: 'Portfolio', icon: Wallet, id: 'portfolio' },
    { name: 'Discover', icon: Compass, id: 'discover' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 pb-safe flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm h-[48px] bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-[0_5px_20px_rgba(0,0,0,0.5)] flex items-center justify-between px-4 pointer-events-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          if (item.id === 'ai') {
            return (
              <div key={item.id} className="relative flex justify-center w-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(item.id)}
                  className="absolute -bottom-2 w-[40px] h-[40px] rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.4)] flex items-center justify-center z-10"
                >
                  <motion.div 
                    animate={{ boxShadow: ['0 0 0 0 rgba(16,185,129,0.4)', '0 0 0 8px rgba(16,185,129,0)'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full"
                  />
                  <item.icon className="w-4 h-4 text-white stroke-2" />
                </motion.button>
              </div>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center space-y-0 w-10 transition-colors duration-200 group"
            >
              <item.icon 
                className={`w-[18px] h-[18px] transition-colors duration-300 ${
                  isActive ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400 group-hover:text-slate-300 stroke-[1.5px]'
                }`} 
              />
              <span 
                className={`text-[8px] font-medium transition-colors duration-300 ${
                  isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
