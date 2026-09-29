import React, { useState } from 'react';
import { Settings, HelpCircle, X, Globe, DollarSign } from 'lucide-react';

export default function QuickHub({ theme }: { theme: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="p-3.5 rounded-full bg-slate-900 border border-white/20 text-white hover:bg-slate-800 shadow-2xl cursor-pointer transition-transform active:scale-95"
        title="Quick Preferences & FAQ"
      >
        <Settings className="w-5 h-5 text-emerald-400" />
      </button>

      {open && (
        <div className="absolute bottom-16 right-0 w-80 p-6 rounded-3xl border border-white/20 bg-slate-950/95 text-white shadow-2xl backdrop-blur-2xl space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-base font-black">System Preferences</h4>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="space-y-3 font-extrabold text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-white/10">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Language
              </span>
              <span className="text-emerald-400">English (US)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-white/10">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Base Currency
              </span>
              <span className="text-emerald-400">USD ($)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
