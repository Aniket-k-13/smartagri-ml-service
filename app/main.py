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
from fastapi.responses import HTMLResponse, FileResponse
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

# disease_type is now returned directly from predict_image() alongside the label.
# It is stored in inference.py's _CLASS_LABELS map, co-located with label names.
# No separate lookup table is needed here.


# ── Response schema ───────────────────────────────────────────────────────────
class PredictResponse(BaseModel):
    health_label: str
    disease_type: str
    confidence: float
    timing_flag: str
    dosage_factor: float
    final_recommendation: str


# ── / root endpoint ──────────────────────────────────────────────────────────
@app.get("/", tags=["Meta"], response_class=FileResponse, include_in_schema=False)
async def root():
    """Landing page / Interactive Dashboard"""
    return FileResponse("dashboard.html")


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
    health_label, disease_type, confidence = predict_image(image_bytes, crop_lower)

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
