# SmartAgri ML Service 🌿⚡

A standalone, high-performance FastAPI microservice for **SmartAgri Advisor** (sponsored by Vestige Agri). This service processes leaf imagery alongside live weather forecasts and soil chemistry metrics to provide crop health diagnostics and tailored fertilizer dosage recommendations.

---

## 🏗 Architecture & Overview

This service is completely stateless and built to integrate seamlessly with the Django backend / Flutter mobile app:

```
[Flutter App / Farmer] 
         │ (Uploads leaf photo + GPS + Soil values)
         ▼
  [Django Backend] 
         │ (Looks up base schedule, forwards to ML Service)
         ▼
[SmartAgri ML FastAPI Service] 
  ├── 1. Leaf Disease Classification (ONNX Runtime / CNN)
  ├── 2. Weather Rain Check (OpenWeatherMap API)
  ├── 3. Soil Dosage Scaling (N/pH Threshold Rules)
  └── 4. Recommendation Fusion Engine
```

---

## 📁 Repository Structure

```
smartagri-ml-service/
├── app/
│   ├── __init__.py      # Package marker
│   ├── auth.py          # X-API-Key security middleware (401 on missing/invalid key)
│   ├── weather.py       # OpenWeatherMap forecast timing checks
│   ├── soil.py          # Soil threshold & dosage calculation
│   ├── inference.py     # ONNX Runtime model inference & preprocessing
│   ├── fusion.py        # Robust dosage parsing and recommendation builder
│   └── main.py          # FastAPI application, CORS & /predict endpoint
├── models/
│   ├── .gitkeep
│   └── README.md        # ONNX export guide for PyTorch & TensorFlow
├── .env.example         # Environment template
├── .gitignore           # Git ignore rules (.venv, .env, large model binaries)
├── Dockerfile           # Docker container configuration (Port 7860 for Hugging Face Spaces)
└── requirements.txt     # Python package dependencies
```

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/Aniket-k-13/smartagri-ml-service.git
cd smartagri-ml-service
```

### 2. Set Up Virtual Environment & Dependencies
```bash
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and set:
- `OPENWEATHER_API_KEY` = your OpenWeatherMap API key
- `API_SECRET_KEY` = your secret authentication key
- `ALLOWED_ORIGINS` = allowed CORS origins (default `*` for development)

### 4. Run the Dev Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload
```
API Documentation: [http://localhost:7860/docs](http://localhost:7860/docs)

---

## 📡 API Contract

### `GET /health`
Liveness check (no authentication required).

**Response:**
```json
{
  "status": "ok",
  "service": "smartagri-ml-service"
}
```

---

### `POST /predict`
Main inference endpoint. Requires `X-API-Key` header.

**Headers:**
- `X-API-Key`: `<API_SECRET_KEY>`
- `Content-Type`: `multipart/form-data`

**Form Data Fields:**
- `crop` (*string*): One of `soybean`, `chilli`, `groundnut`
- `image` (*file*): Leaf image file (`.jpg`, `.png`)
- `lat` (*float*): Latitude coordinate
- `lng` (*float*): Longitude coordinate
- `ph` (*float*): Soil pH
- `n` (*float*): Soil Nitrogen (kg/ha)
- `p` (*float*): Soil Phosphorus (kg/ha)
- `k` (*float*): Soil Potassium (kg/ha)
- `base_schedule` (*string*): JSON array string of products and dosages, e.g. `'[{"product": "Agri Gold", "dosage": "20grm"}]'`

**Response:**
```json
{
  "health_label": "Healthy",
  "disease_type": "none",
  "confidence": 0.95,
  "timing_flag": "proceed",
  "dosage_factor": 1.15,
  "final_recommendation": "Conditions are suitable — proceed with application as planned. Crop appears healthy — routine maintenance schedule applies. Apply Agri Gold 23 grm (dosage adjusted +15% for soil conditions)."
}
```

---

## 🐳 Docker & Hugging Face Spaces Deployment

The service is pre-configured with a `Dockerfile` matching Hugging Face Spaces specifications:

1. Create a new Space on **Hugging Face** with the **Docker SDK**.
2. Push this repository to your Space.
3. In **Settings → Variables and secrets**, define:
   - `OPENWEATHER_API_KEY`
   - `API_SECRET_KEY`
   - `ALLOWED_ORIGINS` (optional, for CORS restriction)
4. The service will auto-build and serve on port `7860`.
