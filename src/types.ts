export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  profilePhotoURL: string;
  country: string;
  phoneNumber?: string;
  accountType: string;
  accountStatus: string;
  portfolioBalance: number;
  availableBalance: number;
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
  biometricEnabled: boolean;
  aiTradingEnabled: boolean;
  riskPreference: string;
  currency?: string;
  rememberMeEnabled?: boolean;
  createdAt: any;
  lastLogin: any;
  lastUpdated: any;
  onboardingCompleted?: boolean;
  bonuses?: any[];
  kycStatus?: 'unverified' | 'pending' | 'verified';
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
