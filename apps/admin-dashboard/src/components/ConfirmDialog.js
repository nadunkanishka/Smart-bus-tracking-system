import React from 'react';
import Icon from './Icon';

// "Are you sure?" before a delete. `target` names what goes (e.g. "Bus: NB-4712").
export default function ConfirmDialog({ title = 'Delete Confirmation', text, target, confirmLabel = 'Delete Item', onConfirm, onCancel }) {
  return (
    <div className="overlay confirm-overlay" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="clean-delete-box" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="clean-delete-icon-wrapper">
          <Icon type="trash" />
        </div>
        <h3 className="clean-delete-title">{title}</h3>
        <p className="clean-delete-text">{text}</p>
        {target && <div className="clean-delete-target-badge">{target}</div>}
        <div className="clean-delete-actions">
          <button type="button" className="btn-cancel-soft" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-delete-confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
