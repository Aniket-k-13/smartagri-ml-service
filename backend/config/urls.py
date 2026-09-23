"""
Root URL configuration for the SmartAgri Advisor backend.

All application traffic — from the React website, the Flutter app, and the
ML service — is routed here under /api/. Each SmartAgri module owns
its own url namespace so the API stays organized as the project grows.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    # API docs (drf-spectacular)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # SmartAgri Advisor modules
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/farmer/", include("apps.farmers.urls")),
    path("api/crops/", include("apps.crops.urls")),
    path("api/survey/", include("apps.surveys.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/admin/", include("apps.adminapi.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
