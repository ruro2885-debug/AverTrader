import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Cpu, Terminal, Globe, Mail } from 'lucide-react';

interface AboutPageProps {
  theme?: 'light' | 'dark';
  onBack?: () => void;
}

export default function AboutPage({ theme = 'dark', onBack }: AboutPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = 'About Us | AVER Technologies';
  }, []);

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'AVER Technologies',
    'url': 'https://avertrader.space',
    'logo': 'https://avertrader.space/logo.png',
    'foundingDate': '2022',
    'sameAs': ['https://t.me/avertrader'],
    'description':
      'AI-powered trading workspace and market execution platform connected to real-time NYSE telemetry streams.',
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans p-4 md:p-12 flex flex-col justify-between">
      {/* Properly Sanitized Server-Side JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="max-w-4xl mx-auto w-full">
        <header className="flex items-center justify-between mb-12 pb-6 border-b border-slate-800">
          <button
            type="button"
            onClick={handleReturn}
            className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer select-none"
          >
            <ArrowLeft size={16} /> Return to Terminal
          </button>
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            avertrader.space / about
          </span>
        </header>

        <main className="space-y-12">
          {/* Section 1: About AVER */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="text-emerald-400" size={24} />
              <h1 className="text-2xl font-bold text-white tracking-tight">1. About AVER</h1>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              AVER is a high-speed, AI-driven trading workspace and real-time telemetry execution platform engineered for intelligent market analysis and automated strategy management.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              Built for quantitative traders, algorithmic strategy creators, and tech-focused market participants who demand high-speed interface tools without custodial friction.
            </p>
          </section>

          {/* Section 2: Our Identity */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-emerald-400" size={24} />
              <h2 className="text-xl font-bold text-white">2. Our Identity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block text-xs">LEGAL BRAND</span>
                <span className="text-emerald-300 font-semibold">AVER Technologies (AVER Space)</span>
              </div>
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 block text-xs">ESTABLISHED</span>
                <span className="text-slate-200">2022</span>
              </div>
            </div>
          </section>

          {/* Section 3: How AVER Works */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <h2 className="text-xl font-bold text-white mb-3">3. How AVER Works</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              AVER operates purely as a non-custodial execution terminal and client-side workspace. AVER does NOT accept retail deposits, process fiat transactions, or store user funds or private keys on centralized servers. Trading activities execute via encrypted user-configured API credentials directly connected to third-party exchanges and brokerages.
            </p>
          </section>

          {/* Section 4: Technology & Market Data */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="text-emerald-400" size={24} />
              <h2 className="text-xl font-bold text-white">4. Technology &amp; Market Data</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Powered by Next.js/React frontend architecture, Firestore cloud synchronization, AverCore AI™ neural execution engine, and integrated global market data streams including NYSE telemetry feeds.
            </p>
          </section>

          {/* Section 5: Regulatory & Legal Information */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-emerald-400" size={24} />
              <h2 className="text-xl font-bold text-white">5. Regulatory &amp; Legal Information</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              AVER is strictly a software, technology, and market telemetry provider. AVER is not a registered broker-dealer, custodial financial institution, futures commission merchant, or registered investment advisor (RIA).
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-xl backdrop-blur-md shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="text-emerald-400" size={24} />
              <h2 className="text-xl font-bold text-white">6. Contact &amp; Corporate Information</h2>
            </div>
            <p className="text-slate-300 text-sm">
              Official Email:{' '}
              <a href="mailto:support@avertrader.space" className="text-emerald-400 underline hover:text-emerald-300">
                support@avertrader.space
              </a>
            </p>
            <p className="text-slate-300 text-sm mt-2">
              Telegram:{' '}
              <a href="https://t.me/avertrader" className="text-emerald-400 underline hover:text-emerald-300" target="_blank" rel="noreferrer">
                t.me/avertrader
              </a>
            </p>
          </section>
        </main>
      </div>

      <footer className="mt-16 border-t border-slate-800/80 pt-6 px-4 bg-[#07090e]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-emerald-400 transition-colors cursor-pointer">
              About Us
            </button>
            <button type="button" onClick={handleReturn} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Terms
            </button>
            <button type="button" onClick={handleReturn} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Privacy
            </button>
          </div>
          <p>© 2022–2026 AVER TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
