"""Production settings."""

from decouple import config

from .base import *  # noqa: F401,F403

DEBUG = False

# In production DJANGO_ALLOWED_HOSTS and CORS_ALLOWED_ORIGINS must be set
# explicitly via environment variables (see base.py) — no wildcards.

SECURE_SSL_REDIRECT = config("DJANGO_SECURE_SSL_REDIRECT", default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
