// frontend/src/components/common/Navigation.jsx
import React from 'react';
import { useMetro } from '../../context/MetroContext';
import {
  Home,
  Activity,
  Map,
  MapPin,
  Sparkles,
  BarChart2,
  AlertTriangle,
  Server,
} from 'lucide-react';

export function Navigation() {
  const { activeTab, setActiveTab, latestData } = useMetro();

  const pct = latestData ? Math.round(Number(latestData.occupancy_pct || 0)) : 0;
  const isHighCrowding = pct >= 85;

  const navItems = [
    { id: 'overview', label: 'Home Overview', icon: Home },
    { id: 'dashboard', label: 'Live Occupancy', icon: Activity },
    { id: 'network', label: 'Metro Network', icon: Map },
    { id: 'station', label: 'Station Details', icon: MapPin },
    { id: 'prediction', label: 'AI Prediction', icon: Sparkles },
    { id: 'analytics', label: 'Historical Analytics', icon: BarChart2 },
    {
      id: 'alerts',
      label: 'Crowding Alerts',
      icon: AlertTriangle,
      badge: isHighCrowding ? 'ALERT' : null,
    },
    { id: 'system', label: 'System Status', icon: Server },
  ];

  return (
    <nav className="pids-nav" aria-label="Main Navigation">
      <div className="nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge-alert">{item.badge}</span>}
              {isActive && <div className="nav-active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

