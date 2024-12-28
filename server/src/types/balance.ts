export interface Balance {
  amount: number;
  price: number;
}

export interface Balances {
  [asset: string]: Balance;
}

export interface AllBalances {
  spot: Balances;
  funding: Balances;
  trading: Balances;
  earn: Balances;
  error?: {
    spot?: string;
    funding?: string;
    trading?: string;
    earn?: string;
  };
} 