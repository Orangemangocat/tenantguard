"""
TenantGuard User Space — Dashboard API Views
=============================================
API endpoints for the user dashboard, document upload with analysis,
motion generation, and action item management.
"""

import json
import os
from datetime import date, timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IntakeDocument, IntakeSubmission
from .models_dashboard import (
    CaseActionItem,
    CaseAlert,
    CaseMotion,
    DocumentAnalysis,
)
from .dashboard_serializers import (
    CaseActionItemSerializer,
    CaseAlertSerializer,
    CaseMotionSerializer,
    DashboardSummarySerializer,
    DocumentAnalysisSerializer,
    DocumentUploadAnalyzeSerializer,
)


# ---------------------------------------------------------------------------
# Dashboard Summary
# ---------------------------------------------------------------------------


class DashboardSummaryView(APIView):
    """
    GET /api/intake/dashboard/
    Returns a summary of all the user's cases, upcoming deadlines, and alerts.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        submissions = IntakeSubmission.objects.filter(user=request.user)

        # Upcoming deadlines (court dates and response deadlines within 30 days)
        today = date.today()
        thirty_days = today + timedelta(days=30)

        upcoming_deadlines = []
        for sub in submissions:
            if sub.court_date and today <= sub.court_date <= thirty_days:
                upcoming_deadlines.append(
                    {
                        "case_id": sub.id,
                        "case_name": sub.full_name or f"Case #{sub.id}",
                        "type": "court_date",
                        "date": sub.court_date.isoformat(),
                        "days_remaining": (sub.court_date - today).days,
                        "label": "Court Hearing",
                    }
                )
            if sub.response_deadline and today <= sub.response_deadline <= thirty_days:
                upcoming_deadlines.append(
                    {
                        "case_id": sub.id,
                        "case_name": sub.full_name or f"Case #{sub.id}",
                        "type": "response_deadline",
                        "date": sub.response_deadline.isoformat(),
                        "days_remaining": (sub.response_deadline - today).days,
                        "label": "Response Due",
                    }
                )

        # Sort by date
        upcoming_deadlines.sort(key=lambda x: x["date"])

        # Pending alerts
        pending_alerts = CaseAlert.objects.filter(
            submission__user=request.user, status="pending"
        ).count()

        # Recent activity
        recent_analyses = DocumentAnalysis.objects.filter(
            document__submission__user=request.user
        ).order_by("-analyzed_at")[:5]

        data = {
            "cases": submissions.count(),
            "active_cases": submissions.exclude(status="complete").count(),
            "upcoming_deadlines": upcoming_deadlines,
            "pending_alerts": pending_alerts,
            "recent_analyses": [
                {
                    "id": a.id,
                    "document_name": a.document.original_filename,
                    "category": a.get_category_display(),
                    "summary": a.summary[:150] if a.summary else "",
                    "analyzed_at": a.analyzed_at.isoformat(),
                }
                for a in recent_analyses
            ],
        }
        return Response(data)


# ---------------------------------------------------------------------------
# Document Upload + Immediate AI Analysis
# ---------------------------------------------------------------------------


class DocumentUploadAnalyzeView(APIView):
    """
    POST /api/intake/{id}/upload-analyze/
    Upload a document and immediately trigger AI analysis.
    Returns the analysis results.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        submission = get_object_or_404(
            IntakeSubmission, pk=pk, user=request.user
        )

        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc_type = request.data.get("doc_type", "other")
        received_date = request.data.get("received_date")
        deadline_date = request.data.get("deadline_date")
        notes = request.data.get("notes", "")

        # Save the document
        document = IntakeDocument.objects.create(
            submission=submission,
            doc_type=doc_type,
            file=file,
            original_filename=file.name,
        )

        # Run AI analysis
        try:
            analysis = self._analyze_document(
                document, received_date, deadline_date, notes
            )

            # Auto-generate action items from the analysis
            self._generate_action_items(submission, analysis)

            # Auto-schedule alerts for deadlines found
            self._schedule_alerts(submission, analysis)

            return Response(
                {
                    "document": {
                        "id": document.id,
                        "doc_type": document.doc_type,
                        "original_filename": document.original_filename,
                        "uploaded_at": document.uploaded_at.isoformat()
                        if document.uploaded_at
                        else None,
                    },
                    "analysis": DocumentAnalysisSerializer(analysis).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Document saved but analysis failed: {str(e)}"},
                status=status.HTTP_207_MULTI_STATUS,
            )

    def _analyze_document(self, document, received_date, deadline_date, notes):
        """Run GPT-4o analysis on the uploaded document."""
        import openai

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        # Build the analysis prompt
        context_parts = []
        if received_date:
            context_parts.append(f"Document received on: {received_date}")
        if deadline_date:
            context_parts.append(f"Tenant reports a deadline of: {deadline_date}")
        if notes:
            context_parts.append(f"Tenant's notes: {notes}")

        context_str = "\n".join(context_parts) if context_parts else "No additional context provided."

        # Determine if we should use vision (image) or text extraction
        file_ext = document.original_filename.lower().split(".")[-1] if "." in document.original_filename else ""
        is_image = file_ext in ("jpg", "jpeg", "png", "heic", "webp", "gif", "bmp")

        system_prompt = """You are a Tennessee tenant rights legal analyst. Analyze the uploaded document and provide a comprehensive analysis in JSON format.

You MUST respond with valid JSON only (no markdown, no code fences). Use this exact structure:
{
    "category": "eviction_notice|court_summons|lease_agreement|correspondence|payment_record|photo_evidence|court_order|other",
    "extracted_text": "Full text extracted from the document",
    "summary": "Plain-English 2-3 sentence summary of what this document means for the tenant",
    "key_dates": [
        {"label": "Description of date", "date": "YYYY-MM-DD", "is_deadline": true/false}
    ],
    "legal_issues": [
        {"issue": "Brief title", "severity": "critical|high|medium|low", "explanation": "What this means"}
    ],
    "procedural_defects": [
        {"defect": "Brief title", "explanation": "Why this might be a defect", "actionable": true/false}
    ],
    "tenant_rights": [
        {"right": "Brief title", "statute": "TN Code citation", "explanation": "How this applies"}
    ]
}

TENNESSEE-SPECIFIC KNOWLEDGE:
- TN Code § 66-28-505: 14-day notice required for nonpayment of rent
- TN Code § 66-28-508: 14-day notice for material noncompliance
- TN Code § 66-28-512: Landlord must follow proper eviction procedures through court
- TN Code § 66-28-517: Tenant has right to cure certain violations
- Self-help evictions (lockouts, utility shutoffs) are ILLEGAL in Tennessee
- Detainer warrants must be properly served
- Tenant has right to a hearing before eviction
- Retaliatory evictions within 1 year of complaint are prohibited (§ 66-28-514)

Look for:
1. Whether proper notice periods were given
2. Whether the notice was properly served
3. Whether there are any procedural defects that could invalidate the action
4. What deadlines the tenant faces
5. What rights the tenant can assert"""

        # Build messages based on file type
        if is_image:
            # Use GPT-4o vision for images
            import base64

            file_path = document.file.path if hasattr(document.file, "path") else None
            if file_path and os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    image_data = base64.b64encode(f.read()).decode("utf-8")
                mime_type = f"image/{file_ext}" if file_ext != "jpg" else "image/jpeg"
                messages = [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"Analyze this document image. Additional context:\n{context_str}",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}"
                                },
                            },
                        ],
                    },
                ]
            else:
                # File not accessible locally, use text-only analysis
                messages = [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"The document is an image file ({document.original_filename}) but cannot be read directly. Based on the context provided, generate a preliminary analysis.\n\nContext:\n{context_str}",
                    },
                ]
        else:
            # For PDFs and text files, extract text first
            extracted = ""
            file_path = document.file.path if hasattr(document.file, "path") else None
            if file_path and os.path.exists(file_path):
                if file_ext == "pdf":
                    try:
                        import subprocess

                        result = subprocess.run(
                            ["pdftotext", file_path, "-"],
                            capture_output=True,
                            text=True,
                            timeout=30,
                        )
                        extracted = result.stdout
                    except Exception:
                        extracted = "[PDF text extraction failed]"
                else:
                    try:
                        with open(file_path, "r", errors="ignore") as f:
                            extracted = f.read()[:10000]
                    except Exception:
                        extracted = "[Text extraction failed]"

            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Analyze this document:\n\n---\n{extracted}\n---\n\nAdditional context:\n{context_str}",
                },
            ]

        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        result = json.loads(result_text)

        # Save analysis
        analysis = DocumentAnalysis.objects.create(
            document=document,
            category=result.get("category", "other"),
            extracted_text=result.get("extracted_text", ""),
            summary=result.get("summary", ""),
            key_dates=result.get("key_dates", []),
            legal_issues=result.get("legal_issues", []),
            procedural_defects=result.get("procedural_defects", []),
            tenant_rights=result.get("tenant_rights", []),
            raw_analysis=result,
        )

        # Update the document's extracted_text field
        if result.get("extracted_text"):
            document.extracted_text = result["extracted_text"]
            document.save(update_fields=["extracted_text"])

        # Auto-detect and update document type if AI found a better classification
        ai_category = result.get("category", "")
        category_to_doc_type = {
            "eviction_notice": "eviction_notice",
            "court_summons": "court_filing",
            "lease_agreement": "lease",
            "correspondence": "correspondence",
            "payment_record": "payment_record",
            "photo_evidence": "photo",
            "court_order": "court_filing",
        }
        if ai_category in category_to_doc_type and document.doc_type == "other":
            document.doc_type = category_to_doc_type[ai_category]
            document.save(update_fields=["doc_type"])

        return analysis

    def _generate_action_items(self, submission, analysis):
        """Generate action items based on the document analysis."""
        today = date.today()

        # Generate action items from key dates
        for date_info in analysis.key_dates:
            if date_info.get("is_deadline"):
                try:
                    deadline = date.fromisoformat(date_info["date"])
                    if deadline >= today:
                        days_until = (deadline - today).days
                        priority = "critical" if days_until <= 3 else "high" if days_until <= 7 else "medium"

                        CaseActionItem.objects.get_or_create(
                            submission=submission,
                            title=f"Respond by {date_info['label']}",
                            defaults={
                                "description": f"Deadline: {date_info['date']}. You have {days_until} days to respond.",
                                "priority": priority,
                                "due_date": deadline,
                            },
                        )
                except (ValueError, KeyError):
                    pass

        # Generate action items from legal issues
        for issue in analysis.legal_issues:
            if issue.get("severity") in ("critical", "high"):
                CaseActionItem.objects.get_or_create(
                    submission=submission,
                    title=f"Address: {issue['issue']}",
                    defaults={
                        "description": issue.get("explanation", ""),
                        "priority": "high" if issue["severity"] == "critical" else "medium",
                    },
                )

        # Generate action items from procedural defects
        for defect in analysis.procedural_defects:
            if defect.get("actionable"):
                CaseActionItem.objects.get_or_create(
                    submission=submission,
                    title=f"Challenge: {defect['defect']}",
                    defaults={
                        "description": defect.get("explanation", ""),
                        "priority": "high",
                    },
                )

    def _schedule_alerts(self, submission, analysis):
        """Auto-schedule alerts for deadlines found in the analysis."""
        today = date.today()

        for date_info in analysis.key_dates:
            if date_info.get("is_deadline"):
                try:
                    deadline = date.fromisoformat(date_info["date"])
                    if deadline > today:
                        # Schedule reminders: 7 days, 3 days, 1 day before
                        for days_before in [7, 3, 1]:
                            alert_date = deadline - timedelta(days=days_before)
                            if alert_date > today:
                                CaseAlert.objects.get_or_create(
                                    submission=submission,
                                    alert_type="filing_deadline",
                                    scheduled_for=timezone.make_aware(
                                        timezone.datetime.combine(
                                            alert_date,
                                            timezone.datetime.min.time().replace(hour=9),
                                        )
                                    ),
                                    defaults={
                                        "message": f"Reminder: {date_info['label']} is in {days_before} day(s) ({deadline.isoformat()}). Make sure you're prepared.",
                                        "delivery_method": "both",
                                    },
                                )
                except (ValueError, KeyError):
                    pass


# ---------------------------------------------------------------------------
# Motion Management
# ---------------------------------------------------------------------------


class MotionListView(generics.ListAPIView):
    """GET /api/intake/{id}/motions/ — list all motions for a case."""

    serializer_class = CaseMotionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CaseMotion.objects.filter(
            submission_id=self.kwargs["pk"],
            submission__user=self.request.user,
        )


class MotionGenerateView(APIView):
    """
    POST /api/intake/{id}/motions/generate/
    Generate a motion based on the case analysis.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        submission = get_object_or_404(
            IntakeSubmission, pk=pk, user=request.user
        )

        motion_type = request.data.get("motion_type", "answer")

        # Gather case context
        documents = submission.documents.all()
        analyses = DocumentAnalysis.objects.filter(document__in=documents)
        notebook = getattr(submission, "notebook", None)

        case_context = self._build_case_context(submission, analyses, notebook)

        try:
            motion_data = self._generate_motion(motion_type, case_context, submission)

            motion = CaseMotion.objects.create(
                submission=submission,
                motion_type=motion_type,
                title=motion_data.get("title", f"Motion — {motion_type}"),
                content=motion_data.get("content", ""),
                instructions=motion_data.get("instructions", ""),
                filing_deadline=motion_data.get("filing_deadline"),
                court_name=motion_data.get("court_name", ""),
                filing_fee=motion_data.get("filing_fee", ""),
                status="draft",
            )

            return Response(
                CaseMotionSerializer(motion).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Motion generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _build_case_context(self, submission, analyses, notebook):
        """Build a comprehensive case context string for the AI."""
        parts = []

        parts.append(f"Tenant: {submission.full_name}")
        if submission.county:
            parts.append(f"County: {submission.get_county_display()}")
        if submission.issue_type:
            parts.append(f"Issue: {submission.get_issue_type_display()}")
        if submission.issue_description:
            parts.append(f"Description: {submission.issue_description}")
        if submission.eviction_notice_type:
            parts.append(f"Notice type: {submission.get_eviction_notice_type_display()}")
        if submission.court_date:
            parts.append(f"Court date: {submission.court_date}")
        if submission.landlord_name:
            parts.append(f"Landlord: {submission.landlord_name}")
        if submission.property_address:
            parts.append(f"Property: {submission.property_address}")
        if submission.monthly_rent:
            parts.append(f"Monthly rent: ${submission.monthly_rent}")
        if submission.amount_owed:
            parts.append(f"Amount allegedly owed: ${submission.amount_owed}")

        if notebook:
            if notebook.summary:
                parts.append(f"\nCase Summary:\n{notebook.summary}")
            if notebook.facts:
                parts.append(f"\nKey Facts: {json.dumps(notebook.facts)}")

        for analysis in analyses:
            if analysis.summary:
                parts.append(f"\nDocument ({analysis.get_category_display()}): {analysis.summary}")
            if analysis.procedural_defects:
                parts.append(f"Procedural defects found: {json.dumps(analysis.procedural_defects)}")

        return "\n".join(parts)

    def _generate_motion(self, motion_type, case_context, submission):
        """Generate a motion using GPT-4o."""
        import openai

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        motion_descriptions = {
            "answer": "an Answer to the Complaint / Detainer Warrant",
            "continuance": "a Motion for Continuance (requesting more time)",
            "dismiss": "a Motion to Dismiss (based on procedural defects)",
            "discovery": "a Discovery Request",
            "stay": "a Motion to Stay Execution of Judgment",
            "repair_escrow": "a Rent Escrow petition for uninhabitable conditions",
            "fee_waiver": "an Application for Fee Waiver (in forma pauperis)",
        }

        motion_desc = motion_descriptions.get(motion_type, f"a {motion_type} motion")

        system_prompt = f"""You are a Tennessee legal document drafting assistant. Generate {motion_desc} for a pro se (self-represented) tenant.

IMPORTANT RULES:
- Use plain English that a non-lawyer can understand
- Include all required legal formatting for Tennessee General Sessions Court
- Include proper caption (court name, case number placeholder, parties)
- Include certificate of service
- Use Tennessee-specific legal citations where applicable
- Add clear instructions for the tenant on how to file

Respond with valid JSON only:
{{
    "title": "Full title of the motion",
    "content": "The complete motion text in Markdown format, ready to print",
    "instructions": "Step-by-step filing instructions for the tenant",
    "filing_deadline": "YYYY-MM-DD or null if no specific deadline",
    "court_name": "Name of the court to file with",
    "filing_fee": "Expected fee amount or 'Fee waiver available'"
}}"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate the motion based on this case:\n\n{case_context}"},
            ],
            temperature=0.3,
            max_tokens=6000,
            response_format={"type": "json_object"},
        )

        return json.loads(response.choices[0].message.content)


class MotionUpdateView(APIView):
    """PATCH /api/intake/{id}/motions/{mid}/ — update motion status."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, mid):
        motion = get_object_or_404(
            CaseMotion,
            pk=mid,
            submission_id=pk,
            submission__user=request.user,
        )

        allowed_fields = ["status", "content", "instructions"]
        for field in allowed_fields:
            if field in request.data:
                setattr(motion, field, request.data[field])

        motion.save()
        return Response(CaseMotionSerializer(motion).data)


# ---------------------------------------------------------------------------
# Action Items
# ---------------------------------------------------------------------------


class ActionItemListView(generics.ListAPIView):
    """GET /api/intake/{id}/actions/ — list action items for a case."""

    serializer_class = CaseActionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CaseActionItem.objects.filter(
            submission_id=self.kwargs["pk"],
            submission__user=self.request.user,
        )


class ActionItemToggleView(APIView):
    """PATCH /api/intake/{id}/actions/{aid}/ — toggle action item completion."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, aid):
        item = get_object_or_404(
            CaseActionItem,
            pk=aid,
            submission_id=pk,
            submission__user=request.user,
        )

        if "completed" in request.data:
            if request.data["completed"]:
                item.mark_complete()
            else:
                item.mark_incomplete()

        return Response(CaseActionItemSerializer(item).data)


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------


class AlertListView(generics.ListAPIView):
    """GET /api/intake/{id}/alerts/ — list alerts for a case."""

    serializer_class = CaseAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CaseAlert.objects.filter(
            submission_id=self.kwargs["pk"],
            submission__user=self.request.user,
        )


class AlertCreateView(APIView):
    """POST /api/intake/{id}/alerts/ — create a custom alert."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        submission = get_object_or_404(
            IntakeSubmission, pk=pk, user=request.user
        )

        serializer = CaseAlertSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(submission=submission)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
