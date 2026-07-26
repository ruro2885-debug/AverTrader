import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import CryptoTicker from './components/CryptoTicker';
import Hero from './components/Hero';
import CoinLogo from './components/CoinLogo';
import TechInnovations from './components/TechInnovations';
import Features from './components/Features';
import Stats from './components/Stats';
import QuickHub from './components/QuickHub';
import Footer from './components/Footer';
import PlatformShowcase from './components/PlatformShowcase';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import Preferences from './components/Preferences';
import BonusCenter from './components/BonusCenter';
import ReferralCenter from './components/ReferralCenter';
import MarketHighlightsPage from './components/MarketHighlightsPage';
import EventsPromosPage from './components/EventsPromosPage';
import AdminRoot from './components/admin/AdminRoot';
import NotFound from './components/NotFound';
import { usePreferences } from './contexts/PreferencesContext';
import { useAuth } from './contexts/AuthContext';
import { TradingEngineProvider } from './contexts/TradingEngineContext';
import { safeStorage } from './utils/storage';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  
  return (
    <TradingEngineProvider>
      <AppContent />
    </TradingEngineProvider>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  
  // Use state but initialize with a potential value if we already have it in localStorage to prevent flicker
  const [currentView, setCurrentView] = useState<'home' | 'showcase' | 'auth' | 'dashboard' | 'preferences' | 'bonus-center' | 'referral-centre' | 'market-highlights' | 'events-promos' | 'admin' | 'not-found'>('home');


  const { preferences, updatePreference } = usePreferences();
  const { theme, language, currency } = preferences;

  // Navigation section tracker
  const [activeSection, setActiveSection] = useState('hero');

  // Route detection
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentView('not-found');
    } else if (window.location.pathname !== '/' && window.location.pathname !== '') {
      // Basic 404 handling for manual URL entry
      setCurrentView('not-found');
    }
  }, []);

  // Unified startup and session management
  useEffect(() => {
    if (authLoading) return;

    // Handle session restoration and view management
    if (user) {
      setCurrentView(prev => (prev === 'home' || prev === 'auth' ? 'dashboard' : prev));
    } else {
      // If no user and we were on a protected view, go to login
      setCurrentView(prev => (
        prev === 'dashboard' || prev === 'referral-centre' || prev === 'preferences' || prev === 'bonus-center'
          ? 'auth' 
          : prev
      ));
    }
  }, [user?.uid, authLoading]);

  // Preference Toggle callback
  useEffect(() => {
    // ... (rest of favicon code remains the same)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 32, 32);
      
      // Draw premium emerald green triangle representing "A" logo
      const grad = ctx.createLinearGradient(16, 4, 16, 28);
      grad.addColorStop(0, '#34d399');
      grad.addColorStop(1, '#059669');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(28, 28);
      ctx.lineTo(22, 28);
      ctx.lineTo(16, 16);
      ctx.lineTo(10, 28);
      ctx.lineTo(4, 28);
      ctx.closePath();
      ctx.fill();

      // Node marker dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();

      const dataUrl = canvas.toDataURL();
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = dataUrl;
    }
  }, []);

  // Handle intersection observer to highlight active navbar item on scroll
  useEffect(() => {
    if (authLoading) return;

    const sections = ['hero', 'tech', 'features', 'stats', 'preview', 'dashboard'];
    const observers = sections.map((secId) => {
      const el = document.getElementById(secId);
      if (!el) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setActiveSection(secId);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      return { observer, el };
    });

    return () => {
      observers.forEach((obs) => {
        if (obs) obs.observer.unobserve(obs.el);
      });
    };
  }, [authLoading]);

  // Preference Toggle callback
  const handlePreferenceChange = (key: 'theme' | 'language' | 'currency', value: any) => {
    updatePreference(key, value);
  };

  // Navigation click routing
  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  if (authLoading) {
    return <Loader onComplete={() => {}} />;
  }

  const containerBg = theme === 'dark' 
    ? 'bg-[#000000] text-slate-200' 
    : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${containerBg}`} data-version="1.0.5">
      
      {/* Premium fixed trading background image with high-end overlay blending */}
      {currentView !== 'dashboard' && currentView !== 'strategies' && (
        <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none">
          <img 
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop" 
            alt="Aver Premium Background" 
            className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
              theme === 'dark' ? 'opacity-[0.65] mix-blend-lighten' : 'opacity-[0.42] mix-blend-multiply'
            }`}
            referrerPolicy="no-referrer"
          />
          {/* Ambient radial vignette overlay to keep contrast around active panels */}
          <div 
            className={`absolute inset-0 ${
              theme === 'dark' ? 'bg-radial-gradient-dark' : 'bg-radial-gradient-light'
            }`} 
          />

          {/* Premium floating glassmorphic cryptocurrency background tokens */}
          <div className="absolute inset-0 w-full h-full overflow-hidden hidden lg:block">
            
            {/* Bitcoin (₿) Floating Token */}
            <div className="absolute top-[18%] left-[5%] w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/10 to-orange-500/5 border border-amber-500/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.08)] animate-float-1">
              <CoinLogo symbol="BTC" size={32} imgClassName="opacity-30 mix-blend-luminosity hover:opacity-80 transition-opacity duration-300" />
            </div>

            {/* Ethereum (Ξ) Floating Token */}
            <div className="absolute top-[42%] right-[4%] w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-600/5 border border-indigo-500/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.08)] animate-float-2">
              <CoinLogo symbol="ETH" size={40} imgClassName="opacity-30 mix-blend-luminosity hover:opacity-80 transition-opacity duration-300" />
            </div>

            {/* Solana (🆂) Floating Token */}
            <div className="absolute bottom-[22%] left-[6%] w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400/10 to-teal-500/5 border border-emerald-500/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.08)] animate-float-3">
              <CoinLogo symbol="SOL" size={26} imgClassName="opacity-30 mix-blend-luminosity hover:opacity-80 transition-opacity duration-300" />
            </div>

            {/* Aver Platform Token (AVR) */}
            <div className="absolute top-[28%] right-[18%] w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-teal-400/5 border border-emerald-400/25 backdrop-blur-md flex flex-col items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.15)] animate-float-1">
              <CoinLogo symbol="AVR" size={48} className="opacity-40 hover:opacity-90 transition-opacity duration-300" />
              <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400/50 mt-1">AVR</span>
            </div>

            {/* Ripple / XRP Floating Token */}
            <div className="absolute top-[68%] left-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400/10 to-blue-500/5 border border-sky-500/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.08)] animate-float-2">
              <CoinLogo symbol="XRP" size={32} imgClassName="opacity-30 mix-blend-luminosity hover:opacity-80 transition-opacity duration-300" />
            </div>

            {/* Cardano (₳) Floating Token */}
            <div className="absolute bottom-[16%] right-[14%] w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-600/5 border border-blue-500/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.08)] animate-float-3">
              <CoinLogo symbol="ADA" size={32} imgClassName="opacity-30 mix-blend-luminosity hover:opacity-80 transition-opacity duration-300" />
            </div>

          </div>
        </div>
      )}

      {/* Background visual light leak for premium depth */}
      {currentView !== 'dashboard' && currentView !== 'strategies' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-screen pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentView === 'admin' ? (
          <AdminRoot theme={theme} />
        ) : currentView === 'dashboard' ? (
          <Dashboard theme={theme} onNavigate={(view) => setCurrentView(view)} />
        ) : currentView === 'preferences' ? (
          <Preferences theme={theme} onBack={() => setCurrentView('dashboard')} />
        ) : currentView === 'bonus-center' ? (
          <BonusCenter 
            theme={theme} 
            onBack={() => setCurrentView('dashboard')} 
            onNavigate={(tab) => { 
              if (tab === 'preferences') {
                setCurrentView('preferences');
              } else if (tab === 'market-highlights') {
                setCurrentView('market-highlights');
              } else if (tab === 'events-promos') {
                setCurrentView('events-promos');
              } else if (tab === 'referral-centre') {
                setCurrentView('referral-centre');
              } else {
                if (tab === 'ai') {
                  safeStorage.setItem('aver_dashboard_tab', 'ai');
                }
                setCurrentView('dashboard');
              }
            }}
          />
        ) : currentView === 'referral-centre' ? (
          <ReferralCenter
            theme={theme}
            onBack={() => setCurrentView('dashboard')}
          />
        ) : currentView === 'market-highlights' ? (
          <MarketHighlightsPage 
            theme={theme} 
            onBack={() => setCurrentView('dashboard')} 
          />
        ) : currentView === 'events-promos' ? (
          <EventsPromosPage 
            theme={theme} 
            onBack={() => setCurrentView('dashboard')} 
          />
        ) : currentView === 'showcase' ? (
          <PlatformShowcase
            key="showcase"
            theme={theme}
            onBack={() => setCurrentView('home')}
            onGetStarted={() => setCurrentView('auth')}
          />
        ) : currentView === 'not-found' ? (
          <NotFound 
            theme={theme} 
            onBack={() => setCurrentView('home')} 
            onAdminAccess={() => setCurrentView('admin')}
          />
        ) : currentView === 'auth' ? (
          <AuthPage
            theme={theme}
            onBack={() => setCurrentView('home')}
            onSuccess={() => {
              setCurrentView('dashboard');
            }}
          />
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Live Crypto Ticker */}
            <CryptoTicker />

            {/* Navigation */}
            <Navbar
              theme={theme}
              onNavigate={handleNavigate}
              activeSection={activeSection}
              onShowcase={() => setCurrentView('showcase')}
              onAdminAccess={() => setCurrentView('admin')}
            />

            {/* Main Page Layout Flow */}
            <main className="relative z-10">
              {/* Hero Section */}
              <Hero
                theme={theme}
                onShowcase={() => setCurrentView('showcase')}
                onGetStarted={() => setCurrentView('auth')}
              />

              {/* Technology Innovations */}
              <TechInnovations theme={theme} />
              
              {/* Features Showcase */}
              <Features theme={theme} />

              {/* Statistics count up metrics */}
              <Stats theme={theme} />
            </main>

            {/* Detailed Footer */}
            <Footer theme={theme} onNavigate={handleNavigate} />
            
            {/* Floating Preferences & FAQ Quick Hub Console */}
            <QuickHub
              theme={theme}
              language={language}
              currency={currency}
              onPreferenceChange={handlePreferenceChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
