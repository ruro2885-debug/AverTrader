import fs from 'fs';
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const replacement = "portfolio: { totalValue: 50000, todayPnL: 100, todayPnLPercent: 0.2, overallReturn: 5000, realizedPnL: 0, unrealizedPnL: 5000, healthScore: 90, diversificationScore: 80, volatility: 0.5, sharpeRatio: 1.5, winRate: 60, maxDrawdown: 10, recoveryFactor: 2, riskAdjustedReturn: 1.2 },";

code = code.replace(/portfolio: \{ totalValue: 50000, todayPnL: 100, todayPnLPercent: 0.2, overallReturn: 5000, realizedPnL: 0 \},/g, replacement);
      
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
