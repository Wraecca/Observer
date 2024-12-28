import React, { useState, useEffect, useMemo } from 'react';
import { ObserverClient } from '../api/observer-client';
import { SnapshotData, AssetData, AssetSummary } from '../types/snapshot';
import { AssetCategoryModal } from '../components/AssetCategoryModal';

interface HomeProps {
  onFetchBalances: () => void;
  isLoading: boolean;
}

interface ExchangeData {
  amount: number;
  value: number;
}

interface GroupedAssets {
  [category: string]: AssetSummary[];
  uncategorized: AssetSummary[];
}

export const Home: React.FC<HomeProps> = ({ onFetchBalances, isLoading }) => {
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [snapshotData, setSnapshotData] = useState<SnapshotData[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetData[]>([]);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [minValue, setMinValue] = useState<string>('1');
  const [sortConfig, setSortConfig] = useState<{ field: keyof AssetSummary; direction: 'asc' | 'desc' }>({
    field: 'totalValue',
    direction: 'desc'
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const client = new ObserverClient();

  useEffect(() => {
    loadSnapshots();
    loadAssetCategories();
  }, []);

  const loadAssetCategories = async () => {
    try {
      const data = await client.getAssetData();
      setAssetCategories(data);
    } catch (error) {
      console.error('Failed to load asset categories:', error);
    }
  };

  const loadSnapshots = async () => {
    try {
      const data = await client.listSnapshots();
      setSnapshots(data);
      if (data.length > 0) {
        setSelectedSnapshot(data[0]);
        await loadSnapshotData(data[0]);
      }
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    }
  };

  const loadSnapshotData = async (filename: string) => {
    setIsLoadingSnapshot(true);
    try {
      const data = await client.getSnapshot(filename);
      setSnapshotData(data);
    } catch (error) {
      console.error('Failed to load snapshot data:', error);
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleSort = (field: keyof AssetSummary) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const assetSummaries = useMemo(() => {
    const summaryMap = new Map<string, AssetSummary>();

    for (const item of snapshotData) {
      const symbol = item.symbol;
      const price = parseFloat(item.price);
      const amount = parseFloat(item.amount);
      const value = price * amount;

      if (!summaryMap.has(symbol)) {
        summaryMap.set(symbol, {
          symbol,
          totalAmount: 0,
          totalValue: 0,
          price,
          exchanges: []
        });
      }

      const summary = summaryMap.get(symbol)!;
      summary.totalAmount += amount;
      summary.totalValue += value;
      summary.exchanges.push({
        name: item.exchange,
        amount,
        value,
        percentage: 0
      });
    }

    // Calculate percentages
    for (const summary of summaryMap.values()) {
      for (const exchange of summary.exchanges) {
        exchange.percentage = (exchange.value / summary.totalValue) * 100;
      }
    }

    return Array.from(summaryMap.values());
  }, [snapshotData]);

  const groupedAssets = useMemo(() => {
    const grouped: GroupedAssets = {
      uncategorized: []
    };

    const categoryMap = new Map(assetCategories.map(asset => [asset.Symbol, asset.Category]));

    for (const asset of assetSummaries) {
      const category = categoryMap.get(asset.symbol) || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(asset);
    }

    // Sort assets within each category
    for (const category in grouped) {
      grouped[category].sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * direction;
      });
    }

    return grouped;
  }, [assetSummaries, assetCategories, sortConfig]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [category, assets] of Object.entries(groupedAssets)) {
      totals[category] = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    }
    return totals;
  }, [groupedAssets]);

  const totalValue = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
  }, [categoryTotals]);

  const toggleAssetExpansion = (symbol: string) => {
    setExpandedAssets(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredGroupedAssets = useMemo(() => {
    const minValueNum = parseFloat(minValue) || 0;
    const filtered: GroupedAssets = {};

    for (const [category, assets] of Object.entries(groupedAssets)) {
      filtered[category] = assets.filter(asset => asset.totalValue >= minValueNum);
    }

    return filtered;
  }, [groupedAssets, minValue]);

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    
    const absNum = Math.abs(num);
    if (absNum >= 1_000_000) {
      return (num / 1_000_000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + 'm';
    }
    if (absNum >= 1_000) {
      return (num / 1_000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + 'k';
    }
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="snapshots-page">
      {snapshots.length > 0 && (
        <div className="snapshot-section">
          <div className="snapshot-header">
            <div className="total-value">
              <div className="total-label">Total Value</div>
              <div className="value">${formatNumber(totalValue)}</div>
            </div>
            <div className="snapshot-select-container">
              <div className="snapshot-controls">
                <select
                  value={selectedSnapshot}
                  onChange={(e) => {
                    setSelectedSnapshot(e.target.value);
                    loadSnapshotData(e.target.value);
                  }}
                  className="snapshot-select"
                >
                  {snapshots.map(filename => (
                    <option key={filename} value={filename}>
                      {filename}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onFetchBalances}
                  disabled={isLoading}
                  className="fetch-button"
                >
                  {isLoading ? 'Loading...' : 'Add Snapshot'}
                </button>
              </div>
            </div>
          </div>

          {isLoadingSnapshot ? (
            <div className="loading">Loading snapshot data...</div>
          ) : (
            <div className="table-container">
              {Object.entries(filteredGroupedAssets)
                .sort(([categoryA, assetsA], [categoryB, assetsB]) => {
                  return categoryTotals[categoryB] - categoryTotals[categoryA];
                })
                .map(([category, assets]) => assets.length > 0 && (
                  <div key={category} className="category-group">
                    <div 
                      className="category-header"
                      onClick={() => toggleCategoryExpansion(category)}
                    >
                      <div className="category-title">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryExpansion(category);
                          }}
                          className="expand-button category-expand"
                        >
                          {expandedCategories.has(category) ? '▼' : '▶'}
                        </button>
                        <h3>{category === 'uncategorized' ? 'Uncategorized' : category}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCategoryModal(true);
                          }}
                          className="edit-button"
                          title="Edit Categories"
                        >
                          ✎
                        </button>
                      </div>
                      <div className="category-total">
                        <div className="value">${formatNumber(categoryTotals[category])}</div>
                        <div className="percentage">
                          {((categoryTotals[category] / totalValue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {expandedCategories.has(category) && (
                      <table>
                        <thead>
                          <tr>
                            <th className="distribution-toggle"></th>
                            <th>
                              <span onClick={() => handleSort('symbol')} className="sortable">
                                Symbol {sortConfig.field === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                              </span>
                            </th>
                            <th onClick={() => handleSort('price')} className="sortable secondary-text">
                              Price {sortConfig.field === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalAmount')} className="sortable text-right secondary-text">
                              Amount {sortConfig.field === 'totalAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalValue')} className="sortable text-right secondary-text">
                              Total Value {sortConfig.field === 'totalValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {assets.map(asset => (
                            <React.Fragment key={asset.symbol}>
                              <tr>
                                <td>
                                  <button
                                    onClick={() => toggleAssetExpansion(asset.symbol)}
                                    className="expand-button"
                                  >
                                    {expandedAssets.has(asset.symbol) ? '▼' : '▶'}
                                  </button>
                                </td>
                                <td className="symbol-cell">{asset.symbol}</td>
                                <td className="secondary-text">
                                  ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </td>
                                <td className="text-right secondary-text">
                                  {asset.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </td>
                                <td className="text-right secondary-text">
                                  ${formatNumber(asset.totalValue)}
                                </td>
                              </tr>
                              {expandedAssets.has(asset.symbol) && (
                                <tr className="exchange-details">
                                  <td colSpan={5}>
                                    <div className="exchange-list">
                                      {asset.exchanges.map((exchange, index) => (
                                        <div key={index} className="exchange-item">
                                          <span className="exchange-name">{exchange.name}</span>
                                          <span className="exchange-amount">
                                            {exchange.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                          </span>
                                          <span className="exchange-value">
                                            ${formatNumber(exchange.value)}
                                          </span>
                                          <span className="exchange-percentage">
                                            {exchange.percentage.toFixed(1)}%
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="footer">
        <div className="filter-container">
          <label className="min-value-label">
            Hide assets below $
            <input
              type="text"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="min-value-input"
              placeholder="1"
            />
          </label>
        </div>
      </div>

      <AssetCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      <style>{`
        .snapshots-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .snapshot-actions {
          margin-bottom: 20px;
        }

        .fetch-button {
          padding: 8px 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .fetch-button:hover {
          background: #2980b9;
        }

        .fetch-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .snapshot-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .snapshot-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
        }

        .snapshot-select-container {
          display: flex;
          align-items: center;
        }

        .snapshot-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .snapshot-select {
          padding: 8px 12px;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          min-width: 220px;
          color: #2c3e50;
          background: white;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .snapshot-select:hover {
          border-color: #3498db;
        }

        .fetch-button {
          height: 38px;
          padding: 0 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .fetch-button:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .fetch-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .category-group {
          margin-bottom: 32px;
        }

        .category-group:last-child {
          margin-bottom: 0;
        }

        .category-header {
          padding: 20px 24px;
          background: #f8f9fa;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .category-total {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .category-total .value {
          font-size: 1.4rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .category-total .percentage {
          font-size: 0.9rem;
          color: #95a5a6;
          font-weight: 500;
        }

        .edit-button {
          background: none;
          border: none;
          color: #95a5a6;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .edit-button:hover {
          color: #7f8c8d;
          background: #ecf0f1;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px 24px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          color: #7f8c8d;
          font-weight: 500;
          font-size: 0.9rem;
          background: white;
        }

        .text-right {
          text-align: right;
        }

        .expand-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #bdc3c7;
          font-size: 0.8rem;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .expand-button:hover {
          color: #95a5a6;
        }

        .symbol-cell {
          color: #34495e;
          font-weight: 500;
        }

        .secondary-text {
          color: #95a5a6;
        }

        .exchange-details {
          background: #f8f9fa;
        }

        .exchange-list {
          padding: 4px 0;
        }

        .exchange-item {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 8px 24px;
          gap: 12px;
          align-items: center;
          border-bottom: 1px solid #ecf0f1;
        }

        .exchange-item:last-child {
          border-bottom: none;
        }

        .exchange-name {
          color: #7f8c8d;
        }

        .exchange-amount,
        .exchange-value,
        .exchange-percentage {
          color: #95a5a6;
          text-align: right;
        }

        .footer {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          padding: 0 24px;
        }

        .filter-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .min-value-label {
          color: #7f8c8d;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .min-value-input {
          width: 80px;
          padding: 6px 10px;
          border: 1px solid #e1e8ed;
          border-radius: 4px;
          background: #f8f9fa;
          color: #2c3e50;
        }

        .loading {
          padding: 40px;
          text-align: center;
          color: #7f8c8d;
          font-size: 1.1rem;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
          transition: color 0.2s;
        }

        .sortable:hover {
          color: #34495e;
        }

        .category-expand {
          font-size: 1rem;
          color: #95a5a6;
          margin-right: 4px;
        }

        .category-expand:hover {
          color: #7f8c8d;
        }

        .category-header {
          cursor: pointer;
        }

        .category-header:hover {
          background: #f1f3f4;
        }

        .snapshot-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .snapshot-select-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fetch-button {
          height: 38px;
          padding: 0 16px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .fetch-button:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .fetch-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .total-value {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .total-label {
          font-size: 1rem;
          color: #7f8c8d;
          font-weight: 500;
        }

        .total-value .value {
          font-size: 2rem;
          font-weight: 600;
          color: #2c3e50;
          letter-spacing: -0.5px;
        }

        .snapshot-header {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
        }
      `}</style>
    </div>
  );
}; 