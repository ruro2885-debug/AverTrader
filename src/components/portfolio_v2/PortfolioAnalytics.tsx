import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Activity, 
  TrendingUp, 
  Gauge, 
  Maximize2, 
  Minimize2, 
  Award, 
  AlertTriangle, 
  Calendar,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MetricTile {
  label: string;
  value: string;
  subText: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}

export default function PortfolioAnalytics({ theme }: { theme: 'light' | 'dark' }) {
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const portfolio = user?.portfolio;
  const holdings = user?.holdings || [];

  const largestPosition = holdings.length > 0 
    ? [...holdings].sort((a, b) => b.allocationPct - a.allocationPct)[0]
    : null;
  
  const smallestPosition = holdings.length > 0
    ? [...holdings].sort((a, b) => a.allocationPct - b.allocationPct)[0]
    : null;

  const bestPerformer = holdings.length > 0
    ? [...holdings].sort((a, b) => b.pnl - a.pnl)[0]
    : null;

  const worstPerformer = holdings.length > 0
    ? [...holdings].sort((a, b) => a.pnl - b.pnl)[0]
    : null;

  const metrics: MetricTile[] = [
    {
      label: 'Portfolio Health',
      value: `${portfolio?.healthScore || 0}/100`,
      subText: portfolio?.healthScore && portfolio.healthScore > 90 ? 'Extremely Solid Score' : 'Monitoring required',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: portfolio?.healthScore && portfolio.healthScore > 90 ? 'Excellent' : 'Stable',
      badgeColor: 'bg-emerald-500/20 text-emerald-400'
    },
    {
      label: 'Diversification',
      value: portfolio?.diversificationScore && portfolio.diversificationScore > 80 ? 'Highly Optimized' : 'Needs Rebalance',
      subText: `${holdings.length} Assets properly weighted`,
      icon: Layers,
      iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      badge: `${portfolio?.diversificationScore || 0}%`,
      badgeColor: 'bg-indigo-500/20 text-indigo-400'
    },
    {
      label: 'Annualized Volatility',
      value: `${portfolio?.volatility || 0}%`,
      subText: portfolio?.volatility && portfolio.volatility < 15 ? 'Moderate-Low risk profile' : 'High volatility profile',
      icon: Activity,
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      label: 'Sharpe Ratio',
      value: `${portfolio?.sharpeRatio || 0}`,
      subText: portfolio?.sharpeRatio && portfolio.sharpeRatio > 2 ? 'Strong risk-adjusted yield' : 'Standard yield curve',
      icon: Gauge,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: portfolio?.sharpeRatio && portfolio.sharpeRatio > 2 ? 'S-Tier' : 'A-Tier',
      badgeColor: 'bg-amber-500/20 text-amber-400'
    },
    {
      label: 'Largest Position',
      value: largestPosition ? `${largestPosition.name} (${largestPosition.ticker})` : 'None',
      subText: `${largestPosition?.allocationPct || 0}% of total allocation`,
      icon: Maximize2,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Best Performer',
      value: bestPerformer ? `${bestPerformer.name} (${bestPerformer.ticker})` : 'None',
      subText: `+$${bestPerformer?.pnl.toLocaleString()} cumulative`,
      icon: Award,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: `${bestPerformer?.change24H || 0}%`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400'
    },
    {
      label: 'Worst Performer',
      value: worstPerformer ? `${worstPerformer.name} (${worstPerformer.ticker})` : 'None',
      subText: `$${worstPerformer?.pnl.toLocaleString()} performance`,
      icon: AlertTriangle,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      badge: `${worstPerformer?.change24H || 0}%`,
      badgeColor: 'bg-rose-500/20 text-rose-400'
    },
    {
      label: 'Win Rate',
      value: `${portfolio?.winRate || 0}%`,
      subText: 'Successful AI/Manual trade ratio',
      icon: TrendingUp,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  return (
    <div className="w-[96%] mx-auto bg-gradient-to-br from-[#0c0d16] to-[#08080c] border border-white/5 rounded-2xl p-6 sm:p-7 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">Performance Analytics</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">Deep quantitative risk-return ratios and asset metrics.</p>
        </div>
        <HelpCircle className="w-4 h-4 text-slate-500 hover:text-white transition-colors cursor-help" title="These parameters are computed based on modern portfolio theories (MPT)." />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div 
              key={i} 
              className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg border ${m.iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {m.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${m.badgeColor}`}>
                      {m.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {m.label}
                </span>
                <p className="text-sm sm:text-base font-black text-white mt-1 leading-tight">
                  {m.value}
                </p>
              </div>
              
              <div className="text-[9px] text-slate-500 font-bold mt-3 border-t border-white/[0.02] pt-1.5">
                {m.subText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
