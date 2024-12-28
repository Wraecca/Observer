import { 
  CoinMarketCapConfig, 
  CoinMarketCapCoin, 
  CoinMarketCapListingsResponse,
  CoinMarketCapPriceResponse 
} from '../types/coinmarketcap';

export class CoinMarketCapService {
  private readonly baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private readonly apiKey: string;
  private coinList: CoinMarketCapCoin[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor(config: CoinMarketCapConfig) {
    this.apiKey = config.apiKey;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-CMC_PRO_API_KEY': this.apiKey,
      'Accept': 'application/json'
    };

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ status: { error_message: response.statusText } }));
      throw new Error(errorData.status?.error_message || 'CoinMarketCap API request failed');
    }

    return response.json();
  }

  private async fetchCoinList(): Promise<CoinMarketCapCoin[]> {
    const currentTime = Date.now();
    
    // Return cached list if it's still valid
    if (this.coinList.length > 0 && currentTime - this.lastFetchTime < this.CACHE_DURATION) {
      return this.coinList;
    }

    try {
      // Fetch latest listings with market data
      const response = await this.makeRequest('/cryptocurrency/listings/latest?limit=1000&convert=USD') as CoinMarketCapListingsResponse;
      
      // Group coins by symbol and keep the one with highest market cap
      const coinsBySymbol = response.data.reduce((acc: { [symbol: string]: CoinMarketCapCoin }, coin) => {
        const symbol = coin.symbol.toUpperCase();
        if (!acc[symbol] || coin.quote.USD.market_cap > acc[symbol].quote.USD.market_cap) {
          acc[symbol] = coin;
        }
        return acc;
      }, {});

      this.coinList = Object.values(coinsBySymbol);
      this.lastFetchTime = currentTime;
      return this.coinList;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch coin list: ${error.message}`);
      }
      throw error;
    }
  }

  async getPricesBySymbol(symbols: string[]): Promise<CoinMarketCapPriceResponse> {
    try {
      // Get the filtered coin list
      const coinList = await this.fetchCoinList();
      const upperSymbols = symbols.map(s => s.toUpperCase());
      
      // Find all coins matching any of the symbols (case-insensitive)
      const matchingCoins = coinList.filter(coin => 
        upperSymbols.includes(coin.symbol.toUpperCase())
      );

      if (matchingCoins.length === 0) {
        return {};
      }

      // Convert current prices to the expected format
      const prices: CoinMarketCapPriceResponse = {};
      for (const coin of matchingCoins) {
        prices[coin.symbol] = {
          usd: coin.quote.USD.price,
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