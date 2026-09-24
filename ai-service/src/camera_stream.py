"""Live Desktop Camera Stream & Interactive H2S Test Strip Detector.

Opens the desktop webcam using OpenCV, overlays the on-screen central target alignment box,
performs real-time color extraction from the box, and allows workers to freeze, predict,
and save results with keyboard shortcuts.

Keyboard Controls:
    SPACE: Capture frame and run full Random Forest prediction
    S    : Save current frame to images/
    R    : Reset / unfreeze camera feed
    Q/ESC: Quit
"""

import os
import sys
import time

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import cv2
import numpy as np
from src.image_processor import StripProcessor
from src.predict import H2SPredictor


def run_camera_stream(
    camera_index: int = 0,
    target_box_ratio: float = 0.40,
    output_dir: str = "images"
):
    """Launch live desktop webcam interface with real-time target box and ML prediction."""
    os.makedirs(output_dir, exist_ok=True)
    predictor = H2SPredictor()
    processor = predictor.processor

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"Error: Could not open camera at index {camera_index}")
        return

    # Set camera resolution (e.g. 640x480 or 1280x720)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    window_name = "H2S Colorimetric Sensor - Desktop Camera (SPACE: Predict | S: Save | Q: Quit)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    print("\n=== Desktop Camera Active ===")
    print("Align the wristband chemical sensor inside the green target box.")
    print("Controls:")
    print("  [SPACE] : Run H2S Random Forest Prediction")
    print("  [S]     : Save current snapshot to images/")
    print("  [R]     : Resume live video feed")
    print("  [Q/ESC] : Quit\n")

    frozen_frame = None
    prediction_result = None

    while True:
        if frozen_frame is None:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame from camera.")
                break
        else:
            frame = frozen_frame.copy()

        h_img, w_img = frame.shape[:2]
        bw = int(w_img * target_box_ratio)
        bh = int(h_img * target_box_ratio)
        bx = (w_img - bw) // 2
        by = (h_img - bh) // 2

        display_frame = frame.copy()

        # Real-time processing inside the target box if not frozen
        if frozen_frame is None:
            try:
                # Fast feature extraction on current target box
                cv_res = processor.process_image(
                    frame,
                    use_central_box=True,
                    central_box_ratio=target_box_ratio
                )
                display_frame = cv_res["debug_image"]
                features = cv_res["features"]
                is_valid = cv_res["is_valid_color"]
                is_sat = cv_res["is_saturated"]

                # Draw top status bar
                cv2.rectangle(display_frame, (0, 0), (w_img, 45), (30, 30, 35), -1)

                is_hand_or_wristband = cv_res.get("is_hand_or_wristband", True)

                if not is_hand_or_wristband:
                    status_text = "STATUS: NO WRISTBAND / HAND DETECTED"
                    status_color = (0, 0, 255) # Red
                elif not is_valid:
                    status_text = "STATUS: UNRECOGNIZED COLOR - RETAKE REQUIRED"
                    status_color = (0, 140, 255) # Orange
                elif is_sat:
                    status_text = "STATUS: SENSOR SATURATED (CuS Blackening)"
                    status_color = (0, 0, 255) # Red
                else:
                    status_text = f"STATUS: WRISTBAND DETECTED | DeltaE: {features['DeltaE']}"
                    status_color = (0, 255, 0) # Green

                cv2.putText(
                    display_frame,
                    status_text,
                    (15, 28),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.55,
                    status_color,
                    2,
                    cv2.LINE_AA
                )

                # Draw live sampled color swatch in top right
                swatch_w, swatch_h = 40, 35
                r = int(features["R"])
                g = int(features["G"])
                b = int(features["B"])
                cv2.rectangle(
                    display_frame,
                    (w_img - swatch_w - 15, 5),
                    (w_img - 15, 5 + swatch_h),
                    (b, g, r),
                    -1
                )
                cv2.rectangle(
                    display_frame,
                    (w_img - swatch_w - 15, 5),
                    (w_img - 15, 5 + swatch_h),
                    (200, 200, 200),
                    1
                )

            except Exception as e:
                pass
        else:
            # Show frozen prediction results overlay
            if prediction_result:
                res = prediction_result
                # Dark transparent overlay on bottom half
                overlay = display_frame.copy()
                cv2.rectangle(overlay, (0, h_img - 130), (w_img, h_img), (20, 20, 25), -1)
                cv2.addWeighted(overlay, 0.85, display_frame, 0.15, 0, display_frame)

                if res.get("retake_required"):
                    title = "PREDICTION: PLEASE RETAKE PHOTO (UNRECOGNIZED COLOR)"
                    color = (0, 140, 255)
                    subtext = res.get("warning", "")[:80] + "..."
                elif res.get("sensor_status") == "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)":
                    title = "PREDICTION: ABOVE CALIBRATED SENSOR RANGE (> 10.0 ppm)"
                    color = (0, 0, 255)
                    subtext = "Physical chemical saturation detected. Sensor matrix completely blackened."
                else:
                    ppm = res.get("estimated_ppm", 0.0)
                    risk = res.get("risk_category", "")
                    title = f"H2S: {ppm:.2f} ppm  |  Risk: {risk.upper()}"
                    color = (0, 255, 0) if "Safe" in risk else (0, 215, 255) if "Low" in risk else (0, 140, 255)
                    subtext = f"DeltaE: {res['features']['DeltaE']} | Confidence: {res.get('confidence_score', 1.0)*100:.1f}%"

                cv2.putText(display_frame, title, (20, h_img - 85), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA)
                cv2.putText(display_frame, subtext, (20, h_img - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1, cv2.LINE_AA)
                cv2.putText(display_frame, "Press [R] to Resume Live Camera | [S] to Save | [Q] to Quit", (20, h_img - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1, cv2.LINE_AA)

        cv2.imshow(window_name, display_frame)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('q') or key == 27: # q or ESC
            break
        elif key == 32: # SPACE: Freeze and predict
            if frozen_frame is None:
                frozen_frame = frame.copy()
                print("Capturing frame and running Random Forest prediction...")
                prediction_result = predictor.predict_image(
                    frozen_frame,
                    use_central_box=True,
                    central_box_ratio=target_box_ratio
                )
                print(predictor.format_text_report(prediction_result))
        elif key == ord('r'): # Resume live feed
            frozen_frame = None
            prediction_result = None
            print("Resumed live camera feed.")
        elif key == ord('s'): # Save frame
            save_img = frozen_frame if frozen_frame is not None else frame
            save_filename = f"capture_{int(time.time())}.png"
            save_path = os.path.join(output_dir, save_filename)
            cv2.imwrite(save_path, save_img)
            print(f"Saved snapshot to: {save_path}")

    cap.release()
    cv2.destroyAllWindows()
    print("Camera stream closed.")


if __name__ == "__main__":
    run_camera_stream()
