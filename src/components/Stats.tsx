import React from 'react';

export default function Stats({ theme }: { theme: 'light' | 'dark' }) {
  const stats = [
    { label: 'Cumulative Volume', value: '$48.2 Billion+' },
    { label: 'Active Neural Models', value: '1,420 Models' },
    { label: 'Average Execution Ping', value: '0.78 ms' },
    { label: 'Uptime & Availability', value: '99.99%' },
  ];

  return (
    <section className="py-16 md:py-20 px-4 sm:px-8 border-t border-white/10 bg-slate-950/60">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map((s, idx) => (
          <div key={idx} className="space-y-2 p-6 rounded-2xl bg-slate-900/50 border border-white/10">
            <p className="text-3xl sm:text-4xl font-black text-white">{s.value}</p>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
