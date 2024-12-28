import { KrakenService } from '../services/kraken.service';
import { krakenConfig } from '../config/kraken.config';
import { Balance } from '../types/balance';

describe('KrakenService Integration Tests', () => {
  let service: KrakenService;

  beforeAll(() => {
    service = new KrakenService(krakenConfig);
  });

  const checkBalanceStructure = (balance: Balance) => {
    expect(balance).toHaveProperty('amount');
    expect(balance).toHaveProperty('price');
    expect(typeof balance.amount).toBe('number');
    expect(typeof balance.price).toBe('number');
    expect(balance.amount).toBeGreaterThan(0);
  };

  describe('getSpotBalance', () => {
    it('should fetch spot balance successfully', async () => {
      try {
        const balances = await service.getSpotBalance();
        
        // 只記錄非零餘額
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('Spot balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(balances).toBeDefined();
        expect(typeof balances).toBe('object');

        // 檢查餘額結構
        for (const balance of Object.values(balances)) {
          checkBalanceStructure(balance);
        }
      } catch (error: any) {
        console.error('Error in getSpotBalance test:', error.message);
        throw error;
      }
    });
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
    });
  });
}); 