"""
backend/weather.py
--------------
Calls the OpenWeatherMap free forecast API to decide whether spraying should
be delayed due to upcoming rain.

Rule:
    If any 3-hour forecast slot within the next 24 hours has a rain probability
    (field: "pop") exceeding 60 %, return "delay_2_days".
    Otherwise return "proceed".

Requires env var:
    OPENWEATHER_API_KEY — get a free key at https://openweathermap.org/api

Graceful degradation:
    If the API call fails for any reason (network error, bad key, quota exceeded)
    the function logs a warning and defaults to "proceed" so that a weather API
    outage never blocks the entire /predict endpoint.
"""

import logging
import os
from typing import Literal

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_OWM_API_KEY: str | None = os.getenv("OPENWEATHER_API_KEY")
_OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

# How many 3-hour slots to look at: 24 h / 3 h = 8 slots
_SLOTS_24H = 8

# Rain probability threshold (0.0 – 1.0)
_RAIN_THRESHOLD = 0.60

TimingFlag = Literal["proceed", "delay_2_days"]


def get_timing_flag(lat: float, lng: float) -> TimingFlag:
    """
    Check the next 24-hour weather forecast for the given coordinates.

    Parameters
    ----------
    lat : float
        Farm latitude.
    lng : float
        Farm longitude.

    Returns
    -------
    "delay_2_days" if rain probability > 60 % in any slot within 24 h,
    "proceed" otherwise (including on API error).
    """
    if not _OWM_API_KEY:
        logger.warning(
            "OPENWEATHER_API_KEY is not set — defaulting timing flag to 'proceed'."
        )
        return "proceed"

    try:
        response = requests.get(
            _OWM_FORECAST_URL,
            params={
                "lat": lat,
                "lon": lng,
                "cnt": _SLOTS_24H,          # fetch only the slots we care about
                "appid": _OWM_API_KEY,
                "units": "metric",
            },
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()

        forecast_list = data.get("list", [])
        for slot in forecast_list:
            rain_prob: float = slot.get("pop", 0.0)  # "pop" = probability of precipitation
            if rain_prob > _RAIN_THRESHOLD:
                logger.info(
                    "Rain probability %.0f%% detected in next 24 h at (%.4f, %.4f) — "
                    "returning 'delay_2_days'.",
                    rain_prob * 100,
                    lat,
                    lng,
                )
                return "delay_2_days"

        return "proceed"

    except requests.RequestException as exc:
        logger.warning(
            "OpenWeatherMap API call failed (%s) — defaulting timing flag to 'proceed'.",
            exc,
        )
        return "proceed"
