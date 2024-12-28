import React from 'react';

interface NewExchangeModalProps {
  newExchangeName: string;
  onNameChange: (name: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export const NewExchangeModal: React.FC<NewExchangeModalProps> = ({
  newExchangeName,
  onNameChange,
  onAdd,
  onCancel,
}) => (
  <div className="modal-overlay">
    <div className="new-exchange-form">
      <input
        type="text"
        value={newExchangeName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Exchange name"
        className="new-exchange-input"
      />
      <div className="new-exchange-buttons">
        <button onClick={onAdd} className="add-exchange-button">
          Add Exchange
        </button>
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  </div>
); 