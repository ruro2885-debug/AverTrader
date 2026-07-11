import React, { useState } from 'react';
import { Search, Settings, ArrowLeft, X } from 'lucide-react';

interface PortfolioHeaderV2Props {
  theme: 'light' | 'dark';
  onBack: () => void;
  onSearchChange?: (val: string) => void;
  onOpenSettings?: () => void;
}

export default function PortfolioHeaderV2({ theme, onBack, onSearchChange, onOpenSettings }: PortfolioHeaderV2Props) {
  const isDark = theme === 'dark';
  const [isSearching, setIsSearching] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    if (onSearchChange) onSearchChange(val);
  };

  const clearSearch = () => {
    setSearchVal('');
    if (onSearchChange) onSearchChange('');
    setIsSearching(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#000000] border-b border-white/5 h-[80px] px-4 flex items-center justify-between box-border">
      {!isSearching ? (
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Portfolio
          </h1>
          <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            View your assets
          </div>
        </div>
      ) : (
        <div className="flex-1 relative z-10 animate-fade-in">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Search assets in portfolio..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              autoFocus
            />
            {searchVal && (
              <button 
                onClick={() => handleSearchChange({ target: { value: '' } } as any)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 z-10 ml-auto">
        <button 
          onClick={() => setIsSearching(!isSearching)}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${isSearching ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'}`}
          title="Search Portfolio"
        >
          <Search className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          title="Portfolio Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
