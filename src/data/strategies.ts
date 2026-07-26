import { 
  Zap, Layers, Cpu, BarChart2, TrendingUp, Activity, 
  Target, Shield, Globe, Rocket, Compass, Anchor
} from 'lucide-react';

export interface Strategy {
  id: string;
  name: string;
  category: string;
  badge: string;
  tagline: string;
  description: string;
  howItWorks: string;
  idealMarketConditions: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  expectedBehavior: string;
  strengths: string[];
  weaknesses: string[];
  recommendedAiConfig: {
    frequency: string;
    riskExposure: string;
    positionSizing: string;
    stopLoss: string;
    capitalAllocation: string;
  };
  apy: string;
  successRate: string;
  maxDrawdown: string;
  monthlyReturn: string;
  sharpeRatio: string;
  color: string;
  icon: any;
}

export const STRATEGY_CATEGORIES = [
  'All',
  'Trend Following',
  'Scalping',
  'Swing Trading',
  'Breakout',
  'Mean Reversion',
  'Grid',
  'Momentum',
  'Volatility'
];

export const STRATEGIES: Strategy[] = [
  {
    id: 'quantum-momentum',
    name: "Quantum Momentum AI",
    category: 'Momentum',
    badge: "HFT Quantitative",
    tagline: "Micro-Arbitrage & Trend Acceleration Engine",
    description: "Executes micro-arbitrage and high-frequency trend-following using neural sentiment analysis across Tier-1 CEX order books and DEX liquidity pools.",
    howItWorks: "The engine scans 20,000+ depth snapshot updates per second, identifying micro-trends before they manifest in price action. It uses neural sentiment analysis to gauge if a move is institutional or retail-driven.",
    idealMarketConditions: "High liquidity periods with clear directional bias or sharp volatility expansion.",
    riskLevel: 'Medium',
    expectedBehavior: "Rapid execution with high win rates but small individual gains. Expect frequent activity during London and New York sessions.",
    strengths: ["Ultra-fast execution", "Sentiment-aware entries", "Low latency advantage"],
    weaknesses: ["High trading fees", "Sensitive to network congestion", "Struggles in low-volume weekends"],
    recommendedAiConfig: {
      frequency: "High (~140 trades/day)",
      riskExposure: "Moderate (5/10)",
      positionSizing: "15% per trade allocation",
      stopLoss: "Dynamic trailing stop @ 1.5%",
      capitalAllocation: "80% active trading / 20% cash buffer"
    },
    apy: "+42.8%",
    successRate: "94.2%",
    maxDrawdown: "-3.8%",
    monthlyReturn: "+11.4%",
    sharpeRatio: "3.12",
    color: "emerald",
    icon: Zap
  },
  {
    id: 'arbitrage-alpha',
    name: "Arbitrage Alpha v4",
    category: 'Mean Reversion',
    badge: "Delta Neutral",
    tagline: "Cross-Venue Delta-Neutral Spread Harvester",
    description: "Captures instant price discrepancies between global exchanges while maintaining dynamic delta-neutral derivative hedges to neutralize market directional risk.",
    howItWorks: "Simultaneously monitors price gaps across 15+ exchanges. When a spread exceeds 0.15%, it executes buy/sell pairs while opening offsetting derivative positions to hedge against price swings.",
    idealMarketConditions: "Persistent price spreads across decentralized and centralized venues.",
    riskLevel: 'Low',
    expectedBehavior: "Steady, incremental growth with minimal drawdowns. Returns are relatively independent of market direction.",
    strengths: ["Zero directional risk", "Consistent performance", "Low maximum drawdown"],
    weaknesses: ["Lower ceiling during bull markets", "Margin efficiency requirements", "Exchange withdrawal dependencies"],
    recommendedAiConfig: {
      frequency: "Very High (~320 trades/day)",
      riskExposure: "Low (2/10)",
      positionSizing: "10% per spread execution",
      stopLoss: "Instant convergence stop",
      capitalAllocation: "90% active / 10% reserve"
    },
    apy: "+35.2%",
    successRate: "98.7%",
    maxDrawdown: "-1.1%",
    monthlyReturn: "+8.9%",
    sharpeRatio: "4.28",
    color: "cyan",
    icon: Layers
  },
  {
    id: 'grid-master-pro',
    name: "Grid Master Pro",
    category: 'Grid',
    badge: "Range Specialist",
    tagline: "High-Frequency Sideways Yield Generator",
    description: "Deploys a sophisticated grid of buy and sell orders within a defined price range to capture profits from natural market oscillations.",
    howItWorks: "Establishes a geometric or arithmetic grid. It systematically buys low and sells high as the price bounces within the range, automatically adjusting grid density based on ATR volatility.",
    idealMarketConditions: "Sideways ranging markets with consistent volatility and no clear breakout.",
    riskLevel: 'Medium',
    expectedBehavior: "Excellent performance in boring, flat markets. Potential for 'holding' if price breaks out of the bottom of the grid without stop-loss.",
    strengths: ["Passive income in flat markets", "Emotional-free execution", "Compounding gains"],
    weaknesses: ["Trending market underperformance", "Potential for unrealized losses if range breaks", "High capital commitment"],
    recommendedAiConfig: {
      frequency: "High (~80 trades/day)",
      riskExposure: "Moderate (6/10)",
      positionSizing: "Divided across 50+ grid levels",
      stopLoss: "Range exit stop-loss @ -5%",
      capitalAllocation: "100% active grid"
    },
    apy: "+28.5%",
    successRate: "92.1%",
    maxDrawdown: "-7.5%",
    monthlyReturn: "+7.2%",
    sharpeRatio: "2.15",
    color: "blue",
    icon: Activity
  },
  {
    id: 'breakout-hunter',
    name: "Breakout Hunter AI",
    category: 'Breakout',
    badge: "Momentum Burst",
    tagline: "Volatility Expansion Capture System",
    description: "Identifies key psychological and technical levels where price compression indicates an impending explosive move.",
    howItWorks: "Uses Bollinger Band squeeze detection and volume profile analysis. It enters positions when price breaches multi-day ranges with confirmed institutional volume support.",
    idealMarketConditions: "After long periods of low-volatility consolidation.",
    riskLevel: 'High',
    expectedBehavior: "Fewer trades but with significantly higher profit-per-trade. High probability of being stopped out on 'fakeouts' before the real move.",
    strengths: ["High reward-to-risk ratio", "Captures major market turns", "Efficient use of capital"],
    weaknesses: ["Lower win rate", "Frustrating in choppy markets", "Requires precise entry timing"],
    recommendedAiConfig: {
      frequency: "Low (~5 trades/week)",
      riskExposure: "High (8/10)",
      positionSizing: "20% per breakout setup",
      stopLoss: "Tight range-re-entry stop",
      capitalAllocation: "60% active / 40% waiting"
    },
    apy: "+64.2%",
    successRate: "48.5%",
    maxDrawdown: "-12.4%",
    monthlyReturn: "+18.2%",
    sharpeRatio: "1.85",
    color: "orange",
    icon: Rocket
  },
  {
    id: 'trend-navigator',
    name: "Trend Navigator v2",
    category: 'Trend Following',
    badge: "Long Term Growth",
    tagline: "Adaptive Multi-Timeframe Trend Following",
    description: "Follows strong market trends using an ensemble of moving averages, Ichimoku clouds, and parabolic SAR indicators.",
    howItWorks: "Filters market noise by requiring confirmation across 4h, 1d, and 1w timeframes. It stays in winning positions as long as the macro-trend remains intact.",
    idealMarketConditions: "Strong bull or bear markets with sustained direction.",
    riskLevel: 'Medium',
    expectedBehavior: "Slow and steady. It won't catch the exact bottom or top, but it will capture the meat of the move.",
    strengths: ["Robust performance", "Low stress execution", "Proven historical edge"],
    weaknesses: ["Gives back profit in reversals", "Loses money in flat markets", "Slow response to flash crashes"],
    recommendedAiConfig: {
      frequency: "Very Low (~2 trades/month)",
      riskExposure: "Moderate (4/10)",
      positionSizing: "25% core position",
      stopLoss: "Trailing ATR-based stop",
      capitalAllocation: "90% active / 10% reserve"
    },
    apy: "+38.4%",
    successRate: "62.0%",
    maxDrawdown: "-8.2%",
    monthlyReturn: "+9.1%",
    sharpeRatio: "2.45",
    color: "indigo",
    icon: TrendingUp
  },
  {
    id: 'scalper-supreme',
    name: "Scalper Supreme AI",
    category: 'Scalping',
    badge: "Flash Profit",
    tagline: "Sub-Minute Order Flow Scalping",
    description: "Captures tiny price movements within seconds using advanced order flow imbalances and liquidation heatmaps.",
    howItWorks: "Uses sub-second API hooks to front-run large orders or capitalize on liquidity vacuums created by liquidations.",
    idealMarketConditions: "High volatility with high trading volume.",
    riskLevel: 'Very High',
    expectedBehavior: "Thousands of trades per day. Extremely sensitive to execution speed and fee structure.",
    strengths: ["Profitable in any direction", "High compounding speed", "No overnight risk"],
    weaknesses: ["Extremely sensitive to fees", "Requires high-tier API access", "Potential for technical failure"],
    recommendedAiConfig: {
      frequency: "Ultra High (~500+ trades/day)",
      riskExposure: "Very High (9/10)",
      positionSizing: "5% per scalp",
      stopLoss: "Fixed 0.2% stop",
      capitalAllocation: "100% active"
    },
    apy: "+112.5%",
    successRate: "76.4%",
    maxDrawdown: "-15.8%",
    monthlyReturn: "+24.5%",
    sharpeRatio: "3.56",
    color: "rose",
    icon: Target
  },
  {
    id: 'swing-commander',
    name: "Swing Commander",
    category: 'Swing Trading',
    badge: "Intermediate Edge",
    tagline: "Multi-Day Reversal & Pivot Hunter",
    description: "Targets medium-term price swings over 3-10 days based on overbought/oversold technical extremes.",
    howItWorks: "Identifies exhaustion points using RSI, Stochastic divergence, and Bollinger Band deviations. Enters when mean reversion is statistically probable.",
    idealMarketConditions: "Oscillating markets with well-defined support and resistance.",
    riskLevel: 'Medium',
    expectedBehavior: "Moderate trade frequency. Excellent for capturing 10-20% moves over several days.",
    strengths: ["High win rate", "Clear target levels", "Lower fee impact"],
    weaknesses: ["Vulnerable to 'blow off' tops", "Requires patience", "Misses parabolic trends"],
    recommendedAiConfig: {
      frequency: "Moderate (~8 trades/month)",
      riskExposure: "Moderate (5/10)",
      positionSizing: "15% per swing setup",
      stopLoss: "Pivot-point based stop",
      capitalAllocation: "70% active / 30% cash"
    },
    apy: "+45.6%",
    successRate: "68.2%",
    maxDrawdown: "-6.4%",
    monthlyReturn: "+12.1%",
    sharpeRatio: "2.28",
    color: "violet",
    icon: Compass
  },
  {
    id: 'volatility-vortex',
    name: "Volatility Vortex",
    category: 'Volatility',
    badge: "Chaos Specialist",
    tagline: "Delta-Neutral Volatility Expansion Capture",
    description: "Profits from increases in market volatility regardless of price direction using advanced options straddles.",
    howItWorks: "Calculates implied vs realized volatility. It buys volatility when it's underpriced and sells when it's overpriced relative to historic norms.",
    idealMarketConditions: "Pre-event uncertainty (earnings, news) or sudden market panics.",
    riskLevel: 'High',
    expectedBehavior: "Quiet performance during stable periods followed by massive gains during market crashes or spikes.",
    strengths: ["Uncorrelated to market direction", "Protects portfolio from crashes", "High alpha generation"],
    weaknesses: ["Time decay (Theta) costs", "Complexity of execution", "Sensitive to volatility crush"],
    recommendedAiConfig: {
      frequency: "Low (~4 strategic setups/month)",
      riskExposure: "High (7/10)",
      positionSizing: "10% per vol-event",
      stopLoss: "Vega-based exit strategy",
      capitalAllocation: "50% active / 50% reserve"
    },
    apy: "+55.0%",
    successRate: "55.2%",
    maxDrawdown: "-9.1%",
    monthlyReturn: "+15.4%",
    sharpeRatio: "2.12",
    color: "amber",
    icon: BarChart2
  }
];
