import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Draw a route's road path and register its stops on an OpenStreetMap map.
// path: [[lat, lng], ...]   stops: [{ name, lat, lng }, ...] in travel order (first = start terminal).
const COLOMBO = [6.9, 79.87];
const OSRM = process.env.REACT_APP_OSRM_URL || 'https://router.project-osrm.org/route/v1/driving';

const stopIcon = (n) => L.divIcon({
  className: '',
  html: `<div class="map-stop-pin">${n}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});
const vertexIcon = L.divIcon({ className: '', html: '<div class="map-vertex"></div>', iconSize: [10, 10], iconAnchor: [5, 5] });

const km = (line) => {
  let m = 0;
  for (let i = 1; i < line.length; i += 1) m += L.latLng(line[i - 1]).distanceTo(L.latLng(line[i]));
  return Math.round(m / 100) / 10;
};

function ClickCapture({ onClick }) {
  useMapEvents({ click: (e) => onClick([Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]) });
  return null;
}

export default function RouteMapEditor({ path, stops, onChange }) {
  const [mode, setMode] = useState('stop'); // 'stop' | 'path'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const center = useMemo(() => (stops[0] ? [stops[0].lat, stops[0].lng] : path[0] || COLOMBO), []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next) => onChange({ path, stops, ...next, distanceKm: km(next.path || path) });

  const handleClick = (point) => {
    setError('');
    if (mode === 'path') update({ path: [...path, point] });
    else update({ stops: [...stops, { name: '', lat: point[0], lng: point[1] }] });
  };
  const editStop = (i, patch) => update({ stops: stops.map((s, n) => (n === i ? { ...s, ...patch } : s)) });
  const moveStop = (i, by) => {
    const next = [...stops];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    update({ stops: next });
  };

  // Road-following path through the stops, from the OSRM routing service.
  const buildFromStops = async () => {
    if (stops.length < 2) { setError('Add at least two stops first.'); return; }
    setBusy(true);
    setError('');
    try {
      const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
      const res = await fetch(`${OSRM}/${coords}?overview=full&geometries=geojson`);
      const data = await res.json();
      const line = data.routes?.[0]?.geometry?.coordinates;
      if (!Array.isArray(line) || line.length < 2) throw new Error('no route');
      update({ path: line.map(([lng, lat]) => [lat, lng]) });
    } catch {
      setError('Could not fetch a road path. Draw it by hand with "Draw path", or try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="route-editor">
      <div className="route-editor-bar" role="group" aria-label="Map tools">
        <button type="button" className={`btn btn-chip ${mode === 'stop' ? 'on' : ''}`} aria-pressed={mode === 'stop'} onClick={() => setMode('stop')}>Add stops</button>
        <button type="button" className={`btn btn-chip ${mode === 'path' ? 'on' : ''}`} aria-pressed={mode === 'path'} onClick={() => setMode('path')}>Draw path</button>
        <button type="button" className="btn btn-chip" onClick={buildFromStops} disabled={busy}>{busy ? 'Building…' : 'Build path through stops'}</button>
        <button type="button" className="btn btn-chip" onClick={() => update({ path: path.slice(0, -1) })} disabled={!path.length}>Undo point</button>
        <button type="button" className="btn btn-chip" onClick={() => update({ path: [] })} disabled={!path.length}>Clear path</button>
      </div>
      <p className="route-editor-hint">
        {mode === 'stop' ? 'Click the map to place each stop in travel order, starting with the first terminal.' : 'Click along the road to draw the path the bus follows.'}
        {' '}Path: {path.length} points, {km(path)} km.
      </p>
      {error && <div className="login-error" role="alert">{error}</div>}

      <div className="route-editor-map">
        <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickCapture onClick={handleClick} />
          {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#F26B85', weight: 5 }} />}
          {mode === 'path' && path.length <= 200 && path.map((p, i) => <Marker key={`v${i}`} position={p} icon={vertexIcon} interactive={false} />)}
          {stops.map((s, i) => (
            <Marker
              key={`s${i}`}
              position={[s.lat, s.lng]}
              icon={stopIcon(i + 1)}
              draggable
              title={s.name || `Stop ${i + 1}`}
              eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); editStop(i, { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) }); } }}
            />
          ))}
        </MapContainer>
      </div>

      <div className="stop-list">
        {stops.length === 0 && <p className="route-editor-hint">No stops yet. A route needs at least two stops and a path before buses on it can be tracked.</p>}
        {stops.map((s, i) => (
          <div key={i} className="stop-row">
            <span className="map-stop-pin static" aria-hidden="true">{i + 1}</span>
            <input
              className="form-input"
              value={s.name}
              onChange={(e) => editStop(i, { name: e.target.value })}
              placeholder={`Stop ${i + 1} name`}
              aria-label={`Stop ${i + 1} name`}
            />
            <button type="button" className="btn btn-edit stop-remove" onClick={() => moveStop(i, -1)} disabled={i === 0} aria-label={`Move stop ${i + 1} up`}>↑</button>
            <button type="button" className="btn btn-edit stop-remove" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} aria-label={`Move stop ${i + 1} down`}>↓</button>
            <button type="button" className="btn btn-danger stop-remove" onClick={() => update({ stops: stops.filter((_, n) => n !== i) })} aria-label={`Remove stop ${i + 1}`}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
