# backend/app/main.py
"""FastAPI backend for Pune Metro occupancy monitoring and prediction."""

from datetime import datetime, timezone
from typing import List, Optional
import os
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, desc

from app.db.session import init_db, get_db
from app.db.models import Train, Coach, OccupancyRecord, Station, StationArrival
from app.schemas.occupancy import (
    OccupancyIn,
    OccupancyLatestResponse,
    OccupancyHistoryItem,
    HealthResponse,
    StationOut,
    StationArrivalOut,
)

app = FastAPI(
    title="Pune Metro Occupancy API",
    description="Backend API for real-time coach occupancy tracking, telemetry ingestion, station arrivals, and crowd prediction.",
    version="1.0.0",
)

# Enable CORS for browser frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Ensure database connection and schema tables exist."""
    init_db()


@app.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint confirming API service and database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"disconnected: {exc}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "metro-occupancy-backend",
        "database": db_status,
    }


@app.post("/occupancy", status_code=status.HTTP_201_CREATED)
def create_occupancy(payload: OccupancyIn, db: Session = Depends(get_db)):
    """Receive an occupancy reading from an edge CV device or demo generator and persist it."""
    # 1. Resolve or create train by train_code (or numeric id)
    train = None
    if payload.train_id.isdigit():
        train = db.query(Train).filter((Train.id == int(payload.train_id)) | (Train.train_code == payload.train_id)).first()
    else:
        train = db.query(Train).filter(Train.train_code == payload.train_id).first()

    if not train:
        train = Train(train_code=payload.train_id, status="active")
        db.add(train)
        db.flush()

    # 2. Resolve or create coach by coach_code (or numeric id)
    coach = None
    if payload.coach_id.isdigit():
        coach = db.query(Coach).filter((Coach.id == int(payload.coach_id)) | (Coach.coach_code == payload.coach_id)).first()
    else:
        coach = db.query(Coach).filter(Coach.coach_code == payload.coach_id).first()

    if not coach:
        coach = Coach(coach_code=payload.coach_id, train_id=train.id, capacity=50)
        db.add(coach)
        db.flush()

    # 3. Determine observation timestamp
    obs_time = payload.timestamp or datetime.now(timezone.utc)

    # 4. Insert occupancy record into database
    record = OccupancyRecord(
        train_id=train.id,
        coach_id=coach.id,
        passenger_count=payload.passenger_count,
        occupancy_pct=payload.occupancy_pct,
        device_status=payload.device_status,
        recorded_at=obs_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "status": "created"}


@app.get("/occupancy/latest")
def get_latest_occupancy(
    coach_id: str = Query("COACH-A1", description="Coach identifier (e.g. COACH-A1 or C1)"),
    db: Session = Depends(get_db),
):
    """Return the most recent occupancy record for a given coach (for dashboard polling)."""
    # Look up coach by coach_code or numeric id
    coach = None
    if coach_id.isdigit():
        coach = db.query(Coach).filter((Coach.id == int(coach_id)) | (Coach.coach_code == coach_id)).first()
    else:
        coach = db.query(Coach).filter(Coach.coach_code == coach_id).first()

    if not coach:
        raise HTTPException(status_code=404, detail=f"Coach '{coach_id}' not found")

    record = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.coach_id == coach.id)
        .order_by(OccupancyRecord.recorded_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail=f"No occupancy data found for coach '{coach_id}'")

    train = db.query(Train).filter(Train.id == record.train_id).first() if record.train_id else None
    capacity = coach.capacity
    headcount = record.passenger_count
    vacancy = max(0, capacity - headcount)

    return {
        "coach_id": coach.coach_code,
        "train_id": train.train_code if train else (str(record.train_id) if record.train_id else "TRAIN-001"),
        "timestamp": record.recorded_at.isoformat(),
        "people_in_frame": headcount,
        "vacancy": vacancy,
        "passenger_count": headcount,
        "occupancy_pct": float(record.occupancy_pct),
        "capacity": capacity,
        "device_status": record.device_status,
    }


@app.get("/occupancy/history")
def get_occupancy_history(
    coach_id: str = Query("COACH-A1", description="Coach identifier (e.g. COACH-A1 or C1)"),
    limit: int = Query(20, ge=1, le=500, description="Number of recent records to return"),
    db: Session = Depends(get_db),
):
    """Return recent occupancy history for sparkline charts and trend curves."""
    coach = None
    if coach_id.isdigit():
        coach = db.query(Coach).filter((Coach.id == int(coach_id)) | (Coach.coach_code == coach_id)).first()
    else:
        coach = db.query(Coach).filter(Coach.coach_code == coach_id).first()

    if not coach:
        return []

    records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.coach_id == coach.id)
        .order_by(OccupancyRecord.recorded_at.desc())
        .limit(limit)
        .all()
    )
    capacity = coach.capacity

    return [
        {
            "timestamp": r.recorded_at.isoformat(),
            "people_in_frame": r.passenger_count,
            "vacancy": max(0, capacity - r.passenger_count),
            "passenger_count": r.passenger_count,
            "occupancy_pct": float(r.occupancy_pct),
        }
        for r in reversed(records)
    ]


@app.get("/stations", response_model=List[StationOut])
def get_stations(
    line: Optional[str] = Query(None, description="Filter by line name (e.g. 'Aqua Line', 'Purple Line')"),
    db: Session = Depends(get_db),
):
    """Return all metro stations ordered by line and sequence order."""
    query = db.query(Station)
    if line:
        query = query.filter(Station.line_name.ilike(f"%{line}%"))
    return query.order_by(Station.line_name, Station.station_order).all()


@app.get("/arrivals", response_model=List[StationArrivalOut])
def get_arrivals(
    station_id: Optional[int] = Query(None, description="Filter by station numeric ID"),
    db: Session = Depends(get_db),
):
    """Return upcoming train arrivals for stations."""
    query = db.query(StationArrival, Station, Train).join(Station, StationArrival.station_id == Station.id).join(Train, StationArrival.train_id == Train.id)
    if station_id:
        query = query.filter(StationArrival.station_id == station_id)

    results = query.order_by(StationArrival.eta_minutes.asc()).limit(30).all()

    arrivals = []
    for arrival, station, train in results:
        arrivals.append({
            "id": arrival.id,
            "station_id": arrival.station_id,
            "station_name": station.name,
            "line_name": station.line_name,
            "train_id": arrival.train_id,
            "train_code": train.train_code,
            "direction": arrival.direction,
            "eta_minutes": arrival.eta_minutes,
            "passenger_count": arrival.passenger_count,
            "capacity": arrival.capacity,
            "status": arrival.status,
            "is_simulated": arrival.is_simulated,
        })
    return arrivals


from app.services.crowd_predictor import crowd_predictor


@app.get("/predict")
def get_prediction(
    coach_id: str = Query("COACH-A1", description="Coach identifier for prediction"),
    horizon_minutes: int = Query(60, ge=10, le=120, description="Prediction horizon in minutes"),
    db: Session = Depends(get_db),
):
    """
    Predict future crowd occupancy.
    Uses pre-trained XGBoost / LSTM model from ml/artifacts/ if loaded,
    or research-backed temporal baseline from Metro.ipynb.
    """
    coach = db.query(Coach).filter((Coach.coach_code == coach_id) | (Coach.id == int(coach_id) if coach_id.isdigit() else False)).first()
    if not coach:
        raise HTTPException(status_code=404, detail=f"Coach '{coach_id}' not found")

    capacity = coach.capacity
    history_records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.coach_id == coach.id)
        .order_by(OccupancyRecord.recorded_at.desc())
        .limit(150)
        .all()
    )

    history_counts = [r.passenger_count for r in reversed(history_records)]
    latest_record = history_records[0] if history_records else None
    base_count = latest_record.passenger_count if latest_record else 0
    current_pct = round((base_count / capacity) * 100.0, 1)

    pred_result = crowd_predictor.predict_horizon(
        current_count=base_count,
        capacity=capacity,
        history_counts=history_counts,
        horizon_minutes=horizon_minutes,
    )

    return {
        "coach_id": coach.coach_code if coach else coach_id,
        "capacity": capacity,
        "current_passenger_count": base_count,
        "current_occupancy_pct": current_pct,
        "model_status": pred_result["model_status"],
        "model_type": pred_result["model_type"],
        "prediction_horizon_minutes": horizon_minutes,
        "forecast": pred_result["forecast"],
    }
