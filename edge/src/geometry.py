# edge/src/geometry.py
"""Geometry helpers used across the edge CV pipeline.

Covers:
  - Line-side test (cross product)
  - IoU (intersection over union) for axis-aligned boxes
  - Foot-point extraction (bottom-centre of a bounding box)

Unit tests live in edge/tests/test_geometry.py.
"""


def line_side(point: tuple[float, float],
              line_start: tuple[float, float],
              line_end:   tuple[float, float]) -> float:
    """Return the signed cross-product Z component for (point) relative to a line.

    Positive  → point is to the left of the directed vector line_start→line_end.
    Negative  → point is to the right.
    Zero      → point is on the line.
    """
    dx = line_end[0] - line_start[0]
    dy = line_end[1] - line_start[1]
    return dx * (point[1] - line_start[1]) - dy * (point[0] - line_start[0])


def iou(box_a: tuple[float, float, float, float],
        box_b: tuple[float, float, float, float]) -> float:
    """Intersection-over-Union for two axis-aligned boxes in xyxy format.

    Parameters
    ----------
    box_a, box_b : (x1, y1, x2, y2)

    Returns
    -------
    float in [0, 1].
    """
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0.0, inter_x2 - inter_x1)
    inter_h = max(0.0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)

    union = area_a + area_b - inter_area
    return inter_area / union if union > 0 else 0.0


def foot_point(box: tuple[float, float, float, float]) -> tuple[int, int]:
    """Return the bottom-centre (foot) of a bounding box in xyxy format.

    The foot point is a better anchor than the centre for line-crossing
    because it represents where the person stands on the floor.
    """
    x1, y1, x2, y2 = box
    return int((x1 + x2) / 2), int(y2)


def centre_point(box: tuple[float, float, float, float]) -> tuple[int, int]:
    """Return the geometric centre of a bounding box in xyxy format."""
    x1, y1, x2, y2 = box
    return int((x1 + x2) / 2), int((y1 + y2) / 2)
