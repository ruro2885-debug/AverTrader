import { ArrowUp, Cpu, Sparkles, Send, Globe, Mail, ShieldAlert, Info } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAppNavigation } from '../contexts/NavigationContext';
import AverLogo from './AverLogo';

interface FooterProps {
  theme: 'light' | 'dark';
  onNavigate: (section: string) => void;
}

export default function Footer({ theme, onNavigate }: FooterProps) {
  const isDark = theme === 'dark';
  const { t } = usePreferences();
  const { navigateView } = useAppNavigation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = [
    {
      title: 'Proprietary Tech',
      links: [
        { label: 'AverCore AI™ Engine', href: '#tech' },
        { label: 'Precision Entry Optimizer™', href: '#tech' },
        { label: 'PEO™ live sandbox', href: '#preview' },
        { label: 'Telemetry stream', href: '#stats' }
      ]
    },
    {
      title: 'Ecosystem',
      links: [
        { label: 'Platform Showcase', href: '#preview' },
        { label: 'Ecosystem Core Features', href: '#features' },
        { label: 'Verification stats', href: '#stats' },
        { label: 'Partner Program', href: '#preview' }
      ]
    },
    {
      title: 'Client Desk',
      links: [
        { label: 'Client Authorization', href: '#dashboard' },
        { label: 'System Preferences', href: '#preview' },
        { label: 'Help & Knowledge Center', href: '#preview' },
        { label: 'Admin Terminal', href: '/admin' }
      ]
    }
  ];

  return (
    <footer className={`relative border-t pt-20 pb-12 px-6 overflow-hidden ${
      isDark ? 'bg-transparent border-white/5' : 'bg-slate-50 border-slate-200'
    }`}>
      
      {/* Background overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Core Footer Link grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-gray-800/10 mb-12">
          
          {/* Column 1: Branding and tech disclosures */}
          <div className="md:col-span-4 flex flex-col items-start space-y-5 text-left">
            <AverLogo theme={theme} size={36} />

            {/* Badges */}
            <div className="flex flex-col space-y-2 pt-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Powered by AverCore AI™</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-teal-400">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">Built on Precision Entry Optimizer™ (PEO™)</span>
              </div>
            </div>
          </div>

          {/* Columns 2-4: Structured footer maps */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((section, idx) => (
              <div key={idx} className="flex flex-col items-start text-left space-y-4">
                <h4 className={`text-xs font-mono font-bold tracking-wider uppercase ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      {link.href.startsWith('http') ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs font-sans hover:text-emerald-400 transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {link.label}
                        </a>
                      ) : link.href === '/admin' ? (
                        <button
                          type="button"
                          onClick={() => navigateView('admin')}
                          className={`text-xs font-sans hover:text-emerald-400 transition-colors cursor-pointer text-left ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className={`text-xs font-sans hover:text-emerald-400 transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom bar with Disclaimers & Credits */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          <div className="flex flex-col space-y-3 text-left">
            {/* About Us Button directly above the text */}
            <div>
              <button
                type="button"
                onClick={() => navigateView('about')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <Info className="w-3.5 h-3.5 text-black" />
                <span>About Us</span>
              </button>
            </div>

            <p className={`text-[10px] font-bold font-mono tracking-wide uppercase ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              © 2026 AVER TECHNOLOGIES. ALL RIGHTS RESERVED.
            </p>
            <p className={`text-[9.5px] font-bold leading-relaxed max-w-2xl ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Risk Disclosure: All operations and balances within the public preview workspace are virtual sandbox allocations provided solely for presentation. They are completely decoupled from external banking pipelines, physical ledgers, or physical cryptocurrency clearing routes. Performance metrics demonstrated on historical configurations do not guarantee future execution optimization.
            </p>
            <p className={`text-[9.5px] font-bold leading-relaxed max-w-2xl ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
              Entity Notice: AverTrader (avertrader.space) is an independent proprietary trading workspace and AI execution platform. AverTrader is not affiliated with, sponsored by, or connected to AvaTrade (avatrade.com) or any third-party broker.
            </p>
          </div>

          {/* Scroll to Top Trigger */}
          <button
            onClick={scrollToTop}
            className="p-3 rounded-xl bg-gray-900 border border-white/5 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all cursor-pointer flex items-center justify-center self-start sm:self-center"
            aria-label="Scroll to Top"
          >
            <ArrowUp className="w-4 h-4 animate-bounce" />
          </button>
        </div>

      </div>
    </footer>
  );
}
