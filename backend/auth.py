"""
backend/auth.py
-----------
Simple API-key authentication using FastAPI's Depends mechanism.

Usage (in any route):
    from backend.auth import verify_api_key
    @app.post("/predict", dependencies=[Depends(verify_api_key)])

The caller must include the header:
    X-API-Key: <value of API_SECRET_KEY env var>

Returns HTTP 401 if the key is missing or does not match.

NOTE: This is a single shared secret — suitable for a backend-to-backend call
from the Django service.  Do NOT expose this key in the mobile app or browser.
"""

import os
from typing import Optional

from fastapi import Header, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

_SECRET_KEY: str | None = os.getenv("API_SECRET_KEY")


async def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> None:
    """
    FastAPI dependency — raises 401 if X-API-Key header is absent OR wrong.

    Both cases return 401 (not 422) so the Django backend only needs to handle
    one status code for all auth failures.

    Using Header(None) instead of Header(...) prevents FastAPI's validation layer
    from intercepting missing headers with a 422 before this function runs.
    """
    if not _SECRET_KEY:
        # Fail loudly during dev if the env var was never set on the server.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_SECRET_KEY environment variable is not configured on the server.",
        )
    if x_api_key is None or x_api_key != _SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
