import React from 'react';
import { Asset } from '../../types/preview';
import { formatUSD } from '../../utils/preview';

interface AssetRowProps {
  asset: Asset;
  exchangeName: string;
  onDelete: (exchangeName: string, assetId: string) => void;
  onFieldChange: (exchangeName: string, assetId: string, field: 'symbol' | 'amount' | 'price', value: string) => void;
}

export const AssetRow: React.FC<AssetRowProps> = ({
  asset,
  exchangeName,
  onDelete,
  onFieldChange,
}) => (
  <tr className={asset.price === 0 ? 'zero-price-row' : ''}>
    <td>
      <input
        type="text"
        value={asset.symbol}
        onChange={(e) => onFieldChange(exchangeName, asset.id, 'symbol', e.target.value)}
        className="editable-input"
      />
    </td>
    <td className="type-cell">{asset.type}</td>
    <td className="text-right">
      <input
        type="text"
        value={isNaN(asset.amount) ? '' : asset.amount.toString()}
        onChange={(e) => onFieldChange(exchangeName, asset.id, 'amount', e.target.value)}
        className="editable-input text-right"
      />
    </td>
    <td className="text-right">
      <input
        type="text"
        inputMode="decimal"
        value={asset.priceStr}
        onChange={(e) => onFieldChange(exchangeName, asset.id, 'price', e.target.value)}
        className="editable-input text-right"
      />
    </td>
    <td className="text-right">{formatUSD(asset.value)}</td>
    <td className="action-column">
      <button
        onClick={() => onDelete(exchangeName, asset.id)}
        className="delete-icon"
        title="Delete asset"
      >
        ×
      </button>
    </td>
  </tr>
); 