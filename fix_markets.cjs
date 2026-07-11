const fs = require('fs');
let code = fs.readFileSync('src/components/MarketsPage.tsx', 'utf8');

// Change from sticky to fixed
code = code.replace(
  /className=\{\`sticky top-0 z-40 backdrop-blur-xl \$\{isDark \? 'bg-\[\#050505\]\/90' : 'bg-white\/90'\} border-b \$\{isDark \? 'border-white\/5' : 'border-slate-200'\} p-4 flex justify-between items-center\`\}/,
  `className={\`fixed top-0 left-0 right-0 w-full z-40 backdrop-blur-xl \${isDark ? 'bg-[#050505]/90' : 'bg-white/90'} border-b \${isDark ? 'border-white/5' : 'border-slate-200'} p-4 flex justify-between items-center box-border\`}`
);

// We need to add padding-top to the main container
code = code.replace(
  /<div className=\{\`min-h-screen pb-32 \$\{isDark \? 'bg-\[\#050505\]' : 'bg-slate-50'\}\`\}>/,
  `<div className={\`min-h-screen pt-[73px] pb-32 \${isDark ? 'bg-[#050505]' : 'bg-slate-50'}\`}>`
);

// We should also adjust top values for the other sticky elements
// SEARCH BAR: <div className="px-4 py-4 sticky top-[73px] z-30 bg-inherit"> -> make it fixed top-[73px] or just sticky top-[73px]
// If it's sticky, we need to consider if it still works. If the header is fixed, sticky will still work inside the container? Wait, if the header is fixed, the search bar is pushed down by pt-[73px]. So sticky top-[73px] is fine.

fs.writeFileSync('src/components/MarketsPage.tsx', code);
