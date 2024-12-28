declare module 'ccxt' {
  export class Exchange {
    constructor(config: any);
    fetchBalance(): Promise<{
      total: { [key: string]: number };
      free: { [key: string]: number };
      used: { [key: string]: number };
    }>;
  }

  export class binance extends Exchange {}
  export class coinbase extends Exchange {}
  export class kraken extends Exchange {}
  export class okx extends Exchange {}
  export class bitfinex extends Exchange {}
  export class bybit extends Exchange {}
} 