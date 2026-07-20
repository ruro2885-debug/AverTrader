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
import { AiTrade, AiRecommendation } from '../../types/aiTrading';

interface AiPerformanceHubProps {
  isDark: boolean;
  trades?: AiTrade[];
  recommendations?: AiRecommendation[];
}

export default function AiPerformanceHub({ isDark, trades = [], recommendations = [] }: AiPerformanceHubProps) {
  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const closedTrades = React.useMemo(() => trades.filter(t => t.status === 'CLOSED'), [trades]);
  const totalTradesCount = trades.length;

  // 1. Calculate accuracy (win rate)
  const accuracyResult = React.useMemo(() => {
    if (closedTrades.length === 0) {
      return { value: 84.2, isLive: false };
    }
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    return { value: parseFloat(winRate.toFixed(1)), isLive: true };
  }, [closedTrades]);

  // 2. Calculate average holding time
  const avgHoldingTime = React.useMemo(() => {
    if (closedTrades.length === 0) {
      return { text: '6.4h', isLive: false };
    }
    let totalMs = 0;
    let validCount = 0;
    closedTrades.forEach(t => {
      const openTime = t.openedAt?.toDate ? t.openedAt.toDate().getTime() : new Date(t.openedAt as any).getTime();
      const closeTime = t.closedAt?.toDate ? t.closedAt.toDate().getTime() : new Date(t.closedAt as any).getTime();
      if (closeTime && openTime) {
        totalMs += (closeTime - openTime);
        validCount++;
      }
    });
    if (validCount === 0) return { text: 'N/A', isLive: true };
    const avgHours = (totalMs / validCount) / 3600000;
    if (avgHours < 1) {
      const mins = Math.round(avgHours * 60);
      return { text: `${mins}m`, isLive: true };
    }
    return { text: `${avgHours.toFixed(1)}h`, isLive: true };
  }, [closedTrades]);

  // 3. Calculate profit factor
  const profitFactor = React.useMemo(() => {
    if (closedTrades.length === 0) {
      return { value: '3.2', isLive: false };
    }
    const grossProfit = closedTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = closedTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);
    if (grossLoss === 0) {
      return { value: grossProfit > 0 ? '9.9+' : '0.0', isLive: true };
    }
    return { value: (grossProfit / grossLoss).toFixed(2), isLive: true };
  }, [closedTrades]);

  // 4. Construct Cumulative Intelligence return chart
  const chartData = React.useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Map Javascript day indexes (0=Sunday, 1=Monday... 6=Saturday) to the ordered list
    const dayIndices = [1, 2, 3, 4, 5, 6, 0];

    const actualPnlByDay = dayIndices.map((idx, dayArrIdx) => {
      const dayTrades = closedTrades.filter(t => {
        const closeDate = t.closedAt?.toDate ? t.closedAt.toDate() : new Date(t.closedAt as any);
        return closeDate.getDay() === idx;
      });
      const daySum = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      return daySum;
    });

    const hasAnyRealPnl = actualPnlByDay.some(val => val !== 0);

    return daysOfWeek.map((dayName, arrIdx) => {
      // Static baseline if no live trades
      const mockPnL = [240, 480, -120, 840, 650, 920, 1100][arrIdx];
      const realPnL = actualPnlByDay[arrIdx];
      return {
        name: dayName,
        pnl: hasAnyRealPnl ? parseFloat(realPnL.toFixed(2)) : mockPnL
      };
    });
  }, [closedTrades]);

  // 5. Calculate recommendation distribution
  const distributionData = React.useMemo(() => {
    const acceptedRecommendationIds = new Set(trades.map(t => t.recommendationId));
    const acceptedCount = recommendations.filter(r => acceptedRecommendationIds.has(r.id)).length;
    const totalRecs = recommendations.length;
    
    if (totalRecs === 0) {
      return {
        data: [
          { name: 'Accepted', value: 78, color: '#00D09C' },
          { name: 'Rejected', value: 22, color: '#f43f5e' },
        ],
        acceptedPercent: 78,
        rejectedPercent: 22,
        isLive: false
      };
    }
    
    const acceptedPercent = (acceptedCount / totalRecs) * 100;
    const rejectedPercent = 100 - acceptedPercent;
    
    return {
      data: [
        { name: 'Accepted', value: parseFloat(acceptedPercent.toFixed(1)), color: '#00D09C' },
        { name: 'Rejected', value: parseFloat(rejectedPercent.toFixed(1)), color: '#f43f5e' },
      ],
      acceptedPercent: parseFloat(acceptedPercent.toFixed(1)),
      rejectedPercent: parseFloat(rejectedPercent.toFixed(1)),
      isLive: true
    };
  }, [recommendations, trades]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          label="Strategy Accuracy" 
          value={`${accuracyResult.value}%`} 
          trend={accuracyResult.isLive ? "Live Sync" : "Baseline"} 
          isPositive={accuracyResult.value >= 50} 
          icon={<Target className="w-4 h-4 text-[#00D09C]" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Total Trades" 
          value={totalTradesCount.toString()} 
          trend="Cumulative" 
          isPositive={true} 
          icon={<Activity className="w-4 h-4 text-blue-500" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Avg Holding Time" 
          value={avgHoldingTime.text} 
          trend={avgHoldingTime.isLive ? "Live Sync" : "Baseline"} 
          isPositive={true} 
          icon={<Clock className="w-4 h-4 text-amber-500" />} 
          isDark={isDark} 
        />
        <MetricCard 
          label="Profit Factor" 
          value={profitFactor.value} 
          trend={profitFactor.isLive ? "Live Sync" : "Baseline"} 
          isPositive={parseFloat(profitFactor.value) >= 1.0} 
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
            <span className={`text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/5 ${textSecondary}`}>
              {closedTrades.length > 0 ? "LIVE EXECUTIVE RETURN" : "SIMULATED TRAJECTORY"}
            </span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                <BarChart data={distributionData.data}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {distributionData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className={textSecondary}>Accepted (Live Execution)</span>
                <span className={`font-black ${textPrimary}`}>{distributionData.acceptedPercent}%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={textSecondary}>Rejected (Ignored/Dismissed)</span>
                <span className={`font-black ${textPrimary}`}>{distributionData.rejectedPercent}%</span>
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
