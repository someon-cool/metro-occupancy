# backend/app/main.py
"""Minimal FastAPI backend for metro occupancy."""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.session import init_db, get_db
from app.db.models import Train, Coach, OccupancyRecord
from app.schemas.occupancy import OccupancyIn

app = FastAPI(title="Metro Occupancy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.post("/occupancy", status_code=status.HTTP_201_CREATED)
def create_occupancy(payload: OccupancyIn, db: Session = Depends(get_db)):
    """Receive an occupancy reading from an edge device and persist it."""

    # Upsert train
    train = db.query(Train).filter(Train.train_id == payload.train_id).first()
    if not train:
        train = Train(train_id=payload.train_id, name=payload.train_id)
        db.add(train)
        db.flush()

    # Upsert coach
    coach = db.query(Coach).filter(Coach.coach_id == payload.coach_id).first()
    if not coach:
        coach = Coach(coach_id=payload.coach_id, train_id=payload.train_id)
        db.add(coach)
        db.flush()

    # Insert occupancy record
    record = OccupancyRecord(
        train_id=payload.train_id,
        coach_id=payload.coach_id,
        timestamp=payload.timestamp,
        passenger_count=payload.passenger_count,
        occupancy_pct=payload.occupancy_pct,
        people_in_frame=payload.people_in_frame,
        vacancy=payload.vacancy,
        device_status=payload.device_status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "status": "created"}


@app.get("/occupancy/latest")
def get_latest_occupancy(coach_id: str = "COACH-A1", db: Session = Depends(get_db)):
    """Return the most recent occupancy record for a given coach (for dashboard polling)."""
    record = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.coach_id == coach_id)
        .order_by(OccupancyRecord.received_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No data found for this coach")

    coach = db.query(Coach).filter(Coach.coach_id == coach_id).first()
    capacity = coach.capacity if coach else 50

    return {
        "coach_id": record.coach_id,
        "train_id": record.train_id,
        "timestamp": record.timestamp,
        "people_in_frame": record.people_in_frame,
        "vacancy": record.vacancy,
        "passenger_count": record.passenger_count,
        "occupancy_pct": float(record.occupancy_pct),
        "capacity": capacity,
        "device_status": record.device_status,
    }


@app.get("/occupancy/history")
def get_occupancy_history(coach_id: str = "COACH-A1", limit: int = 20, db: Session = Depends(get_db)):
    """Return recent occupancy history for sparkline charts."""
    records = (
        db.query(OccupancyRecord)
        .filter(OccupancyRecord.coach_id == coach_id)
        .order_by(OccupancyRecord.received_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "timestamp": r.timestamp,
            "people_in_frame": r.people_in_frame,
            "vacancy": r.vacancy,
            "passenger_count": r.passenger_count,
        }
        for r in reversed(records)
    ]
