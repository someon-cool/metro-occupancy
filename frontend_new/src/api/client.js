const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 6000;

async function fetchWithTimeout(endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    return { response, latencyMs: Math.round(performance.now() - startTime) };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`, { cause: err });
    }
    err.latencyMs = latencyMs;
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(response, endpoint) {
  try {
    return await response.json();
  } catch (err) {
    throw new Error(`${endpoint} returned invalid JSON`, { cause: err });
  }
}

function validateLatestOccupancy(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Malformed latest occupancy response: expected a JSON object');
  }

  const requiredStrings = ['coach_id', 'train_id', 'timestamp', 'device_status'];
  for (const field of requiredStrings) {
    if (typeof data[field] !== 'string' || data[field].trim() === '') {
      throw new Error(`Malformed latest occupancy response: ${field} must be a non-empty string`);
    }
  }

  const requiredNumbers = ['people_in_frame', 'vacancy', 'passenger_count', 'occupancy_pct', 'capacity'];
  for (const field of requiredNumbers) {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field])) {
      throw new Error(`Malformed latest occupancy response: ${field} must be a finite number`);
    }
  }

  if (!Number.isInteger(data.people_in_frame) || data.people_in_frame < 0) {
    throw new Error('Malformed latest occupancy response: people_in_frame must be a non-negative integer');
  }
  if (!Number.isInteger(data.vacancy) || data.vacancy < 0) {
    throw new Error('Malformed latest occupancy response: vacancy must be a non-negative integer');
  }
  if (data.capacity <= 0) {
    throw new Error('Malformed latest occupancy response: capacity must be greater than zero');
  }
  if (data.occupancy_pct < 0) {
    throw new Error('Malformed latest occupancy response: occupancy_pct cannot be negative');
  }
  if (Number.isNaN(Date.parse(data.timestamp))) {
    throw new Error('Malformed latest occupancy response: timestamp must be a valid date-time string');
  }

  return data;
}

export async function getBackendHealth() {
  try {
    const { response, latencyMs } = await fetchWithTimeout('/health');
    if (!response.ok) {
      return { online: false, status: response.status, latencyMs, error: `Health check returned HTTP ${response.status}` };
    }

    const data = await readJson(response, 'GET /health');
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.status !== 'ok') {
      return { online: false, latencyMs, error: 'Malformed health response: expected status "ok"' };
    }
    return { online: true, status: 'ok', data, latencyMs };
  } catch (err) {
    return { online: false, error: err.message, latencyMs: err.latencyMs || 0 };
  }
}

export async function getLatestOccupancy(coachId = 'COACH-A1') {
  const endpoint = `/occupancy/latest?coach_id=${encodeURIComponent(coachId)}`;
  const { response, latencyMs } = await fetchWithTimeout(endpoint);

  if (response.status === 404) {
    return { data: null, empty: true, latencyMs };
  }
  if (!response.ok) {
    throw new Error(`Latest occupancy request returned HTTP ${response.status}: ${response.statusText}`);
  }

  const data = validateLatestOccupancy(await readJson(response, 'GET /occupancy/latest'));
  return { data, empty: false, latencyMs };
}

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
