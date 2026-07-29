import React from 'react';

export default function TelemetryGrid() {
  const telemetryLogs = [
    { socketId: 'sock_drv_8804', vehicle: 'NB-4521', route: '138', latency: '16 ms', rate: '3.0s', status: 'Active' },
    { socketId: 'sock_drv_7721', vehicle: 'NC-8802', route: '120', latency: '21 ms', rate: '3.0s', status: 'Active' },
    { socketId: 'sock_drv_9012', vehicle: 'ND-1049', route: '177', latency: '34 ms', rate: '3.0s', status: 'Buffering' },
    { socketId: 'sock_drv_3411', vehicle: 'ND-9920', route: '100', latency: '18 ms', rate: '3.0s', status: 'Active' },
    { socketId: 'sock_drv_5510', vehicle: 'NB-1102', route: '154', latency: '15 ms', rate: '3.0s', status: 'Active' },
  ];

  return (
    <div className="right-telemetry-panel">
      <div className="telemetry-panel-header">
        <h3>LIVE TELEMETRY LOG GRID</h3>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#05A357' }}>● 5 Sockets Streaming</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="telemetry-grid-table">
          <thead>
            <tr>
              <th>SOCKET ID</th>
              <th>VEHICLE</th>
              <th>ROUTE</th>
              <th>LATENCY</th>
              <th>RATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {telemetryLogs.map((log) => (
              <tr key={log.socketId}>
                <td style={{ fontFamily: 'monospace', color: '#5E5E5E' }}>{log.socketId}</td>
                <td>{log.vehicle}</td>
                <td>{log.route}</td>
                <td>
                  <span className={`latency-tag ${log.status === 'Active' ? 'good' : ''}`}>
                    {log.latency}
                  </span>
                </td>
                <td>{log.rate}</td>
                <td style={{
                  color: log.status === 'Active' ? '#05A357' : '#FFC043',
                  fontWeight: 800
                }}>
                  {log.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
