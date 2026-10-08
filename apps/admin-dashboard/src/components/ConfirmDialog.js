import React from 'react';
import Icon from './Icon';

// Modern Clean Delete Modal
export default function ConfirmDialog({ confirmState, closeConfirm, handleDelete }) {
  return (
    <div className="overlay confirm-overlay" onClick={(event) => event.target === event.currentTarget && closeConfirm()}>
      <div className="clean-delete-box">
        <div className="clean-delete-icon-wrapper">
          <Icon type="trash" />
        </div>
        <h3 className="clean-delete-title">Delete Confirmation</h3>
        <p className="clean-delete-text">Are you sure you want to permanently remove this record from MongoDB?</p>
        <div className="clean-delete-target-badge">{confirmState.label}</div>
        <div className="clean-delete-actions">
          <button type="button" className="btn-cancel-soft" onClick={closeConfirm}>
            Cancel
          </button>
          <button type="button" className="btn-delete-confirm" onClick={handleDelete}>
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}
