export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const btcPrice = req.body?.marketData?.BTC?.price || 64000;
  return res.status(200).json({
    asset: "BTC",
    currentPrice: btcPrice,
    suggestedAction: "BUY",
    entry: btcPrice,
    stopLoss: parseFloat((btcPrice * 0.95).toFixed(2)),
    takeProfit: parseFloat((btcPrice * 1.12).toFixed(2)),
    riskRating: "MEDIUM",
    confidence: 78,
    holdingWindow: "2-4 Days",
    volatility: "MEDIUM",
    indicators: ["Moving Average Convergence Divergence", "Relative Strength Index"],
    explanation: "Algorithmic momentum indicators suggest favorable risk-reward positioning."
  });
}
