# backend/app/main.py
"""Minimal FastAPI backend for metro occupancy."""

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import init_db, get_db
from app.db.models import Train, Coach, OccupancyRecord
from app.schemas.occupancy import OccupancyIn

app = FastAPI(title="Metro Occupancy API")


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
        device_status=payload.device_status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "status": "created"}
