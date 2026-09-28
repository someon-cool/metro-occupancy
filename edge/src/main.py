# edge/src/main.py
import time
import cv2
from detector import PersonDetector
det = PersonDetector()
cap = cv2.VideoCapture(0)

# P3, P4 & P5: Robust state-based line crossing and Occupancy
COACH_CAPACITY = 50
THRESHOLD = 15        # Minimum distance from line to register initial side
track_side = {}       # {track_id: "left" | "right"}
entries = 0
exits = 0

prev_time = time.time()
fps = 0.0

while True:
    ok, frame = cap.read()
    if not ok:
        break

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

        # Check side transitions
        if tid not in track_side:
            # Register initial side when sufficiently away from the line
            if cx < line_x - THRESHOLD:
                track_side[tid] = "left"
            elif cx > line_x + THRESHOLD:
                track_side[tid] = "right"
        else:
            current_side = track_side[tid]
            # Entry: Started from left, now moved past the line to the right
            if current_side == "left" and cx > line_x + THRESHOLD:
                entries += 1
                track_side[tid] = "right"
            # Exit: Started from right, now moved past the line to the left
            elif current_side == "right" and cx < line_x - THRESHOLD:
                exits += 1
                track_side[tid] = "left"

    # P4: Occupancy calculation
    occupancy = max(0, entries - exits)
    occupancy_pct = round((occupancy / COACH_CAPACITY) * 100, 1)

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