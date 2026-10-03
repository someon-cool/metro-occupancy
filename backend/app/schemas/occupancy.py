# backend/app/schemas/occupancy.py
"""Pydantic schema for the POST /occupancy request body."""

from datetime import datetime
from pydantic import BaseModel


class OccupancyIn(BaseModel):
    train_id: str
    coach_id: str
    timestamp: datetime
    passenger_count: int
    occupancy_pct: float
    device_status: str = "active"
