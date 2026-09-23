"""
Shared API response envelope.

Used by new endpoints that adopt the project-wide success/error contract:

    {"success": true, "data": {...}}
    {"success": false, "error": {"code": "...", "message": "..."}}

This is applied per-view (not via a global DRF exception handler), so it
does not change the response shape of existing endpoints — in particular
the `accounts` app's JWT/auth endpoints, which intentionally keep
simplejwt's/DRF's default response format.
"""

from rest_framework.response import Response


def success_response(data, status_code=200):
    return Response({"success": True, "data": data}, status=status_code)


def error_response(code, message, status_code=400, details=None):
    error = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return Response({"success": False, "error": error}, status=status_code)


def validation_error_response(serializer_errors, code="VALIDATION_ERROR", message="Validation failed.", status_code=400):
    """Convert DRF serializer.errors (or a plain dict of field errors) into the standard error envelope."""
    return error_response(code, message, status_code=status_code, details=serializer_errors)
