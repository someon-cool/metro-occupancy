// frontend/src/components/common/StatusBadge.jsx
import React from 'react';

export function StatusBadge({ occupancyPct, deviceStatus, size = 'md' }) {
  let label = 'AVAILABLE';
  let colorClass = 'status-available';

  if (deviceStatus && deviceStatus !== 'active' && deviceStatus !== 'ok') {
    label = 'DEGRADED';
    colorClass = 'status-degraded';
  } else if (occupancyPct >= 85) {
    label = 'HIGH CROWD';
    colorClass = 'status-crowded';
  } else if (occupancyPct >= 60) {
    label = 'MODERATE';
    colorClass = 'status-moderate';
  } else {
    label = 'AVAILABLE';
    colorClass = 'status-available';
  }

  return (
    <div className={`metro-status-badge ${colorClass} ${size}`}>
      <span className="badge-glow-dot" />
      <span className="badge-label">{label}</span>
    </div>
  );
}

