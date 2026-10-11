// frontend/src/components/pages/HomeOverview.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import {
  Activity,
  Map,
  MapPin,
  Sparkles,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Video,
  Radio,
  TrainTrack,
  Users,
} from 'lucide-react';
import { PUNE_METRO_LINES, PUNE_METRO_STATIONS, ACTIVE_FLEET } from '../../constants/puneMetroData';
import { StatusBadge } from '../common/StatusBadge';

export function HomeOverview() {
  const { latestData, hasData, backendOnline, setActiveTab } = useMetro();

  const pct = latestData ? Math.round(Number(latestData.occupancy_pct || 0)) : null;

  return (
    <div className="home-overview-page">
      {/* Hero Welcome Banner */}
      <div className="overview-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>MAHA METRO · PUNE METRO RAIL PROJECT</span>
          </div>
          <h2 className="hero-title">
            AI-Based Real-Time Metro Coach Occupancy System
          </h2>
          <p className="hero-description">
            Automated passenger density monitoring and predictive analytics for Pune Metro rail operations.
            Powered by edge YOLOv8 computer vision line-crossing trackers streaming to high-performance telemetry endpoints.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="cta-primary-btn"
            >
              <Activity size={18} />
              <span>View Live Coach Telemetry</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className="cta-secondary-btn"
            >
              <Map size={18} />
              <span>Explore Metro Network</span>
            </button>
          </div>
        </div>

        {/* Live Rake Telemetry Snapshot Widget */}
        <div className="hero-snapshot-widget">
          <div className="widget-header">
            <div className="widget-title-group">
              <span className="widget-title">ACTIVE RAKE TELEMETRY</span>
              <span className="widget-train-id">{ACTIVE_FLEET.TRAIN_ID} · {ACTIVE_FLEET.COACH_ID}</span>
            </div>
            {pct !== null ? (
              <StatusBadge occupancyPct={pct} deviceStatus={latestData?.device_status} size="sm" />
            ) : (
              <span className="badge-standby">AWAITING FEED</span>
            )}
          </div>

          <div className="widget-body">
            <div className="widget-stat-circle">
              <span className="stat-circle-num">{pct !== null ? `${pct}%` : '–'}</span>
              <span className="stat-circle-label">OCCUPANCY</span>
            </div>

            <div className="widget-metrics-list">
              <div className="w-metric-row">
                <span className="w-metric-label">In-Frame Count:</span>
                <span className="w-metric-val">{latestData ? `${latestData.people_in_frame} pax` : '–'}</span>
              </div>
              <div className="w-metric-row">
                <span className="w-metric-label">Available Vacancy:</span>
                <span className="w-metric-val text-green">{latestData ? `${latestData.vacancy} spots` : '–'}</span>
              </div>
              <div className="w-metric-row">
                <span className="w-metric-label">Assigned Sector:</span>
                <span className="w-metric-val">Civil Court Hub</span>
              </div>
              <div className="w-metric-row">
                <span className="w-metric-label">Backend Feed:</span>
                <span className={`w-metric-val ${backendOnline ? 'text-green' : 'text-red'}`}>
                  {backendOnline ? 'CONNECTED' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Summary Counters */}
      <div className="network-summary-grid">
        <div className="card summary-card">
          <div className="summary-icon-wrap purple-icon">
            <TrainTrack size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">LINE 1 (PURPLE LINE)</span>
            <span className="summary-num">14 Stations</span>
            <span className="summary-sub">PCMC Bhavan ↔ Swargate (16.6 km)</span>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-icon-wrap aqua-icon">
            <TrainTrack size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">LINE 2 (AQUA LINE)</span>
            <span className="summary-num">15 Stations</span>
            <span className="summary-sub">Vanaz ↔ Ramwadi (14.7 km)</span>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-icon-wrap orange-icon">
            <MapPin size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">CENTRAL INTERCHANGE</span>
            <span className="summary-num">Civil Court Hub</span>
            <span className="summary-sub">Multi-modal underground & elevated junction</span>
          </div>
        </div>

        <div className="card summary-card">
          <div className="summary-icon-wrap green-icon">
            <Video size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">EDGE CV CAMERA</span>
            <span className="summary-num">YOLOv8 Nano</span>
            <span className="summary-sub">Doorway directional entry/exit tracking</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="quick-access-section">
        <h3 className="section-title">System Modules & Operations</h3>
        <div className="access-cards-grid">
          <div onClick={() => setActiveTab('dashboard')} className="access-card">
            <div className="access-head">
              <Activity size={20} className="text-accent" />
              <h4>Live Occupancy HUD</h4>
            </div>
            <p>Real-time headcount, capacity utilization bar, coach layout schematic, and streaming telemetry log.</p>
            <div className="access-link">Open Dashboard <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => setActiveTab('network')} className="access-card">
            <div className="access-head">
              <Map size={20} className="text-purple" />
              <h4>Metro Network Map</h4>
            </div>
            <p>Interactive Pune Metro schematic visualization. Click station nodes to inspect corridors and line transfers.</p>
            <div className="access-link">Explore Map <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => setActiveTab('prediction')} className="access-card">
            <div className="access-head">
              <Sparkles size={20} className="text-orange" />
              <h4>AI Prediction Engine</h4>
            </div>
            <p>Time-series forecasting models (XGBoost, LSTM) developed in Metro.ipynb with horizon simulation.</p>
            <div className="access-link">View AI Model <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => setActiveTab('analytics')} className="access-card">
            <div className="access-head">
              <BarChart2 size={20} className="text-green" />
              <h4>Historical Analytics</h4>
            </div>
            <p>Interactive trend charts of passenger headcount, occupancy rate %, and net cumulative flow from database logs.</p>
            <div className="access-link">View Trends <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => setActiveTab('alerts')} className="access-card">
            <div className="access-head">
              <AlertTriangle size={20} className="text-red" />
              <h4>Crowding Alerts</h4>
            </div>
            <p>Automated safety and congestion threshold warnings computed directly from live backend records.</p>
            <div className="access-link">Check Alerts <ArrowRight size={14} /></div>
          </div>

          <div onClick={() => setActiveTab('system')} className="access-card">
            <div className="access-head">
              <Radio size={20} className="text-accent" />
              <h4>System Diagnostics</h4>
            </div>
            <p>Backend heartbeat status, roundtrip latency monitor, database connection, and API catalog.</p>
            <div className="access-link">View Diagnostics <ArrowRight size={14} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

