// frontend/src/components/network/MetroMap.jsx
import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { PUNE_METRO_STATIONS, PUNE_METRO_LINES } from '../../constants/puneMetroData';
import { MapPin, Navigation, Eye, CheckCircle2 } from 'lucide-react';

export function MetroMap() {
  const { selectedStationId, setSelectedStationId, setActiveTab, latestData } = useMetro();
  const [hoveredStation, setHoveredStation] = useState(null);
  const [selectedLineFilter, setSelectedLineFilter] = useState('all');

  const purpleStations = PUNE_METRO_STATIONS.filter(
    (s) => s.line === 'purple-line' || s.isInterchange
  );
  const aquaStations = PUNE_METRO_STATIONS.filter(
    (s) => s.line === 'aqua-line' || s.isInterchange
  );

  const handleStationClick = (stationId) => {
    setSelectedStationId(stationId);
  };

  const handleViewStationDetails = (stationId) => {
    setSelectedStationId(stationId);
    setActiveTab('station');
  };

  // Generate SVG path for Purple Line
  const purplePoints = purpleStations.map((s) => `${s.x},${s.y}`).join(' L ');
  const purplePathData = `M ${purplePoints}`;

  // Generate SVG path for Aqua Line
  const aquaPoints = aquaStations.map((s) => `${s.x},${s.y}`).join(' L ');
  const aquaPathData = `M ${aquaPoints}`;

  return (
    <div className="card metro-network-map-card">
      <div className="map-card-header">
        <div>
          <h3 className="card-heading">Pune Metro Interactive Network Map</h3>
          <p className="card-subheading">
            Schematic Corridor Visualization · Select a station node to inspect occupancy details
          </p>
        </div>

        {/* Filter Controls */}
        <div className="line-filter-group">
          <button
            onClick={() => setSelectedLineFilter('all')}
            className={`filter-btn ${selectedLineFilter === 'all' ? 'active' : ''}`}
          >
            All Lines (29)
          </button>
          <button
            onClick={() => setSelectedLineFilter('purple-line')}
            className={`filter-btn purple-btn ${selectedLineFilter === 'purple-line' ? 'active' : ''}`}
          >
            Purple Line (14)
          </button>
          <button
            onClick={() => setSelectedLineFilter('aqua-line')}
            className={`filter-btn aqua-btn ${selectedLineFilter === 'aqua-line' ? 'active' : ''}`}
          >
            Aqua Line (15)
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="svg-map-container">
        <svg
          viewBox="100 40 880 540"
          className="metro-svg-canvas"
          role="img"
          aria-label="Pune Metro Network Schematic"
        >
          <defs>
            {/* Glow filters */}
            <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.6" />
            </filter>
            <filter id="aqua-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284C7" floodOpacity="0.6" />
            </filter>
            <filter id="interchange-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FF6B00" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid Background Lines for Metro Blueprint Aesthetic */}
          <g className="blueprint-grid" opacity="0.15">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`gx-${i}`} x1={100 + i * 100} y1="40" x2={100 + i * 100} y2="580" stroke="#94A3B8" strokeDasharray="3 3" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`gy-${i}`} x1="100" y1={50 + i * 100} x2="980" y2={50 + i * 100} stroke="#94A3B8" strokeDasharray="3 3" />
            ))}
          </g>

          {/* Line 1: Purple Line Track */}
          {(selectedLineFilter === 'all' || selectedLineFilter === 'purple-line') && (
            <path
              d={purplePathData}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#purple-glow)"
              className="line-track"
            />
          )}

          {/* Line 2: Aqua Line Track */}
          {(selectedLineFilter === 'all' || selectedLineFilter === 'aqua-line') && (
            <path
              d={aquaPathData}
              fill="none"
              stroke="#0284C7"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#aqua-glow)"
              className="line-track"
            />
          )}

          {/* Station Nodes */}
          {PUNE_METRO_STATIONS.map((station) => {
            const isPurple = station.line === 'purple-line';
            const isAqua = station.line === 'aqua-line';
            const isInterchange = station.isInterchange;

            // Check if filtered out
            if (selectedLineFilter === 'purple-line' && !isPurple && !isInterchange) return null;
            if (selectedLineFilter === 'aqua-line' && !isAqua && !isInterchange) return null;

            const isSelected = selectedStationId === station.id;
            const isHovered = hoveredStation === station.id;
            const hasStream = station.hasCameraStream;

            const nodeFill = isInterchange ? '#FFFFFF' : isPurple ? '#7C3AED' : '#0284C7';
            const nodeStroke = isInterchange ? '#FF6B00' : isSelected ? '#FFFFFF' : '#0F172A';
            const strokeWidth = isInterchange ? 4 : isSelected ? 3 : 2;
            const radius = isInterchange ? 11 : isSelected ? 8 : 6;

            return (
              <g
                key={station.id}
                className={`station-node-group ${isSelected ? 'selected' : ''}`}
                onClick={() => handleStationClick(station.id)}
                onMouseEnter={() => setHoveredStation(station.id)}
                onMouseLeave={() => setHoveredStation(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Active Monitored Pulse Ring for Civil Court */}
                {hasStream && (
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={radius + 10}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    className="telemetry-beacon-ring"
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={radius + 6}
                    fill="none"
                    stroke="#FF6B00"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={radius}
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={strokeWidth}
                />

                {/* Station Label */}
                <text
                  x={station.x}
                  y={station.y + (station.y > 400 && !isInterchange ? 18 : -14)}
                  textAnchor="middle"
                  className={`svg-station-label ${isSelected ? 'selected-label' : ''}`}
                  fill={isSelected ? '#FF6B00' : '#E2E8F0'}
                  fontSize={isInterchange ? '13' : '10'}
                  fontWeight={isInterchange || isSelected ? '700' : '500'}
                  fontFamily="'Inter', sans-serif"
                >
                  {station.name.replace(' (Pimpri Chinchwad)', '').replace(' (Interchange)', '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Map Legend */}
      <div className="map-legend-bar">
        <div className="legend-entry">
          <span className="legend-line-sample purple-sample" />
          <span>Purple Line (Line 1 · PCMC ↔ Swargate)</span>
        </div>
        <div className="legend-entry">
          <span className="legend-line-sample aqua-sample" />
          <span>Aqua Line (Line 2 · Vanaz ↔ Ramwadi)</span>
        </div>
        <div className="legend-entry">
          <span className="interchange-sample-circle" />
          <span>Civil Court Interchange</span>
        </div>
        <div className="legend-entry">
          <span className="beacon-sample-circle" />
          <span>Active Edge Telemetry Node (Coach A1)</span>
        </div>
      </div>
    </div>
  );
}

