export interface Balance {
  amount: number;
  price: number;
}

export interface Balances {
  [asset: string]: Balance;
}

type AccountBalances = {
  [account: string]: Balances;
};

type ErrorInfo = {
  [account: string]: string;
};

export interface ExchangeBalance {
  balances: AccountBalances;
  error?: ErrorInfo;
}

export interface ExchangeBalances {
  [exchange: string]: ExchangeBalance;
}

export interface AssetPrice {
  symbol: string;
  price: number;
} 