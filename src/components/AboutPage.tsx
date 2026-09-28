import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mail, Send, Copy, Check, ExternalLink, 
  ArrowUpRight, Shield, Cpu, Sparkles, Globe, Building2, 
  Lock, Zap, CheckCircle2, Terminal
} from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';
import AverLogo from './AverLogo';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nyTime, setNyTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date());
        setNyTime(`${timeStr} EST`);
      } catch {
        setNyTime('12:00:00 EST');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] bg-emerald-600/5 blur-[160px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#000000]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center space-x-3 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="font-bold">Return to Platform</span>
          </button>

          <div className="flex items-center space-x-3">
            <AverLogo theme="dark" size={36} />
            <div className="hidden sm:block text-left">
              <span className="text-sm font-black tracking-widest uppercase block text-white">AVER</span>
              <span className="text-[10px] font-mono text-emerald-400 block">Autonomous Systems</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>NYC {nyTime}</span>
            </div>

            <button
              type="button"
              onClick={scrollToContact}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
            >
              Contact Us
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28 space-y-28">

        {/* HERO SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center sm:text-left space-y-8"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="w-3.5 h-3.5" />
            <span>Corporate Disclosure &amp; Architecture Profile</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.08] bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              About AVER
            </h1>
            <p className="text-2xl sm:text-4xl font-light text-neutral-300 tracking-tight leading-snug">
              Building Intelligent Infrastructure for Modern Trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-md space-y-3 shadow-2xl">
              <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Founded 2022</div>
              <h3 className="text-lg font-bold text-white">New York Headquarters</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Headquartered in New York, United States, pioneering financial technology and algorithmic execution systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-md space-y-3 shadow-2xl">
              <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Neural Ecosystem</div>
              <h3 className="text-lg font-bold text-white">Unified Intelligence</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Integrating artificial intelligence, market analysis, portfolio monitoring, and risk governance into one seamless workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 backdrop-blur-md space-y-3 shadow-2xl">
              <div className="text-emerald-400 font-mono text-xs uppercase tracking-widest">Mission Objective</div>
              <h3 className="text-lg font-bold text-white">Accessibility &amp; Control</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Making sophisticated market technology accessible through products built on clarity, automation, and absolute user control.
              </p>
            </div>
          </div>
        </motion.section>

        {/* SECTION 1: OUR TECHNOLOGY */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Core Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Technology</h2>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              At the core of AVER is a technology ecosystem designed to process market information and assist users in evaluating trading opportunities.
            </p>
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              Our technology includes proprietary systems such as AVERCore AI™, Confluence Engine™, and TriLock Strategy™, developed to support different aspects of market analysis and trading workflows.
            </p>
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              AVER’s technology is designed to evaluate multiple sources of market information rather than relying on a single indicator or data point. AI-assisted analysis helps identify patterns, evaluate market conditions, monitor positions, and present information in a structured way.
            </p>
          </div>

          {/* 3 Proprietary Systems Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-black border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)] group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AVERCore AI™</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Continuous neural evaluation engine ingesting multi-source market telemetry for pattern detection and structural trend analysis.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-black border border-teal-500/20 hover:border-teal-500/50 transition-all duration-300 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)] group">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Confluence Engine™</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Multi-dimensional signal aggregator verifying technical indicators, volume profiles, and momentum vectors simultaneously.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-black border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.9)] group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">TriLock Strategy™</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Dynamic risk-governance framework enforcing algorithmic stop thresholds, position sizing, and volatility target corridors.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: TECHNOLOGY PARTNERSHIPS */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Infrastructure Ecosystem</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Technology Partnerships</h2>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              AVER works with technology providers and infrastructure partners that support the development, security, reliability, and operation of its products.
            </p>
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block">These relationships may involve:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Cloud infrastructure',
                  'Software development infrastructure',
                  'Authentication and identity systems',
                  'Data infrastructure',
                  'Security technology',
                  'Analytics',
                  'Payment infrastructure',
                  'Other technical services required to operate a modern financial technology platform'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl bg-black border border-white/5 hover:border-white/20 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-neutral-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: STRATEGIC PARTNERSHIPS */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Alliances &amp; Growth</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Strategic Partnerships</h2>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              AVER develops strategic relationships with organizations and technology companies whose capabilities complement its products and long-term objectives.
            </p>
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block">Strategic relationships may support:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  'Technology development',
                  'Product integrations',
                  'Market-data infrastructure',
                  'Business development',
                  'Distribution',
                  'Research and innovation',
                  'Platform expansion'
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black border border-white/10 text-center flex flex-col justify-center">
                    <span className="text-xs font-semibold text-neutral-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs font-mono text-neutral-400 pt-2 border-t border-white/10">
              Specific partnerships may be disclosed through official announcements or the relevant partner’s public channels where appropriate.
            </p>
          </div>
        </section>

        {/* SECTION 4: INDEPENDENT VERIFICATION */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Transparency Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Independent Verification</h2>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-black to-black border border-emerald-500/30 space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              AVER aims to maintain transparent information regarding its corporate identity, technology, and business relationships. Where a partnership or corporate relationship is publicly disclosed, users may verify the relationship through the relevant organization’s official website, announcement, partner directory, or other independently maintained source.
            </p>
            <div className="p-6 rounded-2xl bg-black/80 border border-emerald-500/40 text-center">
              <p className="text-lg sm:text-xl font-bold text-emerald-400 tracking-wide">
                &ldquo;AVER does not represent a company as a partner unless a genuine relationship exists.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: CORPORATE INFORMATION */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Registry Data</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Corporate Information</h2>
          </div>

          <div className="rounded-3xl bg-neutral-950/80 border border-white/10 overflow-hidden shadow-2xl divide-y divide-white/10">
            {[
              { label: 'Company', value: 'AVER' },
              { label: 'Founded', value: '2022' },
              { label: 'Business Sector', value: 'Financial Technology / Software' },
              { label: 'Headquarters', value: 'New York, United States' },
              { label: 'Website', value: 'avertrader.space', isLink: true, href: 'https://avertrader.space' },
            ].map((row, idx) => (
              <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/40 hover:bg-black transition-colors">
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-widest">{row.label}</span>
                {row.isLink ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm font-mono font-bold text-emerald-400 hover:underline"
                  >
                    <span>{row.value}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-sm font-bold text-white font-mono">{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: CONTACT AVER — STUNNING DIRECT ACTION CARDS */}
        <section id="contact-section" className="space-y-12">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Communications Hub</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Contact AVER</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Customer Support */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 01</span>
                </div>
                <h3 className="text-xl font-bold text-white">Customer Support</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For account, platform, technical, or general customer-support matters:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/10 font-mono text-xs text-emerald-400 select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Customer%20Support%20Inquiry"
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Customer Support</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('support_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'support_email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'support_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

            {/* 2. Telegram Support */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 02</span>
                </div>
                <h3 className="text-xl font-bold text-white">Telegram Support</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Users can also contact AVER through our official Telegram support channel:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/10 font-mono text-xs text-cyan-400 break-all select-all">
                  https://t.me/AverAssistancebot
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="https://t.me/AverAssistancebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Open Telegram Support</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('telegram_link', 'https://t.me/AverAssistancebot')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'telegram_link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'telegram_link' ? 'Link Copied' : 'Copy Telegram Link'}</span>
                </button>
              </div>
            </div>

            {/* 3. Business & Partnerships */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 03</span>
                </div>
                <h3 className="text-xl font-bold text-white">Business &amp; Partnerships</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For partnership proposals, technology integrations, strategic relationships, and business-development inquiries:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/10 font-mono text-xs text-teal-400 select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Business%20%26%20Partnership%20Proposal"
                  className="w-full py-3.5 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Partnership Proposal</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('partner_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'partner_email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'partner_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

            {/* 4. Legal & Corporate Inquiries */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 04</span>
                </div>
                <h3 className="text-xl font-bold text-white">Legal &amp; Corporate Inquiries</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For legal notices, corporate verification, and formal corporate inquiries:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/10 font-mono text-xs text-indigo-400 select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Legal%20%26%20Corporate%20Inquiry"
                  className="w-full py-3.5 px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Corporate Inquiry</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('legal_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'legal_email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'legal_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 7: OFFICIAL COMMUNICATION */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Security Protocol</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Official Communication</h2>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-950/80 border border-white/10 space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              For security and user protection, users should verify that communications claiming to represent AVER originate from official AVER channels.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official Website</span>
                  <span className="text-sm font-bold text-white font-mono">avertrader.space</span>
                </div>
                <a href="https://avertrader.space" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors inline-flex items-center space-x-1.5">
                  <span>Visit Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official Support Email</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">support@avertrader.space</span>
                </div>
                <a href="mailto:support@avertrader.space" className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-mono font-bold text-emerald-400 transition-colors inline-flex items-center space-x-1.5">
                  <span>Send Mail</span>
                  <Mail className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-black border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official Telegram</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">@AverAssistancebot</span>
                </div>
                <a href="https://t.me/AverAssistancebot" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-mono font-bold text-cyan-400 transition-colors inline-flex items-center space-x-1.5">
                  <span>Open Bot</span>
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: OUR APPROACH */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Operating Principles</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Approach</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 space-y-4 shadow-2xl">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Pillar 01</div>
              <h3 className="text-xl font-bold text-white">Intelligence</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                We use advanced technology and data-driven systems to help users process complex market information.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 space-y-4 shadow-2xl">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Pillar 02</div>
              <h3 className="text-xl font-bold text-white">Control</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Our technology is designed to assist users while maintaining transparency and user control.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/10 space-y-4 shadow-2xl">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Pillar 03</div>
              <h3 className="text-xl font-bold text-white">Transparency</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                We aim to present information about AVER, its technology, and its business relationships accurately and clearly.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9: OUR VISION */}
        <section className="space-y-10">
          <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Long-Term Horizon</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Vision</h2>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-neutral-950/80 border border-white/10 space-y-6 shadow-2xl">
            <p className="text-lg sm:text-xl text-neutral-200 font-light leading-relaxed">
              AVER’s long-term vision is to develop a technology ecosystem where artificial intelligence, market intelligence, and modern financial infrastructure work together in a unified environment.
            </p>
            <p className="text-lg sm:text-xl text-neutral-200 font-light leading-relaxed">
              We are building toward a future in which sophisticated financial technology can be presented through intuitive products that users can understand, monitor, and control.
            </p>
          </div>
        </section>

        {/* CLOSING / COLOPHON */}
        <section className="pt-20 pb-12 text-center space-y-8 border-t border-white/10">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-6xl font-black tracking-widest uppercase text-white font-mono">
              AVER
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Founded 2022 &bull; New York, United States
            </p>
          </div>

          <div className="inline-block px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
            Intelligence. Infrastructure. Control.
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
            >
              Return to Trading Platform
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs font-mono text-neutral-500 bg-black">
        <p>&copy; 2022&ndash;2026 AVER Technologies Inc. All rights reserved. New York, NY.</p>
      </footer>

    </div>
  );
}
