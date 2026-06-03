from django.urls import path
from .views import (
    IntakeSubmissionCreateView,
    IntakeSubmissionDetailView,
    IntakeSubmissionListView,
    IntakeDocumentUploadView,
    IntakeAnalyzeView,
)
from .chat_views import IntakeChatView, IntakeChatHistoryView
from .sms_views import TwilioSMSWebhookView
from .payment_views import CreateCheckoutSessionView, IntakePriceView

urlpatterns = [
    path("", IntakeSubmissionListView.as_view(), name="intake-list"),
    path("submit/", IntakeSubmissionCreateView.as_view(), name="intake-submit"),
    path("chat/", IntakeChatView.as_view(), name="intake-chat"),
    path("chat/history/", IntakeChatHistoryView.as_view(), name="intake-chat-history"),
    path("sms/", TwilioSMSWebhookView.as_view(), name="intake-sms"),
    path("price/", IntakePriceView.as_view(), name="intake-price"),
    path("<int:pk>/", IntakeSubmissionDetailView.as_view(), name="intake-detail"),
    path("<int:pk>/documents/", IntakeDocumentUploadView.as_view(), name="intake-documents"),
    path("<int:pk>/analyze/", IntakeAnalyzeView.as_view(), name="intake-analyze"),
    path("<int:pk>/checkout/", CreateCheckoutSessionView.as_view(), name="intake-checkout"),
]
