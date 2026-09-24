"""FastAPI AI Microservice for H2S Colorimetric Detection.

Exposes REST API endpoints for image upload, OpenCV colorimetric feature extraction,
presence detection, sensor saturation verification, and Random Forest PPM prediction.
Integrates directly with the Safe-Band Expo React Native frontend and Spring Boot microservices.
"""

import base64
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, Optional
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.predict import H2SPredictor

app = FastAPI(
    title="H2S Guard AI Analysis Service",
    description="Colorimetric chemical sensor digitization and Random Forest PPM prediction microservice.",
    version="2.0.0"
)

# Enable CORS for all origins so Expo Web, Native mobile, and Spring Gateway can call directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor on startup
predictor: Optional[H2SPredictor] = None


@app.on_event("startup")
def load_model():
    global predictor
    try:
        predictor = H2SPredictor(model_dir="models")
        print("[AI Engine] Successfully loaded Random Forest models and metadata.")
    except Exception as e:
        print(f"[AI Engine] Error loading models: {e}")
        raise e


def map_risk_tier(risk_category: str) -> tuple:
    """Map human-readable risk category to frontend and backend enum standards.

    Returns:
        tuple: (frontend_risk_level, backend_exposure_level)
    """
    cat = (risk_category or "").upper()
    if "SAFE" in cat or "NORMAL" in cat:
        return "normal", "NORMAL"
    elif "LOW" in cat:
        return "normal", "LOW"
    elif "MODERATE" in cat:
        return "average", "AVERAGE"
    elif "HIGH" in cat:
        return "high", "HIGH"
    elif "ABOVE" in cat or "SATURAT" in cat:
        return "high", "SATURATED"
    else:
        return "normal", "UNKNOWN"


@app.get("/health")
@app.get("/api/health")
def health_check():
    """Health check endpoint for Docker, Spring Cloud Gateway, and Kubernetes."""
    return {
        "status": "UP",
        "service": "ai-analysis-service",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": predictor is not None
    }


@app.get("/")
def root_info():
    """Root metadata endpoint."""
    return {
        "service": "H2S Guard AI Microservice",
        "version": "2.0.0",
        "model": "Random Forest Regressor (R2=0.994) + Classifier (Acc=98.8%)",
        "endpoints": {
            "health": "/health",
            "analysis": "POST /api/analysis",
            "predict": "POST /predict"
        }
    }


class Base64AnalysisPayload(BaseModel):
    image: Optional[str] = None
    file: Optional[str] = None
    imageBase64: Optional[str] = None
    base64: Optional[str] = None
    photo: Optional[str] = None
    workerId: Optional[str] = "ANONYMOUS"
    worker_id: Optional[str] = None
    exposureTimeMin: Optional[float] = None
    exposure_time: Optional[float] = None
    requireWristband: Optional[bool] = False
    fileName: Optional[str] = "photo.jpg"


def execute_image_analysis(
    contents: bytes,
    filename: str = "photo.jpg",
    content_type: str = "image/jpeg",
    actual_worker_id: str = "ANONYMOUS",
    actual_exposure_time: Optional[float] = None,
    require_wristband: bool = False
) -> dict:
    import traceback
    if predictor is None:
        raise HTTPException(status_code=503, detail="AI Predictor model is not loaded.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    try:
        result = predictor.predict_image(
            contents,
            exposure_time_min=actual_exposure_time,
            require_wristband=require_wristband
        )
    except Exception as e:
        traceback.print_exc()
        print(f"[AI Engine] Exception in predict_image: {e}", file=sys.stderr)
        return {
            "analysisId": f"ANL-{uuid.uuid4().hex[:8].upper()}",
            "workerId": str(actual_worker_id),
            "fileName": filename,
            "fileSize": len(contents),
            "contentType": content_type,
            "predictedPpm": 0.0,
            "h2sLevel": 0.0,
            "h2sLevelPpm": 0.0,
            "uncertaintyPpm": 0.0,
            "riskLevel": "normal",
            "exposureLevel": "NORMAL",
            "riskCategory": "Normal / Safe",
            "confidence": 50.0,
            "confidencePercentage": 50.0,
            "recommendedDurationMinutes": 15,
            "status": "PROCESSING_WARNING",
            "sensorStatus": "UNABLE_TO_PARSE_STRIP",
            "isMock": False,
            "retakeRequired": True,
            "warning": f"Image processing error: {str(e)}",
            "message": "Please hold your wristband inside the center target box with good lighting and retake.",
            "features": {},
            "presenceInfo": {},
            "timestamp": datetime.now().isoformat()
        }

    analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"
    ppm_val = result.get("estimated_ppm")
    risk_cat = result.get("risk_category", "Unknown")
    sensor_status = result.get("sensor_status", "UNKNOWN")
    retake_req = bool(result.get("retake_required", False))
    sensor_detected = bool(result.get("sensor_detected", False))
    sensor_conf_raw = round(float(result.get("sensor_confidence", result.get("sensorConfidence", 0.0))), 3)
    image_quality = result.get("image_quality", "GOOD")
    pred_conf_raw = round(float(result.get("prediction_confidence", result.get("confidence_score", 0.0))), 3)

    if ppm_val is not None:
        ppm_val = round(float(ppm_val), 2)
        if ppm_val >= 10.0:
            risk_cat = "HIGH"
            front_risk, back_exposure = "high", "HIGH"
        elif ppm_val > 5.0:
            risk_cat = "MODERATE"
            front_risk, back_exposure = "average", "MODERATE"
        elif ppm_val >= 1.0:
            risk_cat = "LOW"
            front_risk, back_exposure = "normal", "LOW"
        else:
            risk_cat = "NORMAL"
            front_risk, back_exposure = "normal", "NORMAL"
    else:
        front_risk, back_exposure = map_risk_tier(risk_cat)

    if image_quality == "POOR":
        status_msg = "RETAKE_REQUIRED"
        user_message = result.get("warning") or "Image unclear. Hold the wristband steady and try again."
    elif not sensor_detected:
        status_msg = "RETAKE_REQUIRED"
        user_message = "Sensor not found. Point the camera at the wristband and try again."
    elif sensor_status == "ABOVE CALIBRATED SENSOR RANGE (PHYSICAL SATURATION)":
        status_msg = "PHYSICAL_SATURATION"
        user_message = (
            "PHYSICAL SENSOR SATURATION: Chemical matrix has completely turned dark (CuS precipitate). "
            "Exceeds calibrated range (>10 ppm). Hazardous H2S gas detected!"
        )
    else:
        status_msg = "PROCESSED"
        user_message = f"Scan complete. Estimated H2S: {ppm_val} ppm ({risk_cat})."

    # Clean numeric primitives for JSON serialization
    features_clean = {
        k: (float(v) if isinstance(v, (int, float, np.number)) else str(v))
        for k, v in result.get("features", {}).items()
    }
    presence_clean = {
        k: (bool(v) if isinstance(v, (bool, np.bool_)) else float(v) if isinstance(v, (int, float, np.number)) else str(v))
        for k, v in result.get("presence_info", {}).items()
    }

    return {
        "analysisId": analysis_id,
        "workerId": str(actual_worker_id),
        "fileName": filename,
        "fileSize": len(contents),
        "contentType": content_type,
        "sensorDetected": sensor_detected,
        "sensorConfidence": sensor_conf_raw,
        "sensorConfidencePercentage": round(sensor_conf_raw * 100.0, 1),
        "imageQuality": image_quality,
        "predictionConfidence": pred_conf_raw,
        "predictionConfidencePercentage": round(pred_conf_raw * 100.0, 1),
        "predictedPpm": ppm_val if ppm_val is not None else 0.0,
        "h2sLevel": ppm_val if ppm_val is not None else 0.0,
        "h2sLevelPpm": ppm_val if ppm_val is not None else 0.0,
        "referencePpm": result.get("referencePpm"),
        "rfPpm": result.get("rfPpm"),
        "disagreementPpm": result.get("disagreementPpm"),
        "isOutOfDistribution": result.get("isOutOfDistribution", False),
        "temporalStability": result.get("temporalStability", "SINGLE_FRAME"),
        "uncertaintyPpm": float(result.get("uncertainty_ppm", 0.0)),
        "riskLevel": front_risk,
        "exposureLevel": back_exposure,
        "riskCategory": risk_cat,
        "confidence": round(pred_conf_raw * 100.0, 1) if sensor_detected else round(sensor_conf_raw * 100.0, 1),
        "confidencePercentage": round(pred_conf_raw * 100.0, 1) if sensor_detected else round(sensor_conf_raw * 100.0, 1),
        "recommendedDurationMinutes": 15,
        "status": status_msg,
        "sensorStatus": sensor_status,
        "isMock": False,
        "retakeRequired": retake_req,
        "warning": result.get("warning"),
        "message": user_message,
        "features": features_clean,
        "presenceInfo": presence_clean,
        "diagnostics": result.get("diagnostics", {}),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/reference-scale")
def get_reference_scale():
    """Returns visual reference progression for demonstration."""
    if predictor is None:
        raise HTTPException(status_code=503, detail="AI Predictor model is not loaded.")
    return {
        "description": "Copper acetate colorimetric H2S reaction progression (visual reference demonstration)",
        "reference_scale": predictor.processor.reference_scale.get_reference_scale_ui()
    }


@app.post("/api/analysis/base64")
async def analyze_base64_endpoint(payload: Base64AnalysisPayload):
    """Base64 JSON image analysis endpoint (immune to multipart/form-data mobile bugs)."""
    raw_img = payload.image or payload.file or payload.imageBase64 or payload.base64 or payload.photo
    if not raw_img:
        raise HTTPException(status_code=400, detail="Missing base64 image data")
    if "," in raw_img:
        raw_img = raw_img.split(",", 1)[1]
    try:
        contents = base64.b64decode(raw_img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {e}")

    result_dict = execute_image_analysis(
        contents=contents,
        filename=payload.fileName or "photo.jpg",
        content_type="image/jpeg",
        actual_worker_id=payload.worker_id or payload.workerId or "ANONYMOUS",
        actual_exposure_time=payload.exposure_time or payload.exposureTimeMin,
        require_wristband=bool(payload.requireWristband)
    )
    return JSONResponse(content=result_dict)


@app.post("/api/analysis")
async def analyze_image_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(None),
    workerId: Optional[str] = Form("ANONYMOUS"),
    worker_id: Optional[str] = Form(None),
    exposureTimeMin: Optional[float] = Form(None),
    exposure_time: Optional[float] = Form(None),
    requireWristband: Optional[bool] = Form(False)
):
    """Unified analysis endpoint accepting both application/json (Base64) and multipart/form-data."""
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        try:
            body = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Malformed JSON payload.")
        raw_img = body.get("image") or body.get("file") or body.get("photo") or body.get("imageBase64") or body.get("base64")
        if not raw_img:
            raise HTTPException(status_code=400, detail="Missing base64 image field in JSON.")
        if "," in raw_img:
            raw_img = raw_img.split(",", 1)[1]
        try:
            contents = base64.b64decode(raw_img)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64: {e}")

        result_dict = execute_image_analysis(
            contents=contents,
            filename=body.get("fileName", "photo.jpg"),
            content_type="image/jpeg",
            actual_worker_id=body.get("worker_id") or body.get("workerId") or "ANONYMOUS",
            actual_exposure_time=body.get("exposure_time") or body.get("exposureTimeMin"),
            require_wristband=bool(body.get("requireWristband", False))
        )
        return JSONResponse(content=result_dict)

    # Multipart form-data branch
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")
    contents = await file.read()
    result_dict = execute_image_analysis(
        contents=contents,
        filename=file.filename,
        content_type=file.content_type or "image/jpeg",
        actual_worker_id=worker_id or workerId or "ANONYMOUS",
        actual_exposure_time=exposure_time or exposureTimeMin,
        require_wristband=bool(requireWristband)
    )
    return JSONResponse(content=result_dict)


@app.post("/predict")
async def predict_alias(
    request: Request,
    file: Optional[UploadFile] = File(None),
    worker_id: Optional[str] = Form("ANONYMOUS"),
    exposure_time: Optional[float] = Form(None)
):
    """Direct alias endpoint for standard prediction."""
    return await analyze_image_endpoint(
        request=request,
        file=file,
        workerId=worker_id,
        exposureTimeMin=exposure_time
    )


def start_server(host: str = "0.0.0.0", port: int = 5000):
    """Start uvicorn server directly."""
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    start_server(port=port)
