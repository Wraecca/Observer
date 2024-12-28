import React, { useState, useEffect } from 'react';
import { ObserverClient } from '../api/observer-client';
import { ExchangeBalances } from '../types/balance';
import { ExchangeSummary, NewAsset, SortField, SortDirection, DEFAULT_ASSET } from '../types/preview';
import { sortAssets } from '../utils/preview';
import { ExchangeHeader } from '../components/preview/ExchangeHeader';
import { AssetTableHeader } from '../components/preview/AssetTableHeader';
import { AssetRow } from '../components/preview/AssetRow';
import { NewAssetRow } from '../components/preview/NewAssetRow';
import { NewExchangeModal } from '../components/preview/NewExchangeModal';
import './Preview.css';

interface PreviewProps {
  balances: ExchangeBalances;
}

export const Preview: React.FC<PreviewProps> = ({ balances }) => {
  const [filename, setFilename] = useState(new Date().toISOString().split('T')[0]);
  const [newAssets, setNewAssets] = useState<Record<string, NewAsset>>({});
  const [newExchangeName, setNewExchangeName] = useState('');
  const [showNewExchangeForm, setShowNewExchangeForm] = useState(false);
  const [exchangeSummaries, setExchangeSummaries] = useState<ExchangeSummary[]>([]);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'symbol',
    direction: 'asc'
  });

  const client = new ObserverClient();

  // Handle sort
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Delete asset
  const deleteAsset = (exchangeName: string, assetId: string) => {
    setExchangeSummaries(prev => {
      const updated = [...prev];
      const exchangeIndex = updated.findIndex(e => e.name === exchangeName);
      if (exchangeIndex === -1) return prev;

      const exchange = { ...updated[exchangeIndex] };
      const assetIndex = exchange.assets.findIndex(a => a.id === assetId);
      if (assetIndex === -1) return prev;

      const asset = exchange.assets[assetIndex];
      exchange.totalValue -= asset.value;
      exchange.assets = exchange.assets.filter(a => a.id !== assetId);
      updated[exchangeIndex] = exchange;

      return updated;
    });
  };

  // Update form for new asset
  const updateNewAsset = (exchange: string, field: keyof NewAsset, value: string) => {
    setNewAssets(prev => ({
      ...prev,
      [exchange]: {
        ...prev[exchange] || DEFAULT_ASSET,
        [field]: value
      }
    }));
  };

  // Add new asset to exchange
  const addNewAsset = (exchange: string) => {
    const newAsset = newAssets[exchange];
    if (!newAsset) return;

    const amount = parseFloat(newAsset.amount);
    if (isNaN(amount) || !newAsset.symbol.trim()) {
      alert('Please fill in symbol and amount');
      return;
    }

    setExchangeSummaries(prev => {
      const updated = [...prev];
      const exchangeIndex = updated.findIndex(e => e.name === exchange);
      if (exchangeIndex === -1) return prev;

      const newExchangeSummary = { ...updated[exchangeIndex] };
      const newAssets = [...newExchangeSummary.assets];
      const symbol = newAsset.symbol.trim().toUpperCase();

      const existingAssetIndex = newAssets.findIndex(
        a => a.symbol === symbol && a.type === newAsset.type
      );

      if (existingAssetIndex !== -1) {
        // Update existing asset
        const existingAsset = newAssets[existingAssetIndex];
        const newAmount = existingAsset.amount + amount;
        const newValue = newAmount * existingAsset.price;

        newExchangeSummary.totalValue = 
          newExchangeSummary.totalValue - existingAsset.value + newValue;

        newAssets[existingAssetIndex] = {
          ...existingAsset,
          amount: newAmount,
          value: newValue
        };
      } else {
        // Add new asset
        const price = parseFloat(newAsset.price) || 0;
        const value = amount * price;

        newExchangeSummary.totalValue += value;
        newAssets.push({
          id: `${exchange}-${symbol}-${newAsset.type}-${Date.now()}`,
          symbol,
          type: newAsset.type,
          amount,
          price,
          priceStr: price.toString(),
          value
        });
      }

      newAssets.sort((a, b) => b.value - a.value);
      newExchangeSummary.assets = newAssets;
      updated[exchangeIndex] = newExchangeSummary;

      return [...updated].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Reset form
    setNewAssets(prev => ({
      ...prev,
      [exchange]: { ...DEFAULT_ASSET }
    }));
  };

  // Add new exchange
  const addNewExchange = () => {
    const name = newExchangeName.trim();
    if (!name) {
      alert('Please enter exchange name');
      return;
    }

    if (exchangeSummaries.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      alert('Exchange already exists');
      return;
    }

    setExchangeSummaries(prev => [
      ...prev,
      {
        name,
        totalValue: 0,
        assets: []
      }
    ].sort((a, b) => a.name.localeCompare(b.name)));

    setNewExchangeName('');
    setShowNewExchangeForm(false);
  };

  // Handle field change
  const handleFieldChange = (exchangeName: string, assetId: string, field: 'symbol' | 'amount' | 'price', value: string) => {
    setExchangeSummaries(prev => {
      const updated = [...prev];
      const exchangeIndex = updated.findIndex(e => e.name === exchangeName);
      if (exchangeIndex === -1) return prev;

      const exchange = { ...updated[exchangeIndex] };
      const assets = [...exchange.assets];
      const assetIndex = assets.findIndex(a => a.id === assetId);
      if (assetIndex === -1) return prev;
      
      const asset = { ...assets[assetIndex] };

      if (field === 'price') {
        const cleanValue = value.replace(/^0+(?=\d)/, '');
        const numValue = cleanValue === '' ? 0 : parseFloat(cleanValue);
        
        if (isNaN(numValue)) return prev;
        
        // Update all assets with the same symbol across all exchanges
        updated.forEach(exch => {
          exch.assets.forEach(a => {
            if (a.symbol === asset.symbol) {
              a.price = numValue;
              a.priceStr = cleanValue;
              a.value = a.amount * numValue;
            }
          });
          // Recalculate exchange total
          exch.totalValue = exch.assets.reduce((sum, a) => sum + a.value, 0);
        });
        
        return updated;
      } else if (field === 'amount') {
        const numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue)) return prev;
        
        asset.amount = numValue;
        asset.value = numValue * asset.price;
      } else if (field === 'symbol') {
        // Check if symbol already exists in the same exchange with same type
        const exists = assets.some(a => 
          a.id !== assetId && 
          a.symbol.toLowerCase() === value.toLowerCase() && 
          a.type === asset.type
        );
        
        if (exists) {
          alert(`Asset with symbol "${value}" and type "${asset.type}" already exists in this exchange`);
          return prev;
        }
        asset.symbol = value;
      }

      assets[assetIndex] = asset;
      exchange.assets = assets;
      exchange.totalValue = assets.reduce((sum, a) => sum + a.value, 0);
      updated[exchangeIndex] = exchange;

      return updated;
    });
  };

  // Initialize exchange summaries from balances and static.csv
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const staticData = await client.getTradefiData();
        if (staticData) {
          const staticBalances: ExchangeBalances = {};
          
          staticData.forEach(row => {
            const { symbol, price, exchange, type, amount } = row;
            
            if (!staticBalances[exchange]) {
              staticBalances[exchange] = {
                balances: {
                  [type || 'spot']: {}
                }
              };
            }
            
            if (!staticBalances[exchange].balances[type || 'spot']) {
              staticBalances[exchange].balances[type || 'spot'] = {};
            }
            
            staticBalances[exchange].balances[type || 'spot'][symbol] = {
              amount: parseFloat(amount),
              price: parseFloat(price)
            };
          });

          // Merge static balances with exchange balances
          const mergedBalances = { ...balances };
          Object.entries(staticBalances).forEach(([exchange, data]) => {
            if (!mergedBalances[exchange]) {
              mergedBalances[exchange] = data;
            } else {
              Object.entries(data.balances).forEach(([type, assets]) => {
                if (!mergedBalances[exchange].balances[type]) {
                  mergedBalances[exchange].balances[type] = {};
                }
                Object.entries(assets).forEach(([symbol, balance]) => {
                  mergedBalances[exchange].balances[type][symbol] = balance;
                });
              });
            }
          });

          const summaries: Record<string, ExchangeSummary> = {};

          for (const [exchange, exchangeData] of Object.entries(mergedBalances)) {
            if (!exchangeData) continue;

            summaries[exchange] = {
              name: exchange,
              totalValue: 0,
              assets: []
            };

            Object.entries(exchangeData.balances).forEach(([accountType, assets]) => {
              if (!assets) return;

              Object.entries(assets).forEach(([symbol, balance]) => {
                if (!balance || typeof balance !== 'object') return;
                const { amount, price } = balance as { amount: number; price: number };
                const value = amount * price;

                const existingAssetIndex = summaries[exchange].assets.findIndex(
                  a => a.symbol === symbol && a.type === accountType
                );

                if (existingAssetIndex !== -1) {
                  // Update existing asset
                  const existingAsset = summaries[exchange].assets[existingAssetIndex];
                  const newAmount = existingAsset.amount + amount;
                  const newValue = newAmount * price;

                  summaries[exchange].totalValue = 
                    summaries[exchange].totalValue - existingAsset.value + newValue;

                  summaries[exchange].assets[existingAssetIndex] = {
                    ...existingAsset,
                    amount: newAmount,
                    value: newValue
                  };
                } else {
                  // Add new asset
                  summaries[exchange].totalValue += value;
                  summaries[exchange].assets.push({
                    id: `${exchange}-${symbol}-${accountType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    symbol,
                    type: accountType,
                    amount,
                    price,
                    priceStr: price.toString(),
                    value
                  });
                }
              });
            });

            summaries[exchange].assets.sort((a, b) => b.value - a.value);
          }

          setExchangeSummaries(
            Object.values(summaries).sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch (error) {
        console.error('Failed to load static data:', error);
      }
    };

    loadStaticData();
  }, [balances]);

  // Save data to CSV file
  const saveToFile = async () => {
    const headers = ['Symbol', 'Price', 'Exchange', 'Type', 'Amount'];
    const rows = exchangeSummaries.flatMap(exchange => 
      exchange.assets.map(asset => [
        asset.symbol,
        asset.price.toFixed(8),
        exchange.name,
        asset.type,
        asset.amount.toFixed(8)
      ])
    );
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    try {
      await client.saveSnapshot(filename, csvContent);
      alert('Snapshot saved successfully!');
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        if (confirm('File already exists. Do you want to overwrite it?')) {
          await client.saveSnapshot(filename, csvContent, true);
          alert('Snapshot saved successfully!');
        }
      } else {
        alert('Failed to save snapshot: ' + (error as Error).message);
      }
    }
  };

  return (
    <div className="preview-page">
      <div className="controls">
        <div className="export-controls">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="filename-input"
          />
          <button onClick={saveToFile} className="export-button">
            Export to CSV
          </button>
        </div>
      </div>

      {exchangeSummaries.map(exchange => (
        <div key={exchange.name} className="exchange-container">
          <ExchangeHeader name={exchange.name} totalValue={exchange.totalValue} />
          <table>
            <AssetTableHeader sortConfig={sortConfig} onSort={handleSort} />
            <tbody>
              {sortAssets(exchange.assets, sortConfig.field, sortConfig.direction).map((asset, idx) => (
                <AssetRow
                  key={`${exchange.name}-${asset.symbol}-${asset.type}-${idx}`}
                  asset={asset}
                  exchangeName={exchange.name}
                  onDelete={deleteAsset}
                  onFieldChange={handleFieldChange}
                />
              ))}
              <NewAssetRow
                newAsset={newAssets[exchange.name] || DEFAULT_ASSET}
                exchangeName={exchange.name}
                onUpdate={updateNewAsset}
                onAdd={addNewAsset}
              />
            </tbody>
          </table>
        </div>
      ))}

      <div className="footer">
        <button onClick={() => setShowNewExchangeForm(true)} className="add-exchange-button">
          Add New Exchange
        </button>
      </div>

      {showNewExchangeForm && (
        <NewExchangeModal
          newExchangeName={newExchangeName}
          onNameChange={setNewExchangeName}
          onAdd={addNewExchange}
          onCancel={() => {
            setShowNewExchangeForm(false);
            setNewExchangeName('');
          }}
        />
      )}
    </div>
  );
}; 