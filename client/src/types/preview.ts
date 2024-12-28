export interface Asset {
  id: string;
  symbol: string;
  type: string;
  amount: number;
  price: number;
  priceStr: string;
  value: number;
}

export interface ExchangeSummary {
  name: string;
  totalValue: number;
  assets: Asset[];
}

export interface NewAsset {
  symbol: string;
  type: string;
  amount: string;
  price: string;
}

export type SortField = 'symbol' | 'type' | 'amount' | 'price' | 'value';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export const DEFAULT_ASSET: NewAsset = {
  symbol: '',
  type: 'spot',
  amount: '',
  price: '',
}; 