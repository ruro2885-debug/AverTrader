export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema: number;
  sma: number;
  vwap: number;
  bollingerUpper: number;
  bollingerLower: number;
  aiPrediction: number;
  benchmark: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  rsi?: number;
  marker?: { type: 'buy' | 'sell' | 'dividend' | 'deposit' | 'withdrawal' | 'corp'; label: string } | null;
  isFuture?: boolean;
}

// Generate TradingView styled candlestick data
export function generateChartData(timeframe: string, benchmark: string): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  let basePrice = 54000;
  let volatility = 0.015;
  let trendSlope = 0.001;

  // Adjust parameters based on timeframe
  let numPoints = 50;
  let timeLabels: string[] = [];
  const now = new Date();

  switch (timeframe) {
    case '1D':
      numPoints = 40;
      volatility = 0.004;
      trendSlope = 0.0003;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 15 * 60 * 1000);
        timeLabels.push(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
      break;
    case '5D':
      numPoints = 45;
      volatility = 0.008;
      trendSlope = 0.001;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
        timeLabels.push(`${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.getHours()}:00`);
      }
      break;
    case '1M':
      numPoints = 40;
      volatility = 0.018;
      trendSlope = 0.003;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      break;
    case '3M':
      numPoints = 45;
      volatility = 0.025;
      trendSlope = 0.006;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      break;
    case '6M':
      numPoints = 50;
      volatility = 0.035;
      trendSlope = 0.012;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 4 * 24 * 60 * 60 * 1000);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      break;
    case 'YTD':
      numPoints = 45;
      volatility = 0.04;
      trendSlope = 0.015;
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const diffMs = now.getTime() - startOfYear.getTime();
      const stepMs = diffMs / numPoints;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * stepMs);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      break;
    case '1Y':
      numPoints = 50;
      volatility = 0.05;
      trendSlope = 0.03;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
      }
      break;
    default: // ALL
      numPoints = 60;
      volatility = 0.08;
      trendSlope = 0.06;
      for (let i = numPoints; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 15 * 24 * 60 * 60 * 1000);
        timeLabels.push(d.toLocaleDateString([], { month: 'short', year: '2-digit' }));
      }
      break;
  }

  // Generate historical points
  let currentPrice = basePrice;
  let currentBenchmark = benchmark === 'S&P 500' ? 5100 : benchmark === 'NASDAQ' ? 16000 : benchmark === 'Bitcoin' ? 58000 : 2100; // Gold
  const bchVol = benchmark === 'Bitcoin' ? 0.03 : 0.008;
  const bchTrend = benchmark === 'Bitcoin' ? 0.001 : 0.0004;

  const emaPeriod = 12;
  const smaPeriod = 26;
  const prices: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const change = currentPrice * (Math.random() - 0.48) * volatility + (currentPrice * trendSlope);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * volatility * 0.4);
    const low = Math.min(open, close) - Math.random() * (currentPrice * volatility * 0.4);
    const volume = Math.floor(1000 + Math.random() * 9000);

    prices.push(close);
    currentPrice = close;

    // Calculate simulated overlays
    let ema = close;
    if (i > 0 && points[i - 1]) {
      const k = 2 / (emaPeriod + 1);
      ema = close * k + points[i - 1].ema * (1 - k);
    }

    let sma = close;
    if (i >= smaPeriod) {
      const sum = prices.slice(i - smaPeriod, i).reduce((a, b) => a + b, 0);
      sma = sum / smaPeriod;
    } else if (i > 0 && points[i - 1]) {
      sma = points[i - 1].sma * 0.98 + close * 0.02;
    } else {
      sma = close * 0.99;
    }

    const vwap = sma * (1 + (Math.random() - 0.5) * 0.002);
    const bollingerUpper = ema * (1 + volatility * 1.5);
    const bollingerLower = ema * (1 - volatility * 1.5);
    const aiPrediction = close * (1 + (Math.random() - 0.35) * volatility * 0.5);

    // Benchmark updates
    const bchChange = currentBenchmark * (Math.random() - 0.49) * bchVol + (currentBenchmark * bchTrend);
    currentBenchmark += bchChange;

    // MACD calculations
    const macd = (ema - sma) * 0.1;
    let macdSignal = macd * 0.8;
    if (i > 0 && points[i - 1] && points[i - 1].macdSignal !== undefined) {
      macdSignal = macd * 0.2 + points[i - 1].macdSignal! * 0.8;
    }
    const macdHist = macd - macdSignal;

    // RSI calculations (simulated oscillator)
    const rsi = 45 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10;

    // Determine markers on certain indices to avoid cluttering
    let marker: ChartDataPoint['marker'] = null;
    if (i === Math.floor(numPoints * 0.2)) {
      marker = { type: 'buy', label: 'Buy Call at $' + Math.round(close) };
    } else if (i === Math.floor(numPoints * 0.4)) {
      marker = { type: 'dividend', label: 'Dividend Reinvested: +$420.00' };
    } else if (i === Math.floor(numPoints * 0.55)) {
      marker = { type: 'deposit', label: 'Vault Deposit: +$50,000' };
    } else if (i === Math.floor(numPoints * 0.75)) {
      marker = { type: 'sell', label: 'Hedge Sell (Profit Lock)' };
    } else if (i === Math.floor(numPoints * 0.9)) {
      marker = { type: 'corp', label: 'Corporate Action: Stock Split Synced' };
    }

    points.push({
      time: timeLabels[i] || '',
      open,
      high,
      low,
      close,
      volume,
      ema,
      sma,
      vwap,
      bollingerUpper,
      bollingerLower,
      aiPrediction,
      benchmark: currentBenchmark,
      macd,
      macdSignal,
      macdHist,
      rsi,
      marker,
      isFuture: false,
    });
  }

  // Generate 8 Future Forecast Points (Dashed AI line only)
  let lastClose = points[points.length - 1].close;
  let lastBenchmark = points[points.length - 1].benchmark;
  for (let j = 1; j <= 8; j++) {
    const futureTime = new Date(now.getTime() + j * (timeframe === '1D' ? 15 : timeframe === '5D' ? 240 : 1440) * 60 * 1000);
    let timeStr = '';
    if (timeframe === '1D') {
      timeStr = futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      timeStr = futureTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Extend upward bullish AI trend forecast
    lastClose = lastClose * (1 + 0.0015 * j + (Math.random() - 0.4) * volatility * 0.4);
    lastBenchmark = lastBenchmark * (1 + 0.0003 * j);

    points.push({
      time: timeStr,
      open: 0,
      high: 0,
      low: 0,
      close: 0, // No candles in future
      volume: 0,
      ema: 0,
      sma: 0,
      vwap: 0,
      bollingerUpper: 0,
      bollingerLower: 0,
      aiPrediction: lastClose,
      benchmark: lastBenchmark,
      isFuture: true,
    });
  }

  return points;
}

export interface SimulationResult {
  projectedValue: number;
  totalContributions: number;
  totalProfit: number;
  inflationAdjustedValue: number;
  yearlyData: { year: number; total: number; contributions: number; profit: number }[];
}

// AVER compound growth simulator algorithm
export function runCompoundSimulator(
  initial: number,
  monthly: number,
  annualReturnPct: number,
  years: number,
  riskProfile: string,
  drip: boolean
): SimulationResult {
  // Adjust rate based on risk profile multiplier
  let rateMultiplier = 1.0;
  if (riskProfile === 'Quantum') rateMultiplier = 1.35;
  else if (riskProfile === 'High') rateMultiplier = 1.15;
  else if (riskProfile === 'Low') rateMultiplier = 0.85;

  const adjustedAnnualRate = (annualReturnPct / 100) * rateMultiplier + (drip ? 0.015 : 0); // DRIP adds simulated 1.5% dividend yield
  const monthlyRate = adjustedAnnualRate / 12;
  const months = years * 12;

  let total = initial;
  let totalContributions = initial;
  const yearlyData: SimulationResult['yearlyData'] = [
    { year: 0, total: initial, contributions: initial, profit: 0 }
  ];

  for (let m = 1; m <= months; m++) {
    total = total * (1 + monthlyRate) + monthly;
    totalContributions += monthly;

    if (m % 12 === 0) {
      const year = m / 12;
      const profit = Math.max(0, total - totalContributions);
      yearlyData.push({
        year,
        total: Math.round(total),
        contributions: Math.round(totalContributions),
        profit: Math.round(profit)
      });
    }
  }

  // Inflation discount at 2.5% constant rate
  const inflationAdjustedValue = total / Math.pow(1 + 0.025, years);

  return {
    projectedValue: Math.round(total),
    totalContributions: Math.round(totalContributions),
    totalProfit: Math.round(Math.max(0, total - totalContributions)),
    inflationAdjustedValue: Math.round(inflationAdjustedValue),
    yearlyData
  };
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  allocation: number;
  aiRating: number;
  aiDecision: 'BUY' | 'SELL' | 'HODL' | 'ACCUMULATE';
  news: string;
  newsSentiment: 'Bullish' | 'Neutral' | 'Bearish';
  logoColor: string;
  logoText: string;
  quantity: number;
  avgEntry: number;
  aiDetails: string;
}

// Premium Volatility Watchlist initial dataset
export const initialWatchlistData: WatchlistItem[] = [
  {
    ticker: 'BTC',
    name: 'Bitcoin Core Node',
    price: 64230.00,
    change: 2.45,
    allocation: 49.3,
    aiRating: 94,
    aiDecision: 'HODL',
    news: 'Bitcoin spot ETFs draw record $520M institutional inflows inside 24 hours.',
    newsSentiment: 'Bullish',
    logoColor: 'from-amber-500 to-orange-600',
    logoText: '₿',
    quantity: 0.85,
    avgEntry: 52000,
    aiDetails: 'Sovereign-grade asset accumulation phase complete. Support established at $58,000. AI node projects target breakout toward $68,500.'
  },
  {
    ticker: 'ETH',
    name: 'Ethereum Gas Node',
    price: 3450.20,
    change: 1.82,
    allocation: 37.2,
    aiRating: 88,
    aiDecision: 'ACCUMULATE',
    news: 'ConsenSys reports 18% increase in validator rewards as Dencun upgrade lowers operational fees.',
    newsSentiment: 'Bullish',
    logoColor: 'from-blue-500 to-indigo-600',
    logoText: 'Ξ',
    quantity: 12.0,
    avgEntry: 2800,
    aiDetails: 'Vast utility moat. Staking yield optimized. Institutional accumulation persistent. AI projects price expansion due to supply squeeze.'
  },
  {
    ticker: 'SOL',
    name: 'Solana High-Speed Node',
    price: 145.60,
    change: -0.52,
    allocation: 13.5,
    aiRating: 82,
    aiDecision: 'BUY',
    news: 'DeFi velocity on Solana surpasses Ethereum mainnet for three consecutive trading sessions.',
    newsSentiment: 'Bullish',
    logoColor: 'from-purple-500 to-teal-500',
    logoText: 'S',
    quantity: 120.0,
    avgEntry: 110,
    aiDetails: 'Ultra-fast node throughput. Short-term retracement provides optimal buy-the-dip entry before next network load-test.'
  }
];
