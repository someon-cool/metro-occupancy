// frontend/src/components/dashboard/CoachDiagram.jsx
import React from 'react';
import { Camera, Eye, ShieldCheck, Check } from 'lucide-react';

export function CoachDiagram({ data }) {
  const people = data?.people_in_frame ?? 0;
  const capacity = data?.capacity ?? 50;
  const pct = Math.min(Math.round((people / capacity) * 100), 100);

  // Dynamic color
  let accentColor = 'var(--pm-green)';
  if (pct >= 85) accentColor = 'var(--pm-red)';
  else if (pct >= 60) accentColor = 'var(--pm-orange)';

  // Generate simulated seat spots for visual passenger occupancy representation
  const totalSlots = 24; // Visual seat representation
  const occupiedSlots = Math.min(Math.round((pct / 100) * totalSlots), totalSlots);

  return (
    <div className="card coach-schematic-card">
      <div className="schematic-header">
        <div>
          <h3 className="card-heading">Rake Architecture & Doorway Sensor Map</h3>
          <p className="card-subheading">
            Pune Metro 3-Car Rake (Titagarh Firema) · Active Sensor: Doorway Virtual Line
          </p>
        </div>
        <div className="active-cam-badge">
          <Camera size={14} className="cam-icon" />
          <span>YOLOv8 Edge Camera Active</span>
        </div>
      </div>

      {/* Train 3-Car Rake Overview */}
      <div className="rake-visual-row">
        <div className="coach-car active-car" style={{ borderColor: accentColor }}>
          <div className="car-tag">
            <span className="car-label">COACH A1 (Active CV)</span>
            <span className="car-pct" style={{ color: accentColor }}>{data ? `${pct}%` : 'Waiting'}</span>
          </div>
          <div className="car-door left-door" />
          <div className="car-door right-door" />
          <div className="counting-gate-marker">
            <div className="gate-line" />
            <span className="gate-text">Virtual Counting Line</span>
          </div>
        </div>

        <div className="gangway" />

        <div className="coach-car unmonitored-car">
          <div className="car-tag">
            <span className="car-label">COACH B1 (Middle)</span>
            <span className="car-status-sub">Sensor Pending</span>
          </div>
          <div className="car-door left-door" />
          <div className="car-door right-door" />
        </div>

        <div className="gangway" />

        <div className="coach-car unmonitored-car">
          <div className="car-tag">
            <span className="car-label">COACH C1 (Cab Car)</span>
            <span className="car-status-sub">Sensor Pending</span>
          </div>
          <div className="car-door left-door" />
          <div className="car-door right-door" />
        </div>
      </div>

      {/* Coach A1 Detailed Seating Grid */}
      <div className="coach-interior-view">
        <div className="interior-legend">
          <span className="legend-title">Coach A1 Passenger Distribution ({people} / {capacity}):</span>
          <div className="legend-items">
            <div className="leg-item"><span className="dot dot-occupied" style={{ background: accentColor }} /> Detected Rider</div>
            <div className="leg-item"><span className="dot dot-free" /> Vacant Slot</div>
          </div>
        </div>

        <div className="seat-grid">
          {Array.from({ length: totalSlots }).map((_, idx) => {
            const isOccupied = idx < occupiedSlots;
            return (
              <div
                key={idx}
                className={`seat-slot ${isOccupied ? 'occupied' : 'vacant'}`}
                style={isOccupied ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                title={isOccupied ? 'Occupied Position' : 'Vacant Position'}
              >
                {isOccupied && <span className="rider-dot" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="schematic-footer">
        <Eye size={14} className="text-muted" />
        <span>Computer Vision Gate: Calibrated at 15px threshold with 90-frame track hysteresis filter.</span>
      </div>
    </div>
  );
}

