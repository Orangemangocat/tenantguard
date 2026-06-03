"""
SMS intake via Twilio.

Inbound SMS → Twilio webhook → this view → OpenAI → TwiML reply

Each phone number gets one active SMSSession → IntakeSubmission.
The full conversation is logged to IntakeChatLog just like the web chat.

Setup required (backend/.env):
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_PHONE_NUMBER=+16155550100   # your Twilio number
    OPENAI_API_KEY=sk-...

Twilio webhook URL (configure in Twilio console):
    POST https://yourdomain.com/api/intake/sms/
"""

import json
import os
from datetime import date

from django.http import HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import IntakeChatLog, IntakeSubmission, SMSSession
from .chat_views import INTAKE_TOOLS, SYSTEM_PROMPT, _apply_intake_data, get_collected_fields

# ---------------------------------------------------------------------------
# System prompt tweak for SMS
# ---------------------------------------------------------------------------

SMS_SYSTEM_PROMPT = (
    SYSTEM_PROMPT
    + "\n\nIMPORTANT: This conversation is happening over SMS/text message. "
    "Keep every reply under 300 characters when possible. "
    "Ask only one question at a time. Do not use bullet points or markdown — plain text only."
)

# ---------------------------------------------------------------------------
# Twilio request validation (optional but strongly recommended in production)
# ---------------------------------------------------------------------------

def _validate_twilio_signature(request) -> bool:
    """Return True if the request has a valid Twilio HMAC signature."""
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    if not auth_token:
        return True  # Skip validation if not configured (dev mode)

    try:
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(auth_token)
        signature = request.headers.get("X-Twilio-Signature", "")
        url = request.build_absolute_uri()
        params = request.POST.dict()
        return validator.validate(url, params, signature)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# TwiML response helpers
# ---------------------------------------------------------------------------

def _twiml_reply(text: str) -> HttpResponse:
    """Wrap text in a TwiML <Response><Message> envelope."""
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{escaped}</Message></Response>'
    return HttpResponse(xml, content_type="text/xml")


def _twiml_empty() -> HttpResponse:
    """Return an empty TwiML response (no reply sent)."""
    xml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    return HttpResponse(xml, content_type="text/xml")


# ---------------------------------------------------------------------------
# AI call for SMS (non-streaming, handles tool calls)
# ---------------------------------------------------------------------------

def _call_ai_for_sms(messages: list[dict], submission: IntakeSubmission) -> tuple[str, bool]:
    """
    Call OpenAI with the current conversation and process any tool calls.
    Returns (reply_text, intake_complete).
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return "Our AI service is temporarily unavailable. Please try again later.", False

    try:
        import openai as _openai
        client = _openai.OpenAI(api_key=api_key)

        full_messages = [{"role": "system", "content": SMS_SYSTEM_PROMPT}] + messages
        intake_complete = False

        # Loop to handle tool calls (model may call tools before producing a reply)
        for _ in range(3):  # max 3 rounds to prevent infinite loops
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=full_messages,
                tools=INTAKE_TOOLS,
                tool_choice="auto",
                temperature=0.7,
                max_tokens=300,
            )

            message = response.choices[0].message

            if message.tool_calls:
                # Process tool calls
                tool_results = []
                for tc in message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments) if tc.function.arguments else {}
                    except json.JSONDecodeError:
                        args = {}

                    if tc.function.name == "save_intake_data":
                        _apply_intake_data(submission, args)
                        result = "Saved."
                    elif tc.function.name == "complete_intake":
                        if submission.status == "draft":
                            submission.status = "pending"
                            if args.get("urgency_level"):
                                submission.urgency_level = args["urgency_level"]
                            submission.save(update_fields=["status", "urgency_level", "updated_at"])
                        intake_complete = True
                        result = "Intake complete."
                    else:
                        result = "Unknown tool."

                    tool_results.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result,
                    })

                # Add the assistant message (with tool_calls) + tool results then loop
                full_messages.append(message.model_dump(exclude_none=True))
                full_messages.extend(tool_results)
                continue

            # No tool calls — this is the final text reply
            return (message.content or "").strip(), intake_complete

        return "I'm sorry, I ran into a problem. Please text us again.", False

    except Exception as e:
        return "Something went wrong on our end. Please try again in a moment.", False


# ---------------------------------------------------------------------------
# SMS webhook view
# ---------------------------------------------------------------------------

@method_decorator(csrf_exempt, name="dispatch")
class TwilioSMSWebhookView(View):
    """
    Handles inbound SMS from Twilio.
    No authentication required — identity is established by phone number.
    """

    def post(self, request, *args, **kwargs):
        if not _validate_twilio_signature(request):
            return HttpResponse("Forbidden", status=403)

        from_number = request.POST.get("From", "").strip()
        body = request.POST.get("Body", "").strip()

        if not from_number or not body:
            return _twiml_empty()

        # ── Find or create SMS session ─────────────────────────────────
        session, _ = SMSSession.objects.get_or_create(phone=from_number)

        if session.submission is None or session.submission.status not in ("draft", "pending"):
            # Start a new intake
            submission = IntakeSubmission.objects.create(
                user=None,  # SMS users don't have accounts yet
                role="tenant",
                status="draft",
                email="",
                phone=from_number,
                preferred_contact="text",
            )
            session.submission = submission
            session.save(update_fields=["submission", "updated_at"])
        else:
            submission = session.submission

        # ── Build conversation history ─────────────────────────────────
        logs = list(
            IntakeChatLog.objects.filter(submission=submission).order_by("created_at")
        )
        history = [{"role": log.role, "content": log.content} for log in logs]

        # Add the new inbound message
        history.append({"role": "user", "content": body})

        # ── Save inbound message to audit log ──────────────────────────
        IntakeChatLog.objects.create(
            submission=submission,
            role=IntakeChatLog.ROLE_USER,
            content=body,
            source=IntakeChatLog.SOURCE_SMS,
        )

        # ── Get AI reply ───────────────────────────────────────────────
        # If this is the very first message and no history exists, inject the START signal
        if not logs:
            ai_history = [{"role": "user", "content": "[START_INTAKE]"}] + history
        else:
            ai_history = history

        reply_text, completed = _call_ai_for_sms(ai_history, submission)

        # ── Save AI response to audit log ──────────────────────────────
        if reply_text:
            IntakeChatLog.objects.create(
                submission=submission,
                role=IntakeChatLog.ROLE_ASSISTANT,
                content=reply_text,
                source=IntakeChatLog.SOURCE_SMS,
            )

        # ── Add web link when intake completes ─────────────────────────
        if completed:
            site_url = os.getenv("SITE_URL", "https://tenantguard.com")
            reply_text += (
                f"\n\nYour case file is open! Create a free account to upload documents "
                f"and get your full case analysis: {site_url}/intake"
            )

        return _twiml_reply(reply_text)
