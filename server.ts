import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateAiRecommendation, analyzeTradeAction, generateCatherineCommentary, generateMarketIntelligence, generateAssetAnalysis } from "./src/server/gemini";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { marketData, userProfile } = req.body;
      const recommendation = await generateAiRecommendation(marketData, userProfile);
      res.json(recommendation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/monitor", async (req, res) => {
    try {
      const { trade, marketCondition } = req.body;
      const suggestion = await analyzeTradeAction(trade, marketCondition);
      res.json(suggestion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/commentary", async (req, res) => {
    try {
      const { portfolioMetrics } = req.body;
      if (!portfolioMetrics) {
        return res.status(400).json({ error: "portfolioMetrics is required" });
      }
      const commentary = await generateCatherineCommentary(portfolioMetrics);
      res.json(commentary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/market/ticker", async (req, res) => {
    try {
      const symbols = encodeURIComponent('["BTCUSDT","ETHUSDT","ADAUSDT","XRPUSDT","SOLUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","BNBUSDT","FETUSDT"]');
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`);
      if (!response.ok) throw new Error('Binance API failed');
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Market ticker proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/market/intelligence", async (req, res) => {
    try {
      const { currentPrices } = req.body;
      const intelligence = await generateMarketIntelligence(currentPrices || {});
      res.json(intelligence);
    } catch (error: any) {
      console.error("Failed to generate market intelligence:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/market/asset-analysis", async (req, res) => {
    try {
      const { symbol, currentPrice } = req.body;
      if (!symbol || currentPrice === undefined) {
        return res.status(400).json({ error: "symbol and currentPrice are required" });
      }
      const analysis = await generateAssetAnalysis(symbol, currentPrice);
      res.json(analysis);
    } catch (error: any) {
      console.error(`Failed to analyze asset ${req.body.symbol}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
