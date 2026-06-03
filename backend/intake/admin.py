from django.contrib import admin
from .models import CaseNotebook, IntakeChatLog, IntakeDocument, IntakeSubmission, SMSSession


class IntakeDocumentInline(admin.TabularInline):
    model = IntakeDocument
    extra = 0
    readonly_fields = ["original_filename", "uploaded_at", "extracted_text"]


class CaseNotebookInline(admin.StackedInline):
    model = CaseNotebook
    extra = 0
    readonly_fields = [
        "summary", "facts", "timeline", "key_terms", "disputed_points",
        "open_questions", "urgent_deadlines", "recommended_next_steps",
        "created_at", "updated_at",
    ]
    can_delete = False


@admin.register(IntakeSubmission)
class IntakeSubmissionAdmin(admin.ModelAdmin):
    list_display = ["id", "full_name", "role", "issue_type", "urgency_level", "status", "created_at"]
    list_filter = ["role", "status", "issue_type", "county", "urgency_level", "government_assistance"]
    search_fields = ["first_name", "last_name", "email", "property_address", "landlord_name"]
    readonly_fields = ["status", "created_at", "updated_at"]
    inlines = [IntakeDocumentInline, CaseNotebookInline]

    fieldsets = [
        ("Status", {
            "fields": ["user", "role", "status"],
        }),
        ("Step 1 — Contact Information", {
            "fields": [
                "first_name", "last_name", "email", "phone", "preferred_contact",
                "street_address", "city", "state", "zip_code",
            ],
        }),
        ("Step 2 — Demographics & Eligibility", {
            "fields": [
                "age", "has_disability", "has_children_under_18",
                "household_income_range", "primary_language", "needs_interpreter",
            ],
            "classes": ["collapse"],
        }),
        ("Step 3 — Rental Property", {
            "fields": [
                "property_address", "county", "property_type", "bedrooms", "total_units",
                "monthly_rent", "tenant_rent_share", "move_in_date", "lease_type",
                "security_deposit_amount", "government_assistance",
            ],
            "classes": ["collapse"],
        }),
        ("Step 4 — Landlord Information", {
            "fields": [
                "landlord_name", "landlord_contact",
                "property_management_company", "landlord_address",
            ],
            "classes": ["collapse"],
        }),
        ("Step 5 — Dispute Details", {
            "fields": [
                "issue_type", "issue_description",
                "eviction_notice_type", "eviction_reason", "amount_owed",
            ],
            "classes": ["collapse"],
        }),
        ("Step 6 — Timeline & Urgency", {
            "fields": [
                "problem_start_date", "notice_date", "court_date",
                "response_deadline", "urgency_level",
            ],
            "classes": ["collapse"],
        }),
        ("Step 8 — Case Summary & Goals", {
            "fields": [
                "desired_outcome", "previous_resolution_attempts", "other_parties_involved",
            ],
            "classes": ["collapse"],
        }),
        ("Step 9 — Legal Representation", {
            "fields": [
                "interested_in_self_rep", "interested_in_attorney",
                "legal_budget", "previous_legal_assistance",
            ],
            "classes": ["collapse"],
        }),
        ("Step 10 — Consent", {
            "fields": [
                "consent_privacy_policy", "consent_terms",
                "consent_attorney_matching", "preferred_contact_times",
            ],
            "classes": ["collapse"],
        }),
        ("Attorney Fields", {
            "fields": ["bar_number", "firm_name", "case_description"],
            "classes": ["collapse"],
        }),
        ("Timestamps", {
            "fields": ["created_at", "updated_at"],
            "classes": ["collapse"],
        }),
    ]


@admin.register(IntakeDocument)
class IntakeDocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "submission", "doc_type", "original_filename", "uploaded_at"]
    list_filter = ["doc_type"]
    search_fields = ["original_filename", "submission__first_name", "submission__last_name"]


@admin.register(IntakeChatLog)
class IntakeChatLogAdmin(admin.ModelAdmin):
    list_display = ["id", "submission", "role", "source", "created_at", "content_preview"]
    list_filter = ["role", "source", "created_at"]
    search_fields = ["content", "submission__first_name", "submission__last_name", "submission__phone"]
    readonly_fields = ["submission", "role", "content", "source", "created_at"]
    ordering = ["-created_at"]

    def content_preview(self, obj):
        return obj.content[:80] + "…" if len(obj.content) > 80 else obj.content
    content_preview.short_description = "Message"

    def has_add_permission(self, request):
        return False  # Logs are system-generated only

    def has_change_permission(self, request, obj=None):
        return False  # Immutable audit log


@admin.register(SMSSession)
class SMSSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "phone", "submission", "created_at", "updated_at"]
    search_fields = ["phone"]
    readonly_fields = ["phone", "created_at", "updated_at"]
