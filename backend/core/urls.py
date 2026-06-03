"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from blog.views import ai_generator_view, ai_generate_api, ai_posts_list_api, ai_post_load_api
from intake.payment_views import StripeWebhookView

urlpatterns = [
    path("summernote/", include("django_summernote.urls")),
    path("api/auth/", include("authentication.urls")),
    path("api/blog/", include("blog.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/intake/", include("intake.urls")),
    path("api/stripe/webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("staff/todos/", include("stafftodo.urls", namespace="stafftodo")),
    path("admin/ai-generator/", ai_generator_view, name='ai-generator'),
    path("admin/blog/ai-generate-api/", ai_generate_api, name='ai-generate-api'),
    path("admin/blog/ai-posts/", ai_posts_list_api, name='ai-posts-list'),
    path("admin/blog/ai-post/<int:post_id>/", ai_post_load_api, name='ai-post-load'),
    path("admin/", admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
