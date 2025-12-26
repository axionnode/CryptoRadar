
import React from 'react';
import { AssetSymbol, ExchangeName, PriceData, Currency, ASSET_INFO } from '../types';

interface Props {
  symbol: AssetSymbol;
  avgPrice: number;
  exchanges: Partial<Record<ExchangeName, PriceData>>;
  color: string;
  currency: Currency & { rate: number };
}

const PriceCard: React.FC<Props> = ({ symbol, avgPrice, exchanges, color, currency }) => {
  const metadata = ASSET_INFO[symbol];
  
  const colorMap: Record<string, string> = {
    orange: 'text-orange-400 border-orange-500/20 bg-orange-500/10',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
  };

  const styleClass = colorMap[color] || colorMap.blue;

  const formatPrice = (val: number) => {
    // 針對虛擬貨幣計價，若數值極小則增加位數
    const minDigits = val < 0.001 ? 6 : 2;
    const maxDigits = val < 0.001 ? 8 : 4;
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: minDigits, 
      maximumFractionDigits: maxDigits 
    });
  };

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden group transition-all hover:border-white/20 ${styleClass}`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <h4 className="text-7xl font-black italic">{symbol}</h4>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
             <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{metadata.fullName}</span>
             <span className="text-[9px] text-slate-500">{metadata.category}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-slate-900/50 rounded text-slate-500 font-mono">LIVE</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-bold opacity-70`}>{currency.symbol}</span>
          <span className={`text-4xl font-bold mono`}>
            {formatPrice(avgPrice)}
          </span>
          <span className="text-slate-500 text-xs font-medium ml-1">{currency.code}</span>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          {Object.entries(exchanges).map(([name, data]) => {
            const priceData = data as PriceData | undefined;
            const convertedPrice = priceData ? priceData.price * currency.rate : null;
            return (
              <div key={name} className="flex flex-col p-2 rounded-lg bg-slate-900/60 border border-white/5">
                <span className="text-[8px] text-slate-500 uppercase font-black mb-1">{name}</span>
                <span className="text-[11px] font-semibold mono text-slate-300">
                  {convertedPrice ? `${currency.symbol}${formatPrice(convertedPrice)}` : '---'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
