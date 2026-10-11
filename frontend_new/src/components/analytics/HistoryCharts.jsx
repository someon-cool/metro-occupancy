// frontend/src/components/analytics/HistoryCharts.jsx
import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { BarChart2, TrendingUp, Users, UserMinus, Hash, Activity } from 'lucide-react';
import { DataNotAvailable } from '../common/DataNotAvailable';

export function HistoryCharts({ history, capacity = 50 }) {
  const [selectedMetric, setSelectedMetric] = useState('people'); // 'people' | 'pct' | 'vacancy' | 'cumul'
  const [recordLimit, setRecordLimit] = useState(20);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="card analytics-empty-card">
        <DataNotAvailable
          title="No Historical Ingest Records in Database"
          message="The backend database has no occupancy records stored yet for coach COACH-A1. When the edge detection system starts posting telemetry, time-series charts will automatically appear here."
          reason="Backend endpoint /occupancy/history returned an empty record set."
        />
      </div>
    );
  }

  // Sliced according to recordLimit
  const dataSlice = history.slice(-recordLimit);

  // Computed statistics
  const headcounts = dataSlice.map((r) => r.people_in_frame ?? 0);
  const maxHeadcount = Math.max(...headcounts);
  const minHeadcount = Math.min(...headcounts);
  const avgHeadcount = (headcounts.reduce((a, b) => a + b, 0) / headcounts.length).toFixed(1);
  const maxPct = Math.round((maxHeadcount / capacity) * 100);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 260;
  const paddingX = 50;
  const paddingY = 40;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Compute values for selectedMetric
  let metricValues = [];
  let maxValue = 50;
  let metricLabel = 'People In Frame';
  let metricColor = '#38BDF8'; // Accent blue

  if (selectedMetric === 'people') {
    metricValues = dataSlice.map((r) => r.people_in_frame ?? 0);
    maxValue = Math.max(capacity, ...metricValues);
    metricLabel = 'In-Frame Headcount';
    metricColor = '#38BDF8';
  } else if (selectedMetric === 'pct') {
    metricValues = dataSlice.map((r) => Math.round(((r.people_in_frame ?? 0) / capacity) * 100));
    maxValue = 100;
    metricLabel = 'Occupancy Percentage (%)';
    metricColor = '#7C3AED';
  } else if (selectedMetric === 'vacancy') {
    metricValues = dataSlice.map((r) => r.vacancy ?? Math.max(0, capacity - (r.people_in_frame ?? 0)));
    maxValue = capacity;
    metricLabel = 'Available Vacancy Spots';
    metricColor = '#10B981';
  } else if (selectedMetric === 'cumul') {
    metricValues = dataSlice.map((r) => r.passenger_count ?? 0);
    const maxCum = Math.max(...metricValues, 10);
    maxValue = maxCum;
    metricLabel = 'Cumulative Passenger Flow';
    metricColor = '#FF6B00';
  }

  // Calculate coordinates
  const points = metricValues.map((val, idx) => {
    const x = paddingX + (idx / Math.max(metricValues.length - 1, 1)) * plotWidth;
    const y = paddingY + plotHeight - (val / Math.max(maxValue, 1)) * plotHeight;
    return { x, y, val, record: dataSlice[idx] };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Create SVG Area polygon
  const areaPoints = `${paddingX},${paddingY + plotHeight} ` +
    polylinePoints +
    ` ${paddingX + plotWidth},${paddingY + plotHeight}`;

  return (
    <div className="card analytics-chart-card">
      <div className="chart-header-row">
        <div>
          <h3 className="card-heading">Historical Occupancy Trends</h3>
          <p className="card-subheading">
            Live time-series analysis directly from backend telemetry records ({dataSlice.length} samples)
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="metric-toggle-group">
          <button
            onClick={() => setSelectedMetric('people')}
            className={`metric-tab ${selectedMetric === 'people' ? 'active' : ''}`}
          >
            <Users size={14} /> Headcount
          </button>
          <button
            onClick={() => setSelectedMetric('pct')}
            className={`metric-tab ${selectedMetric === 'pct' ? 'active' : ''}`}
          >
            <Activity size={14} /> Occupancy %
          </button>
          <button
            onClick={() => setSelectedMetric('vacancy')}
            className={`metric-tab ${selectedMetric === 'vacancy' ? 'active' : ''}`}
          >
            <UserMinus size={14} /> Vacancy
          </button>
          <button
            onClick={() => setSelectedMetric('cumul')}
            className={`metric-tab ${selectedMetric === 'cumul' ? 'active' : ''}`}
          >
            <Hash size={14} /> Cumulative
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="stats-kpi-bar">
        <div className="kpi-block">
          <span className="kpi-label">PEAK HEADCOUNT</span>
          <span className="kpi-num text-orange">{maxHeadcount}</span>
          <span className="kpi-sub">({maxPct}% peak)</span>
        </div>
        <div className="kpi-block">
          <span className="kpi-label">MIN HEADCOUNT</span>
          <span className="kpi-num text-green">{minHeadcount}</span>
          <span className="kpi-sub">lowest observed</span>
        </div>
        <div className="kpi-block">
          <span className="kpi-label">MEAN OCCUPANCY</span>
          <span className="kpi-num text-accent">{avgHeadcount}</span>
          <span className="kpi-sub">average riders</span>
        </div>
        <div className="kpi-block">
          <span className="kpi-label">TOTAL INGESTED</span>
          <span className="kpi-num text-purple">{history.length}</span>
          <span className="kpi-sub">database events</span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="time-series-svg"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={metricColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={paddingX + plotWidth} y2={paddingY} stroke="#1E293B" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + plotHeight * 0.5} x2={paddingX + plotWidth} y2={paddingY + plotHeight * 0.5} stroke="#1E293B" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + plotHeight} x2={paddingX + plotWidth} y2={paddingY + plotHeight} stroke="#334155" />

          {/* Y Axis Tick Labels */}
          <text x={paddingX - 10} y={paddingY + 4} fill="#64748B" fontSize="11" textAnchor="end">{maxValue}</text>
          <text x={paddingX - 10} y={paddingY + plotHeight * 0.5 + 4} fill="#64748B" fontSize="11" textAnchor="end">{Math.round(maxValue / 2)}</text>
          <text x={paddingX - 10} y={paddingY + plotHeight + 4} fill="#64748B" fontSize="11" textAnchor="end">0</text>

          {/* Shaded Area */}
          <polygon points={areaPoints} fill="url(#chart-area-grad)" />

          {/* Main Trend Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke={metricColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredPoint && hoveredPoint.idx === i;
            return (
              <g key={i} onMouseEnter={() => setHoveredPoint({ ...pt, idx: i })}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#FFFFFF' : metricColor}
                  stroke="#0F172A"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {points.length > 0 && (
            <>
              <text x={paddingX} y={svgHeight - 12} fill="#64748B" fontSize="10" textAnchor="start">
                {points[0].record?.timestamp ? new Date(points[0].record.timestamp).toLocaleTimeString() : 'Earlier'}
              </text>
              <text x={paddingX + plotWidth} y={svgHeight - 12} fill="#64748B" fontSize="10" textAnchor="end">
                {points[points.length - 1].record?.timestamp
                  ? new Date(points[points.length - 1].record.timestamp).toLocaleTimeString()
                  : 'Latest'}
              </text>
            </>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            }}
          >
            <div className="tooltip-time">
              {hoveredPoint.record?.timestamp
                ? new Date(hoveredPoint.record.timestamp).toLocaleTimeString()
                : '–'}
            </div>
            <div className="tooltip-metric">
              {metricLabel}: <strong>{hoveredPoint.val}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="chart-footer-note">
        <span>Displaying actual telemetry records retrieved from <code>GET /occupancy/history</code>.</span>
      </div>
    </div>
  );
}

