const fs = require('fs');
let code = fs.readFileSync('src/components/portfolio_v2/PortfolioChart.tsx', 'utf8');

code = code.replace(
  "className={`w-[96%] mx-auto bg-gradient-to-b from-[#08080c] to-slate-950/80 border border-white/5 rounded-2xl overflow-hidden shadow-xl ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-black w-screen h-screen' : ''}`}",
  "className={`w-[96%] mx-auto bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-black w-screen h-screen' : ''}`}"
);

fs.writeFileSync('src/components/portfolio_v2/PortfolioChart.tsx', code);
