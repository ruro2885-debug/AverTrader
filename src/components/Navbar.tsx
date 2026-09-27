import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Activity, Shield, Cpu, Layout, HelpCircle } from 'lucide-react';
import AverLogo from './AverLogo';
import { usePreferences } from '../contexts/PreferencesContext';

interface NavbarProps {
  theme: 'light' | 'dark';
  onNavigate: (section: string) => void;
  activeSection: string;
  onShowcase: () => void;
  onAdminAccess?: () => void;
}

export default function Navbar({
  theme,
  onNavigate,
  activeSection,
  onShowcase,
  onAdminAccess
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = usePreferences();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: t('nav.technology'), id: 'tech', icon: Cpu },
    { name: t('nav.platform'), id: 'features', icon: Layout },
    { name: t('nav.performance'), id: 'stats', icon: Activity },
    { name: t('show.title'), id: 'preview', icon: Shield },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const navBg = scrolled
    ? theme === 'dark'
      ? 'bg-black/20 backdrop-blur-sm border-b border-white/5'
      : 'bg-white/75 border-b border-black/5 backdrop-blur-xl shadow-md'
    : 'bg-transparent';

  const textColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const activeTextColor = theme === 'dark' ? 'text-emerald-400 font-medium' : 'text-emerald-600 font-medium';

  return (
    <header className={`fixed top-8 left-0 right-0 z-40 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Branding */}
        <button 
          onClick={() => handleNavClick('hero')} 
          className="focus:outline-none cursor-pointer group active:scale-95 transition-transform"
        >
          <AverLogo theme={theme} size={36} />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-sm tracking-wide transition-colors duration-200 cursor-pointer hover:text-emerald-400 ${
                  isActive ? activeTextColor : textColor
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={onShowcase}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{t('nav.access')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded-lg cursor-pointer focus:outline-none ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden absolute top-16 left-0 right-0 border-b shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-5 ${
            theme === 'dark'
              ? 'bg-slate-950/95 border-white/5 text-white'
              : 'bg-white/95 border-black/5 text-gray-950'
          }`}
        >
          <div className="px-6 py-8 flex flex-col space-y-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center space-x-3 text-lg text-left py-2 hover:text-emerald-400 transition-colors cursor-pointer ${
                  activeSection === item.id ? 'text-emerald-400 font-medium' : ''
                }`}
              >
                <item.icon className="w-5 h-5 text-emerald-400" />
                <span>{item.name}</span>
              </button>
            ))}
            
            <hr className={theme === 'dark' ? 'border-white/5' : 'border-black/5'} />
            
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => {
                  onShowcase();
                  setMobileMenuOpen(false);
                }}
                className="py-3 text-center rounded-lg bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{t('nav.access')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Upper menu links (Admin Terminal, Help & Knowledge Center) */}
            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onAdminAccess) onAdminAccess();
                  else handleNavClick('admin');
                }}
                className="flex items-center justify-between py-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                <span>Admin Terminal</span>
                <span className="text-[10px] font-mono text-slate-500">/admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onShowcase();
                }}
                className="flex items-center justify-between py-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                <span>Help &amp; Knowledge Center</span>
                <span className="text-[10px] font-mono text-slate-500">Docs &amp; Support</span>
              </button>
            </div>

            {/* Dedicated About Us Button - Directly ABOVE copyright text */}
            <div className="my-2 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavClick('about');
                }}
                className="group w-full flex items-center justify-between py-2 text-base font-semibold text-slate-200 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span className="tracking-wide">About Us</span>
              </button>
            </div>

            {/* Target Position: Directly above copyright text */}
            <p className="text-xs font-mono text-slate-500 tracking-wider">
              © 2022–2026 AVER TECHNOLOGIES. ALL RIGHTS RESERVED.
            </p>

            {/* Risk Disclaimer and Entity Notice text */}
            <div className="space-y-2 text-[10px] text-slate-500 leading-relaxed font-sans">
              <p>
                Risk Disclosure: All operations and balances within the public preview workspace are virtual sandbox allocations provided solely for presentation.
              </p>
              <p>
                Entity Notice: AverTrader (avertrader.space) is an independent proprietary trading workspace and AI execution platform. AverTrader is not affiliated with, sponsored by, or connected to AvaTrade (avatrade.com) or any third-party broker.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
