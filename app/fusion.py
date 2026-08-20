"""
app/fusion.py
-------------
Combines all signal sources into a final human-readable recommendation string.

Inputs:
    health_label  — from inference.py   e.g. "Early Blight"
    disease_type  — from inference.py   e.g. "fungal"
    timing_flag   — from weather.py     "proceed" | "delay_2_days"
    dosage_factor — from soil.py        e.g. 1.15
    base_schedule — from caller         e.g. [{"product": "Agri Gold", "dosage": "20grm"}]

Output:
    A single string recommendation, e.g.:
    "Delay spray by 2 days due to expected rain.
     Apply Agri Gold 22 grm (adjusted +15% for soil conditions)."

Dosage parsing:
    Dosage strings like "20grm", "1 kg", "400 Ml" are parsed robustly with
    a regex that handles mixed spacing and casing.  The numeric portion is
    scaled by dosage_factor and the original unit suffix is preserved.
    If parsing fails the original dosage string is kept unchanged.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

# Regex: captures leading number (int or float) + optional whitespace + unit suffix.
# Handles: "20grm", "20 grm", "1 kg", "400 Ml", "0.5L", "2.5 litre" etc.
_DOSAGE_RE = re.compile(
    r"^\s*(?P<value>[0-9]+(?:\.[0-9]+)?)\s*(?P<unit>[a-zA-Z]+)\s*$"
)


def _scale_dosage(dosage_str: str, factor: float) -> str:
    """
    Scale the numeric part of a dosage string by factor, preserving the unit.

    Examples:
        _scale_dosage("20grm", 1.10)  → "22 grm"
        _scale_dosage("1 kg",  1.15)  → "1.15 kg"
        _scale_dosage("400 Ml", 1.05) → "420 Ml"
        _scale_dosage("bad",   1.10)  → "bad"   (fallback, no error)
    """
    match = _DOSAGE_RE.match(dosage_str)
    if not match:
        logger.warning(
            "Could not parse dosage string '%s' — returning unchanged.", dosage_str
        )
        return dosage_str  # safe fallback

    original_value = float(match.group("value"))
    unit = match.group("unit")
    scaled = original_value * factor

    # Format: drop decimal places if result is a whole number.
    if scaled == int(scaled):
        return f"{int(scaled)} {unit}"
    return f"{scaled:.2f} {unit}"


def _timing_sentence(timing_flag: str) -> str:
    """Human-readable opening sentence based on timing_flag."""
    if timing_flag == "delay_2_days":
        return "Delay spray by 2 days due to expected rain."
    return "Conditions are suitable — proceed with application as planned."


def _pct_change(factor: float) -> str:
    """Convert 1.15 → '+15%', 1.0 → '+0%'."""
    pct = round((factor - 1.0) * 100)
    return f"+{pct}%" if pct >= 0 else f"{pct}%"


def build_recommendation(
    health_label: str,
    disease_type: str,
    timing_flag: str,
    dosage_factor: float,
    base_schedule: list[dict],
) -> str:
    """
    Build the final recommendation string.

    Parameters
    ----------
    health_label : str
        Predicted crop health / disease label.
    disease_type : str
        Category of the disease ("fungal", "bacterial", "viral", "none").
    timing_flag : str
        "proceed" or "delay_2_days".
    dosage_factor : float
        Dosage scaling factor from soil.py (e.g. 1.15).
    base_schedule : list[dict]
        Base product list, e.g. [{"product": "Agri Gold", "dosage": "20grm"}].

    Returns
    -------
    str
        A single paragraph recommendation.
    """
    parts: list[str] = []

    # 1. Timing sentence
    parts.append(_timing_sentence(timing_flag))

    # 2. Health status sentence
    if health_label.lower() == "healthy":
        parts.append("Crop appears healthy — routine maintenance schedule applies.")
    else:
        parts.append(
            f"Detected: {health_label} ({disease_type} condition)."
        )

    # 3. Product application sentences
    pct = _pct_change(dosage_factor)
    if not base_schedule:
        parts.append("No base schedule provided — consult agronomist for product selection.")
    else:
        product_lines: list[str] = []
        for item in base_schedule:
            product = item.get("product", "Unknown product")
            raw_dosage = str(item.get("dosage", "—"))
            adjusted_dosage = _scale_dosage(raw_dosage, dosage_factor)
            product_lines.append(f"{product} {adjusted_dosage}")

        products_str = ", ".join(product_lines)
        parts.append(
            f"Apply {products_str} (dosage adjusted {pct} for soil conditions)."
        )

    return " ".join(parts)
