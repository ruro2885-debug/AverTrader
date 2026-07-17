import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

export async function generateAiRecommendation(marketData: any, userProfile: any) {
  const ai = getAiClient();

  const prompt = `
    Analyze the following market data and user profile to generate a professional trading recommendation.
    
    Market Data:
    ${JSON.stringify(marketData, null, 2)}
    
    User Profile:
    - Risk Profile: ${userProfile.riskProfile}
    - Trading Style: ${userProfile.tradingStyle}
    - Preferred Markets: ${userProfile.preferredMarkets?.join(", ")}
    
    Return a JSON object matching this structure:
    {
      "asset": "STRING",
      "currentPrice": NUMBER,
      "suggestedAction": "BUY" | "SELL",
      "entry": NUMBER,
      "stopLoss": NUMBER,
      "takeProfit": NUMBER,
      "riskRating": "LOW" | "MEDIUM" | "HIGH",
      "confidence": NUMBER (0-100),
      "holdingWindow": "STRING",
      "volatility": "LOW" | "MEDIUM" | "HIGH",
      "indicators": ["STRING"],
      "explanation": "STRING"
    }
    
    Only return valid JSON. Do not include markdown formatting.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Invalid AI response");
  }
}

export async function analyzeTradeAction(trade: any, marketCondition: any) {
  const ai = getAiClient();

  const prompt = `
    Analyze the following active trade and current market conditions.
    Suggest if the user should take any action to protect gains or reduce exposure.
    
    Trade:
    ${JSON.stringify(trade, null, 2)}
    
    Market Condition:
    ${JSON.stringify(marketCondition, null, 2)}
    
    Return a JSON object:
    {
      "suggestion": "REDUCE_EXPOSURE" | "PROTECT_GAINS" | "CLOSE_POSITION" | "HOLD" | "MONITOR_VOLATILITY",
      "explanation": "STRING",
      "priority": "LOW" | "MEDIUM" | "HIGH"
    }
    
    Only return valid JSON. Do not include markdown formatting.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error("Invalid AI response");
  }
}
