from django.urls import path

from . import views

app_name = "seo"

urlpatterns = [
    path("", views.seo_dashboard, name="dashboard"),
    path("inspect/", views.seo_inspect_url, name="inspect-url"),
    path("api/", views.seo_api_data, name="api-data"),
]
