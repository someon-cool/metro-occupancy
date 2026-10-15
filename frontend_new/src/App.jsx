import { MetroProvider, useMetro } from './context/MetroContext';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { DemoModeBanner } from './components/common/DemoModeBanner';
import { HomeOverview } from './components/pages/HomeOverview';
import { ModelPerformanceView } from './components/pages/ModelPerformanceView';
import { LiveOccupancyCard } from './components/dashboard/LiveOccupancyCard';
import { CoachDiagram } from './components/dashboard/CoachDiagram';
import { RecentTelemetryTable } from './components/dashboard/RecentTelemetryTable';
import { MetroMap } from './components/network/MetroMap';
import { StationList } from './components/network/StationList';
import { StationDetailView } from './components/station/StationDetailView';
import { AIPredictionView } from './components/prediction/AIPredictionView';
import { HistoryCharts } from './components/analytics/HistoryCharts';
import { AlertsPanel } from './components/alerts/AlertsPanel';
import { SystemStatusView } from './components/system/SystemStatusView';
import './App.css';
import './modern-dashboard.css';

function MainAppContent() {
  const { activeTab, latestData, history } = useMetro();

  return (
    <div className="metro-app-root">
      <Navigation />
      <div className="metro-workspace">
        <Header />
        <DemoModeBanner />
        <main className="metro-main-content">
          {activeTab === 'overview' && <HomeOverview />}
          {activeTab === 'dashboard' && (
            <div className="dashboard-view-layout">
              <LiveOccupancyCard data={latestData} />
              <CoachDiagram data={latestData} />
              <RecentTelemetryTable history={history} capacity={latestData?.capacity || 50} />
            </div>
          )}
          {activeTab === 'network' && (
            <div className="network-view-layout">
              <div className="network-map-column"><MetroMap /></div>
              <div className="network-list-column"><StationList /></div>
            </div>
          )}
          {activeTab === 'station' && <StationDetailView />}
          {activeTab === 'prediction' && <AIPredictionView />}
          {activeTab === 'performance' && <ModelPerformanceView />}
          {activeTab === 'analytics' && <HistoryCharts history={history} capacity={latestData?.capacity || 50} />}
          {activeTab === 'alerts' && <AlertsPanel latestData={latestData} history={history} />}
          {activeTab === 'system' && <SystemStatusView />}
        </main>
        <footer className="pids-footer">
          <div className="footer-content">
            <div className="footer-left"><span className="footer-brand">PUNE METRO RAIL · महा मेट्रो</span><span className="footer-sub">Real-time coach occupancy · Passenger information</span></div>
            <div className="footer-right"><span>FastAPI REST telemetry</span><span className="sep">•</span><span>Edge CV feed</span></div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return <MetroProvider><MainAppContent /></MetroProvider>;
}
