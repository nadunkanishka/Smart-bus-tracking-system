import React from 'react';
import Icon from './Icon';

// The frame every add/edit dialog shares: notch icon, eyebrow and title, close button, the form, Cancel / Save.
export default function ModalShell({ icon, eyebrow, title, wide = false, onClose, onSave, children }) {
  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <span className="notch"><i><Icon type={icon} /></i></span>
          <div className="modal-head-copy">
            <span className="eyebrow">{eyebrow}</span>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon type="close" /></button>
        </header>

        {children}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            <Icon type="check" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
