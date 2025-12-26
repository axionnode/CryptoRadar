
import React, { useState } from 'react';
import { AggregatedState, AssetSymbol, PriceData, Currency, ASSET_INFO } from '../types';
import { Star, Filter } from 'lucide-react';

interface Props {
  prices: AggregatedState;
  currency: Currency & { rate: number };
  conversionRate: number;
  watchlist: AssetSymbol[];
  onToggleWatchlist: (symbol: AssetSymbol) => void;
}

const MarketTable: React.FC<Props> = ({ prices, currency, conversionRate, watchlist, onToggleWatchlist }) => {
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const assets = Object.values(AssetSymbol);

  const filteredAssets = showWatchlistOnly 
    ? assets.filter(a => watchlist.includes(a)) 
    : assets;

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-4">
        <button
          onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            showWatchlistOnly 
              ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {showWatchlistOnly ? '顯示全部' : '只看自選'}
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-4 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">資產</th>
              <th className="py-4 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest">交易所</th>
              <th className="py-4 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest text-right">當前價格 ({currency.code})</th>
              <th className="py-4 px-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest text-right">溢價/折價</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAssets.map(asset => {
              const assetExchanges = prices[asset];
              const pricesArr = (Object.values(assetExchanges) as (PriceData | undefined)[])
                .map(p => p?.price || 0)
                .filter(v => v > 0);
              
              if (pricesArr.length === 0) return null;
              
              const avgUsdt = pricesArr.reduce((a, b) => a + b, 0) / pricesArr.length;
              const avgConverted = avgUsdt * conversionRate;
              const isWatchlisted = watchlist.includes(asset);

              return Object.entries(assetExchanges).map(([exName, data], index) => {
                const priceData = data as PriceData | undefined;
                if (!priceData) return null;
                
                const currentPriceConverted = priceData.price * conversionRate;
                const diff = currentPriceConverted - avgConverted;
                const diffPercent = avgConverted !== 0 ? (diff / avgConverted) * 100 : 0;
                const meta = ASSET_INFO[asset];

                return (
                  <tr key={`${exName}-${asset}`} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onToggleWatchlist(asset)}
                          className={`p-1 rounded-md transition-all hover:bg-slate-700/50 ${
                            isWatchlisted ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                          }`}
                          aria-label={`Toggle ${asset} Watchlist`}
                        >
                          <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                        </button>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-100">{asset}</span>
                          <span className="text-[9px] text-slate-500">{meta.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-400 font-medium">{exName}</td>
                    <td className="py-4 px-4 text-right mono font-medium text-slate-200">
                      <span className="text-[10px] text-slate-600 mr-1">{currency.symbol}</span>
                      {currentPriceConverted.toLocaleString(undefined, { 
                        minimumFractionDigits: currentPriceConverted < 0.0001 ? 8 : 4,
                        maximumFractionDigits: currentPriceConverted < 0.0001 ? 8 : 4 
                      })}
                    </td>
                    <td className={`py-4 px-4 text-right mono text-xs font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      <div className="flex flex-col items-end">
                         <span>{diff >= 0 ? '+' : ''}{diffPercent.toFixed(3)}%</span>
                         <span className="text-[9px] opacity-50 font-normal">{diff >= 0 ? '+' : ''}{diff.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
            {showWatchlistOnly && filteredAssets.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-500 text-sm italic">
                  尚未加入自選資產，點擊星號即可追蹤
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketTable;
