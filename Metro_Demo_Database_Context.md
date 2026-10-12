# Metro Occupancy Demo Database --- Antigravity Context

## Purpose

This document is the source of truth for implementing Python scripts
that generate **simulated demo data** for the Metro Occupancy Monitoring
project using the existing Supabase/PostgreSQL database.

**Important** - Inspect the actual repository and live schema before
making changes. - The database and tables may already exist. Do **not**
blindly rerun `CREATE TABLE` statements or drop/recreate tables. - Reuse
the existing connection configuration and environment variables. - Never
hardcode credentials or print secrets. - Simulated data must remain
distinguishable from real CV-generated data. - Do not modify unrelated
frontend, CV, or backend code.

------------------------------------------------------------------------

## 1. Database tables

### `stations`

Stores station names for both metro lines.

  Column            Type                Notes
  ----------------- ------------------- ------------------------------
  `id`              `BIGINT` identity   Primary key
  `name`            `TEXT`              Station name
  `line_name`       `TEXT`              `Aqua Line` or `Purple Line`
  `station_order`   `INT`               Order along the line
  `created_at`      `TIMESTAMPTZ`       Defaults to current time

Expected uniqueness: `(line_name, name)` and
`(line_name, station_order)`. This allows the interchange to appear on
both lines.

### `trains`

  -----------------------------------------------------------------------
  Column                  Type                    Notes
  ----------------------- ----------------------- -----------------------
  `id`                    `BIGINT` identity       Primary key

  `train_code`            `TEXT`                  Unique, e.g. `DEMO-001`

  `status`                `TEXT`                  `active`, `inactive`,
                                                  or `maintenance`;
                                                  defaults to `active`
  -----------------------------------------------------------------------

### `coaches`

  -----------------------------------------------------------------------
  Column                  Type                    Notes
  ----------------------- ----------------------- -----------------------
  `id`                    `BIGINT` identity       Primary key

  `train_id`              `BIGINT`                Foreign key to
                                                  `trains.id`

  `coach_code`            `TEXT`                  Unique,
                                                  e.g. `DEMO-001-C1` or
                                                  existing naming
                                                  convention

  `capacity`              `INT`                   Positive number; demo
                                                  default is 150
  -----------------------------------------------------------------------

### `occupancy_records`

Stores timestamped occupancy observations for a train/coach.

  Column              Type                Notes
  ------------------- ------------------- ---------------------------------------
  `id`                `BIGINT` identity   Primary key
  `train_id`          `BIGINT`            Foreign key to `trains.id`, nullable
  `coach_id`          `BIGINT`            Foreign key to `coaches.id`, nullable
  `passenger_count`   `INT`               Must be non-negative
  `occupancy_pct`     `NUMERIC(5,2)`      Must be between 0 and 100
  `device_status`     `TEXT`              Defaults to `active`
  `recorded_at`       `TIMESTAMPTZ`       Timestamp of observation

Calculate occupancy percentage consistently from passenger count and
capacity: `occupancy_pct = (passenger_count / capacity) * 100`. Clamp
generated passenger counts to capacity if the schema only permits
percentages up to 100. If an over-capacity scenario is needed later,
change the schema and UI deliberately rather than silently writing
invalid values.

### `station_arrivals`

Stores station-level arrival previews for trains. Existing schema treats
these as simulated by default.

  Column              Type                Notes
  ------------------- ------------------- ------------------------------
  `id`                `BIGINT` identity   Primary key
  `station_id`        `BIGINT`            Foreign key to `stations.id`
  `train_id`          `BIGINT`            Foreign key to `trains.id`
  `direction`         `TEXT`              Direction/destination label
  `eta_minutes`       `INT`               Non-negative
  `passenger_count`   `INT`               Non-negative
  `capacity`          `INT`               Positive; defaults to 150
  `status`            `TEXT`              Defaults to `approaching`
  `is_simulated`      `BOOLEAN`           Defaults to `TRUE`
  `updated_at`        `TIMESTAMPTZ`       Defaults to current time

**Data-model note:** the current table does not have a uniqueness
constraint for station/train arrivals. The generator should avoid
duplicate records on reruns by using an explicit, safe strategy based on
the actual schema. Do not assume an upsert is possible without a
matching unique constraint.

------------------------------------------------------------------------

## 2. Reference SQL schema

Use this as documentation/reference only. Compare it with the live
schema first. If tables already exist, create a separate migration only
for a confirmed missing or incorrect element.

``` sql
CREATE TABLE stations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    line_name TEXT NOT NULL DEFAULT 'Aqua Line',
    station_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT stations_line_station_name_unique UNIQUE (line_name, name),
    CONSTRAINT stations_line_station_order_unique UNIQUE (line_name, station_order)
);

CREATE TABLE trains (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    train_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'maintenance'))
);

CREATE TABLE coaches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    train_id BIGINT NOT NULL REFERENCES trains(id),
    coach_code TEXT NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 150 CHECK (capacity > 0)
);

CREATE TABLE occupancy_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    train_id BIGINT REFERENCES trains(id),
    coach_id BIGINT REFERENCES coaches(id),
    passenger_count INT NOT NULL CHECK (passenger_count >= 0),
    occupancy_pct NUMERIC(5,2) NOT NULL
        CHECK (occupancy_pct >= 0 AND occupancy_pct <= 100),
    device_status TEXT NOT NULL DEFAULT 'active',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE station_arrivals (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    station_id BIGINT NOT NULL REFERENCES stations(id),
    train_id BIGINT NOT NULL REFERENCES trains(id),
    direction TEXT NOT NULL,
    eta_minutes INT NOT NULL DEFAULT 0 CHECK (eta_minutes >= 0),
    passenger_count INT NOT NULL DEFAULT 0 CHECK (passenger_count >= 0),
    capacity INT NOT NULL DEFAULT 150 CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'approaching',
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_occupancy_coach_time
    ON occupancy_records (coach_id, recorded_at DESC);

CREATE INDEX idx_arrivals_station
    ON station_arrivals (station_id, eta_minutes);
```

------------------------------------------------------------------------

## 3. Station seed data

### Aqua Line --- Vanaz to Ramwadi

``` sql
INSERT INTO stations (name, line_name, station_order)
VALUES
('Vanaz', 'Aqua Line', 1),
('Anand Nagar', 'Aqua Line', 2),
('Ideal Colony', 'Aqua Line', 3),
('Nal Stop', 'Aqua Line', 4),
('Garware College', 'Aqua Line', 5),
('Deccan Gymkhana', 'Aqua Line', 6),
('Chhatrapati Sambhaji Udyan', 'Aqua Line', 7),
('PMC', 'Aqua Line', 8),
('District Court (Civil Court)', 'Aqua Line', 9),
('Mangalwar Peth', 'Aqua Line', 10),
('Pune Railway Station', 'Aqua Line', 11),
('Ruby Hall Clinic', 'Aqua Line', 12),
('Bund Garden', 'Aqua Line', 13),
('Yerawada', 'Aqua Line', 14),
('Kalyani Nagar', 'Aqua Line', 15),
('Ramwadi', 'Aqua Line', 16)
ON CONFLICT (line_name, name) DO NOTHING;
```

### Purple Line --- PCMC Bhavan to Swargate

``` sql
INSERT INTO stations (name, line_name, station_order)
VALUES
('PCMC Bhavan', 'Purple Line', 1),
('Sant Tukaram Nagar', 'Purple Line', 2),
('Bhosari (Nashik Phata)', 'Purple Line', 3),
('Kasarwadi', 'Purple Line', 4),
('Phugewadi', 'Purple Line', 5),
('Dapodi', 'Purple Line', 6),
('Bopodi', 'Purple Line', 7),
('Khadki', 'Purple Line', 8),
('Range Hill', 'Purple Line', 9),
('Shivaji Nagar', 'Purple Line', 10),
('District Court (Civil Court)', 'Purple Line', 11),
('Kasba Peth', 'Purple Line', 12),
('Mahatma Phule Mandai', 'Purple Line', 13),
('Swargate', 'Purple Line', 14)
ON CONFLICT (line_name, name) DO NOTHING;
```

The interchange is intentionally represented as a station entry on each
line. The frontend may group them visually as one interchange, but do
not collapse the line-specific rows without updating the data model.

------------------------------------------------------------------------

## 4. Reference demo train and coach seed

Inspect existing rows first. Insert only missing records and preserve
existing IDs and relationships.

Example train codes: - `DEMO-001` - `DEMO-002` - `DEMO-003`

Example coach codes, subject to the existing naming convention: -
`DEMO-001-C1`, `DEMO-001-C2`, `DEMO-001-C3` - `DEMO-002-C1`,
`DEMO-002-C2`, `DEMO-002-C3` - `DEMO-003-C1`, `DEMO-003-C2`,
`DEMO-003-C3`

Use a capacity of 150 per coach for demo data unless the existing
database specifies another value.

------------------------------------------------------------------------

## 5. Python scripts to implement

Create scripts under `scripts/` unless the repository already has an
established location.

### A. Historical data generator

Suggested name: `scripts/generate_demo_data.py`

Requirements: 1. Read the database URL/credentials from the existing
`.env` or environment configuration. 2. Inspect existing trains and
coaches; do not assume IDs. 3. Generate 24 hours of timestamped
occupancy history for each eligible coach. 4. Use configurable sampling
intervals (e.g. every 5 minutes) to avoid excessive rows. 5. Vary
occupancy realistically by time of day: lower overnight, rising during
morning/evening peaks, moderate at other times, with reasonable random
variation. 6. Keep counts between zero and coach capacity; derive
`occupancy_pct` from the same count and capacity. 7. Use a fixed
configurable random seed for repeatable output. 8. Mark simulated data
if a suitable field exists. The current `occupancy_records` reference
schema does not include `is_simulated`; do not assume it exists. If
distinguishing synthetic from real CV records is important, recommend a
migration adding a source field (e.g. `data_source`) rather than
silently changing the schema. 9. Make reruns safe. Avoid inserting the
same historical time points repeatedly. First inspect existing unique
constraints. If none can support upsert, implement a documented
delete-and-regenerate operation limited strictly to records previously
marked as simulated, or add an explicit safe idempotency key/source
field through a migration after explaining it. 10. Use transactions and
clear logging. Do not log secrets.

### B. Optional live demo updater

Suggested name: `scripts/run_live_demo.py`

Requirements: 1. Run separately from the historical generator. 2. Every
configurable 5--10 seconds, update or insert the latest simulated
occupancy for each selected coach. 3. Reuse the existing schema and
ensure the frontend query can retrieve the latest row per coach. 4. Do
not create unbounded duplicate rows every few seconds without a clear
retention strategy. 5. Provide graceful shutdown with Ctrl+C. 6. Never
mix synthetic rows with real CV rows without a reliable source
identifier.

### C. Station arrivals

Generate plausible arrival previews for both lines: - Valid station and
train foreign keys. - Reasonable non-negative ETAs. - Passenger count
between zero and capacity. - Direction labels consistent with the chosen
route direction. - `is_simulated = TRUE`. - Safe reruns; do not
duplicate the full station/train combinations on every run.

Arrival data is a demo preview, not a real timetable. Do not imply it is
live operational data.

------------------------------------------------------------------------

## 6. Validation queries

Run these after generation, adjusting only if the live schema differs.

### Station counts by line

``` sql
SELECT line_name, COUNT(*) AS station_count
FROM stations
GROUP BY line_name
ORDER BY line_name;
```

Expected reference counts: Aqua Line = 16, Purple Line = 14.

### Occupancy row counts and time coverage

``` sql
SELECT
    c.coach_code,
    COUNT(o.id) AS records,
    MIN(o.recorded_at) AS first_record,
    MAX(o.recorded_at) AS latest_record
FROM coaches c
LEFT JOIN occupancy_records o ON o.coach_id = c.id
GROUP BY c.coach_code
ORDER BY c.coach_code;
```

### Check percentage consistency

``` sql
SELECT o.id, c.coach_code, o.passenger_count, c.capacity, o.occupancy_pct
FROM occupancy_records o
JOIN coaches c ON c.id = o.coach_id
WHERE ABS(o.occupancy_pct - (100.0 * o.passenger_count / c.capacity)) > 0.1;
```

This should return no rows, allowing for the chosen rounding tolerance.

### Arrival records by line

``` sql
SELECT s.line_name, COUNT(*) AS arrival_rows
FROM station_arrivals a
JOIN stations s ON s.id = a.station_id
GROUP BY s.line_name
ORDER BY s.line_name;
```

------------------------------------------------------------------------

## 7. Environment and execution instructions

-   Use the repository's existing backend/database virtual environment
    and Python version. Do not create another environment unless needed.
-   Inspect `requirements.txt` before installing dependencies; add only
    missing packages.
-   Follow the project's existing PostgreSQL driver and SQLAlchemy URL
    conventions. For example, do not use `postgresql+psycopg://` unless
    the `psycopg` package is installed; do not assume `psycopg2` and
    `psycopg` are interchangeable in the URL.
-   Add exact Windows PowerShell commands to the README or final report
    for activating the correct virtual environment and running each
    script.
-   Keep `.env` out of Git. Update `.env.example` with variable names
    only if necessary.
-   Do not claim scripts or database inserts succeeded unless they were
    actually run and verified.

------------------------------------------------------------------------

## 8. Final report expected from Antigravity

After implementation, report: 1. Files created or modified. 2.
Assumptions made after inspecting the live schema. 3. Exact PowerShell
commands to generate history, verify it, and run the optional live
updater. 4. SQL queries/results used to validate the records. 5. Any
schema migration required for safe reruns or separating simulated data
from CV data. 6. Any errors or steps that could not be verified.

**Priority:** preserve the current database, make the demo repeatable
and realistic, and keep synthetic data separate from real occupancy
measurements.
