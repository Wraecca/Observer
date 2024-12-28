import * as crypto from 'crypto';
import { Balance, Balances, AllBalances } from '../types/balance';

interface KrakenConfig {
  apiKey: string;
  apiSecret: string;
}

export class KrakenService {
  private readonly baseUrl = 'https://api.kraken.com';
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: KrakenConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  private getSignature(path: string, nonce: string, postData: string): string {
    const message = postData;
    const secret_buffer = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret_buffer);
    const hash_digest = hash.update(nonce + message).digest('binary');
    const hmac_digest = hmac.update(path + hash_digest, 'binary').digest('base64');
    return hmac_digest;
  }

  private async makeSignedRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const nonce = Date.now().toString();
    const path = `/0/${endpoint}`;
    
    const postData = new URLSearchParams({
      nonce,
      ...params
    }).toString();

    const signature = this.getSignature(path, nonce, postData);
    const headers = {
      'API-Key': this.apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: postData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: [response.statusText] }));
      throw new Error(errorData.error?.[0] || 'API request failed');
    }

    const data = await response.json();
    if (data.error && data.error.length > 0) {
      throw new Error(data.error[0]);
    }
    return data;
  }

  private parseBalance(amount: number): Balance {
    return {
      amount,
      price: 0  // Default price
    };
  }

  async getSpotBalance(): Promise<Balances> {
    try {
      const response = await this.makeSignedRequest('private/Balance');
      const balances: Balances = {};
      const result = response.result || {};

      for (const [asset, balance] of Object.entries(result)) {
        const amount = Number(balance);
        if (amount > 0) {
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

    if (!result.error) {
      delete result.error;
    }

    return result;
  }
} 