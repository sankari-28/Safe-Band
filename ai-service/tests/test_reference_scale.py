import unittest
from src.reference_scale import CopperAcetateReferenceScale, compute_normalized_rgb, COPPER_ACETATE_REFERENCE_PROGRESSION

class TestReferenceScale(unittest.TestCase):
    def setUp(self):
        self.ref = CopperAcetateReferenceScale()

    def test_normalized_rgb_formula(self):
        # Normal calculation
        r, g, b = compute_normalized_rgb(100.0, 100.0, 200.0)
        self.assertAlmostEqual(r, 0.25)
        self.assertAlmostEqual(g, 0.25)
        self.assertAlmostEqual(b, 0.50)

        # Zero-division protection
        r0, g0, b0 = compute_normalized_rgb(0.0, 0.0, 0.0)
        self.assertAlmostEqual(r0, 1.0 / 3.0)
        self.assertAlmostEqual(g0, 1.0 / 3.0)
        self.assertAlmostEqual(b0, 1.0 / 3.0)

    def test_sensor_colors_accepted(self):
        # 0 PPM, 2 PPM, 5 PPM, 10 PPM
        for name, lab in [
            ("0 PPM", (147.0, 104.0, 131.0)),
            ("2 PPM", (130.0, 108.0, 132.0)),
            ("5 PPM", (86.0, 116.0, 134.0)),
            ("10 PPM", (61.0, 119.0, 135.0)),
        ]:
            res = self.ref.evaluate_candidate_color(lab)
            self.assertTrue(res["is_consistent"], f"Expected {name} to be consistent")
            self.assertGreaterEqual(res["sensor_confidence"], 0.40)
            self.assertFalse(res["is_out_of_distribution"])

    def test_non_sensor_objects_rejected_with_low_confidence(self):
        # Black watch, brown leather watch, human skin, red fabric
        for name, lab, rgb in [
            ("Black Watch", (24.0, 128.0, 128.0), (20, 20, 20)),
            ("Brown Leather Watch", (45.0, 142.0, 146.0), (70, 45, 30)),
            ("Human Skin", (160.0, 145.0, 142.0), (210, 160, 130)),
            ("Red Object", (119.0, 198.0, 178.0), (220, 30, 30)),
            ("Dark Silicone Strap", (28.0, 127.0, 129.0), (25, 25, 28)),
        ]:
            res = self.ref.evaluate_candidate_color(lab, candidate_rgb=rgb)
            self.assertFalse(res["is_consistent"], f"Expected {name} to be rejected")
            # Evidence-based confidence must be low without artificial clamping
            self.assertLessEqual(res["sensor_confidence"], 0.10, f"Expected {name} confidence <= 0.10, got {res['sensor_confidence']}")
            self.assertIsNotNone(res["rejection_reason"])

    def test_chromatic_trajectory_projection(self):
        # Test that projecting exact 5 PPM calibration point yields ~5.0 PPM
        pt5 = COPPER_ACETATE_REFERENCE_PROGRESSION[5]
        proj = self.ref.project_chromatic_trajectory(
            (pt5["L"], pt5["a"], pt5["b"]),
            (pt5["R"], pt5["G"], pt5["B"])
        )
        self.assertAlmostEqual(proj["ppm_ref"], 5.0, delta=0.2)
        self.assertLess(proj["d_perp"], 0.5)
        self.assertFalse(proj["is_out_of_distribution"])

    def test_out_of_distribution_detection(self):
        # Highly saturated yellow highlighter (a=120, b=180)
        proj = self.ref.project_chromatic_trajectory((150.0, 120.0, 185.0), (250.0, 250.0, 20.0))
        self.assertTrue(proj["is_out_of_distribution"])
        self.assertGreater(proj["d_perp"], self.ref.ood_threshold)

if __name__ == "__main__":
    unittest.main()
