# edge/src/sender.py
"""Lightweight HTTP client that POSTs occupancy data to the backend."""

import time
from datetime import datetime, timezone
import requests
from config import BACKEND_URL, TRAIN_ID, COACH_ID, SEND_INTERVAL


class OccupancySender:
    def __init__(self):
        self._last_send = 0.0

    def maybe_send(self, passenger_count: int, occupancy_pct: float):
        """Send if SEND_INTERVAL has elapsed. Never raises."""
        now = time.time()
        if now - self._last_send < SEND_INTERVAL:
            return

        payload = {
            "train_id": TRAIN_ID,
            "coach_id": COACH_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "passenger_count": passenger_count,
            "occupancy_pct": occupancy_pct,
            "device_status": "active",
        }

        try:
            resp = requests.post(BACKEND_URL, json=payload, timeout=2)
            resp.raise_for_status()
            self._last_send = now
        except Exception as exc:
            # Log but never crash the CV loop
            print(f"[sender] POST failed: {exc}")
