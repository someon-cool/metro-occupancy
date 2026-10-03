# Metro Coach Occupancy Monitoring & Analytics System

An end-to-end intelligent IoT and Computer Vision system designed to monitor real-time passenger occupancy in metro train coaches, stream telemetry data to a centralized backend, and persist records for transit analytics and passenger-facing dashboards.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [1. Database Configuration](#1-database-configuration)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Edge CV Pipeline Setup](#3-edge-cv-pipeline-setup)
  - [4. Frontend Dashboard Setup](#4-frontend-dashboard-setup)
- [Usage & Running End-to-End](#-usage--running-end-to-end)
- [API Specification](#-api-specification)
- [Evaluation & Benchmark](#-evaluation--benchmark)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Overview

Overcrowding in metro transit networks causes boarding delays, passenger discomfort, and safety risks. This project delivers an automated, coach-level passenger counting and occupancy monitoring solution:

1. **Edge Computer Vision**: Edge devices running YOLOv8 detect passengers and track directional movement across virtual boundary lines (entries vs. exits).
2. **Backend Telemetry Ingestion**: A lightweight, asynchronous FastAPI service validates and ingests real-time coach telemetry.
3. **Database Persistence**: PostgreSQL / Supabase securely stores time-series occupancy records and train/coach relationship metadata.
4. **Passenger & Operations Dashboard**: Modern React + Vite frontend to visualize coach occupancy levels and platform recommendations.

---

## ✨ Key Features

- **Real-Time Person Detection & Tracking**: Utilizes YOLOv8n with BoT-SORT / ByteTrack tracking for continuous multi-person tracking at 25–30 FPS.
- **Robust Line-Crossing State Machine**:
  - Hysteresis thresholding (`±15px`) to prevent boundary noise and false positives.
  - Frame cooldown (`15 frames`) to prevent duplicate counts on hesitation or turnaround.
  - Stale track purging (`90 frames`) to clean up inactive IDs.
- **Directional Occupancy Sensing**: Automatically computes net occupancy (`occupancy = entries - exits`) and occupancy percentage relative to coach capacity.
- **Resilient Edge-to-Cloud Streaming**: Non-blocking HTTP client (`sender.py`) pushes data every 2 seconds without degrading the computer vision frame rate.
- **Auto-Provisioning Relational Schema**: SQLAlchemy backend auto-creates and updates `trains`, `coaches`, and `occupancy_records` tables.
- **Extensible Architecture**: Structured modular code designed for future MQTT messaging and ML-based occupancy forecasting.

---

## 🏗 System Architecture

```text
  +-------------------------------------------------------------------+
  |                        Edge Device (Camera)                       |
  |  - detector.py: YOLOv8 Person Detection & Centroid Extraction     |
  |  - main.py: Directional Line Crossing & Occupancy State Machine   |
  |  - sender.py: Non-blocking HTTP POST Telemetry Streamer           |
  +---------------------------------+---------------------------------+
                                    |
                                    | HTTP POST /occupancy (every 1-2s)
                                    v
  +-------------------------------------------------------------------+
  |                        FastAPI Backend                            |
  |  - app/main.py: /occupancy Ingestion Endpoint                     |
  |  - app/schemas: Pydantic Request Validation                       |
  |  - app/db: SQLAlchemy Session & ORM Models                        |
  +---------------------------------+---------------------------------+
                                    |
                                    | Persists Telemetry & Upserts
                                    v
  +-------------------------------------------------------------------+
  |                   PostgreSQL / Supabase Database                  |
  |  - trains table (train_id, name)                                  |
  |  - coaches table (coach_id, train_id, capacity)                   |
  |  - occupancy_records table (timestamp, passenger_count, %, status)|
  +---------------------------------+---------------------------------+
                                    |
                                    | Queries / Realtime Subscriptions
                                    v
  +-------------------------------------------------------------------+
  |                     React + Vite Frontend                         |
  |  - Real-time coach occupancy visualizer & transit HUD             |
  +-------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```text
metro/
├── backend/                  # FastAPI Backend API & Database
│   ├── app/
│   │   ├── db/               # SQLAlchemy models and session engine
│   │   │   ├── models.py     # Train, Coach, OccupancyRecord schemas
│   │   │   └── session.py    # Database connection & init logic
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── main.py           # FastAPI application & /occupancy route
│   ├── .env.example          # Environment variable template
│   └── requirements.txt      # Backend dependencies
├── edge/                     # Computer Vision Edge Pipeline
│   └── src/
│       ├── config.py         # Edge config (train/coach ID, backend URL)
│       ├── detector.py       # YOLOv8 object detector & tracker
│       ├── counter.py        # Occupancy smoothing & calculations
│       ├── sender.py         # HTTP client for backend streaming
│       ├── main.py           # Edge entrypoint & OpenCV display HUD
│       └── yolov8n.pt        # Pretrained YOLOv8 nano model
├── frontend/                 # React 19 + Vite Web Application
│   ├── src/                  # React components, styles, and assets
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite build configuration
├── docs/                     # Documentation & Evaluation
│   └── p6-evaluation.md      # CV benchmark accuracy & failure analysis
├── requirements.txt          # Unified master requirements specification
└── setup.ps1                 # Project bootstrapping script
```

---

## 💻 Prerequisites

Ensure you have the following installed on your host system:

- **Python**: `3.11.x` (`>= 3.11, < 3.12`)
- **Node.js**: `>= 18.0.0` (with `npm >= 9.0.0`)
- **Git**
- **Camera / Webcam**: Required for real-time video stream detection on the edge.
- **PostgreSQL / Supabase**: Active Postgres database instance.

---

## 🛠 Installation & Setup

### 1. Database Configuration

Create a `.env` file in the `backend/` directory using `backend/.env.example` as a template:

```bash
cd backend
cp .env.example .env
```

Configure your PostgreSQL / Supabase connection string in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-region.pooler.supabase.com:6543/postgres
```

---

### 2. Backend Setup

Open a terminal dedicated to the backend service:

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

---

### 3. Edge CV Pipeline Setup

Open a separate terminal for the edge pipeline:

```bash
# Navigate to the edge directory
cd edge/src

# Create and activate a virtual environment
python -m venv .venv

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Install edge dependencies (OpenCV, Ultralytics YOLO, PyTorch, requests)
pip install opencv-python ultralytics torch torchvision requests
```

---

### 4. Frontend Dashboard Setup

Open a terminal for the frontend application:

```bash
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install
```

---

## 🚦 Usage & Running End-to-End

### Step 1: Start the Backend Service

In your backend terminal:

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will initialize database tables automatically and listen at `http://127.0.0.1:8000`. You can explore interactive API docs at `http://127.0.0.1:8000/docs`.

### Step 2: Start the Edge CV Pipeline

In your edge terminal:

```bash
cd edge/src
python main.py
```

- A window titled **Edge** will open showing your webcam feed.
- Cross the vertical cyan line to simulate passenger entries (left to right) and exits (right to left).
- The HUD displays real-time `People`, `Entries`, `Exits`, `Occupancy`, and `FPS`.
- Telemetry is automatically streamed via HTTP POST to `http://127.0.0.1:8000/occupancy`.
- Press **`q`** in the window to safely stop the pipeline.

### Step 3: Start the Frontend Dashboard

In your frontend terminal:

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` to access the frontend application.

---

## 📡 API Specification

### Ingest Occupancy Telemetry

- **Endpoint**: `POST /occupancy`
- **Status Code**: `201 Created`
- **Request Body**:

```json
{
  "train_id": "TRAIN-001",
  "coach_id": "COACH-A1",
  "timestamp": "2026-10-03T08:30:00Z",
  "passenger_count": 12,
  "occupancy_pct": 24.0,
  "device_status": "active"
}
```

- **Response**:

```json
{
  "id": 1,
  "status": "created"
}
```

---

## 📊 Evaluation & Benchmark

The CV counting pipeline was evaluated across standard passenger movement scenarios (see [docs/p6-evaluation.md](docs/p6-evaluation.md)):

| Scenario | Ground Truth (In / Out) | System Count (In / Out) | Accuracy | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Normal Crossing** | 3 / 2 | 3 / 2 | **100%** | Stable ID tracking throughout crossing |
| **Fast Movement / Running** | 2 / 2 | 2 / 2 | **100%** | State-based tracking correctly identified |
| **Loitering on Line** | 0 / 0 | 0 / 0 | **100%** | 15px threshold eliminated jitter counts |
| **U-Turn / Direction Reversal** | 1 / 1 | 1 / 1 | **100%** | Clean side-state transition |
| **Direct Occlusion (Overlap)** | 2 / 0 | 1 / 0 | **50%** | Addressed in production via top-down mounting |

---

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. **Fork the Repository** and clone your fork locally.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Commit Your Changes**: Follow clear, conventional commit messages.
   ```bash
   git commit -m "feat(edge): add support for multiple virtual gates"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/my-new-feature
   ```
5. **Open a Pull Request**: Follow the [PR Template](.github/pull_request_template.md) and describe your modifications, testing checklist, and any edge cases considered.

---

