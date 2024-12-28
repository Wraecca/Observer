import { OkxService } from './okx.service';
import { BinanceService } from './binance.service';
import { BybitService } from './bybit.service';
import { KrakenService } from './kraken.service';
import { BitfinexService } from './bitfinex.service';
import { CoinGeckoService } from './coingecko.service';
import { CoinMarketCapService } from './coinmarketcap.service';
import { DebankService } from './debank.service';
import { DebankToken } from '../types/debank';
import { Balance, Balances } from '../types/balance';
import { coinmarketcapConfig } from '../config/coinmarketcap.config';
import { debankConfig } from '../config/debank.config';
import { CoinMarketCapPriceResponse } from '../types/coinmarketcap';

type AccountBalances = {
  [account: string]: Balances;
};

type ErrorInfo = {
  [account: string]: string;
};

interface ExchangeBalance {
  balances: AccountBalances;
  error?: ErrorInfo;
}

interface ExchangeBalances {
  [exchange: string]: ExchangeBalance;
}

export class ExchangeService {
  private readonly okxService?: OkxService;
  private readonly binanceService?: BinanceService;
  private readonly bybitService?: BybitService;
  private readonly krakenService?: KrakenService;
  private readonly bitfinexService?: BitfinexService;
  private readonly debankService?: DebankService;
  private readonly coinGeckoService: CoinGeckoService;
  private readonly coinMarketCapService: CoinMarketCapService;

  constructor(
    okxService?: OkxService,
    binanceService?: BinanceService,
    bybitService?: BybitService,
    krakenService?: KrakenService,
    bitfinexService?: BitfinexService
  ) {
    this.okxService = okxService;
    this.binanceService = binanceService;
    this.bybitService = bybitService;
    this.krakenService = krakenService;
    this.bitfinexService = bitfinexService;
    this.coinGeckoService = new CoinGeckoService();
    this.coinMarketCapService = new CoinMarketCapService(coinmarketcapConfig);
    
    // Initialize DeBank service only if config is available
    if (debankConfig) {
      this.debankService = new DebankService(debankConfig);
    }
  }

  private async fillPrices(balances: ExchangeBalances): Promise<void> {
    // Collect all unique symbols
    const symbols = new Set<string>();
    Object.values(balances).forEach(exchange => {
      if (!exchange) return;
      
      Object.values(exchange.balances).forEach(accountBalances => {
        Object.keys(accountBalances).forEach(symbol => symbols.add(symbol));
      });
    });

    // Convert Set to Array
    const symbolsArray = Array.from(symbols);
    console.log(`Fetching prices for ${symbolsArray.length} unique symbols`);

    // First try CoinGecko
    const geckoResults = await this.coinGeckoService.getPricesBySymbol(symbolsArray);
    const geckoFoundCount = Object.keys(geckoResults).length;
    console.log(`Found ${geckoFoundCount} prices from CoinGecko`);

    // Find symbols that don't have prices from CoinGecko
    const missingSymbols = symbolsArray.filter(symbol => {
      const matchingPrice = Object.entries(geckoResults).find(([, price]) => 
        price.symbol?.toLowerCase() === symbol.toLowerCase()
      );
      return !matchingPrice;
    });

    // If there are missing symbols, try CoinMarketCap
    let cmcResults: CoinMarketCapPriceResponse = {};
    if (missingSymbols.length > 0) {
      console.log(`Fetching prices for ${missingSymbols.length} missing symbols from CoinMarketCap`);
      cmcResults = await this.coinMarketCapService.getPricesBySymbol(missingSymbols);
      console.log(`Found ${Object.keys(cmcResults).length} prices from CoinMarketCap`);
    }

    // Fill prices in balances
    let preservedPriceCount = 0;
    Object.entries(balances).forEach(([exchangeName, exchange]) => {
      if (!exchange) return;
      
      Object.entries(exchange.balances).forEach(([accountType, accountBalances]) => {
        Object.entries(accountBalances).forEach(([symbol, balance]) => {
          if (balance && typeof balance === 'object' && 'price' in balance) {
            const originalPrice = balance.price;
            
            // First try CoinGecko
            const geckoPrice = Object.entries(geckoResults).find(([, price]) => 
              price.symbol?.toLowerCase() === symbol.toLowerCase()
            );

            if (geckoPrice) {
              (balance as Balance).price = geckoPrice[1].usd;
              return;
            }

            // If not found in CoinGecko, try CoinMarketCap
            const cmcPrice = cmcResults[symbol.toUpperCase()];
            if (cmcPrice) {
              (balance as Balance).price = cmcPrice.usd;
              return;
            }

            // If still not found, keep original price if it exists and is not 0
            if (originalPrice && originalPrice !== 0) {
              (balance as Balance).price = originalPrice;
              preservedPriceCount++;
            } else {
              (balance as Balance).price = 0;
            }
          }
        });
      });
    });

    console.log(`Price update summary:
- Total symbols: ${symbolsArray.length}
- Found in CoinGecko: ${geckoFoundCount}
- Found in CoinMarketCap: ${Object.keys(cmcResults).length}
- Preserved original prices: ${preservedPriceCount}
- Missing prices: ${symbolsArray.length - geckoFoundCount - Object.keys(cmcResults).length - preservedPriceCount}`);
  }

  private transformDebankData(debankData: { [address: string]: { tokens: DebankToken[], protocols: DebankToken[] } }): ExchangeBalances {
    const result: ExchangeBalances = {};
    let totalTokens = 0;
    let totalProtocols = 0;
    
    for (const [address, data] of Object.entries(debankData)) {
      result[address] = {
        balances: {}
      };

      // Process tokens
      for (const token of data.tokens) {
        if (!result[address].balances[token.chain]) {
          result[address].balances[token.chain] = {};
        }
        
        result[address].balances[token.chain][token.symbol] = {
          amount: token.amount,
          price: token.price
        };
        totalTokens++;
      }

      // Process protocol tokens
      for (const token of data.protocols) {
        if (!result[address].balances[token.chain]) {
          result[address].balances[token.chain] = {};
        }
        
        // If the token already exists, add the amounts
        const existingToken = result[address].balances[token.chain][token.symbol];
        if (existingToken) {
          existingToken.amount += token.amount;
        } else {
          result[address].balances[token.chain][token.symbol] = {
            amount: token.amount,
            price: token.price
          };
        }
        totalProtocols++;
      }
    }

    console.log(`Transformed ${Object.keys(debankData).length} addresses (${totalTokens} tokens, ${totalProtocols} protocols)`);
    return result;
  }

  async getAllBalances(): Promise<ExchangeBalances> {
    const result: ExchangeBalances = {};

    // OKX
    if (this.okxService) {
      try {
        result.okx = {
          balances: {
            spot: {},
            funding: {},
            trading: {},
            earn: {}
          },
        };

        // Get spot balances
        try {
          const spotBalances = await this.okxService.getSpotBalance();
          result.okx.balances.spot = spotBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.okx.error) result.okx.error = {};
            result.okx.error.spot = error.message;
          }
        }

        // Get funding balances
        try {
          const fundingBalances = await this.okxService.getFundingBalance();
          result.okx.balances.funding = fundingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.okx.error) result.okx.error = {};
            result.okx.error.funding = error.message;
          }
        }

        // Get trading balances
        try {
          const tradingBalances = await this.okxService.getTradingBalance();
          result.okx.balances.trading = tradingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.okx.error) result.okx.error = {};
            result.okx.error.trading = error.message;
          }
        }

        // Get earn balances
        try {
          const earnBalances = await this.okxService.getEarnBalance();
          result.okx.balances.earn = earnBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.okx.error) result.okx.error = {};
            result.okx.error.earn = error.message;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          result.okx = {
            balances: {
              spot: {},
              funding: {},
              trading: {},
              earn: {}
            },
            error: {
              spot: error.message
            }
          };
        }
      }
    }

    // Binance
    if (this.binanceService) {
      try {
        result.binance = {
          balances: {
            spot: {},
            funding: {},
            trading: {},
            earn: {}
          }
        };

        // Get spot balances
        try {
          const spotBalances = await this.binanceService.getSpotBalance();
          result.binance.balances.spot = spotBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.binance.error) result.binance.error = {};
            result.binance.error.spot = error.message;
          }
        }

        // Get earn balances
        try {
          const earnBalances = await this.binanceService.getEarnBalance();
          result.binance.balances.earn = earnBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.binance.error) result.binance.error = {};
            result.binance.error.earn = error.message;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          result.binance = {
            balances: {
              spot: {},
              funding: {},
              trading: {},
              earn: {}
            },
            error: {
              spot: error.message
            }
          };
        }
      }
    }

    // Bybit
    if (this.bybitService) {
      try {
        result.bybit = {
          balances: {
            spot: {},
            funding: {},
            trading: {},
            earn: {}
          }
        };

        // Get trading balances
        try {
          const tradingBalances = await this.bybitService.getTradingBalance();
          result.bybit.balances.trading = tradingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bybit.error) result.bybit.error = {};
            result.bybit.error.trading = error.message;
          }
        }

        // Get funding balances
        try {
          const fundingBalances = await this.bybitService.getFundingBalance();
          result.bybit.balances.funding = fundingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bybit.error) result.bybit.error = {};
            result.bybit.error.funding = error.message;
          }
        }

        // Get earn balances
        try {
          const earnBalances = await this.bybitService.getEarnBalance();
          result.bybit.balances.earn = earnBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bybit.error) result.bybit.error = {};
            result.bybit.error.earn = error.message;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          result.bybit = {
            balances: {
              spot: {},
              funding: {},
              trading: {},
              earn: {}
            },
            error: {
              spot: error.message
            }
          };
        }
      }
    }

    // Kraken
    if (this.krakenService) {
      try {
        result.kraken = {
          balances: {
            spot: {},
            funding: {},
            trading: {},
            earn: {}
          }
        };

        // Get spot balances
        try {
          const spotBalances = await this.krakenService.getSpotBalance();
          result.kraken.balances.spot = spotBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.kraken.error) result.kraken.error = {};
            result.kraken.error.spot = error.message;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          result.kraken = {
            balances: {
              spot: {},
              funding: {},
              trading: {},
              earn: {}
            },
            error: {
              spot: error.message
            }
          };
        }
      }
    }

    // Bitfinex
    if (this.bitfinexService) {
      try {
        result.bitfinex = {
          balances: {
            spot: {},
            funding: {},
            trading: {},
            earn: {}
          }
        };

        // Get spot balances
        try {
          const spotBalances = await this.bitfinexService.getSpotBalance();
          result.bitfinex.balances.spot = spotBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bitfinex.error) result.bitfinex.error = {};
            result.bitfinex.error.spot = error.message;
          }
        }

        // Get funding balances
        try {
          const fundingBalances = await this.bitfinexService.getFundingBalance();
          result.bitfinex.balances.funding = fundingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bitfinex.error) result.bitfinex.error = {};
            result.bitfinex.error.funding = error.message;
          }
        }

        // Get trading balances
        try {
          const tradingBalances = await this.bitfinexService.getTradingBalance();
          result.bitfinex.balances.trading = tradingBalances;
        } catch (error) {
          if (error instanceof Error) {
            if (!result.bitfinex.error) result.bitfinex.error = {};
            result.bitfinex.error.trading = error.message;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          result.bitfinex = {
            balances: {
              spot: {},
              funding: {},
              trading: {},
              earn: {}
            },
            error: {
              spot: error.message
            }
          };
        }
      }
    }

    // Add DeBank fetching at the end
    if (this.debankService) {
      try {
        const debankData = await this.debankService.getAllWalletsData();
        const transformedDebankData = this.transformDebankData(debankData);
        
        // Merge the transformed DeBank data into the result
        Object.assign(result, transformedDebankData);
      } catch (error) {
        console.error('Error fetching DeBank data:', error);
      }
    }

    // Fill prices for all balances
    await this.fillPrices(result);

    return result;
  }
} 