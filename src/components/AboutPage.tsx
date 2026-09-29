import React, { useEffect } from 'react';
import { ArrowLeft, Mail, Send, ExternalLink, ShieldCheck, Check, Building2, Globe, Cpu, ArrowUpRight } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  // Ensure smooth scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Top Fixed Monochrome Header */}
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-xs font-mono tracking-wider uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Workspace</span>
          </button>

          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
              EST. 2022 · NEW YORK
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24 space-y-24">
        
        {/* Hero Section */}
        <section className="space-y-8 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded border border-white/20 bg-white/5 text-[11px] font-mono tracking-widest uppercase text-zinc-300">
            <span>Corporate Profile</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              About AVER
            </h1>
            <p className="text-xl sm:text-2xl font-light text-zinc-300 leading-relaxed max-w-3xl">
              Building Intelligent Infrastructure for Modern Trading
            </p>
          </div>

          <div className="space-y-5 text-base sm:text-lg text-zinc-400 font-normal leading-relaxed border-l-2 border-white/20 pl-6 max-w-3xl">
            <p>
              Founded in 2022, AVER is a New York-based financial technology company focused on building intelligent software and AI-assisted infrastructure for modern market participants.
            </p>
            <p>
              Our platform brings together artificial intelligence, market analysis, trading technology, portfolio monitoring, and data-driven decision-making within a unified technology ecosystem.
            </p>
            <p className="text-zinc-200">
              AVER’s objective is to make sophisticated market technology more accessible through products designed around clarity, analytical depth, automation, and user control.
            </p>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Our Technology */}
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Core Systems</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Our Technology</h2>
          </div>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-3xl">
            At the core of AVER is a technology ecosystem designed to process market information and assist users in evaluating trading opportunities.
          </p>

          {/* Proprietary Systems Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-6 rounded-xl border border-white/15 bg-white/[0.03] space-y-3">
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">AVERCore AI™</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Proprietary core intelligence engine engineered to process market dynamics, identify structural shifts, and support automated analysis.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/15 bg-white/[0.03] space-y-3">
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Confluence Engine™</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Multi-layer confluence validator designed to synthesize disparate data vectors and eliminate isolated noise.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/15 bg-white/[0.03] space-y-3">
              <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">TriLock Strategy™</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Systematic risk preservation architecture structured to anchor entries, enforce strict boundary parameters, and monitor open exposures.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-zinc-400 leading-relaxed pt-2">
            <p>
              Our technology includes proprietary systems such as <strong className="text-white font-medium">AVERCore AI™</strong>, <strong className="text-white font-medium">Confluence Engine™</strong>, and <strong className="text-white font-medium">TriLock Strategy™</strong>, developed to support different aspects of market analysis and trading workflows.
            </p>
            <p>
              AVER’s technology is designed to evaluate multiple sources of market information rather than relying on a single indicator or data point.
            </p>
            <p>
              AI-assisted analysis can help identify patterns, evaluate market conditions, monitor positions, and present information in a structured way.
            </p>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Technology Partnerships */}
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Infrastructure</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Technology Partnerships</h2>
          </div>

          <p className="text-base text-zinc-300 leading-relaxed max-w-3xl">
            AVER works with technology providers and infrastructure partners that support the development, security, reliability, and operation of its products.
          </p>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">These relationships may involve:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                'Cloud infrastructure',
                'Software development infrastructure',
                'Authentication and identity systems',
                'Data infrastructure',
                'Security technology',
                'Analytics',
                'Payment infrastructure',
                'Other technical services required to operate a modern financial technology platform',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-lg border border-white/10 bg-white/[0.02]">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Strategic Partnerships */}
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Alliances & Expansion</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Strategic Partnerships</h2>
          </div>

          <p className="text-base text-zinc-300 leading-relaxed max-w-3xl">
            AVER develops strategic relationships with organizations and technology companies whose capabilities complement its products and long-term objectives.
          </p>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Strategic relationships may support:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                'Technology development',
                'Product integrations',
                'Market-data infrastructure',
                'Business development',
                'Distribution',
                'Research and innovation',
                'Platform expansion',
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-lg border border-white/10 bg-white/[0.02]">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-white/15 bg-white/[0.03] text-xs text-zinc-400 leading-relaxed">
            Specific partnerships may be disclosed through official announcements or the relevant partner’s public channels where appropriate.
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Independent Verification */}
        <section className="space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Corporate Integrity</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Independent Verification</h2>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/[0.02] space-y-4">
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              AVER aims to maintain transparent information regarding its corporate identity, technology, and business relationships.
            </p>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Where a partnership or corporate relationship is publicly disclosed, users may verify the relationship through the relevant organization’s official website, announcement, partner directory, or other independently maintained source.
            </p>
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-mono uppercase tracking-wider text-white">
                AVER does not represent a company as a partner unless a genuine relationship exists.
              </p>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Corporate Information */}
        <section className="space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Company Registry</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Corporate Information</h2>
          </div>

          <div className="rounded-xl border border-white/15 overflow-hidden divide-y divide-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02]">
              <span className="text-xs font-mono uppercase text-zinc-400">Company</span>
              <span className="text-sm font-bold text-white font-mono">AVER</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.01]">
              <span className="text-xs font-mono uppercase text-zinc-400">Founded</span>
              <span className="text-sm font-semibold text-white font-mono">2022</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02]">
              <span className="text-xs font-mono uppercase text-zinc-400">Business Sector</span>
              <span className="text-sm font-semibold text-white">Financial Technology / Software</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.01]">
              <span className="text-xs font-mono uppercase text-zinc-400">Headquarters</span>
              <span className="text-sm font-semibold text-white">New York, United States</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02]">
              <span className="text-xs font-mono uppercase text-zinc-400">Website</span>
              <a
                href="https://avertrader.space"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-sm font-mono text-white underline underline-offset-4 hover:text-zinc-300 transition-colors"
              >
                <span>avertrader.space</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Contact AVER */}
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Direct Inquiries</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Contact AVER</h2>
          </div>

          <div className="space-y-6">
            
            {/* Customer Support Card */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/[0.03] space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Customer Support</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  For account, platform, technical, or general customer-support matters:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:support@avertrader.space"
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email: support@avertrader.space</span>
                </a>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Telegram Support</h4>
                  <p className="text-xs text-zinc-400">
                    Users can also contact AVER through our official Telegram support channel:
                  </p>
                </div>

                <a
                  href="https://t.me/AverAssistancebot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 border border-white/30 bg-black hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram: @AverAssistancebot</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 text-zinc-400" />
                </a>
              </div>
            </div>

            {/* Business & Partnerships */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/[0.03] space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Business & Partnerships</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  For partnership proposals, technology integrations, strategic relationships, and business-development inquiries:
                </p>
              </div>

              <a
                href="mailto:support@avertrader.space"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email: support@avertrader.space</span>
              </a>
            </div>

            {/* Legal & Corporate Inquiries */}
            <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/[0.03] space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Legal & Corporate Inquiries</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  For legal notices, corporate verification, and formal corporate inquiries:
                </p>
              </div>

              <a
                href="mailto:support@avertrader.space"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email: support@avertrader.space</span>
              </a>
            </div>

          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Official Communication */}
        <section className="space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Security & Authentication</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Official Communication</h2>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl border border-white/20 bg-white/[0.02] space-y-6">
            <p className="text-sm text-zinc-300 leading-relaxed">
              For security and user protection, users should verify that communications claiming to represent AVER originate from official AVER channels.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <a
                href="https://avertrader.space"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl border border-white/15 bg-black hover:border-white transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Official Website</span>
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-white truncate">avertrader.space</span>
              </a>

              <a
                href="mailto:support@avertrader.space"
                className="p-4 rounded-xl border border-white/15 bg-black hover:border-white transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Support Email</span>
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-white truncate">support@avertrader.space</span>
              </a>

              <a
                href="https://t.me/AverAssistancebot"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl border border-white/15 bg-black hover:border-white transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-zinc-400 group-hover:text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider">Official Telegram</span>
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-white truncate">@AverAssistancebot</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Our Approach */}
        <section className="space-y-8 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Methodology</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Our Approach</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.02] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">01 / Pillar</span>
              <h3 className="text-lg font-bold text-white">Intelligence</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
                We use advanced technology and data-driven systems to help users process complex market information.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.02] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">02 / Pillar</span>
              <h3 className="text-lg font-bold text-white">Control</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
                Our technology is designed to assist users while maintaining transparency and user control.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/15 bg-white/[0.02] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">03 / Pillar</span>
              <h3 className="text-lg font-bold text-white">Transparency</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
                We aim to present information about AVER, its technology, and its business relationships accurately and clearly.
              </p>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <hr className="border-white/10" />

        {/* Our Vision */}
        <section className="space-y-6 text-left">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Future Outlook</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Our Vision</h2>
          </div>

          <div className="p-8 rounded-2xl border border-white/20 bg-white/[0.02] space-y-4">
            <p className="text-base sm:text-lg text-zinc-200 leading-relaxed font-normal">
              AVER’s long-term vision is to develop a technology ecosystem where artificial intelligence, market intelligence, and modern financial infrastructure work together in a unified environment.
            </p>
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light">
              We are building toward a future in which sophisticated financial technology can be presented through intuitive products that users can understand, monitor, and control.
            </p>
          </div>
        </section>

        {/* Final Sign-off Footer */}
        <section className="pt-12 pb-16 text-center space-y-6 border-t border-white/10">
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-widest text-white uppercase font-mono">
              AVER
            </h3>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Founded 2022 · New York, United States
            </p>
          </div>

          <p className="text-xs font-mono tracking-widest uppercase text-zinc-500">
            Intelligence. Infrastructure. Control.
          </p>

          <div className="pt-6">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Workspace</span>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
