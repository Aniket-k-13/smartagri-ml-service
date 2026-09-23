"""
Mixins for DRF generic views/viewsets that need the project's
success/error envelope plus pagination/filtering "for free" from DRF.

Scoped opt-in via mixin (not a global exception handler), so it never
touches the already-verified accounts/crops/farmer/survey APIs.
"""

from django.db.models import ProtectedError
from rest_framework.response import Response


class EnvelopeMixin:
    """Wraps any DRF response (paginated or not) as {"success": true, "data": ...}
    on 2xx, and {"success": false, "error": {...}} on 4xx/5xx."""

    def finalize_response(self, request, response, *args, **kwargs):
        if isinstance(response.data, dict) and "success" in response.data:
            return super().finalize_response(request, response, *args, **kwargs)

        if response.status_code < 400:
            response.data = {"success": True, "data": response.data}
        else:
            detail = response.data
            message = "Request failed."
            if isinstance(detail, dict) and "detail" in detail:
                message = str(detail["detail"])
            elif isinstance(detail, dict):
                message = "Validation failed."
            code = "VALIDATION_ERROR" if response.status_code == 400 else "ERROR"
            response.data = {"success": False, "error": {"code": code, "message": message, "details": detail}}
        return super().finalize_response(request, response, *args, **kwargs)


class ProtectedDestroyMixin:
    """Turns Django's ProtectedError (from an on_delete=PROTECT relation) into
    a clean 409 envelope response instead of an unhandled 500."""

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "DELETE_BLOCKED_BY_RELATIONS",
                        "message": "This record cannot be deleted because other records still reference it.",
                    },
                },
                status=409,
            )
        return Response(status=204)
