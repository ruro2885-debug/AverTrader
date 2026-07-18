import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateAiRecommendation, analyzeTradeAction, generateCatherineCommentary } from "./src/server/gemini";

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

  app.post("/api/verify-recaptcha", async (req, res) => {
    try {
      const { token } = req.body;
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;

      if (!secretKey) {
        // If not configured, we allow it to pass so preview doesn't break entirely if keys are missing
        // (but ideally users should provide the key).
        console.warn("RECAPTCHA_SECRET_KEY is not set. Allowing verification to pass.");
        return res.json({ success: true, score: 0.9 });
      }

      const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        res.json({ success: true, ...data });
      } else {
        res.status(400).json({ success: false, error: "reCAPTCHA verification failed" });
      }
    } catch (error: any) {
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
