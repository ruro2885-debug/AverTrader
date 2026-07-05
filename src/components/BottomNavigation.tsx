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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          if (item.id === 'ai') {
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(item.id)}
                className="relative -mt-10 p-3 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] border-4 border-slate-950"
              >
                <item.icon className="w-8 h-8 text-black" />
                <span className="absolute -bottom-6 text-[10px] font-medium text-emerald-500">AI</span>
              </motion.button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center space-y-1 p-2 transition-colors duration-200 ${
                isActive ? 'text-emerald-400' : 'text-gray-500'
              }`}
            >
              <item.icon className={`w-7 h-7 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
