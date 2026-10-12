import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getLatestOccupancy, getBackendHealth } from '../api/client';
import { ACTIVE_FLEET, PUNE_METRO_STATIONS } from '../constants/puneMetroData';

const MetroContext = createContext(null);

const configuredPollInterval = Number.parseInt(import.meta.env.VITE_POLL_INTERVAL_MS || '2000', 10);
const POLL_INTERVAL_MS = Number.isFinite(configuredPollInterval) && configuredPollInterval >= 1000
  ? configuredPollInterval
  : 2000;
const DEFAULT_COACH_ID = import.meta.env.VITE_DEFAULT_COACH_ID || ACTIVE_FLEET.COACH_ID;

export function MetroProvider({ children }) {
  const [coachId, setCoachId] = useState(DEFAULT_COACH_ID);
  const [selectedStationId, setSelectedStationId] = useState('STN-INT');
  const [activeTab, setActiveTab] = useState('overview');

  const [latestData, setLatestData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const isMountedRef = useRef(true);
  const inFlightRequestRef = useRef(null);

  const fetchLiveTelemetry = useCallback(() => {
    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current;
    }

    const request = (async () => {
      try {
        const health = await getBackendHealth();
        if (!isMountedRef.current) return;

        setBackendOnline(health.online);
        if (!health.online) {
          setLatestData(null);
          setHistory([]);
          setHasData(false);
          setLastUpdated(null);
          setError(health.error || `Backend is offline at ${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}`);
          setLatencyMs(health.latencyMs || 0);
          setLoading(false);
          return;
        }

        const latestRes = await getLatestOccupancy(coachId);
        if (!isMountedRef.current) return;

        setLatencyMs(latestRes.latencyMs);
        setHistory([]);
        if (latestRes.empty) {
          setHasData(false);
          setLatestData(null);
          setError(null);
          setLastUpdated(null);
          setLoading(false);
          return;
        }

        setLatestData(latestRes.data);
        setHasData(true);
        setError(null);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        if (!isMountedRef.current) return;
        setLatestData(null);
        setHistory([]);
        setHasData(false);
        setLastUpdated(null);
        setError(err.message || 'Unable to read the latest occupancy response');
        // /health already succeeded; a failed or malformed occupancy payload does
        // not mean the backend itself is offline.
        setLoading(false);
      }
    })();

    inFlightRequestRef.current = request.finally(() => {
      inFlightRequestRef.current = null;
    });
    return inFlightRequestRef.current;
  }, [coachId]);

  useEffect(() => {
    isMountedRef.current = true;
    const initialRequestId = window.setTimeout(fetchLiveTelemetry, 0);
    const intervalId = window.setInterval(fetchLiveTelemetry, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      window.clearTimeout(initialRequestId);
      window.clearInterval(intervalId);
    };
  }, [fetchLiveTelemetry]);

  const selectedStation = PUNE_METRO_STATIONS.find((station) => station.id === selectedStationId) || PUNE_METRO_STATIONS[10];

  const value = {
    coachId,
    setCoachId,
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    activeTab,
    setActiveTab,
    latestData,
    history,
    loading,
    error,
    backendOnline,
    lastUpdated,
    latencyMs,
    hasData,
    refetch: fetchLiveTelemetry,
    demoMode,
    setDemoMode,
  };

  return <MetroContext.Provider value={value}>{children}</MetroContext.Provider>;
}

export function useMetro() {
  const context = useContext(MetroContext);
  if (!context) {
    throw new Error('useMetro must be used within a MetroProvider');
  }
  return context;
}
