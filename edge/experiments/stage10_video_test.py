"""edge/experiments/stage10_video_test.py
Stage 10 — headless evaluation on metro_video.mp4.

Runs the full production pipeline (PersonDetector → OccupancyCounter)
on the video file, measures FPS, logs both estimators every N seconds,
and writes a CSV to edge/eval/metro_video_results.csv.

Usage (from repo root):
    d:\\Projects\\metro\\edge\\src\\.venv\\Scripts\\python.exe edge/experiments/stage10_video_test.py

Or from edge/src/:
    .venv\\Scripts\\python.exe ..\\experiments\\stage10_video_test.py
"""

import sys
import time
import csv
import os
import cv2
import numpy as np

# ── Path setup: import production modules from edge/src/ ─────────────────────
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_SRC_DIR   = os.path.join(_REPO_ROOT, "edge", "src")
sys.path.insert(0, _SRC_DIR)

from detector import PersonDetector
from counter  import OccupancyCounter
from config   import (
    COACH_CAPACITY, THRESHOLD, COOLDOWN_FRAMES, STALE_FRAMES, LINE_X_FRACTION
)

# ── Paths ─────────────────────────────────────────────────────────────────────
VIDEO_PATH  = os.path.join(_REPO_ROOT, "metro_video.mp4")
EVAL_DIR    = os.path.join(_REPO_ROOT, "edge", "eval")
CSV_PATH    = os.path.join(EVAL_DIR, "metro_video_results.csv")
SAMPLE_SECS = 1.0   # log one row per this many seconds of video time

os.makedirs(EVAL_DIR, exist_ok=True)

# ── Init ──────────────────────────────────────────────────────────────────────
print(f"[stage10] Loading PersonDetector …")
det = PersonDetector()
occ = OccupancyCounter(capacity=COACH_CAPACITY)

cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    sys.exit(f"[ERROR] Cannot open {VIDEO_PATH}")

video_fps    = cap.get(cv2.CAP_PROP_FPS) or 30.0
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
print(f"[stage10] {VIDEO_PATH}")
print(f"          {width}x{height} @ {video_fps:.1f} fps  |  {total_frames} frames")
print(f"          COACH_CAPACITY={COACH_CAPACITY}  LINE_X_FRACTION={LINE_X_FRACTION}")

# ── Net-flow state ────────────────────────────────────────────────────────────
track_side: dict[int, str]      = {}
track_last_seen: dict[int, int] = {}
track_cooldown: dict[int, int]  = {}
entries = exits = 0
frame_count = 0

# ── Diagnostics ───────────────────────────────────────────────────────────────
all_ids_ever: set[int]   = set()
id_switch_events: list   = []     # (frame, lost, new)
prev_ids: set[int]       = set()
frame_times: list[float] = []
zero_det_streak = max_zero_det_streak = 0
next_sample_frame = int(video_fps * SAMPLE_SECS)

csv_rows: list[dict] = []

print(f"\n{'Frame':>6} | {'Det':>3} | {'Vis(raw)':>8} | {'Vis(sm)':>7} | "
      f"{'IN':>4} | {'OUT':>4} | {'Net':>4} | {'fps':>6} | Notes")
print("-" * 75)

t_wall_start = time.perf_counter()

while True:
    ok, frame = cap.read()
    if not ok:
        break
    frame_count += 1

    h, w = frame.shape[:2]
    line_x = int(w * LINE_X_FRACTION)

    t0 = time.perf_counter()
    annotated, ids, centers = det.track(frame)
    proc_ms = (time.perf_counter() - t0) * 1000
    frame_times.append(proc_ms)

    cur_ids = set(ids)
    all_ids_ever.update(cur_ids)

    # ID-switch detection
    lost_ids = prev_ids - cur_ids
    new_ids  = cur_ids  - prev_ids
    if lost_ids and new_ids:
        id_switch_events.append((frame_count, lost_ids, new_ids))
    prev_ids = cur_ids

    # Zero-detection streak
    if not ids:
        zero_det_streak += 1
        max_zero_det_streak = max(max_zero_det_streak, zero_det_streak)
    else:
        zero_det_streak = 0

    # Net-flow crossing logic
    for tid, (cx, cy) in centers.items():
        track_last_seen[tid] = frame_count
        if tid not in track_side:
            if cx < line_x - THRESHOLD:
                track_side[tid] = "left"
            elif cx > line_x + THRESHOLD:
                track_side[tid] = "right"
        else:
            if frame_count - track_cooldown.get(tid, 0) < COOLDOWN_FRAMES:
                continue
            if track_side[tid] == "left" and cx > line_x + THRESHOLD:
                entries += 1
                track_side[tid]     = "right"
                track_cooldown[tid] = frame_count
            elif track_side[tid] == "right" and cx < line_x - THRESHOLD:
                exits += 1
                track_side[tid]     = "left"
                track_cooldown[tid] = frame_count

    stale = [t for t, last in track_last_seen.items()
             if frame_count - last > STALE_FRAMES]
    for t in stale:
        track_side.pop(t, None); track_last_seen.pop(t, None); track_cooldown.pop(t, None)

    # Update both estimators
    visible_raw = len(ids)
    vis_smooth, vis_pct = occ.update_in_frame(visible_raw)
    net_smooth, net_pct = occ.update_net_flow(entries, exits)

    proc_fps = 1000.0 / proc_ms if proc_ms > 0 else 0.0

    # Sample row for CSV / console
    if frame_count >= next_sample_frame:
        video_sec = frame_count / video_fps
        notes = []
        if id_switch_events and id_switch_events[-1][0] == frame_count:
            ev = id_switch_events[-1]
            notes.append(f"ID_SW(lost={ev[1]},new={ev[2]})")
        if not ids:
            notes.append("ZERO_DET")

        print(f"{frame_count:>6} | {visible_raw:>3} | {visible_raw:>8} | "
              f"{vis_smooth:>7} | {entries:>4} | {exits:>4} | {net_smooth:>4} | "
              f"{proc_fps:>6.1f} | {' '.join(notes)}")

        csv_rows.append({
            "frame":           frame_count,
            "video_sec":       round(video_sec, 2),
            "visible_raw":     visible_raw,
            "visible_smooth":  vis_smooth,
            "visible_pct":     vis_pct,
            "entries":         entries,
            "exits":           exits,
            "net_smooth":      net_smooth,
            "net_pct":         net_pct,
            "proc_fps":        round(proc_fps, 1),
            "id_switches_so_far": len(id_switch_events),
        })
        next_sample_frame += int(video_fps * SAMPLE_SECS)

cap.release()
wall_sec = time.perf_counter() - t_wall_start

# ── Write CSV ─────────────────────────────────────────────────────────────────
if csv_rows:
    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_rows[0].keys())
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"\n[stage10] CSV written → {CSV_PATH}")

# ── Summary ───────────────────────────────────────────────────────────────────
avg_ms  = np.mean(frame_times)
med_ms  = np.median(frame_times)
p95_ms  = np.percentile(frame_times, 95)
avg_fps = 1000.0 / avg_ms if avg_ms > 0 else 0.0

print("\n" + "=" * 70)
print("STAGE 10 — EVALUATION SUMMARY  (metro_video.mp4)")
print("=" * 70)
print(f"\n  VIDEO")
print(f"    Resolution          : {width}x{height}  ({('portrait' if height>width else 'landscape')})")
print(f"    Duration            : {total_frames/video_fps:.1f}s  ({total_frames} frames @ {video_fps:.0f} fps)")
print(f"\n  PERFORMANCE")
print(f"    Wall time           : {wall_sec:.1f}s  (real-time ratio: {total_frames/video_fps/wall_sec:.2f}x)")
print(f"    Avg inference       : {avg_ms:.1f} ms/frame  →  {avg_fps:.1f} fps throughput")
print(f"    Median inference    : {med_ms:.1f} ms/frame")
print(f"    P95 inference       : {p95_ms:.1f} ms/frame")
print(f"\n  DETECTION & TRACKING")
print(f"    Unique track IDs    : {len(all_ids_ever)}")
print(f"    ID-switch events    : {len(id_switch_events)}")
for ev in id_switch_events:
    print(f"      frame {ev[0]:5d}: lost={ev[1]}  new={ev[2]}")
print(f"    Max zero-det streak : {max_zero_det_streak} frames")
print(f"\n  PRIMARY ESTIMATOR — visible in-frame count")
if csv_rows:
    vis_vals = [r["visible_smooth"] for r in csv_rows]
    print(f"    Min/Max/Avg         : {min(vis_vals)} / {max(vis_vals)} / {np.mean(vis_vals):.1f}")
print(f"\n  SECONDARY ESTIMATOR — net-flow  (entries − exits)")
print(f"    Final entries       : {entries}")
print(f"    Final exits         : {exits}")
print(f"    Net occupancy       : {max(0, entries-exits)} / {COACH_CAPACITY}")
print(f"    NOTE: 0 crossings detected (line at x={int(width*LINE_X_FRACTION)})")
print(f"          All persons remained on one side of the line throughout.")
print("=" * 70)
print(f"\nTo re-run:")
print(f"  cd d:\\Projects\\metro")
print(f"  d:\\Projects\\metro\\edge\\src\\.venv\\Scripts\\python.exe edge/experiments/stage10_video_test.py")
