import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Vehicle } from '../design/Vehicle';

// Live system health: which drivers are connected, when each bus last reported, and pipeline latency.
const REFRESH_MS = 3000;
const busIcon = (on) => L.divIcon({ className: '', html: `<div class="map-bus-dot ${on ? 'on' : ''}"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
const ago = (ts, now) => {
  if (!ts) return 'Never';
  const s = Math.max(0, Math.round((now - ts) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ${s % 60}s ago`;
};
const ms = (v) => (v == null ? '—' : `${v} ms`);

export default function LiveMonitor({ api, routes }) {
  const [live, setLive] = useState({ buses: [], serverTs: Date.now() });
  const [metrics, setMetrics] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const [a, b] = await Promise.all([api('/live'), api('/metrics')]);
        if (stop || !a.ok || !b.ok) { if (!stop) setFailed(true); return; }
        setLive(await a.json());
        setMetrics(await b.json());
        setFailed(false);
      } catch {
        if (!stop) setFailed(true);
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { stop = true; clearInterval(t); };
  }, [api]);

  const routeName = (id) => routes.find((r) => r.id === id)?.name || id || 'Unassigned';
  const connected = live.buses.filter((b) => b.connected);
  const onDuty = live.buses.filter((b) => b.onDuty && b.connected);
  const located = live.buses.filter((b) => b.lat != null);
  const lat = metrics?.latencyMs;

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <h1>Live Monitor</h1>
          <p>Active driver connections and telemetry status, refreshed every {REFRESH_MS / 1000} seconds</p>
        </div>
        <span className="system-status">
          <span className={`system-status-dot ${failed ? 'off' : 'on'}`} />
          {failed ? 'Not receiving data' : 'Receiving data'}
        </span>
      </div>

      <div className="stat-grid">
        <Stat label="Drivers connected" value={connected.length} hint={`${onDuty.length} on duty`} />
        <Stat label="Open sockets" value={metrics?.sockets ?? '—'} hint="drivers and passengers" />
        <Stat label="GPS fixes accepted" value={metrics?.fixes.accepted ?? '—'} hint={`${metrics?.fixes.rejected ?? 0} rejected, ${metrics?.fixes.duplicates ?? 0} duplicates`} />
        <Stat label="Buffered fixes replayed" value={metrics?.fixes.buffered ?? '—'} hint={`${metrics?.fixes.batches ?? 0} offline batches`} />
        <Stat label="Device to server" value={ms(lat?.deviceToServer.avg)} hint={`peak ${ms(lat?.deviceToServer.max)}, includes phone clock offset`} />
        <Stat label="Server processing" value={ms(lat?.serverProcessing.avg)} hint={`p95 ${ms(lat?.serverProcessing.p95)}, peak ${ms(lat?.serverProcessing.max)}`} />
        <Stat label="Latest-fix cache" value={metrics?.store === 'redis' ? 'Redis' : metrics?.store === 'memory' ? 'In-memory' : '—'} hint={metrics?.store === 'memory' ? 'fallback: Redis is not connected' : 'serves passenger reads'} />
        <Stat label="Server uptime" value={metrics ? `${Math.floor(metrics.uptimeSec / 60)} min` : '—'} hint="since last restart" />
      </div>

      <div className="panel live-map">
        <MapContainer center={[6.9, 79.87]} zoom={12} style={{ width: '100%', height: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {located.map((b) => (
            <Marker key={b.busId} position={[b.lat, b.lng]} icon={busIcon(b.connected && b.onDuty)}>
              <Tooltip direction="top" offset={[0, -8]}>{b.registration} · {ago(b.lastSeen, live.serverTs)}</Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="panel table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bus</th>
              <th>Driver</th>
              <th>Route</th>
              <th>Connection</th>
              <th>Duty</th>
              <th>Last GPS fix</th>
              <th>Speed</th>
            </tr>
          </thead>
          <tbody>
            {live.buses.length === 0 ? (
              <tr>
                <td colSpan="7" className="cell-empty">
                  <div className="empty-state"><Vehicle name="bus" status="off" width={120} label="No drivers connected" />No driver has connected since the server started.</div>
                </td>
              </tr>
            ) : live.buses.map((b) => (
              <tr key={b.busId}>
                <td className="mono-cell table-strong">{b.registration}</td>
                <td>{b.driverName || <span className="cell-muted">Not assigned</span>}</td>
                <td>{routeName(b.routeId)}</td>
                <td><span className={`badge ${b.connected ? 'badge-green' : 'badge-gray'}`}>{b.connected ? 'Connected' : 'Disconnected'}</span></td>
                <td><span className={`badge ${b.onDuty ? 'badge-green' : 'badge-gray'}`}>{b.onDuty ? 'On duty' : 'Off duty'}</span></td>
                <td>{ago(b.lastSeen, live.serverTs)}</td>
                <td>{b.speed == null ? '—' : `${Math.round(b.speed * 3.6)} km/h`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  );
}
