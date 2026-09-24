# Safe-Band: Smart Colorimetric H₂S Gas Detection & Worker Safety System

An end-to-end industrial occupational safety ecosystem combining **wearable chemical colorimetric test strips**, **edge computer vision**, **machine learning concentration estimation**, **Spring Boot microservices**, and a cross-platform **React Native (Expo) web & mobile dashboard**.

---

## 🚀 Quick Start Guide

For comprehensive setup, database configuration, and running instructions, please see:
👉 **[HOW_TO_RUN.md](./HOW_TO_RUN.md)**

### One-Click Launch (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```
Or double-click `start-all.bat`.

---

## 🏗️ Architecture & Component Overview

```
Safe-Band/
├── ai-service/              # Python FastAPI computer vision & ML inference engine
│   ├── src/                 # Strip detection, chromatic trajectory projection, PPM regression
│   ├── tests/               # 33-scenario sensor validation test harness
│   ├── models/              # Trained Random Forest regression and classification models
│   └── requirements.txt     # Python dependencies (OpenCV, scikit-learn, FastAPI, etc.)
│
├── backend/                 # Spring Boot enterprise microservices
│   ├── api-gateway/         # Spring Cloud Gateway (Port 8080)
│   ├── auth-service/        # JWT Authentication & role security (Port 8081)
│   ├── user-service/        # Worker profiles & attendance tracking (Port 8082)
│   ├── exposure-service/    # H₂S exposure logs & safety threshold checks (Port 8083)
│   ├── notification-service/# Emergency alerting & broadcasts (Port 8084)
│   ├── ai-analysis-service/ # Spring-to-Python inference bridge & auditing (Port 8085)
│   └── start-backend.ps1    # Microservices orchestration script
│
├── app/                     # Expo React Native file-based router pages
├── components/              # Live camera viewfinder, exposure cards, status widgets
├── context/                 # Application state, authentication & theme providers
├── services/                # Axios API clients for Spring Gateway & local fallback
├── HOW_TO_RUN.md            # Comprehensive execution and troubleshooting manual
├── start-all.ps1            # Unified system launcher
└── stop-all.ps1             # Clean service termination script
```

---

## 🔬 Core Sensing Principles

- **Chemical Reaction Matrix**: $\text{Cu(CH}_3\text{COO)}_2 + \text{H}_2\text{S} \rightarrow \text{CuS}\downarrow + 2\text{CH}_3\text{COOH}$
- **Perceptually Calibrated Progression**:
  - Unexposed pad: Pale blue/green ($L \approx 148, a \approx 104, b \approx 132$)
  - Low exposure (1–5 PPM): Olive-green to tan transition
  - High exposure (5–10 PPM): Brown to dark brown CuS precipitation
  - Saturation ($>10$ PPM): Deep brown/black complete saturation
- **Negative-Object Discrimination**:
  - Automatic rejection of watches, silicone bands, clothing, and skin ($s_{\text{conf}} \le 0.10$).
- **Illumination Robustness**:
  - Trajectory-relative Euclidean projection ensures $\le 0.8$ PPM deviation across $\pm 20\%$ lighting variance.

---

## 🧪 Testing

Run the automated sensor validation test harness:
```bash
cd ai-service
python -m unittest tests/test_sensor_validation_harness.py
```

All 33 verification scenarios pass cleanly.
