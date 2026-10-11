// frontend/src/components/system/SystemStatusView.jsx
import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { Server, Database, Video, RefreshCw, CheckCircle2, AlertCircle, Wifi, Terminal, Clock } from 'lucide-react';
import { BACKEND_URL } from '../../api/client';

export function SystemStatusView() {
  const {
    backendOnline,
    lastUpdated,
    latencyMs,
    hasData,
    latestData,
    error,
    refetch,
    loading,
  } = useMetro();

  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    await refetch();
    setTimeout(() => setTesting(false), 600);
  };

  return (
    <div className="system-status-view">
      <div className="status-header-card">
        <div>
          <h2 className="system-main-title">Pune Metro IoT & Edge Architecture Diagnostics</h2>
          <p className="system-subtitle">
            System health, API heartbeat, database connection, and edge CV pipeline telemetry
          </p>
        </div>
        <button
          onClick={handleTestConnection}
          className={`test-conn-btn ${testing ? 'spinning' : ''}`}
        >
          <RefreshCw size={15} />
          <span>{testing ? 'Testing Connection...' : 'Re-test Backend Ping'}</span>
        </button>
      </div>

      {/* Main Health Grid */}
      <div className="health-cards-grid">
        {/* Card 1: Backend API Service */}
        <div className={`card health-card ${backendOnline ? 'online' : 'offline'}`}>
          <div className="health-card-head">
            <div className="icon-wrap">
              <Server size={22} className={backendOnline ? 'text-green' : 'text-red'} />
            </div>
            <span className={`pill-badge ${backendOnline ? 'pill-green' : 'pill-red'}`}>
              {backendOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <h3 className="health-card-title">FastAPI Backend Service</h3>
          <p className="health-card-desc">
            REST API server processing occupancy ingestion & dashboard queries.
          </p>
          <div className="health-specs-list">
            <div className="spec-item">
              <span className="spec-label">Target URL:</span>
              <code className="spec-val">{BACKEND_URL}</code>
            </div>
            <div className="spec-item">
              <span className="spec-label">Roundtrip Latency:</span>
              <span className="spec-val font-bold text-accent">{latencyMs} ms</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Polling Cadence:</span>
              <span className="spec-val">Every 2000 ms</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Last Successful Heartbeat:</span>
              <span className="spec-val">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Database / Storage Engine */}
        <div className={`card health-card ${backendOnline ? 'online' : 'offline'}`}>
          <div className="health-card-head">
            <div className="icon-wrap">
              <Database size={22} className={backendOnline ? 'text-green' : 'text-amber'} />
            </div>
            <span className={`pill-badge ${backendOnline ? 'pill-green' : 'pill-amber'}`}>
              {backendOnline ? 'INITIALIZED' : 'UNKNOWN'}
            </span>
          </div>
          <h3 className="health-card-title">Relational Storage (SQLAlchemy)</h3>
          <p className="health-card-desc">
            Stores trains, coaches, and chronological occupancy history.
          </p>
          <div className="health-specs-list">
            <div className="spec-item">
              <span className="spec-label">Engine:</span>
              <span className="spec-val">SQLite / PostgreSQL Supabase</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">ORM Layer:</span>
              <span className="spec-val">SQLAlchemy 2.x Declarative Models</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Active Records:</span>
              <span className="spec-val font-bold text-green">
                {hasData ? 'Records Ingested' : 'Empty Database'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Tables:</span>
              <span className="spec-val">trains, coaches, occupancy_records</span>
            </div>
          </div>
        </div>

        {/* Card 3: Edge CV Vision Pipeline */}
        <div className={`card health-card ${hasData ? 'online' : 'standby'}`}>
          <div className="health-card-head">
            <div className="icon-wrap">
              <Video size={22} className={hasData ? 'text-green' : 'text-amber'} />
            </div>
            <span className={`pill-badge ${hasData ? 'pill-green' : 'pill-amber'}`}>
              {hasData ? 'STREAMING' : 'AWAITING FEED'}
            </span>
          </div>
          <h3 className="health-card-title">Edge CV Sensor Pipeline</h3>
          <p className="health-card-desc">
            YOLOv8 nano computer vision running doorway virtual line crossing.
          </p>
          <div className="health-specs-list">
            <div className="spec-item">
              <span className="spec-label">Assigned Unit:</span>
              <span className="spec-val font-bold">TRAIN-001 / COACH-A1</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Detection Model:</span>
              <span className="spec-val">yolov8n.pt (Person class 0, conf 0.4)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Line Crossing Gate:</span>
              <span className="spec-val">Vertical Cyan Line (15px Hysteresis)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Streamer Client:</span>
              <span className="spec-val">Async Daemon Thread (sender.py)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Offline / Error Diagnostic Banner */}
      {(!backendOnline || error) && (
        <div className="card offline-help-card">
          <div className="help-head">
            <AlertCircle size={22} className="text-red" />
            <div>
              <h4 className="help-title">Backend Connection Issue Detected</h4>
              <p className="help-sub">{error || 'Unable to establish HTTP connection to FastAPI backend.'}</p>
            </div>
          </div>
          <div className="startup-steps">
            <h5>How to start the backend service:</h5>
            <ol>
              <li>Open a terminal in the project root.</li>
              <li>Activate the virtual environment: <code>backend\.venv\Scripts\Activate.ps1</code></li>
              <li>Run the FastAPI server: <code>cd backend; uvicorn app.main:app --port 8000 --reload</code></li>
              <li>Verify it responds at <code>http://127.0.0.1:8000/docs</code></li>
            </ol>
          </div>
        </div>
      )}

      {/* API Contract Table */}
      <div className="card api-catalog-card">
        <h3 className="card-heading">Connected Backend API Specification</h3>
        <p className="card-subheading">Source of truth endpoints queried by this application</p>

        <div className="table-responsive-wrapper">
          <table className="pids-table">
            <thead>
              <tr>
                <th>METHOD</th>
                <th>ENDPOINT</th>
                <th>PURPOSE</th>
                <th>SOURCE OF TRUTH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="method-tag get">GET</span></td>
                <td><code>/health</code></td>
                <td>API heartbeat & service check</td>
                <td>FastAPI app.main</td>
              </tr>
              <tr>
                <td><span className="method-tag get">GET</span></td>
                <td><code>/occupancy/latest?coach_id=COACH-A1</code></td>
                <td>Most recent coach headcount, occupancy %, vacancy</td>
                <td>backend/app/main.py</td>
              </tr>
              <tr>
                <td><span className="method-tag get">GET</span></td>
                <td><code>/occupancy/history?coach_id=COACH-A1&limit=30</code></td>
                <td>Chronological time-series occupancy history</td>
                <td>backend/app/main.py</td>
              </tr>
              <tr>
                <td><span className="method-tag post">POST</span></td>
                <td><code>/occupancy</code></td>
                <td>Edge device telemetry ingestion route</td>
                <td>edge/src/sender.py</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

