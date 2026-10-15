# backend/app/db/models.py
"""SQLAlchemy ORM models for metro occupancy reconciled with Supabase PostgreSQL."""

from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, DateTime, ForeignKey, Numeric, func
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Station(Base):
    __tablename__ = "stations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    line_name = Column(Text, nullable=False, default="Aqua Line")
    station_order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    arrivals = relationship("StationArrival", back_populates="station")


class Train(Base):
    __tablename__ = "trains"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    train_code = Column(Text, unique=True, nullable=False)
    status = Column(Text, nullable=False, default="active")

    coaches = relationship("Coach", back_populates="train")
    records = relationship("OccupancyRecord", back_populates="train")
    arrivals = relationship("StationArrival", back_populates="train")


class Coach(Base):
    __tablename__ = "coaches"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    train_id = Column(BigInteger, ForeignKey("trains.id"), nullable=False)
    coach_code = Column(Text, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False, default=150)

    train = relationship("Train", back_populates="coaches")
    records = relationship("OccupancyRecord", back_populates="coach")


class OccupancyRecord(Base):
    __tablename__ = "occupancy_records"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    train_id = Column(BigInteger, ForeignKey("trains.id"), nullable=True)
    coach_id = Column(BigInteger, ForeignKey("coaches.id"), nullable=True)
    passenger_count = Column(Integer, nullable=False)
    occupancy_pct = Column(Numeric(5, 2), nullable=False)
    device_status = Column(Text, nullable=False, default="active")
    recorded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    train = relationship("Train", back_populates="records")
    coach = relationship("Coach", back_populates="records")


class StationArrival(Base):
    __tablename__ = "station_arrivals"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    station_id = Column(BigInteger, ForeignKey("stations.id"), nullable=False)
    train_id = Column(BigInteger, ForeignKey("trains.id"), nullable=False)
    direction = Column(Text, nullable=False)
    eta_minutes = Column(Integer, nullable=False, default=0)
    passenger_count = Column(Integer, nullable=False, default=0)
    capacity = Column(Integer, nullable=False, default=150)
    status = Column(Text, nullable=False, default="approaching")
    is_simulated = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    station = relationship("Station", back_populates="arrivals")
    train = relationship("Train", back_populates="arrivals")
