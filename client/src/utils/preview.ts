import { Asset, SortField, SortDirection } from '../types/preview';

export const sortAssets = (assets: Asset[], field: SortField, direction: SortDirection) => {
  return [...assets].sort((a, b) => {
    let comparison = 0;
    if (field === 'symbol' || field === 'type') {
      comparison = a[field].localeCompare(b[field]);
    } else {
      comparison = a[field] - b[field];
    }
    return direction === 'asc' ? comparison : -comparison;
  });
};

export const formatNumber = (num: number) => {
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
    maximumFractionDigits: 8
  });
};

export const formatUSD = (num: number) => `$${formatNumber(num)}`; 