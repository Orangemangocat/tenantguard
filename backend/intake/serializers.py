from rest_framework import serializers
from .models import CaseNotebook, IntakeDocument, IntakeSubmission


class IntakeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeDocument
        fields = ["id", "doc_type", "file", "original_filename", "uploaded_at"]
        read_only_fields = ["original_filename", "uploaded_at"]

    def create(self, validated_data):
        file = validated_data.get("file")
        if file:
            validated_data["original_filename"] = file.name
        return super().create(validated_data)


class CaseNotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseNotebook
        fields = [
            "id",
            "summary",
            "facts",
            "timeline",
            "key_terms",
            "disputed_points",
            "open_questions",
            "urgent_deadlines",
            "recommended_next_steps",
            "created_at",
            "updated_at",
        ]


class IntakeSubmissionSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = IntakeSubmission
        fields = [
            "id",
            "role",
            "status",
            # Step 1 — Contact
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "preferred_contact",
            "street_address",
            "city",
            "state",
            "zip_code",
            # Step 2 — Demographics
            "age",
            "has_disability",
            "has_children_under_18",
            "household_income_range",
            "primary_language",
            "needs_interpreter",
            # Step 3 — Rental property
            "property_address",
            "county",
            "property_type",
            "bedrooms",
            "total_units",
            "monthly_rent",
            "tenant_rent_share",
            "move_in_date",
            "lease_type",
            "security_deposit_amount",
            "government_assistance",
            # Step 4 — Landlord
            "landlord_name",
            "landlord_contact",
            "property_management_company",
            "landlord_address",
            # Step 5 — Dispute
            "issue_type",
            "issue_description",
            "eviction_notice_type",
            "eviction_reason",
            "amount_owed",
            # Step 6 — Timeline & urgency
            "notice_date",
            "problem_start_date",
            "court_date",
            "response_deadline",
            "urgency_level",
            # Step 8 — Goals
            "desired_outcome",
            "previous_resolution_attempts",
            "other_parties_involved",
            # Step 9 — Legal rep
            "interested_in_self_rep",
            "interested_in_attorney",
            "legal_budget",
            "previous_legal_assistance",
            # Step 10 — Consent
            "consent_privacy_policy",
            "consent_terms",
            "consent_attorney_matching",
            "preferred_contact_times",
            # Attorney-specific
            "bar_number",
            "firm_name",
            "case_description",
            # Payment
            "payment_status",
            "created_at",
        ]
        read_only_fields = ["status", "payment_status", "full_name", "created_at"]


class IntakeSubmissionDetailSerializer(IntakeSubmissionSerializer):
    documents = IntakeDocumentSerializer(many=True, read_only=True)
    notebook = CaseNotebookSerializer(read_only=True)

    class Meta(IntakeSubmissionSerializer.Meta):
        fields = IntakeSubmissionSerializer.Meta.fields + ["documents", "notebook"]
