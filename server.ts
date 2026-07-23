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
      const userId = userProfile?.uid || "anonymous";
      const cacheKey = `analyze_${userId}`;
      const cached = cache.get(cacheKey);
      
      // Cache for 5 minutes for recommendations
      if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
        return res.json(cached.data);
      }

      const recommendation = await generateAiRecommendation(marketData, userProfile);
      cache.set(cacheKey, { data: recommendation, timestamp: Date.now() });
      res.json(recommendation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/monitor", async (req, res) => {
    try {
      const { trade, marketCondition } = req.body;
      const tradeId = trade?.id || "unknown";
      const cacheKey = `monitor_${tradeId}`;
      const cached = cache.get(cacheKey);

      // Cache for 2 minutes for trade monitoring
      if (cached && (Date.now() - cached.timestamp < 2 * 60 * 1000)) {
        return res.json(cached.data);
      }

      const suggestion = await analyzeTradeAction(trade, marketCondition);
      cache.set(cacheKey, { data: suggestion, timestamp: Date.now() });
      res.json(suggestion);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/commentary", async (req, res) => {
    try {
      const { portfolioMetrics, userId } = req.body;
      if (!portfolioMetrics) {
        return res.status(400).json({ error: "portfolioMetrics is required" });
      }

      const cacheKey = `commentary_${userId || 'global'}`;
      const cached = cache.get(cacheKey);
      
      // Cache for 10 minutes for commentary
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
      }

      const commentary = await generateCatherineCommentary(portfolioMetrics);
      cache.set(cacheKey, { data: commentary, timestamp: Date.now() });
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

  // Server-side caching for AI responses
  const cache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  app.post("/api/market/intelligence", async (req, res) => {
    try {
      const cacheKey = "market_intelligence";
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
      }

      const { currentPrices } = req.body;
      const intelligence = await generateMarketIntelligence(currentPrices || {});
      
      cache.set(cacheKey, { data: intelligence, timestamp: Date.now() });
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

      const cacheKey = `asset_analysis_${symbol}`;
      const cached = cache.get(cacheKey);
      // For asset analysis, we can cache for a shorter time or check if price significantly changed
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
      }

      const analysis = await generateAssetAnalysis(symbol, currentPrice);
      cache.set(cacheKey, { data: analysis, timestamp: Date.now() });
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
