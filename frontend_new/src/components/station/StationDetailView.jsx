// frontend/src/components/station/StationDetailView.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import { PUNE_METRO_STATIONS, PUNE_METRO_LINES, ACTIVE_FLEET } from '../../constants/puneMetroData';
import { MapPin, Navigation, Radio, Users, Activity, Clock, ShieldCheck, VideoOff } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { DataNotAvailable } from '../common/DataNotAvailable';

export function StationDetailView() {
  const { selectedStationId, setSelectedStationId, latestData, history, demoMode } = useMetro();

  const station = PUNE_METRO_STATIONS.find((s) => s.id === selectedStationId) || PUNE_METRO_STATIONS[10];
  const isMonitoredStation = station.hasCameraStream || selectedStationId === 'STN-INT';

  const isPurple = station.line === 'purple-line';
  const isAqua = station.line === 'aqua-line';
  const isInterchange = station.isInterchange;

  const current = isMonitoredStation ? latestData : null;
  const pct = current ? Math.round(Number(current.occupancy_pct || 0)) : 0;
  const capacity = current?.capacity || 50;

  return (
    <div className="station-details-view">
      {/* Station Header Billboard */}
      <div className="station-billboard">
        <div className="billboard-top">
          <div className="station-badge-group">
            <span
              className="line-tag-pill"
              style={{
                backgroundColor: isInterchange ? '#FF6B00' : isPurple ? '#7C3AED' : '#0284C7',
              }}
            >
              {isInterchange ? 'INTERCHANGE STATION' : isPurple ? 'PURPLE LINE (LINE 1)' : 'AQUA LINE (LINE 2)'}
            </span>
            <span className="station-type-pill">{station.type}</span>
          </div>

          <div className="station-code-circle">
            <span>{station.code}</span>
          </div>
        </div>

        <div className="station-title-block">
          <h2 className="station-main-title">{station.name}</h2>
          <div className="station-marathi-large">{station.marathiName}</div>
        </div>

        <div className="station-meta-row">
          <div className="meta-item">
            <span className="meta-label">Station ID:</span>
            <span className="meta-val">{station.id}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Sector:</span>
            <span className="meta-val">
              {isInterchange ? 'Central Interchange Hub' : isPurple ? 'PCMC – Swargate Corridor' : 'Vanaz – Ramwadi Corridor'}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Sensors:</span>
            <span className="meta-val">
              {isMonitoredStation ? '1 Active Edge Doorway Camera' : 'Pending Gateway Rollout'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry vs Honest Empty State */}
      <div className="station-content-grid">
        {/* Left Column: Live Occupancy Telemetry */}
        <div className="station-telemetry-col">
          {isMonitoredStation && current ? (
            <div className="card station-live-card">
              <div className="card-top-header">
                <div>
                  <h3 className="card-heading">Active Coach Telemetry</h3>
                  <p className="card-subheading">
                    Reporting from Train: {current.train_id} · Coach: {current.coach_id}
                  </p>
                </div>
                <StatusBadge occupancyPct={pct} deviceStatus={current.device_status} />
              </div>

              <div className="station-stats-row">
                <div className="stat-unit">
                  <span className="stat-unit-label">IN FRAME HEADCOUNT</span>
                  <span className="stat-unit-val text-accent">{current.people_in_frame}</span>
                  <span className="stat-unit-sub">Passengers detected right now</span>
                </div>
                <div className="stat-unit">
                  <span className="stat-unit-label">REMAINING VACANCY</span>
                  <span className="stat-unit-val text-green">{current.vacancy}</span>
                  <span className="stat-unit-sub">of {capacity} spots open</span>
                </div>
                <div className="stat-unit">
                  <span className="stat-unit-label">CUMULATIVE NET PASSENGERS</span>
                  <span className="stat-unit-val text-orange">{current.passenger_count}</span>
                  <span className="stat-unit-sub">Entries minus exits logged</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="bar-labels">
                  <span>Capacity Utilization</span>
                  <span>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 85 ? 'var(--pm-red)' : pct >= 60 ? 'var(--pm-orange)' : 'var(--pm-green)',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="card station-live-card">
              <DataNotAvailable
                title="Station-Level Sensor Telemetry Not Connected"
                message={`The edge computer vision camera pipeline is currently deployed on Coach A1 of Train TRAIN-001. Station platform cameras for ${station.name} are not currently streaming to this backend instance.`}
                reason="Backend DB only contains train coach telemetry (coaches table). No station-level CCTV feed is connected."
                icon={VideoOff}
              />
            </div>
          )}

          {/* Historical Trends for this station/coach */}
          <div className="card station-history-card">
            <h3 className="card-heading">Station Historical Occupancy</h3>
            {isMonitoredStation && history && history.length > 0 ? (
              <div>
                <p className="card-subheading">Recent observations from active rake at this station</p>
                <div className="mini-history-list">
                  {history.slice(-5).reverse().map((rec, i) => (
                    <div key={i} className="mini-hist-item">
                      <span className="hist-time">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : '–'}
                      </span>
                      <span className="hist-people">In Frame: {rec.people_in_frame}</span>
                      <span className="hist-vacancy">Vacancy: {rec.vacancy}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <DataNotAvailable
                title="Historical Telemetry Not Available"
                message={`No historical occupancy logs found for ${station.name} in the backend database.`}
                reason="Backend stores records by coach_id (COACH-A1). Station-level historical aggregations are not present."
              />
            )}
          </div>
        </div>

        {/* Right Column: AI Model Prediction Status for Station */}
        <div className="station-ai-col">
          <div className="card station-ai-card">
            <h3 className="card-heading">AI Predictive Horizon (Station Level)</h3>
            <p className="card-subheading">
              10-minute Inflow/Outflow Forecasting Model
            </p>

            <DataNotAvailable
              title="Station Inflow Prediction Offline"
              message={`Forecasting models (XGBoost/LSTM lag models developed in backend/app/Metro.ipynb) require continuous station turnstile inflow data to forecast future arrival density.`}
              reason="Backend FastAPI currently has no /predict endpoint or station-level inflow model deployed."
            />

            <div className="model-arch-box">
              <h4 className="arch-title">Model Specifications from Metro.ipynb:</h4>
              <ul className="arch-list">
                <li>• <strong>Baseline:</strong> Historical mean lag-10</li>
                <li>• <strong>XGBoost:</strong> Multi-lag regression with calendar features</li>
                <li>• <strong>LSTM:</strong> 2-layer Recurrent Neural Network with Dropout</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

