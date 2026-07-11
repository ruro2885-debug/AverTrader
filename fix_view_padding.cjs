const fs = require('fs');
let code = fs.readFileSync('src/components/portfolio_v2/PortfolioViewV2.tsx', 'utf8');

code = code.replace(/<div className="w-full mt-8">/g, '<div className="w-[96%] mx-auto mt-8">');
code = code.replace(/<div className="w-full mt-7">/g, '<div className="w-[96%] mx-auto mt-7">');
code = code.replace(/<div className="w-full mt-6">/g, '<div className="w-[96%] mx-auto mt-6">');

fs.writeFileSync('src/components/portfolio_v2/PortfolioViewV2.tsx', code);
