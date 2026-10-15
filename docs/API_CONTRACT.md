# Pune Metro Occupancy & Prediction API Contract

**Service:** `Pune Metro Occupancy API`  
**Version:** `1.0.0`  
**Base URL:** `http://localhost:8000` (configurable via `VITE_BACKEND_URL` in frontend)  
**Database:** Supabase PostgreSQL (reconciled schema)  
**CORS Policy:** All origins (`*`) allowed with credentials, methods, and headers.

---

## 1. Endpoints

### 1.1 Health Check
* **Route:** `GET /health`
* **Purpose:** Allows frontend and monitoring agents to verify API and database connectivity.
* **Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "service": "metro-occupancy-backend",
  "database": "connected"
}
```

---

### 1.2 Telemetry Ingestion (Edge Device / Generator)
* **Route:** `POST /occupancy`
* **Purpose:** Receives passenger headcount telemetry from edge CV systems or simulation scripts. Automatically resolves or registers `trains` and `coaches` before persisting observation records.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "train_id": "TRAIN-001",
  "coach_id": "COACH-A1",
  "timestamp": "2026-10-12T20:15:00Z",
  "passenger_count": 28,
  "occupancy_pct": 56.0,
  "people_in_frame": 28,
  "vacancy": 22,
  "device_status": "active"
}
```
* **Response (HTTP 201 Created):**
```json
{
  "id": 1738,
  "status": "created"
}
```

---

### 1.3 Latest Coach Occupancy
* **Route:** `GET /occupancy/latest`
* **Query Parameters:**
  * `coach_id` *(string, optional, default: `"COACH-A1"`)*: Coach code (e.g. `COACH-A1`, `DEMO-001-C1`) or numeric coach ID.
* **Response (HTTP 200 OK):**
```json
{
  "coach_id": "COACH-A1",
  "train_id": "TRAIN-001",
  "timestamp": "2026-10-12T20:15:00+00:00",
  "people_in_frame": 28,
  "vacancy": 22,
  "passenger_count": 28,
  "occupancy_pct": 56.0,
  "capacity": 50,
  "device_status": "active"
}
```
* **Error Response (HTTP 404 Not Found):** Returned if the coach has no recorded telemetry.

---

### 1.4 Occupancy History
* **Route:** `GET /occupancy/history`
* **Query Parameters:**
  * `coach_id` *(string, optional, default: `"COACH-A1"`)*: Coach code or numeric ID.
  * `limit` *(integer, optional, default: `20`, min: `1`, max: `500`)*: Number of recent observations.
* **Response (HTTP 200 OK):** Ordered chronologically for direct SVG / sparkline plotting.
```json
[
  {
    "timestamp": "2026-10-12T20:05:00+00:00",
    "people_in_frame": 24,
    "vacancy": 26,
    "passenger_count": 24,
    "occupancy_pct": 48.0
  },
  {
    "timestamp": "2026-10-12T20:10:00+00:00",
    "people_in_frame": 28,
    "vacancy": 22,
    "passenger_count": 28,
    "occupancy_pct": 56.0
  }
]
```

---

### 1.5 Metro Stations
* **Route:** `GET /stations`
* **Query Parameters:**
  * `line` *(string, optional)*: Filter by line name (`"Aqua Line"` or `"Purple Line"`).
* **Response (HTTP 200 OK):**
```json
[
  {
    "id": 1,
    "name": "Vanaz",
    "line_name": "Aqua Line",
    "station_order": 1
  },
  {
    "id": 2,
    "name": "Anand Nagar",
    "line_name": "Aqua Line",
    "station_order": 2
  }
]
```

---

### 1.6 Upcoming Train Arrivals
* **Route:** `GET /arrivals`
* **Query Parameters:**
  * `station_id` *(integer, optional)*: Filter by station numeric ID.
* **Response (HTTP 200 OK):**
```json
[
  {
    "id": 1,
    "station_id": 1,
    "station_name": "Vanaz",
    "line_name": "Aqua Line",
    "train_id": 1,
    "train_code": "DEMO-001",
    "direction": "Ramwadi",
    "eta_minutes": 4,
    "passenger_count": 48,
    "capacity": 150,
    "status": "approaching",
    "is_simulated": true
  }
]
```

---

### 1.7 AI Crowd Occupancy Prediction
* **Route:** `GET /predict`
* **Query Parameters:**
  * `coach_id` *(string, optional, default: `"COACH-A1"`)*: Target coach.
  * `horizon_minutes` *(integer, optional, default: `60`, min: `10`, max: `120`)*: Prediction horizon.
* **Response (HTTP 200 OK):**
```json
{
  "coach_id": "COACH-A1",
  "capacity": 50,
  "current_passenger_count": 28,
  "current_occupancy_pct": 56.0,
  "model_status": "model_active",
  "model_type": "xgboost_json",
  "prediction_horizon_minutes": 60,
  "forecast": [
    {
      "horizon": "+10 min",
      "step_minutes": 10,
      "predicted_count": 32,
      "predicted_occupancy_pct": 64.0,
      "lower_bound": 27,
      "upper_bound": 38
    },
    {
      "horizon": "+20 min",
      "step_minutes": 20,
      "predicted_count": 35,
      "predicted_occupancy_pct": 70.0,
      "lower_bound": 30,
      "upper_bound": 41
    }
  ]
}
```
* **Fallback Behavior:** If model artifact files are pending in `ml/artifacts/`, returns `model_status: "artifact_pending"` with dynamic temporal moving-average baseline forecasts derived from the Metro research notebook without crashing the service.

---

## 2. Database Schema (PostgreSQL / Supabase)

1. **`stations`**
   * `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
   * `name`: `TEXT NOT NULL`
   * `line_name`: `TEXT NOT NULL DEFAULT 'Aqua Line'`
   * `station_order`: `INTEGER NOT NULL`
   * `created_at`: `TIMESTAMPTZ DEFAULT NOW()`
   * Uniqueness: `UNIQUE (line_name, name)`, `UNIQUE (line_name, station_order)`

2. **`trains`**
   * `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
   * `train_code`: `TEXT NOT NULL UNIQUE` (e.g. `DEMO-001`, `TRAIN-001`)
   * `status`: `TEXT NOT NULL DEFAULT 'active'`

3. **`coaches`**
   * `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
   * `train_id`: `BIGINT NOT NULL REFERENCES trains(id)`
   * `coach_code`: `TEXT NOT NULL UNIQUE` (e.g. `COACH-A1`, `DEMO-001-C1`)
   * `capacity`: `INTEGER NOT NULL DEFAULT 150`

4. **`occupancy_records`**
   * `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
   * `train_id`: `BIGINT REFERENCES trains(id)`
   * `coach_id`: `BIGINT REFERENCES coaches(id)`
   * `passenger_count`: `INTEGER NOT NULL CHECK (passenger_count >= 0)`
   * `occupancy_pct`: `NUMERIC(5,2) NOT NULL CHECK (occupancy_pct >= 0 AND occupancy_pct <= 100)`
   * `device_status`: `TEXT NOT NULL DEFAULT 'active'`
   * `recorded_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

5. **`station_arrivals`**
   * `id`: `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`
   * `station_id`: `BIGINT NOT NULL REFERENCES stations(id)`
   * `train_id`: `BIGINT NOT NULL REFERENCES trains(id)`
   * `direction`: `TEXT NOT NULL`
   * `eta_minutes`: `INTEGER NOT NULL DEFAULT 0`
   * `passenger_count`: `INTEGER NOT NULL DEFAULT 0`
   * `capacity`: `INTEGER NOT NULL DEFAULT 150`
   * `status`: `TEXT NOT NULL DEFAULT 'approaching'`
   * `is_simulated`: `BOOLEAN NOT NULL DEFAULT TRUE`
   * `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 3. Pre-Trained Model Artifact Integration

The crowd prediction model was researched and developed in [`backend/app/Metro.ipynb`](file:///d:/Projects/metro/backend/app/Metro.ipynb).

### Where to Place Pre-Trained Artifacts
To enable direct inference from the teammate's trained model, place the saved artifact file in:
```
ml/artifacts/
```
Supported filenames:
* **XGBoost:** `ml/artifacts/xgb_model.json` or `ml/artifacts/crowd_model.pkl`
* **LSTM:** `ml/artifacts/lstm_scaler.pkl` + `ml/artifacts/lstm_model.keras`

The backend service [`CrowdPredictorService`](file:///d:/Projects/metro/backend/app/services/crowd_predictor.py) detects these files automatically upon startup or request and executes model inference without retraining.
