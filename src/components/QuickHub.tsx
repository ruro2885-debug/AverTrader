import { useState } from 'react';
import { Settings, X, Globe, Moon, Sun, Monitor, HelpCircle, MessageCircle, RefreshCw, Layers } from 'lucide-react';
import { Language, Theme, Currency, FAQItem } from '../types';
import { usePreferences } from '../contexts/PreferencesContext';

interface QuickHubProps {
  theme: Theme;
  language: Language;
  currency: Currency;
  onPreferenceChange: (key: 'theme' | 'language' | 'currency', value: any) => void;
}

export default function QuickHub({
  theme,
  language,
  currency,
  onPreferenceChange
}: QuickHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'faq'>('preferences');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { t, formatCurrency, updatePreference } = usePreferences();
  const isDark = theme === 'dark';

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleUpdate = (key: 'theme' | 'language' | 'currency', value: any) => {
    onPreferenceChange(key, value);
    showToast(t('qh.success'));
  };

  // Generate dynamic FAQs using context
  const faqs: FAQItem[] = [
    {
      id: 'gs-1',
      category: 'Getting Started',
      question: t('faq.gs.q'),
      answer: t('faq.gs.a').replace('{{bonus}}', formatCurrency(15000))
    },
    {
      id: 'pf-1',
      category: 'Platform Features',
      question: t('faq.pf.q'),
      answer: t('faq.pf.a')
    },
    {
      id: 'ref-1',
      category: 'Referral Program',
      question: t('faq.ref.q'),
      answer: t('faq.ref.a').replace('{{bonus}}', formatCurrency(5000))
    },
  ];

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];
  
  const filteredFaqs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-24 right-8 z-50 px-4 py-3 rounded-lg shadow-xl font-mono text-sm animate-in slide-in-from-bottom-5 fade-in ${
          isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer focus:outline-none flex items-center justify-center ${
          isDark 
            ? 'bg-slate-900 border border-white/10 text-white hover:border-emerald-500/50' 
            : 'bg-white border border-slate-200 text-slate-900 hover:border-emerald-500/50'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-8 w-[92vw] sm:w-[420px] max-h-[80vh] md:max-h-[600px] rounded-2xl border shadow-3xl z-50 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'
          }`}
          style={{ boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
        >
          {/* Header */}
          <div className={`p-5 border-b flex items-center space-x-3 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Aver Command Center
              </h3>
              <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                System Settings & Support
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className={`grid grid-cols-2 border-b text-xs font-mono ${
            isDark ? 'border-white/5 text-gray-400' : 'border-slate-100 text-gray-500'
          }`}>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-3.5 border-b-2 text-center font-semibold transition-colors cursor-pointer ${
                activeTab === 'preferences'
                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                  : 'border-transparent hover:text-emerald-400 hover:bg-black/5'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>{t('qh.pref')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-3.5 border-b-2 text-center font-semibold transition-colors cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5'
                  : 'border-transparent hover:text-emerald-400 hover:bg-black/5'
              }`}
            >
              <div className="flex items-center justify-center space-x-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{t('qh.faq')}</span>
              </div>
            </button>
          </div>

          {/* Content Area */}
          <div className={`flex-1 overflow-y-auto overflow-x-hidden p-5 ${
            isDark ? 'bg-slate-950/50' : 'bg-slate-50/50'
          } no-scrollbar`}>
            
            {/* Preferences Tab Content */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                
                {/* Theme Selection */}
                <div className="space-y-3">
                  <label className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('qh.theme')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdate('theme', 'dark')}
                      className={`py-2 rounded-lg text-xs font-mono font-medium border cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : isDark ? 'border-white/10 hover:border-white/20 text-gray-400' : 'border-slate-200 hover:border-slate-300 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark Mode</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleUpdate('theme', 'light')}
                      className={`py-2 rounded-lg text-xs font-mono font-medium border cursor-pointer transition-all ${
                        theme === 'light'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : isDark ? 'border-white/10 hover:border-white/20 text-gray-400' : 'border-slate-200 hover:border-slate-300 text-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light Mode</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <label className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('qh.lang')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['EN', 'ES', 'FR', 'DE', 'ZH'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleUpdate('language', lang)}
                        className={`py-2 rounded-lg text-xs font-mono font-medium border cursor-pointer transition-all ${
                          language === lang
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : isDark ? 'border-white/10 hover:border-white/20 text-gray-400' : 'border-slate-200 hover:border-slate-300 text-gray-500'
                        }`}
                      >
                        {lang === 'EN' && 'English'}
                        {lang === 'ES' && 'Español'}
                        {lang === 'FR' && 'Français'}
                        {lang === 'DE' && 'Deutsch'}
                        {lang === 'ZH' && '中文'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="space-y-3">
                  <label className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('qh.curr')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['USD', 'EUR', 'GBP', 'BTC', 'USDT'] as Currency[]).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => handleUpdate('currency', curr)}
                        className={`py-2 rounded-lg text-xs font-mono font-medium border cursor-pointer transition-all ${
                          currency === curr
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : isDark ? 'border-white/10 hover:border-white/20 text-gray-400' : 'border-slate-200 hover:border-slate-300 text-gray-500'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button (Visual) */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="inline-flex w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-mono font-bold tracking-wider justify-center items-center space-x-2 shadow-lg shadow-emerald-500/10 cursor-pointer hover:scale-[1.01] transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('qh.save')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* FAQ Tab Content */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                
                {/* FAQ Category Filter */}
                <div className="flex overflow-x-auto pb-2 no-scrollbar space-x-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono tracking-wide whitespace-nowrap cursor-pointer transition-all border ${
                        selectedCategory === cat
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : isDark ? 'border-white/5 hover:border-white/10 text-gray-400' : 'border-slate-200 hover:border-slate-300 text-gray-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredFaqs.map((item) => (
                    <div 
                      key={item.id}
                      className={`rounded-xl border transition-all ${
                        isDark ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer list-none focus:outline-none">
                          <span className={`text-xs font-semibold tracking-tight leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.question}
                          </span>
                          <span className="transition group-open:rotate-180 text-emerald-500 ml-4 flex-shrink-0">
                            <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                          </span>
                        </summary>
                        <div className={`px-4 pb-4 border-t pt-3 text-xs leading-relaxed font-sans font-light space-y-2 ${isDark ? 'border-gray-800/10 text-gray-400' : 'border-slate-100 text-gray-600'}`}>
                          <p>{item.answer}</p>
                          <div className="text-[10px] font-bold font-mono tracking-wide text-emerald-400/80 flex items-center space-x-1.5 uppercase mt-3">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            <span>Official Doc Code: {item.id.toUpperCase()}</span>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>

                {/* Support Link */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <a 
                    href="https://t.me/AverNoxTraderbot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center space-x-2 w-full py-3 rounded-xl border text-xs font-bold font-mono transition-all cursor-pointer ${
                      isDark 
                        ? 'border-white/10 text-gray-300 hover:bg-white/5 hover:text-white' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact Support Telegram</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
