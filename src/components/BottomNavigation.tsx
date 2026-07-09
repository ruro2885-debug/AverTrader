import React from 'react';
import { House, ChartCandlestick, Bot, Wallet, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { usePreferences } from '../contexts/PreferencesContext';

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
  const { t } = usePreferences();
  const navItems: NavItem[] = [
    { name: t('common.home'), icon: House, id: 'home' },
    { name: t('common.market'), icon: ChartCandlestick, id: 'markets' },
    { name: t('common.ai'), icon: Bot, id: 'ai' },
    { name: t('common.portfolio'), icon: Wallet, id: 'portfolio' },
    { name: t('common.discover'), icon: Compass, id: 'discover' },
  ];

  return (
    <div className="fixed bottom-[16px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'rgba(18, 22, 28, 0.35)', // Exactly requested Glass Color bg: rgba(18,22,28,0.35)
          borderColor: 'rgba(255, 255, 255, 0.18)', // Exactly requested Glass Color border: rgba(255,255,255,0.18)
          borderTopColor: 'rgba(255, 255, 255, 0.35)', // Highly polished top reflection
          borderBottomColor: 'rgba(0, 0, 0, 0.30)',    // Faint bottom shadow/border
          boxShadow: `
            0 16px 36px rgba(0, 0, 0, 0.30), 
            0 8px 24px rgba(16, 185, 129, 0.12), 
            inset 0 1.5px 0.5px rgba(255, 255, 255, 0.32), 
            inset 0 -1.5px 1px rgba(0, 0, 0, 0.40),
            inset 0 4px 12px rgba(255, 255, 255, 0.08),
            inset 0 -4px 12px rgba(0, 0, 0, 0.20)
          `,
        }}
        className="relative w-[90%] max-w-md h-[58px] backdrop-blur-[36px] backdrop-saturate-[2.0] border rounded-[30px] flex items-center justify-between px-5 pointer-events-auto overflow-visible"
      >
        {/* Dynamic Refraction & Bevel Highlight Layer */}
        <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none select-none">
          {/* Glass frosting in the center, edges remaining clearer */}
          <div className="absolute inset-[1.5px] rounded-[28.5px] bg-gradient-to-b from-white/[0.03] via-transparent to-black/[0.03] pointer-events-none" />

          {/* Polished Glass light reflection/sheen across the upper third */}
          <div className="absolute top-0 left-0 right-0 h-[35%] bg-gradient-to-b from-white/[0.12] to-transparent" />
          
          {/* Curved glares to simulate 3D volume & edge reflections */}
          <div className="absolute top-0 bottom-0 left-[20%] w-[35%] bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent transform -skew-x-12" />
          <div className="absolute top-0 bottom-0 right-[25%] w-[20%] bg-gradient-to-bl from-transparent via-emerald-500/[0.02] to-transparent transform skew-x-12" />
          
          {/* Subtle green ambient glass reflections inside from Aver branding */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] via-transparent to-emerald-500/[0.02]" />
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          if (item.id === 'ai') {
            return (
              <div key={item.id} className="relative flex justify-center items-center w-12 h-12">
                {/* Tiny green light/ambient glow beneath */}
                <div className="absolute bottom-[-16px] w-6 h-[4px] bg-emerald-500/40 blur-[3px] rounded-full pointer-events-none" />

                <motion.button
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    backgroundColor: 'rgba(18, 22, 28, 0.55)',
                    borderColor: 'rgba(255, 255, 255, 0.22)',
                    borderTopColor: 'rgba(255, 255, 255, 0.45)', // very bright rim highlight
                    boxShadow: `
                      0 4px 12px rgba(0, 0, 0, 0.30),
                      0 2px 6px rgba(16, 185, 129, 0.20),
                      inset 0 1px 0.5px rgba(255, 255, 255, 0.40),
                      inset 0 -1px 1px rgba(0, 0, 0, 0.5),
                      inset 0 3px 6px rgba(16, 185, 129, 0.15)
                    `
                  }}
                  className="absolute -top-[10px] w-[38px] h-[38px] rounded-full flex items-center justify-center z-20 cursor-pointer border focus:outline-none backdrop-blur-xl"
                >
                  {/* Frosted emerald breathing core */}
                  <motion.div
                    animate={{
                      opacity: [0.35, 0.65, 0.35],
                      scale: [0.95, 1.05, 0.95]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0.5 rounded-full bg-emerald-500/20 pointer-events-none blur-[1px]"
                  />

                  {/* Glass thickness internal reflection highlight */}
                  <div className="absolute top-0.5 left-1 w-2.5 h-1 bg-white/25 rounded-full filter blur-[0.5px] rotate-[15deg] pointer-events-none" />

                  {/* Only the icon glows brightly */}
                  <item.icon className="relative w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.95)]" />
                </motion.button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center w-[54px] h-[48px] cursor-pointer group focus:outline-none select-none"
            >
              {/* Active Glass lens reflection */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 0 10px rgba(16, 185, 129, 0.15)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 28
                  }}
                  className="absolute inset-0 rounded-full border backdrop-blur-md"
                />
              )}

              {/* Icon & Label Container - Icons look engraved beneath the glass surface */}
              <motion.div
                animate={{
                  scale: isActive ? 1.05 : 1,
                  y: isActive ? -1 : 0
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="relative flex flex-col items-center justify-center z-10 pointer-events-none"
              >
                <item.icon 
                  className={`w-[22px] h-[22px] transition-all duration-220 ${
                    isActive 
                      ? 'text-white drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]' 
                      : 'text-white/65 group-hover:text-white/95 group-active:text-white'
                  }`} 
                />
                <span 
                  className={`text-[11px] font-semibold mt-0.5 tracking-wide transition-colors duration-220 ${
                    isActive 
                      ? 'text-emerald-400 font-bold drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]' 
                      : 'text-white/65 group-hover:text-white/95 group-active:text-white'
                  }`}
                >
                  {item.name}
                </span>
              </motion.div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
