import express from "express";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createServer as createViteServer } from "vite";
import { generateAiRecommendation, analyzeTradeAction, generateCatherineCommentary, generateMarketIntelligence, generateAssetAnalysis } from "./src/server/gemini";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Firebase Admin
  if (!getApps().length) {
    initializeApp();
  }
  const adminDb = getFirestore();

  // Server-side caching for AI responses
  const cache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 60 * 60 * 1000; // Increased to 60 minutes to preserve quota

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/crypto/price", async (req, res) => {
    try {
      const symbol = (req.query.symbol as string || '').toUpperCase();
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }

      if (symbol === 'USDT' || symbol === 'USDC' || symbol.includes('USDT')) {
        return res.json({ symbol, price: 1.0 });
      }

      // 1. Try Binance
      try {
        const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, { signal: AbortSignal.timeout(3000) });
        if (binanceRes.ok) {
          const binanceData = await binanceRes.json();
          if (binanceData && binanceData.price) {
            return res.json({ symbol, price: parseFloat(binanceData.price) });
          }
        }
      } catch (e) {
        // Continue
      }

      // 2. Try CoinCap
      try {
        const coincapIdMap: Record<string, string> = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'SOL': 'solana',
          'BNB': 'binance-coin'
        };
        const assetId = coincapIdMap[symbol];
        if (assetId) {
          const coincapRes = await fetch(`https://api.coincap.io/v2/assets/${assetId}`, { signal: AbortSignal.timeout(3000) });
          if (coincapRes.ok) {
            const coincapData = await coincapRes.json();
            if (coincapData?.data?.priceUsd) {
              return res.json({ symbol, price: parseFloat(coincapData.data.priceUsd) });
            }
          }
        }
      } catch (e) {
        // Continue
      }

      // 3. Fallback to simulated live prices
      const fallbackPrices: Record<string, number> = {
        'BTC': 64850,
        'ETH': 3480.5,
        'SOL': 148.2,
        'BNB': 585.4
      };
      const basePrice = fallbackPrices[symbol] || 1.0;
      const cycle = Math.sin(Date.now() / 15000);
      const simulatedPrice = basePrice + (cycle * (basePrice * 0.002));
      return res.json({ symbol, price: simulatedPrice });
    } catch (error) {
      return res.json({ symbol: req.query.symbol, price: 1.0 });
    }
  });




  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { marketData, userProfile } = req.body;
      const userId = userProfile?.uid || "anonymous";
      const cacheKey = `analyze_${userId}`;
      const cached = cache.get(cacheKey);
      
      // Cache for 30 minutes for recommendations
      if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) {
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

      // Cache for 10 minutes for trade monitoring
      if (cached && (Date.now() - cached.timestamp < 10 * 60 * 1000)) {
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
      const response = await fetch('https://api.coincap.io/v2/assets?limit=15', {
        headers: { 'Accept-Encoding': 'gzip, deflate' }
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json?.data)) {
          const mapped = json.data.map((item: any) => ({
            symbol: `${item.symbol?.toUpperCase()}USDT`,
            lastPrice: parseFloat(item.priceUsd || '0').toFixed(item.priceUsd < 1 ? 4 : 2),
            priceChangePercent: parseFloat(item.changePercent24Hr || '0').toFixed(2),
            quoteVolume: parseFloat(item.volumeUsd24Hr || '0').toFixed(2)
          }));
          return res.json(mapped);
        }
      }
    } catch {
      // Clean fallback
    }

    const now = Date.now();
    const cycle = Math.sin(now / 10000);
    const fallbackData = [
      { symbol: 'BTCUSDT', lastPrice: (64850 + cycle * 120).toFixed(2), priceChangePercent: '2.45', quoteVolume: '1420500000.00' },
      { symbol: 'ETHUSDT', lastPrice: (3480.5 + cycle * 12).toFixed(2), priceChangePercent: '1.82', quoteVolume: '850300000.00' },
      { symbol: 'SOLUSDT', lastPrice: (148.2 + cycle * 1.5).toFixed(2), priceChangePercent: '5.14', quoteVolume: '620100000.00' },
      { symbol: 'BNBUSDT', lastPrice: (585.4 + cycle * 2.0).toFixed(2), priceChangePercent: '0.95', quoteVolume: '210400000.00' },
      { symbol: 'XRPUSDT', lastPrice: (0.584 + cycle * 0.005).toFixed(4), priceChangePercent: '-0.85', quoteVolume: '180200000.00' },
      { symbol: 'ADAUSDT', lastPrice: (0.412 + cycle * 0.003).toFixed(4), priceChangePercent: '1.20', quoteVolume: '95000000.00' },
      { symbol: 'DOGEUSDT', lastPrice: (0.128 + cycle * 0.002).toFixed(4), priceChangePercent: '3.40', quoteVolume: '310000000.00' },
      { symbol: 'AVAXUSDT', lastPrice: (28.5 + cycle * 0.4).toFixed(2), priceChangePercent: '-1.10', quoteVolume: '88000000.00' },
      { symbol: 'LINKUSDT', lastPrice: (14.2 + cycle * 0.25).toFixed(2), priceChangePercent: '2.15', quoteVolume: '74000000.00' },
      { symbol: 'FETUSDT', lastPrice: (1.45 + cycle * 0.02).toFixed(2), priceChangePercent: '8.60', quoteVolume: '120000000.00' }
    ];
    return res.json(fallbackData);
  });

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
