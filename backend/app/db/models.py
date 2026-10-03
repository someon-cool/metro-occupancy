# backend/app/db/models.py
"""SQLAlchemy ORM models for metro occupancy."""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Numeric, func
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Train(Base):
    __tablename__ = "trains"

    train_id = Column(String, primary_key=True)
    name = Column(String, nullable=True)

    coaches = relationship("Coach", back_populates="train")
    records = relationship("OccupancyRecord", back_populates="train")


class Coach(Base):
    __tablename__ = "coaches"

    coach_id = Column(String, primary_key=True)
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=True)
    capacity = Column(Integer, nullable=False, default=150)

    train = relationship("Train", back_populates="coaches")
    records = relationship("OccupancyRecord", back_populates="coach")


class OccupancyRecord(Base):
    __tablename__ = "occupancy_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_id = Column(String, ForeignKey("trains.train_id"), nullable=True)
    coach_id = Column(String, ForeignKey("coaches.coach_id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    passenger_count = Column(Integer, nullable=False)
    occupancy_pct = Column(Numeric, nullable=False)
    device_status = Column(String, nullable=False, default="ok")
    received_at = Column(DateTime(timezone=True), server_default=func.now())

    train = relationship("Train", back_populates="records")
    coach = relationship("Coach", back_populates="records")
