"""
backend/inference.py
----------------
Loads a trained ONNX model file per crop at module import time (once at
startup, NOT per request) and exposes a single predict_image() function.

Auto-detection between stub mode and real mode:
    • If the model file for the requested crop is present in models/,
      the ONNX session is loaded and real inference runs.
    • If the file is absent (pre-training phase), predict_image() returns
      a hardcoded stub result — no code change needed to switch modes.

This means: drop your exported .onnx file into models/ and real inference
activates automatically on the next server restart.

Supported crops: soybean, chilli, groundnut
Model file paths: models/<crop>_model.onnx

⚠️  ONNX export note:
    Models must be exported as a single self-contained .onnx file.
    Do NOT use save_as_external_data=True when exporting — that splits weights
    into a separate .data file which this loader cannot find at runtime.
    See models/README.md for the correct export snippet.
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ── Model file locations ───────────────────────────────────────────────────────
_MODELS_DIR = Path(__file__).parent.parent / "models"

_SUPPORTED_CROPS = ("soybean", "chilli", "groundnut")

# ── Stub fallback values (used when no model file is present) ─────────────────
_STUB_LABEL = "Healthy"
_STUB_DISEASE_TYPE = "none"
_STUB_CONFIDENCE = 0.95

# ── Per-crop class label maps ─────────────────────────────────────────────────
# Format: { crop: { output_index: ("Label Name", "disease_type") } }
# disease_type values: "fungal" | "bacterial" | "viral" | "nutrient" | "none"
#
# Index order matches model output — do NOT reorder.
# soybean intentionally supports 8 classes (4 dropped from original dataset:
#   2 for insufficient data, 2 for background artifacts in source images).
_CLASS_LABELS: dict[str, dict[int, tuple[str, str]]] = {
    "chilli": {
        0: ("Bacterial Spot",        "bacterial"),
        1: ("Cercospora Leaf Spot",  "fungal"),
        2: ("Curl Virus",            "viral"),
        3: ("Healthy",               "none"),
        4: ("Nutrition Deficiency",  "nutrient"),
        5: ("Powdery Mildew",        "fungal"),
    },
    "groundnut": {
        0: ("Early Leaf Spot",       "fungal"),
        1: ("Healthy",               "none"),
        2: ("Late Leaf Spot",        "fungal"),
        3: ("Nutrition Deficiency",  "nutrient"),
        4: ("Rust",                  "fungal"),
    },
    "soybean": {
        0: ("Bacterial Pustule",       "bacterial"),
        1: ("Frogeye Leaf Spot",       "fungal"),
        2: ("Healthy",                 "none"),
        3: ("Rust",                    "fungal"),
        4: ("Sudden Death Syndrome",   "fungal"),
        5: ("Target Leaf Spot",        "fungal"),
        6: ("Yellow Mosaic",           "viral"),
        7: ("Ferrugen",                "fungal"),
    },
}

# ── Per-crop ONNX session registry ────────────────────────────────────────────
# Populated at startup; value is None if the model file was not found.
_sessions: dict[str, Optional[object]] = {}


def _load_all_models() -> None:
    """
    Called once at module import. Tries to load an onnxruntime.InferenceSession
    for each crop. Missing files are logged and stored as None (stub mode).
    """
    for crop in _SUPPORTED_CROPS:
        model_path = _MODELS_DIR / f"{crop}_model.onnx"
        if model_path.exists():
            try:
                import onnxruntime as ort  # lazy import — not needed in stub mode

                session = ort.InferenceSession(
                    str(model_path),
                    providers=["CPUExecutionProvider"],
                )
                _sessions[crop] = session
                logger.info("Loaded ONNX model for crop '%s' from %s", crop, model_path)
            except Exception as exc:  # noqa: BLE001
                logger.error(
                    "Failed to load ONNX model for crop '%s': %s\n"
                    "  → If the error mentions a missing .data file, re-export the model\n"
                    "    without external data (see models/README.md). Falling back to stub.",
                    crop,
                    exc,
                )
                _sessions[crop] = None
        else:
            logger.warning(
                "Model file not found for crop '%s' at %s — running in STUB mode.",
                crop,
                model_path,
            )
            _sessions[crop] = None


# Run at import time so models are warm before the first request.
_load_all_models()


# ── Preprocessing ─────────────────────────────────────────────────────────────
# Pipeline (must exactly match training):
#   1. Open image → convert to RGB
#   2. Resize to 224 × 224 using BILINEAR interpolation
#   3. uint8 [0,255] → float32 [0.0, 1.0]
#   4. Normalize with ImageNet mean/std (per channel, RGB order)
#   5. Transpose HWC → CHW  (PyTorch / ONNX convention)
#   6. Add batch dimension: [C,H,W] → [1,C,H,W]

_IMAGE_SIZE: tuple[int, int] = (224, 224)
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def _preprocess(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes → normalised float32 tensor [1, 3, 224, 224]."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(_IMAGE_SIZE, Image.BILINEAR)

    arr = np.array(img, dtype=np.float32) / 255.0   # [H, W, C] in [0, 1]
    arr = (arr - _MEAN) / _STD                        # ImageNet normalisation
    arr = arr.transpose(2, 0, 1)                      # [C, H, W]
    arr = arr[np.newaxis, ...]                        # [1, C, H, W]
    return arr.astype(np.float32)


def _softmax(x: np.ndarray) -> np.ndarray:
    """Numerically stable softmax over a 1-D logit array."""
    e = np.exp(x - np.max(x))
    return e / e.sum()


def predict_image(image_bytes: bytes, crop: str) -> tuple[str, str, float]:
    """
    Run inference on the supplied image bytes for the given crop.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of the uploaded leaf image (any PIL-supported format).
    crop : str
        One of "soybean", "chilli", "groundnut".

    Returns
    -------
    (label, disease_type, confidence) : tuple[str, str, float]
        label        — predicted health/disease class name
        disease_type — "fungal" | "bacterial" | "viral" | "nutrient" | "none"
        confidence   — model confidence in [0.0, 1.0] after softmax

    Stub behaviour (no model file / failed to load):
        Returns (_STUB_LABEL, _STUB_DISEASE_TYPE, _STUB_CONFIDENCE).
    """
    if crop not in _SUPPORTED_CROPS:
        logger.warning("Unknown crop '%s' — falling back to stub output.", crop)
        return _STUB_LABEL, _STUB_DISEASE_TYPE, _STUB_CONFIDENCE

    session = _sessions.get(crop)

    if session is None:
        # ── STUB MODE ─────────────────────────────────────────────────────────
        # Model file is absent or failed to load.
        # Returns hardcoded values so /predict is fully testable without a model.
        logger.debug("Stub mode active for crop '%s'.", crop)
        return _STUB_LABEL, _STUB_DISEASE_TYPE, _STUB_CONFIDENCE

    # ── REAL INFERENCE MODE ───────────────────────────────────────────────────
    input_tensor = _preprocess(image_bytes)                    # [1, 3, 224, 224]
    input_name   = session.get_inputs()[0].name
    outputs      = session.run(None, {input_name: input_tensor})
    logits       = outputs[0][0]                               # [num_classes]

    probs        = _softmax(logits)                            # softmax → probabilities
    predicted_idx = int(np.argmax(probs))
    confidence    = float(probs[predicted_idx])

    crop_labels = _CLASS_LABELS.get(crop, {})
    label, disease_type = crop_labels.get(predicted_idx, ("Unknown", "none"))

    logger.info(
        "Inference result for crop='%s': idx=%d label='%s' type='%s' conf=%.4f",
        crop, predicted_idx, label, disease_type, confidence,
    )
    return label, disease_type, confidence
