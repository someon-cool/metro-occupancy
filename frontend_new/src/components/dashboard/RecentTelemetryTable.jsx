// frontend/src/components/dashboard/RecentTelemetryTable.jsx
import React from 'react';
import { Clock, Users, UserMinus, Hash, Activity } from 'lucide-react';

export function RecentTelemetryTable({ history, capacity = 50 }) {
  if (!history || history.length === 0) {
    return (
      <div className="card telemetry-table-card">
        <div className="card-table-header">
          <h3 className="card-heading">Recent Telemetry Ingest Stream</h3>
          <span className="badge-stream">POLLING: 2.0s</span>
        </div>
        <div className="empty-table-state">
          <Clock size={28} className="text-muted" />
          <p>No historical telemetry records logged yet.</p>
          <span className="empty-sub">Once edge stream POSTs to /occupancy, records will populate live here.</span>
        </div>
      </div>
    );
  }

  // Records are in chronological order from backend, show newest first in table
  const displayRows = [...history].reverse().slice(0, 12);

  return (
    <div className="card telemetry-table-card">
      <div className="card-table-header">
        <div>
          <h3 className="card-heading">Recent Telemetry Ingest Stream</h3>
          <p className="card-subheading">Live telemetry buffer from backend database (ordered newest to oldest)</p>
        </div>
        <div className="table-meta-right">
          <span className="badge-stream live-pulse">LIVE STREAM</span>
          <span className="count-tag">{history.length} records</span>
        </div>
      </div>

      <div className="table-responsive-wrapper">
        <table className="pids-table">
          <thead>
            <tr>
              <th><Clock size={13} className="th-icon" /> TIMESTAMP</th>
              <th><Users size={13} className="th-icon" /> IN FRAME</th>
              <th><UserMinus size={13} className="th-icon" /> VACANCY</th>
              <th><Hash size={13} className="th-icon" /> CUMULATIVE</th>
              <th><Activity size={13} className="th-icon" /> FILL STATUS</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => {
              const inFrame = row.people_in_frame ?? 0;
              const fillPct = Math.round((inFrame / capacity) * 100);
              let pillClass = 'pill-available';
              if (fillPct >= 85) pillClass = 'pill-crowded';
              else if (fillPct >= 60) pillClass = 'pill-moderate';

              const timeStr = row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '–';

              return (
                <tr key={idx} className={idx === 0 ? 'highlight-row' : ''}>
                  <td className="time-cell">
                    <span className="time-text">{timeStr}</span>
                    {idx === 0 && <span className="latest-dot" title="Latest reading" />}
                  </td>
                  <td className="headcount-cell">
                    <strong>{inFrame}</strong>
                  </td>
                  <td className="vacancy-cell">
                    {row.vacancy ?? Math.max(0, capacity - inFrame)}
                  </td>
                  <td className="cumulative-cell">
                    {row.passenger_count ?? '–'}
                  </td>
                  <td>
                    <span className={`status-pill-small ${pillClass}`}>
                      {fillPct}% {fillPct >= 85 ? 'HIGH' : fillPct >= 60 ? 'MED' : 'LOW'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

