import { BinanceService } from '../services/binance.service';
import { binanceConfig } from '../config/binance.config';
import { Balance } from '../types/balance';

describe('BinanceService Integration Tests', () => {
  let service: BinanceService;

  beforeAll(() => {
    service = new BinanceService(binanceConfig);
  });

  const checkBalanceStructure = (balance: Balance) => {
    expect(balance).toHaveProperty('amount');
    expect(balance).toHaveProperty('price');
    expect(typeof balance.amount).toBe('number');
    expect(typeof balance.price).toBe('number');
    expect(balance.amount).toBeGreaterThan(0);
  };

  describe('getSpotBalance', () => {
    it('should fetch spot balances successfully', async () => {
      try {
        const balances = await service.getSpotBalance();
        
        // Record only non-zero balances
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('Spot balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(balances).toBeDefined();
        expect(typeof balances).toBe('object');

        // Check balance structure
        for (const balance of Object.values(balances)) {
          checkBalanceStructure(balance);
        }
      } catch (error: any) {
        console.error('Error in getSpotBalance test:', error.message);
        throw error;
      }
    }, 10000);
  });

  describe('getEarnBalance', () => {
    it('should fetch earn balances successfully', async () => {
      try {
        const balances = await service.getEarnBalance();
        
        // 只記錄非零餘額
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('Earn balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(balances).toBeDefined();
        expect(typeof balances).toBe('object');

        // 檢查餘額結構
        for (const balance of Object.values(balances)) {
          checkBalanceStructure(balance);
        }
      } catch (error: any) {
        console.error('Error in getEarnBalance test:', error.message);
        throw error;
      }
    }, 10000);
  });

  describe('getAllBalances', () => {
    it('should fetch all balances successfully', async () => {
      try {
        const result = await service.getAllBalances();
        
        // 只記錄非零餘額
        const nonZeroBalances = Object.entries(result)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('All balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(result).toBeDefined();

        // 檢查餘額結構
        for (const balance of Object.values(result)) {
          checkBalanceStructure(balance);
        }

        // 檢查錯誤處理
        if (result.error) {
          checkBalanceStructure(result.error);
        }
      } catch (error: any) {
        console.error('Error in getAllBalances test:', error.message);
        throw error;
      }
    }, 10000);
  });
}); 