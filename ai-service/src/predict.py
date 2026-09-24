"""Inference Module: End-to-End H2S Gas Detection with Dual-Signal Validation.

Accepts an input image, assesses quality, localizes sensor candidates using multi-cue
detection, validates candidate color against the copper acetate reference progression,
normalizes illumination, and independently computes:
1. PPM_RF: Random Forest regression estimate on balanced features.
2. PPM_ref: Continuous projection along the copper acetate chromaticity trajectory.
3. Disagreement check and evidence-based predictionConfidence.
4. Data-derived out-of-distribution (OOD) protection.
5. Configurable industrial safety categories (NORMAL, LOW, MODERATE, HIGH).
"""

import argparse
import json
import os
import sys
from typing import Dict, List, Optional, Tuple, Union, Any

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import joblib
import numpy as np
import pandas as pd
from src.image_processor import StripProcessor, FEATURE_NAMES
from src.temporal_tracker import TemporalStabilityTracker

MODEL_DIR = "models"

# Project safety exposure thresholds based on OSHA / ACGIH standards:
# - NORMAL: < 1.0 ppm (ambient baseline trace)
# - LOW: 1.0 - 5.0 ppm (within permissible 8-hr TWA)
# - MODERATE: > 5.0 - < 10.0 ppm (exceeds ACGIH 15-min STEL)
# - HIGH: >= 10.0 ppm (exceeds OSHA ceiling limit; immediate respiratory hazard / evacuation)
DEFAULT_SAFETY_THRESHOLDS: Dict[str, float] = {
    "normal_max": 1.0,
    "low_max": 5.0,
    "moderate_max": 10.0
}


def map_risk_level_neutral(
    ppm: Optional[float],
    thresholds: Optional[Dict[str, float]] = None
) -> Tuple[str, str]:
    """Map H2S concentration to neutral industrial safety category.

    Does not claim unverified safety; uses objective exposure tiers:
    NORMAL, LOW, MODERATE, HIGH.
    """
    if ppm is None:
        return "UNKNOWN", "UNKNOWN"
    th = thresholds or DEFAULT_SAFETY_THRESHOLDS
    if ppm < th["normal_max"]:
        return "NORMAL", "NORMAL"
    elif ppm <= th["low_max"]:
        return "LOW", "LOW"
    elif ppm < th["moderate_max"]:
        return "MODERATE", "MODERATE"
    else:
        return "HIGH", "HIGH"


class H2SPredictor:
    """End-to-end H2S predictor combining OpenCV feature extraction and Random Forest inference."""

    def __init__(
        self,
        model_dir: str = MODEL_DIR,
        safety_thresholds: Optional[Dict[str, float]] = None
    ):
        self.model_dir = model_dir
        self.metadata_path = os.path.join(model_dir, "model_metadata.json")
        self.regressor_path = os.path.join(model_dir, "random_forest_regressor.pkl")
        self.classifier_path = os.path.join(model_dir, "random_forest_classifier.pkl")
        self.general_regressor_path = os.path.join(model_dir, "random_forest_general.pkl")
        self.safety_thresholds = safety_thresholds or DEFAULT_SAFETY_THRESHOLDS

        if not os.path.exists(self.regressor_path) or not os.path.exists(self.metadata_path):
            raise FileNotFoundError(
                f"Trained models or metadata not found in '{model_dir}'. Run train_model.py first."
            )

        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        self.regressor = joblib.load(self.regressor_path)
        self.classifier = joblib.load(self.classifier_path)
        self.general_regressor = (
            joblib.load(self.general_regressor_path)
            if os.path.exists(self.general_regressor_path)
            else None
        )

        baseline_lab = tuple(self.metadata.get("baseline_lab", [148.0, 104.0, 132.0]))
        self.processor = StripProcessor(baseline_lab=baseline_lab)
        self.temporal_tracker = TemporalStabilityTracker()

    def predict_from_features(
        self,
        features: Dict[str, float],
        exposure_time_min: Optional[float] = None,
        detection_meta: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """Run ML prediction directly on pre-extracted feature dictionary with dual-signal validation."""
        l_obs = features.get("L", 128.0)
        a_obs = features.get("a", 128.0)
        b_obs = features.get("b", 128.0)
        r_obs = features.get("R", 128.0)
        g_obs = features.get("G", 128.0)
        b_val = features.get("B", 128.0)

        # 1. Independent chromatic reference trajectory projection
        proj = self.processor.reference_scale.project_chromatic_trajectory(
            (l_obs, a_obs, b_obs),
            (r_obs, g_obs, b_val)
        )
        ppm_ref = proj["ppm_ref"]
        d_perp = proj["d_perp"]
        is_ood = proj["is_out_of_distribution"]

        # 2. Check for physical chemical saturation
        is_sat, sat_msg = self.processor.check_saturation(features)
        if is_sat:
            return {
                "estimated_ppm": None,
                "predicted_ppm": 10.0,
                "predictedPpm": 10.0,
                "referencePpm": 10.0,
                "rfPpm": 10.0,
                "disagreementPpm": 0.0,
                "risk_category": "HIGH",
                "riskCategory": "HIGH",
                "exposure_level": "HIGH",
                "exposureLevel": "HIGH",
                "sensor_status": sat_msg,
                "sensorStatus": sat_msg,
                "sensor_detected": True,
                "sensorDetected": True,
                "sensor_confidence": 0.95,
                "sensorConfidence": 0.95,
                "prediction_confidence": 0.95,
                "predictionConfidence": 0.95,
                "confidence_score": 0.95,
                "isOutOfDistribution": False,
                "is_out_of_distribution": False,
                "retake_required": False,
                "retakeRequired": False,
                "features": features,
                "warning": (
                    "PHYSICAL SENSOR SATURATION: Chemical matrix has completely darkened (CuS precipitate). "
                    "Exceeds calibrated range (> 10 ppm). Hazardous H2S gas detected!"
                ),
                "diagnostics": {
                    "rawRgb": [r_obs, g_obs, b_val],
                    "normalizedRgb": list(proj["norm_rgb"]),
                    "lab": [l_obs, a_obs, b_obs],
                    "deltaE": features.get("DeltaE", 0.0),
                    "trajectoryPpm": 10.0,
                    "rfPpm": 10.0,
                    "disagreementPpm": 0.0,
                    "oodDistance": proj["ood_distance"],
                    "oodThreshold": proj["ood_threshold"],
                    "isOutOfDistribution": False
                }
            }

        # 3. Check candidate validity against reference scale
        ref_eval = self.processor.reference_scale.evaluate_candidate_color(
            (l_obs, a_obs, b_obs),
            candidate_rgb=(r_obs, g_obs, b_val)
        )

        if not ref_eval["is_consistent"]:
            return {
                "estimated_ppm": None,
                "predicted_ppm": 0.0,
                "predictedPpm": 0.0,
                "referencePpm": None,
                "rfPpm": None,
                "disagreementPpm": None,
                "risk_category": "INVALID_SCAN_NO_SENSOR",
                "riskCategory": "INVALID_SCAN_NO_SENSOR",
                "exposure_level": "UNKNOWN",
                "exposureLevel": "UNKNOWN",
                "sensor_status": "INVALID_COLOR_OUT_OF_DOMAIN",
                "sensorStatus": "INVALID_COLOR_OUT_OF_DOMAIN",
                "sensor_detected": False,
                "sensorDetected": False,
                "sensor_confidence": ref_eval["sensor_confidence"],
                "sensorConfidence": ref_eval["sensor_confidence"],
                "prediction_confidence": 0.0,
                "predictionConfidence": 0.0,
                "confidence_score": 0.0,
                "isOutOfDistribution": is_ood,
                "is_out_of_distribution": is_ood,
                "retake_required": True,
                "retakeRequired": True,
                "features": features,
                "warning": ref_eval.get("rejection_reason") or "Color does not follow copper-acetate progression.",
                "diagnostics": {
                    "rawRgb": [r_obs, g_obs, b_val],
                    "normalizedRgb": list(proj["norm_rgb"]),
                    "lab": [l_obs, a_obs, b_obs],
                    "deltaE": features.get("DeltaE", 0.0),
                    "trajectoryPpm": None,
                    "rfPpm": None,
                    "disagreementPpm": None,
                    "oodDistance": proj["ood_distance"],
                    "oodThreshold": proj["ood_threshold"],
                    "isOutOfDistribution": is_ood
                }
            }

        # 4. Prepare feature DataFrame matching training names and order
        X = pd.DataFrame([[features[k] for k in FEATURE_NAMES]], columns=FEATURE_NAMES)

        # 5. Model Inference (RF)
        if exposure_time_min is not None and self.general_regressor is not None:
            X_time = pd.DataFrame(
                [[features[k] for k in FEATURE_NAMES] + [float(exposure_time_min)]],
                columns=FEATURE_NAMES + ["exposure_time_min"]
            )
            rf_ppm = float(self.general_regressor.predict(X_time)[0])
            tree_preds = [tree.predict(X_time.values)[0] for tree in self.general_regressor.estimators_]
            uncertainty = float(np.std(tree_preds))
        else:
            rf_ppm = float(self.regressor.predict(X)[0])
            tree_preds = [tree.predict(X.values)[0] for tree in self.regressor.estimators_]
            uncertainty = float(np.std(tree_preds))

        rf_ppm = max(0.0, round(rf_ppm, 2))

        # 6. Disagreement Check between RF and Trajectory Projection
        disagreement_ppm = round(abs(ppm_ref - rf_ppm), 2)

        # Evidence-based prediction confidence:
        # High when RF and Reference agree, dropping smoothly as discrepancy increases
        a_model = float(np.exp(-0.5 * (disagreement_ppm / 1.8) ** 2))
        s_chroma = float(np.exp(-0.5 * (d_perp / 3.0) ** 2))
        pred_conf = float(np.clip(a_model * s_chroma, 0.05, 0.98))

        # RF is the primary statistical estimator as requested; reference provides independent validation
        final_ppm = rf_ppm

        # Neutral Risk Classification
        risk_cat, exposure_lvl = map_risk_level_neutral(final_ppm, self.safety_thresholds)

        diagnostics = {
            "rawRgb": [round(r_obs, 1), round(g_obs, 1), round(b_val, 1)],
            "normalizedRgb": list(proj["norm_rgb"]),
            "lab": [round(l_obs, 1), round(a_obs, 1), round(b_obs, 1)],
            "deltaE": round(features.get("DeltaE", 0.0), 1),
            "trajectoryPpm": ppm_ref,
            "rfPpm": rf_ppm,
            "disagreementPpm": disagreement_ppm,
            "oodDistance": proj["ood_distance"],
            "oodThreshold": proj["ood_threshold"],
            "isOutOfDistribution": is_ood,
            "illuminationFactor": detection_meta.get("illumination_factor", 1.0) if detection_meta else 1.0
        }

        return {
            "estimated_ppm": final_ppm,
            "predicted_ppm": final_ppm,
            "predictedPpm": final_ppm,
            "referencePpm": ppm_ref,
            "rfPpm": rf_ppm,
            "disagreementPpm": disagreement_ppm,
            "uncertainty_ppm": round(uncertainty, 2),
            "risk_category": risk_cat,
            "riskCategory": risk_cat,
            "exposure_level": exposure_lvl,
            "exposureLevel": exposure_lvl,
            "sensor_status": "VALID_CALIBRATED_RANGE",
            "sensorStatus": "VALID_CALIBRATED_RANGE",
            "sensor_detected": True,
            "sensorDetected": True,
            "sensor_confidence": ref_eval["sensor_confidence"],
            "sensorConfidence": ref_eval["sensor_confidence"],
            "prediction_confidence": round(pred_conf, 3),
            "predictionConfidence": round(pred_conf, 3),
            "confidence_score": round(pred_conf, 3),
            "isOutOfDistribution": is_ood,
            "is_out_of_distribution": is_ood,
            "retake_required": False,
            "retakeRequired": False,
            "features": features,
            "diagnostics": diagnostics,
            "warning": None
        }

    def predict_image(
        self,
        image_input: Union[str, np.ndarray, bytes],
        exposure_time_min: Optional[float] = None,
        manual_roi: Optional[tuple] = None,
        use_central_box: bool = True,
        central_box_ratio: float = 0.40,
        require_wristband: bool = True
    ) -> Dict:
        """Complete pipeline: Image -> Quality -> Localization -> Dual Validation -> RF -> Telemetry."""
        cv_result = self.processor.process_image(
            image_input,
            manual_roi=manual_roi,
            use_central_box=use_central_box,
            central_box_ratio=central_box_ratio,
            require_wristband=require_wristband
        )

        image_quality = cv_result.get("image_quality", "GOOD")
        sensor_detected = cv_result.get("sensor_detected", False)
        sensor_confidence = cv_result.get("sensor_confidence", 0.0)
        is_saturated = cv_result.get("is_saturated", False)
        features = cv_result["features"]
        detection_meta = cv_result.get("detection_meta", {})

        # 1. Poor Image Quality Check (Case C: blur, extreme darkness, severe glare)
        if image_quality == "POOR":
            return {
                "estimated_ppm": None,
                "predicted_ppm": 0.0,
                "predictedPpm": 0.0,
                "referencePpm": None,
                "rfPpm": None,
                "disagreementPpm": None,
                "uncertainty_ppm": 0.0,
                "risk_category": "POOR_IMAGE_QUALITY",
                "riskCategory": "POOR_IMAGE_QUALITY",
                "exposure_level": "UNKNOWN",
                "exposureLevel": "UNKNOWN",
                "sensor_status": "POOR_IMAGE_QUALITY",
                "sensorStatus": "POOR_IMAGE_QUALITY",
                "image_quality": "POOR",
                "imageQuality": "POOR",
                "sensor_detected": False,
                "sensorDetected": False,
                "sensor_confidence": sensor_confidence,
                "sensorConfidence": sensor_confidence,
                "prediction_confidence": 0.0,
                "predictionConfidence": 0.0,
                "confidence_score": 0.0,
                "isOutOfDistribution": False,
                "is_out_of_distribution": False,
                "retake_required": True,
                "retakeRequired": True,
                "features": features,
                "warning": cv_result.get("validation_message") or "Image unclear. Hold the wristband steady and try again.",
                "bbox": cv_result["bbox"],
                "roi": cv_result["roi"],
                "debug_image": cv_result["debug_image"],
                "presence_info": cv_result.get("presence_info", {}),
                "temporal_stability": "UNSTABLE",
                "temporalStability": "UNSTABLE",
                "diagnostics": {
                    "rawRgb": [features.get("R", 0.0), features.get("G", 0.0), features.get("B", 0.0)],
                    "lab": [features.get("L", 0.0), features.get("a", 0.0), features.get("b", 0.0)],
                    "deltaE": features.get("DeltaE", 0.0),
                    "trajectoryPpm": None,
                    "rfPpm": None,
                    "disagreementPpm": None,
                    "oodDistance": detection_meta.get("ood_distance", 0.0),
                    "oodThreshold": detection_meta.get("ood_threshold", 6.80),
                    "isOutOfDistribution": False
                }
            }

        # 2. Chemically Saturated Sensor (CuS dense precipitate > 10 ppm)
        if is_saturated:
            return {
                "estimated_ppm": None,
                "predicted_ppm": 10.0,
                "predictedPpm": 10.0,
                "referencePpm": 10.0,
                "rfPpm": 10.0,
                "disagreementPpm": 0.0,
                "uncertainty_ppm": 0.0,
                "risk_category": "HIGH",
                "riskCategory": "HIGH",
                "exposure_level": "HIGH",
                "exposureLevel": "HIGH",
                "sensor_status": "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)",
                "sensorStatus": "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)",
                "image_quality": "GOOD",
                "imageQuality": "GOOD",
                "sensor_detected": True,
                "sensorDetected": True,
                "sensor_confidence": 0.95,
                "sensorConfidence": 0.95,
                "prediction_confidence": 0.95,
                "predictionConfidence": 0.95,
                "confidence_score": 0.95,
                "isOutOfDistribution": False,
                "is_out_of_distribution": False,
                "retake_required": False,
                "retakeRequired": False,
                "features": features,
                "warning": (
                    "PHYSICAL SENSOR SATURATION: Chemical matrix has completely turned dark (CuS precipitate). "
                    "Exceeds calibrated range (> 10 ppm). Hazardous H2S gas detected!"
                ),
                "bbox": cv_result["bbox"],
                "roi": cv_result["roi"],
                "debug_image": cv_result["debug_image"],
                "presence_info": cv_result.get("presence_info", {}),
                "temporal_stability": "LOCKED",
                "temporalStability": "LOCKED",
                "diagnostics": {
                    "rawRgb": [features.get("R", 0.0), features.get("G", 0.0), features.get("B", 0.0)],
                    "lab": [features.get("L", 0.0), features.get("a", 0.0), features.get("b", 0.0)],
                    "deltaE": features.get("DeltaE", 0.0),
                    "trajectoryPpm": 10.0,
                    "rfPpm": 10.0,
                    "disagreementPpm": 0.0,
                    "oodDistance": detection_meta.get("ood_distance", 0.0),
                    "oodThreshold": detection_meta.get("ood_threshold", 6.80),
                    "isOutOfDistribution": False
                }
            }

        # 3. Sensor Not Detected (Case B: dark watch, black wristband, skin, clothing)
        if not sensor_detected:
            return {
                "estimated_ppm": None,
                "predicted_ppm": 0.0,
                "predictedPpm": 0.0,
                "referencePpm": None,
                "rfPpm": None,
                "disagreementPpm": None,
                "uncertainty_ppm": 0.0,
                "risk_category": "INVALID_SCAN_NO_SENSOR",
                "riskCategory": "INVALID_SCAN_NO_SENSOR",
                "exposure_level": "UNKNOWN",
                "exposureLevel": "UNKNOWN",
                "sensor_status": "SENSOR_NOT_DETECTED",
                "sensorStatus": "SENSOR_NOT_DETECTED",
                "image_quality": "GOOD",
                "imageQuality": "GOOD",
                "sensor_detected": False,
                "sensorDetected": False,
                "sensor_confidence": sensor_confidence,
                "sensorConfidence": sensor_confidence,
                "prediction_confidence": 0.0,
                "predictionConfidence": 0.0,
                "confidence_score": 0.0,
                "isOutOfDistribution": detection_meta.get("is_out_of_distribution", True),
                "is_out_of_distribution": detection_meta.get("is_out_of_distribution", True),
                "retake_required": True,
                "retakeRequired": True,
                "features": features,
                "warning": cv_result.get("validation_message") or "Sensor not found. Point camera at the wristband sensor.",
                "bbox": cv_result["bbox"],
                "roi": cv_result["roi"],
                "debug_image": cv_result["debug_image"],
                "presence_info": cv_result.get("presence_info", {}),
                "temporal_stability": "NO_SENSOR",
                "temporalStability": "NO_SENSOR",
                "diagnostics": {
                    "rawRgb": [features.get("R", 0.0), features.get("G", 0.0), features.get("B", 0.0)],
                    "lab": [features.get("L", 0.0), features.get("a", 0.0), features.get("b", 0.0)],
                    "deltaE": features.get("DeltaE", 0.0),
                    "trajectoryPpm": None,
                    "rfPpm": None,
                    "disagreementPpm": None,
                    "oodDistance": detection_meta.get("ood_distance", 0.0),
                    "oodThreshold": detection_meta.get("ood_threshold", 6.80),
                    "isOutOfDistribution": detection_meta.get("is_out_of_distribution", True)
                }
            }

        # 3. Valid Copper Acetate Sensor (Case A): Execute Dual Validation
        ml_result = self.predict_from_features(
            features,
            exposure_time_min=exposure_time_min,
            detection_meta=detection_meta
        )

        # Update temporal stability tracker
        temporal_eval = self.temporal_tracker.add_frame(
            predicted_ppm=ml_result["predicted_ppm"],
            sensor_detected=True,
            bbox=cv_result["bbox"],
            lab_color=(features.get("L", 128.0), features.get("a", 128.0), features.get("b", 128.0))
        )

        return {
            **ml_result,
            "image_quality": "GOOD",
            "imageQuality": "GOOD",
            "sensor_detected": True,
            "sensorDetected": True,
            "sensor_confidence": sensor_confidence,
            "sensorConfidence": sensor_confidence,
            "bbox": cv_result["bbox"],
            "roi": cv_result["roi"],
            "debug_image": cv_result["debug_image"],
            "presence_info": cv_result.get("presence_info", {}),
            "temporal_stability": temporal_eval["status"],
            "temporalStability": temporal_eval["status"],
            "temporal_details": temporal_eval
        }

    def format_text_report(self, result: Dict) -> str:
        """Format the result report matching the project specification."""
        lines = []
        lines.append("H2S Detection Result")
        lines.append("--------------------")
        lines.append("")

        if result.get("retake_required"):
            lines.append("Estimated concentration: N/A (SENSOR NOT DETECTED / INVALID SCAN)")
            lines.append(f"Risk category: {result['risk_category']}")
            lines.append(f"Sensor status: {result['sensor_status']}")
            lines.append(f"Sensor confidence: {result.get('sensorConfidence', 0.0)}")
            lines.append("")
            lines.append(f"ACTION REQUIRED: {result['warning']}")
        else:
            if result.get("estimated_ppm") is not None:
                lines.append(f"Estimated concentration: {result['estimated_ppm']} ppm")
            else:
                lines.append("Estimated concentration: ABOVE CALIBRATED RANGE (> 10.0 ppm)")
            lines.append(f"Risk level: {result.get('exposureLevel', 'NORMAL')}")
            lines.append(f"Reference trajectory PPM: {result.get('referencePpm')}")
            lines.append(f"Random forest PPM: {result.get('rfPpm')}")
            lines.append(f"Model disagreement: {result.get('disagreementPpm')} ppm")
            lines.append(f"Sensor confidence: {result.get('sensorConfidence')}")
            lines.append(f"Prediction confidence: {result.get('predictionConfidence')}")
            lines.append(f"Temporal stability: {result.get('temporalStability')}")

        return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict H2S concentration from sensor image.")
    parser.add_argument("image_path", help="Path to input photo or strip image")
    parser.add_argument("--exposure-time", type=float, default=None, help="Exposure time in minutes")
    args = parser.parse_args()

    predictor = H2SPredictor()
    result = predictor.predict_image(args.image_path, exposure_time_min=args.exposure_time)
    print(predictor.format_text_report(result))
    if "diagnostics" in result:
        print("\nDiagnostics:")
        print(json.dumps(result["diagnostics"], indent=2))
