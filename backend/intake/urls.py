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
from .dashboard_views import (
    DashboardSummaryView,
    DocumentUploadAnalyzeView,
    MotionListView,
    MotionGenerateView,
    MotionUpdateView,
    ActionItemListView,
    ActionItemToggleView,
    AlertListView,
    AlertCreateView,
)

urlpatterns = [
    # ── Existing intake endpoints ─────────────────────────────────────────
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

    # ── User Dashboard endpoints ──────────────────────────────────────────
    path("dashboard/", DashboardSummaryView.as_view(), name="dashboard-summary"),

    # Document upload with immediate AI analysis
    path("<int:pk>/upload-analyze/", DocumentUploadAnalyzeView.as_view(), name="document-upload-analyze"),

    # Motions
    path("<int:pk>/motions/", MotionListView.as_view(), name="motion-list"),
    path("<int:pk>/motions/generate/", MotionGenerateView.as_view(), name="motion-generate"),
    path("<int:pk>/motions/<int:mid>/", MotionUpdateView.as_view(), name="motion-update"),

    # Action Items
    path("<int:pk>/actions/", ActionItemListView.as_view(), name="action-item-list"),
    path("<int:pk>/actions/<int:aid>/", ActionItemToggleView.as_view(), name="action-item-toggle"),

    # Alerts
    path("<int:pk>/alerts/", AlertListView.as_view(), name="alert-list"),
    path("<int:pk>/alerts/create/", AlertCreateView.as_view(), name="alert-create"),
]
