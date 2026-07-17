export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  profilePhotoURL: string;
  avatarUrl?: string;
  country: string;
  phoneNumber?: string;
  accountType: string;
  accountStatus: string;
  portfolioBalance: number;
  availableBalance: number;
  vaultBalance: number;
  activeOffset: number;
  totalProfit: number;
  totalLoss: number;
  totalDeposits: number;
  totalWithdrawals: number;
  referralCode: string;
  referredBy?: string | null;
  referralCount: number;
  preferredLanguage: string;
  theme: string;
  notificationSettings: Record<string, boolean>;
  hasCustomPhoto?: boolean;
  avatarSeed?: string;
  biometricEnabled: boolean;
  aiTradingEnabled: boolean;
  aiSettings?: {
    copilotMode: 'copilot' | 'autonomous';
    maxActiveTrades: number;
    riskProfile: 'Conservative' | 'Balanced' | 'Tactical';
    drawdownStopLimit: number;
    maxCapitalExposure: number;
    consecutiveLosses: number;
  };
  riskPreference: string;
  currency?: string;
  rememberMeEnabled?: boolean;
  createdAt: any;
  lastLogin: any;
  lastUpdated: any;
  onboardingCompleted?: boolean;
  bonuses?: any[];
  kycStatus?: 'unverified' | 'pending' | 'verified';
  watchlist?: string[];
}

export type Language = 'EN' | 'ES' | 'ZH' | 'DE' | 'FR' | 'PT';
export type Theme = 'light' | 'dark';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'USDT';

export interface Preferences {
  language: Language;
  theme: Theme;
  currency: Currency;
  rememberMeEnabled?: boolean;
  biometricsEnabled?: boolean;
  notifications?: {
    master?: boolean;
    security?: boolean;
    profile?: boolean;
    deposits?: boolean;
    withdrawals?: boolean;
    trading?: boolean;
    signals?: boolean;
    system?: boolean;
    referrals?: boolean;
    marketing?: boolean;
    criticalAlertsSound?: boolean;
  };
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface TradeSignal {
  id: string;
  timestamp: string;
  pair: string;
  type: 'BUY' | 'SELL';
  price: number;
  optimizerConfidence: number;
  status: 'PENDING' | 'EXECUTED' | 'COMPLETED';
}

export interface Position {
  id: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  pnlStatus: 'profit' | 'loss';
}

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  avgEntry: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  change24H: number;
  allocationPct: number;
  logoColor: string;
  logoText: string;
  aiDetails: string;
  trend: number[];
  riskRating: 'Low' | 'Medium' | 'High';
  confidenceScore: number;
  lastAiDecision: string;
  targetAllocation?: number;
}

export interface TradeHistoryItem {
  id: string;
  ticker: string;
  side: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'rebalance';
  quantity: number;
  price: number;
  amount?: number;
  timestamp: any;
  type: 'manual' | 'ai' | 'system';
  pnl?: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  reason?: string;
  tradeId?: string;
  txHash?: string;
}

export interface PortfolioSnapshot {
  id: string;
  timestamp: any;
  totalValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  exposure: number;
  holdings: Record<string, number>;
  cash: number;
}
