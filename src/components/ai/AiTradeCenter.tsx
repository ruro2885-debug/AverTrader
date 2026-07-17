import React from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Shield, 
  Settings2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { AiTrade } from '../../types/aiTrading';
import { usePreferences } from '../../contexts/PreferencesContext';
import { aiTradingService } from '../../services/aiTradingService';
import { useAuth } from '../../contexts/AuthContext';

interface AiTradeCenterProps {
  trades: AiTrade[];
  isDark: boolean;
}

export default function AiTradeCenter({ trades, isDark }: AiTradeCenterProps) {
  const { user, addNotification } = useAuth();
  const { formatCurrency } = usePreferences();
  
  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleClose = async (trade: AiTrade) => {
    if (!user) return;
    try {
      await aiTradingService.closeTrade(user.uid, trade.id, trade.currentPrice, 'MANUAL');
      addNotification('trading', 'medium', 'Trade Closed', `Manually closed ${trade.asset} position.`);
    } catch (error) {
      addNotification('trading', 'high', 'Error', 'Failed to close position.');
    }
  };

  return (
    <div className={`rounded-2xl border ${cardClasses} overflow-hidden`}>
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} flex items-center gap-2`}>
          <Briefcase className="w-4 h-4" /> Active Position Center
        </h3>
        <span className="text-[10px] font-mono text-emerald-500">{trades.length} Active</span>
      </div>

      <div className="divide-y divide-white/5">
        {trades.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`text-xs font-bold ${textSecondary} opacity-40`}>No open trade positions</p>
          </div>
        ) : (
          trades.map((trade) => {
            const pnl = (trade.currentPrice - trade.entry) * trade.quantity;
            const isProfit = pnl >= 0;
            
            return (
              <div key={trade.id} className="p-5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10`}>
                      <span className={`text-sm font-black ${textPrimary}`}>{trade.asset[0]}</span>
                    </div>
                    <div>
                      <h4 className={`text-sm font-black ${textPrimary}`}>{trade.asset}</h4>
                      <p className={`text-[10px] font-mono ${textSecondary}`}>
                        {trade.quantity} Units @ ${trade.entry}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black font-mono ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(pnl)}
                    </p>
                    <p className={`text-[10px] font-bold ${isProfit ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                      {isProfit ? '+' : ''}{((trade.currentPrice - trade.entry) / trade.entry * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary} opacity-60`}>Stop Loss</p>
                    <div className="flex items-center justify-between">
                       <span className={`text-[11px] font-mono font-bold ${textPrimary}`}>${trade.stopLoss}</span>
                       <span className="text-[9px] text-rose-500">-{((trade.entry - trade.stopLoss) / trade.entry * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary} opacity-60`}>Take Profit</p>
                    <div className="flex items-center justify-between">
                       <span className={`text-[11px] font-mono font-bold ${textPrimary}`}>${trade.takeProfit}</span>
                       <span className="text-[9px] text-emerald-500">+{((trade.takeProfit - trade.entry) / trade.entry * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${textSecondary}`}>
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${textSecondary}`}>
                      <Shield className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleClose(trade)}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-3 h-3" />
                    Close Order
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {trades.length > 0 && (
        <div className="p-4 bg-emerald-500/5 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-black uppercase tracking-widest text-emerald-500`}>AI Assistant Status</span>
            <span className={textSecondary}>Monitoring Real-time Volatility</span>
          </div>
        </div>
      )}
    </div>
  );
}
