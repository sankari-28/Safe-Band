"""Generate realistic synthetic test strip images for development and testing.

Creates test strip images at different H2S exposure levels with realistic
paper background, chemical indicator zone, border shadows, and subtle paper grain.
"""

import os
from typing import Tuple
import numpy as np
import cv2

def create_strip_image(
    indicator_rgb: Tuple[int, int, int],
    output_path: str,
    width: int = 400,
    height: int = 600,
    noise_sigma: float = 2.0
):
    """Render a realistic test strip image with paper border and central indicator pad."""
    # Background: off-white workbench / testing surface (BGR)
    img = np.full((height, width, 3), (235, 238, 240), dtype=np.uint8)

    # Test strip plastic/paper carrier dimensions (centered)
    carrier_w = int(width * 0.45)
    carrier_h = int(height * 0.80)
    c_x1 = (width - carrier_w) // 2
    c_y1 = (height - carrier_h) // 2
    c_x2 = c_x1 + carrier_w
    c_y2 = c_y1 + carrier_h

    # Draw carrier shadow
    shadow_offset = 6
    cv2.rectangle(
        img,
        (c_x1 + shadow_offset, c_y1 + shadow_offset),
        (c_x2 + shadow_offset, c_y2 + shadow_offset),
        (190, 195, 200),
        -1
    )

    # Draw white/cream carrier paper
    cv2.rectangle(img, (c_x1, c_y1), (c_x2, c_y2), (250, 252, 253), -1)
    cv2.rectangle(img, (c_x1, c_y1), (c_x2, c_y2), (210, 215, 220), 1)

    # Chemical sensor reactive pad (square centered in upper half of strip)
    pad_size = int(carrier_w * 0.75)
    p_x1 = c_x1 + (carrier_w - pad_size) // 2
    p_y1 = c_y1 + int(carrier_h * 0.20)
    p_x2 = p_x1 + pad_size
    p_y2 = p_y1 + pad_size

    # Convert indicator RGB to BGR for OpenCV
    r, g, b = indicator_rgb
    pad_bgr = (b, g, r)

    # Fill pad with chemical color
    pad_img = np.full((pad_size, pad_size, 3), pad_bgr, dtype=np.float32)

    # Add realistic subtle paper grain noise
    noise = np.random.normal(0, noise_sigma, pad_img.shape)
    pad_noisy = np.clip(pad_img + noise, 0, 255).astype(np.uint8)

    img[p_y1:p_y2, p_x1:p_x2] = pad_noisy

    # Pad border
    cv2.rectangle(img, (p_x1, p_y1), (p_x2, p_y2), (180, 185, 190), 1)

    # Add subtle labeling text on carrier handle
    cv2.putText(
        img,
        "H2S SENSOR",
        (c_x1 + 15, c_y2 - 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (120, 125, 130),
        1,
        cv2.LINE_AA
    )
    cv2.putText(
        img,
        "Cu(OAc)2 Matrix",
        (c_x1 + 10, c_y2 - 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.35,
        (150, 155, 160),
        1,
        cv2.LINE_AA
    )

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, img)
    print(f"Generated test image: {output_path} with indicator RGB {indicator_rgb}")


def generate_standard_test_suite(output_dir: str = "images"):
    """Generate reference images spanning the calibrated and saturated ranges."""
    os.makedirs(output_dir, exist_ok=True)

    # Reference colors from the dataset:
    # 0 ppm unexposed baseline (pale blue-green)
    create_strip_image(
        indicator_rgb=(92, 151, 132),
        output_path=os.path.join(output_dir, "test_strip_0ppm_baseline.png")
    )

    # ~2.0 ppm at 15 min (light olive / tan)
    create_strip_image(
        indicator_rgb=(84, 132, 114),
        output_path=os.path.join(output_dir, "test_strip_2ppm_15min.png")
    )

def create_wristband_image(
    indicator_rgb: Tuple[int, int, int],
    output_path: str,
    width: int = 500,
    height: int = 500
):
    """Render a realistic wristband with reactive chemical sensor pad in the center."""
    # Background: workplace tabletop (wood/grey surface)
    img = np.full((height, width, 3), (210, 215, 218), dtype=np.uint8)

    # Worker forearm skin tone / work glove sleeve in background
    cv2.rectangle(img, (int(width * 0.15), 0), (int(width * 0.85), height), (170, 195, 220), -1)

    # Wristband strap: dark industrial navy silicone band (width = 120px) running across
    strap_y1 = int(height * 0.32)
    strap_y2 = int(height * 0.68)
    cv2.rectangle(img, (0, strap_y1), (width, strap_y2), (45, 45, 55), -1)
    # Strap texture grooves
    for x in range(0, width, 25):
        cv2.line(img, (x, strap_y1), (x, strap_y2), (35, 35, 42), 2)

    # Central sensor bezel on wristband (centered in the middle of the frame!)
    bezel_size = 140
    bx1 = (width - bezel_size) // 2
    by1 = (height - bezel_size) // 2
    bx2 = bx1 + bezel_size
    by2 = by1 + bezel_size
    cv2.rectangle(img, (bx1, by1), (bx2, by2), (25, 25, 30), -1)
    cv2.rectangle(img, (bx1, by1), (bx2, by2), (70, 75, 80), 2)

    # Reactive chemical sensor pad in the center of the bezel
    pad_size = 100
    px1 = (width - pad_size) // 2
    py1 = (height - pad_size) // 2
    px2 = px1 + pad_size
    py2 = py1 + pad_size

    # Chemical indicator color (BGR)
    r, g, b = indicator_rgb
    pad_bgr = (b, g, r)

    pad_img = np.full((pad_size, pad_size, 3), pad_bgr, dtype=np.float32)
    noise = np.random.normal(0, 1.5, pad_img.shape)
    pad_noisy = np.clip(pad_img + noise, 0, 255).astype(np.uint8)
    img[py1:py2, px1:px2] = pad_noisy

    # Pad bezel border
    cv2.rectangle(img, (px1, py1), (px2, py2), (190, 195, 200), 1)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, img)
    print(f"Generated wristband image: {output_path} with indicator RGB {indicator_rgb}")


def generate_standard_test_suite(output_dir: str = "images"):
    """Generate reference images spanning the calibrated and saturated ranges."""
    os.makedirs(output_dir, exist_ok=True)

    # Standard rectangular test strip carrier
    create_strip_image(
        indicator_rgb=(92, 151, 132),
        output_path=os.path.join(output_dir, "test_strip_0ppm_baseline.png")
    )
    create_strip_image(
        indicator_rgb=(84, 132, 114),
        output_path=os.path.join(output_dir, "test_strip_2ppm_15min.png")
    )
    create_strip_image(
        indicator_rgb=(62, 84, 69),
        output_path=os.path.join(output_dir, "test_strip_5ppm_15min.png")
    )
    create_strip_image(
        indicator_rgb=(48, 60, 46),
        output_path=os.path.join(output_dir, "test_strip_10ppm_15min.png")
    )
    create_strip_image(
        indicator_rgb=(32, 35, 32),
        output_path=os.path.join(output_dir, "test_strip_saturated.png")
    )

    # Realistic Worker Wristband images (centered in the camera alignment box)
    create_wristband_image(
        indicator_rgb=(92, 151, 132),
        output_path=os.path.join(output_dir, "wristband_clean_0ppm.png")
    )
    create_wristband_image(
        indicator_rgb=(84, 132, 114),
        output_path=os.path.join(output_dir, "wristband_worker_2ppm.png")
    )
    create_wristband_image(
        indicator_rgb=(62, 84, 69),
        output_path=os.path.join(output_dir, "wristband_worker_5ppm.png")
    )

    # Invalid out-of-domain images (e.g. red shirt, pink sleeve captured in target box)
    create_strip_image(
        indicator_rgb=(220, 20, 30),
        output_path=os.path.join(output_dir, "invalid_red_object.png")
    )
    create_strip_image(
        indicator_rgb=(240, 120, 160),
        output_path=os.path.join(output_dir, "invalid_pink_fabric.png")
    )


if __name__ == "__main__":
    generate_standard_test_suite()
