import os
import threading

import stripe
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IntakeSubmission
from .serializers import IntakeSubmissionDetailSerializer

# Price in cents — set INTAKE_ANALYSIS_PRICE_CENTS in your .env to override.
# Default: $49.00
ANALYSIS_PRICE_CENTS = int(os.getenv("INTAKE_ANALYSIS_PRICE_CENTS", "4900"))
ANALYSIS_PRICE_DISPLAY = f"${ANALYSIS_PRICE_CENTS / 100:.0f}"


class CreateCheckoutSessionView(APIView):
    """
    POST /api/intake/<id>/checkout/
    Creates a Stripe Checkout Session for the case analysis fee.
    Returns { checkout_url, price_display }.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        submission = get_object_or_404(IntakeSubmission, pk=pk, user=request.user)

        if submission.payment_status == "paid":
            return Response({"detail": "Analysis already unlocked."}, status=400)

        stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
        if not stripe.api_key:
            return Response({"detail": "Payment service not configured."}, status=503)

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        issue_label = submission.get_issue_type_display() or "Housing Issue"

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "unit_amount": ANALYSIS_PRICE_CENTS,
                        "product_data": {
                            "name": "TenantGuard Case Analysis",
                            "description": (
                                f"AI-powered analysis of your {issue_label} case. "
                                "Know your rights, your deadlines, and exactly what to do next — "
                                "in plain English, not legalese."
                            ),
                            "images": [f"{frontend_url}/assets/logo.png"],
                        },
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{frontend_url}/case/{pk}?payment=success",
            cancel_url=f"{frontend_url}/case/{pk}",
            customer_email=submission.email or None,
            metadata={
                "submission_id": str(pk),
                "user_id": str(request.user.id),
            },
        )

        submission.stripe_session_id = session.id
        submission.save(update_fields=["stripe_session_id", "updated_at"])

        return Response({"checkout_url": session.url, "price_display": ANALYSIS_PRICE_DISPLAY})


class IntakePriceView(APIView):
    """GET /api/intake/price/ — returns the current analysis price for display."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"price_cents": ANALYSIS_PRICE_CENTS, "price_display": ANALYSIS_PRICE_DISPLAY})


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """
    POST /api/stripe/webhook/
    Handles Stripe webhook events. Verifies signature, marks submission paid,
    and kicks off the analysis pipeline in a background thread.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

        if not webhook_secret:
            return Response({"detail": "Webhook secret not configured."}, status=500)

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            return Response({"detail": "Invalid payload."}, status=400)
        except stripe.error.SignatureVerificationError:
            return Response({"detail": "Invalid signature."}, status=400)

        if event["type"] == "checkout.session.completed":
            self._handle_payment_success(event["data"]["object"])

        return Response({"status": "ok"})

    def _handle_payment_success(self, session):
        submission_id = session.get("metadata", {}).get("submission_id")
        if not submission_id:
            return

        try:
            submission = IntakeSubmission.objects.get(pk=int(submission_id))
        except (IntakeSubmission.DoesNotExist, ValueError):
            return

        # Mark paid
        submission.payment_status = "paid"
        submission.status = "analyzing"
        submission.save(update_fields=["payment_status", "status", "updated_at"])

        # Run analysis in a background thread so the webhook returns quickly.
        # TODO: replace with Celery task for production.
        def run_analysis():
            from .ai_agents import IntakeAnalysisWorkflow
            try:
                IntakeAnalysisWorkflow().run(submission)
            except Exception:
                pass  # run() already sets status=error on failure

        thread = threading.Thread(target=run_analysis, daemon=True)
        thread.start()
