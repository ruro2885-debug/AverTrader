import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import PortfolioHeaderV2 from './PortfolioHeaderV2';
import PortfolioChart from './PortfolioChart';
import QuickActions from './QuickActions';
import PortfolioAllocation from './PortfolioAllocation';
import PortfolioHoldings from './PortfolioHoldings';
import PortfolioTransactions from './PortfolioTransactions';
import PortfolioAnalytics from './PortfolioAnalytics';
import PortfolioAIInsights from './PortfolioAIInsights';
import PortfolioRisk from './PortfolioRisk';
import PortfolioYield from './PortfolioYield';
import PortfolioNews from './PortfolioNews';

interface PortfolioViewV2Props {
  theme: 'light' | 'dark';
  onBack: () => void;
  onNavigate?: (tab: string) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export default function PortfolioViewV2({ 
  theme, 
  onBack, 
  onNavigate, 
  onOpenDeposit, 
  onOpenWithdraw 
}: PortfolioViewV2Props) {
  // Sync state between Asset Allocation and My Holdings
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perf' | 'alloc'>('perf');

  // Modular data for the "Terminal" view in Allocation
  const terminalData = [
    { label: 'Total Portfolio Value', value: '$148,284.51', color: 'text-white' },
    { label: 'Available Balance', value: '$50,000.00', color: 'text-slate-300' },
    { label: 'Invested Capital', value: '$98,284.51', color: 'text-slate-400' },
    { label: "Today's Profit", value: '+$1,250.00', color: 'text-emerald-400' },
    { label: 'Overall Profit', value: '+$45,000.00', color: 'text-emerald-500' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="min-h-screen bg-[#000000] text-white w-full flex flex-col relative"
    >
      {/* 1. PORTFOLIO HEADER */}
      <PortfolioHeaderV2 
        theme={theme} 
        onBack={onBack} 
        onSearchChange={(val) => {
          if (val) {
            const upper = val.toUpperCase().trim();
            setSelectedTicker(upper);
          } else {
            setSelectedTicker(null);
          }
        }}
        onOpenSettings={() => alert("Portfolio Settings: Advanced API keys, custom risk weights, and database synchronization profiles.")}
      />

      {/* Main scrollable body workspace */}
      <div className="flex-1 overflow-y-auto w-full pt-[80px]">
        <div className="w-full max-w-[1400px] mx-auto flex flex-col items-center">
          
          {/* TABBED NAVIGATION - Terminal Style */}
          <div className="w-[96%] mx-auto mt-8 flex gap-3 p-1.5 bg-white/[0.03] rounded-full border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('perf')}
              className={`flex-1 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'perf' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-white'}`}
            >
              Performance
            </button>
            <button 
              onClick={() => setActiveTab('alloc')}
              className={`flex-1 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'alloc' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-white'}`}
            >
              Allocation
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'perf' ? (
              <motion.div 
                key="perf"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                {/* 3. INTERACTIVE CANDLESTICK CHART */}
                <div className="w-[96%] mx-auto mt-7">
                  <PortfolioChart theme={theme} />
                </div>

                {/* 4. QUICK ACTIONS */}
                <div className="w-[96%] mx-auto mt-6">
                  <QuickActions 
                    theme={theme} 
                    onOpenDeposit={onOpenDeposit}
                    onOpenWithdraw={onOpenWithdraw}
                    onOpenTransfer={() => alert("Inter-account Transfer: Transferring funds to paper futures or margin pools is optimized for immediate settlement.")}
                    onNavigate={onNavigate}
                  />
                </div>

                {/* 6.5 TRANSACTIONS / HISTORY */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioTransactions theme={theme} />
                </div>

                {/* 7. PERFORMANCE ANALYTICS */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioAnalytics theme={theme} />
                </div>

                {/* 8. AI PORTFOLIO INTELLIGENCE */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioAIInsights theme={theme} />
                </div>

                {/* 11. MARKET NEWS */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioNews theme={theme} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="alloc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                {/* Account Overview - Terminal Style Data Rows */}
                <div className="w-[96%] mx-auto mt-8 p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl">
                  <div className="flex items-center space-x-2 mb-6 border-b border-white/5 pb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500">Account Terminal</h3>
                  </div>
                  <div className="space-y-1">
                    {terminalData.map((data, idx) => (
                      <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{data.label}</span>
                        <span className={`text-xl font-black font-mono ${data.color}`}>{data.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. ASSET ALLOCATION (Donut + Breakdown) */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioAllocation 
                    theme={theme} 
                    selectedTicker={selectedTicker}
                    onSelectTicker={(ticker) => setSelectedTicker(ticker)}
                  />
                </div>

                {/* 6. MY HOLDINGS (Expansion rows) */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioHoldings 
                    theme={theme} 
                    selectedTicker={selectedTicker}
                    onSelectTicker={(ticker) => setSelectedTicker(ticker)}
                  />
                </div>

                {/* 9. RISK ANALYSIS */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioRisk theme={theme} />
                </div>

                {/* 10. EARN & YIELD */}
                <div className="w-[96%] mx-auto mt-8">
                  <PortfolioYield theme={theme} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 12. BOTTOM PADDING */}
          <div className="h-[120px] w-full" />
        </div>
      </div>
    </motion.div>
  );
}
