# backend/app/schemas/occupancy.py
"""Pydantic schemas for occupancy ingestion, queries, and health responses."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class OccupancyIn(BaseModel):
    """Payload received from edge CV devices or simulators."""
    train_id: str = Field(..., description="Train identifier or code, e.g. TRAIN-001 or DEMO-001")
    coach_id: str = Field(..., description="Coach identifier or code, e.g. COACH-A1 or C1")
    timestamp: Optional[datetime] = Field(default=None, description="Observation timestamp")
    passenger_count: int = Field(..., ge=0, description="Observed headcount")
    occupancy_pct: float = Field(..., ge=0.0, le=100.0, description="Occupancy percentage")
    people_in_frame: Optional[int] = Field(default=None, description="In-frame headcount (optional edge field)")
    vacancy: Optional[int] = Field(default=None, description="Available spots (optional edge field)")
    device_status: str = Field(default="active", description="Edge device health status")


class OccupancyLatestResponse(BaseModel):
    """Schema returned by GET /occupancy/latest."""
    coach_id: str
    train_id: str
    timestamp: datetime
    people_in_frame: int
    vacancy: int
    passenger_count: int
    occupancy_pct: float
    capacity: int
    device_status: str


class OccupancyHistoryItem(BaseModel):
    """Schema for individual history points returned by GET /occupancy/history."""
    timestamp: datetime
    people_in_frame: int
    vacancy: int
    passenger_count: int
    occupancy_pct: float


class HealthResponse(BaseModel):
    """Schema returned by GET /health."""
    status: str
    service: str
    database: str


class StationOut(BaseModel):
    """Schema returned for station listings."""
    id: int
    name: str
    line_name: str
    station_order: int


class StationArrivalOut(BaseModel):
    """Schema returned for upcoming arrivals."""
    id: int
    station_id: int
    station_name: str
    line_name: str
    train_id: int
    train_code: str
    direction: str
    eta_minutes: int
    passenger_count: int
    capacity: int
    status: str
    is_simulated: bool
