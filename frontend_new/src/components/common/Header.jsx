// frontend/src/components/common/Header.jsx
import React, { useState, useEffect } from 'react';
import { useMetro } from '../../context/MetroContext';
import { Radio, RefreshCw, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { ACTIVE_FLEET } from '../../constants/puneMetroData';

export function Header() {
  const {
    backendOnline,
    lastUpdated,
    latencyMs,
    hasData,
    latestData,
    refetch,
    demoMode,
    setDemoMode,
  } = useMetro();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="pids-header">
      <div className="header-brand">
        <div className="metro-logo-emblem">
          <span className="logo-letter">P</span>
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1 className="brand-title">PUNE METRO</h1>
            <span className="marathi-title">पुणे मेट्रो</span>
          </div>
          <p className="brand-subtitle">
            AI-Based Real-Time Coach Occupancy System
          </p>
        </div>
      </div>

      <div className="header-meta">
        {/* Monitored Train Fleet Pill */}
        <div className="fleet-pill">
          <span className="fleet-label">MONITORED FLEET</span>
          <span className="fleet-value">
            {latestData?.train_id || ACTIVE_FLEET.TRAIN_ID} · {latestData?.coach_id || ACTIVE_FLEET.COACH_ID}
          </span>
        </div>

        {/* Live IST Clock */}
        <div className="clock-box">
          <span className="clock-label">PIDS CLOCK</span>
          <span className="clock-time">
            {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
          </span>
        </div>

        {/* Connection Status Pill */}
        <div className={`status-pill ${backendOnline ? 'online' : 'offline'}`}>
          <span className="status-indicator-dot" />
          <span className="status-text">
            {backendOnline ? (hasData ? `LIVE (${latencyMs}ms)` : 'WAITING DATA') : 'BACKEND OFFLINE'}
          </span>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={handleRefresh}
          className={`refresh-btn ${isRefreshing ? 'spin' : ''}`}
          title="Refresh backend telemetry"
          aria-label="Refresh telemetry"
        >
          <RefreshCw size={16} />
        </button>

        {/* Demo Mode Toggle */}
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`demo-toggle-btn ${demoMode ? 'active' : ''}`}
          title={demoMode ? 'Switch to Live Backend Mode' : 'Enable Demo Simulation Mode'}
        >
          <Cpu size={14} />
          <span>{demoMode ? 'DEMO ACTIVE' : 'DEMO MODE'}</span>
        </button>
      </div>
    </header>
  );
}

