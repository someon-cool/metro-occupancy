import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Gauge,
  MapPin,
  Navigation2,
  Radio,
  TrainFront,
  Users,
  UserRoundCheck,
  UserRoundX,
  Waypoints,
} from 'lucide-react';
import { PUNE_METRO_LINES, PUNE_METRO_STATIONS, ACTIVE_FLEET } from '../../constants/puneMetroData';
import { useMetro } from '../../context/MetroContext';

const LINE_OPTIONS = [PUNE_METRO_LINES.PURPLE, PUNE_METRO_LINES.AQUA];

function formatTime(value) {
  if (!value) return 'Awaiting first reading';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getCrowdStatus(occupancyPct) {
  if (occupancyPct >= 85) return { label: 'High', tone: 'high' };
  if (occupancyPct >= 60) return { label: 'Moderate', tone: 'moderate' };
  return { label: 'Low', tone: 'low' };
}

function PanelTitle({ icon: Icon, title, detail, action }) {
  return (
    <div className="metro-panel-title">
      <div className="metro-panel-title-main">
        <span className="metro-panel-icon"><Icon size={17} /></span>
        <div>
          <h2>{title}</h2>
          {detail && <p>{detail}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function HistoryChart({ history }) {
  const records = (history || []).slice(-24);
  if (!records.length) {
    return <div className="metro-empty-chart">Historical coach readings will appear here when the API returns records.</div>;
  }

  const values = records.map((record) => Number(record.passenger_count ?? record.people_in_frame ?? 0));
  const maxValue = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = 42 + (index / Math.max(values.length - 1, 1)) * 620;
    const y = 184 - (value / maxValue) * 142;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="metro-chart-wrap">
      <svg viewBox="0 0 680 225" role="img" aria-label="Historical passenger readings for the monitored coach">
        {[42, 89, 136, 184].map((y) => <line key={y} x1="42" y1={y} x2="662" y2={y} className="metro-chart-grid" />)}
        <text x="34" y="47" textAnchor="end" className="metro-chart-axis">{maxValue}</text>
        <text x="34" y="188" textAnchor="end" className="metro-chart-axis">0</text>
        <polyline points={points} className="metro-chart-line" />
        {values.map((value, index) => {
          const x = 42 + (index / Math.max(values.length - 1, 1)) * 620;
          const y = 184 - (value / maxValue) * 142;
          return <circle key={`${records[index]?.timestamp || index}`} cx={x} cy={y} r="3.5" className="metro-chart-point"><title>{`${formatTime(records[index]?.timestamp)} · ${value}`}</title></circle>;
        })}
        <text x="42" y="215" className="metro-chart-axis">{formatTime(records[0]?.timestamp)}</text>
        <text x="662" y="215" textAnchor="end" className="metro-chart-axis">{formatTime(records[records.length - 1]?.timestamp)}</text>
      </svg>
      <div className="metro-chart-legend"><span className="metro-legend-dot" /> Recorded coach passenger count <span className="metro-actual-tag">ACTUAL API HISTORY</span></div>
    </div>
  );
}

export function HomeOverview() {
  const {
    latestData,
    history,
    loading,
    error,
    backendOnline,
    lastUpdated,
    hasData,
    selectedStation,
    selectedStationId,
    setSelectedStationId,
    setActiveTab,
    demoMode,
  } = useMetro();
  const [selectedLineId, setSelectedLineId] = useState(PUNE_METRO_LINES.PURPLE.id);
  const [direction, setDirection] = useState('forward');

  const selectedLine = LINE_OPTIONS.find((line) => line.id === selectedLineId) || LINE_OPTIONS[0];
  const stationsOnLine = useMemo(() => PUNE_METRO_STATIONS
    .filter((station) => station.line === selectedLineId || station.isInterchange)
    .sort((a, b) => a.x - b.x), [selectedLineId]);
  const lineEndpoints = selectedLineId === PUNE_METRO_LINES.PURPLE.id
    ? ['PCMC Bhavan', 'Swargate']
    : ['Vanaz', 'Ramwadi'];
  const currentCoach = latestData?.coach_id || ACTIVE_FLEET.COACH_ID;
  const capacity = Math.max(0, Number(latestData?.capacity ?? ACTIVE_FLEET.DEFAULT_CAPACITY));
  const occupancyPct = latestData && Number.isFinite(Number(latestData.occupancy_pct))
    ? Math.max(0, Number(latestData.occupancy_pct))
    : null;
  const crowd = occupancyPct === null ? null : getCrowdStatus(occupancyPct);
  const passengerCount = latestData ? Number(latestData.people_in_frame ?? 0) : null;
  const vacancy = latestData ? Number(latestData.vacancy ?? Math.max(0, capacity - passengerCount)) : null;
  const updatedTime = formatTime(latestData?.timestamp || lastUpdated);

  const handleLineChange = (event) => {
    const nextLineId = event.target.value;
    setSelectedLineId(nextLineId);
    const nextStations = PUNE_METRO_STATIONS.filter((station) => station.line === nextLineId || station.isInterchange);
    if (!nextStations.some((station) => station.id === selectedStationId)) {
      setSelectedStationId(nextStations[0]?.id || 'STN-INT');
    }
  };

  const goToLive = () => {
    setActiveTab('dashboard');
    window.requestAnimationFrame(() => document.getElementById('live-train-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="metro-home-dashboard">
      <section className="metro-selector-panel" aria-label="Metro service selectors">
        <label className="metro-select-field">
          <span>Select line</span>
          <span className="metro-select-control"><Waypoints size={17} />
            <select value={selectedLineId} onChange={handleLineChange}>
              {LINE_OPTIONS.map((line) => <option key={line.id} value={line.id}>{line.name}</option>)}
            </select>
          </span>
        </label>
        <label className="metro-select-field">
          <span>Select station</span>
          <span className="metro-select-control"><MapPin size={17} />
            <select value={stationsOnLine.some((station) => station.id === selectedStationId) ? selectedStationId : (stationsOnLine[0]?.id || '')} onChange={(event) => setSelectedStationId(event.target.value)}>
              {stationsOnLine.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
            </select>
          </span>
        </label>
        <label className="metro-select-field">
          <span>Select direction</span>
          <span className="metro-select-control"><ArrowUpRight size={17} />
            <select value={direction} onChange={(event) => setDirection(event.target.value)}>
              <option value="forward">Toward {lineEndpoints[1]}</option>
              <option value="reverse">Toward {lineEndpoints[0]}</option>
            </select>
          </span>
        </label>
        <button className="metro-live-button" type="button" onClick={goToLive}><Radio size={16} /> View live status <ArrowRight size={16} /></button>
        <p className="metro-selector-note">Selections are route context only: current API telemetry is coach-scoped and is not filtered by station or direction.</p>
      </section>

      <div className="metro-dashboard-grid">
        <section id="live-train-status" className="metro-dashboard-panel metro-train-panel">
          <PanelTitle
            icon={TrainFront}
            title="Live train status"
            detail={`${selectedLine.name}  ·  ${selectedStation?.name || 'Station not selected'}  ·  ${direction === 'forward' ? `Toward ${lineEndpoints[1]}` : `Toward ${lineEndpoints[0]}`}  ·  ${updatedTime}`}
            action={<span className={`metro-live-indicator ${backendOnline ? 'is-online' : 'is-offline'}`}><i />{backendOnline ? (hasData ? 'Live feed' : 'Connected · waiting for data') : 'Backend offline'}</span>}
          />
          {error && <div className="metro-inline-alert" role="status">{error}</div>}
          <div className="metro-coach-track" aria-label="Coach telemetry availability">
            {latestData ? (
              <article className="metro-coach-unit is-monitored">
                <div className="metro-coach-window">
                  <span className="metro-coach-number">{currentCoach}</span>
                  <div className="metro-coach-views" aria-hidden="true"><i /><i /><i /></div>
                  <span className="metro-coach-door" />
                </div>
                <div className="metro-coach-summary">
                  <strong>{passengerCount} / {capacity || '—'}</strong>
                  <span>{vacancy ?? '—'} available</span>
                  <b className={`metro-crowd-pill ${crowd?.tone || 'unknown'}`}>{crowd?.label || 'Unknown'}</b>
                </div>
                <small>Only coach with current telemetry</small>
              </article>
            ) : (
              <div className="metro-coach-empty">
                <TrainFront size={35} />
                <strong>{loading ? 'Connecting to coach feed…' : 'No current coach telemetry'}</strong>
                <span>{backendOnline ? 'The API is reachable, but has not returned a latest occupancy record.' : 'The backend is unavailable; live coach values are hidden.'}</span>
              </div>
            )}
          </div>
          <div className="metro-panel-footnote"><i /> The current API provides a single coach reading. A complete train coach roster is not available.</div>
        </section>

        <section className="metro-dashboard-panel metro-prediction-panel">
          <PanelTitle icon={Clock3} title="Next train & crowd prediction" detail="Arrival and forecast services" />
          <div className="metro-arrival-state"><span className="metro-arrival-number">—</span><div><strong>Arrival estimate unavailable</strong><span>No arrival-time feed is connected.</span></div></div>
          <div className="metro-prediction-state">
            <div className="metro-prediction-state-icon"><Activity size={20} /></div>
            <div><strong>{demoMode ? 'Demo simulation is enabled' : 'Live prediction unavailable'}</strong><span>{demoMode ? 'Illustrative forecast only · not operational data' : 'No inference endpoint is currently exposed by the backend.'}</span></div>
          </div>
          <button className="metro-text-button" type="button" onClick={() => setActiveTab('prediction')}>Open prediction view <ArrowRight size={15} /></button>
        </section>

        <section className="metro-dashboard-panel metro-details-panel">
          <PanelTitle icon={Gauge} title="Coach details" detail={latestData ? `${latestData.train_id || ACTIVE_FLEET.TRAIN_ID} · ${currentCoach}` : 'Current monitored coach'} />
          {latestData ? (
            <div className="metro-coach-details-body">
              <div className={`metro-occupancy-ring ${crowd?.tone || 'unknown'}`} style={{ '--occupancy': `${Math.min(100, occupancyPct || 0)}%` }}><div><strong>{Math.round(occupancyPct || 0)}%</strong><span>occupied</span></div></div>
              <div className="metro-detail-metrics">
                <div><span><Users size={15} /> Passengers</span><strong>{passengerCount} <small>/ {capacity}</small></strong></div>
                <div><span><UserRoundX size={15} /> Vacancies</span><strong>{vacancy}</strong></div>
                <div><span><Clock3 size={15} /> Last reading</span><strong>{updatedTime}</strong></div>
                <div><span><Radio size={15} /> Device status</span><strong style={{ textTransform: 'capitalize' }}>{latestData?.device_status || 'active'}</strong></div>
              </div>
              <div className={`metro-crowd-warning ${crowd?.tone || 'unknown'}`}><span className="metro-warning-symbol">{crowd?.tone === 'high' ? '!' : <UserRoundCheck size={18} />}</span><div><strong>{crowd?.tone === 'high' ? 'High crowding' : `${crowd?.label || 'Unknown'} crowd level`}</strong><span>Based on backend occupancy percentage.</span></div></div>
            </div>
          ) : (
            <div className="metro-unavailable-state"><Gauge size={24} /><strong>{loading ? 'Loading coach details' : 'Coach details unavailable'}</strong><span>{error || 'A latest occupancy record is required to show passenger counts and capacity.'}</span></div>
          )}
        </section>

        <section id="recommended-coach" className="metro-dashboard-panel metro-recommendation-panel">
          <PanelTitle icon={UserRoundCheck} title="Recommended coach" detail="Lowest crowding comparison" />
          <div className="metro-recommendation-empty">
            <span className="metro-recommend-icon"><UserRoundCheck size={23} /></span>
            <strong>Recommendation not available</strong>
            <p>The API currently reports one coach at a time, so a least-crowded coach cannot be compared or recommended.</p>
            {demoMode && <span className="metro-demo-tag">DEMO MODE · no multi-coach sample</span>}
          </div>
        </section>

        <section className="metro-dashboard-panel metro-flow-panel">
          <PanelTitle icon={BarChart3} title="Passenger flow · recent history" detail="Actual observations returned by the occupancy history API" action={<span className="metro-history-count">{history?.length || 0} records</span>} />
          <HistoryChart history={history} />
          <div className="metro-chart-note"><ArrowDownRight size={14} /> Forecast series are not shown because no live prediction result is available.</div>
        </section>

        <section className="metro-dashboard-panel metro-station-panel">
          <PanelTitle icon={Navigation2} title="Station crowd level" detail={selectedStation?.name || 'Selected station'} />
          <div className="metro-station-unavailable">
            <span className="metro-station-pin"><MapPin size={24} /></span>
            <div><strong>Station telemetry unavailable</strong><p>The selected station has no station-level crowd feed. Coach occupancy is not used as a proxy for station population.</p></div>
          </div>
          <div className="metro-station-footer"><span><MapPin size={14} /> {selectedStation?.code || '—'} · Pune Metro</span><button type="button" onClick={() => setActiveTab('station')}>Station details <ArrowRight size={14} /></button></div>
        </section>
      </div>
    </div>
  );
}
