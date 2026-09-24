"""Integration tests for FastAPI AI Analysis Server."""

import unittest
from fastapi.testclient import TestClient
from src.api_server import app, load_model


class TestApiServer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        load_model()
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        """Verify health check returns UP and model_loaded: True."""
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "UP")
        self.assertTrue(data["model_loaded"])

    def test_reference_scale_endpoint(self):
        """Verify /api/reference-scale returns 11-point visual reference progression."""
        resp = self.client.get("/api/reference-scale")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("reference_scale", data)
        self.assertEqual(len(data["reference_scale"]), 11)

    def test_analysis_5ppm_strip(self):
        """Verify 5 ppm strip returns realistic ppm and isMock: False."""
        with open("images/test_strip_5ppm_15min.png", "rb") as f:
            resp = self.client.post(
                "/api/analysis",
                files={"file": ("test_strip_5ppm_15min.png", f, "image/png")},
                data={"workerId": "WORKER_99"}
            )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["isMock"])
        self.assertFalse(data["retakeRequired"])
        self.assertTrue(data["sensorDetected"])
        self.assertEqual(data["status"], "PROCESSED")
        self.assertTrue(3.5 <= data["predictedPpm"] <= 7.5)
        self.assertEqual(data["workerId"], "WORKER_99")
        self.assertIn("DeltaE", data["features"])

    def test_empty_background_retake_required(self):
        """Verify empty table triggers retakeRequired: True and status RETAKE_REQUIRED."""
        with open("images/test_empty_table.png", "rb") as f:
            resp = self.client.post(
                "/api/analysis",
                files={"file": ("test_empty_table.png", f, "image/png")}
            )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["retakeRequired"])
        self.assertFalse(data["sensorDetected"])
        self.assertEqual(data["status"], "RETAKE_REQUIRED")

    def test_saturated_strip(self):
        """Verify pitch-black saturated strip triggers PHYSICAL_SATURATION."""
        with open("images/test_strip_saturated.png", "rb") as f:
            resp = self.client.post(
                "/api/analysis",
                files={"file": ("test_strip_saturated.png", f, "image/png")}
            )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "PHYSICAL_SATURATION")
        self.assertIn(data["exposureLevel"], ["HIGH", "SATURATED"])
        self.assertTrue(data["sensorDetected"])


if __name__ == "__main__":
    unittest.main()
