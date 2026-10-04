# edge/src/config.py
# Centralised configuration for the edge device.

BACKEND_URL = "http://localhost:8000/occupancy"
TRAIN_ID = "TRAIN-001"
COACH_ID = "COACH-A1"
SEND_INTERVAL = 2.0   # seconds between POSTs to backend
COACH_CAPACITY = 50
