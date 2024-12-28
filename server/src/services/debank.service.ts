import { DebankConfig, DebankToken, DebankProtocol } from '../types/debank';

export class DebankService {
  private readonly baseUrl = 'https://pro-openapi.debank.com';
  private readonly apiKey: string;
  private readonly walletList: string[];
  private readonly chainIds: string[];

  constructor(config: DebankConfig) {
    this.apiKey = config.apiKey;
    this.walletList = config.walletList;
    this.chainIds = config.chainIds;
    console.log('Initializing DebankService with:', {
      walletList: this.walletList.length,
      chainIds: this.chainIds
    });
  }

  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'AccessKey': this.apiKey,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed: ${response.status}`, errorText);
        throw new Error(errorText || response.statusText);
      }

      return response.json();
    } catch (error) {
      console.error('Request failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getTokenList(address: string): Promise<DebankToken[]> {
    try {
      const allTokens: DebankToken[] = [];

      for (const chainId of this.chainIds) {
        const response = await this.makeRequest(`/v1/user/token_list?id=${address}&chain_id=${chainId}&is_all=false`);
        const tokens = response.map((token: any) => ({
          chain: token.chain,
          symbol: token.symbol,
          price: token.price,
          amount: token.amount
        }));
        allTokens.push(...tokens);
      }

      console.log(`Found ${allTokens.length} tokens for address ${address.slice(0, 6)}...`);
      return allTokens;
    } catch (error) {
      console.error(`Token list error for address ${address.slice(0, 6)}...`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getProtocolList(address: string): Promise<DebankToken[]> {
    try {
      const allTokens: DebankToken[] = [];

      for (const chainId of this.chainIds) {
        const response = await this.makeRequest(`/v1/user/complex_protocol_list?id=${address}&chain_id=${chainId}`);
        
        if (!Array.isArray(response)) {
          console.warn(`Unexpected response format for chain ${chainId}`);
          continue;
        }

        for (const protocol of response as DebankProtocol[]) {
          if (!protocol.portfolio_item_list) continue;

          for (const item of protocol.portfolio_item_list) {
            if (item.detail?.supply_token_list) {
              for (const token of item.detail.supply_token_list) {
                if (token.amount > 0) {
                  allTokens.push({
                    chain: token.chain,
                    symbol: token.symbol,
                    price: token.price,
                    amount: token.amount
                  });
                }
              }
            }
          }
        }
      }

      console.log(`Found ${allTokens.length} protocol tokens for address ${address.slice(0, 6)}...`);
      return allTokens;
    } catch (error) {
      console.error(`Protocol list error for address ${address.slice(0, 6)}...`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getAllWalletsData(): Promise<{ [address: string]: { tokens: DebankToken[], protocols: DebankToken[] } }> {
    const result: { [address: string]: { tokens: DebankToken[], protocols: DebankToken[] } } = {};

    for (const address of this.walletList) {
      try {
        const [tokens, protocols] = await Promise.all([
          this.getTokenList(address),
          this.getProtocolList(address)
        ]);

        result[address] = { tokens, protocols };
        console.log(`Processed wallet ${address.slice(0, 6)}... (${tokens.length} tokens, ${protocols.length} protocols)`);
      } catch (error) {
        console.error(`Error processing wallet ${address.slice(0, 6)}...`, error instanceof Error ? error.message : 'Unknown error');
        result[address] = { tokens: [], protocols: [] };
      }
    }

    return result;
  }
} 