const fs = require('fs');
let code = fs.readFileSync('src/components/portfolio_v2/PortfolioHeaderV2.tsx', 'utf8');

const regex = /<header className="fixed top-0 left-0 right-0 z-50 w-full bg-\[\#08080c\] border-b border-white\/5 h-\[80px\] px-4 flex items-center box-border gap-\[15px\]">[\s\S]*?<button[\s\S]*?onClick=\{onBack\}[\s\S]*?<\/button>\s*\{\!isSearching \? \(\s*<div className="flex-1">\s*<h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">\s*Portfolio\s*<\/h1>\s*<\/div>\s*\) : \(/;

const newHeader = `<header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#08080c] border-b border-white/5 h-[80px] px-4 flex items-center justify-between box-border">
      {!isSearching ? (
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Portfolio
          </h1>
          <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            View your assets
          </div>
        </div>
      ) : (`;

code = code.replace(regex, newHeader);
fs.writeFileSync('src/components/portfolio_v2/PortfolioHeaderV2.tsx', code);
