import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Gauge,
  Home,
  Map,
  MapPinned,
  Settings2,
  Sparkles,
  TrainFront,
  UsersRound,
} from 'lucide-react';
import { useMetro } from '../../context/MetroContext';

const primaryItems = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Live Monitoring', icon: Activity },
  { id: 'prediction', label: 'Crowd Prediction', icon: Sparkles },
  { id: 'recommendation', label: 'Coach Recommendation', icon: UsersRound },
  { id: 'station', label: 'Station Analytics', icon: MapPinned },
  { id: 'performance', label: 'Model Performance', icon: ChartNoAxesCombined },
  { id: 'system', label: 'Settings', icon: Settings2 },
];

const utilityItems = [
  { id: 'network', label: 'Metro network', icon: Map },
  { id: 'analytics', label: 'Occupancy history', icon: Gauge },
  { id: 'alerts', label: 'Crowding alerts', icon: Bell },
];

export function Navigation() {
  const { activeTab, setActiveTab } = useMetro();

  const handleClick = (id) => {
    if (id === 'recommendation') {
      setActiveTab('overview');
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        document.getElementById('recommended-coach')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
      return;
    }
    setActiveTab(id);
  };

  const renderItem = (item) => {
    const Icon = item.icon;
    const selected = item.id !== 'recommendation' && activeTab === item.id;
    return (
      <button key={item.id} type="button" onClick={() => handleClick(item.id)} className={`metro-nav-item ${selected ? 'active' : ''}`} aria-current={selected ? 'page' : undefined}>
        <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
        {selected && <i className="metro-nav-indicator" />}
      </button>
    );
  };

  return (
    <aside className="metro-sidebar">
      <div className="metro-sidebar-brand"><div className="metro-sidebar-mark">P</div><div><strong>MAHA METRO</strong><span>OCCUPANCY CONTROL</span></div></div>
      <nav className="metro-side-nav" aria-label="Main navigation">
        <span className="metro-nav-section-label">DASHBOARD</span>
        {primaryItems.map(renderItem)}
        <span className="metro-nav-section-label metro-nav-section-spaced">MORE VIEWS</span>
        {utilityItems.map(renderItem)}
      </nav>
      <div className="metro-sidebar-footer"><span className="metro-side-online-dot" /><span>Passenger information system</span><TrainFront size={16} /></div>
    </aside>
  );
}
