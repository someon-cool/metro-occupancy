// frontend/src/api/client.js
/**
 * Pune Metro Occupancy API Client
 * Connects to FastAPI backend endpoints:
 * - GET /health
 * - GET /occupancy/latest?coach_id=...
 * - GET /occupancy/history?coach_id=...&limit=...
 * - POST /occupancy
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Helper to execute fetch with timeout and latency measurement
 */
async function fetchWithTimeout(endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();

  try {
    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    return { response, latencyMs };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw Object.assign(err, { latencyMs });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Health check endpoint
 */
export async function getBackendHealth() {
  try {
    const { response, latencyMs } = await fetchWithTimeout('/health');
    if (!response.ok) {
      return { online: false, status: response.status, latencyMs };
    }
    const data = await response.json();
    return { online: true, status: 'ok', data, latencyMs };
  } catch (err) {
    // If /health doesn't respond or 404s, try fallback check
    return { online: false, error: err.message, latencyMs: err.latencyMs || 0 };
  }
}

/**
 * Fetch latest occupancy for a coach
 * @param {string} coachId
 * @returns {Promise<{ data: Object|null, empty: boolean, latencyMs: number }>}
 */
export async function getLatestOccupancy(coachId = 'COACH-A1') {
  const { response, latencyMs } = await fetchWithTimeout(`/occupancy/latest?coach_id=${encodeURIComponent(coachId)}`);

  if (response.status === 404) {
    // 404 means the backend is online, but no records exist yet for this coach
    return { data: null, empty: true, latencyMs };
  }

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return { data, empty: false, latencyMs };
}

/**
 * Fetch occupancy history for sparklines & trends
 * @param {string} coachId
 * @param {number} limit
 * @returns {Promise<{ history: Array, latencyMs: number }>}
 */
export async function getOccupancyHistory(coachId = 'COACH-A1', limit = 30) {
  const { response, latencyMs } = await fetchWithTimeout(`/occupancy/history?coach_id=${encodeURIComponent(coachId)}&limit=${limit}`);

  if (response.status === 404) {
    return { history: [], latencyMs };
  }

  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}: ${response.statusText}`);
  }

  const history = await response.json();
  return { history: Array.isArray(history) ? history : [], latencyMs };
}

export { BACKEND_URL };

