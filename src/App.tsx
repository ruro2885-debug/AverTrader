import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TechInnovations from './components/TechInnovations';
import Features from './components/Features';
import Stats from './components/Stats';
import QuickHub from './components/QuickHub';
import Footer from './components/Footer';
import PlatformShowcase from './components/PlatformShowcase';
import { usePreferences } from './contexts/PreferencesContext';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'showcase'>('home');
  const { preferences, updatePreference } = usePreferences();
  const { theme, language, currency } = preferences;

  // Navigation section tracker
  const [activeSection, setActiveSection] = useState('hero');

  // Update dynamically browser favicon
  useEffect(() => {
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
    if (loading) return;

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
  }, [loading]);

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

  if (loading) {
    return <Loader onComplete={() => setLoading(false)} />;
  }

  const containerBg = theme === 'dark' 
    ? 'bg-[#050505] text-slate-200' 
    : 'bg-slate-50 text-slate-900';

  return (
    <div className={`min-h-screen transition-colors duration-300 relative ${containerBg}`}>
      
      {/* Background visual light leak for premium depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-screen pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <AnimatePresence mode="wait">
        {currentView === 'showcase' ? (
          <PlatformShowcase
            key="showcase"
            theme={theme}
            onBack={() => setCurrentView('home')}
          />
        ) : (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Navigation */}
            <Navbar
              theme={theme}
              onNavigate={handleNavigate}
              activeSection={activeSection}
              onShowcase={() => setCurrentView('showcase')}
            />

            {/* Main Page Layout Flow */}
            <main className="relative z-10">
              {/* Hero Section */}
              <Hero
                theme={theme}
                onShowcase={() => setCurrentView('showcase')}
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
