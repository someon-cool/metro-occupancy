# edge/src/sender.py
"""Asynchronous, non-blocking HTTP client that POSTs occupancy data to the backend."""

import time
import threading
from datetime import datetime, timezone
import requests
from config import BACKEND_URL, TRAIN_ID, COACH_ID, SEND_INTERVAL


class OccupancySender:
    """Sends occupancy data to the backend asynchronously without blocking the CV loop."""

    def __init__(self, timeout: float = 8.0):
        self._timeout = timeout
        self._last_send = 0.0
        self._is_sending = False
        self._lock = threading.Lock()
        self.last_latency_ms: float = 0.0
        self.last_status: str = "idle"

    def maybe_send(self, passenger_count: int, occupancy_pct: float):
        """Dispatches an async send if SEND_INTERVAL has elapsed and no send is in flight."""
        now = time.time()
        if now - self._last_send < SEND_INTERVAL:
            return

        with self._lock:
            # Drop if a send is already in flight; keeps latest data without queueing
            if self._is_sending:
                return
            self._is_sending = True
            # Update last send timestamp immediately to prevent rapid retries on failure
            self._last_send = now

        payload = {
            "train_id": TRAIN_ID,
            "coach_id": COACH_ID,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "passenger_count": passenger_count,
            "occupancy_pct": occupancy_pct,
            "device_status": "active",
        }

        # Dispatch network I/O to a background daemon thread
        worker = threading.Thread(
            target=self._send_worker,
            args=(payload,),
            daemon=True,
            name="occupancy-sender",
        )
        worker.start()

    def _send_worker(self, payload: dict):
        """Worker executing in a background thread."""
        t0 = time.perf_counter()
        try:
            resp = requests.post(BACKEND_URL, json=payload, timeout=self._timeout)
            resp.raise_for_status()
            self.last_latency_ms = (time.perf_counter() - t0) * 1000
            self.last_status = "ok"
        except Exception as exc:
            self.last_latency_ms = (time.perf_counter() - t0) * 1000
            self.last_status = f"error: {exc}"
            print(f"[sender] POST failed ({self.last_latency_ms:.0f}ms): {exc}")
        finally:
            with self._lock:
                self._is_sending = False

