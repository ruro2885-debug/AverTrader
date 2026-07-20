import { TradingSchedule, RiskControls, RecommendationRules } from '../types/aiTrading';
import { safeStorage } from './storage';
import { getAvatarDataUrl } from './avatarGenerator';

export interface SimulatedTrade {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  pnlPercent?: number; // percentage pnl, e.g. 2.45 for +2.45%
  status: 'OPEN' | 'CLOSED';
  timestamp: string; // ISO string
}

export interface SimulatedTrader {
  id: string;
  username: string;
  fullName: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  verified: boolean;
  return30D: number;
  winRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  style: 'SCALPING' | 'DAY_TRADING' | 'SWING_TRADING';
  preferredMarkets: string[];
  followers: number;
  status: 'Trading' | 'Analyzing' | 'Online' | 'Offline';
  bio: string;
  avatarSeed: string;
  avatarUrl?: string;
  strategyName: string;
  pnlHistory30D: number[]; // 10 points for sparkline
  avgTradeDuration: string;
  wins: number;
  losses: number;
  schedule: TradingSchedule;
  riskControls: RiskControls;
  recommendationRules: RecommendationRules;
  advancedBehavior: {
    enableDeepAnalysis: boolean;
    useSentimentGrounding: boolean;
    neuralConfidenceThreshold: number;
  };
  strategyExplanation: string;
  recentTrades: SimulatedTrade[];
  
  // Historical offsets to simulate deep history without keeping millions of trades in memory
  historicalTradesBase?: number;
  historicalWinsBase?: number;
  historicalLossesBase?: number;
  historicalPnlBase?: number;
  historicalYearsTrading?: number;
  activeCopiers?: number;
  currentWinningStreak?: number;
  
  // Extended live-calculation fields
  trades: SimulatedTrade[];
  performanceScore: number;
  rank: number;
  prevRank: number;
  return7D: number;
  return90D: number;
  return1Y: number;
  returnAllTime: number;
  currentDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  profitFactor: number;
  riskManagementScore: number;
  consistencyScore: number;
  positionAccuracy: number;
  tradeFrequency: number; // trades per week
  aiEfficiency: number;
  volatilityHandling: number;
  recentActivityScore: number;
}

export interface SimulationEvent {
  id: string;
  text: string;
  timestamp: string;
  traderId: string;
  type: 'rank_up' | 'rank_down' | 'milestone' | 'win_streak' | 'drawdown' | 'entry';
}

// Assets list for simulation
const ASSETS_BY_MARKET: Record<string, number> = {
  'BTC': 64000,
  'ETH': 3400,
  'SOL': 140,
  'AVR': 1.25,
  'FET': 2.10,
  'XRP': 0.60,
  'ADA': 0.45,
  'LINK': 15,
  'DOT': 6.2,
  'NEAR': 5.5,
  'RNDR': 7.8,
  'INJ': 24
};

// Seed-based random number generator for initial historical trade seed
function seededRandom(seedStr: string) {
  let h = 15485863;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// 20 unique traders definition
export function generateProceduralTradersSpecs(): Partial<SimulatedTrader>[] {
  const MALE_NAMES = [
    'Mason', 'Ethan', 'Liam', 'Noah', 'Jack', 'Lucas', 'Oliver', 'Benjamin', 'Ryan', 'Daniel', 
    'Nathan', 'Owen', 'Caleb', 'Dylan', 'Alex'
  ];
  const FEMALE_NAMES = [
    'Emma', 'Olivia', 'Sophia', 'Ava', 'Chloe', 'Grace', 'Lily', 'Mia', 'Isabella', 'Zoe', 
    'Charlotte', 'Amelia', 'Hannah', 'Emily', 'Natalie'
  ];
  const SURNAMES = [
    'Walker', 'Brooks', 'Carter', 'Bennett', 'Sullivan', 'Hayes', 'Grant', 'Cole', 'Foster', 
    'Murphy', 'Reed', 'Parker', 'Turner', 'Cooper', 'Morgan', 'Mitchell', 'Harper', 'Scott', 
    'Ross', 'Jones', 'Smith', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Clark', 'Miles', 'Hill', 'Lee'
  ];

  const TRADING_WORDS = [
    'FXNomad', 'MacroEdge', 'SwingTheory', 'DeltaFlow', 'AlphaTape', 'PipsDaily', 'ChartPilot'
  ];

  const specs: Partial<SimulatedTrader>[] = [];
  const usedUsernames = new Set<string>();

  // Determine seed-based choices for repeatability
  const rand = seededRandom("copytrade_procedural_seed_41");

  for (let i = 0; i < 40; i++) {
    const isMale = rand() > 0.5;
    const firstName = isMale 
      ? MALE_NAMES[Math.floor(rand() * MALE_NAMES.length)] 
      : FEMALE_NAMES[Math.floor(rand() * FEMALE_NAMES.length)];
    const lastName = SURNAMES[Math.floor(rand() * SURNAMES.length)];
    const fullName = `${firstName} ${lastName}`;

    let baseUsername = '';
    const nameFormat = rand();
    if (nameFormat < 0.1) {
      baseUsername = TRADING_WORDS[Math.floor(rand() * TRADING_WORDS.length)];
    } else if (nameFormat < 0.3) {
      baseUsername = `${firstName}${lastName.charAt(0)}`.toLowerCase();
    } else if (nameFormat < 0.5) {
      baseUsername = `${firstName.toLowerCase()}_${Math.floor(rand() * 99)}`;
    } else if (nameFormat < 0.7) {
      baseUsername = `${firstName.charAt(0)}${lastName}`;
    } else if (nameFormat < 0.9) {
      baseUsername = `${firstName}${lastName}`;
    } else {
      const nicknames = ['chill', 'dexter', 'queen', 'king', 'ray', 'big', 'amy', 'fx', 'guru', 'tommy'];
      baseUsername = `${nicknames[Math.floor(rand() * nicknames.length)]}${Math.floor(rand() * 999)}`;
    }

    // Uniqueness healing
    let username = baseUsername;
    let counter = 1;
    while (usedUsernames.has(username.toLowerCase())) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    usedUsernames.add(username.toLowerCase());

    // Style and Risk distribution
    const styles: ('SCALPING' | 'DAY_TRADING' | 'SWING_TRADING')[] = ['SCALPING', 'DAY_TRADING', 'SWING_TRADING'];
    const style = styles[i % styles.length];

    const risks: ('LOW' | 'MEDIUM' | 'HIGH')[] = ['LOW', 'MEDIUM', 'HIGH'];
    // Weighted risk distribution (25% LOW, 50% MEDIUM, 25% HIGH)
    const risk = i % 4 === 0 ? 'LOW' : i % 4 === 3 ? 'HIGH' : 'MEDIUM';

    // Tier distribution
    // Let's have top 15% Platinum, next 35% Gold, remaining 50% Silver
    const tier = i < 6 ? 'Platinum' : i < 20 ? 'Gold' : 'Silver';

    // Verified boolean (rare, ~15%)
    const verified = (i % 7 === 0);

    // Preferred Markets selection
    const allMarkets = ['BTC', 'ETH', 'SOL', 'AVR', 'FET', 'XRP', 'ADA', 'LINK', 'DOT', 'NEAR', 'RNDR', 'INJ'];
    let preferredMarkets: string[] = [];
    if (style === 'SCALPING') {
      preferredMarkets = ['BTC', 'ETH', 'SOL', 'FET'].slice(0, 2 + (i % 3));
    } else if (style === 'SWING_TRADING') {
      preferredMarkets = ['BTC', 'SOL', 'AVR', 'NEAR', 'LINK', 'INJ'].slice(0, 2 + (i % 3));
    } else { // DAY_TRADING
      preferredMarkets = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'RNDR'].slice(0, 2 + (i % 3));
    }

    // Bios templates based on style and risk
    const biosMap: Record<string, string[]> = {
      'SCALPING_LOW': [
        'Low exposure algorithmic scalper focusing on micro order book imbalances in BTC and ETH with tight 0.5% stop-losses.',
        'Conservative scalp grid model extracting low-volatility spreads during Asian sessions.',
        'Mathematical trend reversion scalper focusing on bluechip volumes. High position accuracy with zero leverage.'
      ],
      'SCALPING_MEDIUM': [
        'High frequency scalp grid farming volatile sideways regimes. Rebalances orders dynamically on every block.',
        'Order flow delta imbalance scalper tracking Decentralized exchange volume waves.',
        'Intraday regression corridor scalper capturing short-lived altcoin breakouts.'
      ],
      'SCALPING_HIGH': [
        'Ultra-aggressive momentum scalp engine trading liquidation traps and derivative leverage sweeps.',
        'High-frequency sub-minute momentum scalp setups with high leverage protection limits.',
        'Hyper-volatile momentum scalp setups chasing high-beta trending assets. High risk, high beta.'
      ],
      'DAY_TRADING_LOW': [
        'Intraday day trader capturing classic double bottoms and EMA crossover retests with strict drawdown limits.',
        'Bluechip Day Trader utilizing slow MACD and Fib levels for highly guarded daily reversals.',
        'Institutional-grade intraday pattern follower executing double confirmations on large-cap volume bursts.'
      ],
      'DAY_TRADING_MEDIUM': [
        'Systematic intraday trend hunter targeting H1 breakout points with automated volume confirmation.',
        'Quantitative day trading corridor capturing standard deviation VWAP spikes.',
        'Adaptive day trader scaling in on major hourly support zones and taking rapid profits on momentum turns.'
      ],
      'DAY_TRADING_HIGH': [
        'High volatility intraday breakout system riding massive derivative volumes and momentum sweeps.',
        'Aggressive news-flow day trader capitalizing on rapid sentiment shifts and macro announcements.',
        'Intraday breakout accelerator buying standard deviation expansions with heavy momentum focus.'
      ],
      'SWING_TRADING_LOW': [
        'Institutional macro swing index tracker utilizing daily exponential ribbons and long-range support blocks.',
        'Conservative swing trader with a multi-week position holding style. Low exposure capital preservation focus.',
        'A long-term trend follow strategy aiming for steady compound growth via bluechip spot accumulation.'
      ],
      'SWING_TRADING_MEDIUM': [
        'Multi-indicator swing trader riding mid-term altcoin narrative waves. Rebalances every 48 hours.',
        'Classical Fibonacci swing model targeting structural order block retests and golden pocket entries.',
        'Swing trend breakout system trading dynamic liquidity pools and daily volume shifts.'
      ],
      'SWING_TRADING_HIGH': [
        'Aggressive swing breakout model buying momentum surges and high-beta narrative runners. Maximizes return curves.',
        'High risk swing system targeting dynamic liquidity sweep areas and volatility contraction breakouts.',
        'Extreme trend swing system following high-volatility momentum tokens. Volatility is our leverage.'
      ]
    };

    const bioKey = `${style}_${risk}`;
    const bioTemplates = biosMap[bioKey] || biosMap['DAY_TRADING_MEDIUM'];
    const bio = bioTemplates[i % bioTemplates.length];

    // Strategy Name Generation
    const STRATEGY_PREFIXES = ['Quantum', 'Alpha', 'Neural', 'Vortex', 'Chronos', 'Vector', 'Matrix', 'Apex', 'Titan', 'Stellar', 'Eclipse', 'Oracle', 'Shadow', 'Prism', 'Aether', 'Omni', 'Sovereign', 'Synergy', 'Genesis', 'Spectre'];
    const STRATEGY_NOUNS_SCALPING = ['Scalp', 'Grid', 'Delta', 'Flow', 'Squeeze', 'Velocity'];
    const STRATEGY_NOUNS_DAY_TRADING = ['Momentum', 'Reversal', 'Corridor', 'Matrix', 'Fusion', 'Catalyst'];
    const STRATEGY_NOUNS_SWING_TRADING = ['Swing', 'Trend', 'Breakout', 'Infinity', 'Optima', 'Block'];
    const STRATEGY_SUFFIXES = ['v4', 'Pro', 'AI', 'V2', 'Edge', 'v1', 'System', 'Engine', 'Alpha', 'Gold', 'Elite', 'Plus', 'Core'];

    const prefix = STRATEGY_PREFIXES[(i * 3) % STRATEGY_PREFIXES.length];
    const nounList = style === 'SCALPING' ? STRATEGY_NOUNS_SCALPING : style === 'SWING_TRADING' ? STRATEGY_NOUNS_SWING_TRADING : STRATEGY_NOUNS_DAY_TRADING;
    const noun = nounList[(i * 7) % nounList.length];
    const suffix = STRATEGY_SUFFIXES[(i * 11) % STRATEGY_SUFFIXES.length];
    const strategyName = `${prefix} ${noun} ${suffix}`;

    // Average trade duration
    const avgDuration = style === 'SCALPING' ? `${4 + (i % 15)} minutes` : style === 'DAY_TRADING' ? `${1 + (i % 4)} hours` : `${2 + (i % 8)} days`;

    // Strict realistic stats generation based on ranking (i is index, 0 is #1)
    let followers, historicalTradesBase, historicalWinsBase, historicalLossesBase;
    let historicalPnlBase, historicalYearsTrading, activeCopiers, currentWinningStreak;
    
    if (i < 10) {
      // Top 10 Elite Traders
      const topScale = 1 - (i / 10); // 1.0 for i=0 down to 0.1 for i=9
      
      followers = 15000 + Math.floor(rand() * 50000) + Math.floor(topScale * 585000); // 15,000 - 650,000+
      activeCopiers = 2000 + Math.floor(rand() * 10000) + Math.floor(topScale * 108000); // 2,000 - 120,000+
      historicalYearsTrading = 3 + Math.floor(rand() * 4) + Math.floor(topScale * 8); // 3 - 15 years
      historicalTradesBase = 900 + Math.floor(rand() * 2000) + Math.floor(topScale * 15100); // 900 - 18,000+
      
      const winRate = 0.68 + (rand() * 0.10) + (topScale * 0.18); // 68% - 96%
      historicalWinsBase = Math.floor(historicalTradesBase * winRate);
      historicalLossesBase = historicalTradesBase - historicalWinsBase;
      
      historicalPnlBase = 120 + Math.floor(rand() * 200) + Math.floor(topScale * 530); // 120% - 850%
      currentWinningStreak = 5 + Math.floor(rand() * 10) + Math.floor(topScale * 25); // 5 - 40 trades
    } else {
      // Other traders (still good but lower than top 10)
      const baseFollowers = tier === 'Platinum' ? 10000 : tier === 'Gold' ? 4000 : 800;
      followers = baseFollowers + (i * 123) % 8000;
      activeCopiers = Math.floor(followers * (0.1 + rand() * 0.2));
      historicalYearsTrading = 1 + Math.floor(rand() * 4);
      historicalTradesBase = 150 + Math.floor(rand() * 600);
      
      const winRate = 0.55 + (rand() * 0.25);
      historicalWinsBase = Math.floor(historicalTradesBase * winRate);
      historicalLossesBase = historicalTradesBase - historicalWinsBase;
      
      historicalPnlBase = 20 + Math.floor(rand() * 100);
      currentWinningStreak = Math.floor(rand() * 6);
    }

    // Assets under copy (AUM) - Scale significantly for Top Traders
    const baseAUM = tier === 'Platinum' ? 12000000 : tier === 'Gold' ? 2500000 : 150000;
    const aum = baseAUM + (i * 54321) % 5000000;

    // Status: Online / Offline / Trading
    const statuses: ('Trading' | 'Analyzing' | 'Online' | 'Offline')[] = ['Trading', 'Analyzing', 'Online', 'Offline'];
    const status = statuses[i % statuses.length];

    // Advanced behavior
    const enableDeepAnalysis = i % 2 === 0 || tier === 'Platinum';
    const useSentimentGrounding = i % 3 !== 0 || tier === 'Platinum';
    const neuralConfidenceThreshold = 70 + (i % 25);

    // Explanations
    const explanationTemplates = {
      'SCALPING': `Executes sub-minute micro trades targeting dynamic order book inefficiencies and bid-ask spread expansion. Utilizes a multi-threaded execution queue to minimize slippage on altcoin pairs.`,
      'DAY_TRADING': `Scans intra-day market blocks and H1 trend pivots. Enters trades on clear momentum breakout spikes or standard deviation regression channel bounces, taking swift profits inside 24 hours.`,
      'SWING_TRADING': `Monitors multi-day macro structures and weekly support blocks. Accumulates spots and low-leverage futures positions in strong trend corridors, letting profits run over major structural expansions.`
    };

    // Real Photos (assign to some specific indices so it persists and they move around on the leaderboard naturally)
    const MALE_PHOTOS = [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
    ];
    const FEMALE_PHOTOS = [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80'
    ];
    let avatarUrl: string | undefined = undefined;
    // Map avatar URL indices based on the isMale flag determined earlier for consistency
    if (i === 3 && isMale) avatarUrl = MALE_PHOTOS[0];
    else if (i === 3) avatarUrl = FEMALE_PHOTOS[0]; // fallback if not male
    
    if (i === 12 && !isMale) avatarUrl = FEMALE_PHOTOS[0];
    else if (i === 12) avatarUrl = MALE_PHOTOS[0];
    
    if (i === 22 && isMale) avatarUrl = MALE_PHOTOS[1];
    else if (i === 22) avatarUrl = FEMALE_PHOTOS[1];

    if (i === 31 && !isMale) avatarUrl = FEMALE_PHOTOS[1];
    else if (i === 31) avatarUrl = MALE_PHOTOS[1];

    specs.push({
      id: `trader_proc_${i}`,
      username,
      fullName,
      tier,
      verified,
      riskLevel: risk,
      style,
      preferredMarkets,
      status,
      bio,
      avatarSeed: `avatar_seed_${username}`,
      avatarUrl: avatarUrl || getAvatarDataUrl(`avatar_seed_${username}`),
      strategyName,
      avgTradeDuration: avgDuration,
      followers,
      activeCopiers,
      historicalTradesBase,
      historicalWinsBase,
      historicalLossesBase,
      historicalPnlBase,
      historicalYearsTrading,
      currentWinningStreak,
      schedule: {
        sessions: [{ start: '00:00', end: '24:00' }],
        weekdays: true,
        weekends: style === 'SCALPING',
        timezone: `UTC${i % 2 === 0 ? '' : i % 3 === 0 ? '+8' : '-5'}`,
        breakPeriods: [],
        excludeHolidays: false
      },
      riskControls: {
        maxPositionSize: risk === 'LOW' ? 5 : risk === 'MEDIUM' ? 12 : 22,
        maxSimultaneousPositions: style === 'SCALPING' ? 8 : 4,
        exposureLimit: risk === 'LOW' ? 20 : risk === 'MEDIUM' ? 50 : 80,
        positionSizingPreference: 'PERCENTAGE',
        lossLimit: risk === 'LOW' ? 1.2 : risk === 'MEDIUM' ? 2.5 : 4.5
      },
      recommendationRules: {
        minConfidence: risk === 'LOW' ? 88 : risk === 'MEDIUM' ? 78 : 68,
        allowedAssetClasses: ['CRYPTO'],
        indicators: style === 'SCALPING' ? ['RSI', 'VWAP', 'ORDER_FLOW_IMBALANCE'] : ['MACD', 'EMA_CROSS', 'VOLUME_PROFILE']
      },
      advancedBehavior: {
        enableDeepAnalysis,
        useSentimentGrounding,
        neuralConfidenceThreshold
      },
      strategyExplanation: explanationTemplates[style],
      wins: 0,
      losses: 0,
      recentTrades: [],
      trades: []
    });
  }

  return specs;
}

export const BASE_TRADERS_SPECS: Partial<SimulatedTrader>[] = generateProceduralTradersSpecs();

/**
 * Generates 150 unique, highly realistic historical trades for a trader based on their style, risk level, and intrinsic bias.
 * Ensures the equity curve contains pullbacks, recovery periods, sideways trends, and volatility.
 */
export function generateHistoricalTradesForTrader(traderSpec: Partial<SimulatedTrader>): SimulatedTrade[] {
  const rand = seededRandom(traderSpec.id || 'seed');
  const style = traderSpec.style || 'DAY_TRADING';
  const risk = traderSpec.riskLevel || 'MEDIUM';
  
  // Set parameters based on style
  let basePnlRange = 2.0; // average trade scale
  let winChance = 0.74; // base win rate
  let frequencyMultiplier = 1; // days spacing
  
  if (style === 'SCALPING') {
    basePnlRange = 1.2;
    winChance = 0.80; // Scalpers typically have higher win rate, smaller wins
    frequencyMultiplier = 0.5;
  } else if (style === 'SWING_TRADING') {
    basePnlRange = 8.0;
    winChance = 0.60; // Swing traders have lower win rate, larger wins
    frequencyMultiplier = 3;
  } else { // DAY_TRADING
    basePnlRange = 3.5;
    winChance = 0.70;
    frequencyMultiplier = 1;
  }

  if (traderSpec.tier === 'Platinum') {
    winChance = 0.88 + (rand() * 0.09); // Platinum are elite: 88-97% base
    basePnlRange *= 1.4;
  } else if (traderSpec.tier === 'Gold') {
    winChance = 0.78 + (rand() * 0.10); // Gold: 78-88%
    basePnlRange *= 1.1;
  }

  if (risk === 'HIGH') {
    basePnlRange *= 1.8;
    winChance -= 0.04; 
  } else if (risk === 'LOW') {
    basePnlRange *= 0.6;
    winChance += 0.04; 
  }

  const tradesCount = traderSpec.tier === 'Platinum' ? 250 + Math.floor(rand() * 150) : 
                     traderSpec.tier === 'Gold' ? 150 + Math.floor(rand() * 100) : 
                     80 + Math.floor(rand() * 70);
  const trades: SimulatedTrade[] = [];
  const baseDate = new Date();
  
  // Backwards in time
  let currentDate = new Date(baseDate.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago

  for (let i = 0; i < tradesCount; i++) {
    // Add realistic spacing with some randomness
    const hoursSpacing = (rand() * 12 + 4) * frequencyMultiplier;
    currentDate = new Date(currentDate.getTime() + hoursSpacing * 60 * 60 * 1000);
    
    if (currentDate > baseDate) {
      break;
    }

    // Select random asset from preferred markets
    const markets = traderSpec.preferredMarkets || ['BTC', 'ETH'];
    const asset = markets[Math.floor(rand() * markets.length)];
    const basePrice = ASSETS_BY_MARKET[asset] || 100;
    
    // Simulate trade type
    const type = rand() < 0.55 ? 'BUY' : 'SELL';
    
    // Simulate PnL percentage
    // To include pullbacks, recovery, sideways, and volatile periods:
    // Let's introduce cyclic market seasons!
    const dayOfYear = Math.floor((currentDate.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000) + 365);
    
    // Season effects:
    // 1. Bear season (drawdowns): days 50 to 90, days 220 to 250
    // 2. Bull season (strong trends): days 100 to 180, days 280 to 330
    // 3. Sideways season (flat/choppy): other days
    let seasonalBias = 0;
    if ((dayOfYear >= 50 && dayOfYear <= 90) || (dayOfYear >= 220 && dayOfYear <= 250)) {
      seasonalBias = -0.08; // more losing trades, pullbacks
    } else if ((dayOfYear >= 100 && dayOfYear <= 180) || (dayOfYear >= 280 && dayOfYear <= 330)) {
      seasonalBias = 0.08; // strong trends, higher win rates
    }

    const isWin = rand() < (winChance + seasonalBias);
    let pnlPercent = 0;
    
    if (isWin) {
      // Winning trade: positive return
      pnlPercent = parseFloat((rand() * basePnlRange + 0.1).toFixed(2));
    } else {
      // Losing trade: negative return
      pnlPercent = parseFloat((-(rand() * basePnlRange * 0.95 + 0.1)).toFixed(2));
    }

    // Dynamic entry/exit prices
    const entryPrice = parseFloat((basePrice * (1 + (rand() - 0.5) * 0.15)).toFixed(2));
    const exitPrice = parseFloat((entryPrice * (1 + pnlPercent / 100)).toFixed(2));

    trades.push({
      id: `t_${traderSpec.id}_${i}`,
      asset,
      type,
      entryPrice,
      exitPrice,
      pnlPercent,
      status: 'CLOSED',
      timestamp: currentDate.toISOString()
    });
  }

  // Ensure the final trade list is sorted chronologically
  trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Add 1-2 OPEN trades at the very end
  const openMarkets = traderSpec.preferredMarkets || ['BTC', 'ETH'];
  const openAsset = openMarkets[0];
  const openBasePrice = ASSETS_BY_MARKET[openAsset] || 100;
  const openEntryPrice = parseFloat((openBasePrice * (1 + (rand() - 0.5) * 0.02)).toFixed(2));
  
  trades.push({
    id: `t_${traderSpec.id}_open`,
    asset: openAsset,
    type: rand() < 0.5 ? 'BUY' : 'SELL',
    entryPrice: openEntryPrice,
    status: 'OPEN',
    timestamp: new Date().toISOString()
  });

  return trades;
}

/**
 * Calculates a complete suite of performance metrics for a trader from their list of trades.
 * Returns the updated trader object with synchronized, derived fields.
 */
export function calculateTraderMetrics(trader: SimulatedTrader): SimulatedTrader {
  const closedTrades = trader.trades.filter(t => t.status === 'CLOSED');
  const totalTrades = closedTrades.length;
  
  if (totalTrades === 0) {
    trader.returnAllTime = 0;
    trader.return1Y = 0;
    trader.return90D = 0;
    trader.return30D = 0;
    trader.return7D = 0;
    trader.winRate = 0;
    trader.wins = 0;
    trader.losses = 0;
    trader.currentDrawdown = 0;
    trader.consecutiveWins = 0;
    trader.consecutiveLosses = 0;
    trader.profitFactor = 1.0;
    trader.riskManagementScore = 80;
    trader.consistencyScore = 80;
    trader.positionAccuracy = 80;
    trader.tradeFrequency = 10;
    trader.aiEfficiency = 90;
    trader.volatilityHandling = 80;
    return trader;
  }

  // Chronological sorting
  closedTrades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Derive timelines based on virtual "current date" which is today
  const nowMs = new Date().getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const trades7D = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= 7 * dayMs);
  const trades30D = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= 30 * dayMs);
  const trades90D = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= 90 * dayMs);
  const trades1Y = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= 365 * dayMs);

  // 1. Returns calculation (cumulative compounding returns or sum of PnL)
  // Let's use simple cumulative sum for returns, starting from 0, to make them easy to follow.
  const basePnl = trader.historicalPnlBase || 0;
  trader.returnAllTime = parseFloat((basePnl + closedTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0)).toFixed(2));
  trader.return1Y = parseFloat(trades1Y.reduce((sum, t) => sum + (t.pnlPercent || 0), 0).toFixed(2));
  trader.return90D = parseFloat(trades90D.reduce((sum, t) => sum + (t.pnlPercent || 0), 0).toFixed(2));
  trader.return30D = parseFloat(trades30D.reduce((sum, t) => sum + (t.pnlPercent || 0), 0).toFixed(2));
  trader.return7D = parseFloat(trades7D.reduce((sum, t) => sum + (t.pnlPercent || 0), 0).toFixed(2));

  // No artificial floors - let performance be authentic
  
  // 2. Win rate, wins, losses
  const winningTrades = closedTrades.filter(t => (t.pnlPercent || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.pnlPercent || 0) <= 0);
  
  trader.wins = winningTrades.length + (trader.historicalWinsBase || 0);
  trader.losses = losingTrades.length + (trader.historicalLossesBase || 0);
  const effectiveTotalTrades = trader.wins + trader.losses;
  trader.winRate = effectiveTotalTrades > 0 ? parseFloat(((trader.wins / effectiveTotalTrades) * 100).toFixed(1)) : 0;

  // 3. Consecutive wins/losses
  let maxConsecWins = trader.currentWinningStreak || 0;
  let maxConsecLosses = 0;
  let currentConsecWins = trader.currentWinningStreak || 0;
  let currentConsecLosses = 0;

  closedTrades.forEach(t => {
    const isWin = (t.pnlPercent || 0) > 0;
    if (isWin) {
      currentConsecWins++;
      currentConsecLosses = 0;
      if (currentConsecWins > maxConsecWins) maxConsecWins = currentConsecWins;
    } else {
      currentConsecLosses++;
      currentConsecWins = 0;
      if (currentConsecLosses > maxConsecLosses) maxConsecLosses = currentConsecLosses;
    }
  });

  trader.consecutiveWins = maxConsecWins;
  trader.consecutiveLosses = maxConsecLosses;

  // 4. Current Drawdown
  // Calculate dynamic equity curve peak to trough drawdown
  let currentEquity = 100;
  let peak = 100;
  let maxDrawdown = 0;

  closedTrades.forEach(t => {
    currentEquity *= (1 + (t.pnlPercent || 0) / 100);
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const dd = ((peak - currentEquity) / peak) * 100;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  });

  // Scale drawdown by style and risk
  trader.currentDrawdown = parseFloat(Math.max(1.2, Math.min(35, maxDrawdown)).toFixed(2));

  // 5. Profit Factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0));
  trader.profitFactor = grossLoss === 0 ? parseFloat((grossProfit / 0.1).toFixed(2)) : parseFloat((grossProfit / grossLoss).toFixed(2));
  if (trader.profitFactor < 0.1) trader.profitFactor = 0.1;
  if (trader.profitFactor > 15) trader.profitFactor = 15;

  // 6. Risk Management Score (1 to 100)
  // Higher is better. Penalized by drawdown, losses, high risk setting
  let rms = 100 - trader.currentDrawdown * 1.5;
  if (trader.riskLevel === 'HIGH') rms -= 15;
  if (trader.riskLevel === 'LOW') rms += 10;
  rms -= (trader.riskControls.lossLimit || 2) * 2;
  trader.riskManagementScore = Math.floor(Math.max(45, Math.min(99, rms)));

  // 7. Consistency Score (1 to 100)
  // standard deviation of trade outcomes. Lower variance means more consistent
  const averagePnL = closedTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / totalTrades;
  const variance = closedTrades.reduce((sum, t) => sum + Math.pow((t.pnlPercent || 0) - averagePnL, 2), 0) / totalTrades;
  const stdDev = Math.sqrt(variance);
  let consistency = 100 - stdDev * 5;
  if (trader.style === 'SCALPING') consistency += 10; // Scalpers are intrinsically more consistent
  trader.consistencyScore = Math.floor(Math.max(50, Math.min(98, consistency)));

  // 8. Position Accuracy & Trade Frequency
  trader.positionAccuracy = Math.floor(trader.winRate);
  trader.tradeFrequency = Math.round(totalTrades / 52); // Average trades per week over 1 year
  if (trader.tradeFrequency < 1) trader.tradeFrequency = 1;

  // 9. AI Configuration Efficiency (80 to 98)
  let aie = 82;
  if (trader.advancedBehavior.enableDeepAnalysis) aie += 5;
  if (trader.advancedBehavior.useSentimentGrounding) aie += 4;
  aie += (trader.recommendationRules.indicators?.length || 2) * 1.5;
  trader.aiEfficiency = Math.floor(Math.max(80, Math.min(98, aie)));

  // 10. Volatility Handling (1 to 100)
  let vh = 75;
  if (trader.riskLevel === 'HIGH' && trader.winRate > 75) vh += 15;
  if (trader.riskLevel === 'LOW') vh -= 10; // doesn't handle volatility as aggressively
  vh += (trader.preferredMarkets.includes('SOL') || trader.preferredMarkets.includes('AVR') ? 8 : 0);
  trader.volatilityHandling = Math.floor(Math.max(55, Math.min(97, vh)));

  // 11. Recent Activity Score (1 to 100)
  const recentTradesCount = trades7D.length;
  trader.recentActivityScore = Math.floor(Math.max(30, Math.min(100, recentTradesCount * 12)));

  // 12. PnL Sparkline (Exactly 10 points)
  // Sample 10 points chronologically from allTrades return curve
  const sparkline: number[] = [];
  const chunkSize = Math.max(1, Math.floor(closedTrades.length / 10));
  let cumulative = 0;
  for (let i = 0; i < 10; i++) {
    const tradeIdx = Math.min(closedTrades.length - 1, (i + 1) * chunkSize - 1);
    const subtrades = closedTrades.slice(0, tradeIdx + 1);
    cumulative = subtrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
    sparkline.push(parseFloat(cumulative.toFixed(2)));
  }
  // Ensure the final point matches return30D or returnAllTime based on sparkline design
  // The UI uses it for 30D Sparkline return context, so let's normalize it to return30D range
  trader.pnlHistory30D = sparkline.map(val => {
    // scale to end up near return30D
    const ratio = trader.return30D / (sparkline[sparkline.length - 1] || 1);
    return parseFloat((val * (isNaN(ratio) ? 1 : ratio)).toFixed(2));
  });

  // Ensure recentTrades field contains the 3-5 latest sorted descending
  const openTrades = trader.trades.filter(t => t.status === 'OPEN');
  const sortedClosed = [...closedTrades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  trader.recentTrades = [...openTrades, ...sortedClosed.slice(0, 4)];

  // 13. Dynamic Performance Score calculation
  // Weighs multiple metrics as requested by the user
  const score = (trader.return30D * 0.40) + 
                (trader.return7D * 0.35) + 
                (trader.returnAllTime * 0.05) + 
                (trader.winRate * 2.5) + 
                (trader.profitFactor * 12) - 
                (trader.currentDrawdown * 1.5) + 
                (trader.riskManagementScore * 0.15) + 
                (trader.consistencyScore * 0.15) + 
                (trader.consecutiveWins * 1.2) - 
                (trader.consecutiveLosses * 1.8);

  trader.performanceScore = parseFloat(Math.max(50, score).toFixed(2));

  return trader;
}

/**
 * Initializes the list of 100 simulated traders.
 * Pulls from localStorage if available, otherwise generates historical trade profiles from scratch.
 */
function healTradeTimestamps(trader: SimulatedTrader): SimulatedTrader {
  if (!trader.trades || trader.trades.length === 0) return trader;
  
  const closedTrades = trader.trades.filter(t => t.status === 'CLOSED');
  if (closedTrades.length === 0) return trader;
  
  closedTrades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const latestTradeTime = new Date(closedTrades[closedTrades.length - 1].timestamp).getTime();
  const now = Date.now();
  
  const diff = now - latestTradeTime;
  if (diff > 30 * 60 * 1000) {
    trader.trades = trader.trades.map(t => ({
      ...t,
      timestamp: new Date(new Date(t.timestamp).getTime() + diff).toISOString()
    }));
  }
  return trader;
}

function getDesiredReturn30D(i: number, seed: string): number {
  const randFn = seededRandom(seed + "_return_" + i);
  if (i === 0) {
    return 243.99;
  }
  if (i < 10) {
    const step = (243.99 - 45.0) / 9;
    const base = 243.99 - i * step;
    const noise = (randFn() * 0.4 - 0.2) * step;
    return parseFloat(Math.min(242.0, Math.max(45.0, base + noise)).toFixed(2));
  }
  const step = (40.0 - (-15.0)) / 30;
  const base = 40.0 - (i - 10) * step;
  const noise = (randFn() * 0.4 - 0.2) * step;
  const val = base + noise;
  return parseFloat((val === 0 ? 1.25 : val).toFixed(2));
}

function adjustTradesToTargetReturn(trader: SimulatedTrader, targetReturn: number): SimulatedTrader {
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const trades30D = trader.trades.filter(t => t.status === 'CLOSED' && (nowMs - new Date(t.timestamp).getTime()) <= 30 * dayMs);
  
  if (trades30D.length === 0) {
    const asset = trader.preferredMarkets[0] || 'BTC';
    const basePrice = ASSETS_BY_MARKET[asset] || 100;
    const entryPrice = parseFloat((basePrice * 0.98).toFixed(2));
    const pnlPercent = targetReturn;
    const exitPrice = parseFloat((entryPrice * (1 + pnlPercent / 100)).toFixed(2));
    
    trader.trades.push({
      id: `t_${trader.id}_adj_init`,
      asset,
      type: 'BUY',
      entryPrice,
      exitPrice,
      pnlPercent,
      status: 'CLOSED',
      timestamp: new Date(nowMs - 5 * dayMs).toISOString()
    });
    return trader;
  }
  
  const currentSum = trades30D.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  if (Math.abs(currentSum - targetReturn) < 0.01) return trader;
  
  if (Math.abs(currentSum) < 0.1) {
    const val = targetReturn / trades30D.length;
    trades30D.forEach(t => {
      t.pnlPercent = parseFloat(val.toFixed(2));
      if (t.entryPrice) {
        t.exitPrice = parseFloat((t.entryPrice * (1 + t.pnlPercent / 100)).toFixed(2));
      }
    });
  } else {
    const diff = targetReturn - currentSum;
    const offset = diff / trades30D.length;
    trades30D.forEach(t => {
      t.pnlPercent = parseFloat(((t.pnlPercent || 0) + offset).toFixed(2));
      if (t.entryPrice) {
        t.exitPrice = parseFloat((t.entryPrice * (1 + t.pnlPercent / 100)).toFixed(2));
      }
    });
  }
  
  return trader;
}

export function initSimulatedTraders(): SimulatedTrader[] {
  const saved = safeStorage.getItem('aver_sim_traders_v6');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as SimulatedTrader[];
      // verify we have all traders; if specs changed or we need to heal, fall back
      if (parsed.length >= 40) {
        // Heal and recalculate
        const healed = parsed.map(t => {
          const healedTrader = healTradeTimestamps(t);
          return calculateTraderMetrics(healedTrader);
        });
        
        // Re-sort just in case rankings shifted
        healed.sort((a, b) => b.performanceScore - a.performanceScore);
        
        // Enforce ranks without resetting returns to hardcoded averages
        healed.forEach((t, index) => {
          t.rank = index + 1;
        });
        
        safeStorage.setItem('aver_sim_traders_v6', JSON.stringify(healed));
        return healed;
      }
    } catch (e) {
      console.error("Failed to parse saved simulated copytraders, regenerating...", e);
    }
  }

  // Generate brand new simulation database!
  console.log("Simulating 40 full-fidelity historical trader profiles from trade histories...");
  const traders = BASE_TRADERS_SPECS.map(spec => {
    const fullTrader = { ...spec } as SimulatedTrader;
    fullTrader.trades = generateHistoricalTradesForTrader(fullTrader);
    return calculateTraderMetrics(fullTrader);
  });

  // Initial ranking sort
  traders.sort((a, b) => b.performanceScore - a.performanceScore);
  
  // Set ranks and desired unique returns
  traders.forEach((t, index) => {
    t.rank = index + 1;
    t.prevRank = index + 1;
    
    // We generated followers procedurally earlier, keep them unless they are lower than a realistic floor for rank
    const minimumRankFollowers = Math.floor(50000 * Math.pow(0.97, index));
    if (t.followers < minimumRankFollowers) {
      t.followers = minimumRankFollowers + Math.floor(Math.random() * 5000);
    }
    
    // Enforce target returns directly on initialization
    const targetReturn = getDesiredReturn30D(index, t.id);
    adjustTradesToTargetReturn(t, targetReturn);
    calculateTraderMetrics(t);
  });

  safeStorage.setItem('aver_sim_traders_v6', JSON.stringify(traders));
  return traders;
}

/**
 * Executes a single tick of the simulation.
 * 1. Randomly chooses 1-3 traders to execute new completed trades.
 * 2. Simulates the trade outcomes, appends to trade histories.
 * 3. Updates follower counts based on performance.
 * 4. Recalculates all metrics and Performance Scores.
 * 5. Re-ranks all 100 traders.
 * 6. Generates rank movement and milestone events.
 * 7. Persists the updated state.
 */
export function runSimulationTick(traders: SimulatedTrader[]): {
  updatedTraders: SimulatedTrader[];
  events: SimulationEvent[];
} {
  const copy = traders.map(t => ({
    ...t,
    trades: t.trades.map(tr => ({ ...tr })),
    preferredMarkets: [...t.preferredMarkets]
  })) as SimulatedTrader[];

  const events: SimulationEvent[] = [];
  const rand = seededRandom(Math.random().toString());

  // Save ranks before tick
  const oldRanks: Record<string, number> = {};
  copy.forEach(t => {
    oldRanks[t.id] = t.rank;
    t.prevRank = t.rank;
  });

  // Pick 5-8 active traders to trade
  const numTradersTrading = Math.floor(rand() * 4) + 5;
  const pickedIndices = new Set<number>();
  while (pickedIndices.size < numTradersTrading) {
    pickedIndices.add(Math.floor(rand() * copy.length));
  }

  pickedIndices.forEach(idx => {
    const t = copy[idx];
    
    // Simulate completing their oldest open trade (if any) or adding a closed trade
    const openTradeIdx = t.trades.findIndex(tr => tr.status === 'OPEN');
    const asset = t.preferredMarkets[Math.floor(rand() * t.preferredMarkets.length)];
    const basePrice = ASSETS_BY_MARKET[asset] || 100;
    
    // Outcome parameters
    let basePnlRange = 2.0;
    let winChance = 0.74;
    
    if (t.style === 'SCALPING') {
      basePnlRange = 1.2;
      winChance = 0.81;
    } else if (t.style === 'SWING_TRADING') {
      basePnlRange = 8.5;
      winChance = 0.58;
    } else {
      basePnlRange = 3.2;
      winChance = 0.71;
    }

    if (t.riskLevel === 'HIGH') {
      basePnlRange *= 1.7;
      winChance -= 0.05;
    } else if (t.riskLevel === 'LOW') {
      basePnlRange *= 0.6;
      winChance += 0.06;
    }

    // Add some random performance fluctuations for authenticity
    const performanceFluctuation = (rand() - 0.5) * 0.1;
    winChance += performanceFluctuation;

    const isWin = rand() < winChance;
    let pnlPercent = 0;
    if (isWin) {
      pnlPercent = parseFloat((rand() * basePnlRange + 0.15).toFixed(2));
    } else {
      pnlPercent = parseFloat((-(rand() * basePnlRange * 1.05 + 0.15)).toFixed(2));
    }

    if (openTradeIdx !== -1) {
      // Close existing open trade
      const openTrade = t.trades[openTradeIdx];
      openTrade.status = 'CLOSED';
      openTrade.exitPrice = parseFloat((openTrade.entryPrice * (1 + pnlPercent / 100)).toFixed(2));
      openTrade.pnlPercent = pnlPercent;
      openTrade.timestamp = new Date().toISOString();
    } else {
      // Create and close a brand new trade immediately
      const entryPrice = parseFloat((basePrice * (1 + (rand() - 0.5) * 0.05)).toFixed(2));
      const exitPrice = parseFloat((entryPrice * (1 + pnlPercent / 100)).toFixed(2));
      
      t.trades.push({
        id: `t_${t.id}_live_${Date.now()}`,
        asset,
        type: rand() < 0.5 ? 'BUY' : 'SELL',
        entryPrice,
        exitPrice,
        pnlPercent,
        status: 'CLOSED',
        timestamp: new Date().toISOString()
      });
    }

    // Always append 1 new open trade to keep them looking active
    const nextOpenAsset = t.preferredMarkets[Math.floor(rand() * t.preferredMarkets.length)];
    const openPrice = ASSETS_BY_MARKET[nextOpenAsset] || 100;
    const entryPrice = parseFloat((openPrice * (1 + (rand() - 0.5) * 0.02)).toFixed(2));
    
    t.trades.push({
      id: `t_${t.id}_open_${Date.now()}`,
      asset: nextOpenAsset,
      type: rand() < 0.5 ? 'BUY' : 'SELL',
      entryPrice,
      status: 'OPEN',
      timestamp: new Date().toISOString()
    });

    // Clean up older history to keep memory usage low but maintain deep history (keep last 500 trades max)
    if (t.trades.length > 500) {
      const openOnes = t.trades.filter(tr => tr.status === 'OPEN');
      const closedOnes = t.trades.filter(tr => tr.status === 'CLOSED');
      t.trades = [...closedOnes.slice(closedOnes.length - 480), ...openOnes];
    }

    // Dynamic follower growth depending strictly on trade outcome and status!
    const oldFollowers = t.followers;
    if (pnlPercent > 0) {
      // Followers increase! More followers if high returns, rank etc.
      const multiplier = t.rank <= 3 ? 3.5 : t.rank <= 10 ? 2.0 : 1.2;
      const fDelta = Math.floor((rand() * 25 + 10) * multiplier);
      t.followers += fDelta;
    } else {
      // Followers decrease on losses!
      const multiplier = t.rank <= 3 ? 3.0 : t.rank <= 10 ? 1.8 : 1.0;
      const fDelta = Math.floor((rand() * 20 + 5) * multiplier);
      t.followers = Math.max(500, t.followers - fDelta);
    }
    
    // Occasional random social fluctuation
    if (rand() < 0.2) {
      const socialDelta = Math.floor((rand() - 0.5) * 40);
      t.followers = Math.max(500, t.followers + socialDelta);
    }

    // Trigger follower milestone event
    const milestoneThresh = 10000;
    if (oldFollowers < 10000 && t.followers >= 10000) {
      events.push({
        id: `evt_milestone_${t.id}_${Date.now()}`,
        text: `🔥 ${t.username} reached 10,000 followers after several weeks of consistent trading!`,
        timestamp: new Date().toISOString(),
        traderId: t.id,
        type: 'milestone'
      });
    } else if (oldFollowers < 15000 && t.followers >= 15000) {
      events.push({
        id: `evt_milestone_${t.id}_${Date.now()}`,
        text: `🚀 ${t.username} reached 15,000 followers following an exceptional win streak!`,
        timestamp: new Date().toISOString(),
        traderId: t.id,
        type: 'milestone'
      });
    } else if (oldFollowers < 20000 && t.followers >= 20000) {
      events.push({
        id: `evt_milestone_${t.id}_${Date.now()}`,
        text: `💎 ${t.username} reached 20,000 followers! Now ranked as a premier institutional advisor.`,
        timestamp: new Date().toISOString(),
        traderId: t.id,
        type: 'milestone'
      });
    }

    // Trigger consecutive win streaks event
    calculateTraderMetrics(t); // re-calculate to get latest consec wins
    if (t.consecutiveWins >= 6 && rand() < 0.3) {
      events.push({
        id: `evt_streak_${t.id}_${Date.now()}`,
        text: `⚡ Win Streak: ${t.username} secured ${t.consecutiveWins} consecutive profitable trades using their ${t.strategyName}!`,
        timestamp: new Date().toISOString(),
        traderId: t.id,
        type: 'win_streak'
      });
    }

    // Shift online/offline status occasionally
    if (rand() < 0.10) {
      const statuses: ('Trading' | 'Analyzing' | 'Online' | 'Offline')[] = ['Trading', 'Analyzing', 'Online', 'Offline'];
      t.status = statuses[Math.floor(rand() * statuses.length)];
    }

    copy[idx] = t;
  });

  // Update only traders who actually traded in this tick
  const updatedTraders = copy.map((t, idx) => {
    if (pickedIndices.has(idx)) {
      return calculateTraderMetrics(t);
    }
    return t;
  });

  // Sort by performanceScore descending to determine new ranks!
  updatedTraders.sort((a, b) => b.performanceScore - a.performanceScore);

  // Re-assign ranks and capture rank changes
  updatedTraders.forEach((t, newIdx) => {
    const oldRank = oldRanks[t.id] || (newIdx + 1);
    const newRank = newIdx + 1;
    t.rank = newRank;
    t.prevRank = oldRank;

    // Adjust followers based on new rank (simulate people following the leaderboard trends)
    const targetFollowers = 50000 * Math.pow(0.97, newIdx) + (t.tier === 'Platinum' ? 10000 : t.tier === 'Gold' ? 2500 : 0) + Math.floor(t.performanceScore * 10);
    // Smoothly transition followers towards target
    t.followers = Math.floor(t.followers + (targetFollowers - t.followers) * 0.1);

    // We only generate rank movement notifications occasionally to avoid clutter,
    // prioritizing dramatic rank up/down or entering/leaving top 10
    if (oldRank !== newRank) {
      if (oldRank > 10 && newRank <= 10) {
        // Entered top 10!
        events.push({
          id: `evt_rank_${t.id}_${Date.now()}`,
          text: `🌟 ${t.username} entered the Top 10 after outperforming the previous Rank #10 with a +${t.return30D.toFixed(2)}% monthly return.`,
          timestamp: new Date().toISOString(),
          traderId: t.id,
          type: 'entry'
        });
      } else if (oldRank <= 10 && newRank > 10) {
        // Dropped out of top 10
        events.push({
          id: `evt_rank_${t.id}_${Date.now()}`,
          text: `⚠️ ${t.username} dropped below Rank #10 following a series of tight protective stops being triggered.`,
          timestamp: new Date().toISOString(),
          traderId: t.id,
          type: 'rank_down'
        });
      } else if (oldRank === 1 && newRank > 1) {
        // Dropped from #1!
        events.push({
          id: `evt_rank_${t.id}_${Date.now()}`,
          text: `📉 ${t.username} dropped from Rank #1 to Rank #${newRank} following several losing trades. No champion is permanent!`,
          timestamp: new Date().toISOString(),
          traderId: t.id,
          type: 'rank_down'
        });
      } else if (oldRank > 1 && newRank === 1) {
        // Climbed to #1!
        events.push({
          id: `evt_rank_${t.id}_${Date.now()}`,
          text: `🏆 ${t.username} has claimed the Rank #1 position, outperforming all competitors with an immaculate performance score of ${t.performanceScore}!`,
          timestamp: new Date().toISOString(),
          traderId: t.id,
          type: 'rank_up'
        });
      } else if (Math.abs(oldRank - newRank) >= 3 && newRank <= 10 && rand() < 0.5) {
        // Significant climb inside top 10
        if (newRank < oldRank) {
          events.push({
            id: `evt_rank_${t.id}_${Date.now()}`,
            text: `📈 ${t.username} climbed from Rank #${oldRank} to Rank #${newRank} after improving their overall return.`,
            timestamp: new Date().toISOString(),
            traderId: t.id,
            type: 'rank_up'
          });
        } else {
          events.push({
            id: `evt_rank_${t.id}_${Date.now()}`,
            text: `📉 ${t.username} dropped from Rank #${oldRank} to Rank #${newRank} after experiencing a temporary drawdown.`,
            timestamp: new Date().toISOString(),
            traderId: t.id,
            type: 'rank_down'
          });
        }
      }
    }
  });

  // Enforce ranks, return caps, and uniqueness during tick simulation
  updatedTraders.forEach((t, index) => {
    t.rank = index + 1;
    if (index === 0) {
      if (t.return30D > 243.99) {
        adjustTradesToTargetReturn(t, 243.99);
        calculateTraderMetrics(t);
      }
    } else {
      // Ensure other traders are below the top performer and below 243.99
      const maxAllowed = Math.min(243.0, updatedTraders[0].return30D - 0.5);
      if (t.return30D >= maxAllowed) {
        adjustTradesToTargetReturn(t, maxAllowed - index * 0.1);
        calculateTraderMetrics(t);
      }
    }
  });

  // Save back to local storage using the correct fresh key
  safeStorage.setItem('aver_sim_traders_v6', JSON.stringify(updatedTraders));

  return {
    updatedTraders,
    events
  };
}

/**
 * Generates high-fidelity historical data series for Recharts or SVG charting for any given timeline.
 * Supports: '24h', '7d', '30d', '90d', '1y', 'all'
 */
export function getTraderEquityCurve(trader: SimulatedTrader, timeline: '24h' | '7d' | '30d' | '90d' | '1y' | 'all'): {
  labels: string[];
  dataPoints: number[];
  dates: Date[];
} {
  const closedTrades = trader.trades.filter(t => t.status === 'CLOSED');
  
  // Sort chronologically
  closedTrades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const nowMs = new Date().getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  let timelineTrades: SimulatedTrade[] = [];
  let durationMs = 0;
  let labelFormat: 'time' | 'day' | 'month' | 'year' = 'month';

  switch (timeline) {
    case '24h':
      durationMs = 24 * 60 * 60 * 1000;
      timelineTrades = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= durationMs);
      labelFormat = 'time';
      break;
    case '7d':
      durationMs = 7 * dayMs;
      timelineTrades = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= durationMs);
      labelFormat = 'day';
      break;
    case '30d':
      durationMs = 30 * dayMs;
      timelineTrades = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= durationMs);
      labelFormat = 'day';
      break;
    case '90d':
      durationMs = 90 * dayMs;
      timelineTrades = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= durationMs);
      labelFormat = 'month';
      break;
    case '1y':
      durationMs = 365 * dayMs;
      timelineTrades = closedTrades.filter(t => (nowMs - new Date(t.timestamp).getTime()) <= durationMs);
      labelFormat = 'month';
      break;
    case 'all':
      timelineTrades = closedTrades;
      labelFormat = 'month';
      break;
  }

  // If there are too few trades in a timeline, back-fill with some preceding history to make the chart complete and beautiful
  if (timelineTrades.length < 8) {
    // grab the latest 15 trades from closedTrades
    timelineTrades = closedTrades.slice(Math.max(0, closedTrades.length - 15));
  }

  // To build the exact equity curve for the selected timeline:
  // We compute the cumulative return *after* each trade is applied
  const dataPoints: number[] = [];
  const labels: string[] = [];
  const dates: Date[] = [];
  
  let cumulative = 0;

  // If we filter, we want to know what the cumulative PnL was before this timeline started
  const tradesBeforeTimeline = closedTrades.filter(t => !timelineTrades.some(tt => tt.id === t.id));
  const startingReturn = tradesBeforeTimeline.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  
  cumulative = startingReturn;

  // Add a starting point
  if (timelineTrades.length > 0) {
    dataPoints.push(parseFloat(cumulative.toFixed(2)));
    const firstDate = new Date(new Date(timelineTrades[0].timestamp).getTime() - 2 * 60 * 60 * 1000);
    dates.push(firstDate);
    labels.push(formatTimelineLabel(firstDate, labelFormat));
  }

  timelineTrades.forEach(t => {
    cumulative += (t.pnlPercent || 0);
    dataPoints.push(parseFloat(cumulative.toFixed(2)));
    const tDate = new Date(t.timestamp);
    dates.push(tDate);
    labels.push(formatTimelineLabel(tDate, labelFormat));
  });

  return {
    labels,
    dataPoints,
    dates
  };
}

function formatTimelineLabel(date: Date, format: 'time' | 'day' | 'month' | 'year'): string {
  if (format === 'time') {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }
  if (format === 'day') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
  if (format === 'month') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
  }
  return date.getFullYear().toString();
}
