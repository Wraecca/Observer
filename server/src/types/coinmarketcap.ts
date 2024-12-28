export interface CoinMarketCapCoin {
  id: number;
  name: string;
  symbol: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      market_cap: number;
    };
  };
}

export interface CoinMarketCapListingsResponse {
  data: CoinMarketCapCoin[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
  };
}

export interface CoinMarketCapPriceResponse {
  [symbol: string]: {
    usd: number;
    symbol: string;
  };
}

export interface CoinMarketCapConfig {
  apiKey: string;
} 