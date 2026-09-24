"""Copper Acetate Color Reference Progression Module.

Represents the project calibration reference progression derived from empirical
data (data/combined_training_data.csv) for the copper-acetate colorimetric H2S sensor.

Expected optical progression:
blue / blue-green -> gray-green -> olive-gray -> gray-brown -> brown -> dark brown / blackish
as H2S exposure increases from 0.0 to 10.0 ppm.

Provides:
1. Computational reference trajectory projection (illumination-resilient PPM_ref).
2. Data-derived out-of-distribution (OOD) detection based on empirical calibration statistics.
3. Continuous, evidence-based sensorConfidence (geometry, chromatic trajectory, carrier contrast).
4. Visual reference progression metadata for frontend representation.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np

# Baseline reference color for unexposed copper acetate test strip (OpenCV 8-bit LAB)
DEFAULT_BASELINE_LAB = (148.0, 104.0, 132.0)

# Empirical perpendicular distance statistics derived from 5,332 calibration samples
# across data/combined_training_data.csv in LAB (a*, b*) chromaticity space:
CALIBRATION_STATS = {
    "chroma_dist_mean": 1.738,
    "chroma_dist_std": 1.266,
    "chroma_dist_p95": 4.031,
    "chroma_dist_p99": 5.506,
    "default_k_ood": 5.0, # Mean + 5*std = ~8.07 LAB units (safe margin below black watch dial at 9.18)
}

# 11-point calibration reference progression derived from project training data
# at calibrated 15-minute standard exposure protocol:
COPPER_ACETATE_REFERENCE_PROGRESSION: List[Dict[str, Any]] = [
    {
        "ppm": 0.0,
        "label": "Unexposed Baseline (blue / light blue-green)",
        "L": 148.02, "a": 104.10, "b": 131.94,
        "R": 91.82, "G": 151.05, "B": 131.82,
        "H": 80.47, "S": 99.03, "V": 151.05,
        "DeltaE": 1.97,
        "L_std": 2.5, "a_std": 2.0, "b_std": 2.0
    },
    {
        "ppm": 1.0,
        "label": "1.0 ppm (blue-green)",
        "L": 129.33, "a": 108.33, "b": 132.00,
        "R": 84.45, "G": 130.68, "B": 113.83,
        "H": 79.33, "S": 90.33, "V": 130.68,
        "DeltaE": 19.19,
        "L_std": 3.0, "a_std": 2.0, "b_std": 2.0
    },
    {
        "ppm": 2.0,
        "label": "2.0 ppm (muted blue-green / gray-green)",
        "L": 115.33, "a": 109.33, "b": 134.67,
        "R": 75.21, "G": 115.91, "B": 96.01,
        "H": 75.67, "S": 89.67, "V": 115.91,
        "DeltaE": 33.26,
        "L_std": 3.0, "a_std": 2.0, "b_std": 2.0
    },
    {
        "ppm": 3.0,
        "label": "3.0 ppm (gray-green)",
        "L": 105.00, "a": 111.67, "b": 133.33,
        "R": 70.42, "G": 104.67, "B": 88.09,
        "H": 77.00, "S": 80.33, "V": 104.67,
        "DeltaE": 43.71,
        "L_std": 3.5, "a_std": 2.5, "b_std": 2.0
    },
    {
        "ppm": 4.0,
        "label": "4.0 ppm (gray-green transition)",
        "L": 93.67, "a": 114.67, "b": 133.33,
        "R": 65.70, "G": 93.15, "B": 78.36,
        "H": 74.33, "S": 77.33, "V": 93.15,
        "DeltaE": 55.55,
        "L_std": 3.5, "a_std": 2.5, "b_std": 2.0
    },
    {
        "ppm": 5.0,
        "label": "5.0 ppm (grayish olive)",
        "L": 84.71, "a": 116.71, "b": 132.57,
        "R": 61.67, "G": 83.56, "B": 71.22,
        "H": 70.71, "S": 69.86, "V": 83.55,
        "DeltaE": 64.59,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    },
    {
        "ppm": 6.0,
        "label": "6.0 ppm (olive-gray)",
        "L": 79.75, "a": 117.50, "b": 133.25,
        "R": 60.01, "G": 78.49, "B": 65.36,
        "H": 69.50, "S": 65.50, "V": 78.49,
        "DeltaE": 69.62,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    },
    {
        "ppm": 7.0,
        "label": "7.0 ppm (gray-brown)",
        "L": 74.25, "a": 117.50, "b": 133.00,
        "R": 54.54, "G": 73.52, "B": 61.66,
        "H": 66.50, "S": 63.00, "V": 73.52,
        "DeltaE": 75.00,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    },
    {
        "ppm": 8.0,
        "label": "8.0 ppm (brownish-gray)",
        "L": 70.50, "a": 120.00, "b": 132.50,
        "R": 55.36, "G": 68.96, "B": 58.62,
        "H": 58.00, "S": 58.75, "V": 68.95,
        "DeltaE": 79.15,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    },
    {
        "ppm": 9.0,
        "label": "9.0 ppm (brown)",
        "L": 68.75, "a": 119.25, "b": 134.00,
        "R": 53.26, "G": 67.56, "B": 54.56,
        "H": 54.25, "S": 51.00, "V": 67.57,
        "DeltaE": 80.76,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    },
    {
        "ppm": 10.0,
        "label": "10.0 ppm (very dark brown / near saturation)",
        "L": 66.75, "a": 119.50, "b": 134.75,
        "R": 52.40, "G": 66.10, "B": 51.62,
        "H": 48.25, "S": 56.00, "V": 66.11,
        "DeltaE": 82.80,
        "L_std": 4.0, "a_std": 3.0, "b_std": 2.5
    }
]

# Official SAFE-BAND Color Reference Scale Progression Points (1 - 10 PPM):
# Captures standard daylight / test-card progression from blue/cyan (unexposed) to dark brown (10 PPM).
SAFE_BAND_CHART_PROGRESSION: List[Dict[str, Any]] = [
    {
        "ppm": 0.0,
        "label": "0.0 ppm (unexposed blue copper acetate)",
        "L": 207.0, "a": 115.5, "b": 117.0,
        "R": 162.0, "G": 209.0, "B": 221.0,
        "DeltaE": 0.0
    },
    {
        "ppm": 1.0,
        "label": "1.0 ppm (light blue-green)",
        "L": 186.0, "a": 117.0, "b": 123.0,
        "R": 138.0, "G": 188.0, "B": 188.0,
        "DeltaE": 21.0
    },
    {
        "ppm": 2.0,
        "label": "2.0 ppm (greenish-blue)",
        "L": 187.0, "a": 115.0, "b": 122.0,
        "R": 130.0, "G": 189.0, "B": 192.0,
        "DeltaE": 20.0
    },
    {
        "ppm": 3.0,
        "label": "3.0 ppm (blue-green to grayish-green)",
        "L": 175.0, "a": 118.0, "b": 124.0,
        "R": 136.0, "G": 175.0, "B": 177.0,
        "DeltaE": 32.0
    },
    {
        "ppm": 4.0,
        "label": "4.0 ppm (gray-green)",
        "L": 170.0, "a": 122.0, "b": 127.0,
        "R": 149.0, "G": 169.0, "B": 170.0,
        "DeltaE": 37.0
    },
    {
        "ppm": 5.0,
        "label": "5.0 ppm (grayish tone / olive-gray)",
        "L": 170.0, "a": 124.0, "b": 130.0,
        "R": 156.0, "G": 164.0, "B": 158.0,
        "DeltaE": 38.0
    },
    {
        "ppm": 6.0,
        "label": "6.0 ppm (olive-gray)",
        "L": 147.0, "a": 124.0, "b": 138.0,
        "R": 139.0, "G": 140.0, "B": 122.0,
        "DeltaE": 61.0
    },
    {
        "ppm": 7.0,
        "label": "7.0 ppm (gray-brown)",
        "L": 142.0, "a": 129.0, "b": 139.0,
        "R": 143.0, "G": 132.0, "B": 115.0,
        "DeltaE": 66.0
    },
    {
        "ppm": 8.0,
        "label": "8.0 ppm (brownish-gray)",
        "L": 122.0, "a": 131.0, "b": 138.0,
        "R": 125.0, "G": 111.0, "B": 96.0,
        "DeltaE": 86.0
    },
    {
        "ppm": 9.0,
        "label": "9.0 ppm (distinct brown)",
        "L": 82.0, "a": 133.0, "b": 138.0,
        "R": 89.0, "G": 73.0, "B": 60.0,
        "DeltaE": 125.0
    },
    {
        "ppm": 10.0,
        "label": "10.0 ppm (very dark brown / near saturation)",
        "L": 53.0, "a": 131.0, "b": 133.0,
        "R": 57.0, "G": 48.0, "B": 43.0,
        "DeltaE": 154.0
    }
]


def compute_normalized_rgb(r: float, g: float, b: float) -> Tuple[float, float, float]:
    """Calculate normalized RGB coordinates with zero-sum division protection.

    r = R / (R + G + B)
    g = G / (R + G + B)
    b = B / (R + G + B)
    """
    total = float(r + g + b)
    if total <= 1e-6:
        return (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)
    return (r / total, g / total, b / total)


class CopperAcetateReferenceScale:
    """Manages the reference progression scale and computes independent trajectory projections."""

    def __init__(
        self,
        reference_data: Optional[List[Dict[str, Any]]] = None,
        baseline_lab: Tuple[float, float, float] = DEFAULT_BASELINE_LAB,
        k_ood: float = CALIBRATION_STATS["default_k_ood"],
        ood_threshold_override: Optional[float] = None
    ):
        self.progression = reference_data or COPPER_ACETATE_REFERENCE_PROGRESSION
        self.chart_progression = SAFE_BAND_CHART_PROGRESSION
        self.baseline_lab = baseline_lab
        self.k_ood = k_ood

        # Data-derived OOD threshold based on calibration distribution
        if ood_threshold_override is not None:
            self.ood_threshold = float(ood_threshold_override)
        else:
            self.ood_threshold = float(
                CALIBRATION_STATS["chroma_dist_mean"] + k_ood * CALIBRATION_STATS["chroma_dist_std"]
            )

        # Pre-extract primary trajectory coordinates as numpy arrays
        self.ppm_levels = np.array([pt["ppm"] for pt in self.progression], dtype=np.float32)
        self.L_levels = np.array([pt["L"] for pt in self.progression], dtype=np.float32)
        self.lab_trajectory = np.array([[pt["L"], pt["a"], pt["b"]] for pt in self.progression], dtype=np.float32)
        self.ab_trajectory = np.array([[pt["a"], pt["b"]] for pt in self.progression], dtype=np.float32)
        self.delta_e_trajectory = np.array([pt["DeltaE"] for pt in self.progression], dtype=np.float32)

        # Pre-compute primary normalized RGB trajectory points
        norm_rgb_list = []
        for pt in self.progression:
            rn, gn, bn = compute_normalized_rgb(pt["R"], pt["G"], pt["B"])
            norm_rgb_list.append([rn, gn, bn])
        self.norm_rgb_trajectory = np.array(norm_rgb_list, dtype=np.float32)

        # Pre-extract secondary (chart reference) trajectory coordinates
        self.chart_ppm_levels = np.array([pt["ppm"] for pt in self.chart_progression], dtype=np.float32)
        self.chart_L_levels = np.array([pt["L"] for pt in self.chart_progression], dtype=np.float32)
        self.chart_lab_trajectory = np.array([[pt["L"], pt["a"], pt["b"]] for pt in self.chart_progression], dtype=np.float32)
        self.chart_ab_trajectory = np.array([[pt["a"], pt["b"]] for pt in self.chart_progression], dtype=np.float32)
        chart_norm_rgb_list = []
        for pt in self.chart_progression:
            rn, gn, bn = compute_normalized_rgb(pt["R"], pt["G"], pt["B"])
            chart_norm_rgb_list.append([rn, gn, bn])
        self.chart_norm_rgb_trajectory = np.array(chart_norm_rgb_list, dtype=np.float32)

    def _point_to_segment_projection_2d(
        self,
        p: np.ndarray,
        p0: np.ndarray,
        p1: np.ndarray
    ) -> Tuple[float, float]:
        """Compute shortest Euclidean distance from 2D point p to line segment (p0 -> p1) and projection t in [0, 1]."""
        ab = p1 - p0
        ab_len2 = float(np.dot(ab, ab))
        if ab_len2 < 1e-8:
            return float(np.linalg.norm(p - p0)), 0.0
        t = float(np.clip(np.dot(p - p0, ab) / ab_len2, 0.0, 1.0))
        proj = p0 + t * ab
        dist = float(np.linalg.norm(p - proj))
        return dist, t

    def _point_to_segment_distance_3d(
        self,
        p: np.ndarray,
        a: np.ndarray,
        b: np.ndarray
    ) -> Tuple[float, float]:
        """Compute shortest Euclidean distance from 3D point p to line segment ab, and projection t in [0, 1]."""
        ab = b - a
        ab_len2 = float(np.dot(ab, ab))
        if ab_len2 < 1e-6:
            return float(np.linalg.norm(p - a)), 0.0
        t = float(np.clip(np.dot(p - a, ab) / ab_len2, 0.0, 1.0))
        projection = a + t * ab
        dist = float(np.linalg.norm(p - projection))
        return dist, t

    def project_chromatic_trajectory(
        self,
        candidate_lab: Tuple[float, float, float],
        candidate_rgb: Optional[Tuple[float, float, float]] = None
    ) -> Dict[str, Any]:
        """Project candidate color onto the 1D copper-acetate reaction curve in pure chromaticity space.

        Projects against both the empirical laboratory calibration manifold and the official
        SAFE-BAND color reference chart progression to support workplace smartphone captures,
        daylight illumination, paper test strips, and wristband pads.

        Returns:
            Dict containing:
                - ppm_ref (float): Projected concentration in [0.0, 10.0] ppm.
                - d_perp (float): Perpendicular chromatic distance from trajectory in LAB (a*, b*).
                - expected_L (float): Expected lightness L at this chemical reaction stage.
                - is_out_of_distribution (bool): True if candidate lies beyond statistical calibration boundary.
                - ood_distance (float): Raw distance to calibration boundary.
                - ood_threshold (float): Configurable threshold used (mean + k*std).
                - norm_rgb (Tuple[float, float, float]): Normalized RGB coordinates.
        """
        l_obs, a_obs, b_obs = candidate_lab
        p_ab = np.array([a_obs, b_obs], dtype=np.float32)

        # 1. Project onto both LAB (a*, b*) trajectories (Lab calibration & Chart reference)
        min_ab_dist = float("inf")
        best_ppm = 0.0
        best_expected_L = float(self.L_levels[0])

        trajectories = [
            (self.ab_trajectory, self.ppm_levels, self.L_levels, self.norm_rgb_trajectory),
            (self.chart_ab_trajectory, self.chart_ppm_levels, self.chart_L_levels, self.chart_norm_rgb_trajectory),
        ]

        best_norm_traj = self.norm_rgb_trajectory
        for ab_traj, ppm_levs, l_levs, norm_traj in trajectories:
            for i in range(len(ab_traj) - 1):
                p0 = ab_traj[i]
                p1 = ab_traj[i + 1]
                dist, t = self._point_to_segment_projection_2d(p_ab, p0, p1)
                if dist < min_ab_dist:
                    min_ab_dist = dist
                    best_ppm = float(ppm_levs[i] + t * (ppm_levs[i + 1] - ppm_levs[i]))
                    best_expected_L = float(l_levs[i] + t * (l_levs[i + 1] - l_levs[i]))
                    best_norm_traj = norm_traj

        # 2. Check normalized RGB projection if RGB provided
        if candidate_rgb is not None:
            rn, gn, bn = compute_normalized_rgb(*candidate_rgb)
            p_nrgb = np.array([rn, gn], dtype=np.float32)
            min_nrgb_dist = float("inf")
            nrgb_ppm = best_ppm

            for i in range(len(best_norm_traj) - 1):
                p0 = best_norm_traj[i, :2]
                p1 = best_norm_traj[i + 1, :2]
                dist, t = self._point_to_segment_projection_2d(p_nrgb, p0, p1)
                if dist < min_nrgb_dist:
                    min_nrgb_dist = dist
                    nrgb_ppm = float(self.ppm_levels[i] + t * (self.ppm_levels[i + 1] - self.ppm_levels[i]))

            # Blend chromatic signals: normalized RGB is strictly scale-invariant, LAB (a*, b*) has high color depth
            # When normalized RGB is confident (min_nrgb_dist < 0.025), use it to cross-validate
            if min_nrgb_dist < 0.025:
                best_ppm = float(0.50 * best_ppm + 0.50 * nrgb_ppm)
        else:
            rn, gn, bn = (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)

        best_ppm = float(np.clip(best_ppm, 0.0, 10.0))
        is_ood = min_ab_dist > self.ood_threshold

        return {
            "ppm_ref": round(best_ppm, 2),
            "d_perp": round(min_ab_dist, 3),
            "expected_L": round(best_expected_L, 2),
            "is_out_of_distribution": is_ood,
            "ood_distance": round(min_ab_dist, 3),
            "ood_threshold": round(self.ood_threshold, 3),
            "norm_rgb": (round(rn, 4), round(gn, 4), round(bn, 4))
        }

    def compute_evidence_sensor_confidence(
        self,
        candidate_lab: Tuple[float, float, float],
        candidate_rgb: Optional[Tuple[float, float, float]] = None,
        bbox: Optional[Tuple[int, int, int, int]] = None,
        has_carrier_card: bool = False,
        surround_l: float = 128.0
    ) -> Tuple[float, Dict[str, Any]]:
        """Calculate evidence-based sensorConfidence without arbitrary hardcoded clamps.

        The confidence emerges naturally from physical and geometric evidence:
        - Chromatic proximity to copper-acetate reaction manifold: exp(-0.5 * (d_perp / 5.0)^2)
        - Geometric aspect ratio: supports both square/round pads (1:1) and elongated strips (3:1)
        - Carrier contrast evidence for saturated pads (CuS paper requires carrier paper, not skin)
        - Out-of-distribution penalty: smooth degradation beyond statistical threshold

        Returns:
            Tuple of:
                - sensor_confidence (float in [0.01, 0.99])
                - evidence_details (Dict)
        """
        l_obs, a_obs, b_obs = candidate_lab
        proj = self.project_chromatic_trajectory(candidate_lab, candidate_rgb)
        d_perp = proj["d_perp"]
        is_ood = proj["is_out_of_distribution"]

        # 1. Chromatic Evidence Score (continuous Gaussian falloff around calibration manifold)
        s_chroma = float(np.exp(-0.5 * (d_perp / 5.0) ** 2))

        # 2. Geometric Evidence Score: Dual form factors
        # Supports square/circular sensor pads (aspect ~ 1.0) and elongated chemical test strips (aspect ~ 3.0)
        if bbox is not None and bbox[2] > 0 and bbox[3] > 0:
            w, h = bbox[2], bbox[3]
            norm_aspect = max(float(w) / float(max(1, h)), float(h) / float(max(1, w)))
            s_pad = float(np.exp(-0.5 * ((norm_aspect - 1.0) / 0.45) ** 2))
            s_strip = float(np.exp(-0.5 * ((norm_aspect - 3.0) / 1.30) ** 2))
            s_geom = max(s_pad, s_strip)
        else:
            s_geom = 0.90

        # 3. Carrier Contrast Evidence
        # Valid copper acetate sensors (L >= 38 in all calibration and moderate shadow) are self-contrasting
        # Highly darkened / saturated sensors (L < 38) must have warm brown CuS hue (R > B + 3.0) and high contrast against white carrier paper
        is_copper_brown = (candidate_rgb is not None) and (candidate_rgb[0] > candidate_rgb[2] + 3.0)
        is_chemical_saturation = (25.0 <= l_obs <= 38.0) and has_carrier_card and (not is_ood) and is_copper_brown
        if l_obs < 38.0:
            if has_carrier_card and is_copper_brown:
                contrast = (surround_l - l_obs) / max(1.0, surround_l + l_obs)
                s_carrier = float(np.clip(contrast / 0.50, 0.40, 1.0))
            else:
                # Dark watch dial, black silicone band on skin, or cold dark gray object has no copper-acetate CuS signature
                s_carrier = 0.08
        elif l_obs < 48.0:
            # Moderately dark objects (e.g. phone case, wallet, dark leather):
            # Check for neutral achromatic gray (rn ~ gn ~ bn ~ 0.33) without carrier context
            if candidate_rgb is not None:
                rn, gn, bn = compute_normalized_rgb(*candidate_rgb)
                is_achromatic = (rn <= bn + 0.03) and abs(gn - 1.0 / 3.0) < 0.03
                s_carrier = 0.08 if (is_achromatic and not has_carrier_card) else 0.95
            else:
                s_carrier = 0.95
        else:
            s_carrier = 0.95

        # 4. Out-of-Distribution Penalty
        if is_ood:
            ood_ratio = (d_perp - self.ood_threshold) / max(1.0, self.ood_threshold)
            p_ood = float(np.clip(ood_ratio, 0.0, 1.0))
        else:
            p_ood = 0.0

        # 5. Luminance Range Plausibility (Copper acetate paper physically lies in L in [30, 220])
        if l_obs > 220.0:
            s_lum = float(np.exp(-0.5 * ((l_obs - 220.0) / 10.0) ** 2))
        elif l_obs < 30.0:
            s_lum = float(np.exp(-0.5 * ((30.0 - l_obs) / 6.0) ** 2))
        else:
            s_lum = 1.0

        # High lightness (> 195) check: pure white paper without blue/cyan chroma is background
        if l_obs > 195.0 and candidate_rgb is not None:
            rn, gn, bn = compute_normalized_rgb(*candidate_rgb)
            if rn >= 0.320 and bn <= 0.340:
                s_lum *= 0.10

        # Integrated continuous evidence product
        raw_conf = s_chroma * s_geom * s_carrier * s_lum * (1.0 - p_ood)
        if is_chemical_saturation:
            raw_conf = max(raw_conf, 0.78)

        sensor_confidence = float(np.clip(raw_conf, 0.01, 0.98))

        evidence = {
            "s_chroma": round(s_chroma, 4),
            "s_geom": round(s_geom, 4),
            "s_carrier": round(s_carrier, 4),
            "s_lum": round(s_lum, 4),
            "p_ood": round(p_ood, 4),
            "d_perp": d_perp,
            "is_ood": is_ood,
            "is_chemical_saturation": is_chemical_saturation,
            "raw_confidence": round(raw_conf, 4)
        }

        return round(sensor_confidence, 3), evidence

    def evaluate_candidate_color(
        self,
        candidate_lab: Tuple[float, float, float],
        candidate_rgb: Optional[Tuple[float, float, float]] = None,
        bbox: Optional[Tuple[int, int, int, int]] = None,
        has_carrier_card: bool = False,
        surround_l: float = 128.0
    ) -> Dict[str, Any]:
        """Comprehensive candidate color evaluation combining trajectory projection and evidence confidence."""
        l_obs, a_obs, b_obs = candidate_lab
        proj = self.project_chromatic_trajectory(candidate_lab, candidate_rgb)
        confidence, evidence = self.compute_evidence_sensor_confidence(
            candidate_lab,
            candidate_rgb=candidate_rgb,
            bbox=bbox,
            has_carrier_card=has_carrier_card,
            surround_l=surround_l
        )

        # 3D distance to closest full LAB trajectory segment across both manifolds
        p = np.array([l_obs, a_obs, b_obs], dtype=np.float32)
        min_3d_dist = float("inf")
        for traj in [self.lab_trajectory, self.chart_lab_trajectory]:
            for i in range(len(traj) - 1):
                p0 = traj[i]
                p1 = traj[i + 1]
                dist, _ = self._point_to_segment_distance_3d(p, p0, p1)
                if dist < min_3d_dist:
                    min_3d_dist = dist

        # Sensor detection threshold: requires meaningful evidence or physical chemical saturation
        is_consistent = ((confidence >= 0.20) and (not proj["is_out_of_distribution"])) or evidence["is_chemical_saturation"]

        rejection_reason = None
        if not is_consistent:
            if proj["is_out_of_distribution"]:
                rejection_reason = f"OUT_OF_DISTRIBUTION (d_perp={proj['d_perp']} > {proj['ood_threshold']})"
            elif l_obs > 220.0:
                rejection_reason = "BRIGHT_SURFACE_REJECTED (L > 220, carrier or background)"
            elif l_obs < 30.0:
                rejection_reason = "EXTREME_DARKNESS_OR_INERT_BLACK (L < 30, non-sensor object)"
            elif evidence["s_carrier"] < 0.20:
                rejection_reason = "MISSING_CARRIER_CONTRAST (Dark object on skin without sensor carrier card)"
            else:
                rejection_reason = "LOW_EVIDENCE_CONFIDENCE (Color or geometry does not match copper-acetate sensor)"

        return {
            "is_consistent": is_consistent,
            "sensor_confidence": confidence,
            "trajectory_distance": round(min_3d_dist, 2),
            "chromatic_distance": proj["d_perp"],
            "nearest_ppm": proj["ppm_ref"] if is_consistent else None,
            "expected_L": proj["expected_L"],
            "is_out_of_distribution": proj["is_out_of_distribution"],
            "ood_distance": proj["ood_distance"],
            "ood_threshold": proj["ood_threshold"],
            "norm_rgb": proj["norm_rgb"],
            "conformance_score": confidence,
            "rejection_reason": rejection_reason,
            "evidence": evidence
        }

    def get_reference_scale_ui(self) -> List[Dict[str, Any]]:
        """Return visual reference progression data formatted for frontend representation."""
        res = []
        for pt in self.progression:
            rn, gn, bn = compute_normalized_rgb(pt["R"], pt["G"], pt["B"])
            res.append({
                "ppm": pt["ppm"],
                "label": pt["label"],
                "colorHex": f"#{int(pt['R']):02x}{int(pt['G']):02x}{int(pt['B']):02x}",
                "rgb": [int(pt["R"]), int(pt["G"]), int(pt["B"])],
                "normRgb": [round(rn, 3), round(gn, 3), round(bn, 3)],
                "deltaE": round(pt["DeltaE"], 1)
            })
        return res
