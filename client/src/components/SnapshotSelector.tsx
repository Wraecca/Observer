import React from 'react';

interface SnapshotSelectorProps {
  selectedSnapshot: string;
  snapshots: string[];
  onSelect: (snapshot: string) => void;
}

export const SnapshotSelector: React.FC<SnapshotSelectorProps> = ({
  selectedSnapshot,
  snapshots,
  onSelect,
}) => {
  return (
    <div className="snapshot-header">
      <div className="spacer" />
      <div className="snapshot-select-container">
        <span className="snapshot-description">Historical Snapshots</span>
        <select
          value={selectedSnapshot}
          onChange={(e) => onSelect(e.target.value)}
          className="snapshot-select"
        >
          {snapshots.map(filename => (
            <option key={filename} value={filename}>
              {filename}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .snapshot-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }

        .snapshot-select-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .snapshot-description {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .snapshot-select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 200px;
        }
      `}</style>
    </div>
  );
}; 