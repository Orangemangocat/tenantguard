"""
Profile-specific API views for TenantGuard.

Endpoints:
  GET/PATCH  /api/auth/profile/          — get or update the current user's profile
  GET        /api/auth/profile/summary/  — lightweight case + activity summary
  POST       /api/auth/profile/delete/   — account deletion request (soft delete flag)
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import UserDetailsSerializer, UserProfileSerializer

User = get_user_model()


class ProfileView(APIView):
    """
    GET  — return the full user + profile object.
    PATCH — update user fields (first_name, last_name, email) and/or profile fields.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserDetailsSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserDetailsSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileSummaryView(APIView):
    """
    Returns a lightweight summary of the user's activity for the profile page sidebar:
    - total cases
    - open cases
    - cases with upcoming court dates
    - total documents uploaded
    - recent activity list
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from intake.models import IntakeSubmission, IntakeDocument

        submissions = IntakeSubmission.objects.filter(user=request.user)
        total_cases = submissions.count()
        open_cases = submissions.exclude(status__in=["closed", "complete"]).count()

        # Court dates in the next 30 days
        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now().date()
        upcoming_court = submissions.filter(
            court_date__gte=now,
            court_date__lte=now + timedelta(days=30),
        ).count()

        # Total documents
        total_docs = IntakeDocument.objects.filter(
            submission__user=request.user
        ).count()

        # Recent activity (last 5 submissions, newest first)
        recent = submissions.order_by("-created_at")[:5].values(
            "id", "status", "issue_type", "county", "court_date",
            "urgency_level", "created_at",
        )

        return Response({
            "total_cases": total_cases,
            "open_cases": open_cases,
            "upcoming_court_dates": upcoming_court,
            "total_documents": total_docs,
            "recent_cases": list(recent),
        })


class ProfileDeleteView(APIView):
    """
    POST — mark the account for deletion (sets is_active=False).
    A staff member or scheduled job can permanently delete later.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(
            {"detail": "Account deactivated. Contact support to reverse this."},
            status=status.HTTP_200_OK,
        )
