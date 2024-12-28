import * as crypto from 'crypto';
import { Balance, Balances, AllBalances } from '../types/balance';

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

export class BinanceService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: BinanceConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://api.binance.com';
  }

  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  private async makeSignedRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });

    const signature = this.generateSignature(queryParams.toString());
    queryParams.append('signature', signature);

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Request failed');
    }

    return response.json();
  }

  private parseBalance(amount: number): Balance {
    return {
      amount,
      price: 0  // Default price
    };
  }

  async getSpotBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('/api/v3/account');
      const balances: Balances = {};

      for (const balance of response.balances) {
        const total = Number(balance.free) + Number(balance.locked);
        if (total > 0) {
          balances[balance.asset] = this.parseBalance(total);
        }
      }

      return balances;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Spot balance error: ${error.message}`);
      }
      throw error;
    }
  }

  async getEarnBalance(): Promise<Balances> {
    try {
      const [flexibleResponse, lockedResponse] = await Promise.all([
        this.makeSignedRequest('/sapi/v1/simple-earn/flexible/position'),
        this.makeSignedRequest('/sapi/v1/simple-earn/locked/position')
      ]);

      const balances: Balances = {};

      // Process flexible positions
      for (const position of flexibleResponse.rows || []) {
        const asset = position.asset;
        const total = parseFloat(position.totalAmount);

        if (total > 0) {
          if (balances[asset]) {
            balances[asset].amount += total;
          } else {
            balances[asset] = this.parseBalance(total);
          }
        }
      }

      // Process locked positions
      for (const position of lockedResponse.rows || []) {
        const asset = position.asset;
        const total = parseFloat(position.totalAmount);

        if (total > 0) {
          if (balances[asset]) {
            balances[asset].amount += total;
          } else {
            balances[asset] = this.parseBalance(total);
          }
        }
      }

      return balances;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Earn balance error: ${error.message}`);
      }
      throw error;
    }
  }

  async getAllBalances(): Promise<Balances> {
    const result: Balances = {};

    try {
      const spotBalances = await this.getSpotBalance();
      Object.assign(result, spotBalances);
    } catch (error) {
      if (error instanceof Error) {
        result.error = this.parseBalance(0);
      }
    }

    try {
      const earnBalances = await this.getEarnBalance();
      Object.assign(result, earnBalances);
    } catch (error) {
      if (error instanceof Error) {
        result.error = this.parseBalance(0);
      }
    }

    if (!result.error) {
      delete result.error;
    }

    return result;
  }
} 