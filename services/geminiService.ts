
import { GoogleGenAI, Type } from "@google/genai";
import { AggregatedState, AIAnalysis, NewsItem } from "../types";

const getAIInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 快取金鑰與過期時間 (毫秒)
const CACHE_KEYS = {
  ANALYSIS: 'cryptoradar_analysis_cache',
  NEWS: 'cryptoradar_news_cache'
};
const CACHE_EXPIRY = {
  ANALYSIS: 10 * 60 * 1000, // 10 分鐘
  NEWS: 20 * 60 * 1000      // 20 分鐘
};

/**
 * 帶有指數退避的重試包裝器
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini API 觸發配額限制，正在進行第 ${i + 1} 次重試，等待 ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * 檢查快取是否有效
 */
function getCachedData<T>(key: string, expiry: number): T | null {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < expiry) {
      return data as T;
    }
  } catch (e) {
    localStorage.removeItem(key);
  }
  return null;
}

/**
 * 儲存快取
 */
function setCacheData(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}

export const getMarketAnalysis = async (state: AggregatedState): Promise<AIAnalysis> => {
  // 優先使用快取
  const cached = getCachedData<AIAnalysis>(CACHE_KEYS.ANALYSIS, CACHE_EXPIRY.ANALYSIS);
  if (cached) return cached;

  const ai = getAIInstance();
  const btcAvg = calculateAvg(state.BTC);
  const ethAvg = calculateAvg(state.ETH);

  const prompt = `
    請根據以下即時加密貨幣價格數據進行短評：
    BTC 均價: $${btcAvg.toFixed(2)}
    ETH 均價: $${ethAvg.toFixed(2)}
    
    請分析市場情緒（Bullish/Bearish/Neutral）並提供三個關鍵洞察。
    請用繁體中文回答，語氣要專業且簡潔。
  `;

  try {
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              keyInsights: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "sentiment", "keyInsights"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    });

    setCacheData(CACHE_KEYS.ANALYSIS, result);
    return result;
  } catch (error: any) {
    console.error("AI Analysis failed:", error);
    // 如果有舊的快取即使過期也先拿來用，避免顯示錯誤
    const stale = getCachedData<AIAnalysis>(CACHE_KEYS.ANALYSIS, Infinity);
    return stale || {
      summary: "目前 API 配額已達上限或連線不穩定，請稍後再試。",
      sentiment: "Neutral",
      keyInsights: ["配額暫時耗盡 (429)", "市場數據仍在即時更新", "建議 10 分鐘後手動重新分析"]
    };
  }
};

export const fetchLatestNews = async (): Promise<NewsItem[]> => {
  // 優先使用快取
  const cached = getCachedData<NewsItem[]>(CACHE_KEYS.NEWS, CACHE_EXPIRY.NEWS);
  if (cached) return cached;

  const ai = getAIInstance();
  const prompt = `
    Find the 5 most recent and important cryptocurrency news headlines in Traditional Chinese. 
    Focus on major events from sources like Cointelegraph, CoinDesk, and BlockTempo.
    Format your response as a JSON array of objects with keys: "title", "url", "source", and "time".
    IMPORTANT: ONLY return the JSON data.
  `;

  try {
    const result = await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                source: { type: Type.STRING },
                time: { type: Type.STRING }
              },
              required: ["title", "url", "source", "time"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    });

    if (result && result.length > 0) {
      setCacheData(CACHE_KEYS.NEWS, result);
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch news:", error);
    // 返回過期快取或空陣列
    const stale = getCachedData<NewsItem[]>(CACHE_KEYS.NEWS, Infinity);
    return stale || [];
  }
};

const calculateAvg = (exchanges: any) => {
  const vals = Object.values(exchanges).map((v: any) => v.price).filter(v => v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};
