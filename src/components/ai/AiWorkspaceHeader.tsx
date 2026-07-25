import { Play, Square, Activity, AlertCircle, Clock, Moon } from 'lucide-react';
import { AiSession } from '../../types/aiTrading';
import { EngineStatus } from '../../services/aiTradingService';

interface AiWorkspaceHeaderProps {
  session: AiSession | null;
  engineStatus: EngineStatus;
  onStart: () => void;
  onEnd: () => void;
  isDark: boolean;
  hasPrefs: boolean;
  disabled?: boolean;
}

export default function AiWorkspaceHeader({ session, engineStatus, onStart, onEnd, isDark, hasPrefs, disabled }: AiWorkspaceHeaderProps) {
  const isActive = session?.status === 'ACTIVE';
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          AI Trading Workspace
        </h1>
        {isActive ? (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            engineStatus.state === 'SESSION_SCANNING' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          }`}>
            <span className="flex h-2 w-2 relative">
              {engineStatus.state === 'SESSION_SCANNING' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                engineStatus.state === 'SESSION_SCANNING' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest">
              {engineStatus.state === 'SESSION_SCANNING' ? 'Live Session' : engineStatus.state === 'COOLING_BREAK' ? 'AI Cooling' : 'AI Sleeping'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inactive</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 mt-2">
        {!hasPrefs ? (
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Please configure your AI Profile first</span>
          </div>
        ) : isActive ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onEnd}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-rose-500/20"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Terminate Session</span>
            </button>
            
            {(engineStatus.state === 'SLEEPING' || engineStatus.state === 'COOLING_BREAK') && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold">
                {engineStatus.state === 'SLEEPING' ? <Moon className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{engineStatus.reason}</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={disabled ? undefined : onStart}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg ${
              disabled 
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/20 shadow-none'
                : 'bg-[#00D09C] hover:bg-[#00B585] text-black active:scale-95 shadow-[#00D09C]/20'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch session</span>
          </button>
        )}
      </div>
    </div>
  );
}
