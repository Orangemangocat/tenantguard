from django.db import models
from django.contrib.auth.models import User


class IntakeSubmission(models.Model):
    ROLE_CHOICES = [
        ("tenant", "Tenant"),
        ("attorney", "Attorney"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("pending", "Pending Review"),
        ("analyzing", "Analyzing"),
        ("complete", "Complete"),
        ("error", "Error"),
    ]
    ISSUE_CHOICES = [
        ("eviction", "Eviction Notice Received"),
        ("rent_increase", "Rent Increase Dispute"),
        ("habitability", "Habitability Issues (Repairs, Mold, Pests)"),
        ("security_deposit", "Security Deposit Issues"),
        ("lease_violation", "Lease Violations"),
        ("harassment", "Harassment / Discrimination"),
        ("utility", "Utility Issues"),
        ("entry_privacy", "Entry / Privacy Violations"),
        ("other", "Other Housing Issues"),
    ]
    COUNTY_CHOICES = [
        ("davidson", "Davidson County"),
        ("shelby", "Shelby County"),
        ("knox", "Knox County"),
        ("hamilton", "Hamilton County"),
        ("rutherford", "Rutherford County"),
        ("williamson", "Williamson County"),
        ("montgomery", "Montgomery County"),
        ("other", "Other Tennessee County"),
    ]
    CONTACT_METHOD_CHOICES = [
        ("email", "Email"),
        ("phone", "Phone Call"),
        ("text", "Text / SMS"),
    ]
    INCOME_RANGE_CHOICES = [
        ("under_20k", "Under $20,000"),
        ("20k_40k", "$20,000 – $40,000"),
        ("40k_60k", "$40,000 – $60,000"),
        ("60k_80k", "$60,000 – $80,000"),
        ("over_80k", "Over $80,000"),
        ("prefer_not", "Prefer not to say"),
    ]
    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("house", "House"),
        ("condo", "Condo / Townhouse"),
        ("room", "Room / Shared Housing"),
        ("mobile_home", "Mobile Home"),
        ("other", "Other"),
    ]
    LEASE_TYPE_CHOICES = [
        ("written", "Written Lease"),
        ("oral", "Oral Agreement"),
        ("month_to_month", "Month-to-Month"),
        ("unknown", "Unknown / Not Sure"),
    ]
    URGENCY_CHOICES = [
        ("immediate", "Immediate (court date within 7 days)"),
        ("within_days", "Within a Few Days"),
        ("within_weeks", "Within a Few Weeks"),
        ("not_urgent", "Not Urgent"),
    ]
    EVICTION_NOTICE_CHOICES = [
        ("pay_or_quit", "Pay or Quit"),
        ("cure_or_quit", "Cure or Quit (Lease Violation)"),
        ("unconditional_quit", "Unconditional Quit"),
        ("termination", "Termination of Tenancy"),
        ("unknown", "Unknown / Not Sure"),
    ]
    LEGAL_BUDGET_CHOICES = [
        ("none", "Cannot afford any fees"),
        ("limited", "Limited budget (up to $500)"),
        ("moderate", "Moderate budget ($500–$2,000)"),
        ("flexible", "Flexible / Open to discussion"),
    ]
    ASSISTANCE_CHOICES = [
        ("none", "None"),
        ("section_8", "Section 8 / Housing Choice Voucher"),
        ("public_housing", "Public Housing"),
        ("other_subsidy", "Other Government Subsidy"),
    ]

    # ── Core ──────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="intake_submissions"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # ── Step 1: Contact Information ────────────────────────────────────────
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    preferred_contact = models.CharField(
        max_length=10, choices=CONTACT_METHOD_CHOICES, blank=True
    )
    street_address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, default="Tennessee")
    zip_code = models.CharField(max_length=10, blank=True)

    # ── Step 2: Demographics & Eligibility ────────────────────────────────
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    has_disability = models.BooleanField(null=True, blank=True)
    has_children_under_18 = models.BooleanField(null=True, blank=True)
    household_income_range = models.CharField(
        max_length=20, choices=INCOME_RANGE_CHOICES, blank=True
    )
    primary_language = models.CharField(max_length=100, blank=True, default="English")
    needs_interpreter = models.BooleanField(default=False)

    # ── Step 3: Rental Property Information ───────────────────────────────
    property_address = models.TextField(blank=True)
    county = models.CharField(max_length=50, choices=COUNTY_CHOICES, blank=True)
    property_type = models.CharField(
        max_length=20, choices=PROPERTY_TYPE_CHOICES, blank=True
    )
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    total_units = models.PositiveSmallIntegerField(null=True, blank=True)
    monthly_rent = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    tenant_rent_share = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    move_in_date = models.DateField(null=True, blank=True)
    lease_type = models.CharField(max_length=20, choices=LEASE_TYPE_CHOICES, blank=True)
    security_deposit_amount = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    government_assistance = models.CharField(
        max_length=20, choices=ASSISTANCE_CHOICES, blank=True
    )

    # ── Step 4: Landlord Information ──────────────────────────────────────
    landlord_name = models.CharField(max_length=255, blank=True)
    landlord_contact = models.CharField(max_length=255, blank=True)
    property_management_company = models.CharField(max_length=255, blank=True)
    landlord_address = models.TextField(blank=True)

    # ── Step 5: Dispute Type & Details ────────────────────────────────────
    issue_type = models.CharField(max_length=50, choices=ISSUE_CHOICES, blank=True)
    issue_description = models.TextField(blank=True)
    eviction_notice_type = models.CharField(
        max_length=30, choices=EVICTION_NOTICE_CHOICES, blank=True
    )
    eviction_reason = models.TextField(blank=True)
    amount_owed = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )

    # ── Step 6: Timeline & Urgency ────────────────────────────────────────
    notice_date = models.DateField(null=True, blank=True)
    problem_start_date = models.DateField(null=True, blank=True)
    court_date = models.DateField(null=True, blank=True)
    response_deadline = models.DateField(null=True, blank=True)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, blank=True)

    # ── Step 8: Case Summary & Goals ──────────────────────────────────────
    desired_outcome = models.TextField(blank=True)
    previous_resolution_attempts = models.TextField(blank=True)
    other_parties_involved = models.TextField(blank=True)

    # ── Step 9: Legal Representation Preferences ──────────────────────────
    interested_in_self_rep = models.BooleanField(null=True, blank=True)
    interested_in_attorney = models.BooleanField(null=True, blank=True)
    legal_budget = models.CharField(max_length=20, choices=LEGAL_BUDGET_CHOICES, blank=True)
    previous_legal_assistance = models.TextField(blank=True)

    # ── Step 10: Consent ──────────────────────────────────────────────────
    consent_privacy_policy = models.BooleanField(default=False)
    consent_terms = models.BooleanField(default=False)
    consent_attorney_matching = models.BooleanField(default=False)
    preferred_contact_times = models.CharField(max_length=255, blank=True)

    # ── Attorney-specific ─────────────────────────────────────────────────
    bar_number = models.CharField(max_length=50, blank=True)
    firm_name = models.CharField(max_length=255, blank=True)
    case_description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Payment ───────────────────────────────────────────────────────────
    PAYMENT_STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
        ("waived", "Waived"),
    ]
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default="unpaid"
    )
    stripe_session_id = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.get_role_display()} intake — {self.full_name} ({self.created_at.date()})"


class IntakeDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ("lease", "Lease Agreement"),
        ("eviction_notice", "Eviction Notice"),
        ("correspondence", "Correspondence / Letters"),
        ("photo", "Photo / Visual Evidence"),
        ("court_filing", "Court Filing"),
        ("payment_record", "Payment Record"),
        ("other", "Other"),
    ]

    submission = models.ForeignKey(
        IntakeSubmission, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to="intake/documents/")
    original_filename = models.CharField(max_length=255)
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.original_filename}"


class CaseNotebook(models.Model):
    submission = models.OneToOneField(
        IntakeSubmission, on_delete=models.CASCADE, related_name="notebook"
    )
    summary = models.TextField(blank=True)
    facts = models.JSONField(default=list)
    timeline = models.JSONField(default=list)
    key_terms = models.JSONField(default=list)
    disputed_points = models.JSONField(default=list)
    open_questions = models.JSONField(default=list)
    urgent_deadlines = models.JSONField(default=list)
    recommended_next_steps = models.JSONField(default=list)
    raw_output = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notebook for {self.submission}"


class IntakeChatLog(models.Model):
    """Permanent, server-side record of every message in every intake conversation."""

    SOURCE_WEB = "web"
    SOURCE_SMS = "sms"
    SOURCE_CHOICES = [("web", "Web Chat"), ("sms", "SMS / Text")]

    ROLE_USER = "user"
    ROLE_ASSISTANT = "assistant"
    ROLE_CHOICES = [("user", "User"), ("assistant", "Assistant")]

    submission = models.ForeignKey(
        IntakeSubmission, on_delete=models.CASCADE, related_name="chat_logs"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default=SOURCE_WEB)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.source.upper()}] {self.role} — {self.content[:60]}"


class SMSSession(models.Model):
    """Maps an inbound phone number to an active intake submission."""

    phone = models.CharField(max_length=20, unique=True, db_index=True)
    submission = models.OneToOneField(
        IntakeSubmission, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="sms_session"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SMS {self.phone} → submission #{self.submission_id}"
