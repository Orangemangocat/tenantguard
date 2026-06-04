"""
TenantGuard User Space — Dashboard Serializers
===============================================
Serializers for the user dashboard API endpoints.
"""

from rest_framework import serializers

from .models_dashboard import (
    CaseActionItem,
    CaseAlert,
    CaseMotion,
    DocumentAnalysis,
)


class DocumentAnalysisSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(
        source="document.original_filename", read_only=True
    )
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = DocumentAnalysis
        fields = [
            "id",
            "document_name",
            "category",
            "category_display",
            "extracted_text",
            "summary",
            "key_dates",
            "legal_issues",
            "procedural_defects",
            "tenant_rights",
            "analyzed_at",
        ]
        read_only_fields = fields


class CaseMotionSerializer(serializers.ModelSerializer):
    motion_type_display = serializers.CharField(
        source="get_motion_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = CaseMotion
        fields = [
            "id",
            "motion_type",
            "motion_type_display",
            "title",
            "content",
            "instructions",
            "filing_deadline",
            "court_name",
            "filing_fee",
            "status",
            "status_display",
            "generated_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "motion_type_display",
            "status_display",
            "generated_at",
            "updated_at",
        ]


class CaseActionItemSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(
        source="get_priority_display", read_only=True
    )

    class Meta:
        model = CaseActionItem
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "priority_display",
            "due_date",
            "completed",
            "completed_at",
            "order",
            "created_at",
        ]
        read_only_fields = ["id", "priority_display", "completed_at", "created_at"]


class CaseAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(
        source="get_alert_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = CaseAlert
        fields = [
            "id",
            "alert_type",
            "alert_type_display",
            "delivery_method",
            "scheduled_for",
            "message",
            "status",
            "status_display",
            "is_overdue",
            "sent_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "alert_type_display",
            "status_display",
            "is_overdue",
            "sent_at",
            "created_at",
        ]


class DashboardSummarySerializer(serializers.Serializer):
    """Serializer for the dashboard summary response."""

    cases = serializers.IntegerField()
    active_cases = serializers.IntegerField()
    upcoming_deadlines = serializers.ListField()
    pending_alerts = serializers.IntegerField()
    recent_analyses = serializers.ListField()


class DocumentUploadAnalyzeSerializer(serializers.Serializer):
    """Serializer for document upload request validation."""

    file = serializers.FileField()
    doc_type = serializers.ChoiceField(
        choices=[
            ("lease", "Lease Agreement"),
            ("eviction_notice", "Eviction Notice"),
            ("correspondence", "Correspondence / Letters"),
            ("photo", "Photo / Visual Evidence"),
            ("court_filing", "Court Filing"),
            ("payment_record", "Payment Record"),
            ("other", "Other"),
        ],
        default="other",
    )
    received_date = serializers.DateField(required=False, allow_null=True)
    deadline_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
