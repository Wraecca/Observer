import React from 'react';
import { SortConfig, SortField } from '../../types/preview';

interface AssetTableHeaderProps {
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

export const AssetTableHeader: React.FC<AssetTableHeaderProps> = ({ sortConfig, onSort }) => (
  <thead>
    <tr>
      <th onClick={() => onSort('symbol')} className="sortable">
        Symbol {sortConfig.field === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => onSort('type')} className="sortable">
        Type {sortConfig.field === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => onSort('amount')} className="sortable text-right">
        Amount {sortConfig.field === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => onSort('price')} className="sortable text-right">
        Price (USD) {sortConfig.field === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th onClick={() => onSort('value')} className="sortable text-right">
        Value (USD) {sortConfig.field === 'value' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
      </th>
      <th className="action-column"></th>
    </tr>
  </thead>
); 