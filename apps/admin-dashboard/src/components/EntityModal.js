import React from 'react';
import Icon from './Icon';
import DriverForm from './DriverForm';
import BusForm from './BusForm';
import RouteForm from './RouteForm';

// The add/edit dialog for drivers, buses and routes: shared header and actions around one of the three forms.
export default function EntityModal({ modalState, formData, updateField, setFormData, closeModal, handleSave, drivers, buses }) {
  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && closeModal()}>
      <div className={`modal-box ${modalState.entity === 'route' ? 'modal-wide' : ''}`} role="dialog" aria-modal="true">
        {/* CHANGED (visual only): notch header + close button */}
        <header className="modal-head">
          <span className="notch"><i><Icon type={modalState.entity === 'driver' ? 'user' : modalState.entity === 'bus' ? 'bus' : 'route'} /></i></span>
          <div className="modal-head-copy">
            <span className="eyebrow">{modalState.mode === 'edit' ? 'Update record' : 'New record'}</span>
        <h3 className="modal-title">
          {modalState.entity === 'driver'
            ? modalState.mode === 'edit'
              ? 'Edit Driver'
              : 'Add New Driver'
            : modalState.entity === 'bus'
              ? modalState.mode === 'edit'
                ? 'Edit Bus'
                : 'Add New Bus'
              : modalState.mode === 'edit'
                ? 'Edit Route'
                : 'Create New Route'}
        </h3>
          </div>
          <button type="button" className="icon-btn" onClick={closeModal} aria-label="Close"><Icon type="close" /></button>
        </header>

        {modalState.entity === 'driver' && <DriverForm formData={formData} updateField={updateField} />}

        {modalState.entity === 'bus' && <BusForm formData={formData} updateField={updateField} modalState={modalState} drivers={drivers} />}

        {modalState.entity === 'route' && <RouteForm formData={formData} updateField={updateField} setFormData={setFormData} buses={buses} />}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Icon type="check" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
