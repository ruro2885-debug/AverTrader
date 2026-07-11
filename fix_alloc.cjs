const fs = require('fs');
let code = fs.readFileSync('src/components/portfolio_v2/PortfolioAllocation.tsx', 'utf8');

code = code.replace(
  'className="w-[96%] mx-auto bg-gradient-to-br from-[#0c0d16] to-[#08080c] border border-white/5 rounded-2xl p-6 sm:p-7 shadow-xl"',
  'className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"'
);

fs.writeFileSync('src/components/portfolio_v2/PortfolioAllocation.tsx', code);
