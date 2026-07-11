import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetBreakdownItem {
  name: string;
  ticker: string;
  percentage: number;
  value: number;
  pnl: number;
  color: string;
}

export const allocationData: AssetBreakdownItem[] = [
  { name: 'Bitcoin', ticker: 'BTC', percentage: 40, value: 59313.80, pnl: 12450.00, color: '#f59e0b' },
  { name: 'Ethereum', ticker: 'ETH', percentage: 25, value: 37071.13, pnl: 5800.00, color: '#6366f1' },
  { name: 'Solana', ticker: 'SOL', percentage: 15, value: 22242.68, pnl: 3200.00, color: '#06b6d4' },
  { name: 'BNB', ticker: 'BNB', percentage: 10, value: 14828.45, pnl: -450.00, color: '#eab308' },
  { name: 'USDT', ticker: 'USDT', percentage: 5, value: 7414.23, pnl: 0.00, color: '#10b981' },
  { name: 'Others', ticker: 'OTH', percentage: 5, value: 7414.22, pnl: 340.00, color: '#d946ef' },
];

interface PortfolioAllocationProps {
  theme: 'light' | 'dark';
  selectedTicker: string | null;
  onSelectTicker: (ticker: string | null) => void;
}

export default function PortfolioAllocation({ theme, selectedTicker, onSelectTicker }: PortfolioAllocationProps) {
  const isDark = theme === 'dark';

  // Format currencies beautifully
  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  return (
    <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">Asset Allocation</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Strategic distribution of capital across major tokens.</p>
        </div>
        {selectedTicker && (
          <button 
            onClick={() => onSelectTicker(null)}
            className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/20 transition-all"
          >
            Clear Highlight
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left 5 columns: Large Donut Chart */}
        <div className="col-span-1 lg:col-span-5 flex justify-center items-center h-60 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={allocationData} 
                innerRadius={65} 
                outerRadius={85} 
                paddingAngle={4} 
                dataKey="percentage"
                cursor="pointer"
              >
                {allocationData.map((entry, index) => {
                  const isHighlighted = selectedTicker === entry.ticker;
                  const hasSelection = selectedTicker !== null;
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      onClick={() => onSelectTicker(entry.ticker)}
                      style={{
                        outline: 'none',
                        filter: hasSelection && !isHighlighted ? 'opacity(0.35)' : 'drop-shadow(0px 0px 8px rgba(255,255,255,0.05))',
                        transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.25s ease'
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as AssetBreakdownItem;
                    return (
                      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl font-mono text-[11px] text-white">
                        <div className="font-bold mb-1 text-xs" style={{ color: data.color }}>{data.name} ({data.ticker})</div>
                        <div>Allocation: {data.percentage}%</div>
                        <div>Value: {formatCurrency(data.value)}</div>
                        <div className={data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          P/L: {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text of the donut */}
          <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
            {selectedTicker ? (
              <>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-sans">
                  {allocationData.find(a => a.ticker === selectedTicker)?.name}
                </span>
                <span className="text-lg font-black text-white font-mono mt-0.5">
                  {allocationData.find(a => a.ticker === selectedTicker)?.percentage}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-sans">
                  Assets
                </span>
                <span className="text-lg font-black text-white font-mono mt-0.5">
                  6 Types
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right 7 columns: Live Breakdown Rows */}
        <div className="col-span-1 lg:col-span-7 space-y-2">
          {allocationData.map((entry, index) => {
            const isHighlighted = selectedTicker === entry.ticker;
            const hasSelection = selectedTicker !== null;
            
            return (
              <div 
                key={index}
                onClick={() => onSelectTicker(isHighlighted ? null : entry.ticker)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${isHighlighted ? 'bg-white/[0.04] border-white/15 scale-[1.01]' : hasSelection ? 'border-white/[0.01] opacity-40 hover:opacity-75' : 'border-white/5 hover:bg-white/[0.02] hover:border-white/10'}`}
              >
                {/* Left: Indicator & Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <div>
                    <span className="text-xs font-black text-white">{entry.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono ml-2">[{entry.ticker}]</span>
                  </div>
                </div>

                {/* Right: Allocation, Value, P/L */}
                <div className="flex items-center space-x-6 text-right">
                  <div className="hidden sm:block">
                    <span className="text-[10px] font-bold text-slate-400">Value</span>
                    <p className="text-xs font-bold text-white font-mono mt-0.5">{formatCurrency(entry.value)}</p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">Today P/L</span>
                    <p className={`text-xs font-black font-mono flex items-center justify-end mt-0.5 ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {entry.pnl > 0 ? '+' : ''}{entry.pnl.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </p>
                  </div>

                  <div className="w-12">
                    <span className="text-[10px] font-bold text-slate-400 block sm:hidden">Alloc</span>
                    <span className="text-xs font-black text-white font-mono">{entry.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
