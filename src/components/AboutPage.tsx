import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Mail, Send, Copy, Check, ExternalLink, 
  Shield, Cpu, Sparkles, Globe, Building2, Lock, Zap 
} from 'lucide-react';
import { copyToClipboard } from '../lib/clipboard';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-white selection:text-black relative overflow-x-hidden">
      
      {/* Monochrome Ambient Vignette */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-white/10 via-transparent to-transparent blur-[120px] pointer-events-none" />

      {/* Clean Minimalist Header: Back to Platform & About Aver at extreme left */}
      <header className="sticky top-0 z-50 bg-[#000000]/95 backdrop-blur-xl border-b border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 group-hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
              <span className="font-bold">Back to Platform</span>
            </button>

            <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />

            <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-white font-mono">
              About Aver
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 sm:py-28 space-y-24">

        {/* SECTION: ABOUT AVER */}
        <section className="space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest block">Corporate Profile</span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              About AVER
            </h1>
            <p className="text-2xl sm:text-3xl font-light text-neutral-300 tracking-tight leading-snug">
              Building Intelligent Infrastructure for Modern Trading
            </p>
          </div>

          <div className="space-y-6 text-lg sm:text-xl font-light text-neutral-300 leading-relaxed border-l-2 border-white/30 pl-6 py-2">
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
        </section>

        <hr className="border-white/15" />

        {/* SECTION: OUR TECHNOLOGY */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Core Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Technology</h2>
          </div>

          <div className="space-y-6 text-base sm:text-lg font-light text-neutral-300 leading-relaxed">
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
        </section>

        <hr className="border-white/15" />

        {/* SECTION: TECHNOLOGY PARTNERSHIPS */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Ecosystem Infrastructure</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Technology Partnerships</h2>
          </div>

          <div className="space-y-6 text-base sm:text-lg font-light text-neutral-300 leading-relaxed">
            <p>
              AVER works with technology providers and infrastructure partners that support the development, security, reliability, and operation of its products.
            </p>
            <p className="font-semibold text-white">These relationships may involve:</p>
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
                <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl bg-neutral-950 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                  <span className="text-xs font-medium text-neutral-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: STRATEGIC PARTNERSHIPS */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Alliances &amp; Growth</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Strategic Partnerships</h2>
          </div>

          <div className="space-y-6 text-base sm:text-lg font-light text-neutral-300 leading-relaxed">
            <p>
              AVER develops strategic relationships with organizations and technology companies whose capabilities complement its products and long-term objectives.
            </p>
            <p className="font-semibold text-white">Strategic relationships may support:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                'Technology development',
                'Product integrations',
                'Market-data infrastructure',
                'Business development',
                'Distribution',
                'Research and innovation',
                'Platform expansion'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl bg-neutral-950 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                  <span className="text-xs font-medium text-neutral-200">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm font-mono text-neutral-400 pt-2">
              Specific partnerships may be disclosed through official announcements or the relevant partner’s public channels where appropriate.
            </p>
          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: INDEPENDENT VERIFICATION */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Transparency Standard</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Independent Verification</h2>
          </div>

          <div className="space-y-6 text-base sm:text-lg font-light text-neutral-300 leading-relaxed">
            <p>
              AVER aims to maintain transparent information regarding its corporate identity, technology, and business relationships.
            </p>
            <p>
              Where a partnership or corporate relationship is publicly disclosed, users may verify the relationship through the relevant organization’s official website, announcement, partner directory, or other independently maintained source.
            </p>
            <div className="p-6 rounded-2xl bg-neutral-950 border border-white/20 text-center">
              <p className="text-lg sm:text-xl font-bold text-white tracking-wide">
                &ldquo;AVER does not represent a company as a partner unless a genuine relationship exists.&rdquo;
              </p>
            </div>
          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: CORPORATE INFORMATION */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Registry Data</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Corporate Information</h2>
          </div>

          <div className="rounded-3xl bg-neutral-950 border border-white/15 overflow-hidden shadow-2xl divide-y divide-white/10">
            {[
              { label: 'Company', value: 'AVER' },
              { label: 'Founded', value: '2022' },
              { label: 'Business Sector', value: 'Financial Technology / Software' },
              { label: 'Headquarters', value: 'New York, United States' },
              { label: 'Website', value: 'avertrader.space', isLink: true, href: 'https://avertrader.space' },
            ].map((row, idx) => (
              <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/60 hover:bg-neutral-900 transition-colors">
                <span className="text-xs font-mono uppercase text-neutral-400 tracking-widest">{row.label}</span>
                {row.isLink ? (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm font-mono font-bold text-white hover:underline"
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

        <hr className="border-white/15" />

        {/* SECTION: CONTACT AVER */}
        <section id="contact-section" className="space-y-10">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Communications Hub</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Contact AVER</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Customer Support */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 hover:border-white transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 01</span>
                </div>
                <h3 className="text-xl font-bold text-white">Customer Support</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For account, platform, technical, or general customer-support matters:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/15 font-mono text-xs text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Customer%20Support%20Inquiry"
                  className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Customer Support</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('support_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'support_email' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'support_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

            {/* 2. Telegram Support */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 hover:border-white transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 02</span>
                </div>
                <h3 className="text-xl font-bold text-white">Telegram Support</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Users can also contact AVER through our official Telegram support channel:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/15 font-mono text-xs text-white break-all select-all">
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
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'telegram_link' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'telegram_link' ? 'Link Copied' : 'Copy Telegram Link'}</span>
                </button>
              </div>
            </div>

            {/* 3. Business & Partnerships */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 hover:border-white transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 03</span>
                </div>
                <h3 className="text-xl font-bold text-white">Business &amp; Partnerships</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For partnership proposals, technology integrations, strategic relationships, and business-development inquiries:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/15 font-mono text-xs text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Business%20%26%20Partnership%20Proposal"
                  className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Partnership Proposal</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('partner_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'partner_email' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'partner_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

            {/* 4. Legal & Corporate Inquiries */}
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 hover:border-white transition-all duration-300 flex flex-col justify-between space-y-6 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Desk 04</span>
                </div>
                <h3 className="text-xl font-bold text-white">Legal &amp; Corporate Inquiries</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  For legal notices, corporate verification, and formal corporate inquiries:
                </p>
                <div className="p-3 rounded-xl bg-black border border-white/15 font-mono text-xs text-white select-all">
                  support@avertrader.space
                </div>
              </div>

              <div className="space-y-2.5 pt-4">
                <a
                  href="mailto:support@avertrader.space?subject=Legal%20%26%20Corporate%20Inquiry"
                  className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Corporate Inquiry</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleCopy('legal_email', 'support@avertrader.space')}
                  className="w-full py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedId === 'legal_email' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-neutral-400" />}
                  <span>{copiedId === 'legal_email' ? 'Address Copied' : 'Copy Email Address'}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: OFFICIAL COMMUNICATION */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Security Protocol</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Official Communication</h2>
          </div>

          <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 space-y-6 shadow-2xl">
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed">
              For security and user protection, users should verify that communications claiming to represent AVER originate from official AVER channels.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official website</span>
                  <span className="text-sm font-bold text-white font-mono">avertrader.space</span>
                </div>
                <a href="https://avertrader.space" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold transition-colors inline-flex items-center space-x-1.5">
                  <span>Visit Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official support email</span>
                  <span className="text-sm font-bold text-white font-mono">support@avertrader.space</span>
                </div>
                <a href="mailto:support@avertrader.space" className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold transition-colors inline-flex items-center space-x-1.5">
                  <span>Send Mail</span>
                  <Mail className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-neutral-400 block">Official Telegram</span>
                  <span className="text-sm font-bold text-white font-mono">@AverAssistancebot</span>
                </div>
                <a href="https://t.me/AverAssistancebot" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold transition-colors inline-flex items-center space-x-1.5">
                  <span>Open Bot</span>
                  <Send className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: OUR APPROACH */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Operating Principles</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Approach</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Intelligence</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                We use advanced technology and data-driven systems to help users process complex market information.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Control</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Our technology is designed to assist users while maintaining transparency and user control.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-neutral-950 border border-white/15 space-y-4 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Transparency</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                We aim to present information about AVER, its technology, and its business relationships accurately and clearly.
              </p>
            </div>
          </div>
        </section>

        <hr className="border-white/15" />

        {/* SECTION: OUR VISION */}
        <section className="space-y-8">
          <div className="border-l-2 border-white pl-4 space-y-1">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Long-Term Horizon</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Our Vision</h2>
          </div>

          <div className="p-8 sm:p-12 rounded-3xl bg-neutral-950 border border-white/15 space-y-6 shadow-2xl text-lg sm:text-xl text-neutral-200 font-light leading-relaxed">
            <p>
              AVER’s long-term vision is to develop a technology ecosystem where artificial intelligence, market intelligence, and modern financial infrastructure work together in a unified environment.
            </p>
            <p>
              We are building toward a future in which sophisticated financial technology can be presented through intuitive products that users can understand, monitor, and control.
            </p>
          </div>
        </section>

        {/* CLOSING / COLOPHON */}
        <section className="pt-16 pb-12 text-center space-y-8 border-t border-white/15">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-6xl font-black tracking-widest uppercase text-white font-mono">
              AVER
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Founded 2022 &bull; New York, United States
            </p>
          </div>

          <div className="inline-block px-6 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-mono font-bold tracking-widest uppercase">
            Intelligence. Infrastructure. Control.
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-10 py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
            >
              Return to Trading Platform
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/15 py-8 px-6 text-center text-xs font-mono text-neutral-500 bg-black">
        <p>&copy; 2022&ndash;2026 AVER Technologies Inc. All rights reserved. New York, NY.</p>
      </footer>

    </div>
  );
}
