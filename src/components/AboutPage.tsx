import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Send, Copy, Check, ExternalLink, 
  ArrowUpRight, ShieldCheck, Globe, Building, Clock
} from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nyTime, setNyTime] = useState('');

  // Live New York Clock for institutional presence
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
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans selection:bg-[#FFFFFF] selection:text-[#000000] antialiased">
      
      {/* Editorial Top Masthead */}
      <header className="sticky top-0 z-50 bg-[#000000]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Back Action */}
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center space-x-3 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-all cursor-pointer py-2"
          >
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="hidden sm:inline">Return to Platform</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Center Brandmark */}
          <div className="flex items-center space-x-3 text-center">
            <span className="text-xl font-black tracking-[0.3em] uppercase text-white font-mono">
              AVER
            </span>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 hidden sm:inline">
              Institutional Profile
            </span>
          </div>

          {/* Right Status / Fast Contact Jump */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>NYC {nyTime}</span>
            </div>
            
            <button
              type="button"
              onClick={scrollToContact}
              className="px-4 py-2 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </div>

        </div>
      </header>

      {/* Main Editorial Content */}
      <main className="max-w-5xl mx-auto px-6 py-20 sm:py-28 space-y-32">

        {/* HERO SECTION: Title & Executive Summary */}
        <section className="space-y-12 text-left">
          
          <div className="flex items-center space-x-3 text-xs font-mono tracking-[0.25em] uppercase text-neutral-400">
            <span>Corporate Disclosure</span>
            <span>&bull;</span>
            <span>Founded 2022</span>
            <span>&bull;</span>
            <span>New York, NY</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
              About AVER
            </h1>
            <p className="text-2xl sm:text-4xl font-light text-neutral-200 tracking-tight leading-snug">
              Building Intelligent Infrastructure for Modern Trading
            </p>
          </div>

          {/* Lead Paragraphs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6 border-t border-white/15">
            <div className="md:col-span-4 text-xs font-mono tracking-widest uppercase text-neutral-400">
              Executive Overview
            </div>
            <div className="md:col-span-8 space-y-6 text-lg sm:text-xl font-light text-neutral-300 leading-relaxed">
              <p>
                Founded in 2022, AVER is a New York-based financial technology company focused on building intelligent software and AI-assisted infrastructure for modern market participants.
              </p>
              <p>
                Our platform brings together artificial intelligence, market analysis, trading technology, portfolio monitoring, and data-driven decision-making within a unified technology ecosystem.
              </p>
              <p>
                AVER’s objective is to make sophisticated market technology more accessible through products designed around clarity, analytical depth, automation, and user control.
              </p>
            </div>
          </div>

        </section>

        {/* SECTION 1: Our Technology */}
        <section className="space-y-12 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                01. Core Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Our Technology
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              <p>
                At the core of AVER is a technology ecosystem designed to process market information and assist users in evaluating trading opportunities.
              </p>
              <p>
                Our technology includes proprietary systems such as AVERCore AI™, Confluence Engine™, and TriLock Strategy™, developed to support different aspects of market analysis and trading workflows.
              </p>
              <p>
                AVER’s technology is designed to evaluate multiple sources of market information rather than relying on a single indicator or data point.
              </p>
              <p>
                AI-assisted analysis can help identify patterns, evaluate market conditions, monitor positions, and present information in a structured way.
              </p>
            </div>
          </div>

          {/* Three Proprietary Systems: Stark Architectural Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/20 divide-y md:divide-y-0 md:divide-x divide-white/20 mt-8">
            <div className="p-8 space-y-4 bg-black">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block">
                System A &bull; Neural Core
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                AVERCore AI™
              </h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Continuous deep-learning network designed to ingest multi-source market telemetry, detecting macro structure and order flow momentum in real time.
              </p>
            </div>

            <div className="p-8 space-y-4 bg-black">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block">
                System B &bull; Verification Matrix
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Confluence Engine™
              </h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Algorithmic validation layer that cross-references technical indicators, volume profiles, and liquidity pockets before surfacing potential setups.
              </p>
            </div>

            <div className="p-8 space-y-4 bg-black">
              <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block">
                System C &bull; Capital Governance
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                TriLock Strategy™
              </h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Three-tier risk framework regulating dynamic trailing barriers, position allocation ceilings, and systematic capital protection rules.
              </p>
            </div>
          </div>

        </section>

        {/* SECTION 2: Technology Partnerships */}
        <section className="space-y-12 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                02. Infrastructure Stack
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Technology Partnerships
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              <p>
                AVER works with technology providers and infrastructure partners that support the development, security, reliability, and operation of its products.
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                These relationships may involve:
              </p>
            </div>
          </div>

          {/* 8-Part Relationship Directory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-white/20 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
            <div className="divide-y divide-white/20">
              {[
                { num: '01', title: 'Cloud infrastructure', desc: 'High-availability compute nodes and low-latency clustering worldwide.' },
                { num: '02', title: 'Software development infrastructure', desc: 'Continuous deployment pipelines, version control, and regression suites.' },
                { num: '03', title: 'Authentication and identity systems', desc: 'Cryptographic token generation, multi-factor protocols, and zero-knowledge session gates.' },
                { num: '04', title: 'Data infrastructure', desc: 'Real-time WebSocket market streams and normalized historical tick databases.' }
              ].map((item) => (
                <div key={item.num} className="p-6 space-y-2 bg-black hover:bg-neutral-950 transition-colors">
                  <span className="text-xs font-mono text-neutral-400">{item.num}</span>
                  <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                  <p className="text-xs text-neutral-400 font-light">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="divide-y divide-white/20">
              {[
                { num: '05', title: 'Security technology', desc: 'Penetration audit suites, automated anomaly detection, and endpoint isolation.' },
                { num: '06', title: 'Analytics', desc: 'Statistical modeling engines, latency benchmarking, and execution telemetry.' },
                { num: '07', title: 'Payment infrastructure', desc: 'Institutional payment routing, settlement gateways, and multi-rail custody integration.' },
                { num: '08', title: 'Other technical services required to operate a modern financial technology platform', desc: 'Supplementary hosting, DNS redundancy, and telecommunications clearance routes.' }
              ].map((item) => (
                <div key={item.num} className="p-6 space-y-2 bg-black hover:bg-neutral-950 transition-colors">
                  <span className="text-xs font-mono text-neutral-400">{item.num}</span>
                  <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                  <p className="text-xs text-neutral-400 font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* SECTION 3: Strategic Partnerships */}
        <section className="space-y-12 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                03. Alliances
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Strategic Partnerships
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              <p>
                AVER develops strategic relationships with organizations and technology companies whose capabilities complement its products and long-term objectives.
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                Strategic relationships may support:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/20 divide-x divide-y sm:divide-y-0 divide-white/20 text-center">
            {[
              'Technology development',
              'Product integrations',
              'Market-data infrastructure',
              'Business development',
              'Distribution',
              'Research and innovation',
              'Platform expansion'
            ].map((domain, i) => (
              <div key={i} className="p-6 flex flex-col justify-center items-center bg-black hover:bg-neutral-950 transition-colors">
                <span className="text-xs font-mono text-neutral-400 mb-2">Scope {i + 1}</span>
                <span className="text-sm font-bold text-white leading-snug">{domain}</span>
              </div>
            ))}
            <div className="p-6 flex flex-col justify-center items-center bg-neutral-950 border-t sm:border-t-0 border-white/20">
              <span className="text-xs font-mono text-neutral-400 mb-2">Protocol</span>
              <span className="text-xs text-neutral-300 font-mono">Formal Disclosures Only</span>
            </div>
          </div>

          <p className="text-xs font-mono text-neutral-400 leading-relaxed border-l-2 border-white pl-4">
            Specific partnerships may be disclosed through official announcements or the relevant partner’s public channels where appropriate.
          </p>

        </section>

        {/* SECTION 4: Independent Verification */}
        <section className="space-y-8 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                04. Governance
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Independent Verification
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              <p>
                AVER aims to maintain transparent information regarding its corporate identity, technology, and business relationships.
              </p>
              <p>
                Where a partnership or corporate relationship is publicly disclosed, users may verify the relationship through the relevant organization’s official website, announcement, partner directory, or other independently maintained source.
              </p>
            </div>
          </div>

          {/* Stark Institutional Quote Box */}
          <div className="p-8 sm:p-12 border-2 border-white bg-black">
            <p className="text-xl sm:text-2xl font-bold text-white tracking-wide leading-relaxed">
              &ldquo;AVER does not represent a company as a partner unless a genuine relationship exists.&rdquo;
            </p>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 mt-4 block">
              AVER Technologies Corporate Integrity Standard
            </span>
          </div>

        </section>

        {/* SECTION 5: Corporate Information */}
        <section className="space-y-8 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                05. Registry
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Corporate Information
              </h2>
            </div>

            <div className="md:col-span-8">
              <div className="border border-white/20 divide-y divide-white/20">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Company</span>
                  <span className="text-base font-bold text-white font-mono">AVER</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Founded</span>
                  <span className="text-base font-bold text-white font-mono">2022</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Business Sector</span>
                  <span className="text-base font-bold text-white">Financial Technology / Software</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Headquarters</span>
                  <span className="text-base font-bold text-white">New York, United States</span>
                </div>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black">
                  <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">Website</span>
                  <a
                    href="https://avertrader.space"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-base font-mono font-bold text-white hover:underline underline-offset-4"
                  >
                    <span>avertrader.space</span>
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* SECTION 6: CONTACT AVER — HIGH-PRIORITY ACTION CARDS WITH DIRECT PRESSABLE BUTTONS */}
        <section id="contact-section" className="space-y-12 text-left border-t-2 border-white pt-20">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-xs font-mono tracking-[0.25em] uppercase text-neutral-400">
              <span>06. Direct Communications</span>
              <span>&bull;</span>
              <span>Active Gateways</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Contact AVER
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 font-light max-w-2xl">
              All communications routes below are monitored directly by the AVER administrative desk. Click any button to connect immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. Customer Support Card */}
            <div className="border border-white p-8 bg-black flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                    Desk 01
                  </span>
                  <Mail className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Customer Support
                </h3>
                
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  For account, platform, technical, or general customer-support matters:
                </p>

                <div className="p-3 bg-neutral-950 border border-white/20 font-mono text-sm text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href="mailto:support@avertrader.space?subject=Customer%20Support%20Inquiry"
                  className="w-full py-4 px-6 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-black uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-black" />
                  <span>Email Customer Support</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('support_email', 'support@avertrader.space')}
                  className="w-full py-3 px-6 border border-white/30 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'support_email' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Email Address Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copy support@avertrader.space</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Telegram Support Card */}
            <div className="border border-white p-8 bg-black flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                    Desk 02 &bull; Instant Channel
                  </span>
                  <Send className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Telegram Support
                </h3>
                
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  Users can also contact AVER through our official Telegram support channel:
                </p>

                <div className="p-3 bg-neutral-950 border border-white/20 font-mono text-sm text-white break-all select-all">
                  https://t.me/AverAssistancebot
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href="https://t.me/AverAssistancebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-black uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <Send className="w-4 h-4 text-black" />
                  <span>Launch Telegram (@AverAssistancebot)</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('telegram_link', 'https://t.me/AverAssistancebot')}
                  className="w-full py-3 px-6 border border-white/30 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'telegram_link' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Telegram Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copy @AverAssistancebot Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Business & Partnerships Card */}
            <div className="border border-white p-8 bg-black flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                    Desk 03
                  </span>
                  <Building className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Business &amp; Partnerships
                </h3>
                
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  For partnership proposals, technology integrations, strategic relationships, and business-development inquiries:
                </p>

                <div className="p-3 bg-neutral-950 border border-white/20 font-mono text-sm text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href="mailto:support@avertrader.space?subject=Business%20%26%20Partnership%20Proposal"
                  className="w-full py-4 px-6 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-black uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-black" />
                  <span>Send Partnership Proposal</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('partner_email', 'support@avertrader.space')}
                  className="w-full py-3 px-6 border border-white/30 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'partner_email' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Email Address Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copy support@avertrader.space</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4. Legal & Corporate Inquiries Card */}
            <div className="border border-white p-8 bg-black flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                    Desk 04
                  </span>
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Legal &amp; Corporate Inquiries
                </h3>
                
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  For legal notices, corporate verification, and formal corporate inquiries:
                </p>

                <div className="p-3 bg-neutral-950 border border-white/20 font-mono text-sm text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href="mailto:support@avertrader.space?subject=Legal%20%26%20Corporate%20Inquiry"
                  className="w-full py-4 px-6 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-black uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center justify-center space-x-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                >
                  <Mail className="w-4 h-4 text-black" />
                  <span>Dispatch Corporate Notice</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('legal_email', 'support@avertrader.space')}
                  className="w-full py-3 px-6 border border-white/30 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'legal_email' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Email Address Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copy support@avertrader.space</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* SECTION 7: Official Communication */}
        <section className="space-y-8 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                07. Verification Guard
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Official Communication
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              <p>
                For security and user protection, users should verify that communications claiming to represent AVER originate from official AVER channels.
              </p>
            </div>
          </div>

          <div className="border border-white/20 divide-y divide-white/20">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-400 block">Official Website</span>
                <span className="text-base font-bold text-white font-mono mt-1 block">avertrader.space</span>
              </div>
              <a
                href="https://avertrader.space"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-center"
              >
                <span>Visit avertrader.space</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-400 block">Official Support Email</span>
                <span className="text-base font-bold text-white font-mono mt-1 block">support@avertrader.space</span>
              </div>
              <a
                href="mailto:support@avertrader.space"
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-center"
              >
                <span>Compose Email</span>
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-400 block">Official Telegram</span>
                <span className="text-base font-bold text-white font-mono mt-1 block">@AverAssistancebot</span>
              </div>
              <a
                href="https://t.me/AverAssistancebot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-2 transition-colors cursor-pointer self-start sm:self-center"
              >
                <span>Open @AverAssistancebot</span>
                <Send className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </section>

        {/* SECTION 8: Our Approach */}
        <section className="space-y-12 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                08. Operating Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Our Approach
              </h2>
            </div>

            <div className="md:col-span-8">
              <div className="border border-white/20 divide-y divide-white/20">
                
                <div className="p-8 space-y-3 bg-black">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 block">
                    Pillar I
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Intelligence
                  </h3>
                  <p className="text-base text-neutral-300 font-light leading-relaxed">
                    We use advanced technology and data-driven systems to help users process complex market information.
                  </p>
                </div>

                <div className="p-8 space-y-3 bg-black">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 block">
                    Pillar II
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Control
                  </h3>
                  <p className="text-base text-neutral-300 font-light leading-relaxed">
                    Our technology is designed to assist users while maintaining transparency and user control.
                  </p>
                </div>

                <div className="p-8 space-y-3 bg-black">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 block">
                    Pillar III
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    Transparency
                  </h3>
                  <p className="text-base text-neutral-300 font-light leading-relaxed">
                    We aim to present information about AVER, its technology, and its business relationships accurately and clearly.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </section>

        {/* SECTION 9: Our Vision */}
        <section className="space-y-8 text-left border-t border-white/20 pt-16">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-neutral-400 block">
                09. Future State
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Our Vision
              </h2>
            </div>

            <div className="md:col-span-8 space-y-6 text-lg sm:text-xl text-neutral-200 font-light leading-relaxed">
              <p>
                AVER’s long-term vision is to develop a technology ecosystem where artificial intelligence, market intelligence, and modern financial infrastructure work together in a unified environment.
              </p>
              <p>
                We are building toward a future in which sophisticated financial technology can be presented through intuitive products that users can understand, monitor, and control.
              </p>
            </div>
          </div>

        </section>

        {/* SECTION 10: Institutional Colophon & Signature */}
        <section className="pt-24 pb-16 border-t-2 border-white text-center space-y-10">
          
          <div className="space-y-4">
            <h2 className="text-5xl sm:text-7xl font-black tracking-[0.25em] uppercase text-white font-mono">
              AVER
            </h2>
            <p className="text-xs font-mono tracking-[0.3em] uppercase text-neutral-400">
              Founded 2022 &bull; New York, United States
            </p>
          </div>

          <div className="inline-block border border-white/30 px-6 py-3">
            <p className="text-sm sm:text-base font-mono tracking-[0.2em] uppercase text-white font-bold">
              Intelligence. Infrastructure. Control.
            </p>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={onBack}
              className="px-10 py-5 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-black uppercase tracking-[0.25em] transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-[0.98]"
            >
              Return to Trading Platform
            </button>
          </div>

        </section>

      </main>

      {/* Minimalist Monochrome Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs font-mono text-neutral-500">
        <p>© 2022&ndash;2026 AVER Technologies Inc. All rights reserved. New York, NY.</p>
      </footer>

    </div>
  );
}
