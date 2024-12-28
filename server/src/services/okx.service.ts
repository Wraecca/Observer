import * as crypto from 'crypto';
import { Balance, Balances } from '../types/balance';

interface OkxConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  baseUrl?: string;
}

export class OkxService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly passphrase: string;

  constructor(config: OkxConfig) {
    this.baseUrl = config.baseUrl || 'https://www.okx.com';
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.passphrase = config.passphrase;
  }

  private getSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = timestamp + method + path + body;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('base64');
  }

  private async makeRequest(method: string, path: string, body: any = null): Promise<any> {
    const timestamp = new Date().toISOString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.getSignature(timestamp, method, path, bodyStr);

    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json'
    };

    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined
    });

    const text = await response.text();

    if (!response.ok) {
      let message;
      try {
        const error = JSON.parse(text);
        message = error.msg || response.statusText;
      } catch {
        message = text || response.statusText;
      }
      throw new Error(message);
    }

    try {
      const data = JSON.parse(text);
      if (data.code !== '0') {
        throw new Error(data.msg || 'API request failed');
      }
      return data;
    } catch {
      throw new Error('Invalid JSON response');
    }
  }

  private parseBalance(amount: number): Balance {
    return {
      amount,
      price: 0  // Default price
    };
  }

  async getSpotBalance(): Promise<Balances> {
    const response = await this.makeRequest('GET', '/api/v5/account/balance');
    const balances: Balances = {};

    if (response.data && response.data[0] && response.data[0].details) {
      for (const detail of response.data[0].details) {
        const total = parseFloat(detail.availBal) + parseFloat(detail.frozenBal);
        if (total > 0) {
          balances[detail.ccy] = this.parseBalance(total);
        }
      }
    }

    return balances;
  }

  async getFundingBalance(): Promise<Balances> {
    const response = await this.makeRequest('GET', '/api/v5/asset/balances');
    const balances: Balances = {};

    if (response.data) {
      for (const balance of response.data) {
        const total = parseFloat(balance.availBal) + parseFloat(balance.frozenBal);
        if (total > 0) {
          balances[balance.ccy] = this.parseBalance(total);
        }
      }
    }

    return balances;
  }

  async getTradingBalance(): Promise<Balances> {
    const response = await this.makeRequest('GET', '/api/v5/account/positions');
    const balances: Balances = {};

    if (response.data) {
      for (const position of response.data) {
        const asset = position.ccy || position.instId.split('-')[0];
        const total = parseFloat(position.pos);

        if (total > 0) {
          if (balances[asset]) {
            balances[asset].amount += total;
          } else {
            balances[asset] = this.parseBalance(total);
          }
        }
      }
    }

    return balances;
  }

  async getEarnBalance(): Promise<Balances> {
    // 獲取所有質押和理財產品
    const [stakingResponse, savingsResponse] = await Promise.all([
      this.makeRequest('GET', '/api/v5/finance/staking-defi/orders-active'),
      this.makeRequest('GET', '/api/v5/finance/savings/balance')
    ]);

    const balances: Balances = {};

    // 處理質押訂單
    if (stakingResponse.data) {
      for (const order of stakingResponse.data) {
        const asset = order.ccy;
        const total = parseFloat(order.investAmt || '0');

        if (total > 0) {
          if (balances[asset]) {
            balances[asset].amount += total;
          } else {
            balances[asset] = this.parseBalance(total);
          }
        }
      }
    }

    // 處理理財餘額
    if (savingsResponse.data) {
      for (const balance of savingsResponse.data) {
        const asset = balance.ccy;
        const total = parseFloat(balance.amt || '0');

        if (total > 0) {
          if (balances[asset]) {
            balances[asset].amount += total;
          } else {
            balances[asset] = this.parseBalance(total);
          }
        }
      }
    }

    return balances;
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