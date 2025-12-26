
import { ExchangeName, AssetSymbol, PriceData } from '../types';

// 將代碼轉換為交易所特定的格式
const getBinanceSymbol = (s: AssetSymbol) => `${s.toLowerCase()}usdt`;
const getStandardSymbol = (s: AssetSymbol) => `${s}-USDT`;

export const setupBinanceWS = (onMessage: (data: PriceData) => void, onOpen: () => void) => {
  const symbols = Object.values(AssetSymbol).map(getBinanceSymbol).join('/');
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbols}@ticker`);
  
  ws.onopen = onOpen;
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const rawSymbol = msg.s.replace('USDT', '') as AssetSymbol;
    if (Object.values(AssetSymbol).includes(rawSymbol)) {
      onMessage({
        exchange: ExchangeName.BINANCE,
        symbol: rawSymbol,
        price: parseFloat(msg.c),
        timestamp: Date.now()
      });
    }
  };
  return () => ws.close();
};

export const setupCoinbaseWS = (onMessage: (data: PriceData) => void, onOpen: () => void) => {
  const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
  ws.onopen = () => {
    onOpen();
    ws.send(JSON.stringify({
      type: 'subscribe',
      product_ids: Object.values(AssetSymbol).map(getStandardSymbol),
      channels: ['ticker']
    }));
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type !== 'ticker') return;
    const rawSymbol = msg.product_id.split('-')[0] as AssetSymbol;
    onMessage({
      exchange: ExchangeName.COINBASE,
      symbol: rawSymbol,
      price: parseFloat(msg.price),
      timestamp: Date.now()
    });
  };
  return () => ws.close();
};

export const setupOKXWS = (onMessage: (data: PriceData) => void, onOpen: () => void) => {
  const ws = new WebSocket('wss://ws.okx.com:8443/ws/v5/public');
  ws.onopen = () => {
    onOpen();
    ws.send(JSON.stringify({
      op: 'subscribe',
      args: Object.values(AssetSymbol).map(s => ({ channel: 'tickers', instId: getStandardSymbol(s) }))
    }));
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.data || !msg.data[0]) return;
    const ticker = msg.data[0];
    const rawSymbol = ticker.instId.split('-')[0] as AssetSymbol;
    onMessage({
      exchange: ExchangeName.OKX,
      symbol: rawSymbol,
      price: parseFloat(ticker.last),
      timestamp: Date.now()
    });
  };
  return () => ws.close();
};
