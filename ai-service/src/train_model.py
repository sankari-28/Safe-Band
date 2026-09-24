"""Model Training Module for H2S Colorimetric Detection System.

Loads and harmonizes training datasets, trains Random Forest models for:
1. Calibrated exposure regressor (standard protocol: 15 min exposure)
2. Multi-exposure general regressor
3. Risk classification model

Saves trained artifacts and metadata for inference consistency.
"""

import json
import os
from typing import Dict, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error, accuracy_score, classification_report
from sklearn.model_selection import train_test_split

MODEL_DIR = "models"
DATA_DIR = "data"

FEATURE_NAMES = ["R", "G", "B", "H", "S", "V", "L", "a", "b", "DeltaE"]

# Standard reference baseline for DeltaE (OpenCV 8-bit LAB)
BASELINE_LAB = (148.0, 104.0, 132.0)

def categorize_risk(ppm: float) -> str:
    """Map H2S ppm concentration to industrial safety category."""
    if ppm < 1.0:
        return "Normal / Safe"
    elif ppm <= 5.0:
        return "Low Risk"
    elif ppm <= 10.0:
        return "Moderate Risk"
    else:
        return "High Danger"


def load_and_harmonize_data() -> pd.DataFrame:
    """Load both 1-5ppm and 5-10ppm datasets and harmonize to standard OpenCV color ranges."""
    df1_path = os.path.join(DATA_DIR, "safeband_demo_synthetic_1to5ppm.csv")
    df2_path = os.path.join(DATA_DIR, "safeband_demo_synthetic_5to10ppm.csv")

    if not os.path.exists(df1_path) or not os.path.exists(df2_path):
        raise FileNotFoundError(f"Training datasets not found in {DATA_DIR}")

    df1 = pd.read_csv(df1_path)
    df2 = pd.read_csv(df2_path)

    # Dataset 1 columns mapping (already in OpenCV 0-179 H, 0-255 S, 0-255 V)
    d1_clean = pd.DataFrame({
        "ppm": df1["ppm"],
        "exposure_time_min": df1["exposure_time_min"],
        "replicate": df1["replicate"],
        "R": df1["R_demo"],
        "G": df1["G_demo"],
        "B": df1["B_demo"],
        "H": df1["H_demo"],
        "S": df1["S_demo"],
        "V": df1["V_demo"],
        "L": df1["L_demo"],
        "a": df1["a_demo"],
        "b": df1["b_demo"],
        "DeltaE": df1["DeltaE_demo"]
    })

    # Dataset 2: H was scaled [0, 360], S and V normalized [0, 1].
    # Harmonize to standard OpenCV 8-bit scale: H -> H/2, S -> S*255, V -> V*255
    d2_clean = pd.DataFrame({
        "ppm": df2["ppm"],
        "exposure_time_min": df2["exposure_time_min"],
        "replicate": df2["replicate"],
        "R": df2["R_demo"],
        "G": df2["G_demo"],
        "B": df2["B_demo"],
        "H": df2["H_demo"] / 2.0,
        "S": df2["S_demo"] * 255.0,
        "V": df2["V_demo"] * 255.0,
        "L": df2["L_demo"],
        "a": df2["a_demo"],
        "b": df2["b_demo"],
        "DeltaE": df2["DeltaE_demo"]
    })

    # Add synthetic 0 ppm unexposed baseline calibration samples
    np.random.seed(42)
    n_baseline = 100
    baseline_samples = []
    for rep in range(n_baseline):
        r_val = float(np.clip(np.random.normal(92.0, 1.5), 85, 98))
        g_val = float(np.clip(np.random.normal(151.0, 1.5), 144, 158))
        b_val = float(np.clip(np.random.normal(132.0, 1.5), 125, 138))
        h_val = float(np.clip(np.random.normal(80.5, 1.5), 75, 85))
        s_val = float(np.clip(np.random.normal(99.0, 3.0), 90, 108))
        v_val = g_val
        l_val = float(np.clip(np.random.normal(148.0, 1.5), 143, 152))
        a_val = float(np.clip(np.random.normal(104.0, 1.0), 100, 108))
        b_val_lab = float(np.clip(np.random.normal(132.0, 1.0), 128, 136))
        de_val = float(np.sqrt((l_val - 148.0)**2 + (a_val - 104.0)**2 + (b_val_lab - 132.0)**2))

        baseline_samples.append({
            "ppm": 0.0,
            "exposure_time_min": int(np.random.choice([0, 1, 5, 15, 30])),
            "replicate": rep,
            "R": r_val, "G": g_val, "B": b_val,
            "H": h_val, "S": s_val, "V": v_val,
            "L": l_val, "a": a_val, "b": b_val_lab,
            "DeltaE": round(de_val, 2)
        })
    df_baseline = pd.DataFrame(baseline_samples)

    # Combine datasets
    combined = pd.concat([df_baseline, d1_clean, d2_clean], ignore_index=True)
    combined["risk_category"] = combined["ppm"].apply(categorize_risk)

    combined_path = os.path.join(DATA_DIR, "combined_training_data.csv")
    combined.to_csv(combined_path, index=False)
    print(f"Loaded and combined {len(combined)} rows saved to {combined_path}")
    return combined


def train_models(df: pd.DataFrame) -> Dict:
    """Train Random Forest regressor and classifier models."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    # 1. Calibrated standard protocol model: 15-minute exposure window
    # Standard colorimetric badges and detector strips are read at fixed exposure intervals.
    calibrated_exposure_min = 15
    df_calibrated = df[(df["exposure_time_min"] == calibrated_exposure_min) | (df["ppm"] == 0.0)]

    X_cal = df_calibrated[FEATURE_NAMES]
    y_cal = df_calibrated["ppm"]

    X_train_cal, X_test_cal, y_train_cal, y_test_cal = train_test_split(
        X_cal, y_cal, test_size=0.2, random_state=42
    )

    rf_calibrated = RandomForestRegressor(
        n_estimators=150,
        max_depth=15,
        min_samples_split=3,
        random_state=42,
        n_jobs=-1
    )
    rf_calibrated.fit(X_train_cal, y_train_cal)

    preds_cal = rf_calibrated.predict(X_test_cal)
    r2_cal = float(r2_score(y_test_cal, preds_cal))
    mae_cal = float(mean_absolute_error(y_test_cal, preds_cal))
    rmse_cal = float(np.sqrt(mean_squared_error(y_test_cal, preds_cal)))

    print(f"=== Calibrated Regressor (15 min protocol) ===")
    print(f"R2 Score: {r2_cal:.4f} | MAE: {mae_cal:.4f} ppm | RMSE: {rmse_cal:.4f} ppm")

    # 2. Risk Classifier Model (predicts category directly from color features)
    y_class_cal = df_calibrated["risk_category"]
    X_train_cls, X_test_cls, y_train_cls, y_test_cls = train_test_split(
        X_cal, y_class_cal, test_size=0.2, random_state=42, stratify=y_class_cal
    )

    rf_classifier = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rf_classifier.fit(X_train_cls, y_train_cls)

    preds_cls = rf_classifier.predict(X_test_cls)
    acc_cls = float(accuracy_score(y_test_cls, preds_cls))
    print(f"=== Risk Classifier ===")
    print(f"Accuracy: {acc_cls * 100:.2f}%")
    print(classification_report(y_test_cls, preds_cls))

    # 3. Multi-exposure general model (when exposure time is optionally known)
    features_with_time = FEATURE_NAMES + ["exposure_time_min"]
    X_all = df[features_with_time]
    y_all = df["ppm"]

    X_train_all, X_test_all, y_train_all, y_test_all = train_test_split(
        X_all, y_all, test_size=0.2, random_state=42
    )

    rf_general = RandomForestRegressor(
        n_estimators=150,
        max_depth=16,
        random_state=42,
        n_jobs=-1
    )
    rf_general.fit(X_train_all, y_train_all)

    preds_all = rf_general.predict(X_test_all)
    r2_all = float(r2_score(y_test_all, preds_all))
    mae_all = float(mean_absolute_error(y_test_all, preds_all))
    print(f"=== General Exposure Regressor ===")
    print(f"R2 Score: {r2_all:.4f} | MAE: {mae_all:.4f} ppm")

    # Save models
    calibrated_path = os.path.join(MODEL_DIR, "random_forest_regressor.pkl")
    classifier_path = os.path.join(MODEL_DIR, "random_forest_classifier.pkl")
    general_path = os.path.join(MODEL_DIR, "random_forest_general.pkl")

    joblib.dump(rf_calibrated, calibrated_path)
    joblib.dump(rf_classifier, classifier_path)
    joblib.dump(rf_general, general_path)

    # Save Metadata
    metadata = {
        "model_name": "H2S Random Forest Colorimetric Detector",
        "feature_names": FEATURE_NAMES,
        "feature_order": FEATURE_NAMES,
        "calibrated_exposure_min": calibrated_exposure_min,
        "baseline_lab": list(BASELINE_LAB),
        "saturation_thresholds": {
            "L_max": 55.0,
            "DeltaE_min": 95.0,
            "V_max": 45.0
        },
        "risk_categories": {
            "Normal / Safe": "< 1.0 ppm (Clean air)",
            "Low Risk": "1.0 - 5.0 ppm (OSHA Action Level)",
            "Moderate Risk": "5.0 - 10.0 ppm (ACGIH STEL Threshold)",
            "High Danger": "> 10.0 ppm (OSHA PEL Ceiling / Evacuate)"
        },
        "metrics": {
            "calibrated_regressor": {
                "r2": r2_cal,
                "mae": mae_cal,
                "rmse": rmse_cal
            },
            "risk_classifier": {
                "accuracy": acc_cls
            },
            "general_regressor": {
                "r2": r2_all,
                "mae": mae_all
            }
        },
        "version": "1.0.0"
    }

    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"All models and metadata successfully saved to {MODEL_DIR}/")
    return metadata


if __name__ == "__main__":
    combined_data = load_and_harmonize_data()
    train_models(combined_data)
