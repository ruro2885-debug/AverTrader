export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = req.body?.symbol || 'BTC';
  const currentPrice = req.body?.currentPrice || 64000;
  const multiplier = symbol === 'AVR' ? 1.25 : 1.10;

  return res.status(200).json({
    symbol,
    price: currentPrice,
    sentiment: symbol === 'AVR' ? 'Highly Bullish' : 'Bullish',
    support: parseFloat((currentPrice * 0.94).toFixed(2)),
    resistance: parseFloat((currentPrice * 1.07).toFixed(2)),
    takeProfit: parseFloat((currentPrice * multiplier).toFixed(2)),
    stopLoss: parseFloat((currentPrice * 0.91).toFixed(2)),
    timeframe: 'Short-to-Medium Term',
    indicators: {
      rsi: '59.4 (Neutral-Bullish)',
      macd: 'Slight bullish divergence forming on the 4-hour structural candle',
      movingAverages: 'Trading securely above the 50-day and 100-day simple moving averages'
    },
    summary: `The tactical technical setup for ${symbol} signals robust structural strength. Price action is forming a classic rounding bottom consolidation, indicating the completion of recent selling pressure. While short-term resistance near $${(currentPrice * 1.07).toFixed(2)} may prompt mild intraday profit-taking, the underlying spot-buying backlog suggests strong absorption of any local pullbacks near support.`,
    catalysts: [
      "Spot volume acceleration across primary global liquidity venues",
      "Upcoming network architecture refinements enhancing scaling efficiency",
      "Macro stability and liquidity indicators showing steady upside bias"
    ]
  });
}
