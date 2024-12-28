export interface DebankToken {
  chain: string;
  symbol: string;
  price: number;
  amount: number;
}

export interface DebankSupplyToken {
  chain: string;
  symbol: string;
  price: number;
  amount: number;
}

export interface DebankPortfolioDetail {
  supply_token_list: DebankSupplyToken[];
}

export interface DebankPortfolioItem {
  detail: DebankPortfolioDetail;
}

export interface DebankProtocol {
  portfolio_item_list: DebankPortfolioItem[];
}

export interface DebankConfig {
  apiKey: string;
  walletList: string[];
  chainIds: string[];
} 