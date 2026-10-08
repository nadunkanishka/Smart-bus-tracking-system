import React from 'react';
import Field from './Field';
import RouteMapEditor from './RouteMapEditor';

export default function RouteForm({ formData, updateField, setFormData, buses }) {
  return (
    <div className="modal-form">
      <div className="form-grid">
        <Field label="Route Name *">
          <input
            className="form-input"
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="e.g. Pettah to Maharagama"
          />
        </Field>
        <Field label="Route Number">
          <input
            className="form-input"
            value={formData.routeNumber}
            onChange={(event) => updateField('routeNumber', event.target.value)}
            placeholder="e.g. 138"
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Start Terminal *">
          <input
            className="form-input"
            value={formData.start}
            onChange={(event) => updateField('start', event.target.value)}
            placeholder="Origin Terminal"
          />
        </Field>
        <Field label="End Terminal *">
          <input
            className="form-input"
            value={formData.end}
            onChange={(event) => updateField('end', event.target.value)}
            placeholder="Destination Terminal"
          />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Distance (km) *">
          <input
            type="number"
            className="form-input"
            value={formData.distance}
            onChange={(event) => updateField('distance', event.target.value)}
            placeholder="120"
          />
        </Field>
        <Field label="Assign Bus (From Fleet)">
          <select
            className="form-input"
            value={formData.assignedBus}
            onChange={(event) => updateField('assignedBus', event.target.value)}
          >
            <option value="">-- No Bus Assigned --</option>
            {buses.map((b) => (
              <option key={b.id} value={`${b.registration} (${b.id})`}>
                {b.registration} — {b.id} ({b.capacity})
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
