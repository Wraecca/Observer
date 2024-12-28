import { CoinGeckoCoin, CoinGeckoPriceResponse, CoinGeckoConfig } from '../types/coingecko';

export class CoinGeckoService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly apiKey?: string;
  private coinList: CoinGeckoCoin[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor(config: CoinGeckoConfig = {}) {
    this.apiKey = config.apiKey;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'accept': 'application/json'
    };

    if (this.apiKey) {
      headers['x-cg-api-key'] = this.apiKey;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || 'CoinGecko API request failed');
    }

    return response.json();
  }

  private async fetchCoinList(): Promise<CoinGeckoCoin[]> {
    const currentTime = Date.now();
    
    // Return cached list if it's still valid
    if (this.coinList.length > 0 && currentTime - this.lastFetchTime < this.CACHE_DURATION) {
      return this.coinList;
    }

    try {
      // Fetch all coins with market data, increased to 1000 coins
      const response = await this.makeRequest('/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=1000&sparkline=false');
      const allCoins = response as any[];
      
      // Group coins by symbol
      const coinsBySymbol = allCoins.reduce((acc: { [symbol: string]: CoinGeckoCoin[] }, coin: any) => {
        const symbol = coin.symbol.toLowerCase();
        if (!acc[symbol]) {
          acc[symbol] = [];
        }
        acc[symbol].push({
          id: coin.id,
          symbol: coin.symbol.toLowerCase(),
          name: coin.name,
          market_cap: coin.market_cap || 0,
          current_price: coin.current_price || 0
        });
        return acc;
      }, {});

      // For each symbol, keep only the coin with highest market cap
      this.coinList = Object.values(coinsBySymbol).map(coins => {
        const coinArray = coins as CoinGeckoCoin[];
        if (!coinArray || coinArray.length === 0) return null;
        return coinArray.reduce((highest: CoinGeckoCoin, current: CoinGeckoCoin) => 
          current.market_cap > highest.market_cap ? current : highest
        );
      }).filter((coin): coin is CoinGeckoCoin => coin !== null);

      this.lastFetchTime = currentTime;
      return this.coinList;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch coin list: ${error.message}`);
      }
      throw error;
    }
  }

  async getPricesBySymbol(symbols: string[]): Promise<CoinGeckoPriceResponse> {
    try {
      // Get the filtered coin list
      const coinList = await this.fetchCoinList();
      
      // Find all coins matching any of the symbols (case-insensitive)
      const matchingCoins = coinList.filter(coin => 
        symbols.some(symbol => coin.symbol === symbol.toLowerCase())
      );

      if (matchingCoins.length === 0) {
        return {};
      }

      // Convert current prices to the expected format
      const prices: CoinGeckoPriceResponse = {};
      for (const coin of matchingCoins) {
        prices[coin.id] = {
          usd: coin.current_price,
          symbol: coin.symbol
        };
      }

      return prices;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get prices: ${error.message}`);
      }
      throw error;
    }
  }
} 