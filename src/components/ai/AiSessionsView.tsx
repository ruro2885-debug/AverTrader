import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Plus, 
  Trash2, 
  Info, 
  CheckCircle,
  Coffee,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { TradingSchedule } from '../../types/aiTrading';

interface AiSessionsViewProps {
  schedule: TradingSchedule;
  onSaveSchedule: (newSchedule: TradingSchedule) => Promise<void>;
  isDark: boolean;
}

export default function AiSessionsView({ schedule, onSaveSchedule, isDark }: AiSessionsViewProps) {
  const [localSchedule, setLocalSchedule] = useState<TradingSchedule>({ ...schedule });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setLocalSchedule({ ...schedule });
  }, [schedule]);

  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSchedule(localSchedule);
    } finally {
      setSaving(false);
    }
  };

  const addSession = () => {
    setLocalSchedule(prev => ({
      ...prev,
      sessions: [...prev.sessions, { start: '09:00', end: '17:00' }]
    }));
  };

  const removeSession = (index: number) => {
    setLocalSchedule(prev => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index)
    }));
  };

  const updateSession = (index: number, key: 'start' | 'end', val: string) => {
    setLocalSchedule(prev => {
      const nextSessions = [...prev.sessions];
      nextSessions[index] = { ...nextSessions[index], [key]: val };
      return { ...prev, sessions: nextSessions };
    });
  };

  const addBreak = () => {
    setLocalSchedule(prev => ({
      ...prev,
      breakPeriods: [...prev.breakPeriods, { start: '12:00', end: '13:00' }]
    }));
  };

  const removeBreak = (index: number) => {
    setLocalSchedule(prev => ({
      ...prev,
      breakPeriods: prev.breakPeriods.filter((_, i) => i !== index)
    }));
  };

  const updateBreak = (index: number, key: 'start' | 'end', val: string) => {
    setLocalSchedule(prev => {
      const nextBreaks = [...prev.breakPeriods];
      nextBreaks[index] = { ...nextBreaks[index], [key]: val };
      return { ...prev, breakPeriods: nextBreaks };
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${textPrimary}`}>
            <Calendar className="w-5 h-5 text-[#00D09C]" /> Neural Schedule Manager
          </h2>
          <p className={`text-xs ${textSecondary} mt-1`}>
            Configure automated search windows, regular session pauses, and macro holiday exclusions.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/10"
        >
          {saving ? 'Saving...' : 'Save Sessions Schedule'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Ranges */}
          <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} flex items-center gap-2`}>
                <Clock className="w-4 h-4 text-[#00D09C]" /> Active Search Sessions
              </h3>
              <button 
                onClick={addSession}
                className="text-[10px] font-black text-[#00D09C] flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Window
              </button>
            </div>

            <p className={`text-xs ${textSecondary}`}>
              Specify local windows during which the AI scans order books and initiates recommendations.
            </p>

            <div className="space-y-3">
              {localSchedule.sessions.map((sess, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                  <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">Start Time</span>
                      <input 
                        type="time" 
                        value={sess.start} 
                        onChange={(e) => updateSession(idx, 'start', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">End Time</span>
                      <input 
                        type="time" 
                        value={sess.end} 
                        onChange={(e) => updateSession(idx, 'end', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>
                  {localSchedule.sessions.length > 1 && (
                    <button 
                      onClick={() => removeSession(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors self-end"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Break Periods */}
          <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} flex items-center gap-2`}>
                <Coffee className="w-4 h-4 text-blue-500" /> Neural Cooling breaks
              </h3>
              <button 
                onClick={addBreak}
                className="text-[10px] font-black text-[#00D09C] flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Break
              </button>
            </div>

            <p className={`text-xs ${textSecondary}`}>
              The engine stands down and evaluates historical positions during break periods to reduce rapid noise loops.
            </p>

            <div className="space-y-3">
              {localSchedule.breakPeriods.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-white/10 rounded-xl">
                  <p className={`text-xs ${textSecondary} opacity-40`}>No regular break periods configured.</p>
                </div>
              ) : (
                localSchedule.breakPeriods.map((brk, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                    <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">Start Break</span>
                        <input 
                          type="time" 
                          value={brk.start} 
                          onChange={(e) => updateBreak(idx, 'start', e.target.value)}
                          className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block mb-1">End Break</span>
                        <input 
                          type="time" 
                          value={brk.end} 
                          onChange={(e) => updateBreak(idx, 'end', e.target.value)}
                          className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeBreak(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors self-end"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Global Settings Side Panel */}
        <div className="space-y-6">
          {/* Day Filters */}
          <div className={`rounded-2xl border p-6 space-y-6 ${cardClasses}`}>
            <h3 className={`text-xs font-black uppercase tracking-widest ${textSecondary} flex items-center gap-2`}>
              <Globe className="w-4 h-4 text-[#00D09C]" /> Regional Parameters
            </h3>

            <div className="space-y-2">
              <label className={`block text-xs font-bold ${textSecondary}`}>Reference Timezone</label>
              <select 
                value={localSchedule.timezone}
                onChange={(e) => setLocalSchedule(prev => ({ ...prev, timezone: e.target.value }))}
                className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
              >
                <option value="UTC">Coordinated Universal (UTC)</option>
                <option value="EST">Eastern Standard (EST)</option>
                <option value="PST">Pacific Standard (PST)</option>
                <option value="GMT">Greenwich Mean (GMT)</option>
              </select>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-black ${textPrimary}`}>Monitor Weekdays</p>
                  <p className={`text-[10px] ${textSecondary}`}>Monday through Friday</p>
                </div>
                <button 
                  onClick={() => setLocalSchedule(prev => ({ ...prev, weekdays: !prev.weekdays }))}
                  className={`w-10 h-5 rounded-full relative transition-all ${localSchedule.weekdays ? 'bg-[#00D09C]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${localSchedule.weekdays ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-black ${textPrimary}`}>Monitor Weekends</p>
                  <p className={`text-[10px] ${textSecondary}`}>Saturday and Sunday</p>
                </div>
                <button 
                  onClick={() => setLocalSchedule(prev => ({ ...prev, weekends: !prev.weekends }))}
                  className={`w-10 h-5 rounded-full relative transition-all ${localSchedule.weekends ? 'bg-[#00D09C]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${localSchedule.weekends ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-black ${textPrimary}`}>Exclude Holidays</p>
                  <p className={`text-[10px] ${textSecondary}`}>Exclude global market holidays</p>
                </div>
                <button 
                  onClick={() => setLocalSchedule(prev => ({ ...prev, excludeHolidays: !prev.excludeHolidays }))}
                  className={`w-10 h-5 rounded-full relative transition-all ${localSchedule.excludeHolidays ? 'bg-[#00D09C]' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${localSchedule.excludeHolidays ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Visual Timeline representation */}
          <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
            <h4 className={`text-xs font-black uppercase tracking-widest ${textSecondary}`}>24h Interactive Timeline</h4>
            <div className="h-6 w-full bg-black/40 rounded-lg relative overflow-hidden flex border border-white/5">
              {/* 24 divisions */}
              {Array.from({ length: 24 }).map((_, i) => {
                // Find if this hour lies in any session
                const hour = i;
                const isSession = localSchedule.sessions.some(s => {
                  const startHour = parseInt(s.start.split(':')[0]);
                  const endHour = parseInt(s.end.split(':')[0]);
                  return hour >= startHour && hour < endHour;
                });
                const isBreak = localSchedule.breakPeriods.some(b => {
                  const startHour = parseInt(b.start.split(':')[0]);
                  const endHour = parseInt(b.end.split(':')[0]);
                  return hour >= startHour && hour < endHour;
                });

                let bgClass = 'bg-white/5';
                if (isSession) bgClass = 'bg-[#00D09C]/40';
                if (isBreak) bgClass = 'bg-indigo-500/40';

                return (
                  <div 
                    key={i} 
                    className={`flex-1 h-full border-r border-white/5 ${bgClass}`} 
                    title={`${hour}:00`} 
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>00:00</span>
              <span>12:00</span>
              <span>24:00</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] pt-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-[#00D09C]/40 rounded-sm" />
                <span className={textSecondary}>Session Scanning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-indigo-500/40 rounded-sm" />
                <span className={textSecondary}>Engine Break</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
