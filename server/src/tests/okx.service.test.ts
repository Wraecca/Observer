import { OkxService } from '../services/okx.service';
import { okxConfig } from '../config/okx.config';
import { Balance } from '../types/balance';

describe('OkxService Integration Tests', () => {
  let service: OkxService;

  beforeAll(() => {
    service = new OkxService(okxConfig);
  });

  const checkBalanceStructure = (balance: Balance) => {
    expect(balance).toHaveProperty('amount');
    expect(balance).toHaveProperty('price');
    expect(typeof balance.amount).toBe('number');
    expect(typeof balance.price).toBe('number');
    expect(balance.amount).toBeGreaterThan(0);
  };

  describe('getSpotBalance', () => {
    it('should fetch spot balances', async () => {
      const result = await service.getSpotBalance();
      
      // 只記錄非零餘額
      const nonZeroBalances = Object.entries(result)
        .filter(([_, balance]) => balance.amount > 0)
        .reduce((acc, [asset, balance]) => ({
          ...acc,
          [asset]: balance
        }), {});
      
      console.log('Spot balances:', JSON.stringify(nonZeroBalances, null, 2));
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // 檢查餘額結構
      for (const balance of Object.values(result)) {
        checkBalanceStructure(balance);
      }
    });
  });

  describe('getFundingBalance', () => {
    it('should fetch funding balances', async () => {
      const result = await service.getFundingBalance();
      
      // 只記錄非零餘額
      const nonZeroBalances = Object.entries(result)
        .filter(([_, balance]) => balance.amount > 0)
        .reduce((acc, [asset, balance]) => ({
          ...acc,
          [asset]: balance
        }), {});
      
      console.log('Funding balances:', JSON.stringify(nonZeroBalances, null, 2));
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // 檢查餘額結構
      for (const balance of Object.values(result)) {
        checkBalanceStructure(balance);
      }
    });
  });

  describe('getTradingBalance', () => {
    it('should fetch trading balances', async () => {
      const result = await service.getTradingBalance();
      
      // 只記錄非零餘額
      const nonZeroBalances = Object.entries(result)
        .filter(([_, balance]) => balance.amount > 0)
        .reduce((acc, [asset, balance]) => ({
          ...acc,
          [asset]: balance
        }), {});
      
      console.log('Trading balances:', JSON.stringify(nonZeroBalances, null, 2));
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // 檢查餘額結構
      for (const balance of Object.values(result)) {
        checkBalanceStructure(balance);
      }
    });
  });

  describe('getEarnBalance', () => {
    it('should fetch earn balances', async () => {
      const result = await service.getEarnBalance();
      
      // 只記錄非零餘額
      const nonZeroBalances = Object.entries(result)
        .filter(([_, balance]) => balance.amount > 0)
        .reduce((acc, [asset, balance]) => ({
          ...acc,
          [asset]: balance
        }), {});
      
      console.log('Earn balances:', JSON.stringify(nonZeroBalances, null, 2));
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // 檢查餘額結構
      for (const balance of Object.values(result)) {
        checkBalanceStructure(balance);
      }
    });
  });

  describe('getAllBalances', () => {
    it('should fetch all balances', async () => {
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
      expect(typeof result).toBe('object');

      // 檢查餘額結構
      for (const balance of Object.values(result)) {
        checkBalanceStructure(balance);
      }

      // 檢查錯誤處理
      if (result.error) {
        checkBalanceStructure(result.error);
      }
    });
  });
}); 