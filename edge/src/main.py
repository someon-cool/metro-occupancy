# edge/src/main.py
"""Edge CV pipeline — entry point.

Primary display metric : VISIBLE passengers (in-frame count).
Secondary metric        : Net-flow estimate (entries − exits at the virtual line).

The two estimators run in parallel so they can be compared per the learning
plan (Stage 8).  The virtual counting line is retained for the net-flow
estimator but is NOT used to drive the primary occupancy display.

Source can be switched between a webcam index and a video file via config:
  - Set VIDEO_SOURCE = 0 for the default webcam.
  - Set VIDEO_SOURCE = "/path/to/video.mp4" for a file.
"""

import time
import sys
import cv2

from detector import PersonDetector
from counter  import OccupancyCounter
from sender   import OccupancySender
from config   import (
    COACH_CAPACITY,
    VIDEO_SOURCE,
    LINE_X_FRACTION,
    THRESHOLD,
    COOLDOWN_FRAMES,
    STALE_FRAMES,
)

# ── Initialise components ─────────────────────────────────────────────────────
det    = PersonDetector()
occ    = OccupancyCounter(capacity=COACH_CAPACITY)
sender = OccupancySender()

# ── Open video source ─────────────────────────────────────────────────────────
cap = cv2.VideoCapture(VIDEO_SOURCE)
if not cap.isOpened():
    sys.exit(f"[ERROR] Cannot open video source: {VIDEO_SOURCE!r}")

video_fps    = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
src_label    = (f"webcam:{VIDEO_SOURCE}"
                if isinstance(VIDEO_SOURCE, int)
                else str(VIDEO_SOURCE).split("\\")[-1].split("/")[-1])
print(f"[edge] source={src_label}  frames={total_frames}  native_fps={video_fps:.1f}")

# ── Net-flow state (secondary estimator, retained from original pipeline) ─────
track_side: dict[int, str]  = {}
track_last_seen: dict[int, int] = {}
track_cooldown: dict[int, int]  = {}
entries = 0
exits   = 0
frame_count = 0

# ── FPS measurement ───────────────────────────────────────────────────────────
prev_time = time.time()
fps = 0.0

WIN_NAME = "Edge — Metro CV"
cv2.namedWindow(WIN_NAME, cv2.WINDOW_NORMAL)
cv2.resizeWindow(WIN_NAME, 540, 960)

# ── Main loop ─────────────────────────────────────────────────────────────────
while True:
    ok, frame = cap.read()
    if not ok:
        break

    frame_count += 1

    # EMA FPS
    curr_time = time.time()
    dt = curr_time - prev_time
    prev_time = curr_time
    if dt > 0:
        fps = 0.9 * fps + 0.1 / dt if fps > 0 else 1.0 / dt

    h, w = frame.shape[:2]
    line_x = int(w * LINE_X_FRACTION)

    # ── Detect & track ────────────────────────────────────────────────────────
    annotated, ids, centers = det.track(frame)

    # ── PRIMARY: in-frame visible count ──────────────────────────────────────
    visible_raw                    = len(ids)
    visible_smooth, visible_pct    = occ.update_in_frame(visible_raw)

    # ── SECONDARY: net-flow (entries − exits) crossing logic ─────────────────
    for tid, (cx, cy) in centers.items():
        cv2.circle(annotated, (cx, cy), 5, (0, 255, 255), -1)
        track_last_seen[tid] = frame_count

        if tid not in track_side:
            if cx < line_x - THRESHOLD:
                track_side[tid] = "left"
            elif cx > line_x + THRESHOLD:
                track_side[tid] = "right"
        else:
            current_side = track_side[tid]
            if frame_count - track_cooldown.get(tid, 0) < COOLDOWN_FRAMES:
                continue
            if current_side == "left" and cx > line_x + THRESHOLD:
                entries += 1
                track_side[tid]    = "right"
                track_cooldown[tid] = frame_count
            elif current_side == "right" and cx < line_x - THRESHOLD:
                exits += 1
                track_side[tid]    = "left"
                track_cooldown[tid] = frame_count

    # Purge stale tracks
    stale = [t for t, last in track_last_seen.items()
             if frame_count - last > STALE_FRAMES]
    for t in stale:
        track_side.pop(t, None)
        track_last_seen.pop(t, None)
        track_cooldown.pop(t, None)

    net_smooth, net_pct = occ.update_net_flow(entries, exits)

    # ── Send to backend (uses primary in-frame count) ─────────────────────────
    sender.maybe_send(visible_smooth, visible_pct)

    # ── Draw HUD ─────────────────────────────────────────────────────────────
    # Virtual counting line (retained for net-flow reference)
    cv2.line(annotated, (line_x, 0), (line_x, h), (255, 255, 0), 2)
    cv2.putText(annotated, "Line (net-flow ref)", (line_x + 5, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 0), 1)

    # Primary block — visible count (top-left, cyan labels)
    y0 = 30
    def put(label, val, y, color=(0, 255, 255)):
        cv2.putText(annotated, f"{label}: {val}", (20, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2)

    put("Visible (raw)",    visible_raw,                       y0)
    put("Visible (smooth)", visible_smooth,                    y0 + 30)
    put("Visible %",        f"{visible_pct}% / {COACH_CAPACITY}", y0 + 60)

    # Secondary block — net flow (below, different colour)
    put("Net-flow IN",  entries,                          y0 + 105, (0, 255, 0))
    put("Net-flow OUT", exits,                            y0 + 135, (0, 120, 255))
    put("Net occupancy", f"{net_smooth} ({net_pct}%)",   y0 + 165, (180, 180, 180))

    # FPS (top-right)
    cv2.putText(annotated, f"FPS: {fps:.1f}", (w - 140, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow(WIN_NAME, annotated)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
print(f"\n[edge] Done. Frames={frame_count}  Entries={entries}  Exits={exits}")
print(f"[edge] Final visible (smooth)={visible_smooth}  net-flow={net_smooth}")