# edge/src/main.py
import time
import cv2
from detector import PersonDetector
from config import COACH_CAPACITY
from sender import OccupancySender

det = PersonDetector()
cap = cv2.VideoCapture(0)
sender = OccupancySender()

# P3, P4 & P5: Robust state-based line crossing and Occupancy
# COACH_CAPACITY imported from config.py
THRESHOLD = 15        # Minimum distance from line to register initial side
COOLDOWN_FRAMES = 15  # Ignore re-crossing by same ID within this many frames
STALE_FRAMES = 90     # Remove track state after this many frames unseen
track_side = {}       # {track_id: "left" | "right"}
track_last_seen = {}  # {track_id: last frame_number seen}
track_cooldown = {}   # {track_id: frame_number of last crossing}
entries = 0
exits = 0
frame_count = 0

prev_time = time.time()
fps = 0.0

while True:
    ok, frame = cap.read()
    if not ok:
        break

    frame_count += 1

    # Calculate real-time FPS
    curr_time = time.time()
    dt = curr_time - prev_time
    prev_time = curr_time
    if dt > 0:
        fps = 0.9 * fps + 0.1 * (1.0 / dt) if fps > 0 else (1.0 / dt)

    h, w = frame.shape[:2]
    line_x = w // 2  # Vertical virtual counting line

    annotated, ids, centers = det.track(frame)
    people_count = len(ids)

    # Check crossings and draw center markers for each tracked person
    for tid, (cx, cy) in centers.items():
        # Draw small circle marker at person's center point
        cv2.circle(annotated, (cx, cy), 5, (0, 255, 255), -1)

        # Update last-seen frame for stale track cleanup
        track_last_seen[tid] = frame_count

        # Check side transitions
        if tid not in track_side:
            # Register initial side when sufficiently away from the line
            if cx < line_x - THRESHOLD:
                track_side[tid] = "left"
            elif cx > line_x + THRESHOLD:
                track_side[tid] = "right"
        else:
            current_side = track_side[tid]
            # Skip if this ID crossed too recently (prevents oscillation)
            if frame_count - track_cooldown.get(tid, 0) < COOLDOWN_FRAMES:
                continue
            # Entry: Started from left, now moved past the line to the right
            if current_side == "left" and cx > line_x + THRESHOLD:
                entries += 1
                track_side[tid] = "right"
                track_cooldown[tid] = frame_count
            # Exit: Started from right, now moved past the line to the left
            elif current_side == "right" and cx < line_x - THRESHOLD:
                exits += 1
                track_side[tid] = "left"
                track_cooldown[tid] = frame_count

    # Purge stale tracks not seen for STALE_FRAMES
    stale_ids = [tid for tid, last in track_last_seen.items()
                 if frame_count - last > STALE_FRAMES]
    for tid in stale_ids:
        track_side.pop(tid, None)
        track_last_seen.pop(tid, None)
        track_cooldown.pop(tid, None)

    # P4: Occupancy calculation
    occupancy = entries - exits
    occupancy_pct = round((occupancy / COACH_CAPACITY) * 100, 1)

    # POST to backend (non-blocking, skips if interval hasn't elapsed)
    sender.maybe_send(occupancy, occupancy_pct)

    # Draw the vertical virtual counting line (Cyan line)
    cv2.line(annotated, (line_x, 0), (line_x, h), (255, 255, 0), 2)
    cv2.putText(annotated, "Counting Line", (line_x + 5, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

    # Display HUD: People, Entries, Exits, Occupancy, and FPS
    cv2.putText(annotated, f"People: {people_count}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(annotated, f"Entries: {entries}", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(annotated, f"Exits: {exits}", (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    cv2.putText(annotated, f"Occupancy: {occupancy} / {COACH_CAPACITY}", (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(annotated, f"Occupancy: {occupancy_pct}%", (20, 150),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    cv2.putText(annotated, f"FPS: {fps:.1f}", (w - 140, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Edge", annotated)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release(); cv2.destroyAllWindows()