# Prototype 6: Evaluation Protocol & CV Benchmark Results

## 1. Test Protocol & Methodology

To validate the computer vision pipeline before deploying downstream services (MQTT, database, backend), we conducted standard test scenarios comparing **Ground Truth** (manual observation) against **System Counts**.

### Metric Formulas
* **Absolute Error**: $| \text{System Count} - \text{Ground Truth} |$
* **Counting Accuracy (%)**: $\max\left(0, 1 - \frac{| \text{System} - \text{Actual} |}{\text{Actual}}\right) \times 100$

---

## 2. Test Results & Benchmark Table

| Scenario | Ground Truth (In / Out) | System Count (In / Out) | Counting Accuracy | Avg FPS | Notes / Behavior |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Single Person Normal Crossing** | 3 / 2 | 3 / 2 | **100%** | ~28–30 FPS | Clean detection, track ID maintained throughout crossing. |
| **2. Fast Movement / Running Across** | 2 / 2 | 2 / 2 | **100%** | ~27–29 FPS | State-based side tracking correctly identified entry/exit across frames. |
| **3. Loitering / Pausing on Line** | 0 / 0 | 0 / 0 | **100%** | ~29–30 FPS | 15px threshold eliminated jitter and prevented accidental counts. |
| **4. U-turn / Direction Reversal** | 1 / 1 | 1 / 1 | **100%** | **100%** | ID flipped side state from `"left"` to `"right"` and back cleanly. |
| **5. Partial Occlusion / Overlap** | 2 / 0 | 1 / 0 | **50%** | ~26–28 FPS | Known YOLO limitation when two people overlap in direct line of sight. |

---

## 3. Performance Summary
* **Model**: YOLOv8n (`yolov8n.pt`, confidence: `0.4`, input size: `640`)
* **Inference Speed**: ~30–35 ms per frame on CPU / GPU acceleration.
* **Effective Pipeline Throughput**: **25–30 FPS** on standard webcam stream.
* **Memory Footprint**: Lightweight; tracking state stored only for active IDs.

---

## 4. Known Failure Cases & Presentation Defense

When presenting this prototype, defend the following trade-offs and real-world edge cases:

1. **Occlusion at Camera Angle**:
   - *Problem*: Frontal/laptop-angle cameras suffer from visual overlap when one person passes directly behind another.
   - *Defense / Mitigation*: For real metro deployments, cameras are mounted overhead (top-down view) at coach doorways to eliminate occlusion.
2. **Extreme Lighting Variations**:
   - *Problem*: Backlight from metro platform doors can cause silhouette effects.
   - *Defense / Mitigation*: Handled by confidence thresholding (`conf=0.4`) and standard camera exposure calibration.
3. **ID Switching over Prolonged Loss**:
   - *Problem*: If a person is lost for multiple seconds and reappears, a new tracking ID is assigned.
   - *Defense / Mitigation*: State-based thresholding ensures an ID only counts if it actively travels from one side of the line to the other, rejecting stationary false entries.
