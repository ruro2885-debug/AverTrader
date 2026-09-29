import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-extrabold text-emerald-400">About AverTrader</h1>
        <p className="text-slate-400 text-sm mt-1">Autonomous Execution &amp; Real-Time Telemetry Platform</p>
      </header>
      <section className="space-y-4 text-slate-300 text-sm leading-relaxed">
        <p>
          AverTrader is an independent high-performance digital asset trading workspace and AI execution platform engineered for intelligent market telemetry, automated session management, and institutional portfolio tracking.
        </p>
        <p>
          Domain: <code className="text-emerald-400 font-mono">avertrader.space</code> (AverTrader / avertraderspace).
        </p>
      </section>
    </main>
  );
}
