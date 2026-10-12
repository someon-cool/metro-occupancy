# edge/src/counter.py
"""Occupancy estimation with two independent estimators.

In-frame count (primary)
    How many unique tracked persons are visible RIGHT NOW in the frame.
    Directly returns len(track_ids) for the current frame, smoothed with a
    rolling median to reduce single-frame jitter.

Net-flow count (secondary / reference)
    Cumulative entries minus exits at a virtual door line.
    Reliable only when the camera sees a doorway and every crossing is caught.
    Subject to permanent drift on missed crossings.

The learning plan (Stage 8) requires both estimators to run in parallel so
their accuracy can be compared against a ground-truth manual count.
"""

from collections import deque
from statistics import median


class OccupancyCounter:
    """Smooths both occupancy estimators and returns occupancy percentages.

    Parameters
    ----------
    capacity : int
        Coach passenger capacity (from config.COACH_CAPACITY).
    window : int
        Rolling-median window size (frames).  Default 15 ≈ 0.5 s at 30 fps.
    """

    def __init__(self, capacity: int, window: int = 15):
        self.capacity = capacity
        self._in_frame_buf: deque[int] = deque(maxlen=window)
        self._net_flow_buf: deque[int] = deque(maxlen=window)

    # ------------------------------------------------------------------
    # Primary estimator: in-frame visible count
    # ------------------------------------------------------------------
    def update_in_frame(self, visible_count: int) -> tuple[int, float]:
        """Smooth the raw visible-person count and return (smoothed, pct)."""
        self._in_frame_buf.append(max(0, visible_count))
        smoothed = int(median(self._in_frame_buf))
        pct      = round(100.0 * smoothed / self.capacity, 1)
        return smoothed, pct

    # ------------------------------------------------------------------
    # Secondary estimator: net flow  (entries − exits)
    # ------------------------------------------------------------------
    def update_net_flow(self, entries: int, exits: int) -> tuple[int, float]:
        """Smooth entries-minus-exits and return (smoothed, pct).

        The result is clamped to [0, capacity] so it never goes negative
        or above 100 %.
        """
        raw = max(0, entries - exits)
        self._net_flow_buf.append(raw)
        smoothed = int(median(self._net_flow_buf))
        smoothed = min(smoothed, self.capacity)
        pct      = round(100.0 * smoothed / self.capacity, 1)
        return smoothed, pct