import React, { useState, useEffect } from 'react';
import { ObserverClient } from '../api/observer-client';
import { AssetData, SnapshotData } from '../types/snapshot';

interface AssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetCategoryModal: React.FC<AssetCategoryModalProps> = ({ isOpen, onClose }) => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const client = new ObserverClient();

  useEffect(() => {
    if (isOpen) {
      loadAssetData();
    }
  }, [isOpen]);

  const loadAssetData = async () => {
    setIsLoading(true);
    try {
      const data = await client.getAssetData();
      setAssets(data);
      updateCategories(data);
    } catch (error) {
      console.error('Failed to load asset data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLatestSymbols = async () => {
    try {
      const snapshotData = await client.getLatestSnapshot();
      console.log('Snapshot data:', snapshotData);
      
      const uniqueSymbols = new Set(snapshotData.map(item => item.symbol));
      console.log('Unique symbols:', uniqueSymbols);
      
      // Merge with existing assets
      const existingSymbols = new Set(assets.map(asset => asset.Symbol));
      console.log('Existing symbols:', existingSymbols);
      
      const newAssets: AssetData[] = [...assets];
      
      // Add new symbols
      for (const symbol of uniqueSymbols) {
        if (!existingSymbols.has(symbol)) {
          console.log('Adding new symbol:', symbol);
          newAssets.push({
            Symbol: symbol,
            Category: ''
          });
        }
      }

      console.log('Updated assets:', newAssets);
      setAssets(newAssets);
      updateCategories(newAssets);
    } catch (error) {
      console.error('Failed to load latest symbols:', error);
    }
  };

  const updateCategories = (data: AssetData[]) => {
    const uniqueCategories = new Set(data.map(asset => asset.Category).filter(Boolean));
    setCategories(uniqueCategories);
  };

  const handleCategoryChange = (symbol: string, category: string) => {
    const updatedAssets = assets.map(asset => 
      asset.Symbol === symbol ? { ...asset, Category: category } : asset
    );
    setAssets(updatedAssets);
    updateCategories(updatedAssets);
  };

  const handleSave = async () => {
    try {
      await client.saveAssetData(assets);
      onClose();
    } catch (error) {
      console.error('Failed to save asset data:', error);
      alert('Failed to save asset categories');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Asset Categories</h2>
          <div className="modal-actions">
            <button onClick={loadLatestSymbols} className="load-button">
              Load Latest Symbols
            </button>
            <button onClick={handleSave} className="save-button">
              Save & Close
            </button>
            <button onClick={onClose} className="close-button">
              Cancel
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="asset-list">
            {isLoading ? (
              <div className="loading">Loading...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <tr key={`${asset.Symbol}-${index}`}>
                      <td>{asset.Symbol}</td>
                      <td>
                        <input
                          type="text"
                          value={asset.Category}
                          onChange={(e) => handleCategoryChange(asset.Symbol, e.target.value)}
                          className="category-input"
                          list="categories"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <datalist id="categories">
              {Array.from(categories).map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="category-summary">
            <h3>Categories</h3>
            <div className="category-list">
              {Array.from(categories).map(category => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-count">
                    {assets.filter(asset => asset.Category === category).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-radius: 8px 8px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-body {
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          overflow-y: auto;
          max-height: calc(90vh - 80px);
        }

        .asset-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: #f8f9fa;
          font-weight: 500;
          color: #666;
        }

        .category-input {
          width: 100%;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .category-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .category-summary {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 20px;
          height: 100%;
          overflow-y: auto;
        }

        .category-summary h3 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          color: #666;
          position: sticky;
          top: 0;
          background: white;
          padding-bottom: 10px;
          z-index: 1;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .category-name {
          color: #333;
          font-weight: 500;
        }

        .category-count {
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #666;
        }

        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .load-button {
          background: #6c757d;
          color: white;
        }

        .load-button:hover {
          background: #5a6268;
        }

        .save-button {
          background: #28a745;
          color: white;
        }

        .save-button:hover {
          background: #218838;
        }

        .close-button {
          background: #dc3545;
          color: white;
        }

        .close-button:hover {
          background: #c82333;
        }

        .loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }
      `}</style>
    </div>
  );
}; 