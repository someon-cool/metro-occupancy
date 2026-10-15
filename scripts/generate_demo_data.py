# scripts/generate_demo_data.py
"""
Synthetic Demo Data Generator for Pune Metro Occupancy.
Source of truth: Metro_Demo_Database_Context.md

Safely seeds:
1. Aqua Line (16) and Purple Line (14) stations (idempotent).
2. Demo trains and coaches with designated capacities.
3. 24-hour realistic occupancy telemetry history (5-minute resolution).
4. Station arrival previews with direction and ETAs.

Preserves all existing real edge CV telemetry and prevents duplicate keys.
"""

import os
import sys
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.models import Station, Train, Coach, OccupancyRecord, StationArrival

# Load database configuration safely
env_path = REPO_ROOT / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(f"DATABASE_URL is not set. Ensure {env_path} exists and contains DATABASE_URL.")

if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# ── 1. Station Definitions ───────────────────────────────────────────────────

AQUA_STATIONS = [
    ("Vanaz", 1),
    ("Anand Nagar", 2),
    ("Ideal Colony", 3),
    ("Nal Stop", 4),
    ("Garware College", 5),
    ("Deccan Gymkhana", 6),
    ("Chhatrapati Sambhaji Udyan", 7),
    ("PMC", 8),
    ("District Court (Civil Court)", 9),
    ("Mangalwar Peth", 10),
    ("Pune Railway Station", 11),
    ("Ruby Hall Clinic", 12),
    ("Bund Garden", 13),
    ("Yerawada", 14),
    ("Kalyani Nagar", 15),
    ("Ramwadi", 16),
]

PURPLE_STATIONS = [
    ("PCMC Bhavan", 1),
    ("Sant Tukaram Nagar", 2),
    ("Bhosari (Nashik Phata)", 3),
    ("Kasarwadi", 4),
    ("Phugewadi", 5),
    ("Dapodi", 6),
    ("Bopodi", 7),
    ("Khadki", 8),
    ("Range Hill", 9),
    ("Shivaji Nagar", 10),
    ("District Court (Civil Court)", 11),
    ("Kasba Peth", 12),
    ("Mahatma Phule Mandai", 13),
    ("Swargate", 14),
]

# ── 2. Train & Coach Definitions ─────────────────────────────────────────────

DEMO_TRAINS = [
    {"train_code": "DEMO-001", "status": "active"},
    {"train_code": "DEMO-002", "status": "active"},
    {"train_code": "DEMO-003", "status": "active"},
    {"train_code": "TRAIN-001", "status": "active"},
]

DEMO_COACHES = [
    # DEMO-001 coaches (Standard capacity 150)
    {"train_code": "DEMO-001", "coach_code": "DEMO-001-C1", "capacity": 150},
    {"train_code": "DEMO-001", "coach_code": "DEMO-001-C2", "capacity": 150},
    {"train_code": "DEMO-001", "coach_code": "DEMO-001-C3", "capacity": 150},
    # DEMO-002 coaches
    {"train_code": "DEMO-002", "coach_code": "DEMO-002-C1", "capacity": 150},
    {"train_code": "DEMO-002", "coach_code": "DEMO-002-C2", "capacity": 150},
    # Edge live tracking coach (Capacity 50)
    {"train_code": "TRAIN-001", "coach_code": "COACH-A1", "capacity": 50},
]


def seed_stations(session) -> int:
    """Idempotently seed Aqua and Purple line stations without violating order or name constraints."""
    inserted = 0
    # Aqua Line
    for name, order in AQUA_STATIONS:
        existing = session.query(Station).filter(
            Station.line_name == "Aqua Line",
            (Station.name == name) | (Station.station_order == order)
        ).first()
        if not existing:
            session.add(Station(name=name, line_name="Aqua Line", station_order=order))
            inserted += 1

    # Purple Line
    for name, order in PURPLE_STATIONS:
        existing = session.query(Station).filter(
            Station.line_name == "Purple Line",
            (Station.name == name) | (Station.station_order == order)
        ).first()
        if not existing:
            session.add(Station(name=name, line_name="Purple Line", station_order=order))
            inserted += 1

    session.flush()
    return inserted


def seed_trains_and_coaches(session) -> tuple[int, int]:
    """Ensure demo trains and coaches exist without duplicate key errors."""
    trains_inserted = 0
    coaches_inserted = 0

    train_map = {}
    for t_spec in DEMO_TRAINS:
        train = session.query(Train).filter(Train.train_code == t_spec["train_code"]).first()
        if not train:
            train = Train(train_code=t_spec["train_code"], status=t_spec["status"])
            session.add(train)
            session.flush()
            trains_inserted += 1
        train_map[t_spec["train_code"]] = train.id

    for c_spec in DEMO_COACHES:
        coach = session.query(Coach).filter(Coach.coach_code == c_spec["coach_code"]).first()
        t_id = train_map.get(c_spec["train_code"])
        if not coach:
            coach = Coach(
                coach_code=c_spec["coach_code"],
                train_id=t_id,
                capacity=c_spec["capacity"],
            )
            session.add(coach)
            session.flush()
            coaches_inserted += 1

    return trains_inserted, coaches_inserted


def generate_occupancy_history(session, hours: int = 24, interval_minutes: int = 5) -> int:
    """
    Generate realistic 24-hour occupancy profile for demo coaches.
    Safe idempotency: Deletes only simulated records previously created for these coaches.
    """
    rng = random.Random(42)
    end_time = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    start_time = end_time - timedelta(hours=hours)

    target_coach_codes = ["DEMO-001-C1", "DEMO-001-C2", "COACH-A1"]
    coaches = session.query(Coach, Train).join(Train, Coach.train_id == Train.id).filter(
        Coach.coach_code.in_(target_coach_codes)
    ).all()

    if not coaches:
        return 0

    coach_ids = [c.id for c, _ in coaches]

    # Clean up prior simulated records in the historical window for idempotency
    deleted = session.query(OccupancyRecord).filter(
        OccupancyRecord.coach_id.in_(coach_ids),
        OccupancyRecord.device_status == "simulated",
        OccupancyRecord.recorded_at >= start_time,
    ).delete(synchronize_session=False)

    records = []
    current_time = start_time
    total_steps = int((hours * 60) / interval_minutes)

    while current_time <= end_time:
        hour = current_time.hour + current_time.minute / 60.0

        # Realistic Pune Metro diurnal flow profile
        if 0.0 <= hour < 5.5:
            # Closed / overnight maintenance
            base_ratio = 0.0
            noise = 0.0
        elif 5.5 <= hour < 7.5:
            # Early morning ramp-up
            base_ratio = 0.25 + 0.15 * math.sin((hour - 5.5) / 2.0 * math.pi / 2)
            noise = rng.uniform(-0.05, 0.05)
        elif 7.5 <= hour < 11.0:
            # Morning rush hour peak
            base_ratio = 0.75 + 0.18 * math.sin((hour - 7.5) / 3.5 * math.pi)
            noise = rng.uniform(-0.08, 0.08)
        elif 11.0 <= hour < 16.5:
            # Midday moderate traffic
            base_ratio = 0.38 + 0.08 * math.sin((hour - 11.0) / 5.5 * math.pi)
            noise = rng.uniform(-0.05, 0.05)
        elif 16.5 <= hour < 20.5:
            # Evening rush hour peak
            base_ratio = 0.80 + 0.16 * math.sin((hour - 16.5) / 4.0 * math.pi)
            noise = rng.uniform(-0.07, 0.07)
        elif 20.5 <= hour < 23.0:
            # Evening taper
            base_ratio = 0.35 * (1.0 - (hour - 20.5) / 2.5)
            noise = rng.uniform(-0.04, 0.04)
        else:
            base_ratio = 0.05
            noise = rng.uniform(0.0, 0.02)

        ratio = max(0.0, min(1.0, base_ratio + noise))

        for coach, train in coaches:
            cap = coach.capacity
            count = int(round(ratio * cap))
            # Calculate occupancy percentage consistently
            pct = round((count / cap) * 100.0, 2)

            records.append(
                OccupancyRecord(
                    train_id=train.id,
                    coach_id=coach.id,
                    passenger_count=count,
                    occupancy_pct=pct,
                    device_status="simulated",
                    recorded_at=current_time,
                )
            )

        current_time += timedelta(minutes=interval_minutes)

    session.bulk_save_objects(records)
    session.flush()
    return len(records)


def seed_station_arrivals(session) -> int:
    """Seed arrival previews across stations for demo displays."""
    # Remove existing simulated arrivals for safe rerun
    session.query(StationArrival).filter(StationArrival.is_simulated == True).delete(synchronize_session=False)

    trains = session.query(Train).all()
    if not trains:
        return 0

    stations = session.query(Station).order_by(Station.line_name, Station.station_order).all()
    arrivals = []
    rng = random.Random(101)

    for st in stations:
        t = rng.choice(trains)
        direction = "Ramwadi" if st.line_name == "Aqua Line" else "Swargate"
        eta = rng.randint(2, 14)
        cap = 150
        count = rng.randint(35, 120)

        arrivals.append(
            StationArrival(
                station_id=st.id,
                train_id=t.id,
                direction=direction,
                eta_minutes=eta,
                passenger_count=count,
                capacity=cap,
                status="approaching",
                is_simulated=True,
                updated_at=datetime.now(timezone.utc),
            )
        )

    session.bulk_save_objects(arrivals)
    session.flush()
    return len(arrivals)


def main():
    print("=" * 60)
    print("Pune Metro Synthetic Demo Data Seed Script")
    print("=" * 60)

    with SessionLocal() as session:
        try:
            print("\n[1/4] Seeding Stations...")
            st_count = seed_stations(session)
            total_st = session.query(Station).count()
            print(f"      + {st_count} new stations inserted (Total in DB: {total_st})")

            print("\n[2/4] Seeding Trains and Coaches...")
            t_ins, c_ins = seed_trains_and_coaches(session)
            total_tr = session.query(Train).count()
            total_co = session.query(Coach).count()
            print(f"      + {t_ins} new trains, {c_ins} new coaches (Total: {total_tr} trains, {total_co} coaches)")

            print("\n[3/4] Generating 24-Hour Occupancy History (5-min resolution)...")
            rec_count = generate_occupancy_history(session, hours=24, interval_minutes=5)
            total_rec = session.query(OccupancyRecord).count()
            print(f"      + {rec_count} occupancy records generated (Total in DB: {total_rec})")

            print("\n[4/4] Seeding Station Arrival Previews...")
            arr_count = seed_station_arrivals(session)
            total_arr = session.query(StationArrival).count()
            print(f"      + {arr_count} arrival previews updated (Total in DB: {total_arr})")

            session.commit()
            print("\n" + "=" * 60)
            print("SUCCESS: All demo data successfully committed to database.")
            print("=" * 60)

        except Exception as exc:
            session.rollback()
            print(f"\nERROR: Transaction aborted: {exc}")
            raise


if __name__ == "__main__":
    main()
