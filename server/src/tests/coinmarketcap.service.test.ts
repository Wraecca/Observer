import { CoinMarketCapService } from '../services/coinmarketcap.service';
import { CoinMarketCapListingsResponse } from '../types/coinmarketcap';

describe('CoinMarketCapService', () => {
  let service: CoinMarketCapService;
  let mockFetch: jest.Mock;

  const mockListingsResponse: CoinMarketCapListingsResponse = {
    data: [
      {
        id: 1,
        name: 'Bitcoin',
        symbol: 'BTC',
        cmc_rank: 1,
        quote: {
          USD: {
            price: 42000,
            market_cap: 800000000000
          }
        }
      },
      {
        id: 1027,
        name: 'Ethereum',
        symbol: 'ETH',
        cmc_rank: 2,
        quote: {
          USD: {
            price: 2200,
            market_cap: 260000000000
          }
        }
      },
      {
        id: 825,
        name: 'Tether',
        symbol: 'USDT',
        cmc_rank: 3,
        quote: {
          USD: {
            price: 1,
            market_cap: 90000000000
          }
        }
      },
      {
        id: 1839,
        name: 'BNB',
        symbol: 'BNB',
        cmc_rank: 4,
        quote: {
          USD: {
            price: 300,
            market_cap: 45000000000
          }
        }
      },
      {
        id: 3890,
        name: 'Polygon',
        symbol: 'MATIC',
        cmc_rank: 10,
        quote: {
          USD: {
            price: 0.8,
            market_cap: 8000000000
          }
        }
      }
    ],
    status: {
      timestamp: '2024-01-01T00:00:00.000Z',
      error_code: 0,
      error_message: null
    }
  };

  beforeEach(() => {
    // Mock the global fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Create service with empty API key (not needed for unit tests)
    service = new CoinMarketCapService({ apiKey: 'dummy-key' });

    // Setup default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockListingsResponse)
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
    
    expect(prices['BTC'].usd).toBe(42000);
    expect(prices['ETH'].usd).toBe(2200);
  });

  it('should handle case-insensitive symbol matching', async () => {
    const prices = await service.getPricesBySymbol(['btc']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toBeDefined();
    expect(Object.keys(prices).length).toBe(1);
    expect(prices['BTC'].usd).toBe(42000);
  });

  it('should return empty object for non-existent symbol', async () => {
    const prices = await service.getPricesBySymbol(['NONEXISTENT']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toEqual({});
  });

  it('should return highest market cap coin for each symbol', async () => {
    // Add a second USDT token with lower market cap
    const responseWithMultipleUsdt = {
      ...mockListingsResponse,
      data: [
        ...mockListingsResponse.data,
        {
          id: 999,
          name: 'Tether BSC',
          symbol: 'USDT',
          cmc_rank: 999,
          quote: {
            USD: {
              price: 1,
              market_cap: 1000000 // Much lower market cap
            }
          }
        }
      ]
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseWithMultipleUsdt)
    });

    const prices = await service.getPricesBySymbol(['USDT']);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices).toBeDefined();
    expect(Object.keys(prices).length).toBe(1);
    expect(prices['USDT'].usd).toBe(1);
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
      json: () => Promise.resolve({
        status: {
          error_message: 'API rate limit exceeded'
        }
      })
    });

    await expect(service.getPricesBySymbol(['BTC'])).rejects.toThrow('API rate limit exceeded');
  });

  it('should fetch prices for specific tokens', async () => {
    const symbols = [
      'ACX', 'BNB', 'CRV', 'FLUID', 'GRASS', 'MORPHO',
      'PERP', 'STX', 'TON', 'USDC', 'USDT', 'VELODROME'
    ];

    const prices = await service.getPricesBySymbol(symbols);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(prices['BNB']).toBeDefined();
    expect(prices['BNB'].usd).toBe(300);
    expect(prices['USDT']).toBeDefined();
    expect(prices['USDT'].usd).toBe(1);
  });
}); 