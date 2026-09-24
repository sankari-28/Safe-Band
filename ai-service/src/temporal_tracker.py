"""Temporal Stability Tracker for Video Viewfinder Frames.

Evaluates spatial, chromatic, and concentration stability across consecutive camera
frames to distinguish steady, reliable measurements from erratic movement or jitter.

Provides:
1. Spatial bounding box IoU / translation tracking.
2. Color chromaticity consistency monitoring.
3. PPM concentration variance assessment.
4. Auto-lock readiness and dynamic worker guidance ('Hold steady').
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import time


def compute_iou(boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
    """Compute Intersection over Union (IoU) of two bounding boxes (x, y, w, h)."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    interArea = interW * interH

    boxAArea = boxA[2] * boxA[3]
    boxBArea = boxB[2] * boxB[3]
    unionArea = float(boxAArea + boxBArea - interArea)

    if unionArea <= 0:
        return 0.0
    return float(interArea / unionArea)


class TemporalStabilityTracker:
    """Maintains a rolling window of recent frame observations to evaluate stability."""

    def __init__(self, window_size: int = 5, lock_frame_count: int = 3):
        self.window_size = window_size
        self.lock_frame_count = lock_frame_count
        self.history: List[Dict[str, Any]] = []

    def reset(self):
        """Clear historical frames."""
        self.history.clear()

    def add_frame(
        self,
        predicted_ppm: Optional[float],
        sensor_detected: bool,
        bbox: Optional[Tuple[int, int, int, int]] = None,
        lab_color: Optional[Tuple[float, float, float]] = None
    ) -> Dict[str, Any]:
        """Record an incoming video frame and evaluate rolling temporal stability.

        Returns:
            Dict containing:
                - status (str): 'LOCKED', 'STABILIZING', 'UNSTABLE', or 'NO_SENSOR'
                - stability_score (float in [0.0, 1.0])
                - ppm_mean (Optional[float])
                - ppm_std (Optional[float])
                - iou_mean (Optional[float])
                - guidance_message (str)
                - is_locked (bool): True if reading has met lock criteria
        """
        frame_record = {
            "timestamp": time.time(),
            "ppm": predicted_ppm,
            "sensor_detected": sensor_detected,
            "bbox": bbox,
            "lab": lab_color
        }

        self.history.append(frame_record)
        if len(self.history) > self.window_size:
            self.history.pop(0)

        # 1. If current frame has no sensor detected
        if not sensor_detected:
            return {
                "status": "NO_SENSOR",
                "stability_score": 0.0,
                "ppm_mean": None,
                "ppm_std": None,
                "iou_mean": None,
                "guidance_message": "Sensor not found. Point camera at wristband.",
                "is_locked": False,
                "frames_tracked": len(self.history)
            }

        # 2. Need at least 2 frames to evaluate temporal dynamics
        if len(self.history) < 2:
            return {
                "status": "STABILIZING",
                "stability_score": 0.50,
                "ppm_mean": predicted_ppm,
                "ppm_std": 0.0,
                "iou_mean": 1.0,
                "guidance_message": "Acquiring sensor tracking...",
                "is_locked": False,
                "frames_tracked": 1
            }

        # 3. Calculate spatial stability (IoU across adjacent frames)
        ious = []
        for i in range(len(self.history) - 1):
            b1 = self.history[i].get("bbox")
            b2 = self.history[i + 1].get("bbox")
            if b1 and b2:
                ious.append(compute_iou(b1, b2))
        avg_iou = float(np.mean(ious)) if ious else 0.80

        # 4. Calculate concentration stability (PPM standard deviation)
        ppms = [h["ppm"] for h in self.history if h["ppm"] is not None and h["sensor_detected"]]
        if len(ppms) >= 2:
            ppm_mean = float(np.mean(ppms))
            ppm_std = float(np.std(ppms))
        else:
            ppm_mean = predicted_ppm
            ppm_std = 0.0

        # 5. Calculate chromatic color stability (LAB variance)
        labs = [h["lab"] for h in self.history if h["lab"] is not None and h["sensor_detected"]]
        if len(labs) >= 2:
            ab_arr = np.array([[l[1], l[2]] for l in labs], dtype=np.float32)
            chroma_std = float(np.mean(np.std(ab_arr, axis=0)))
        else:
            chroma_std = 0.0

        # 6. Combined Stability Score
        # High IoU (>= 0.70) -> spatial score near 1.0
        spatial_score = float(np.clip(avg_iou / 0.75, 0.0, 1.0))
        # Low PPM variance (std <= 0.4 ppm) -> concentration score near 1.0
        ppm_score = float(np.exp(-0.5 * (ppm_std / 0.50) ** 2))
        # Low chromatic variance (std <= 2.0) -> color score near 1.0
        color_score = float(np.exp(-0.5 * (chroma_std / 2.50) ** 2))

        stability_score = float(np.clip(0.40 * spatial_score + 0.40 * ppm_score + 0.20 * color_score, 0.0, 1.0))

        # 7. Auto-lock readiness check
        is_locked = (
            len(ppms) >= self.lock_frame_count and
            stability_score >= 0.82 and
            ppm_std <= 0.60 and
            avg_iou >= 0.65
        )

        if is_locked:
            status = "LOCKED"
            guidance = f"Sensor locked steady: {round(ppm_mean, 1)} ppm."
        elif avg_iou >= 0.45 and stability_score >= 0.60:
            status = "STABILIZING"
            guidance = "Holding steady... stabilizing measurement."
        else:
            status = "UNSTABLE"
            guidance = "Hold wristband steady to complete scan."

        return {
            "status": status,
            "stability_score": round(stability_score, 3),
            "ppm_mean": round(ppm_mean, 2) if ppm_mean is not None else None,
            "ppm_std": round(ppm_std, 3),
            "iou_mean": round(avg_iou, 3),
            "guidance_message": guidance,
            "is_locked": is_locked,
            "frames_tracked": len(self.history)
        }
