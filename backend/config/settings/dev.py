"""Local development settings."""

from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Looser CORS in dev so React (localhost:3000) and Flutter web (varies) can
# hit the API without extra config. Tighten this in prod.py.
CORS_ALLOW_ALL_ORIGINS = True
