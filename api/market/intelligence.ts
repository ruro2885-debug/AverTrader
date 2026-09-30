export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const btc = req.body?.currentPrices?.BTC || 64230;
  const eth = req.body?.currentPrices?.ETH || 3450.20;
  const sol = req.body?.currentPrices?.SOL || 145.60;
  const aapl = req.body?.currentPrices?.AAPL || 172.40;
  const nvda = req.body?.currentPrices?.NVDA || 120.15;

  return res.status(200).json({
    briefing: {
      title: "Consolidation Precedes Macro Bull Expansion",
      summary: `The global digital asset and equity markets exhibit a standardized consolidation structure. Bitcoin (BTC) is trading near $${btc.toLocaleString()}, demonstrating robust demand clusters at key support thresholds. Ethereum (ETH) continues to secure ranges near $${eth.toLocaleString()} under stable smart contract fee dynamics. Solana (SOL) leads high-frequency protocols near $${sol.toLocaleString()} as on-chain liquidity volume expands. Institutional allocations persist at moderate levels, signaling structural position-building.`,
      confidence: 86,
      trend: 'Consolidation',
      riskLevel: 'Moderate',
      sentimentScore: 72,
      sentimentLabel: 'Greed'
    },
    movers: [
      { symbol: "BTC", name: "Bitcoin", sentiment: "Bullish", targetPrice: parseFloat((btc * 1.08).toFixed(2)), reason: "ETF daily net inflows stabilizing above key moving average ranges" },
      { symbol: "ETH", name: "Ethereum", sentiment: "Neutral-Bullish", targetPrice: parseFloat((eth * 1.09).toFixed(2)), reason: "Gas optimizations attracting sustainable high-yield dapp contracts" },
      { symbol: "SOL", name: "Solana", sentiment: "Highly Bullish", targetPrice: parseFloat((sol * 1.15).toFixed(2)), reason: "On-chain decentralized exchange metrics outperforming key layer-1 peers" },
      { symbol: "AAPL", name: "Apple Inc.", sentiment: "Neutral", targetPrice: parseFloat((aapl * 1.04).toFixed(2)), reason: "Integration of localized core intelligence processors in next-gen releases" },
      { symbol: "NVDA", name: "NVIDIA Corp.", sentiment: "Bullish", targetPrice: parseFloat((nvda * 1.12).toFixed(2)), reason: "Sustained order pipelines across high-performance datacenters" }
    ],
    news: [
      { id: 1, time: "15m ago", title: "Institutional Ethereum ETF Inflows Outpace Initial Projections", source: "Aver Capital Team", impact: "High", summary: "Aggregate secondary market volume suggests institutional investors are starting to balance portfolios with decentralized smart contract infrastructure assets." },
      { id: 2, time: "42m ago", title: "Solana On-Chain Daily Active Addresses Hit 12-Month High", source: "DeFi Analytics Hub", impact: "High", summary: "Increased transaction throughput paired with local fee market efficiencies continues to drive decentralized exchange engagement." },
      { id: 3, time: "2h ago", title: "Federal Reserve Indicates Soft Landing Goals are Within Reach", source: "Macro Markets Digest", impact: "Medium", summary: "Economic indicators aligning with target inflation rates foster a solid risk-on environment, supportive of growth stocks and crypto assets." }
    ]
  });
}
