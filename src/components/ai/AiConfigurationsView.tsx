import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Globe, 
  Calendar, 
  ShieldAlert, 
  Download, 
  Upload, 
  HelpCircle, 
  Play, 
  Settings,
  Brain,
  Layers,
  ArrowRight,
  Info,
  Archive,
  RefreshCw,
  Clock,
  Coins
} from 'lucide-react';
import { AiConfiguration, RiskRating } from '../../types/aiTrading';
import { Timestamp } from 'firebase/firestore';

interface AiConfigurationsViewProps {
  configs: AiConfiguration[];
  activeConfigId: string | undefined;
  onSave: (config: AiConfiguration) => Promise<void>;
  onDelete: (configId: string) => Promise<void>;
  onDuplicate: (configId: string) => Promise<void>;
  onActivate: (configId: string) => Promise<void>;
  onStartSession: (configId: string, markets: string[]) => Promise<void>;
  isDark: boolean;
  userId: string;
}

const defaultNewConfig = (userId: string): AiConfiguration => ({
  id: `cfg_${Date.now()}`,
  ownerId: userId,
  name: 'Alpha Quant Momentum',
  description: 'An aggressive swing-trading model optimized for high-volatility crypto and tech equities.',
  version: 1,
  createdAt: Timestamp.now(),
  lastModified: Timestamp.now(),
  status: 'INACTIVE',
  markets: ['BTC', 'ETH', 'SOL', 'AAPL', 'NVDA'],
  strategy: 'NEURAL_MOMENTUM',
  schedule: {
    sessions: [{ start: '08:00', end: '16:00' }],
    weekdays: true,
    weekends: false,
    timezone: 'UTC',
    breakPeriods: [{ start: '12:00', end: '13:00' }],
    excludeHolidays: true
  },
  riskControls: {
    maxPositionSize: 5000,
    maxSimultaneousPositions: 4,
    exposureLimit: 20000,
    positionSizingPreference: 'PERCENTAGE',
    lossLimit: 10
  },
  recommendationRules: {
    minConfidence: 82,
    allowedAssetClasses: ['CRYPTO', 'STOCKS'],
    indicators: ['RSI', 'MACD', 'EMA']
  },
  notificationPreferences: {
    newRecommendations: true,
    tradeExecutions: true,
    marketAlerts: true
  },
  advancedBehavior: {
    enableDeepAnalysis: true,
    useSentimentGrounding: true,
    neuralConfidenceThreshold: 85
  }
});

export default function AiConfigurationsView({
  configs,
  activeConfigId,
  onSave,
  onDelete,
  onDuplicate,
  onActivate,
  onStartSession,
  isDark,
  userId
}: AiConfigurationsViewProps) {
  const [editingConfig, setEditingConfig] = useState<AiConfiguration | null>(null);
  const [activeStep, setActiveStep] = useState<'general' | 'markets' | 'schedule' | 'risk' | 'rules' | 'advanced'>('general');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleCreateNew = () => {
    const fresh = defaultNewConfig(userId || 'guest_user');
    setEditingConfig(fresh);
    setIsCreating(true);
    setActiveStep('general');
    setIsSaved(false);
  };

  const handleEdit = (cfg: AiConfiguration) => {
    setEditingConfig({ ...cfg });
    setIsCreating(false);
    setActiveStep('general');
    setIsSaved(false);
  };

  const handleFieldChange = (section: keyof AiConfiguration | null, field: string, value: any) => {
    if (!editingConfig) return;
    setEditingConfig(prev => {
      if (!prev) return null;
      if (section === null) {
        return { ...prev, [field]: value };
      } else {
        const sectData = prev[section] as any;
        return {
          ...prev,
          [section]: {
            ...sectData,
            [field]: value
          }
        };
      }
    });
  };

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    
    // Simple validation
    if (!editingConfig.name || editingConfig.name.trim() === '') {
      alert('Please enter a configuration name.');
      return;
    }
    if (editingConfig.riskControls.maxPositionSize <= 0) {
      alert('Please enter a valid max position size greater than 0.');
      return;
    }

    const configToSave = editingConfig;
    setIsSaving(true);
    setEditingConfig(null);
    setIsSaved(true);
    
    await onSave(configToSave);
    setIsSaving(false);
  };

  const handleExport = (cfg: AiConfiguration) => {
    const configData = { ...cfg };
    // Remove internal metadata before export if any, but keep logic
    const jsonString = JSON.stringify(configData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      alert('Configuration serialized and copied to clipboard.');
    }).catch(err => {
      console.error('Clipboard failed, falling back to download:', err);
    });

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${cfg.name.toLowerCase().replace(/\s+/g, '_')}_config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = async () => {
    try {
      if (!importText.trim()) throw new Error('Empty input');
      const parsed = JSON.parse(importText);
      
      // Strict validation
      if (!parsed.name || !parsed.strategy || !parsed.riskControls || !parsed.recommendationRules || !parsed.schedule) {
        throw new Error('Incomplete configuration structure. Missing critical strategy or risk parameters.');
      }

      const imported: AiConfiguration = {
        ...parsed,
        id: `cfg_import_${Date.now()}`,
        ownerId: configs[0]?.ownerId || 'unknown',
        status: 'INACTIVE',
        createdAt: Timestamp.now(),
        lastModified: Timestamp.now()
      };
      
      await onSave(imported);
      setShowImportModal(false);
      setImportText('');
      alert('Configuration imported successfully with perfect logic synchronization.');
    } catch (e: any) {
      alert(`Import Failed: ${e.message || 'Invalid JSON structure'}`);
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {!editingConfig ? (
        <>
          {/* Header Dashboard & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className={`text-xl font-black flex items-center gap-2 ${textPrimary}`}>
                <Sliders className="w-5 h-5 text-[#00D09C]" /> Neural Configurations Manager
              </h2>
              <p className={`text-xs ${textSecondary} mt-1`}>
                Design, clone, duplicate, and execute deep-learning configurations across spot and margin indexes.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowImportModal(true)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-black transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              >
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/10 ml-auto"
              >
                <Plus className="w-4 h-4" /> Create Configuration
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="text"
              placeholder="Search active configurations, risk strategies, or schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 text-xs px-4 py-3 bg-black/10 dark:bg-white/5 border border-white/5 rounded-xl outline-none ${textPrimary} focus:border-[#00D09C]`}
            />
          </div>

          {/* Config Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredConfigs.map(cfg => {
              const isActive = cfg.id === activeConfigId;
              return (
                <div 
                  key={cfg.id} 
                  className={`rounded-2xl border p-6 transition-all relative overflow-hidden flex flex-col justify-between ${cardClasses} ${isActive ? 'ring-2 ring-[#00D09C]' : ''}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border ${isActive ? 'border-[#00D09C] text-[#00D09C]' : 'border-white/10 text-slate-400'}`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={`text-sm font-black ${textPrimary}`}>{cfg.name}</h3>
                          <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-[#00D09C]' : 'text-slate-500'}`}>
                            {isActive ? 'CURRENTLY ACTIVE' : 'STANDBY MODE'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                          cfg.strategy === 'NEURAL_MOMENTUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {cfg.strategy.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className={`text-xs ${textSecondary} mb-6 leading-relaxed`}>
                      {cfg.description}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6 border-t border-b border-white/5 py-4">
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Risk Threshold</p>
                        <p className={`text-xs font-bold ${textPrimary} mt-1`}>
                          {cfg.riskControls.lossLimit}% Risk Limit
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Monitored</p>
                        <p className={`text-xs font-bold ${textPrimary} mt-1`}>
                          {cfg.markets.length} Indexes
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Confidence</p>
                        <p className={`text-xs font-bold text-emerald-500 mt-1`}>
                          &gt; {cfg.recommendationRules.minConfidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(cfg)}
                        className={`px-3 py-1.5 border rounded-lg text-[10px] font-black transition-all ${isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                      >
                        Configure
                      </button>
                      <button 
                        onClick={() => onDuplicate(cfg.id)}
                        className={`p-1.5 border rounded-lg text-slate-400 hover:text-white transition-colors ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleExport(cfg)}
                        className={`p-1.5 border rounded-lg text-slate-400 hover:text-white transition-colors ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {cfg.id !== activeConfigId && (
                        <button
                          onClick={() => onDelete(cfg.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Configuration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isActive ? (
                        <button
                          onClick={() => onActivate(cfg.id)}
                          className="px-3 py-1.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-lg text-[10px] font-black transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#00D09C] px-3 py-1.5 bg-[#00D09C]/10 rounded-lg">
                          Active Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Configuration Editor UI (Multi-Step Tabs) */
        <div className={`rounded-3xl border ${cardClasses} overflow-hidden`}>
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00D09C]/10 border border-[#00D09C]/30 rounded-xl">
                <Sliders className="w-5 h-5 text-[#00D09C]" />
              </div>
              <div>
                <h3 className={`text-lg font-black ${textPrimary}`}>
                  {isCreating ? 'Engine Builder' : 'Neural Editor'} &mdash; {editingConfig.name}
                </h3>
                <p className={`text-xs ${textSecondary} mt-0.5`}>
                  Modify analytical rules, risk-protection margins, and execution schedules.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingConfig(null)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {isSaved ? 'Back to Configurations' : 'Cancel Changes'}
              </button>
              {isSaved ? (
                <button
                  onClick={() => onStartSession(editingConfig.id, editingConfig.markets)}
                  className="px-5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/20 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Session
                </button>
              ) : (
                <button
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/20"
                >
                  Save Configuration
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/5 min-h-[500px]">
            {/* Steps Left Panel */}
            <div className="p-4 space-y-1 bg-black/5 lg:col-span-1">
              <StepButton active={activeStep === 'general'} onClick={() => setActiveStep('general')} label="1. General Profile" icon={<Layers className="w-4 h-4" />} />
              <StepButton active={activeStep === 'markets'} onClick={() => setActiveStep('markets')} label="2. Markets & Indexes" icon={<Globe className="w-4 h-4" />} />
              <StepButton active={activeStep === 'schedule'} onClick={() => setActiveStep('schedule')} label="3. Trading Schedule" icon={<Calendar className="w-4 h-4" />} />
              <StepButton active={activeStep === 'risk'} onClick={() => setActiveStep('risk')} label="4. Risk Controls" icon={<ShieldAlert className="w-4 h-4" />} />
              <StepButton active={activeStep === 'rules'} onClick={() => setActiveStep('rules')} label="5. Intelligence Rules" icon={<Brain className="w-4 h-4" />} />
              <StepButton active={activeStep === 'advanced'} onClick={() => setActiveStep('advanced')} label="6. Advanced Settings" icon={<Settings className="w-4 h-4" />} />
            </div>

            {/* Editing Work Area */}
            <div className="p-8 lg:col-span-3 space-y-6">
              {activeStep === 'general' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>General Configuration</h4>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Profile Name</label>
                    <input 
                      type="text" 
                      value={editingConfig.name}
                      onChange={(e) => handleFieldChange(null, 'name', e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      placeholder="e.g. Ultra Alpha Momentum"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Description</label>
                    <textarea 
                      value={editingConfig.description}
                      onChange={(e) => handleFieldChange(null, 'description', e.target.value)}
                      className={`w-full h-24 bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      placeholder="Enter details of this configuration..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Core Strategy Model</label>
                    <select 
                      value={editingConfig.strategy}
                      onChange={(e) => handleFieldChange(null, 'strategy', e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                    >
                      <option value="NEURAL_MOMENTUM">Neural Momentum (High Win Rate)</option>
                      <option value="VOLATILITY_BREAKOUT">Volatility Breakout (High Risk/Reward)</option>
                      <option value="MEAN_REVERSION">Mean Reversion (Range Trading)</option>
                      <option value="QUANT_GRID">Quant Grid Scalper (Ultra-Fast)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeStep === 'markets' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Market and Indexes Scope</h4>
                  
                  <div className="space-y-4 p-5 rounded-2xl bg-black/10 border border-white/5">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className={`font-bold ${textPrimary}`}>What does this setting do?</p>
                        <p className={`${textSecondary} mt-1`}>
                          Determines which trade pairs and assets the neural engine parses. Limiting markets reduces noise and focuses capital.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Preferred Trading Pairs</label>
                    <div className="flex flex-wrap gap-2">
                      {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'].map(m => {
                        const included = editingConfig.markets.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const next = included 
                                ? editingConfig.markets.filter(x => x !== m)
                                : [...editingConfig.markets, m];
                              handleFieldChange(null, 'markets', next);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                              included 
                                ? 'bg-[#00D09C]/10 border-[#00D09C] text-[#00D09C]'
                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'schedule' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Trading Sessions Schedule</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Select Timezone</label>
                      <select 
                        value={editingConfig.schedule.timezone}
                        onChange={(e) => handleFieldChange('schedule', 'timezone', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      >
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="EST">Eastern Standard Time (EST)</option>
                        <option value="PST">Pacific Standard Time (PST)</option>
                        <option value="GMT">Greenwich Mean Time (GMT)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Excluded Days</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('schedule', 'weekdays', !editingConfig.schedule.weekdays)}
                          className={`flex-1 py-3 rounded-xl border text-[10px] font-black transition-all ${
                            editingConfig.schedule.weekdays ? 'bg-[#00D09C]/10 border-[#00D09C] text-[#00D09C]' : 'bg-white/5 border-white/5 text-slate-500'
                          }`}
                        >
                          WEEKDAYS
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('schedule', 'weekends', !editingConfig.schedule.weekends)}
                          className={`flex-1 py-3 rounded-xl border text-[10px] font-black transition-all ${
                            editingConfig.schedule.weekends ? 'bg-[#00D09C]/10 border-[#00D09C] text-[#00D09C]' : 'bg-white/5 border-white/5 text-slate-500'
                          }`}
                        >
                          WEEKENDS
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Active Session Start/End</label>
                    <div className="flex gap-4">
                      <input 
                        type="time" 
                        value={editingConfig.schedule.sessions[0]?.start || '08:00'}
                        onChange={(e) => {
                          const s = [...editingConfig.schedule.sessions];
                          s[0] = { ...s[0], start: e.target.value };
                          handleFieldChange('schedule', 'sessions', s);
                        }}
                        className={`flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                      <input 
                        type="time" 
                        value={editingConfig.schedule.sessions[0]?.end || '16:00'}
                        onChange={(e) => {
                          const s = [...editingConfig.schedule.sessions];
                          s[0] = { ...s[0], end: e.target.value };
                          handleFieldChange('schedule', 'sessions', s);
                        }}
                        className={`flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'risk' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Neural Risk controls</h4>

                  <div className="space-y-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <p className={`font-bold text-rose-500`}>Why would someone change these settings?</p>
                        <p className={`${textSecondary} mt-1`}>
                          Tighter stop limits reduce drawdowns but may exit positions during normal high-volatility spikes before a turnaround. Balance with style.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Max Position Size ($)</label>
                      <input 
                        type="number"
                        value={editingConfig.riskControls.maxPositionSize}
                        onChange={(e) => handleFieldChange('riskControls', 'maxPositionSize', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Max Risk Per Trade (%)</label>
                      <input 
                        type="number"
                        value={editingConfig.riskControls.lossLimit}
                        onChange={(e) => handleFieldChange('riskControls', 'lossLimit', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Max Simultaneous Positions</label>
                      <input 
                        type="number"
                        value={editingConfig.riskControls.maxSimultaneousPositions}
                        onChange={(e) => handleFieldChange('riskControls', 'maxSimultaneousPositions', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Exposure Limit ($)</label>
                      <input 
                        type="number"
                        value={editingConfig.riskControls.exposureLimit}
                        onChange={(e) => handleFieldChange('riskControls', 'exposureLimit', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'rules' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Recommendation rules</h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className={`text-xs font-bold ${textSecondary}`}>Minimum Confidence Score (%)</label>
                      <span className="text-xs font-mono font-bold text-[#00D09C]">{editingConfig.recommendationRules.minConfidence}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="98"
                      value={editingConfig.recommendationRules.minConfidence}
                      onChange={(e) => handleFieldChange('recommendationRules', 'minConfidence', Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00D09C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Neural Signals</label>
                    <div className="flex flex-wrap gap-2">
                      {['RSI', 'MACD', 'EMA', 'Bollinger Bands', 'Volume Delta', 'Sentiment Index', 'Ichimoku', 'Fibonacci'].map(ind => {
                        const included = editingConfig.recommendationRules.indicators.includes(ind);
                        return (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => {
                              const next = included 
                                ? editingConfig.recommendationRules.indicators.filter(x => x !== ind)
                                : [...editingConfig.recommendationRules.indicators, ind];
                              handleFieldChange('recommendationRules', 'indicators', next);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                              included 
                                ? 'bg-[#00D09C]/10 border-[#00D09C] text-[#00D09C]'
                                : 'bg-white/5 border-white/5 text-slate-500'
                            }`}
                          >
                            {ind}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'advanced' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Advanced Settings</h4>

                  <div className="space-y-4">
                    <ToggleField 
                      label="Deep Sentiment Grounding" 
                      description="Connect neural filters to active search index models on Google Search and Gemini to capture sudden high-impact macro news."
                      active={editingConfig.advancedBehavior.useSentimentGrounding}
                      onToggle={(val) => handleFieldChange('advancedBehavior', 'useSentimentGrounding', val)}
                      isDark={isDark}
                    />
                    <ToggleField 
                      label="Ultra-Deep Analytical Modeling" 
                      description="Analyze full orderbook depth and volume sweeps instead of simple price action arrays."
                      active={editingConfig.advancedBehavior.enableDeepAnalysis}
                      onToggle={(val) => handleFieldChange('advancedBehavior', 'enableDeepAnalysis', val)}
                      isDark={isDark}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl p-6 border ${isDark ? 'border-white/10 bg-[#0B0E14]' : 'border-slate-200 bg-white'}`}>
            <h3 className={`text-lg font-black ${textPrimary} mb-4`}>Import Configuration</h3>
            <textarea
              placeholder="Paste JSON configuration content here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold ${textSecondary}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleImportConfig}
                className="px-4 py-2 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black"
              >
                Parse &amp; Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
        active 
          ? 'bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C]' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ToggleField({ label, description, active, onToggle, isDark }: { label: string; description: string; active: boolean; onToggle: (val: boolean) => void; isDark: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="space-y-1">
        <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{label}</p>
        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>{description}</p>
      </div>
      <button 
        type="button"
        onClick={() => onToggle(!active)}
        className={`w-10 h-5 rounded-full relative transition-all flex-shrink-0 mt-1 ${active ? 'bg-[#00D09C]' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}
