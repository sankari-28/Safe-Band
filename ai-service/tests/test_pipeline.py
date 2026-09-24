"""Automated Test Suite for H2S Gas Detection System."""

import json
import os
import unittest
import numpy as np

from src.image_processor import StripProcessor, FEATURE_NAMES, DEFAULT_BASELINE_LAB
from src.predict import H2SPredictor


class TestH2SDetectionPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.predictor = H2SPredictor()
        cls.processor = StripProcessor()

    def test_feature_names_order(self):
        """Verify feature ordering is exactly fixed."""
        expected = ["R", "G", "B", "H", "S", "V", "L", "a", "b", "DeltaE"]
        self.assertEqual(FEATURE_NAMES, expected)

    def test_baseline_delta_e_zero(self):
        """Verify unexposed baseline color yields DeltaE ~ 0."""
        # Unexposed copper acetate BGR
        swatch_bgr = np.full((50, 50, 3), (132, 151, 92), dtype=np.uint8)
        features = self.processor.extract_color_features(swatch_bgr)
        self.assertLess(features["DeltaE"], 2.5)
        self.assertAlmostEqual(features["L"], 148.0, delta=3.0)

    def test_opencv_feature_ranges(self):
        """Verify HSV and LAB extracted values respect OpenCV 8-bit conventions."""
        test_img = np.random.randint(50, 200, (100, 100, 3), dtype=np.uint8)
        features = self.processor.extract_color_features(test_img)
        self.assertTrue(0 <= features["H"] <= 179)
        self.assertTrue(0 <= features["S"] <= 255)
        self.assertTrue(0 <= features["V"] <= 255)
        self.assertTrue(0 <= features["L"] <= 255)
        self.assertTrue(0 <= features["a"] <= 255)
        self.assertTrue(0 <= features["b"] <= 255)

    def test_baseline_prediction_safe(self):
        """Verify unexposed strip predicts <= 1.0 ppm and Normal / Safe."""
        res = self.predictor.predict_image("images/test_strip_0ppm_baseline.png")
        self.assertIn(res["risk_category"], ["NORMAL", "Normal / Safe"])
        self.assertTrue(res["sensor_detected"])
        self.assertLessEqual(res["estimated_ppm"], 1.0)
        self.assertEqual(res["sensor_status"], "VALID_CALIBRATED_RANGE")
        self.assertIn("referencePpm", res)
        self.assertIn("disagreementPpm", res)

    def test_moderate_risk_prediction(self):
        """Verify 5 ppm test strip predicts Moderate Risk (~5 ppm)."""
        res = self.predictor.predict_image("images/test_strip_5ppm_15min.png")
        self.assertTrue(res["sensor_detected"])
        self.assertIn(res["risk_category"], ["Moderate Risk", "Low Risk", "MODERATE", "LOW"])
        self.assertTrue(3.5 <= res["estimated_ppm"] <= 7.5)

    def test_saturation_detection(self):
        """Verify physically saturated strip is flagged and returns ABOVE CALIBRATED RANGE or HIGH."""
        res = self.predictor.predict_image("images/test_strip_saturated.png")
        self.assertTrue(res["sensor_detected"])
        self.assertTrue("ABOVE CALIBRATED" in res["risk_category"] or res["risk_category"] == "HIGH")
        self.assertIsNotNone(res["warning"])

    def test_copper_acetate_progression_accepted(self):
        """Verify valid copper-acetate brown reaction color is accepted and predicted."""
        # 9.0 ppm reference copper-acetate features
        progression_brown_features = {
            "R": 53.26, "G": 67.56, "B": 54.56,
            "H": 54.25, "S": 51.00, "V": 67.57,
            "L": 68.75, "a": 119.25, "b": 134.00,
            "DeltaE": 80.76
        }
        res = self.predictor.predict_from_features(progression_brown_features)
        self.assertFalse(res["retake_required"])
        self.assertTrue(res["sensor_detected"])
        self.assertIsNotNone(res["estimated_ppm"])
        self.assertTrue(7.0 <= res["estimated_ppm"] <= 10.0)

    def test_empty_background_rejected(self):
        """Verify empty background without sensor is rejected."""
        res = self.predictor.predict_image("images/test_empty_table.png")
        self.assertTrue(res["retake_required"])
        self.assertFalse(res["sensor_detected"])
        self.assertIsNone(res["estimated_ppm"])

    def test_metadata_consistency(self):
        """Verify saved model metadata contains required keys."""
        meta_path = os.path.join("models", "model_metadata.json")
        self.assertTrue(os.path.exists(meta_path))
        with open(meta_path, "r") as f:
            meta = json.load(f)
        self.assertEqual(meta["feature_order"], FEATURE_NAMES)
        self.assertGreater(meta["metrics"]["calibrated_regressor"]["r2"], 0.95)
        self.assertGreater(meta["metrics"]["risk_classifier"]["accuracy"], 0.95)


if __name__ == "__main__":
    unittest.main()
