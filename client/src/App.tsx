import React, { useState } from 'react';
import { Home } from './pages/Home';
import { Preview } from './pages/Preview';
import { ObserverClient } from './api/observer-client';
import { ExchangeBalances } from './types/balance';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<ExchangeBalances | null>(null);
  const client = new ObserverClient();

  const fetchBalances = async () => {
    setIsLoading(true);
    try {
      const data = await client.fetchBalances();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      alert('Failed to fetch balances: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {balances ? (
        <Preview balances={balances} />
      ) : (
        <Home onFetchBalances={fetchBalances} isLoading={isLoading} />
      )}
    </div>
  );
};
