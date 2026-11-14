import React from 'react';
import Field from './Field';
import RouteMapEditor from './RouteMapEditor';
import { seats } from '../format';

// The buses that run this route. A bus can run one route only, so a bus that is on another route is not offered here;
// the server checks it again.
function BusChecklist({ buses, selected, onChange }) {
  const offered = buses.filter((b) => !b.routeId || selected.includes(b.id));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="field">
      <span className="form-label">Buses on this route ({selected.length} selected)</span>
      {offered.length === 0 ? (
        <span className="cell-muted">Every bus is already on a route. Add a bus first, or take one off its route.</span>
      ) : (
        <div className="bus-checklist" role="group" aria-label="Buses on this route">
          {offered.map((b) => (
            <label key={b.id} className="check-row">
              <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />
              <span>{b.registration} <span className="cell-muted">{b.id} · {seats(b.capacity)}</span></span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

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
      </div>
      <BusChecklist buses={buses} selected={formData.busIds || []} onChange={(ids) => updateField('busIds', ids)} />

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
