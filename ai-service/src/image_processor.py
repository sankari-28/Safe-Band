"""OpenCV Image Processing Module for Colorimetric H2S Test Strips.

This module processes photos of colorimetric test strips (copper acetate matrix),
performs image quality checks (blur, exposure, glare), robustly localizes sensor candidates
using multiple geometric, contrast, and color cues, validates color conformance against
the copper-acetate reference progression, normalizes for lighting variations, and extracts
standardized color features for the Random Forest model.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import cv2

from src.reference_scale import (
    CopperAcetateReferenceScale,
    DEFAULT_BASELINE_LAB,
    COPPER_ACETATE_REFERENCE_PROGRESSION,
)

FEATURE_NAMES = ["R", "G", "B", "H", "S", "V", "L", "a", "b", "DeltaE"]

# Saturation limit: extreme high H2S or prolonged exposure turns copper acetate to dense CuS
SATURATION_THRESHOLDS = {
    "L_max": 45.0,
    "DeltaE_min": 100.0,
    "V_max": 45.0
}


class StripProcessor:
    """Processes colorimetric strip images and extracts standardized color features."""

    def __init__(
        self,
        baseline_lab: Tuple[float, float, float] = DEFAULT_BASELINE_LAB,
        reference_scale: Optional[CopperAcetateReferenceScale] = None
    ):
        """Initialize with baseline reference LAB values and copper acetate reference scale."""
        self.baseline_lab = baseline_lab
        self.reference_scale = reference_scale or CopperAcetateReferenceScale(baseline_lab=baseline_lab)

    @staticmethod
    def load_image(image_input: Union[str, np.ndarray, bytes]) -> np.ndarray:
        """Load an image from a file path, byte array, or validate an existing numpy array."""
        if isinstance(image_input, np.ndarray):
            if image_input.size == 0:
                raise ValueError("Provided image array is empty.")
            return image_input.copy()

        if isinstance(image_input, bytes):
            try:
                import io
                from PIL import Image, ImageOps
                pil_img = Image.open(io.BytesIO(image_input))
                pil_img = ImageOps.exif_transpose(pil_img)
                rgb_arr = np.array(pil_img.convert("RGB"))
                return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
            except Exception:
                pass
            nparr = np.frombuffer(image_input, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image from bytes.")
            return img

        if isinstance(image_input, str):
            try:
                from PIL import Image, ImageOps
                pil_img = Image.open(image_input)
                pil_img = ImageOps.exif_transpose(pil_img)
                rgb_arr = np.array(pil_img.convert("RGB"))
                return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
            except Exception:
                pass
            img = cv2.imread(image_input, cv2.IMREAD_COLOR)
            if img is None:
                raise FileNotFoundError(f"Could not load image from path: {image_input}")
            return img

        raise TypeError(f"Unsupported image input type: {type(image_input)}")

    def evaluate_image_quality(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """Evaluate image quality to reject genuinely unusable images (blur, extreme darkness, severe glare).

        Worker guidance principle: Only reject truly uninterpretable images. Tolerate moderate
        workplace imperfections (mild shadow, slight blur, normal ambient light).

        Returns:
            Dict containing:
                - is_acceptable (bool)
                - quality (str): "GOOD" or "POOR"
                - blur_score (float): Laplacian variance
                - exposure_mean (float): Mean lightness
                - glare_pct (float): Percentage of blown-out specular pixels
                - issues (List[str]): List of detected quality issues
                - message (Optional[str]): Single, simple worker instruction if poor
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_gray = float(np.mean(gray))
        glare_pct = float(np.mean(gray >= 250) * 100.0)

        issues = []
        message = None

        # 1. Severe Blur Check (Laplacian variance < 16 is severely defocused/smeared)
        if blur_var < 16.0:
            issues.append("SEVERE_BLUR")
            message = "Image unclear. Hold the wristband steady for a moment."

        # 2. Extreme Darkness / Underexposure Check (Mean < 18 indicates pitch dark room or covered camera)
        if mean_gray < 18.0:
            issues.append("EXTREME_DARKNESS")
            message = "Too dark to scan. Move to a brighter area."

        # 3. Extreme Specular Glare / Flash Blowout Check (> 40% blown out pixels)
        if glare_pct > 40.0:
            issues.append("EXTREME_GLARE")
            message = "Too much light reflection. Tilt camera slightly away from direct glare."

        is_acceptable = len(issues) == 0
        quality = "GOOD" if is_acceptable else "POOR"

        return {
            "is_acceptable": is_acceptable,
            "quality": quality,
            "blur_score": round(blur_var, 1),
            "exposure_mean": round(mean_gray, 1),
            "glare_pct": round(glare_pct, 1),
            "issues": issues,
            "message": message
        }

    def locate_sensor_candidates(
        self,
        image_bgr: np.ndarray,
        central_box_ratio: float = 0.40
    ) -> List[Dict[str, Any]]:
        """Generate and evaluate candidate sensor pad regions across the image.

        Supports low-friction worker scanning:
        Workers casually point the camera at the wristband. The sensor may be centered,
        slightly off-center (20-40%), slightly rotated, or surrounded by skin/strap.

        Returns:
            List of candidate dictionaries ordered by overall confidence score (highest first).
        """
        h_img, w_img = image_bgr.shape[:2]
        img_area = h_img * w_img

        raw_boxes = []

        # 1. Viewfinder Center Target Boxes (standard worker alignment box + larger contextual window)
        for ratio in [central_box_ratio, 0.55, 0.70]:
            bw = int(w_img * ratio)
            bh = int(h_img * ratio)
            bx = max(0, (w_img - bw) // 2)
            by = max(0, (h_img - bh) // 2)
            raw_boxes.append((bx, by, bw, bh, "viewfinder_box"))

        # 2. Contour-based candidates: Search for rectangular sensor pads / bezels / strips across the frame
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges1 = cv2.Canny(blurred, 30, 110)
        edges2 = cv2.Canny(blurred, 15, 75)
        edges = cv2.bitwise_or(edges1, edges2)
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        seen_boxes = set()
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Sensor pad / strip typically covers 0.3% to 45% of camera image
            if 0.003 * img_area <= area <= 0.45 * img_area:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect = max(w / max(1, h), h / max(1, w))
                # Supports square pads (aspect ~ 1.0) and elongated strips (aspect up to 5.5)
                if aspect <= 5.5:
                    k = (x // 12, y // 12, w // 12, h // 12)
                    if k not in seen_boxes:
                        seen_boxes.add(k)
                        raw_boxes.append((x, y, w, h, "contour"))

        # Deduplicate overlapping boxes
        candidates = []
        for (x, y, w, h, src) in raw_boxes:
            # Clamp to bounds
            x = max(0, min(x, w_img - 4))
            y = max(0, min(y, h_img - 4))
            w = max(4, min(w, w_img - x))
            h = max(4, min(h, h_img - y))
            if w < 10 or h < 10:
                continue

            sub_img = image_bgr[y:y + h, x:x + w]
            evaluated = self._evaluate_region_candidate(sub_img, (x, y, w, h), src, image_bgr)
            if evaluated is not None:
                candidates.append(evaluated)

        # Sort candidates by combined score descending
        candidates.sort(key=lambda c: c["score"], reverse=True)
        return candidates

    def _evaluate_region_candidate(
        self,
        sub_img: np.ndarray,
        bbox: Tuple[int, int, int, int],
        source: str,
        full_img: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Evaluate a specific candidate image slice for copper acetate sensor characteristics."""
        h, w = sub_img.shape[:2]
        if h < 8 or w < 8:
            return None

        # Coarse viewfinder boxes spanning both dark bezels/straps and bright pads have massive variance
        if source == "viewfinder_box":
            sub_gray = cv2.cvtColor(sub_img, cv2.COLOR_BGR2GRAY)
            if float(np.std(sub_gray)) > 38.0:
                return None

        # 1. Luminance-aware skin masking (prevent sampling worker hand/wrist tissue)
        ycrcb = cv2.cvtColor(sub_img, cv2.COLOR_BGR2YCrCb)
        y_chan = ycrcb[:, :, 0]
        cr_chan = ycrcb[:, :, 1]
        cb_chan = ycrcb[:, :, 2]
        skin_mask = (y_chan >= 80) & (cr_chan >= 142) & (cr_chan <= 180) & (cb_chan >= 75) & (cb_chan <= 118)
        skin_ratio = float(np.mean(skin_mask))

        # 2. Specular glare rejection
        glare_mask = y_chan >= 248

        # 3. Extract non-skin, non-glare target pixels
        target_mask = (~skin_mask) & (~glare_mask)
        target_pixels = sub_img[target_mask]

        # If region is > 85% skin and has very few target pixels, reject as skin
        if len(target_pixels) < 25 or skin_ratio > 0.85:
            return {
                "bbox": bbox,
                "source": source,
                "score": 0.05,
                "conformance_score": 0.05,
                "is_consistent": False,
                "rejection_reason": "HUMAN_SKIN_REJECTED",
                "median_lab": (150.0, 140.0, 140.0),
                "target_roi": sub_img
            }

        # 4. Extract median color across target pixels
        median_bgr = np.median(target_pixels, axis=0).astype(np.uint8)
        median_rgb = (float(median_bgr[2]), float(median_bgr[1]), float(median_bgr[0]))
        pix_1x1 = np.uint8([[median_bgr]])
        lab_color = cv2.cvtColor(pix_1x1, cv2.COLOR_BGR2LAB)[0][0]
        l_obs, a_obs, b_obs = float(lab_color[0]), float(lab_color[1]), float(lab_color[2])

        # Check for carrier card context
        cx, cy, cw, ch = bbox
        h_full, w_full = full_img.shape[:2]
        margin_y = int(ch * 0.35)
        margin_x = int(cw * 0.35)
        rim_y1 = max(0, cy - margin_y)
        rim_y2 = min(h_full, cy + ch + margin_y)
        rim_x1 = max(0, cx - margin_x)
        rim_x2 = min(w_full, cx + cw + margin_x)
        surround_box = full_img[rim_y1:rim_y2, rim_x1:rim_x2]

        surround_ycrcb = cv2.cvtColor(surround_box, cv2.COLOR_BGR2YCrCb)
        surround_skin = (
            (surround_ycrcb[:, :, 0] >= 80) &
            (surround_ycrcb[:, :, 1] >= 142) & (surround_ycrcb[:, :, 1] <= 180) &
            (surround_ycrcb[:, :, 2] >= 75) & (surround_ycrcb[:, :, 2] <= 118)
        )
        non_skin_surround = surround_box[~surround_skin]
        surround_p85_L = 128.0
        if len(non_skin_surround) >= 50:
            surround_lab = cv2.cvtColor(non_skin_surround.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB)
            surround_p85_L = float(np.percentile(surround_lab[:, 0, 0], 85))
            surround_med_a = float(np.median(surround_lab[:, 0, 1]))
            # Genuine carrier card is bright non-skin neutral surface (L >= 185, a ~ 128)
            has_carrier_card = (surround_p85_L >= 185.0) and ((surround_p85_L - l_obs) >= 80.0) and (abs(surround_med_a - 128.0) <= 8.0)
        else:
            has_carrier_card = False

        # 5. Evaluate color conformance against copper acetate reference progression
        ref_eval = self.reference_scale.evaluate_candidate_color(
            (l_obs, a_obs, b_obs),
            candidate_rgb=median_rgb,
            bbox=bbox,
            has_carrier_card=has_carrier_card,
            surround_l=surround_p85_L
        )

        conf_score = ref_eval["sensor_confidence"]
        is_consistent = ref_eval["is_consistent"]
        norm_aspect = max(float(w) / float(max(1, h)), float(h) / float(max(1, w)))
        s_pad = float(np.exp(-0.5 * ((norm_aspect - 1.0) / 0.45) ** 2))
        s_strip = float(np.exp(-0.5 * ((norm_aspect - 3.0) / 1.30) ** 2))
        s_geom = max(s_pad, s_strip)

        # Center proximity bonus (prioritizes viewfinder center target in camera scanning)
        cdist = np.sqrt(((cx + cw / 2.0) - w_full / 2.0) ** 2 + ((cy + ch / 2.0) - h_full / 2.0) ** 2)
        norm_cdist = cdist / (np.sqrt(w_full ** 2 + h_full ** 2) / 2.0 + 1e-5)
        s_center = max(0.0, 1.0 - 0.35 * norm_cdist)

        contour_bonus = 0.06 if source.startswith("contour") else 0.0
        if is_consistent:
            score = 0.50 * conf_score + 0.25 * s_geom + 0.15 * s_center + contour_bonus
        else:
            score = conf_score * 0.20

        return {
            "bbox": bbox,
            "source": source,
            "score": round(score, 3),
            "conformance_score": conf_score,
            "is_consistent": is_consistent,
            "rejection_reason": ref_eval.get("rejection_reason"),
            "ref_eval": ref_eval,
            "median_lab": (l_obs, a_obs, b_obs),
            "median_bgr": median_bgr,
            "median_rgb": median_rgb,
            "target_roi": sub_img
        }

    def normalize_illumination(
        self,
        roi_bgr: np.ndarray,
        full_image_bgr: np.ndarray,
        candidate_bbox: Tuple[int, int, int, int],
        expected_L: Optional[float] = None
    ) -> Tuple[np.ndarray, float]:
        """Normalize illumination to mitigate phone camera auto-exposure and lighting shifts.

        When expected_L is known from the chromatic trajectory projection, gently balances
        lightness towards calibration levels. Otherwise, falls back to scene white point.

        Returns:
            Tuple of (normalized_roi_bgr, illumination_factor)
        """
        roi_lab = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        l_obs = float(np.median(roi_lab[:, :, 0]))

        if expected_L is not None and expected_L > 0:
            raw_factor = expected_L / max(1.0, l_obs)
            illumination_factor = float(np.clip(raw_factor, 0.75, 1.30))
        else:
            gray_full = cv2.cvtColor(full_image_bgr, cv2.COLOR_BGR2GRAY)
            non_glare = gray_full[gray_full < 250]
            p90 = float(np.percentile(non_glare, 90)) if len(non_glare) > 100 else 220.0
            nominal_white = 225.0
            if p90 >= 170.0:
                raw_factor = nominal_white / p90
                illumination_factor = float(np.clip(raw_factor, 0.90, 1.15))
            else:
                illumination_factor = 1.0

        # Apply mild scaling in LAB space to preserve chromaticity, clamping to physical sensor max 152.0
        roi_lab[:, :, 0] = np.clip(roi_lab[:, :, 0] * illumination_factor, 10.0, 152.0)
        norm_bgr = cv2.cvtColor(roi_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)

        return norm_bgr, round(illumination_factor, 2)

    def detect_strip_roi(
        self,
        image_bgr: np.ndarray,
        manual_roi: Optional[Tuple[int, int, int, int]] = None,
        use_central_box: bool = True,
        central_box_ratio: float = 0.40,
        inner_crop_pct: float = 0.12
    ) -> Tuple[np.ndarray, Tuple[int, int, int, int], np.ndarray, Dict[str, Any]]:
        """Isolate sensor pad with multi-cue localization and copper acetate reference validation.

        Returns:
            Tuple of:
                - roi: Cleaned sensor pad BGR array
                - bbox: (x, y, w, h) bounding box in original image
                - debug_image: Annotated visualization
                - detection_meta: Dictionary with sensor_detected, sensor_confidence, etc.
        """
        h_img, w_img = image_bgr.shape[:2]
        debug_image = image_bgr.copy()

        # Draw camera viewfinder target box on debug image
        bw = int(w_img * central_box_ratio)
        bh = int(h_img * central_box_ratio)
        bx = (w_img - bw) // 2
        by = (h_img - bh) // 2
        self._draw_viewfinder_overlay(debug_image, bx, by, bw, bh)

        # If manual ROI is provided, use directly
        if manual_roi is not None:
            mx, my, mw, mh = manual_roi
            bbox = (mx, my, mw, mh)
            roi = image_bgr[my:my + mh, mx:mx + mw]
            norm_roi, factor = self.normalize_illumination(roi, image_bgr, bbox)
            return norm_roi, bbox, debug_image, {
                "sensor_detected": True,
                "sensor_confidence": 0.90,
                "conformance_score": 0.90,
                "rejection_reason": None,
                "illumination_factor": factor
            }

        # Multi-cue candidate generation across the frame
        candidates = self.locate_sensor_candidates(image_bgr, central_box_ratio=central_box_ratio)

        # Evaluate best candidate
        if len(candidates) > 0 and candidates[0]["is_consistent"]:
            best = candidates[0]
            bbox = best["bbox"]
            rx, ry, rw, rh = bbox

            # Inset crop to remove outer border shadows
            pad_x = int(rw * inner_crop_pct)
            pad_y = int(rh * inner_crop_pct)
            crop_x = max(0, rx + pad_x)
            crop_y = max(0, ry + pad_y)
            crop_w = max(4, rw - 2 * pad_x)
            crop_h = max(4, rh - 2 * pad_y)
            clean_bbox = (crop_x, crop_y, crop_w, crop_h)

            roi = image_bgr[crop_y:crop_y + crop_h, crop_x:crop_x + crop_w]
            exp_l = best["ref_eval"].get("expected_L")
            norm_roi, factor = self.normalize_illumination(roi, image_bgr, clean_bbox, expected_L=exp_l)

            # Draw confirmed sensor box in cyan
            cv2.rectangle(debug_image, (crop_x, crop_y), (crop_x + crop_w, crop_y + crop_h), (255, 255, 0), 2)
            cv2.putText(
                debug_image,
                f"Copper Acetate Sensor ({best['score'] * 100:.0f}%)",
                (crop_x, max(crop_y - 8, 18)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 0),
                1,
                cv2.LINE_AA
            )

            detection_meta = {
                "sensor_detected": True,
                "sensor_confidence": best["ref_eval"]["sensor_confidence"],
                "conformance_score": best["ref_eval"]["sensor_confidence"],
                "rejection_reason": None,
                "illumination_factor": factor,
                "candidate_source": best["source"],
                "ref_eval": best["ref_eval"],
                "ppm_ref": best["ref_eval"].get("nearest_ppm"),
                "expected_L": exp_l,
                "is_out_of_distribution": best["ref_eval"].get("is_out_of_distribution", False),
                "ood_distance": best["ref_eval"].get("ood_distance", 0.0),
                "ood_threshold": best["ref_eval"].get("ood_threshold", 6.80),
                "norm_rgb": best["ref_eval"].get("norm_rgb", (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0))
            }
            return norm_roi, clean_bbox, debug_image, detection_meta

        # Fallback: No candidate matched the copper acetate progression (e.g. watch, wristband, skin)
        rejection_reason = candidates[0]["rejection_reason"] if len(candidates) > 0 else "NO_SENSOR_CANDIDATE"
        best_conf = candidates[0]["ref_eval"]["sensor_confidence"] if (len(candidates) > 0 and "ref_eval" in candidates[0]) else 0.02

        fallback_bbox = (bx, by, bw, bh)
        fallback_roi = image_bgr[by:by + bh, bx:bx + bw]
        if fallback_roi.size == 0:
            fallback_roi = np.full((50, 50, 3), 128, dtype=np.uint8)

        # Draw red alert outline on debug image
        cv2.rectangle(debug_image, (bx, by), (bx + bw, by + bh), (0, 0, 255), 2)
        cv2.putText(
            debug_image,
            "SENSOR NOT DETECTED",
            (bx, max(by - 8, 18)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 255),
            2,
            cv2.LINE_AA
        )

        detection_meta = {
            "sensor_detected": False,
            "sensor_confidence": round(best_conf, 3),
            "conformance_score": round(best_conf, 3),
            "rejection_reason": rejection_reason,
            "illumination_factor": 1.0,
            "candidate_source": "fallback",
            "ref_eval": candidates[0].get("ref_eval", {}) if len(candidates) > 0 else {},
            "ppm_ref": None,
            "expected_L": None,
            "is_out_of_distribution": candidates[0].get("ref_eval", {}).get("is_out_of_distribution", True) if len(candidates) > 0 else True,
            "ood_distance": candidates[0].get("ref_eval", {}).get("ood_distance", 9.9) if len(candidates) > 0 else 9.9,
            "ood_threshold": self.reference_scale.ood_threshold,
            "norm_rgb": candidates[0].get("ref_eval", {}).get("norm_rgb", (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)) if len(candidates) > 0 else (1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0)
        }
        return fallback_roi, fallback_bbox, debug_image, detection_meta

    def _draw_viewfinder_overlay(self, img: np.ndarray, x: int, y: int, w: int, h: int):
        """Render stylish on-screen camera viewfinder corner brackets and label."""
        color = (0, 255, 0)
        thickness = 3
        bracket_len = max(15, min(w, h) // 5)

        # Subtle bounding outline
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 180, 0), 1)

        # Corner brackets
        cv2.line(img, (x, y), (x + bracket_len, y), color, thickness)
        cv2.line(img, (x, y), (x, y + bracket_len), color, thickness)
        cv2.line(img, (x + w, y), (x + w - bracket_len, y), color, thickness)
        cv2.line(img, (x + w, y), (x + w, y + bracket_len), color, thickness)
        cv2.line(img, (x, y + h), (x + bracket_len, y + h), color, thickness)
        cv2.line(img, (x, y + h), (x, y + h - bracket_len), color, thickness)
        cv2.line(img, (x + w, y + h), (x + w - bracket_len, y + h), color, thickness)
        cv2.line(img, (x + w, y + h), (x + w, y + h - bracket_len), color, thickness)

        cv2.putText(
            img,
            "TARGET SENSOR REGION",
            (x, max(y - 8, 18)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA
        )

    def extract_color_features(self, roi_bgr: np.ndarray) -> Dict[str, float]:
        """Extract RGB, HSV, LAB, and DeltaE features from the processed sensor ROI."""
        if roi_bgr.size == 0:
            raise ValueError("ROI contains no pixels.")

        # Mild bilateral filter to smooth paper grain texture
        cleaned = cv2.bilateralFilter(roi_bgr, d=5, sigmaColor=20, sigmaSpace=20)

        # Exclude extreme specular glare pixels
        gray = cv2.cvtColor(cleaned, cv2.COLOR_BGR2GRAY)
        glare_mask = gray >= 248
        target_pixels = cleaned[~glare_mask] if np.sum(~glare_mask) >= 20 else cleaned.reshape(-1, 3)

        # Median BGR
        median_bgr = np.median(target_pixels, axis=0).astype(np.uint8)
        b_val, g_val, r_val = float(median_bgr[0]), float(median_bgr[1]), float(median_bgr[2])

        # HSV Features
        pixel_1x1 = np.uint8([[median_bgr]])
        roi_hsv = cv2.cvtColor(pixel_1x1, cv2.COLOR_BGR2HSV)[0][0]
        h_hsv, s_hsv, v_hsv = float(roi_hsv[0]), float(roi_hsv[1]), float(roi_hsv[2])

        # LAB Features
        roi_lab = cv2.cvtColor(pixel_1x1, cv2.COLOR_BGR2LAB)[0][0]
        l_lab, a_lab, b_lab = float(roi_lab[0]), float(roi_lab[1]), float(roi_lab[2])

        # DeltaE calculation against unexposed baseline
        l0, a0, b0 = self.baseline_lab
        delta_e = float(np.sqrt((l_lab - l0) ** 2 + (a_lab - a0) ** 2 + (b_lab - b0) ** 2))

        return {
            "R": round(r_val, 2),
            "G": round(g_val, 2),
            "B": round(b_val, 2),
            "H": round(h_hsv, 2),
            "S": round(s_hsv, 2),
            "V": round(v_hsv, 2),
            "L": round(l_lab, 2),
            "a": round(a_lab, 2),
            "b": round(b_lab, 2),
            "DeltaE": round(delta_e, 2),
        }

    def check_saturation(self, features: Dict[str, float], detection_meta: Optional[Dict[str, Any]] = None) -> Tuple[bool, str]:
        """Check if the sensor is physically saturated (dense CuS precipitate)."""
        l_val = features["L"]
        de_val = features["DeltaE"]

        # An out-of-distribution object or rejected candidate cannot be chemical saturation
        if detection_meta is not None:
            if detection_meta.get("is_out_of_distribution", False):
                return False, "VALID_CALIBRATED_RANGE"
            ref_eval = detection_meta.get("ref_eval", {})
            evidence = ref_eval.get("evidence", {})
            if evidence.get("is_chemical_saturation", False):
                return True, "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)"
            if not detection_meta.get("sensor_detected", False):
                return False, "VALID_CALIBRATED_RANGE"

        if de_val >= SATURATION_THRESHOLDS["DeltaE_min"] and l_val <= SATURATION_THRESHOLDS["L_max"]:
            return True, "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)"

        return False, "VALID_CALIBRATED_RANGE"

    def process_image(
        self,
        image_input: Union[str, np.ndarray, bytes],
        manual_roi: Optional[Tuple[int, int, int, int]] = None,
        use_central_box: bool = True,
        central_box_ratio: float = 0.40,
        require_wristband: bool = True
    ) -> Dict[str, Any]:
        """Full optical pipeline: quality check -> candidate localization -> reference validation -> normalization -> feature extraction."""
        image_bgr = self.load_image(image_input)

        # 1. Image Quality Assessment
        quality_eval = self.evaluate_image_quality(image_bgr)

        # 2. Multi-cue Candidate Localization & Reference Progression Validation
        roi_norm, bbox, debug_image, detection_meta = self.detect_strip_roi(
            image_bgr,
            manual_roi=manual_roi,
            use_central_box=use_central_box,
            central_box_ratio=central_box_ratio
        )

        # 3. Extract Features
        features = self.extract_color_features(roi_norm)
        is_saturated, sat_msg = self.check_saturation(features, detection_meta=detection_meta)

        # 4. Status Integration
        sensor_detected = detection_meta["sensor_detected"]
        sensor_confidence = detection_meta["sensor_confidence"]
        image_quality = quality_eval["quality"]

        if not quality_eval["is_acceptable"]:
            sensor_detected = False
            sensor_status = "POOR_IMAGE_QUALITY"
            validation_message = quality_eval["message"]
            is_valid_color = False
        elif is_saturated:
            sensor_detected = True
            sensor_status = "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)"
            validation_message = "Physical chemical saturation detected (> 10 ppm)."
            is_valid_color = True
        elif not sensor_detected:
            sensor_status = "SENSOR_NOT_DETECTED"
            validation_message = "No copper acetate sensor detected. Please point camera at the wristband sensor."
            is_valid_color = False
        else:
            sensor_status = "CONFIRMED_COPPER_ACETATE_SENSOR"
            validation_message = None
            is_valid_color = True

        feature_vector = [features[k] for k in FEATURE_NAMES]

        return {
            "features": features,
            "feature_vector": feature_vector,
            "feature_names": FEATURE_NAMES,
            "image_quality": image_quality,
            "quality_details": quality_eval,
            "sensor_detected": sensor_detected,
            "sensor_confidence": sensor_confidence,
            "sensor_status": sensor_status,
            "is_valid_color": is_valid_color,
            "validation_message": validation_message,
            "is_saturated": is_saturated,
            "bbox": bbox,
            "roi": roi_norm,
            "debug_image": debug_image,
            "detection_meta": detection_meta,
            "presence_info": {
                "is_detected": sensor_detected,
                "has_skin": "HUMAN_SKIN" not in (detection_meta.get("rejection_reason") or ""),
                "sensor_confidence": sensor_confidence
            }
        }
