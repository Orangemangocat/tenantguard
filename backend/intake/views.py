from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_agents import IntakeAnalysisWorkflow
from .models import IntakeDocument, IntakeSubmission
from .serializers import (
    IntakeDocumentSerializer,
    IntakeSubmissionDetailSerializer,
    IntakeSubmissionSerializer,
)


class IntakeSubmissionCreateView(generics.CreateAPIView):
    """POST /api/intake/submit/ — create a new intake submission."""

    serializer_class = IntakeSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IntakeSubmissionDetailView(generics.RetrieveAPIView):
    """GET /api/intake/<id>/ — retrieve a submission with documents and notebook."""

    serializer_class = IntakeSubmissionDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IntakeSubmission.objects.filter(user=self.request.user)


class IntakeDocumentUploadView(generics.CreateAPIView):
    """POST /api/intake/<id>/documents/ — upload a document to a submission."""

    serializer_class = IntakeDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        submission = get_object_or_404(
            IntakeSubmission, pk=self.kwargs["pk"], user=self.request.user
        )
        serializer.save(submission=submission)


class IntakeAnalyzeView(APIView):
    """POST /api/intake/<id>/analyze/ — trigger the AI analysis pipeline."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        submission = get_object_or_404(
            IntakeSubmission, pk=pk, user=request.user
        )

        if submission.status == "analyzing":
            return Response(
                {"detail": "Analysis already in progress."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            workflow = IntakeAnalysisWorkflow()
            workflow.run(submission)
        except Exception as e:
            return Response(
                {"detail": f"Analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        submission.refresh_from_db()
        return Response(IntakeSubmissionDetailSerializer(submission).data)


class IntakeSubmissionListView(generics.ListAPIView):
    """GET /api/intake/ — list all submissions belonging to the current user."""

    serializer_class = IntakeSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IntakeSubmission.objects.filter(user=self.request.user)
