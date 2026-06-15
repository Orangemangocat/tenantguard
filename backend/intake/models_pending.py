"""
PendingUpload — Temporary storage for documents uploaded before authentication.

When a visitor uploads a notice on the landing page (before sign-up), we store
the file and AI analysis here. After they sign up, the document is moved to a
real IntakeDocument attached to their IntakeSubmission, and this record is deleted.
"""

import uuid

from django.db import models


class PendingUpload(models.Model):
    """A document uploaded by an unauthenticated visitor."""

    # Unique token given to the browser so it can claim this upload after sign-up
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)

    # File storage
    file = models.FileField(upload_to="intake/pending/")
    original_filename = models.CharField(max_length=255)

    # AI analysis results (stored as JSON)
    document_type = models.CharField(max_length=100, blank=True)
    summary = models.TextField(blank=True)
    analysis_json = models.JSONField(default=dict, blank=True)

    # Housekeeping
    created_at = models.DateTimeField(auto_now_add=True)
    claimed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PendingUpload {self.token} — {self.original_filename}"
