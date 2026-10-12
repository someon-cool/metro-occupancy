# edge/src/detector.py
import os
from pathlib import Path
from ultralytics import YOLO

# Prefer the bundled model in edge/models/; fall back to the legacy src-local copy.
_SRC_DIR   = Path(__file__).parent          # edge/src/
_MODELS_DIR = _SRC_DIR.parent / "models"   # edge/models/

def _resolve_weights(name: str = "yolov8n.pt") -> str:
    bundled = _MODELS_DIR / name
    legacy  = _SRC_DIR / name
    if bundled.exists():
        return str(bundled)
    if legacy.exists():
        return str(legacy)
    # Let Ultralytics download it to the cwd as a last resort.
    return name


class PersonDetector:
    def __init__(self, weights: str = "yolov8n.pt", conf: float = 0.4, imgsz: int = 640):
        path = _resolve_weights(weights)
        self.model = YOLO(path)
        self.conf  = conf
        self.imgsz = imgsz

    def track(self, frame):
        """Run tracking on one frame.

        Returns
        -------
        annotated : np.ndarray   BGR frame with YOLO annotation overlay
        ids       : list[int]    track IDs present in this frame
        centers   : dict[int, tuple[int,int]]  {track_id: (cx, cy)}
        """
        r = self.model.track(
            frame,
            persist=True,
            classes=[0],        # person class only
            conf=self.conf,
            imgsz=self.imgsz,
            verbose=False,
        )[0]

        ids: list[int]                 = []
        centers: dict[int, tuple[int, int]] = {}

        if r.boxes.id is not None:
            ids   = r.boxes.id.int().tolist()
            boxes = r.boxes.xyxy.cpu().numpy()
            for tid, box in zip(ids, boxes):
                cx = int((box[0] + box[2]) / 2)
                cy = int((box[1] + box[3]) / 2)
                centers[tid] = (cx, cy)

        return r.plot(), ids, centers