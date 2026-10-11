// frontend/src/components/common/DataNotAvailable.jsx
import React from 'react';
import { Info, AlertCircle, RadioOff, Cpu } from 'lucide-react';

export function DataNotAvailable({
  title = 'Data Not Available',
  message = 'This metric is not currently provided by the backend API or edge telemetry stream.',
  reason = 'Backend does not expose this parameter.',
  icon: Icon = Info,
  actionText = null,
  onAction = null,
}) {
  return (
    <div className="data-not-available-card">
      <div className="dna-icon-wrap">
        <Icon size={24} className="dna-icon" />
      </div>
      <div className="dna-content">
        <h4 className="dna-title">{title}</h4>
        <p className="dna-message">{message}</p>
        {reason && (
          <div className="dna-reason">
            <span className="dna-reason-label">SOURCE TRUTH:</span> {reason}
          </div>
        )}
        {actionText && onAction && (
          <button onClick={onAction} className="dna-action-btn">
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}

