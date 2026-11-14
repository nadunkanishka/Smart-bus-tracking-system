import React from 'react';
import ModalShell from './ModalShell';
import DriverForm from './DriverForm';
import BusForm from './BusForm';
import RouteForm from './RouteForm';
import { ENTITIES } from '../entities';

const FORMS = { driver: DriverForm, bus: BusForm, route: RouteForm };

// The add/edit dialog for drivers, buses and routes: the shared frame around the entity's form.
export default function EntityModal({ modal, formData, updateField, setFormData, closeModal, handleSave, drivers, buses }) {
  const { entity, mode } = modal;
  const Form = FORMS[entity];
  return (
    <ModalShell
      icon={ENTITIES[entity].icon}
      eyebrow={mode === 'edit' ? 'Update record' : 'New record'}
      title={ENTITIES[entity].labels[mode]}
      wide={entity === 'route'}
      onClose={closeModal}
      onSave={handleSave}
    >
      <Form formData={formData} updateField={updateField} setFormData={setFormData} mode={mode} drivers={drivers} buses={buses} />
    </ModalShell>
  );
}
