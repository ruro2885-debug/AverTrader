export type CanonicalAssetCategory = 'crypto' | 'stock' | 'index' | 'commodity' | 'forex' | 'etf';

export interface AssetUniverseItem {
  symbol: string;
  name: string;
  category: CanonicalAssetCategory;
  price: number;
  change24h: number;
  volume24h?: number;
  keywords?: string[];
}

export type UniverseAsset = AssetUniverseItem;

export function normalizeCategory(category: string): CanonicalAssetCategory {
  const norm = (category || '').toLowerCase().trim();
  if (norm.includes('crypto')) return 'crypto';
  if (norm.includes('stock')) return 'stock';
  if (norm.includes('ind')) return 'index';
  if (norm.includes('commod')) return 'commodity';
  if (norm.includes('forex') || norm.includes('fx')) return 'forex';
  if (norm.includes('etf')) return 'etf';
  return 'crypto';
}

export function toMarketCategory(category: string): 'Crypto' | 'Stocks' | 'Forex' | 'Indices' | 'Commodities' {
  const canonical = normalizeCategory(category);
  switch (canonical) {
    case 'stock': return 'Stocks';
    case 'forex': return 'Forex';
    case 'index':
    case 'etf': return 'Indices';
    case 'commodity': return 'Commodities';
    case 'crypto':
    default: return 'Crypto';
  }
}

export const INITIAL_DEFAULT_ASSET_COLLECTION: AssetUniverseItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 84291.45, change24h: 3.45, keywords: ['crypto', 'bitcoin', 'btc', 'digital gold'] },
  { symbol: 'ETH', name: 'Ethereum', category: 'crypto', price: 3480.50, change24h: 2.15, keywords: ['crypto', 'ethereum', 'eth', 'smart contracts'] },
  { symbol: 'SOL', name: 'Solana', category: 'crypto', price: 148.20, change24h: 5.80, keywords: ['crypto', 'solana', 'sol', 'layer1'] },
  { symbol: 'BNB', name: 'BNB', category: 'crypto', price: 580.40, change24h: 1.20, keywords: ['crypto', 'binance', 'bnb'] },
  { symbol: 'AVR', name: 'Aver Token', category: 'crypto', price: 2.45, change24h: 8.50, keywords: ['crypto', 'aver', 'avr', 'native token'] },
  { symbol: 'USDT', name: 'Tether USD', category: 'crypto', price: 1.00, change24h: 0.01, keywords: ['crypto', 'stablecoin', 'usdt'] },
  { symbol: 'USDC', name: 'USD Coin', category: 'crypto', price: 1.00, change24h: 0.00, keywords: ['crypto', 'stablecoin', 'usdc'] },
  { symbol: 'XRP', name: 'XRP', category: 'crypto', price: 0.58, change24h: -0.40, keywords: ['crypto', 'ripple', 'xrp'] },
  { symbol: 'ADA', name: 'Cardano', category: 'crypto', price: 0.45, change24h: 1.10, keywords: ['crypto', 'cardano', 'ada'] },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'crypto', price: 0.12, change24h: 4.20, keywords: ['crypto', 'doge', 'meme'] },
  { symbol: 'LINK', name: 'Chainlink', category: 'crypto', price: 18.40, change24h: 3.10, keywords: ['crypto', 'oracle', 'link'] },
  { symbol: 'AVAX', name: 'Avalanche', category: 'crypto', price: 34.20, change24h: 2.80, keywords: ['crypto', 'avax', 'layer1'] },
  { symbol: 'MATIC', name: 'Polygon', category: 'crypto', price: 0.72, change24h: 1.40, keywords: ['crypto', 'polygon', 'matic'] },
  { symbol: 'SHIB', name: 'Shiba Inu', category: 'crypto', price: 0.000024, change24h: 5.10, keywords: ['crypto', 'shib', 'meme'] },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', price: 224.50, change24h: 1.15, keywords: ['stock', 'apple', 'tech', 'nasdaq'] },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', price: 128.20, change24h: 4.80, keywords: ['stock', 'nvidia', 'ai', 'semiconductors'] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stock', price: 448.90, change24h: 0.85, keywords: ['stock', 'microsoft', 'software', 'cloud'] },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', price: 242.50, change24h: -1.40, keywords: ['stock', 'tesla', 'ev', 'automotive'] },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock', price: 186.40, change24h: 1.60, keywords: ['stock', 'amazon', 'ecommerce', 'cloud'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock', price: 178.30, change24h: 0.90, keywords: ['stock', 'google', 'alphabet', 'search'] },
  { symbol: 'META', name: 'Meta Platforms', category: 'stock', price: 512.40, change24h: 2.10, keywords: ['stock', 'meta', 'facebook', 'social'] },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'stock', price: 680.10, change24h: 1.30, keywords: ['stock', 'netflix', 'streaming'] },
  { symbol: 'AMD', name: 'AMD', category: 'stock', price: 154.20, change24h: 3.40, keywords: ['stock', 'amd', 'semiconductors'] },
  { symbol: 'INTC', name: 'Intel Corp.', category: 'stock', price: 32.10, change24h: -0.50, keywords: ['stock', 'intel', 'chips'] },
  { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'commodity', price: 232.10, change24h: 0.75, keywords: ['commodity', 'gold', 'precious metals'] },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'commodity', price: 28.40, change24h: 1.10, keywords: ['commodity', 'silver', 'metals'] },
  { symbol: 'USO', name: 'United States Oil Fund', category: 'commodity', price: 78.50, change24h: -1.20, keywords: ['commodity', 'oil', 'crude', 'energy'] },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'index', price: 482.60, change24h: 1.40, keywords: ['index', 'etf', 'nasdaq', 'tech'] },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'index', price: 554.20, change24h: 0.95, keywords: ['index', 'etf', 'sp500'] },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', category: 'index', price: 48.90, change24h: 2.30, keywords: ['index', 'etf', 'innovation', 'tech'] },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', price: 1.085, change24h: 0.12, keywords: ['forex', 'eur', 'usd', 'currencies'] },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', price: 1.294, change24h: -0.15, keywords: ['forex', 'gbp', 'usd', 'currencies'] },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'forex', price: 154.20, change24h: 0.35, keywords: ['forex', 'usd', 'jpy', 'currencies'] },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'forex', price: 0.665, change24h: 0.08, keywords: ['forex', 'aud', 'usd', 'currencies'] },
];

export const ASSET_UNIVERSE = INITIAL_DEFAULT_ASSET_COLLECTION;
export const assetUniverse = ASSET_UNIVERSE;
export default ASSET_UNIVERSE;
