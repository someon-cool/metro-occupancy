import { useEffect, useState } from 'react';
import { Clock3, Cpu, RefreshCw } from 'lucide-react';
import { useMetro } from '../../context/MetroContext';

export function Header() {
  const { backendOnline, latencyMs, hasData, refetch, demoMode, setDemoMode } = useMetro();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <header className="pids-header metro-top-header">
      <div className="metro-brand-lockup">
        <div className="metro-logo-emblem" aria-hidden="true"><span className="logo-letter">P</span></div>
        <div className="brand-text">
          <div className="brand-title-row"><h1 className="brand-title">PUNE METRO</h1><span className="marathi-title">पुणे मेट्रो</span></div>
          <p className="brand-subtitle">Real-time coach occupancy & passenger information</p>
        </div>
      </div>
      <div className="metro-header-right">
        <div className="metro-header-clock"><span>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span><strong><Clock3 size={15} />{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} IST</strong></div>
        <span className="metro-header-location">Pune, Maharashtra</span>
        <div className={`metro-header-status ${backendOnline ? 'online' : 'offline'}`}><i />{backendOnline ? (hasData ? `Live · ${latencyMs} ms` : 'Connected · waiting') : 'Backend offline'}</div>
        <button className={`metro-icon-button ${isRefreshing ? 'spinning' : ''}`} type="button" onClick={handleRefresh} aria-label="Refresh telemetry" title="Refresh backend telemetry"><RefreshCw size={16} /></button>
        <button className={`metro-demo-button ${demoMode ? 'active' : ''}`} type="button" onClick={() => setDemoMode(!demoMode)} aria-pressed={demoMode}><Cpu size={15} />{demoMode ? 'DEMO ON' : 'DEMO MODE'}</button>
      </div>
    </header>
  );
}
