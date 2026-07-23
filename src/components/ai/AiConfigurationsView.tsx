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
  Coins,
  Sun,
  Moon,
  Coffee
} from 'lucide-react';
import { AiConfiguration, RiskRating, TradingSchedule } from '../../types/aiTrading';
import { Timestamp } from 'firebase/firestore';
import { aiTradingService } from '../../services/aiTradingService';

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
  name: 'New AI Configuration',
  createdAt: Timestamp.now(),
  lastModified: Timestamp.now(),
  status: 'INACTIVE',
  sessionSetup: {
    amountToAllocate: 1000,
    fundingSource: 'WALLET',
    sessionDuration: 24
  },
  profitRiskManagement: {
    sessionTakeProfit: 5,
    sessionStopLoss: 2,
    maxRiskPerTrade: 1,
    maxPositionSize: 500
  },
  aiTradingRules: {
    minConfidence: 85,
    maxSimultaneousPositions: 3,
    assetSelection: ['BTC', 'ETH', 'SOL'],
    tradingStrategy: 'NEURAL_MOMENTUM'
  },
  configurationDetails: {
    description: 'A newly created AI trading configuration.',
    category: 'Scalping',
    version: '1.0.0'
  },
  analyticsAndNotes: {
    riskScore: 50,
    strategyNotes: '',
    performanceStats: {
      winRate: 0,
      totalReturn: 0,
      drawdown: 0
    },
    executionHistory: []
  },
  notificationPreferences: {
    newRecommendations: true,
    tradeExecutions: true,
    marketAlerts: false
  },
  schedule: {
    sessions: [{ start: '08:00', end: '17:00' }],
    weekdays: true,
    weekends: false,
    timezone: 'UTC',
    breakPeriods: [{ start: '12:00', end: '13:00' }],
    excludeHolidays: true
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
  const [activeStep, setActiveStep] = useState<'setup' | 'risk' | 'rules' | 'details' | 'analytics' | 'schedule'>('setup');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const cardClasses = isDark ? 'bg-[#0B0E14] border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';

  const updateEditingSchedule = (updater: (sched: TradingSchedule) => TradingSchedule) => {
    if (!editingConfig) return;
    const currentSchedule = editingConfig.schedule || {
      sessions: [{ start: '08:00', end: '17:00' }],
      weekdays: true,
      weekends: false,
      timezone: 'UTC',
      breakPeriods: [],
      excludeHolidays: true
    };
    const nextSched = updater(currentSchedule);
    setEditingConfig({
      ...editingConfig,
      schedule: nextSched
    });
  };

  const handleCreateNew = () => {
    const fresh = defaultNewConfig(userId || 'guest_user');
    setEditingConfig(fresh);
    setIsCreating(true);
    setActiveStep('setup');
    setIsSaved(false);
  };

  const handleEdit = (cfg: AiConfiguration) => {
    // Migration for old configs
    const migrated = {
      ...cfg,
      configurationDetails: cfg.configurationDetails || {
        description: '',
        category: 'Scalping',
        version: '1.0.0'
      },
      analyticsAndNotes: cfg.analyticsAndNotes || {
        riskScore: 50,
        strategyNotes: '',
        performanceStats: {
          winRate: 0,
          totalReturn: 0,
          drawdown: 0
        },
        executionHistory: []
      }
    };
    setEditingConfig(migrated);
    setIsCreating(false);
    setActiveStep('setup');
    setIsSaved(false);
  };

  const handleFieldChange = (section: keyof AiConfiguration | null, field: string, value: any) => {
    if (!editingConfig) return;
    setEditingConfig(prev => {
      if (!prev) return null;
      if (section === null) {
        return { ...prev, [field]: value };
      } else {
        const sectData = (prev[section] || {}) as any;
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
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleSaveConfig = async () => {
    if (!editingConfig || isSaving) return;
    
    // Simple validation
    if (editingConfig.sessionSetup.amountToAllocate <= 0) {
      alert('Please enter a valid amount to allocate.');
      return;
    }

    setIsSaving(true);

    const configToSave = { 
      ...editingConfig, 
      lastModified: new Date().toISOString() as any 
    };

    try {
      // 1. Save preferences locally and safely attempt remote sync if real user
      if (userId && !userId.startsWith('local-') && userId !== 'guest_user') {
        try {
          await Promise.race([
            aiTradingService.savePreferences(userId, {
              maxPositionSize: configToSave.profitRiskManagement.maxPositionSize,
              maxRiskPerTrade: configToSave.profitRiskManagement.maxRiskPerTrade,
              lossLimit: configToSave.profitRiskManagement.sessionStopLoss,
              minConfidence: configToSave.aiTradingRules.minConfidence,
              maxSimultaneousPositions: configToSave.aiTradingRules.maxSimultaneousPositions,
              preferredMarkets: configToSave.aiTradingRules.assetSelection
            }),
            new Promise((res) => setTimeout(res, 1500))
          ]);
        } catch (prefErr) {
          console.warn("Failed to save aiPreferences in Firestore:", prefErr);
        }
      }

      // 2. Call parent onSave which updates TradingEngineContext state & localStorage
      await onSave(configToSave);

      const savedName = configToSave.name;
      setIsSaved(true);
      setEditingConfig(null);
      setSaveSuccessMessage(`Configuration "${savedName}" saved successfully and ready to execute.`);
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error saving configuration:", err);
      setIsSaved(true);
      setEditingConfig(null);
    } finally {
      setIsSaving(false);
    }
  };


  const handleImportConfig = async () => {
    try {
      if (!importText.trim()) throw new Error('Empty input');
      const parsed = JSON.parse(importText);
      
      // Strict validation for core fields
      if (!parsed.name || !parsed.sessionSetup || !parsed.profitRiskManagement || !parsed.aiTradingRules) {
        throw new Error('Incomplete configuration structure. Missing critical strategy, setup or risk parameters.');
      }

      const imported: AiConfiguration = {
        ...parsed,
        id: `cfg_import_${Date.now()}`,
        ownerId: userId || 'unknown',
        status: 'INACTIVE',
        createdAt: Timestamp.now(),
        lastModified: Timestamp.now(),
        // Ensure new sections exist even if importing from a slightly older version of the new interface
        configurationDetails: parsed.configurationDetails || {
          description: '',
          category: 'Scalping',
          version: '1.0.0'
        },
        analyticsAndNotes: parsed.analyticsAndNotes || {
          riskScore: 50,
          strategyNotes: '',
          performanceStats: {
            winRate: 0,
            totalReturn: 0,
            drawdown: 0
          },
          executionHistory: []
        },
        notificationPreferences: parsed.notificationPreferences || {
          newRecommendations: true,
          tradeExecutions: true,
          marketAlerts: false
        }
      };
      
      await onSave(imported);
      setShowImportModal(false);
      setImportText('');
      alert('Configuration imported successfully with all sections synchronized.');
    } catch (e: any) {
      alert(`Import Failed: ${e.message || 'Invalid JSON structure'}`);
    }
  };

  const handleExport = (config: AiConfiguration) => {
    try {
      // Create a clean copy of the configuration for export
      const exportData = {
        ...config,
        exportedAt: new Date().toISOString(),
        client: "Aver Project AI Engine"
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Copy to clipboard
      navigator.clipboard.writeText(jsonString).catch(err => {
        console.error('Clipboard failed:', err);
      });

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aver_config_${config.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`"${config.name}" data file has been downloaded and copied to clipboard.`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export configuration.");
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
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

          {saveSuccessMessage && (
            <div className="p-4 rounded-xl bg-[#00D09C]/10 border border-[#00D09C]/30 flex items-center justify-between text-[#00D09C] text-xs font-bold animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D09C]" />
                <span>{saveSuccessMessage}</span>
              </div>
              <button onClick={() => setSaveSuccessMessage(null)} className="text-slate-400 hover:text-white text-base">
                &times;
              </button>
            </div>
          )}

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
                          cfg.aiTradingRules.tradingStrategy === 'NEURAL_MOMENTUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {cfg.aiTradingRules.tradingStrategy.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6 border-t border-b border-white/5 py-4">
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Allocated</p>
                        <p className={`text-xs font-bold ${textPrimary} mt-1`}>
                          ${cfg.sessionSetup.amountToAllocate.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Risk Limit</p>
                        <p className={`text-xs font-bold ${textPrimary} mt-1`}>
                          {cfg.profitRiskManagement.sessionStopLoss}% SL
                        </p>
                      </div>
                      <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${textSecondary}`}>Confidence</p>
                        <p className={`text-xs font-bold text-[#00D09C] mt-1`}>
                          &gt; {cfg.aiTradingRules.minConfidence}%
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
                        title="Export Configuration"
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
                          className="px-3 py-1.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-[10px] font-black transition-all flex items-center gap-1"
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
                type="button"
                onClick={() => setEditingConfig(null)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {isSaved ? 'Back to Configurations' : 'Cancel Changes'}
              </button>
              {isSaved ? (
                <button
                  type="button"
                  onClick={() => onStartSession(editingConfig.id, editingConfig.aiTradingRules.assetSelection)}
                  className="px-5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/20 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Launch Session
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 bg-[#00D09C] hover:bg-[#00B585] text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-[#00D09C]/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Configuration
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/5 min-h-[500px]">
            {/* Steps Left Panel */}
            <div className="p-4 space-y-1 bg-black/5 lg:col-span-1">
              <StepButton active={activeStep === 'setup'} onClick={() => setActiveStep('setup')} label="1. Session Setup" icon={<Layers className="w-4 h-4" />} />
              <StepButton active={activeStep === 'risk'} onClick={() => setActiveStep('risk')} label="2. Profit & Risk Management" icon={<ShieldAlert className="w-4 h-4" />} />
              <StepButton active={activeStep === 'rules'} onClick={() => setActiveStep('rules')} label="3. AI Trading Rules" icon={<Brain className="w-4 h-4" />} />
              <StepButton active={activeStep === 'details'} onClick={() => setActiveStep('details')} label="4. Configuration Details" icon={<Info className="w-4 h-4" />} />
              <StepButton active={activeStep === 'analytics'} onClick={() => setActiveStep('analytics')} label="5. Analytics & Notes" icon={<RefreshCw className="w-4 h-4" />} />
              <StepButton active={activeStep === 'schedule'} onClick={() => setActiveStep('schedule')} label="6. Neural Schedule" icon={<Calendar className="w-4 h-4" />} />
            </div>

            {/* Editing Work Area */}
            <div className="p-8 lg:col-span-3 space-y-6">
              {activeStep === 'setup' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Session Setup</h4>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Configuration Name</label>
                    <input 
                      type="text" 
                      value={editingConfig.name}
                      onChange={(e) => handleFieldChange(null, 'name', e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      placeholder="e.g. Scalp High Yield Session"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Amount to Allocate (USD)</label>
                      <input 
                        type="number" 
                        value={editingConfig.sessionSetup.amountToAllocate}
                        onChange={(e) => handleFieldChange('sessionSetup', 'amountToAllocate', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Funding Source</label>
                      <select 
                        value={editingConfig.sessionSetup.fundingSource}
                        onChange={(e) => handleFieldChange('sessionSetup', 'fundingSource', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      >
                        <option value="WALLET">Wallet Balance</option>
                        <option value="VAULT">Vault (Safety Stash)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Session Duration (Hours)</label>
                    <input 
                      type="number" 
                      value={editingConfig.sessionSetup.sessionDuration}
                      onChange={(e) => handleFieldChange('sessionSetup', 'sessionDuration', Number(e.target.value))}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                    />
                    <p className="text-[10px] text-slate-500 font-mono">The AI will automatically shut down after this period expires.</p>
                  </div>
                </div>
              )}

              {activeStep === 'risk' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Profit & Risk Management</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Session Take Profit (%)</label>
                      <input 
                        type="number"
                        value={editingConfig.profitRiskManagement.sessionTakeProfit}
                        onChange={(e) => handleFieldChange('profitRiskManagement', 'sessionTakeProfit', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Session Stop Loss (%)</label>
                      <input 
                        type="number"
                        value={editingConfig.profitRiskManagement.sessionStopLoss}
                        onChange={(e) => handleFieldChange('profitRiskManagement', 'sessionStopLoss', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Max Risk Per Trade (%)</label>
                      <input 
                        type="number"
                        value={editingConfig.profitRiskManagement.maxRiskPerTrade}
                        onChange={(e) => handleFieldChange('profitRiskManagement', 'maxRiskPerTrade', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Max Position Size (USD)</label>
                      <input 
                        type="number"
                        value={editingConfig.profitRiskManagement.maxPositionSize}
                        onChange={(e) => handleFieldChange('profitRiskManagement', 'maxPositionSize', Number(e.target.value))}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'rules' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>AI Trading Rules</h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className={`text-xs font-bold ${textSecondary}`}>Minimum Confidence Score (%)</label>
                      <span className="text-xs font-mono font-bold text-[#00D09C]">{editingConfig.aiTradingRules.minConfidence}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="98"
                      value={editingConfig.aiTradingRules.minConfidence}
                      onChange={(e) => handleFieldChange('aiTradingRules', 'minConfidence', Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00D09C]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Maximum Simultaneous Positions</label>
                    <input 
                      type="number"
                      value={editingConfig.aiTradingRules.maxSimultaneousPositions}
                      onChange={(e) => handleFieldChange('aiTradingRules', 'maxSimultaneousPositions', Number(e.target.value))}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Asset Selection</label>
                    <div className="flex flex-wrap gap-2">
                      {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'].map(m => {
                        const included = editingConfig.aiTradingRules.assetSelection.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const next = included 
                                ? editingConfig.aiTradingRules.assetSelection.filter(x => x !== m)
                                : [...editingConfig.aiTradingRules.assetSelection, m];
                              handleFieldChange('aiTradingRules', 'assetSelection', next);
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

                  <div className="space-y-2">
                    <label className={`block text-xs font-bold ${textSecondary}`}>Trading Strategy</label>
                    <select 
                      value={editingConfig.aiTradingRules.tradingStrategy}
                      onChange={(e) => handleFieldChange('aiTradingRules', 'tradingStrategy', e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                    >
                      <option value="NEURAL_MOMENTUM">Neural Momentum (Balanced)</option>
                      <option value="VOLATILITY_BREAKOUT">Volatility Breakout (Aggressive)</option>
                      <option value="MEAN_REVERSION">Mean Reversion (Conservative)</option>
                      <option value="QUANT_GRID">Quant Grid Scalper (High Frequency)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeStep === 'details' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Configuration Details</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Description</label>
                      <textarea 
                        value={editingConfig.configurationDetails?.description || ''}
                        onChange={(e) => handleFieldChange('configurationDetails', 'description', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C] h-24`}
                        placeholder="Detailed explanation of this configuration's purpose..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={`block text-xs font-bold ${textSecondary}`}>Category</label>
                        <select 
                          value={editingConfig.configurationDetails?.category || 'Scalping'}
                          onChange={(e) => handleFieldChange('configurationDetails', 'category', e.target.value)}
                          className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                        >
                          <option value="Scalping">Scalping</option>
                          <option value="Day Trading">Day Trading</option>
                          <option value="Swing Trading">Swing Trading</option>
                          <option value="Long Term">Long Term</option>
                          <option value="Experimental">Experimental</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={`block text-xs font-bold ${textSecondary}`}>Version</label>
                        <input 
                          type="text" 
                          value={editingConfig.configurationDetails?.version || '1.0.0'}
                          onChange={(e) => handleFieldChange('configurationDetails', 'version', e.target.value)}
                          className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                          placeholder="1.0.0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Status</p>
                        <p className={`text-xs font-bold mt-1 ${editingConfig.status === 'ACTIVE' ? 'text-[#00D09C]' : 'text-slate-400'}`}>
                          {editingConfig.status}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Created</p>
                        <p className={`text-xs font-bold mt-1 ${textPrimary}`}>
                          {editingConfig.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Modified</p>
                        <p className={`text-xs font-bold mt-1 ${textPrimary}`}>
                          {editingConfig.lastModified.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'analytics' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Configuration Analytics & Notes</h4>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Win Rate</p>
                      <p className="text-lg font-black text-[#00D09C] mt-1">{editingConfig.analyticsAndNotes?.performanceStats?.winRate || 0}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Total Return</p>
                      <p className="text-lg font-black text-blue-500 mt-1">+{editingConfig.analyticsAndNotes?.performanceStats?.totalReturn || 0}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${textSecondary}`}>Max Drawdown</p>
                      <p className="text-lg font-black text-rose-500 mt-1">-{editingConfig.analyticsAndNotes?.performanceStats?.drawdown || 0}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold ${textSecondary}`}>Aggregated Risk Score</label>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          (editingConfig.analyticsAndNotes?.riskScore || 0) < 40 ? 'bg-[#00D09C]/10 text-[#00D09C]' : 
                          (editingConfig.analyticsAndNotes?.riskScore || 0) < 70 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {editingConfig.analyticsAndNotes?.riskScore || 0}/100
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100"
                        value={editingConfig.analyticsAndNotes?.riskScore || 50}
                        onChange={(e) => handleFieldChange('analyticsAndNotes', 'riskScore', Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00D09C]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Strategy Notes & Post-Session Analysis</label>
                      <textarea 
                        value={editingConfig.analyticsAndNotes?.strategyNotes || ''}
                        onChange={(e) => handleFieldChange('analyticsAndNotes', 'strategyNotes', e.target.value)}
                        className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C] h-32`}
                        placeholder="Log strategy observations, performance insights, and required adjustments..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`block text-xs font-bold ${textSecondary}`}>Recent Execution History</label>
                      <div className="space-y-2">
                        {editingConfig.analyticsAndNotes.executionHistory && editingConfig.analyticsAndNotes.executionHistory.length > 0 ? (
                          editingConfig.analyticsAndNotes.executionHistory.map((log, idx) => (
                            <div key={idx} className="p-2 bg-white/5 border border-white/5 rounded-lg text-[10px] text-slate-400 font-mono">
                              {log}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                            <p className="text-[10px] text-slate-500 italic">No execution history recorded yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 'schedule' && (
                <div className="space-y-6 max-w-2xl">
                  <h4 className={`text-sm font-black uppercase tracking-widest ${textSecondary}`}>Neural Schedule & Operating Windows</h4>
                  <p className={`text-xs ${textSecondary}`}>
                    Define custom operating hours, regional timezone, cooling breaks, and holiday exclusions for this configuration.
                  </p>

                  {/* Timezone & Regional */}
                  <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
                    <h5 className={`text-xs font-black uppercase tracking-wider ${textSecondary} flex items-center gap-2`}>
                      <Globe className="w-4 h-4 text-[#00D09C]" /> Regional Parameters & Timezone
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold ${textSecondary} mb-1`}>Timezone Reference</label>
                        <select 
                          value={editingConfig.schedule?.timezone || 'UTC'}
                          onChange={(e) => updateEditingSchedule(s => ({ ...s, timezone: e.target.value }))}
                          className={`w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="PST">PST (Pacific Standard Time)</option>
                          <option value="GMT">GMT (Greenwich Mean Time)</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-end space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                          <input 
                            type="checkbox"
                            checked={editingConfig.schedule?.excludeHolidays ?? true}
                            onChange={(e) => updateEditingSchedule(s => ({ ...s, excludeHolidays: e.target.checked }))}
                            className="rounded bg-black/20 border-white/10 text-[#00D09C] focus:ring-0 w-4 h-4"
                          />
                          <span className={`text-xs font-bold ${textPrimary}`}>Exclude Major Market Holidays</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingConfig.schedule?.weekdays ?? true}
                          onChange={(e) => updateEditingSchedule(s => ({ ...s, weekdays: e.target.checked }))}
                          className="rounded bg-black/20 border-white/10 text-[#00D09C] focus:ring-0 w-4 h-4"
                        />
                        <span className={`text-xs font-bold ${textPrimary}`}>Active on Weekdays (Mon-Fri)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={editingConfig.schedule?.weekends ?? false}
                          onChange={(e) => updateEditingSchedule(s => ({ ...s, weekends: e.target.checked }))}
                          className="rounded bg-black/20 border-white/10 text-[#00D09C] focus:ring-0 w-4 h-4"
                        />
                        <span className={`text-xs font-bold ${textPrimary}`}>Active on Weekends (Sat-Sun)</span>
                      </label>
                    </div>
                  </div>

                  {/* Active Search Sessions */}
                  <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
                    <div className="flex justify-between items-center">
                      <h5 className={`text-xs font-black uppercase tracking-wider ${textSecondary} flex items-center gap-2`}>
                        <Clock className="w-4 h-4 text-[#00D09C]" /> Active Search Sessions
                      </h5>
                      <button 
                        onClick={() => updateEditingSchedule(s => ({ ...s, sessions: [...s.sessions, { start: '09:00', end: '17:00' }] }))}
                        className="text-[10px] font-black text-[#00D09C] flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Window
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editingConfig.schedule?.sessions || []).map((sess, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                          <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <div className="grid grid-cols-2 gap-3 flex-1">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">Start Time</span>
                              <input 
                                type="time" 
                                value={sess.start} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateEditingSchedule(s => {
                                    const next = [...s.sessions];
                                    next[idx] = { ...next[idx], start: val };
                                    return { ...s, sessions: next };
                                  });
                                }}
                                className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">End Time</span>
                              <input 
                                type="time" 
                                value={sess.end} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateEditingSchedule(s => {
                                    const next = [...s.sessions];
                                    next[idx] = { ...next[idx], end: val };
                                    return { ...s, sessions: next };
                                  });
                                }}
                                className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                              />
                            </div>
                          </div>
                          {(editingConfig.schedule?.sessions || []).length > 1 && (
                            <button 
                              onClick={() => {
                                updateEditingSchedule(s => ({ ...s, sessions: s.sessions.filter((_, i) => i !== idx) }));
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors self-end"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Neural Cooling Breaks */}
                  <div className={`rounded-2xl border p-6 space-y-4 ${cardClasses}`}>
                    <div className="flex justify-between items-center">
                      <h5 className={`text-xs font-black uppercase tracking-wider ${textSecondary} flex items-center gap-2`}>
                        <Coffee className="w-4 h-4 text-blue-500" /> Neural Cooling Breaks
                      </h5>
                      <button 
                        onClick={() => updateEditingSchedule(s => ({ ...s, breakPeriods: [...(s.breakPeriods || []), { start: '12:00', end: '13:00' }] }))}
                        className="text-[10px] font-black text-[#00D09C] flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Break
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(!editingConfig.schedule?.breakPeriods || editingConfig.schedule.breakPeriods.length === 0) ? (
                        <div className="p-4 text-center border border-dashed border-white/10 rounded-xl">
                          <p className={`text-xs ${textSecondary} opacity-40`}>No regular break periods configured.</p>
                        </div>
                      ) : (
                        editingConfig.schedule.breakPeriods.map((brk, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                            <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <div className="grid grid-cols-2 gap-3 flex-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 block mb-1">Start Break</span>
                                <input 
                                  type="time" 
                                  value={brk.start} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateEditingSchedule(s => {
                                      const next = [...(s.breakPeriods || [])];
                                      next[idx] = { ...next[idx], start: val };
                                      return { ...s, breakPeriods: next };
                                    });
                                  }}
                                  className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                                />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 block mb-1">End Break</span>
                                <input 
                                  type="time" 
                                  value={brk.end} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateEditingSchedule(s => {
                                      const next = [...(s.breakPeriods || [])];
                                      next[idx] = { ...next[idx], end: val };
                                      return { ...s, breakPeriods: next };
                                    });
                                  }}
                                  className={`w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono font-bold ${textPrimary} outline-none focus:border-[#00D09C]`}
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                updateEditingSchedule(s => ({ ...s, breakPeriods: (s.breakPeriods || []).filter((_, i) => i !== idx) }));
                              }}
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
