import React from 'react';
import { NewAsset } from '../../types/preview';

interface NewAssetRowProps {
  newAsset: NewAsset;
  exchangeName: string;
  onUpdate: (exchange: string, field: keyof NewAsset, value: string) => void;
  onAdd: (exchange: string) => void;
}

export const NewAssetRow: React.FC<NewAssetRowProps> = ({
  newAsset,
  exchangeName,
  onUpdate,
  onAdd,
}) => (
  <tr className="new-asset-row">
    <td>
      <input
        type="text"
        value={newAsset?.symbol || ''}
        onChange={e => onUpdate(exchangeName, 'symbol', e.target.value)}
        placeholder="Symbol"
        className="new-asset-input"
      />
    </td>
    <td>
      <input
        type="text"
        value={newAsset?.type || ''}
        onChange={e => onUpdate(exchangeName, 'type', e.target.value)}
        placeholder="Account type"
        className="new-asset-input"
      />
    </td>
    <td>
      <input
        type="text"
        value={newAsset?.amount || ''}
        onChange={e => onUpdate(exchangeName, 'amount', e.target.value)}
        placeholder="Amount"
        className="new-asset-input text-right"
      />
    </td>
    <td>
      <input
        type="text"
        value={newAsset?.price || ''}
        onChange={e => onUpdate(exchangeName, 'price', e.target.value)}
        placeholder="Optional"
        className="new-asset-input text-right"
      />
    </td>
    <td className="text-right">-</td>
    <td className="action-column">
      <button
        onClick={() => onAdd(exchangeName)}
        className="add-asset-button"
      >
        +
      </button>
    </td>
  </tr>
); 