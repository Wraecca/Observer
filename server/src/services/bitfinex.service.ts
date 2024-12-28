import * as crypto from 'crypto';
import { Balance, Balances } from '../types/balance';

interface BitfinexConfig {
  apiKey: string;
  apiSecret: string;
}

export class BitfinexService {
  private readonly baseUrl = 'https://api.bitfinex.com';
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: BitfinexConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  private getSignature(path: string, nonce: string, body: string): string {
    const message = `/api${path}${nonce}${body}`;
    return crypto
      .createHmac('sha384', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  private async makeSignedRequest(endpoint: string, body: any = {}): Promise<any> {
    const nonce = Date.now().toString();
    const path = `/v2${endpoint}`;
    const bodyString = JSON.stringify(body);

    const signature = this.getSignature(path, nonce, bodyString);
    const headers = {
      'bfx-nonce': nonce,
      'bfx-apikey': this.apiKey,
      'bfx-signature': signature,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: bodyString
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'API request failed');
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
      const response = await this.makeSignedRequest('/auth/r/wallets');
      const balances: Balances = {};

      // Bitfinex wallet types: "exchange" (spot), "margin" (trading), "funding"
      for (const wallet of response) {
        const [type, currency, balance] = wallet;
        const amount = Number(balance);
        if (type === 'exchange' && amount > 0) {
          const asset = currency.toUpperCase();
          balances[asset] = this.parseBalance(amount);
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

  async getFundingBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('/auth/r/wallets');
      const balances: Balances = {};

      for (const wallet of response) {
        const [type, currency, balance] = wallet;
        const amount = Number(balance);
        if (type === 'funding' && amount > 0) {
          const asset = currency.toUpperCase();
          balances[asset] = this.parseBalance(amount);
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

  async getTradingBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('/auth/r/wallets');
      const balances: Balances = {};

      for (const wallet of response) {
        const [type, currency, balance] = wallet;
        const amount = Number(balance);
        if (type === 'margin' && amount > 0) {
          const asset = currency.toUpperCase();
          balances[asset] = this.parseBalance(amount);
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
      const spotBalances = await this.getSpotBalance();
      Object.assign(result, spotBalances);
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

    try {
      const tradingBalances = await this.getTradingBalance();
      Object.assign(result, tradingBalances);
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