import { Timestamp } from 'firebase/firestore';

export type AiSessionStatus = 'ACTIVE' | 'INACTIVE';
export type RecommendationStatus = 'PENDING' | 'EXECUTED' | 'DISMISSED' | 'EXPIRED';
export type TradeStatus = 'OPEN' | 'CLOSED';
export type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TradingSchedule {
  sessions: { start: string; end: string }[];
  weekdays: boolean;
  weekends: boolean;
  timezone: string;
  breakPeriods: { start: string; end: string }[];
  excludeHolidays: boolean;
}

export interface RiskControls {
  maxPositionSize: number;
  maxSimultaneousPositions: number;
  exposureLimit: number;
  positionSizingPreference: 'FIXED' | 'PERCENTAGE';
  lossLimit: number;
}

export interface RecommendationRules {
  minConfidence: number;
  allowedAssetClasses: ('CRYPTO' | 'STOCKS' | 'FOREX')[];
  indicators: string[];
}

export interface AiPreferenceProfile {
  preferredMarkets: string[]; // e.g. ['BTC', 'ETH', 'SOL']
  assetClasses: ('CRYPTO' | 'STOCKS' | 'FOREX')[];
  riskProfile: RiskRating;
  tradingStyle: 'SCALPING' | 'DAY_TRADING' | 'SWING_TRADING';
  maxSimultaneousRecommendations: number;
  defaultPositionSizing: 'FIXED' | 'PERCENTAGE';
  defaultPositionSize: number; // Amount or %
  marketScanFrequency: number; // in minutes
  // Risk Controls & Settings
  maxPositionSize?: number;
  maxRiskPerTrade?: number;
  lossLimit?: number;
  minConfidence?: number;
  minimumConfidenceScore?: number;
  exposureLimit?: number;
  maxSimultaneousPositions?: number;
  updatedAt?: string;
  notificationPreferences: {
    newRecommendations: boolean;
    tradeExecutions: boolean;
    marketAlerts: boolean;
  };
}

export interface AiConfiguration {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Timestamp;
  lastModified: Timestamp;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  
  // Section 1: Session Setup
  sessionSetup: {
    amountToAllocate: number;
    fundingSource: 'WALLET' | 'VAULT';
    sessionDuration: number; // in hours
  };

  // Section 2: Profit & Risk Management
  profitRiskManagement: {
    sessionTakeProfit: number; // %
    sessionStopLoss: number; // %
    maxRiskPerTrade: number; // %
    maxPositionSize: number; // amount in USD
  };

  // Section 3: AI Trading Rules
  aiTradingRules: {
    minConfidence: number; // 0-100
    maxSimultaneousPositions: number;
    assetSelection: string[];
    tradingStrategy: 'NEURAL_MOMENTUM' | 'VOLATILITY_BREAKOUT' | 'MEAN_REVERSION' | 'QUANT_GRID';
  };

  // Section 4: Configuration Details
  configurationDetails: {
    description: string;
    category: string;
    version: string;
  };

  // Section 5: Configuration Analytics & Notes
  analyticsAndNotes: {
    riskScore: number; // 0-100
    strategyNotes: string;
    performanceStats?: {
      winRate: number;
      totalReturn: number;
      drawdown: number;
    };
    executionHistory?: string[];
  };

  notificationPreferences: {
    newRecommendations: boolean;
    tradeExecutions: boolean;
    marketAlerts: boolean;
  };
}

export interface AiSession {
  id: string;
  userId: string;
  status: AiSessionStatus;
  startTime: Timestamp;
  endTime?: Timestamp;
  activeConfigId: string;
  tradingCapital: number;
  initialCapital: number;
  openPositionsCount: number;
  totalProfit: number;
  totalLoss: number;
  lastUpdate: Timestamp;
}

export interface AiRecommendation {
  id: string;
  sessionId: string;
  userId?: string;
  asset: string;
  currentPrice: number;
  suggestedAction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskRating: RiskRating;
  confidence: number; // 0-100
  holdingWindow: string; // e.g. "4-8 hours"
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  indicators: string[]; // e.g. ["RSI Oversold", "MACD Crossover"]
  explanation: string;
  status: RecommendationStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface AiTrade {
  id: string;
  recommendationId: string;
  userId: string;
  asset: string;
  entry: number;
  exit?: number;
  quantity: number;
  currentPrice: number;
  status: TradeStatus;
  stopLoss: number;
  takeProfit: number;
  riskExposure: number;
  openedAt: Timestamp;
  closedAt?: Timestamp;
  duration?: string;
  pnl?: number;
  pnlPercent?: number;
  reasonClosed?: 'TARGET_HIT' | 'STOP_LOSS_HIT' | 'MANUAL' | 'AI_SUGGESTION';
}

export interface MarketScanStatus {
  asset: string;
  status: 'SCANNING' | 'COMPLETED' | 'WAITING' | 'NO_OPPORTUNITY' | 'RECOMMENDATION_ACTIVE';
  lastAnalyzed: Timestamp;
}
