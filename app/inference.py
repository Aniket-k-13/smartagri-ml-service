"""
app/inference.py
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
"""

from __future__ import annotations

import io
import logging
import os
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
_STUB_CONFIDENCE = 0.95

# ── Per-crop ONNX session registry ────────────────────────────────────────────
# Populated at startup; value is None if the model file was not found.
_sessions: dict[str, Optional[object]] = {}


def _load_all_models() -> None:
    """
    Called once at module import.  Tries to load an onnxruntime.InferenceSession
    for each crop.  Missing files are logged and stored as None (stub mode).
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
                    "Failed to load ONNX model for crop '%s': %s — falling back to stub.",
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


# ── ⚠️  PREPROCESSING CONTRACT ────────────────────────────────────────────────
#  The block below is the ONE place where preprocessing lives.
#  It MUST exactly replicate what was done during training (Kaggle/Colab).
#  Mismatch here causes silent wrong predictions — no error, just bad output.
#
#  Before filling this in, document your training pipeline:
#    - Input image size (e.g. 224×224)
#    - Normalization: mean=[R,G,B], std=[R,G,B]  (ImageNet: [0.485,0.456,0.406] / [0.229,0.224,0.225])
#    - Channel order: RGB (PIL default) or BGR (OpenCV default)?
#    - Any augmentation applied at inference? (usually none — only at train time)
#
# TODO: Update _IMAGE_SIZE, _MEAN, _STD and the preprocess() function body
#       to match your training notebook before switching to real inference.
# ─────────────────────────────────────────────────────────────────────────────

_IMAGE_SIZE: tuple[int, int] = (224, 224)   # TODO: confirm from training notebook
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)  # TODO: confirm
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)   # TODO: confirm

# TODO: fill in class label map after training is done.
# Format: {output_index: ("Label Name", "disease_type")}
# disease_type should be one of: "fungal", "bacterial", "viral", "none"
_CLASS_LABELS: dict[int, tuple[str, str]] = {
    # 0: ("Healthy", "none"),
    # 1: ("Early Blight", "fungal"),
    # 2: ("Late Blight", "fungal"),
    # ... add your actual classes here
}


def _preprocess(image_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes → normalised float32 numpy array for ONNX input.

    TODO: Verify this matches your training preprocessing exactly.
          Common pitfalls:
            • Wrong resize method (BILINEAR vs NEAREST)
            • Forgetting channel-last → channel-first transpose (NHWC vs NCHW)
            • Normalization applied before or after uint8→float32 conversion
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(_IMAGE_SIZE, Image.BILINEAR)  # TODO: confirm resize interpolation

    arr = np.array(img, dtype=np.float32) / 255.0  # [H, W, C] in [0,1]
    arr = (arr - _MEAN) / _STD                      # normalize
    arr = arr.transpose(2, 0, 1)                    # [C, H, W]  ← ONNX/PyTorch convention
    arr = arr[np.newaxis, ...]                      # [1, C, H, W] — batch dimension
    return arr.astype(np.float32)


def predict_image(image_bytes: bytes, crop: str) -> tuple[str, float]:
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
    (label, confidence) : tuple[str, float]
        label      — the predicted health/disease class name
        confidence — model confidence in [0.0, 1.0]

    Stub behaviour (no model file present):
        Returns (_STUB_LABEL, _STUB_CONFIDENCE) immediately.
    """
    if crop not in _SUPPORTED_CROPS:
        logger.warning("Unknown crop '%s' — falling back to stub output.", crop)
        return _STUB_LABEL, _STUB_CONFIDENCE

    session = _sessions.get(crop)

    if session is None:
        # ── STUB MODE ─────────────────────────────────────────────────────────
        # Model file is not present yet.  Return hardcoded values so the
        # endpoint is fully testable before training is complete.
        logger.debug("Stub mode active for crop '%s'.", crop)
        return _STUB_LABEL, _STUB_CONFIDENCE

    # ── REAL INFERENCE MODE ───────────────────────────────────────────────────
    # TODO: Fill in the preprocessing + ONNX run block below once your training
    #       pipeline is finalised and your .onnx file is in models/.
    #
    # Steps to implement:
    #   1.  input_tensor = _preprocess(image_bytes)
    #   2.  input_name   = session.get_inputs()[0].name
    #   3.  outputs      = session.run(None, {input_name: input_tensor})
    #   4.  logits       = outputs[0][0]               # shape: [num_classes]
    #   5.  Apply softmax if your model outputs raw logits (not already softmax)
    #   6.  predicted_idx = int(np.argmax(logits))
    #   7.  confidence    = float(logits[predicted_idx]) after softmax
    #   8.  label, disease_type = _CLASS_LABELS.get(predicted_idx, ("Unknown", "none"))
    #   9.  Return (label, confidence)
    #
    # ⚠️  Remember: _CLASS_LABELS must be filled in above to match training labels.
    # ⚠️  Remember: _preprocess() must match training preprocessing exactly.

    raise NotImplementedError(
        f"Real inference not yet implemented for crop '{crop}'. "
        "Fill in the TODO block in app/inference.py after training is complete."
    )
