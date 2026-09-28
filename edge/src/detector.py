# edge/src/detector.py
from ultralytics import YOLO

class PersonDetector:
    def __init__(self, weights="yolov8n.pt", conf=0.4, imgsz=640):
        self.model = YOLO(weights)
        self.conf, self.imgsz = conf, imgsz

    def track(self, frame):
        """Returns (annotated_frame, list_of_track_ids, dict_of_id_to_center)."""
        r = self.model.track(frame, persist=True, classes=[0],
                             conf=self.conf, imgsz=self.imgsz, verbose=False)[0]
        ids = []
        centers = {}
        if r.boxes.id is not None:
            ids = r.boxes.id.int().tolist()
            boxes = r.boxes.xyxy.cpu().numpy()
            for tid, box in zip(ids, boxes):
                cx = int((box[0] + box[2]) / 2)
                cy = int((box[1] + box[3]) / 2)
                centers[tid] = (cx, cy)
        return r.plot(), ids, centers