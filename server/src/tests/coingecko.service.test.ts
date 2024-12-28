import { CoinGeckoService } from '../services/coingecko.service';
import { CoinGeckoCoin } from '../types/coingecko';

describe('CoinGeckoService', () => {
  let service: CoinGeckoService;
  let mockFetch: jest.Mock;

  const mockCoinsResponse: CoinGeckoCoin[] = [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      market_cap: 800000000000,
      current_price: 42000
    },
    {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      market_cap: 260000000000,
      current_price: 2200
    },
    {
      id: 'tether',
      symbol: 'usdt',
      name: 'Tether',
      market_cap: 90000000000,
      current_price: 1
    },
    {
      id: 'binancecoin',
      symbol: 'bnb',
      name: 'BNB',
      market_cap: 45000000000,
      current_price: 300
    },
    {
      id: 'matic-network',
      symbol: 'matic',
      name: 'Polygon',
      market_cap: 8000000000,
      current_price: 0.8
    }
  ];

  beforeEach(() => {
    // Mock the global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Create service instance
    service = new CoinGeckoService();

    // Setup default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCoinsResponse)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch prices for BTC and ETH', async () => {
    const prices = await service.getPricesBySymbol(['BTC', 'ETH']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toBeDefined();
    expect(Object.keys(prices).length).toBe(2);
    
    expect(prices['bitcoin'].usd).toBe(42000);
    expect(prices['ethereum'].usd).toBe(2200);
    expect(prices['bitcoin'].symbol).toBe('btc');
    expect(prices['ethereum'].symbol).toBe('eth');
  });

  it('should handle case-insensitive symbol matching', async () => {
    const prices = await service.getPricesBySymbol(['btc']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toBeDefined();
    expect(Object.keys(prices).length).toBe(1);
    expect(prices['bitcoin'].usd).toBe(42000);
    expect(prices['bitcoin'].symbol).toBe('btc');
  });

  it('should return empty object for non-existent symbol', async () => {
    const prices = await service.getPricesBySymbol(['NONEXISTENT']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toEqual({});
  });

  it('should return highest market cap coin for each symbol', async () => {
    // Add a second USDT token with lower market cap
    const responseWithMultipleUsdt = [
      ...mockCoinsResponse,
      {
        id: 'tether-bsc',
        symbol: 'usdt',
        name: 'Tether BSC',
        market_cap: 1000000,
        current_price: 1
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithMultipleUsdt)
    });

    const prices = await service.getPricesBySymbol(['USDT']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toBeDefined();
    expect(Object.keys(prices).length).toBe(1);
    expect(prices['tether'].usd).toBe(1);
    expect(prices['tether'].symbol).toBe('usdt');
  });

  it('should cache coin list for subsequent calls', async () => {
    // Make two calls
    await service.getPricesBySymbol(['BTC']);
    await service.getPricesBySymbol(['ETH']);
    
    // Should only fetch once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'API rate limit exceeded' })
    });

    await expect(service.getPricesBySymbol(['BTC'])).rejects.toThrow('Failed to get prices: Failed to fetch coin list: API rate limit exceeded');
  });

  it('should fetch prices for specific tokens', async () => {
    const symbols = [
      'ACX', 'BNB', 'CRV', 'FLUID', 'GRASS', 'MORPHO',
      'PERP', 'STX', 'TON', 'USDC', 'USDT', 'VELODROME'
    ];

    const prices = await service.getPricesBySymbol(symbols);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices['binancecoin']).toBeDefined();
    expect(prices['binancecoin'].usd).toBe(300);
    expect(prices['tether']).toBeDefined();
    expect(prices['tether'].usd).toBe(1);
  });
}); 