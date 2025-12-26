
import React, { useState, useEffect } from 'react';
import { AggregatedState, AIAnalysis } from '../types';
import { getMarketAnalysis } from '../services/geminiService';
import { Sparkles, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
  prices: AggregatedState;
}

const TrendAnalysis: React.FC<Props> = ({ prices }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const fetchAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setIsQuotaExceeded(false);
    
    try {
      const result = await getMarketAnalysis(prices);
      setAnalysis(result);
      if (result.keyInsights.some(i => i.includes('429') || i.includes('配額'))) {
        setIsQuotaExceeded(true);
      }
    } catch (e) {
      setIsQuotaExceeded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // 延長自動分析間隔至 10 分鐘，以節省配額
    const timer = setInterval(fetchAnalysis, 600000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
          analysis?.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' : 
          analysis?.sentiment === 'Bearish' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/20 text-slate-400'
        }`}>
          {analysis?.sentiment || '分析中...'}
        </div>
        <button 
          onClick={fetchAnalysis}
          disabled={loading}
          title="重新分析"
          className="text-slate-500 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {isQuotaExceeded && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-500">
          <AlertCircle className="w-3 h-3" />
          <span>API 請求過於頻繁，目前顯示的是快取或預設內容。</span>
        </div>
      )}

      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed italic">
            "{analysis?.summary || '正在整合各大交易所數據並由 Gemini AI 進行深度市場分析...'}"
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {analysis?.keyInsights.map((insight, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm text-slate-400 p-2 border-b border-slate-800 last:border-0">
            <ChevronRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="line-clamp-2">{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendAnalysis;
