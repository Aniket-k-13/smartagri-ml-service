"""
backend/soil.py
-----------
Rule-based dosage adjustment factor derived from farmer-entered soil values.

Current rules (placeholders — refine after agronomist review):
    base factor:            1.0
    if N < 40 kg/ha:       +0.10   (low nitrogen → increase dosage)
    if pH < 6.0 or > 7.5:  +0.05   (out-of-range pH → slight extra dosage)

The returned factor is multiplied against the base product dosage in fusion.py.
Example: factor 1.15 on a "20grm" dose → 23 grm applied dose.

Parameters are intentionally simple constants at the top of this file so they
can be updated quickly without touching any logic.
"""

# ── Threshold constants (edit these as agronomist guidance improves) ──────────
_N_LOW_THRESHOLD: float = 40.0       # kg/ha — below this, N is considered low
_N_LOW_BONUS: float = 0.10           # dosage factor increase for low N

_PH_LOWER_LIMIT: float = 6.0        # below this → soil too acidic
_PH_UPPER_LIMIT: float = 7.5        # above this → soil too alkaline
_PH_OUT_OF_RANGE_BONUS: float = 0.05  # dosage factor increase for off-range pH

_BASE_FACTOR: float = 1.0


def get_dosage_factor(ph: float, n: float, p: float, k: float) -> float:
    """
    Return a dosage scaling factor based on soil readings.

    Parameters
    ----------
    ph : float
        Soil pH (0–14 scale).
    n : float
        Nitrogen content (kg/ha).
    p : float
        Phosphorus content (kg/ha) — not used in current rules, reserved.
    k : float
        Potassium content (kg/ha) — not used in current rules, reserved.

    Returns
    -------
    float
        Rounded dosage factor (e.g. 1.0, 1.1, 1.15).
        Always >= 1.0 with these rules.
    """
    factor = _BASE_FACTOR

    if n < _N_LOW_THRESHOLD:
        factor += _N_LOW_BONUS

    if ph < _PH_LOWER_LIMIT or ph > _PH_UPPER_LIMIT:
        factor += _PH_OUT_OF_RANGE_BONUS

    return round(factor, 2)
