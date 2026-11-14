import React from 'react';
import Field from './Field';
import RouteMapEditor from './RouteMapEditor';
import { formatBusRef } from '../design/contract';
import { seats } from '../format';

export default function RouteForm({ formData, updateField, setFormData, buses }) {
  return (
    <div className="modal-form">
      <div className="form-grid">
        <Field label="Route Name *" icon="route">
          <input
            className="form-input"
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="e.g. Pettah to Homagama"
          />
        </Field>
        <Field label="Route Number" icon="hash">
          <input
            className="form-input"
            value={formData.routeNumber}
            onChange={(event) => updateField('routeNumber', event.target.value)}
            placeholder="e.g. 138"
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Start Terminal *" icon="pin">
          <input
            className="form-input"
            value={formData.start}
            onChange={(event) => updateField('start', event.target.value)}
            placeholder="Origin Terminal"
          />
        </Field>
        <Field label="End Terminal *" icon="pin">
          <input
            className="form-input"
            value={formData.end}
            onChange={(event) => updateField('end', event.target.value)}
            placeholder="Destination Terminal"
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Distance (km) *" icon="ruler">
          <input
            type="number"
            className="form-input"
            value={formData.distance}
            onChange={(event) => updateField('distance', event.target.value)}
            placeholder="120"
          />
        </Field>
        <Field label="Assign Bus (From Fleet)" icon="bus">
          <select
            className="form-input"
            value={formData.assignedBus}
            onChange={(event) => updateField('assignedBus', event.target.value)}
          >
            <option value="">-- No Bus Assigned --</option>
            {buses.map((b) => (
              <option key={b.id} value={formatBusRef({ registration: b.registration, busId: b.id })}>
                {b.registration} — {b.id} ({seats(b.capacity)})
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Road path and stops on the map. Not wrapped in <label>: it holds many controls. */}
      <div className="field">
        <span className="form-label">Route Path and Stops</span>
        <RouteMapEditor
          path={formData.path || []}
          stops={formData.stopPoints || []}
          onChange={({ path, stops, distanceKm }) => setFormData((current) => ({
            ...current,
            path,
            stopPoints: stops,
            distance: path.length > 1 ? distanceKm : current.distance,
          }))}
        />
      </div>
    </div>
  );
}
