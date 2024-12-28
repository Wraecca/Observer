import { ExchangeBalances } from '../types/balance';
import { SnapshotData, AssetData } from '../types/snapshot';

export class ObserverClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Balance API
  async fetchBalances(): Promise<ExchangeBalances> {
    return this.request<ExchangeBalances>('/api/balance');
  }

  // Snapshot API
  async listSnapshots(): Promise<string[]> {
    return this.request<string[]>('/api/snapshot/list');
  }

  async getLatestSnapshot(): Promise<SnapshotData[]> {
    return this.request<SnapshotData[]>('/api/snapshot/latest');
  }

  async getSnapshot(filename: string): Promise<SnapshotData[]> {
    return this.request<SnapshotData[]>(`/api/snapshot/${encodeURIComponent(filename)}`);
  }

  async getTradefiData(): Promise<SnapshotData[]> {
    return this.request<SnapshotData[]>('/api/tradefi');
  }

  async checkFileExists(filename: string): Promise<{ exists: boolean }> {
    return this.request<{ exists: boolean }>(
      `/api/snapshot/check?filename=${encodeURIComponent(filename)}`
    );
  }

  async saveSnapshot(filename: string, data: string, overwrite: boolean = false): Promise<{ success: boolean; path: string }> {
    return this.request<{ success: boolean; path: string }>('/api/snapshot/save', {
      method: 'POST',
      body: JSON.stringify({ filename, data, overwrite }),
    });
  }

  // Asset API
  async getAssetData(): Promise<AssetData[]> {
    return this.request<AssetData[]>('/api/asset');
  }

  async saveAssetData(data: AssetData[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/asset/save', {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }
} 