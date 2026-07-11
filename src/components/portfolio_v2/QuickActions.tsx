import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Zap } from 'lucide-react';

interface QuickActionsProps {
  theme: 'light' | 'dark';
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenTransfer?: () => void;
  onNavigate?: (tab: string) => void;
}

export default function QuickActions({ 
  theme, 
  onOpenDeposit, 
  onOpenWithdraw, 
  onOpenTransfer, 
  onNavigate 
}: QuickActionsProps) {
  const isDark = theme === 'dark';
  
  // Custom ripple-like action trigger
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const actions = [
    { 
      label: 'Deposit', 
      sub: 'Fund your wallet',
      icon: ArrowDownRight, 
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => {
        if (onOpenDeposit) onOpenDeposit();
        else alert("Deposit module initialized.");
      }
    },
    { 
      label: 'Withdraw', 
      sub: 'Cash out assets',
      icon: ArrowUpRight, 
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      action: () => {
        if (onOpenWithdraw) onOpenWithdraw();
        else alert("Withdrawal module initialized.");
      }
    },
    { 
      label: 'Transfer', 
      sub: 'Move within accounts',
      icon: Zap, 
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      action: () => {
        if (onOpenTransfer) onOpenTransfer();
        else alert("Inter-account Transfer features: Available soon.");
      }
    },
    { 
      label: 'Trade', 
      sub: 'Spot & futures order',
      icon: ArrowRightLeft, 
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      action: () => {
        if (onNavigate) onNavigate('markets');
        else alert("Navigating to trading markets.");
      }
    },
  ];

  const handleAction = (index: number, callback: () => void) => {
    setClickedIndex(index);
    setTimeout(() => {
      setClickedIndex(null);
      callback();
    }, 180);
  };

  return (
    <div className="w-[96%] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {actions.map((a, i) => {
        const Icon = a.icon;
        const isClicked = clickedIndex === i;
        
        return (
          <button 
            key={i} 
            onClick={() => handleAction(i, a.action)}
            className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none text-left ${isClicked ? 'scale-[0.97] bg-slate-800 border-white/20' : 'bg-[#0a0c12] border-white/5 hover:bg-[#11141e] hover:border-white/10 active:scale-95'}`}
          >
            {/* Ripple effect overlay */}
            {isClicked && (
              <span className="absolute inset-0 bg-emerald-500/5 animate-ping pointer-events-none" />
            )}
            
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">{a.label}</span>
              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{a.sub}</span>
            </div>

            <div className={`p-2.5 rounded-lg border ${a.color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
