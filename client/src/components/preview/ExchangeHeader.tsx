import React from 'react';
import { formatUSD } from '../../utils/preview';

interface ExchangeHeaderProps {
  name: string;
  totalValue: number;
}

export const ExchangeHeader: React.FC<ExchangeHeaderProps> = ({ name, totalValue }) => (
  <div className="exchange-header">
    <div className="exchange-info">
      <h3>{name}</h3>
    </div>
    <div className="exchange-total">
      Total Value: {formatUSD(totalValue)}
    </div>
  </div>
); 