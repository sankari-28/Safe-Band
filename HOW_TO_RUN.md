# H₂S Guard / Safe-Band — Complete System Execution Guide

This document provides step-by-step instructions to set up, launch, verify, and interact with the **Safe-Band H₂S Guard** industrial safety platform.

---

## 1. System Architecture Overview

The Safe-Band system is composed of three interconnected layers:

```
                     ┌──────────────────────────────────────────────┐
                     │          Expo React Native Frontend          │
                     │   (Web Dashboard & Mobile App: Port 8088)    │
                     └──────────────────────┬───────────────────────┘
                                            │
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │        Spring Cloud API Gateway (8080)       │
                     └──────┬───────┬───────┬───────┬───────┬───────┘
                            │       │       │       │       │
         ┌──────────────────┘       │       │       │       └──────────────────┐
         ▼                          ▼       ▼       ▼                          ▼
┌─────────────────┐        ┌──────────────┐ ┌────────────────┐        ┌──────────────────┐
│  Auth Service   │        │ User Service │ │Exposure Service│        │Notification Svc  │
│   (Port 8081)   │        │ (Port 8082)  │ │  (Port 8083)   │        │   (Port 8084)    │
└────────┬────────┘        └──────┬───────┘ └───────┬────────┘        └────────┬─────────┘
         │                        │                 │                          │
         └────────────────────────┼─────────────────┼──────────────────────────┘
                                  ▼                 ▼
                     ┌──────────────────────────────────────────────┐
                     │            MySQL Database (3306)             │
                     │ (h2s_auth, h2s_user, h2s_exposure, h2s_notif)│
                     └──────────────────────────────────────────────┘
                                            ▲
                                            │
                     ┌──────────────────────┴───────────────────────┐
                     │       AI Analysis Spring Service (8085)      │
                     └──────────────────────┬───────────────────────┘
                                            │ (REST /api/analysis)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │       FastAPI Python AI Vision Service       │
                     │          (OpenCV + ML: Port 5000)            │
                     └──────────────────────────────────────────────┘
```

### Microservice Port Allocation
| Service | Technology | Port | Primary Responsibility | Health Endpoint |
|---|---|---|---|---|
| **FastAPI AI Service** | Python 3.10+, OpenCV, Scikit-Learn | `5000` | Computer vision strip detection, chromatic projection, PPM estimation | `http://localhost:5000/api/health` |
| **Spring Cloud Gateway** | Spring Boot, Spring Cloud | `8080` | Unified API entry point & routing | `http://localhost:8080/actuator/health` |
| **Auth Service** | Spring Boot, Spring Security, JWT | `8081` | Authentication, credential storage, token issuance | `http://localhost:8081/actuator/health` |
| **User Service** | Spring Boot, Spring Data JPA | `8082` | User profiles, roles, worker directory, attendance | `http://localhost:8082/actuator/health` |
| **Exposure Service** | Spring Boot, Spring Data JPA | `8083` | Exposure readings, threshold monitoring, compliance | `http://localhost:8083/actuator/health` |
| **Notification Service** | Spring Boot, Spring Data JPA | `8084` | Safety alerts, high-risk notifications, broadcasts | `http://localhost:8084/actuator/health` |
| **AI Analysis Service** | Spring Boot, Spring Data JPA | `8085` | AI microservice bridge & audit log persistence | `http://localhost:8085/actuator/health` |
| **Expo Web & App** | React Native, Expo SDK, TypeScript | `8088` | Responsive Web dashboard & Mobile viewfinder scanner | `http://localhost:8088` |
| **MySQL Database** | MySQL Community Server 8.0+ | `3306` | Persistent relational storage with automated Flyway migrations | `localhost:3306` |

---

## 2. Prerequisites & Environment Setup

Ensure the following tools are installed and available on your system `PATH`:

1. **Python 3.10 or 3.11+**
   ```bash
   python --version
   ```
2. **Node.js 18+ & npm**
   ```bash
   node --version
   npm --version
   ```
3. **Java JDK 17+**
   ```bash
   java -version
   ```
4. **Apache Maven 3.9+**
   ```bash
   mvn -version
   ```
5. **MySQL Server 8.0+**
   - Ensure the MySQL service is running on default port `3306`.
   - Default configured database credentials:
     - User: `root`
     - Password: *(empty / blank by default; override with environment variable `MYSQL_PASSWORD` if configured)*

---

## 3. Initial Installation

### Step A: Install Python AI Service Dependencies
```bash
# From Safe-Band repository root:
cd ai-service
pip install -r requirements.txt
cd ..
```

### Step B: Install Expo Frontend Dependencies
```bash
# From Safe-Band repository root:
npm install
```

### Step C: MySQL Databases Setup
The Spring Boot microservices use **Flyway** to automatically create and migrate database schemas on first boot. Create the required target databases in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS h2s_auth;
CREATE DATABASE IF NOT EXISTS h2s_user;
CREATE DATABASE IF NOT EXISTS h2s_exposure;
CREATE DATABASE IF NOT EXISTS h2s_notification;
CREATE DATABASE IF NOT EXISTS h2s_ai;
```
*(You can run this via MySQL Workbench, HeidiSQL, or `mysql -u root -p < init.sql`)*.

---

## 4. One-Click Startup (Recommended)

The repository includes an intelligent unified launcher script that checks MySQL, starts all microservices in dependency order, verifies health endpoints, and launches the frontend dashboard.

### On Windows PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```
*To keep the launcher console monitoring services in real-time:*
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1 -KeepAlive
```

### On Windows CMD / File Explorer:
Double-click `start-all.bat`.

### Stopping All Services:
To cleanly shut down all services and free all ports (preserving MySQL):
```powershell
powershell -ExecutionPolicy Bypass -File .\stop-all.ps1
```
*(or double-click `stop-all.bat`)*.

---

## 5. Manual Step-by-Step Startup

If you prefer to start each service in an individual terminal window:

### Terminal 1: Python AI FastAPI Service
```bash
cd ai-service
python src/api_server.py
```
*Service will start on `http://localhost:5000`.* Verify at: `http://localhost:5000/api/health`

### Terminal 2: Spring Boot Microservices
You can launch all backend microservices at once:
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

*Or launch each microservice individually in separate windows using Maven:*
```bash
# In backend/auth-service:
mvn spring-boot:run

# In backend/user-service:
mvn spring-boot:run

# In backend/notification-service:
mvn spring-boot:run

# In backend/exposure-service:
mvn spring-boot:run

# In backend/ai-analysis-service:
mvn spring-boot:run

# In backend/api-gateway:
mvn spring-boot:run
```

### Terminal 3: Expo React Native Frontend
```bash
# In repository root:
npx expo start --web --port 8088
```
*The web dashboard will open automatically in your browser at `http://localhost:8088`.*

---

## 6. Accessing the Application

### Web Browser
- **Dashboard URL**: [http://localhost:8088](http://localhost:8088)
- **API Gateway**: [http://localhost:8080](http://localhost:8080)
- **AI Service OpenAPI Swagger Docs**: [http://localhost:5000/docs](http://localhost:5000/docs)

### Mobile App (Expo Go)
1. Run `npx expo start` without the `--web` flag (or press `s` in the Expo terminal to toggle to Expo Go QR mode).
2. Install **Expo Go** from Google Play Store or Apple App Store.
3. Scan the QR code displayed in the terminal with your phone camera or the Expo Go app.
4. Ensure your phone and development machine are connected to the same Wi-Fi network.

### Default Login Accounts
| Role | Email / Username | Default Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@safeband.com` / `admin` | `admin123` | Full system administration, user management, system audit |
| **Safety Officer** | `safety@safeband.com` / `safety` | `safety123` | Risk thresholds, safety incident triage, compliance reports |
| **Field Worker** | `worker1@safeband.com` / `worker1` | `worker123` | Strip camera scanning, exposure logs, daily attendance |

---

## 7. AI Sensor Validation & Test Suites

The AI computer vision pipeline (`ai-service/src/`) features:
1. **Multi-Form-Factor Detection**: Supports both square pads (1:1) and elongated sensor strips (up to 5.5:1 aspect ratio), standalone or worn on wristbands and smartwatches.
2. **Illumination Invariance**: Relative chromaticity projections ($r, g, b, \Delta E$) robust against $\pm 20\%$ brightness shifts and warm/cool white balance variations.
3. **Negative-Object Rejection**: Strict rejection of non-sensor objects (watches, silicone bands, skin, clothing) with confidence $\le 0.10$.
4. **Out-of-Distribution (OOD) Protection**: Perpendicular Euclidean trajectory bounds reject invalid colors before concentration estimation.

### Running Automated Test Suites
To run the automated verification test harness (33 test scenarios across 9 test suites):

```bash
cd ai-service
python -m unittest tests/test_sensor_validation_harness.py
```

Expected output:
```text
Ran 9 tests in ~25s
OK
============================================================================================
H2S SENSOR DETECTION & VALIDATION VERIFICATION MATRIX
============================================================================================
All 33 scenarios (1-10 PPM, Rotations, Shadows, Glare, Watch Rejection, Strip Scans): PASS
```

### Direct Testing via cURL
Test the AI vision analysis endpoint directly with an image:
```bash
curl -X POST "http://localhost:5000/api/analysis" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/sensor_image.png"
```

Sample JSON Response:
```json
{
  "sensorDetected": true,
  "sensorConfidence": 0.945,
  "ppm": 5.51,
  "riskLevel": "MODERATE",
  "chemicalReactionValid": true,
  "rejectionReason": null,
  "features": {
    "R": 118.2,
    "G": 105.4,
    "B": 84.1,
    "L": 112.5,
    "deltaE": 42.1
  }
}
```

---

## 8. Troubleshooting & Common Issues

| Symptom | Root Cause | Solution |
|---|---|---|
| `MySQL connection failed on port 3306` | MySQL service is stopped or port blocked | Run `Start-Service MySQL80` or start MySQL in Services (`services.msc`). |
| `Port 8080/5000/8088 already in use` | Lingering process from previous run | Run `.\stop-all.ps1` to automatically terminate old background processes. |
| `FastAPI models not found` | Models path missing | Ensure you run the AI server with working directory set to `ai-service/`. |
| `Gateway returns 503 Service Unavailable` | Downstream microservice is still starting up | Wait 15-20 seconds for Spring Boot microservices to complete Flyway schema migration and initialize. |
| `Expo web blank screen / bundle error` | Outdated `node_modules` | Run `npm install` and restart Expo with `npx expo start --clear`. |

---

## 9. License & Project Maintenance

Developed for the Smart India Hackathon (SIH) — **Safe-Band Industrial Safety & H₂S Detection System**.
For technical questions or issue reports, consult the codebase maintainers or submit an issue on the GitHub repository.
