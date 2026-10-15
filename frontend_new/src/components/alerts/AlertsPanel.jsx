// frontend/src/components/alerts/AlertsPanel.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import { AlertTriangle, CheckCircle2, AlertOctagon, Info, ShieldAlert, ArrowRight, Bell } from 'lucide-react';
import { DataNotAvailable } from '../common/DataNotAvailable';

export function AlertsPanel({ latestData, history }) {
  const currentPct = latestData ? Math.round(Number(latestData.occupancy_pct || 0)) : null;
  const inFrame = latestData?.people_in_frame ?? 0;
  const deviceStatus = latestData?.device_status || 'unknown';

  // Compute Active Live Alerts from Backend Data
  const activeAlerts = [];

  if (currentPct !== null) {
    if (currentPct >= 85) {
      activeAlerts.push({
        id: 'CRIT_CROWD',
        level: 'critical',
        title: 'CRITICAL COACH CONGESTION',
        message: `Coach ${latestData?.coach_id || 'COACH-A1'} has reached ${currentPct}% occupancy (${inFrame} riders). Standing density exceeds recommended transit threshold.`,
        action: 'Advise passengers on platform PIDS to move to adjacent coaches (Coach B1 / C1).',
        timestamp: latestData.timestamp,
      });
    } else if (currentPct >= 60) {
      activeAlerts.push({
        id: 'WARN_CROWD',
        level: 'warning',
        title: 'MODERATE CROWDING ADVISORY',
        message: `Coach ${latestData?.coach_id || 'COACH-A1'} is currently at ${currentPct}% capacity. Seating availability is limited.`,
        action: 'Monitor boarding flow at next station stop.',
        timestamp: latestData.timestamp,
      });
    } else {
      activeAlerts.push({
        id: 'NORM_FLOW',
        level: 'normal',
        title: 'OPTIMAL BOARDING CAPACITY',
        message: `Coach ${latestData?.coach_id || 'COACH-A1'} is operating within comfortable occupancy range (${currentPct}% filled). Ample seating and standing space.`,
        action: 'Standard passenger boarding permitted.',
        timestamp: latestData.timestamp,
      });
    }

    if (deviceStatus !== 'active' && deviceStatus !== 'ok') {
      activeAlerts.push({
        id: 'DEV_WARN',
        level: 'warning',
        title: 'EDGE SENSOR HARDWARE ADVISORY',
        message: `Edge CV device reported non-standard status: "${deviceStatus}". Check camera FPS and lighting.`,
        action: 'Verify edge/src/main.py process output.',
        timestamp: latestData.timestamp,
      });
    }
  }

  // Scan history for past high crowding events
  const historicalAlerts = (history || [])
    .filter((r) => {
      const p = Math.round(((r.people_in_frame || 0) / (latestData?.capacity || 50)) * 100);
      return p >= 75;
    })
    .slice(-5)
    .reverse();

  return (
    <div className="alerts-panel-view">
      <div className="alerts-header-card">
        <div className="alerts-title-block">
          <div className="alert-bell-wrap">
            <Bell size={24} className="bell-icon" />
          </div>
          <div>
            <h2 className="alerts-main-title">Pune Metro Real-Time Crowding & Safety Alerts</h2>
            <p className="alerts-subtitle">
              Automated threshold monitoring derived from live coach computer vision telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Active Live Status Banner */}
      <div className="active-alerts-section">
        <h3 className="section-label">Active Real-Time Alerts</h3>

        {activeAlerts.length > 0 ? (
          <div className="alerts-list">
            {activeAlerts.map((alert) => {
              const isCrit = alert.level === 'critical';
              const isWarn = alert.level === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`alert-card ${isCrit ? 'alert-crit' : isWarn ? 'alert-warn' : 'alert-normal'}`}
                >
                  <div className="alert-icon-col">
                    {isCrit ? (
                      <AlertOctagon size={28} className="icon-crit" />
                    ) : isWarn ? (
                      <AlertTriangle size={28} className="icon-warn" />
                    ) : (
                      <CheckCircle2 size={28} className="icon-normal" />
                    )}
                  </div>
                  <div className="alert-body-col">
                    <div className="alert-top-row">
                      <span className="alert-badge-tag">{alert.level.toUpperCase()}</span>
                      <h4 className="alert-headline">{alert.title}</h4>
                      {alert.timestamp && (
                        <span className="alert-time">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="alert-message-text">{alert.message}</p>
                    <div className="alert-action-box">
                      <ArrowRight size={14} className="action-icon" />
                      <span><strong>Recommended Action:</strong> {alert.action}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <DataNotAvailable
            title="No Active Alerts"
            message="No alerts currently triggered. Telemetry is either offline or within safe nominal limits."
            reason="Evaluated from live backend records."
          />
        )}
      </div>

      {/* Threshold Reference Table */}
      <div className="card threshold-matrix-card">
        <h3 className="card-heading">Crowding Classification Matrix</h3>
        <p className="card-subheading">Standard thresholds calibrated for Pune Metro passenger information systems</p>

        <div className="threshold-grid">
          <div className="tier-box tier-green">
            <span className="tier-range">0% – 59%</span>
            <h4>Comfortable / Available</h4>
            <p>Seating available; smooth entry/exit flow; minimal platform dwell time.</p>
          </div>
          <div className="tier-box tier-amber">
            <span className="tier-range">60% – 84%</span>
            <h4>Moderate / Busy</h4>
            <p>Seating full; standing room occupied; moderate doorway congestion.</p>
          </div>
          <div className="tier-box tier-red">
            <span className="tier-range">85% – 100%+</span>
            <h4>High / Critical Congestion</h4>
            <p>Severe crowding; boarding delays likely; automated PIDS alert dispatched.</p>
          </div>
        </div>
      </div>

      {/* Historical Breach Log */}
      <div className="card breach-log-card">
        <h3 className="card-heading">Recent High-Crowding Events in Database</h3>
        {historicalAlerts.length > 0 ? (
          <div className="breach-table-wrap">
            <table className="pids-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>HEADCOUNT</th>
                  <th>CROWD LEVEL</th>
                  <th>OBSERVED OCCUPANCY</th>
                </tr>
              </thead>
              <tbody>
                {historicalAlerts.map((row, idx) => {
                  const fill = Math.round(((row.people_in_frame || 0) / (latestData?.capacity || 50)) * 100);
                  return (
                    <tr key={idx}>
                      <td>{new Date(row.timestamp).toLocaleTimeString()}</td>
                      <td><strong>{row.people_in_frame}</strong></td>
                      <td><span className="status-pill-small pill-crowded">HIGH ({fill}%)</span></td>
                      <td>{fill}% of capacity</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm py-4">No high-crowding events recorded in recent history buffer.</p>
        )}
      </div>
    </div>
  );
}

