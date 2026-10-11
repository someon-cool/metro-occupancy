// frontend/src/components/prediction/AIPredictionView.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import { Sparkles, Activity, Clock, TrendingUp, AlertCircle, Cpu, ShieldCheck } from 'lucide-react';
import { DataNotAvailable } from '../common/DataNotAvailable';

export function AIPredictionView() {
  const { latestData, demoMode, setDemoMode } = useMetro();

  const currentPct = latestData ? Math.round(Number(latestData.occupancy_pct || 0)) : null;
  const currentHeadcount = latestData?.people_in_frame ?? null;

  // Simulated predictions for DEMO MODE only
  const demoHorizonData = [
    { horizon: 'Now', time: '10:00', actual: currentHeadcount || 18, predicted: currentHeadcount || 18 },
    { horizon: '+10 min', time: '10:10', actual: null, predicted: 24, upper: 28, lower: 20 },
    { horizon: '+20 min', time: '10:20', actual: null, predicted: 31, upper: 36, lower: 26 },
    { horizon: '+30 min', time: '10:30', actual: null, predicted: 38, upper: 44, lower: 32 },
    { horizon: '+40 min', time: '10:40', actual: null, predicted: 29, upper: 35, lower: 23 },
    { horizon: '+50 min', time: '10:50', actual: null, predicted: 22, upper: 27, lower: 17 },
    { horizon: '+60 min', time: '10:60', actual: null, predicted: 19, upper: 24, lower: 14 },
  ];

  return (
    <div className="ai-prediction-view">
      {/* Header Banner */}
      <div className="prediction-header-card">
        <div className="pred-title-group">
          <div className="sparkle-icon-wrap">
            <Sparkles size={24} className="sparkle-icon" />
          </div>
          <div>
            <h2 className="pred-main-title">AI Coach Occupancy Prediction Engine</h2>
            <p className="pred-subtitle">
              Time-Series Passenger Flow Forecasting · Based on LSTM & XGBoost Models (backend/app/Metro.ipynb)
            </p>
          </div>
        </div>

        <div className="pred-mode-toggle">
          <span className="toggle-label">Demo Simulation:</span>
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`demo-btn-pill ${demoMode ? 'on' : 'off'}`}
          >
            {demoMode ? 'DEMO SIMULATION ON' : 'ENABLE DEMO MODE'}
          </button>
        </div>
      </div>

      {/* Grid: Current Live vs Prediction Horizon */}
      <div className="pred-grid-top">
        {/* Metric 1: Real Live Current Occupancy */}
        <div className="card pred-stat-card">
          <div className="stat-head">
            <Activity size={16} className="text-accent" />
            <span className="stat-label">CURRENT LIVE OCCUPANCY</span>
            <span className="source-tag">REAL BACKEND</span>
          </div>
          <div className="stat-body">
            {currentPct !== null ? (
              <>
                <div className="stat-hero-number">{currentPct}%</div>
                <div className="stat-sub-text">
                  {currentHeadcount} passengers in frame ({latestData?.coach_id || 'COACH-A1'})
                </div>
              </>
            ) : (
              <div className="stat-null">No live telemetry</div>
            )}
          </div>
        </div>

        {/* Metric 2: Future Predicted Occupancy */}
        <div className="card pred-stat-card">
          <div className="stat-head">
            <TrendingUp size={16} className="text-purple" />
            <span className="stat-label">FUTURE PREDICTED OCCUPANCY</span>
            {demoMode && <span className="demo-badge-mini">DEMO SIMULATED</span>}
          </div>
          <div className="stat-body">
            {demoMode ? (
              <>
                <div className="stat-hero-number text-purple">62%</div>
                <div className="stat-sub-text text-amber">
                  Forecasted at peak +30 min horizon (38 riders)
                </div>
              </>
            ) : (
              <div className="data-unavailable-pill">
                <span>Data not available</span>
                <span className="sub">API endpoint /predict not exposed</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Prediction Horizon */}
        <div className="card pred-stat-card">
          <div className="stat-head">
            <Clock size={16} className="text-orange" />
            <span className="stat-label">PREDICTION HORIZON</span>
            {demoMode && <span className="demo-badge-mini">DEMO SIMULATED</span>}
          </div>
          <div className="stat-body">
            {demoMode ? (
              <>
                <div className="stat-hero-number text-orange">+10 to +60 min</div>
                <div className="stat-sub-text">Lag-10 sliding interval formulation</div>
              </>
            ) : (
              <div className="data-unavailable-pill">
                <span>Data not available</span>
                <span className="sub">Pending inference pipeline</span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 4: Model Confidence */}
        <div className="card pred-stat-card">
          <div className="stat-head">
            <ShieldCheck size={16} className="text-green" />
            <span className="stat-label">MODEL CONFIDENCE</span>
            {demoMode && <span className="demo-badge-mini">DEMO SIMULATED</span>}
          </div>
          <div className="stat-body">
            {demoMode ? (
              <>
                <div className="stat-hero-number text-green">89.4%</div>
                <div className="stat-sub-text">LSTM test set confidence bound</div>
              </>
            ) : (
              <div className="data-unavailable-pill">
                <span>Data not available</span>
                <span className="sub">Backend schema omits confidence metric</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actual vs Predicted Visualization */}
      <div className="card pred-chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="card-heading">Actual vs Predicted Occupancy Trajectory</h3>
            <p className="card-subheading">
              {demoMode
                ? 'Simulated trajectory demonstrating LSTM 10-minute lag forecasting with confidence interval envelope'
                : 'Live backend telemetry stream (predictive curve requires inference endpoint integration)'}
            </p>
          </div>
          {demoMode && <span className="demo-pill-alert">DEMO SIMULATION ACTIVE</span>}
        </div>

        {demoMode ? (
          <div className="demo-forecast-chart">
            <svg viewBox="0 0 700 240" className="forecast-svg">
              {/* Grid Lines */}
              <line x1="50" y1="30" x2="680" y2="30" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="50" y1="80" x2="680" y2="80" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="50" y1="130" x2="680" y2="130" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="50" y1="180" x2="680" y2="180" stroke="#1E293B" strokeDasharray="3 3" />

              {/* Y Axis labels */}
              <text x="35" y="35" fill="#64748B" fontSize="11" textAnchor="end">50 (100%)</text>
              <text x="35" y="85" fill="#64748B" fontSize="11" textAnchor="end">37 (75%)</text>
              <text x="35" y="135" fill="#64748B" fontSize="11" textAnchor="end">25 (50%)</text>
              <text x="35" y="185" fill="#64748B" fontSize="11" textAnchor="end">12 (25%)</text>

              {/* Confidence interval area band */}
              <polygon
                points="100,146 190,122 280,98 370,74 460,101 550,125 640,134 640,170 550,161 460,137 370,110 280,128 190,146 100,146"
                fill="rgba(124, 58, 237, 0.15)"
              />

              {/* Predicted Line (Purple dashed) */}
              <polyline
                points="100,146 190,134 280,113 370,92 460,119 550,140 640,152"
                fill="none"
                stroke="#A855F7"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Actual Line (Green solid) for past */}
              <polyline
                points="100,146"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
              />

              {/* Points */}
              {demoHorizonData.map((d, i) => {
                const cx = 100 + i * 90;
                const cy = 200 - (d.predicted / 50) * 150;
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="5" fill="#A855F7" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={cx} y="220" fill="#94A3B8" fontSize="11" textAnchor="middle">{d.horizon}</text>
                    <text x={cx} y={cy - 12} fill="#E2E8F0" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {d.predicted}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="chart-legend-row">
              <div className="leg-item">
                <span className="leg-line-solid green" /> Actual Live Count ({currentHeadcount || 18})
              </div>
              <div className="leg-item">
                <span className="leg-line-dashed purple" /> LSTM Predicted Trend
              </div>
              <div className="leg-item">
                <span className="leg-band-sample" /> 95% Confidence Interval Band
              </div>
            </div>
          </div>
        ) : (
          <div className="live-prediction-unavailable-box">
            <DataNotAvailable
              title="Predictive Visualization Awaiting Model Deployment"
              message="The machine learning models developed in backend/app/Metro.ipynb (Baseline, XGBoost, and LSTM) have been benchmarked on historical metro inflow data. However, the backend currently exposes only the live edge CV ingestion endpoints (/occupancy, /occupancy/latest, /occupancy/history)."
              reason="No predictive API endpoint exists in backend/app/main.py. In adherence to project guidelines, fake prediction values are not shown in live mode."
              actionText="Preview Model Prediction in Demo Mode"
              onAction={() => setDemoMode(true)}
            />
          </div>
        )}
      </div>

      {/* Model Technical Architecture Overview */}
      <div className="card model-details-card">
        <h3 className="card-heading">Model Technical Specification (backend/app/Metro.ipynb)</h3>
        <div className="models-comparison-grid">
          <div className="model-box">
            <div className="model-badge">MODEL 1</div>
            <h4>Historical Baseline</h4>
            <p>Moving average with 10-minute historical lag indexing.</p>
            <div className="metric-tag">Lag Index: 1 = previous 10 min</div>
          </div>
          <div className="model-box">
            <div className="model-badge xgb">MODEL 2</div>
            <h4>XGBoost Regressor</h4>
            <p>Gradient-boosted decision trees trained with calendar, hourly, and lag features.</p>
            <div className="metric-tag">Optimized RMSE</div>
          </div>
          <div className="model-box">
            <div className="model-badge lstm">MODEL 3</div>
            <h4>Deep LSTM (Keras)</h4>
            <p>Sequential Long Short-Term Memory network with Dropout regularization for temporal patterns.</p>
            <div className="metric-tag">Sequential Sequence-to-One</div>
          </div>
        </div>
      </div>
    </div>
  );
}

