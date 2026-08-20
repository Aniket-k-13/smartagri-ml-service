"""
app/main.py
-----------
FastAPI application entry point.

Endpoints:
    GET  /health   — liveness probe, no auth required
    POST /predict  — main prediction endpoint, requires X-API-Key header

API contract (POST /predict):
    Request  — multipart/form-data with fields defined in PredictRequest below
    Response — JSON matching PredictResponse schema

CORS:
    CORSMiddleware is included so the Django backend can call this service
    cross-origin.  Allowed origins are read from the ALLOWED_ORIGINS env var
    (comma-separated list).  Default allows all origins ("*") for local dev —
    tighten this to your deployed Django URL in production.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.auth import verify_api_key
from app.fusion import build_recommendation
from app.inference import predict_image
from app.soil import get_dosage_factor
from app.weather import get_timing_flag

load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── App instantiation ─────────────────────────────────────────────────────────
app = FastAPI(
    title="SmartAgri ML Service",
    description=(
        "Crop health classification and spray recommendation microservice "
        "for SmartAgri Advisor (Vestige Agri project)."
    ),
    version="0.1.0",
)

# ── CORS middleware ───────────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS env var to a comma-separated list of your Django backend
# origins before deploying, e.g.:
#   ALLOWED_ORIGINS=https://your-django-backend.com,http://localhost:8000
#
# In development / Hugging Face Spaces preview: default "*" is fine.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_allowed_origins: list[str] = (
    ["*"] if _raw_origins.strip() == "*"
    else [o.strip() for o in _raw_origins.split(",") if o.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,   # credentials + wildcard origin is invalid; use explicit origins if needed
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)

logger.info("CORS allowed origins: %s", _allowed_origins)

# ── Supported crops ───────────────────────────────────────────────────────────
_SUPPORTED_CROPS = {"soybean", "chilli", "groundnut"}

# ── Hardcoded disease_type map (placeholder — expand after training) ──────────
# Map health_label → disease_type for the response.
# Once inference.py is returning real labels, move this into inference.py
# alongside _CLASS_LABELS so label + type stay co-located.
_DISEASE_TYPE_MAP: dict[str, str] = {
    "Healthy": "none",
    "Early Blight": "fungal",
    "Late Blight": "fungal",
    "Leaf Spot": "fungal",
    "Bacterial Blight": "bacterial",
    "Mosaic Virus": "viral",
    # TODO: extend this map once training labels are finalised
}
_DEFAULT_DISEASE_TYPE = "unknown"


# ── Response schema ───────────────────────────────────────────────────────────
class PredictResponse(BaseModel):
    health_label: str
    disease_type: str
    confidence: float
    timing_flag: str
    dosage_factor: float
    final_recommendation: str


# ── / root endpoint ──────────────────────────────────────────────────────────
@app.get("/", tags=["Meta"], response_class=HTMLResponse, include_in_schema=False)
async def root():
    """Landing page — links to docs and health check."""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SmartAgri ML Service</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0f1b10 0%, #1a2e1b 50%, #0d1f2d 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e8f5e9;
    }
    .card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(76,175,80,0.25);
      border-radius: 20px;
      padding: 48px 52px;
      max-width: 560px;
      width: 90%;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #2e7d32, #43a047);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 100px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(90deg, #81c784, #a5d6a7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    .sub {
      color: #a5d6a7;
      font-size: 0.95rem;
      font-weight: 300;
      margin-bottom: 36px;
      line-height: 1.6;
    }
    .links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    a.btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-radius: 12px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    a.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    a.btn .icon { font-size: 1.2rem; }
    a.btn .arrow { opacity: 0.6; }
    .btn-primary { background: linear-gradient(90deg, #2e7d32, #388e3c); color: #fff; }
    .btn-secondary { background: rgba(255,255,255,0.07); color: #c8e6c9; border: 1px solid rgba(255,255,255,0.1); }
    .status { margin-top: 32px; font-size: 0.78rem; color: #66bb6a; opacity: 0.7; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #66bb6a; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🌱 SmartAgri</div>
    <h1>ML Service</h1>
    <p class="sub">Crop health classification &amp; spray recommendation<br>microservice for SmartAgri Advisor.</p>
    <div class="links">
      <a href="/docs" class="btn btn-primary">
        <span><span class="icon">📖</span>&nbsp; Interactive API Docs (Swagger)</span>
        <span class="arrow">→</span>
      </a>
      <a href="/redoc" class="btn btn-secondary">
        <span><span class="icon">📄</span>&nbsp; ReDoc Reference</span>
        <span class="arrow">→</span>
      </a>
      <a href="/health" class="btn btn-secondary">
        <span><span class="icon">💚</span>&nbsp; Health Check</span>
        <span class="arrow">→</span>
      </a>
    </div>
    <p class="status"><span class="dot"></span>Service is running &bull; v0.1.0</p>
  </div>
</body>
</html>
"""


# ── /health endpoint ──────────────────────────────────────────────────────────
@app.get("/health", tags=["Meta"])
async def health_check() -> dict:
    """
    Liveness probe — returns 200 OK with service status.
    No authentication required.  Used by Hugging Face Spaces and any uptime monitors.
    """
    return {"status": "ok", "service": "smartagri-ml-service"}


# ── /predict endpoint ─────────────────────────────────────────────────────────
@app.post(
    "/predict",
    response_model=PredictResponse,
    tags=["Prediction"],
    dependencies=[Depends(verify_api_key)],
)
async def predict(
    crop: Annotated[str, Form(description="One of: soybean, chilli, groundnut")],
    image: Annotated[UploadFile, File(description="Leaf photo (JPG/PNG)")],
    lat: Annotated[float, Form(description="Farm GPS latitude")],
    lng: Annotated[float, Form(description="Farm GPS longitude")],
    ph: Annotated[float, Form(description="Soil pH value")],
    n: Annotated[float, Form(description="Soil nitrogen content (kg/ha)")],
    p: Annotated[float, Form(description="Soil phosphorus content (kg/ha)")],
    k: Annotated[float, Form(description="Soil potassium content (kg/ha)")],
    base_schedule: Annotated[
        str,
        Form(
            description=(
                'JSON string — base product/dosage list for the current stage. '
                'Example: [{"product": "Agri Gold", "dosage": "20grm"}]'
            )
        ),
    ],
) -> PredictResponse:
    """
    Main prediction endpoint.

    Accepts a leaf image + farm data and returns a crop health assessment
    with weather- and soil-adjusted spray recommendations.

    Authentication: X-API-Key header (value must match API_SECRET_KEY env var).
    """
    # ── Validate crop ─────────────────────────────────────────────────────────
    crop_lower = crop.lower().strip()
    if crop_lower not in _SUPPORTED_CROPS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported crop '{crop}'. Must be one of: {sorted(_SUPPORTED_CROPS)}",
        )

    # ── Parse base_schedule JSON ──────────────────────────────────────────────
    try:
        schedule: list[dict] = json.loads(base_schedule)
        if not isinstance(schedule, list):
            raise ValueError("base_schedule must be a JSON array.")
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid base_schedule JSON: {exc}",
        ) from exc

    # ── Read image bytes ──────────────────────────────────────────────────────
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image file is empty.",
        )

    # ── Step 1: Crop health inference ─────────────────────────────────────────
    logger.info("Running inference for crop='%s', file='%s'", crop_lower, image.filename)
    health_label, confidence = predict_image(image_bytes, crop_lower)
    disease_type = _DISEASE_TYPE_MAP.get(health_label, _DEFAULT_DISEASE_TYPE)

    # ── Step 2: Weather timing flag ───────────────────────────────────────────
    logger.info("Checking weather at (%.4f, %.4f)", lat, lng)
    timing_flag = get_timing_flag(lat, lng)

    # ── Step 3: Soil dosage factor ────────────────────────────────────────────
    dosage_factor = get_dosage_factor(ph=ph, n=n, p=p, k=k)
    logger.info(
        "Soil inputs — ph=%.1f N=%.1f P=%.1f K=%.1f → dosage_factor=%.2f",
        ph, n, p, k, dosage_factor,
    )

    # ── Step 4: Fuse into recommendation ─────────────────────────────────────
    final_recommendation = build_recommendation(
        health_label=health_label,
        disease_type=disease_type,
        timing_flag=timing_flag,
        dosage_factor=dosage_factor,
        base_schedule=schedule,
    )

    logger.info(
        "Prediction complete — label='%s' conf=%.2f timing='%s' factor=%.2f",
        health_label, confidence, timing_flag, dosage_factor,
    )

    return PredictResponse(
        health_label=health_label,
        disease_type=disease_type,
        confidence=round(confidence, 4),
        timing_flag=timing_flag,
        dosage_factor=dosage_factor,
        final_recommendation=final_recommendation,
    )
