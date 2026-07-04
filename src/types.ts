export type Language = 'EN' | 'ES' | 'ZH' | 'DE' | 'FR';
export type Theme = 'light' | 'dark';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'USDT';

export interface Preferences {
  language: Language;
  theme: Theme;
  currency: Currency;
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
