export interface SnapshotData {
  symbol: string;
  price: string;
  exchange: string;
  type: string;
  amount: string;
}

export interface AssetData {
  Symbol: string;
  Category: string;
}

export interface AssetSummary {
  [key: string]: string | number | { name: string; amount: number; value: number; percentage: number; }[];
  symbol: string;
  totalAmount: number;
  totalValue: number;
  price: number;
  exchanges: {
    name: string;
    amount: number;
    value: number;
    percentage: number;
  }[];
} 