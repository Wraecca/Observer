import { DebankService } from '../services/debank.service';
import { DebankConfig } from '../types/debank';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DebankService Unit Tests', () => {
  let service: DebankService;
  const mockConfig: DebankConfig = {
    apiKey: 'test-api-key',
    walletList: ['0xwallet1', '0xwallet2'],
    chainIds: ['eth', 'bsc']
  };

  beforeEach(() => {
    service = new DebankService(mockConfig);
    mockFetch.mockClear();
  });

  describe('getTokenList', () => {
    const mockTokenResponse = [
      {
        chain: 'eth',
        symbol: 'ETH',
        price: 2000,
        amount: 1.5
      }
    ];

    it('should fetch and format token list correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockTokenResponse)),
        json: () => Promise.resolve(mockTokenResponse),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.getTokenList('0xwallet1');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://pro-openapi.debank.com/v1/user/token_list?id=0xwallet1&chain_id=eth&is_all=false',
        expect.objectContaining({
          headers: {
            'AccessKey': 'test-api-key',
            'accept': 'application/json'
          }
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://pro-openapi.debank.com/v1/user/token_list?id=0xwallet1&chain_id=bsc&is_all=false',
        expect.objectContaining({
          headers: {
            'AccessKey': 'test-api-key',
            'accept': 'application/json'
          }
        })
      );

      expect(result).toEqual([...mockTokenResponse, ...mockTokenResponse]);
    });

    it('should handle API error correctly', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'API Error' })),
        json: () => Promise.resolve({ message: 'API Error' }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      mockFetch.mockResolvedValueOnce(errorResponse);

      await expect(service.getTokenList('0xwallet1'))
        .rejects
        .toThrow('Token list error: API Error');
    });
  });

  describe('getProtocolList', () => {
    const mockProtocolResponse = [
      {
        portfolio_item_list: [
          {
            detail: {
              supply_token_list: [
                {
                  chain: 'eth',
                  symbol: 'USDC',
                  price: 1,
                  amount: 1000
                }
              ]
            }
          }
        ]
      }
    ];

    it('should fetch and format protocol list correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockProtocolResponse)),
        json: () => Promise.resolve(mockProtocolResponse),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.getProtocolList('0xwallet1');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://pro-openapi.debank.com/v1/user/complex_protocol_list?id=0xwallet1&chain_id=eth',
        expect.objectContaining({
          headers: {
            'AccessKey': 'test-api-key',
            'accept': 'application/json'
          }
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://pro-openapi.debank.com/v1/user/complex_protocol_list?id=0xwallet1&chain_id=bsc',
        expect.objectContaining({
          headers: {
            'AccessKey': 'test-api-key',
            'accept': 'application/json'
          }
        })
      );

      expect(result).toEqual([
        {
          chain: 'eth',
          symbol: 'USDC',
          price: 1,
          amount: 1000
        },
        {
          chain: 'eth',
          symbol: 'USDC',
          price: 1,
          amount: 1000
        }
      ]);
    });

    it('should handle API error correctly', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'API Error' })),
        json: () => Promise.resolve({ message: 'API Error' }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      mockFetch.mockResolvedValueOnce(errorResponse);

      await expect(service.getProtocolList('0xwallet1'))
        .rejects
        .toThrow('Protocol list error: API Error');
    });
  });

  describe('getAllWalletsData', () => {
    const mockTokenResponse = [
      {
        chain: 'eth',
        symbol: 'ETH',
        price: 2000,
        amount: 1.5
      }
    ];

    const mockProtocolResponse = [
      {
        portfolio_item_list: [
          {
            detail: {
              supply_token_list: [
                {
                  chain: 'eth',
                  symbol: 'USDC',
                  price: 1,
                  amount: 1000
                }
              ]
            }
          }
        ]
      }
    ];

    it('should fetch data for all wallets and chains correctly', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockTokenResponse)),
        json: () => Promise.resolve(mockTokenResponse),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      const mockProtocolResp = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockProtocolResponse)),
        json: () => Promise.resolve(mockProtocolResponse),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      // Mock responses for both wallets and both chains
      mockFetch
        // wallet1 eth chain token and protocol
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockProtocolResp)
        // wallet1 bsc chain token and protocol
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockProtocolResp)
        // wallet2 eth chain token and protocol
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockProtocolResp)
        // wallet2 bsc chain token and protocol
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockProtocolResp);

      const result = await service.getAllWalletsData();

      // Each wallet makes 2 requests (token + protocol) for each chain
      expect(mockFetch).toHaveBeenCalledTimes(8);
      
      const expectedTokens = [...mockTokenResponse, ...mockTokenResponse];
      const expectedProtocols = [
        {
          chain: 'eth',
          symbol: 'USDC',
          price: 1,
          amount: 1000
        },
        {
          chain: 'eth',
          symbol: 'USDC',
          price: 1,
          amount: 1000
        }
      ];

      expect(result).toEqual({
        '0xwallet1': {
          tokens: expectedTokens,
          protocols: expectedProtocols
        },
        '0xwallet2': {
          tokens: expectedTokens,
          protocols: expectedProtocols
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'API Error' })),
        json: () => Promise.resolve({ message: 'API Error' }),
        headers: new Headers({
          'content-type': 'application/json'
        })
      };

      mockFetch.mockResolvedValueOnce(errorResponse);

      const result = await service.getAllWalletsData();

      expect(result).toEqual({
        '0xwallet1': {
          tokens: [],
          protocols: []
        },
        '0xwallet2': {
          tokens: [],
          protocols: []
        }
      });
    });
  });
}); 