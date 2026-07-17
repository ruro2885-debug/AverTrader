import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateAiRecommendation, analyzeTradeAction } from "./src/server/gemini";
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore(app);

async function seedLeaderboard() {
    try {
        const leaderboardRef = db.collection('leaderboard');
        const snapshot = await leaderboardRef.limit(1).get();
        if (snapshot.empty) {
            console.log("Seeding leaderboard...");
            for (let i = 1; i <= 20; i++) {
                await leaderboardRef.doc(`trader_${i}`).set({
                    rank: i,
                    username: `Trader_${i}`,
                    avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${i}`,
                    tier: i <= 2 ? 'Platinum' : i <= 10 ? 'Gold' : 'Silver',
                    verified: i <= 5,
                    return30d: (20 - i) * 2.5,
                    overallReturn: (20 - i) * 5,
                    winRate: 50 + (20 - i),
                    lossRate: 50 - (20 - i),
                    riskLevel: i <= 5 ? 'High' : 'Medium',
                    strategy: 'Aggressive',
                    markets: ['BTC', 'ETH'],
                    followers: (20 - i) * 100,
                    performanceGraph: [10, 20, 15, 30],
                    status: 'Trading'
                });
            }
            console.log("Leaderboard seeded successfully");
        }
    } catch (e) {
        console.error("Leaderboard seeding failed:", e);
    }
}

async function startServer() {
  await seedLeaderboard();
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
