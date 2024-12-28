export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface SpotAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: SpotBalance[];
  permissions: string[];
}

export interface FuturesBalance {
  accountAlias: string;
  asset: string;
  balance: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable: boolean;
  updateTime: number;
}

export interface FuturesAccountInfo {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  updateTime: number;
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  totalCrossWalletBalance: string;
  totalCrossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets: FuturesBalance[];
}

export interface SimpleEarnFlexibleProduct {
  asset: string;
  totalAmount: string;
  freeAmount: string;
  lockedAmount: string;
  rewardAsset: string;
  totalRewards: string;
  yesterdayRewards: string;
  estimatedAnnualRewards: string;
  nextPayout: string;
  nextPayoutDate: string;
  minPurchaseAmount: string;
  productId: string;
  canRedeem: boolean;
}

export interface SimpleEarnLockedProduct {
  asset: string;
  totalAmount: string;
  rewardAsset: string;
  totalRewards: string;
  yesterdayRewards: string;
  estimatedAnnualRewards: string;
  nextPayout: string;
  nextPayoutDate: string;
  projectId: string;
  duration: string;
  accrualDays: string;
  rewardEndDate: string;
  canRedeem: boolean;
}

export interface SimpleEarnResponse<T> {
  rows: T[];
  total: number;
}

export interface Balance {
  [asset: string]: {
    free: number;
    locked: number;
    total: number;
  };
}

export interface CombinedBalance {
  spot: Balance;
  futures: Balance;
  earn: Balance;
  error?: {
    spot?: string;
    futures?: string;
    earn?: string;
  };
} 