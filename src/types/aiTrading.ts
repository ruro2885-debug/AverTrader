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
  description: string;
  version: number;
  createdAt: Timestamp;
  lastModified: Timestamp;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  // Configuration Data Sections
  markets: string[];
  schedule: TradingSchedule;
  strategy: 'NEURAL_MOMENTUM' | 'VOLATILITY_BREAKOUT' | 'MEAN_REVERSION' | 'QUANT_GRID';
  riskControls: RiskControls;
  recommendationRules: RecommendationRules;
  notificationPreferences: {
    newRecommendations: boolean;
    tradeExecutions: boolean;
    marketAlerts: boolean;
  };
  advancedBehavior: {
    enableDeepAnalysis: boolean;
    useSentimentGrounding: boolean;
    neuralConfidenceThreshold: number;
  };
}

export interface AiSession {
  id: string;
  userId: string;
  status: AiSessionStatus;
  startTime: Timestamp;
  endTime?: Timestamp;
  marketsScanned: string[];
  activeConfigId?: string; // Track which configuration is running
}

export interface AiRecommendation {
  id: string;
  sessionId: string;
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
