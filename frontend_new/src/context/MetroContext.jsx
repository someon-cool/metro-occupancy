// frontend/src/context/MetroContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getLatestOccupancy, getOccupancyHistory, getBackendHealth } from '../api/client';
import { ACTIVE_FLEET, PUNE_METRO_STATIONS } from '../constants/puneMetroData';

const MetroContext = createContext(null);

const POLL_INTERVAL_MS = parseInt(import.meta.env.VITE_POLL_INTERVAL_MS || '2000', 10);
const DEFAULT_COACH_ID = import.meta.env.VITE_DEFAULT_COACH_ID || ACTIVE_FLEET.COACH_ID;

export function MetroProvider({ children }) {
  const [coachId, setCoachId] = useState(DEFAULT_COACH_ID);
  const [selectedStationId, setSelectedStationId] = useState('STN-INT'); // Civil Court by default
  const [activeTab, setActiveTab] = useState('overview');

  // Real backend live state
  const [latestData, setLatestData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [hasData, setHasData] = useState(false);

  // DEMO MODE state - strictly false by default
  const [demoMode, setDemoMode] = useState(false);

  const isMountedRef = useRef(true);

  const fetchLiveTelemetry = useCallback(async () => {
    try {
      // 1. Health check
      const health = await getBackendHealth();
      if (!isMountedRef.current) return;

      setBackendOnline(health.online);
      if (!health.online) {
        setError(`Backend is offline at ${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}`);
        setLatencyMs(health.latencyMs || 0);
        setLoading(false);
        return;
      }

      // 2. Fetch Latest Record
      const latestRes = await getLatestOccupancy(coachId);
      if (!isMountedRef.current) return;

      setLatencyMs(latestRes.latencyMs);

      if (latestRes.empty) {
        // Backend is up, but no records exist in DB yet
        setHasData(false);
        setLatestData(null);
        setHistory([]);
        setError(null);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      setHasData(true);
      setLatestData(latestRes.data);

      // 3. Fetch History
      const histRes = await getOccupancyHistory(coachId, 30);
      if (!isMountedRef.current) return;

      setHistory(histRes.history || []);
      setError(null);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Error communicating with backend');
      setBackendOnline(false);
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLiveTelemetry();

    const intervalId = setInterval(fetchLiveTelemetry, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchLiveTelemetry]);

  // Selected station helper
  const selectedStation = PUNE_METRO_STATIONS.find(s => s.id === selectedStationId) || PUNE_METRO_STATIONS[10];

  const value = {
    // Live state
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

    // Controls
    refetch: fetchLiveTelemetry,

    // Demo Mode toggle
    demoMode,
    setDemoMode,
  };

  return (
    <MetroContext.Provider value={value}>
      {children}
    </MetroContext.Provider>
  );
}

export function useMetro() {
  const context = useContext(MetroContext);
  if (!context) {
    throw new Error('useMetro must be used within a MetroProvider');
  }
  return context;
}

