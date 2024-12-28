export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  current_price: number;
}

export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
    symbol?: string;
  };
}

export interface CoinGeckoConfig {
  apiKey?: string;
} 