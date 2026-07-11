import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Layers, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PortfolioOverviewProps {
  theme: 'light' | 'dark';
}

export default function PortfolioOverview({ theme }: PortfolioOverviewProps) {
  const { user } = useAuth();
  
  // Real data from AuthContext
  const portfolio = user?.portfolio || {
    totalValue: 0,
    todayPnL: 0,
    todayPnLPercent: 0,
    overallReturn: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    healthScore: 0,
    diversificationScore: 0,
    volatility: 0,
    sharpeRatio: 0,
    winRate: 0,
    maxDrawdown: 0,
    recoveryFactor: 0,
    riskAdjustedReturn: 0
  };

  const totalValue = portfolio.totalValue;
  const growthPct = portfolio.overallReturn;
  const todayProfit = portfolio.todayPnL;
  const todayProfitPct = portfolio.todayPnLPercent;
  const overallProfit = portfolio.realizedPnL + portfolio.unrealizedPnL;
  const overallProfitPct = portfolio.overallReturn;
  const availableBalance = user?.availableBalance || 0;
  const investedCapital = totalValue - availableBalance;
  
  // Indicators
  const healthScore = portfolio.healthScore;
  const riskRating = portfolio.volatility > 20 ? "High" : portfolio.volatility > 10 ? "Moderate" : "Low";
  const diversification = portfolio.diversificationScore > 80 ? "Highly Optimized" : portfolio.diversificationScore > 50 ? "Moderate" : "Low";
  const lastUpdated = "Just now";

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-[#0e0f14] to-[#12141c] border border-white/5 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
      {/* Visual glowing border accent */}
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-indigo-500/20" />
      
      {/* Row 1: Header values */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
        <div>
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Total Portfolio Value
          </span>
          <div className="flex items-baseline space-x-3 mt-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-sans">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className="text-sm font-mono text-slate-400">USD</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
          <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div className="text-right">
            <div className="text-xs text-slate-400 font-bold leading-none">Overall Growth</div>
            <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
              +{growthPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Four Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Today's Profit */}
        <div className="bg-white/[0.02] border border-white/[0.03] p-3 sm:p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Today's Profit</span>
            <span className="flex items-center text-[10px] text-emerald-400 font-bold">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +{todayProfitPct}%
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
            +${todayProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Overall Profit */}
        <div className="bg-white/[0.02] border border-white/[0.03] p-3 sm:p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Overall Profit</span>
            <span className="flex items-center text-[10px] text-emerald-400 font-bold">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +{overallProfitPct}%
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-1">
            +${overallProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Available Balance */}
        <div className="bg-white/[0.02] border border-white/[0.03] p-3 sm:p-4 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">Available Balance</span>
          <p className="text-lg sm:text-xl font-black text-white font-mono mt-1">
            ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Invested Capital */}
        <div className="bg-white/[0.02] border border-white/[0.03] p-3 sm:p-4 rounded-xl">
          <span className="text-xs font-semibold text-slate-400 block">Invested Capital</span>
          <p className="text-lg sm:text-xl font-black text-slate-300 font-mono mt-1">
            ${investedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Row 3: Quality Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/5 text-[11px] font-bold text-slate-400">
        <div className="flex items-center space-x-2 bg-white/[0.01] px-3 py-1.5 rounded-lg border border-white/[0.02]">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Portfolio Health: <span className="text-emerald-400 font-mono font-black">{healthScore}/100</span></span>
        </div>
        <div className="flex items-center space-x-2 bg-white/[0.01] px-3 py-1.5 rounded-lg border border-white/[0.02]">
          <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
          <span>Risk Level: <span className="text-yellow-400 font-black">{riskRating}</span></span>
        </div>
        <div className="flex items-center space-x-2 bg-white/[0.01] px-3 py-1.5 rounded-lg border border-white/[0.02]">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Diversification: <span className="text-indigo-400 font-black">{diversification}</span></span>
        </div>
        <div className="flex items-center space-x-2 bg-white/[0.01] px-3 py-1.5 rounded-lg border border-white/[0.02] justify-self-start md:justify-self-end">
          <RefreshCw className="w-3 h-3 text-slate-500 animate-spin-slow" />
          <span>Synced: <span className="text-slate-300 font-mono font-medium">{lastUpdated}</span></span>
        </div>
      </div>
    </div>
  );
}
