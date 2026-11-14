import React from 'react';

// The one rule for a record's status colour, used by every table and the dashboard: running is green, needs work
// (bus in maintenance, route under construction) is amber, anything else (idle, inactive, on leave) is gray.
const TONE = { Active: 'badge-green', Maintenance: 'badge-amber', 'Under Construction': 'badge-amber' };
export const statusBadgeClass = (status) => `badge ${TONE[status] || 'badge-gray'}`;

export default function StatusBadge({ status }) {
  return <span className={statusBadgeClass(status)}>{status}</span>;
}
