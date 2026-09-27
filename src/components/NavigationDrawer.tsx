import React from 'react';
import { X, ArrowRight, Shield, Cpu, Activity, HelpCircle, Terminal, Info, ExternalLink } from 'lucide-react';
import AverLogo from './AverLogo';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (routeOrSection: string) => void;
  theme?: 'light' | 'dark';
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  onNavigate,
  theme = 'dark'
}: NavigationDrawerProps) {
  if (!isOpen) return null;

  const handleLinkClick = (dest: string) => {
    onClose();
    onNavigate(dest);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm h-full bg-[#07090e] border-l border-slate-800/80 shadow-2xl z-10 flex flex-col justify-between p-6 text-slate-200 overflow-y-auto">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
            <button 
              type="button"
              onClick={() => handleLinkClick('hero')} 
              className="focus:outline-none cursor-pointer"
            >
              <AverLogo theme="dark" size={32} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Upper Menu Links */}
          <nav className="py-6 flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleLinkClick('tech')}
              className="flex items-center gap-3.5 py-3 px-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <Cpu size={18} className="text-emerald-400" />
              <span>Technology Innovations</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('features')}
              className="flex items-center gap-3.5 py-3 px-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <Activity size={18} className="text-teal-400" />
              <span>Platform &amp; Ecosystem</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('stats')}
              className="flex items-center gap-3.5 py-3 px-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <Shield size={18} className="text-cyan-400" />
              <span>Performance Verification</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('showcase')}
              className="flex items-center gap-3.5 py-3 px-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <HelpCircle size={18} className="text-amber-400" />
              <span>Help &amp; Knowledge Center</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className="flex items-center gap-3.5 py-3 px-3 rounded-xl text-left text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-900/40 transition-colors cursor-pointer"
            >
              <Terminal size={18} className="text-emerald-400" />
              <span>Admin Terminal</span>
            </button>
          </nav>
        </div>

        {/* Footer Area with Dedicated About Us button above copyright */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          
          {/* Dedicated About Us Button */}
          <div className="my-2">
            <button
              type="button"
              onClick={() => handleLinkClick('about')}
              className="group w-full flex items-center justify-between py-2 text-base font-semibold text-slate-200 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <span className="tracking-wide flex items-center gap-2">
                <Info size={18} className="text-emerald-400" />
                About Us
              </span>
            </button>
          </div>

          {/* Target Position: Directly above copyright text */}
          <p className="text-xs font-mono text-slate-500 tracking-wider">
            © 2022–2026 AVER TECHNOLOGIES. ALL RIGHTS RESERVED.
          </p>

          {/* Risk Disclaimer and Entity Notice text */}
          <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed font-sans">
            <p>
              Risk Disclosure: All operations and balances within the workspace are virtual sandbox allocations provided solely for presentation. Performance metrics demonstrated on historical configurations do not guarantee future execution optimization.
            </p>
            <p>
              Entity Notice: AVER Technologies (avertrader.space) is an independent proprietary trading workspace and AI execution platform. AverTrader is not affiliated with, sponsored by, or connected to AvaTrade (avatrade.com) or any third-party broker.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
