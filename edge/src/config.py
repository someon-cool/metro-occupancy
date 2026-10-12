from pathlib import Path

# Repo root is 2 levels up from edge/src/ (i.e. d:\Projects\metro)
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_VIDEO = _REPO_ROOT / "metro_video.mp4"

# ── Video source ──────────────────────────────────────────────────────────────
# 0             → default webcam (original behaviour)
# "path/to/file" → video file (relative or absolute)
VIDEO_SOURCE: int | str = str(_DEFAULT_VIDEO) if _DEFAULT_VIDEO.exists() else 0

# ── Backend ───────────────────────────────────────────────────────────────────
BACKEND_URL   = "http://localhost:8000/occupancy"
TRAIN_ID      = "TRAIN-001"
COACH_ID      = "COACH-A1"
SEND_INTERVAL = 2.0   # seconds between POSTs to backend

# ── Coach capacity ────────────────────────────────────────────────────────────
COACH_CAPACITY = 50

# ── Virtual counting line (net-flow secondary estimator) ──────────────────────
# Fraction of frame width (0.0 – 1.0).  0.5 = horizontal centre.
# Adjust to where passengers actually cross in the camera view.
LINE_X_FRACTION: float = 0.5

# ── Line-crossing state-machine parameters ────────────────────────────────────
THRESHOLD       = 15   # px dead-zone either side of the line
COOLDOWN_FRAMES = 15   # ignore re-crossings within this many frames
STALE_FRAMES    = 90   # remove track state after this many frames unseen
