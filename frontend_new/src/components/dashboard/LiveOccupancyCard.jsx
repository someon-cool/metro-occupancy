// frontend/src/components/dashboard/LiveOccupancyCard.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import { Users, UserMinus, Activity, Zap, CheckCircle2, Clock } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export function LiveOccupancyCard({ data }) {
  const { demoMode } = useMetro();

  // If in demoMode and no live data, use a labeled demo fallback
  const fallbackDemo = {
    people_in_frame: 24,
    vacancy: 26,
    capacity: 50,
    occupancy_pct: 48.0,
    passenger_count: 32,
    device_status: 'demo_simulated',
    timestamp: new Date().toISOString(),
    train_id: 'TRAIN-001',
    coach_id: 'COACH-A1',
  };

  const current = data || (demoMode ? fallbackDemo : null);

  if (!current) {
    return (
      <div className="card live-occupancy-empty">
        <div className="empty-indicator">
          <Activity size={32} className="spin-slow text-muted" />
          <h3>Waiting for Edge CV Telemetry</h3>
          <p>The backend is active. Start the edge device camera feed (`edge/src/main.py`) to stream real-time passenger counts.</p>
        </div>
      </div>
    );
  }

  const capacity = current.capacity || 50;
  const people = current.people_in_frame ?? 0;
  const vacancy = current.vacancy ?? Math.max(0, capacity - people);
  const pct = Math.round(Number(current.occupancy_pct || 0));
  const cumulative = current.passenger_count ?? 0;
  const status = current.device_status || 'active';

  // Compute status color
  let progressColor = 'var(--pm-green)';
  if (pct >= 85) progressColor = 'var(--pm-red)';
  else if (pct >= 60) progressColor = 'var(--pm-orange)';

  return (
    <div className="live-occupancy-hero-card">
      <div className="card-top-header">
        <div className="coach-tag">
          <span className="train-id">{current.train_id || 'TRAIN-001'}</span>
          <span className="dot-divider">•</span>
          <span className="coach-id">{current.coach_id || 'COACH-A1'}</span>
          <span className="titagarh-badge">Titagarh Firema</span>
        </div>
        <div className="top-status-group">
          {demoMode && <span className="demo-tag">SIMULATED VALUE</span>}
          <StatusBadge occupancyPct={pct} deviceStatus={status} />
        </div>
      </div>

      <div className="hero-metrics-grid">
        {/* Metric 1: Headcount In Frame */}
        <div className="metric-box primary-box">
          <div className="metric-header">
            <Users size={16} className="metric-icon" />
            <span className="metric-label">PEOPLE IN FRAME</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-num" style={{ color: progressColor }}>
              {people}
            </span>
            <span className="metric-unit">passengers</span>
          </div>
          <div className="metric-sub">
            Live headcount detected in doorways
          </div>
        </div>

        {/* Metric 2: Vacancy */}
        <div className="metric-box">
          <div className="metric-header">
            <UserMinus size={16} className="metric-icon green-icon" />
            <span className="metric-label">VACANCY AVAILABLE</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-num text-green">{vacancy}</span>
            <span className="metric-unit">/ {capacity} capacity</span>
          </div>
          <div className="metric-sub">
            Available seats & standing spots
          </div>
        </div>

        {/* Metric 3: Fill Rate % */}
        <div className="metric-box">
          <div className="metric-header">
            <Activity size={16} className="metric-icon purple-icon" />
            <span className="metric-label">COACH OCCUPANCY</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-num" style={{ color: progressColor }}>
              {pct}%
            </span>
            <span className="metric-unit">filled</span>
          </div>
          <div className="metric-sub">
            Calculated against design limit ({capacity})
          </div>
        </div>

        {/* Metric 4: Net Cumulative Passengers */}
        <div className="metric-box">
          <div className="metric-header">
            <Zap size={16} className="metric-icon orange-icon" />
            <span className="metric-label">NET CUMULATIVE FLOW</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-num text-orange">{cumulative}</span>
            <span className="metric-unit">net riders</span>
          </div>
          <div className="metric-sub">
            Total entries minus exits logged
          </div>
        </div>
      </div>

      {/* Capacity Visual Progress Bar */}
      <div className="capacity-bar-section">
        <div className="bar-labels">
          <span className="bar-title">Coach Capacity Utilization</span>
          <span className="bar-pct" style={{ color: progressColor }}>{pct}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
        <div className="capacity-markers">
          <span>0%</span>
          <span className="marker-mid">60% Moderate</span>
          <span className="marker-high">85% Crowded</span>
          <span>100%</span>
        </div>
      </div>

      <div className="card-footer-info">
        <div className="footer-item">
          <Clock size={14} className="footer-icon" />
          <span>Last Backend Telemetry: {new Date(current.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="footer-item">
          <CheckCircle2 size={14} className="footer-icon green-icon" />
          <span>Edge Device: {status.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

