import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Zap, Target, Clock, ShieldCheck, Activity } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface AiPerformanceHubProps {
  isDark: boolean;
}

const mockChartData = [
  { name: 'Mon', pnl: 240 },
  { name: 'Tue', pnl: 480 },
  { name: 'Wed', pnl: -120 },
  { name: 'Thu', pnl: 840 },
  { name: 'Fri', pnl: 650 },
  { name: 'Sat', pnl: 920 },
  { name: 'Sun', pnl: 1100 },
];

const distributionData = [
  { name: 'Accepted', value: 78, color: '#00D09C' },
  { name: 'Rejected', value: 22, color: '#f43f5e' },
];

export default function AiPerformanceHub({ isDark }: AiPerformanceHubProps) {
  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Strategy Accuracy" 
          value="84.2%" 
          trend="+2.1%" 
          isPositive={true} 
          icon={<Target className="w-4 h-4 text-[#00D09C]" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Total Trades" 
          value="142" 
          trend="+12" 
          isPositive={true} 
          icon={<Activity className="w-4 h-4 text-blue-500" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Avg Holding Time" 
          value="6.4h" 
          trend="-15m" 
          isPositive={true} 
          icon={<Clock className="w-4 h-4 text-amber-500" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Profit Factor" 
          value="3.2" 
          trend="+0.4" 
          isPositive={true} 
          icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} 
          isDark={isDark} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PnL Curve */}
        <div className={`lg:col-span-2 rounded-2xl border ${cardClasses} p-6`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-sm font-black uppercase tracking-widest ${textSecondary} flex items-center gap-2`}>
              <TrendingUp className="w-4 h-4 text-[#00D09C]" /> Cumulative Intelligence Return
            </h3>
            <select className={`bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold ${textSecondary} outline-none`}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D09C" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00D09C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} 
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#0F172A' : '#fff', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#00D09C" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPnl)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution */}
        <div className={`rounded-2xl border ${cardClasses} p-6 flex flex-col`}>
          <h3 className={`text-sm font-black uppercase tracking-widest ${textSecondary} mb-8 flex items-center gap-2`}>
            <BarChart3 className="w-4 h-4 text-blue-500" /> Recommendation Distribution
          </h3>
          
          <div className="flex-1 space-y-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className={textSecondary}>Accepted (Live Execution)</span>
                <span className={`font-black ${textPrimary}`}>78.4%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={textSecondary}>Rejected (Ignored/Dismissed)</span>
                <span className={`font-black ${textPrimary}`}>21.6%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, isPositive, icon, isDark }: any) {
  return (
    <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
        <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
