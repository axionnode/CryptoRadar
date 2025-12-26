
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { fetchLatestNews } from '../services/geminiService';
import { Newspaper, ExternalLink, RefreshCw, Clock, AlertCircle } from 'lucide-react';

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLatestNews();
      if (data && data.length > 0) {
        setNews(data);
      } else if (news.length === 0) {
        setError("暫時無法獲取新聞");
      }
    } catch (e: any) {
      if (e?.message?.includes('429')) {
        setError("API 配額已耗盡，請稍後再試");
      } else {
        setError("新聞抓取失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    // 延長更新間隔至 15 分鐘
    const interval = setInterval(loadNews, 900000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-semibold">幣圈即時頭條</h2>
        </div>
        <button 
          onClick={loadNews}
          disabled={loading}
          title="重新整理新聞"
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors group"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 group-hover:text-white ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {error && news.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-500">
          <AlertCircle className="w-3 h-3" />
          <span>{error}。目前顯示舊有快取內容。</span>
        </div>
      )}

      <div className="space-y-3">
        {loading && news.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          news.map((item, index) => (
            <a 
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-slate-800/30 hover:bg-slate-700/40 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all group"
            >
              <div className="flex justify-between items-start gap-3">
                <h3 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-blue-400 flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-bold uppercase">
                  {item.source}
                </span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.time}</span>
                </div>
              </div>
            </a>
          ))
        )}
        {!loading && news.length === 0 && error && (
          <div className="text-center py-8 text-slate-500 text-sm italic bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
            <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
