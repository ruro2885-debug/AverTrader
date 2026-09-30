export function getAssetLogoUrl(symbol: string): string | null {
  const norm = (symbol || '').toUpperCase().trim();
  const map: Record<string, string> = {
    BTC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    ETH: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    SOL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    BNB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    XRP: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png',
    ADA: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png',
    DOGE: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png',
    USDT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    USDC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    SHIB: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png',
    DOT: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png',
    LINK: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    AVAX: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png',
    MATIC: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png',
    AAPL: 'https://api.iconify.design/logos:apple.svg',
    NVDA: 'https://api.iconify.design/logos:nvidia.svg',
    MSFT: 'https://api.iconify.design/logos:microsoft-icon.svg',
    META: 'https://api.iconify.design/logos:meta-icon.svg',
    NFLX: 'https://api.iconify.design/logos:netflix-icon.svg',
    AMD: 'https://api.iconify.design/logos:amd.svg',
    INTC: 'https://api.iconify.design/logos:intel.svg',
    PYPL: 'https://api.iconify.design/logos:paypal.svg',
    DIS: 'https://api.iconify.design/logos:disney.svg',
    V: 'https://api.iconify.design/logos:visa.svg',
    MA: 'https://api.iconify.design/logos:mastercard.svg',
  };
  return map[norm] || null;
}

export const assetLogoService = {
  getAssetLogoUrl,
};

export default assetLogoService;
