export interface AssetUniverseItem {
  symbol: string;
  name: string;
  category: 'crypto' | 'stock' | 'index' | 'commodity';
  price: number;
  change24h: number;
  volume24h?: number;
}

export const ASSET_UNIVERSE: AssetUniverseItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', price: 84291.45, change24h: 3.45 },
  { symbol: 'ETH', name: 'Ethereum', category: 'crypto', price: 3480.50, change24h: 2.15 },
  { symbol: 'SOL', name: 'Solana', category: 'crypto', price: 148.20, change24h: 5.80 },
  { symbol: 'BNB', name: 'BNB', category: 'crypto', price: 580.40, change24h: 1.20 },
  { symbol: 'AVR', name: 'Aver Token', category: 'crypto', price: 2.45, change24h: 8.50 },
  { symbol: 'USDT', name: 'Tether USD', category: 'crypto', price: 1.00, change24h: 0.01 },
  { symbol: 'USDC', name: 'USD Coin', category: 'crypto', price: 1.00, change24h: 0.00 },
  { symbol: 'XRP', name: 'XRP', category: 'crypto', price: 0.58, change24h: -0.40 },
  { symbol: 'ADA', name: 'Cardano', category: 'crypto', price: 0.45, change24h: 1.10 },
  { symbol: 'DOGE', name: 'Dogecoin', category: 'crypto', price: 0.12, change24h: 4.20 },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', price: 224.50, change24h: 1.15 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', price: 128.20, change24h: 4.80 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', category: 'stock', price: 448.90, change24h: 0.85 },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'stock', price: 242.50, change24h: -1.40 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'stock', price: 186.40, change24h: 1.60 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'stock', price: 178.30, change24h: 0.90 },
  { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'commodity', price: 232.10, change24h: 0.75 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'index', price: 482.60, change24h: 1.40 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'index', price: 554.20, change24h: 0.95 },
];

export const assetUniverse = ASSET_UNIVERSE;
export default ASSET_UNIVERSE;
