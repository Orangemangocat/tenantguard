"""
Quick Analyze Views — Unauthenticated document upload and AI classification.

Provides two endpoints:
  POST /api/intake/quick-analyze/  — Upload a file, get instant AI classification
  POST /api/intake/claim-upload/   — After sign-up, attach pending upload to a case
"""

import json
import os
import base64
import subprocess

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IntakeDocument, IntakeSubmission
from .models_pending import PendingUpload


class QuickAnalyzeView(APIView):
    """
    POST /api/intake/quick-analyze/
    Accepts a file upload (no auth required), runs a quick AI classification,
    stores the file as a PendingUpload, and returns:
      - token (UUID to claim later)
      - document_type (e.g., "14-Day Eviction Notice")
      - summary (brief plain-English explanation)
    """

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 20MB)
        if file.size > 20 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum size is 20MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the pending upload
        pending = PendingUpload.objects.create(
            file=file,
            original_filename=file.name,
        )

        # Run quick AI analysis
        try:
            result = self._quick_classify(pending)
            pending.document_type = result.get("document_type", "Unknown Document")
            pending.summary = result.get("summary", "")
            pending.analysis_json = result
            pending.save(update_fields=["document_type", "summary", "analysis_json"])

            return Response(
                {
                    "token": str(pending.token),
                    "document_type": pending.document_type,
                    "summary": pending.summary,
                    "urgency": result.get("urgency", "unknown"),
                    "key_dates": result.get("key_dates", []),
                    "next_steps": result.get("next_steps", []),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            # Even if analysis fails, the file is saved — return token
            return Response(
                {
                    "token": str(pending.token),
                    "document_type": "Document Uploaded",
                    "summary": "We received your document but couldn't analyze it automatically. Sign up and our team will review it.",
                    "urgency": "unknown",
                    "key_dates": [],
                    "next_steps": ["Sign up to get personalized help with your situation."],
                    "analysis_error": str(e),
                },
                status=status.HTTP_201_CREATED,
            )

    def _quick_classify(self, pending):
        """Run a fast GPT-4o classification on the uploaded document."""
        import openai

        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        file_ext = (
            pending.original_filename.lower().rsplit(".", 1)[-1]
            if "." in pending.original_filename
            else ""
        )
        is_image = file_ext in ("jpg", "jpeg", "png", "heic", "webp", "gif", "bmp")

        system_prompt = """You are a Tennessee tenant rights document classifier. A tenant has uploaded a document they received from their landlord or a court. Quickly identify what it is and explain it in plain English.

You MUST respond with valid JSON only (no markdown, no code fences). Use this exact structure:
{
    "document_type": "Human-readable document type, e.g. '14-Day Eviction Notice (Pay or Quit)', 'Detainer Warrant', 'Lease Termination Notice', 'Court Summons', 'Rent Increase Notice', etc.",
    "summary": "2-3 sentence plain-English explanation of what this document means for the tenant. Be direct and helpful. Explain what action they need to take and by when.",
    "urgency": "critical|high|medium|low",
    "key_dates": [
        {"label": "What this date is", "date": "YYYY-MM-DD or 'unclear'", "is_deadline": true/false}
    ],
    "next_steps": [
        "Brief action item the tenant should take (max 3-4 items)"
    ]
}

TENNESSEE-SPECIFIC KNOWLEDGE:
- TN Code § 66-28-505: 14-day notice required for nonpayment of rent
- TN Code § 66-28-508: 14-day notice for material noncompliance  
- Detainer warrants must be properly served; tenant has right to a hearing
- Self-help evictions (lockouts, utility shutoffs) are ILLEGAL in Tennessee
- Tenant has right to cure certain violations within the notice period
- Retaliatory evictions within 1 year of complaint are prohibited (§ 66-28-514)

Be reassuring but honest. Let them know they have rights and options."""

        # Build messages based on file type
        if is_image:
            file_path = pending.file.path if hasattr(pending.file, "path") else None
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
                                "text": "Identify and summarize this document. What type of notice or legal document is this?",
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
                raise ValueError("Image file not accessible for analysis")
        else:
            # Extract text from PDF or text files
            extracted = ""
            file_path = pending.file.path if hasattr(pending.file, "path") else None
            if file_path and os.path.exists(file_path):
                if file_ext == "pdf":
                    try:
                        result = subprocess.run(
                            ["pdftotext", file_path, "-"],
                            capture_output=True,
                            text=True,
                            timeout=30,
                        )
                        extracted = result.stdout
                    except Exception:
                        extracted = "[PDF text extraction failed]"
                elif file_ext in ("doc", "docx"):
                    # Try to extract text from docx using python-docx if available
                    try:
                        import docx

                        doc = docx.Document(file_path)
                        extracted = "\n".join(
                            para.text for para in doc.paragraphs if para.text.strip()
                        )
                    except ImportError:
                        # Fallback: try reading as raw text
                        try:
                            with open(file_path, "r", errors="ignore") as f:
                                extracted = f.read()[:10000]
                        except Exception:
                            extracted = "[Document text extraction failed]"
                    except Exception:
                        try:
                            with open(file_path, "r", errors="ignore") as f:
                                extracted = f.read()[:10000]
                        except Exception:
                            extracted = "[Document text extraction failed]"
                else:
                    try:
                        with open(file_path, "r", errors="ignore") as f:
                            extracted = f.read()[:10000]
                    except Exception:
                        extracted = "[Text extraction failed]"

            if not extracted.strip():
                raise ValueError("Could not extract text from document")

            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"Identify and summarize this document:\n\n---\n{extracted[:8000]}\n---",
                },
            ]

        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content
        return json.loads(result_text)


class ClaimUploadView(APIView):
    """
    POST /api/intake/claim-upload/
    After sign-up, attach a pending upload to the user's intake submission.
    Expects: { "token": "<uuid>", "submission_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("token")
        submission_id = request.data.get("submission_id")

        if not token:
            return Response(
                {"error": "Upload token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending = get_object_or_404(PendingUpload, token=token, claimed=False)

        # If no submission_id provided, create a new draft submission for the user
        if submission_id:
            submission = get_object_or_404(
                IntakeSubmission, pk=submission_id, user=request.user
            )
        else:
            # Create a minimal draft submission
            submission = IntakeSubmission.objects.create(
                user=request.user,
                role="tenant",
                status="draft",
                email=request.user.email or "",
                issue_type="eviction",  # Default based on most common upload
            )

        # Determine doc_type from AI classification
        doc_type = self._classify_doc_type(pending.document_type)

        # Create the real IntakeDocument from the pending upload
        document = IntakeDocument.objects.create(
            submission=submission,
            doc_type=doc_type,
            file=pending.file,
            original_filename=pending.original_filename,
        )

        # Mark pending as claimed
        pending.claimed = True
        pending.save(update_fields=["claimed"])

        return Response(
            {
                "submission_id": submission.id,
                "document_id": document.id,
                "doc_type": doc_type,
                "message": "Document attached to your case successfully.",
            },
            status=status.HTTP_201_CREATED,
        )

    def _classify_doc_type(self, document_type_str):
        """Map the AI-generated document type string to our doc_type choices."""
        dt_lower = document_type_str.lower()
        if "eviction" in dt_lower or "quit" in dt_lower or "vacate" in dt_lower:
            return "eviction_notice"
        elif "court" in dt_lower or "summons" in dt_lower or "detainer" in dt_lower or "warrant" in dt_lower:
            return "court_filing"
        elif "lease" in dt_lower or "rental agreement" in dt_lower:
            return "lease"
        elif "payment" in dt_lower or "receipt" in dt_lower or "ledger" in dt_lower:
            return "payment_record"
        elif "photo" in dt_lower or "image" in dt_lower:
            return "photo"
        elif "letter" in dt_lower or "correspondence" in dt_lower or "notice" in dt_lower:
            return "correspondence"
        else:
            return "other"
