import * as crypto from 'crypto';
import { Balance, Balances } from '../types/balance';

interface BybitConfig {
  apiKey: string;
  apiSecret: string;
}

export class BybitService {
  private readonly baseUrl = 'https://api.bybit.com';
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: BybitConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  private getSignature(timestamp: string, params: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(timestamp + this.apiKey + params)
      .digest('hex');
  }

  private async makeSignedRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now().toString();
    const queryString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const signature = this.getSignature(timestamp, queryString);
    const headers = {
      'X-BAPI-API-KEY': this.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
    };

    const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.retMsg || errorData.message || 'API request failed');
    }

    const data = await response.json();
    return data;
  }

  private parseBalance(amount: number): Balance {
    return {
      amount,
      price: 0  // Default price
    };
  }

  async getFundingBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('/v5/asset/transfer/query-account-coins-balance', {
        accountType: 'FUND',
      });

      const balances: Balances = {};
      const coins = response.result.balance || [];

      for (const coin of coins) {
        const amount = Number(coin.walletBalance);
        if (amount > 0) {
          balances[coin.coin] = this.parseBalance(amount);
        }
      }

      return balances;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Funding balance error: ${error.message}`);
      }
      throw error;
    }
  }

  async getEarnBalance(): Promise<Balances> {
    return {};
  }

  async getTradingBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('/v5/account/wallet-balance', {
        accountType: 'UNIFIED',
      });

      const balances: Balances = {};
      const coins = response.result.list[0]?.coin || [];

      for (const coin of coins) {
        const amount = Number(coin.walletBalance);
        if (amount > 0) {
          balances[coin.coin] = this.parseBalance(amount);
        }
      }

      return balances;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Trading balance error: ${error.message}`);
      }
      throw error;
    }
  }

  async getAllBalances(): Promise<Balances> {
    const result: Balances = {};

    try {
      const tradingBalances = await this.getTradingBalance();
      Object.assign(result, tradingBalances);
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

    try {
      const fundingBalances = await this.getFundingBalance();
      Object.assign(result, fundingBalances);
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