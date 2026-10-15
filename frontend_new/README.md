# Pune Metro Coach Occupancy & AI Prediction Frontend

Passenger Information Display System (PIDS) and real-time coach occupancy visualization dashboard for Pune Metro (Maha Metro).

## Overview

- **Design System:** Inspired by Pune Metro's visual identity (Maha Metro Purple, Saffron Orange, Aqua Blue, Emerald Green, Charcoal/Navy PIDS dark surfaces).
- **Architecture:** Communicates via REST polling with the FastAPI backend (`http://localhost:8000` or configured via `VITE_BACKEND_URL`).
- **Telemetry Source:** Edge computer vision device running YOLOv8 doorway line-crossing detection on Coach A1 of Train TRAIN-001.

## Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_POLL_INTERVAL_MS=2000
VITE_DEFAULT_COACH_ID=COACH-A1
VITE_DEFAULT_TRAIN_ID=TRAIN-001
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

## Connected Backend APIs

- `GET /health` — Service heartbeat & latency ping
- `GET /occupancy/latest?coach_id=COACH-A1` — Live coach headcount, vacancy, capacity, occupancy %, cumulative flow
- `GET /occupancy/history?coach_id=COACH-A1&limit=30` — Ingested telemetry history buffer for time-series charts

## Features

1. **Home / Overview:** Network summary across Line 1 (Purple Line) and Line 2 (Aqua Line), active fleet snapshot, system modules.
2. **Live Occupancy Dashboard:** Real-time headcount, capacity utilization bar, 3-car rake diagram, seat density visualization, streaming telemetry table.
3. **Metro Network:** Interactive schematic SVG map of Pune Metro's 29 stations across Purple Line and Aqua Line with Civil Court Interchange.
4. **Station Details:** Station-level metadata, Devnagari naming, coach telemetry when connected, and honest "Sensor Pending" states.
5. **AI Prediction:** Real live occupancy with research model overview (`backend/app/Metro.ipynb`). Includes toggleable **DEMO MODE** for previewing the LSTM lag-10 predictive horizon.
6. **Historical Analytics:** Time-series SVG charts for headcount, occupancy %, vacancy, and cumulative net flow.
7. **Crowding Alerts:** Automated threshold alerts (High $\ge 85\%$, Moderate $\ge 60\%$, Normal $< 60\%$) based on actual backend records.
8. **System Diagnostics:** Connection status, latency monitor, database status, and API contract catalog.
