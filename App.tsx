
import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeName, AssetSymbol, AggregatedState, PriceData, Currency, SUPPORTED_CURRENCIES, ASSET_INFO } from './types';
import { setupBinanceWS, setupCoinbaseWS, setupOKXWS } from './services/exchangeService';
import PriceCard from './components/PriceCard';
import MarketTable from './components/MarketTable';
import TrendAnalysis from './components/TrendAnalysis';
import NewsFeed from './components/NewsFeed';
import CurrencySelector from './components/CurrencySelector';
import { Activity, BarChart3, ShieldAlert, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [prices, setPrices] = useState<AggregatedState>(() => {
    const initialState = {} as AggregatedState;
    Object.values(AssetSymbol).forEach(s => {
      initialState[s] = {};
    });
    return initialState;
  });

  const [watchlist, setWatchlist] = useState<AssetSymbol[]>(() => {
    try {
      const saved = localStorage.getItem('cryptoradar_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
  const [connectionStatus, setConnectionStatus] = useState<Record<ExchangeName, boolean>>({
    [ExchangeName.BINANCE]: false,
    [ExchangeName.COINBASE]: false,
    [ExchangeName.OKX]: false
  });

  const updatePrice = (data: PriceData) => {
    setPrices(prev => ({
      ...prev,
      [data.symbol]: {
        ...prev[data.symbol],
        [data.exchange]: data
      }
    }));
  };

  useEffect(() => {
    localStorage.setItem('cryptoradar_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (symbol: AssetSymbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  useEffect(() => {
    const binanceCleanup = setupBinanceWS(
      (data) => updatePrice(data),
      () => setConnectionStatus(prev => ({ ...prev, [ExchangeName.BINANCE]: true }))
    );
    const coinbaseCleanup = setupCoinbaseWS(
      (data) => updatePrice(data),
      () => setConnectionStatus(prev => ({ ...prev, [ExchangeName.COINBASE]: true }))
    );
    const okxCleanup = setupOKXWS(
      (data) => updatePrice(data),
      () => setConnectionStatus(prev => ({ ...prev, [ExchangeName.OKX]: true }))
    );

    return () => {
      binanceCleanup();
      coinbaseCleanup();
      okxCleanup();
    };
  }, []);

  const baseAveragesUsdt = useMemo(() => {
    const results = {} as Record<AssetSymbol, number>;
    Object.values(AssetSymbol).forEach(s => {
      const assetPrices = prices[s];
      const values = (Object.values(assetPrices) as (PriceData | undefined)[])
        .map(p => p?.price || 0)
        .filter(v => v > 0);
      results[s] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });
    return results;
  }, [prices]);

  const currentConversionRate = useMemo(() => {
    if (selectedCurrency.isStablecoin) return 1;
    const basePrice = baseAveragesUsdt[selectedCurrency.code as AssetSymbol];
    return basePrice > 0 ? 1 / basePrice : 0;
  }, [baseAveragesUsdt, selectedCurrency]);

  const displayAverages = useMemo(() => {
    const results = {} as Record<AssetSymbol, number>;
    Object.values(AssetSymbol).forEach(s => {
      results[s] = baseAveragesUsdt[s] * currentConversionRate;
    });
    return results;
  }, [baseAveragesUsdt, currentConversionRate]);

  const activeCurrencyWithRate = useMemo(() => ({
    ...selectedCurrency,
    rate: currentConversionRate
  }), [selectedCurrency, currentConversionRate]);

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-2 rounded-xl">
             <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              CryptoRadar Pro
            </h1>
            <p className="text-slate-400 text-sm">專業級跨交易所實時數據終端</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex gap-3 mr-4">
            {Object.entries(connectionStatus).map(([name, active]) => (
              <div key={name} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-full text-[10px] font-medium text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {name}
              </div>
            ))}
          </div>
          <CurrencySelector selected={activeCurrencyWithRate} onSelect={setSelectedCurrency} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PriceCard 
          symbol={AssetSymbol.BTC} 
          avgPrice={displayAverages[AssetSymbol.BTC]} 
          exchanges={prices[AssetSymbol.BTC]} 
          color="orange"
          currency={activeCurrencyWithRate}
        />
        <PriceCard 
          symbol={AssetSymbol.ETH} 
          avgPrice={displayAverages[AssetSymbol.ETH]} 
          exchanges={prices[AssetSymbol.ETH]} 
          color="indigo"
          currency={activeCurrencyWithRate}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">全市場即時行情表</h2>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                AUTO-REFRESHING
              </div>
            </div>
            <MarketTable 
              prices={prices} 
              currency={activeCurrencyWithRate} 
              conversionRate={currentConversionRate}
              watchlist={watchlist}
              onToggleWatchlist={toggleWatchlist}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold">AI 市場情緒報告</h2>
            </div>
            <TrendAnalysis prices={prices} />
            
            <div className="mt-8 pt-8 border-t border-slate-700">
              <NewsFeed />
            </div>
          </section>
        </div>
      </div>
      
      <footer className="text-center text-slate-600 text-[11px] pt-8 uppercase tracking-widest">
        &copy; 2024 CryptoRadar Dashboard &bull; Multi-Exchange WebSocket Aggregator
      </footer>
    </div>
  );
};

export default App;
