// frontend/src/components/common/DemoModeBanner.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import { AlertTriangle, X } from 'lucide-react';

export function DemoModeBanner() {
  const { demoMode, setDemoMode } = useMetro();

  if (!demoMode) return null;

  return (
    <div className="demo-mode-banner" role="alert">
      <div className="demo-banner-content">
        <AlertTriangle size={18} className="demo-icon" />
        <span className="demo-badge">DEMO MODE ACTIVE</span>
        <span className="demo-desc">
          Displaying simulated mock stream and AI forecasting model research preview for demonstration purposes. Not live backend telemetry.
        </span>
      </div>
      <button
        onClick={() => setDemoMode(false)}
        className="demo-close-btn"
        aria-label="Exit Demo Mode"
      >
        <span className="exit-text">Exit Demo Mode</span>
        <X size={16} />
      </button>
    </div>
  );
}

