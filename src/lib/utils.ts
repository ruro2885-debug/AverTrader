
// Exchange rates relative to USD
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  BTC: 0.000014,
  USDT: 1,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BTC: '₿',
  USDT: '₮',
};

export const formatCurrency = (amount: number | undefined, currency: string = 'USD'): string => {
  if (amount === undefined || isNaN(amount)) return `${CURRENCY_SYMBOLS[currency] || '$'}0.00`;
  
  const rate = EXCHANGE_RATES[currency] || 1;
  const convertedValue = amount * rate;

  if (currency === 'BTC') {
    return `${CURRENCY_SYMBOLS.BTC}${convertedValue.toFixed(8)}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(convertedValue);
};
