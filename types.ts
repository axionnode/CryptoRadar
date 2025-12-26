
export enum ExchangeName {
  BINANCE = 'Binance',
  COINBASE = 'Coinbase',
  OKX = 'OKX'
}

export enum AssetSymbol {
  BTC = 'BTC',
  ETH = 'ETH',
  SOL = 'SOL',
  BNB = 'BNB',
  XRP = 'XRP',
  DOGE = 'DOGE',
  LINK = 'LINK'
}

export interface AssetMetadata {
  fullName: string;
  category: string;
  color: 'blue' | 'emerald' | 'amber' | 'purple' | 'orange' | 'rose' | 'indigo';
}

export const ASSET_INFO: Record<AssetSymbol, AssetMetadata> = {
  [AssetSymbol.BTC]: { fullName: 'Bitcoin', category: 'Layer 1', color: 'orange' },
  [AssetSymbol.ETH]: { fullName: 'Ethereum', category: 'Smart Contract', color: 'indigo' },
  [AssetSymbol.SOL]: { fullName: 'Solana', category: 'High-Perf L1', color: 'purple' },
  [AssetSymbol.BNB]: { fullName: 'BNB Chain', category: 'Ecosystem', color: 'amber' },
  [AssetSymbol.XRP]: { fullName: 'Ripple', category: 'Payment', color: 'blue' },
  [AssetSymbol.DOGE]: { fullName: 'Dogecoin', category: 'Meme', color: 'orange' },
  [AssetSymbol.LINK]: { fullName: 'Chainlink', category: 'Oracle', color: 'blue' },
};

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  isStablecoin?: boolean;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USDT', symbol: '₮', label: 'Tether (穩定幣)', isStablecoin: true },
  { code: 'USDC', symbol: '₵', label: 'USD Coin (穩定幣)', isStablecoin: true },
  { code: 'BTC', symbol: '₿', label: 'Bitcoin (比特幣)' },
  { code: 'ETH', symbol: 'Ξ', label: 'Ethereum (乙太幣)' },
  { code: 'SOL', symbol: 'S', label: 'Solana' },
  { code: 'BNB', symbol: 'B', label: 'BNB' },
];

export interface PriceData {
  exchange: ExchangeName;
  symbol: AssetSymbol;
  price: number;
  timestamp: number;
}

export type AggregatedState = {
  [key in AssetSymbol]: Partial<Record<ExchangeName, PriceData>>;
};

export interface AIAnalysis {
  summary: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  keyInsights: string[];
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  time: string;
}
