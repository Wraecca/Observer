import { BybitService } from '../services/bybit.service';
import { bybitConfig } from '../config/bybit.config';
import { Balance } from '../types/balance';

describe('BybitService Integration Tests', () => {
  let service: BybitService;

  beforeAll(() => {
    service = new BybitService(bybitConfig);
  });

  const checkBalanceStructure = (balance: Balance) => {
    expect(balance).toHaveProperty('amount');
    expect(balance).toHaveProperty('price');
    expect(typeof balance.amount).toBe('number');
    expect(typeof balance.price).toBe('number');
    expect(balance.amount).toBeGreaterThan(0);
  };

  describe('getTradingBalance', () => {
    it('should fetch unified account balances', async () => {
      try {
        const balances = await service.getTradingBalance();
        
        // Record only non-zero balances
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('Trading balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(balances).toBeDefined();
        expect(typeof balances).toBe('object');

        // Check balance structure
        for (const balance of Object.values(balances)) {
          checkBalanceStructure(balance);
        }
      } catch (error: any) {
        console.error('Error in getTradingBalance test:', error.message);
        throw error;
      }
    }, 10000);
  });

  describe('getAllBalances', () => {
    it('should fetch all balances', async () => {
      try {
        const result = await service.getAllBalances();
        
        // Record only non-zero balances
        const nonZeroBalances = Object.entries(result)
          .filter(([_, balance]) => balance.amount > 0)
          .reduce((acc, [asset, balance]) => ({
            ...acc,
            [asset]: balance
          }), {});
        
        console.log('All balances:', JSON.stringify(nonZeroBalances, null, 2));
        
        expect(result).toBeDefined();

        // Check balance structure
        for (const balance of Object.values(result)) {
          checkBalanceStructure(balance);
        }

        // Check error handling
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