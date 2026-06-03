import json
import os
from datetime import date

from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IntakeChatLog, IntakeSubmission

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a compassionate intake specialist at TenantGuard — a platform built \
to help Tennessee tenants understand and defend their own rights, without needing an expensive attorney.

Your role is to have a natural, warm conversation that opens a case file for the tenant. \
You are NOT a lawyer — never give specific legal predictions. \
You CAN explain what TenantGuard will do for them, validate their situation, and help them \
feel heard and less alone.

WHAT TENANTGUARD ACTUALLY DOES (explain this when completing intake):
TenantGuard will analyze their documents and case details, then deliver a plain-English breakdown \
of their rights under Tennessee law, every deadline they need to know, and a concrete step-by-step \
action plan they can follow themselves — without paying attorney rates. Our goal is to give them \
the knowledge and tools to fight back and protect their home.

PERSONA
- Warm, calm, non-judgmental — many tenants are scared and feel powerless
- Conversational, not clinical — no "please fill in field X"
- Empowering: remind them that knowing their rights is powerful
- Brief: 2–4 sentences per turn maximum, then ask your next question

WHAT TO COLLECT (gather naturally, in any order):
  Contact:      first name, last name, phone number
  Property:     property address, city, county (Tennessee county)
  Landlord:     landlord name and contact info
  Issue:        what's happening, description, any written notices received
  Dates:        when problem started, notice date if any, court date if any
  Goals:        what outcome they're hoping for

URGENCY RULES — if they mention any of these, acknowledge it immediately and set urgency "immediate":
  - Court date within 7 days
  - Eviction notice saying they must leave immediately
  - Active lockout or utility shutoff today/tomorrow
  - Any "you must leave by" deadline coming up fast

CONVERSATION FLOW
1. Introduce yourself warmly and ask: "What's going on with your housing situation?"
2. Let them tell their story before drilling into specifics
3. Gather missing fields naturally as the conversation flows
4. Once you have name + contact + issue + property + county, call complete_intake
5. Close by telling them exactly what happens next: TenantGuard will analyze their case and \
   give them a complete plain-English breakdown of their rights and what to do — no attorney needed.

TOOL USAGE
- Call save_intake_data whenever you extract meaningful new information
- Call complete_intake once you have the essential fields — don't hold out for perfection
- Never mention "saving data" or "calling a function" — just keep the conversation natural

IMPORTANT: When the user first messages you (or sends [START_INTAKE]), introduce yourself warmly \
and ask your opening question. Keep it brief and inviting."""

# ---------------------------------------------------------------------------
# OpenAI tool definitions
# ---------------------------------------------------------------------------

INTAKE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "save_intake_data",
            "description": (
                "Silently save extracted intake information to the case file. "
                "Call this whenever you have gathered one or more new fields from the conversation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "phone": {"type": "string"},
                    "street_address": {"type": "string"},
                    "city": {"type": "string"},
                    "zip_code": {"type": "string"},
                    "county": {
                        "type": "string",
                        "enum": ["davidson", "shelby", "knox", "hamilton",
                                 "rutherford", "williamson", "montgomery", "other"],
                    },
                    "property_address": {"type": "string"},
                    "landlord_name": {"type": "string"},
                    "landlord_contact": {"type": "string"},
                    "landlord_address": {"type": "string"},
                    "property_management_company": {"type": "string"},
                    "issue_type": {
                        "type": "string",
                        "enum": ["eviction", "rent_increase", "habitability",
                                 "security_deposit", "lease_violation", "harassment",
                                 "utility", "entry_privacy", "other"],
                    },
                    "issue_description": {"type": "string"},
                    "eviction_notice_type": {
                        "type": "string",
                        "enum": ["pay_or_quit", "cure_or_quit",
                                 "unconditional_quit", "termination", "unknown"],
                    },
                    "eviction_reason": {"type": "string"},
                    "amount_owed": {"type": "number"},
                    "notice_date": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                    "court_date": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                    "problem_start_date": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                    "response_deadline": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                    "urgency_level": {
                        "type": "string",
                        "enum": ["immediate", "within_days", "within_weeks", "not_urgent"],
                    },
                    "monthly_rent": {"type": "number"},
                    "move_in_date": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                    "lease_type": {
                        "type": "string",
                        "enum": ["written", "oral", "month_to_month", "unknown"],
                    },
                    "security_deposit_amount": {"type": "number"},
                    "desired_outcome": {"type": "string"},
                    "previous_resolution_attempts": {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_intake",
            "description": (
                "Mark the intake as complete and ready for attorney review. "
                "Call only when you have: name, some contact info, issue type, "
                "property address, and county."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "urgency_level": {
                        "type": "string",
                        "enum": ["immediate", "within_days", "within_weeks", "not_urgent"],
                        "description": "Overall urgency based on the full conversation",
                    },
                    "summary": {
                        "type": "string",
                        "description": "One or two sentence summary of the case for the review team",
                    },
                },
                "required": ["urgency_level", "summary"],
            },
        },
    },
]

# Fields the AI is allowed to write — guards against prompt injection
_SAFE_FIELDS = {
    "first_name", "last_name", "phone", "street_address", "city", "zip_code",
    "county", "property_address", "landlord_name", "landlord_contact",
    "landlord_address", "property_management_company",
    "issue_type", "issue_description", "eviction_notice_type", "eviction_reason",
    "amount_owed", "notice_date", "court_date", "problem_start_date",
    "response_deadline", "urgency_level", "desired_outcome",
    "previous_resolution_attempts", "monthly_rent", "move_in_date",
    "lease_type", "security_deposit_amount",
}
_DATE_FIELDS = {"notice_date", "court_date", "problem_start_date", "response_deadline", "move_in_date"}


def _apply_intake_data(submission: IntakeSubmission, data: dict):
    """Write AI-extracted fields to the submission model."""
    updated = []
    for field, value in data.items():
        if field not in _SAFE_FIELDS or value is None or value == "":
            continue
        if field in _DATE_FIELDS:
            try:
                value = date.fromisoformat(str(value))
            except (ValueError, TypeError):
                continue
        setattr(submission, field, value)
        updated.append(field)

    if updated:
        updated.append("updated_at")
        submission.save(update_fields=updated)

    return updated


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------

class IntakeChatView(APIView):
    """
    POST /api/intake/chat/

    Body:
        messages      – list of {role, content} (client maintains history)
        submission_id – optional, links to an existing draft

    Returns:
        text/event-stream with events:
            {type: "submission_id", id: <int>}
            {type: "text", content: <str>}
            {type: "intake_saved", fields: [<str>]}
            {type: "intake_complete", submission_id: <int>, urgency: <str>}
            {type: "done"}
            {type: "error", message: <str>}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get("messages", [])
        submission_id = request.data.get("submission_id")

        # Resolve or create the draft submission
        submission = None
        if submission_id:
            try:
                submission = IntakeSubmission.objects.get(
                    pk=submission_id, user=request.user
                )
            except IntakeSubmission.DoesNotExist:
                pass

        if not submission:
            submission = IntakeSubmission.objects.create(
                user=request.user,
                role="tenant",
                status="draft",
                email=request.user.email or "",
                first_name=getattr(request.user, "first_name", ""),
                last_name=getattr(request.user, "last_name", ""),
            )

        # Save the new user message to the audit log (skip the internal START signal)
        new_user_msg = messages[-1] if messages else None
        if (
            new_user_msg
            and new_user_msg.get("role") == "user"
            and new_user_msg.get("content", "").strip() != "[START_INTAKE]"
        ):
            IntakeChatLog.objects.create(
                submission=submission,
                role=IntakeChatLog.ROLE_USER,
                content=new_user_msg["content"],
                source=IntakeChatLog.SOURCE_WEB,
            )

        # Capture for closure
        sub_id = submission.id
        user = request.user

        def event_stream():
            # Always send the submission_id first so the client can track it
            yield f"data: {json.dumps({'type': 'submission_id', 'id': sub_id})}\n\n"

            api_key = os.getenv("OPENAI_API_KEY", "")
            if not api_key:
                yield f"data: {json.dumps({'type': 'error', 'message': 'AI service not configured.'})}\n\n"
                return

            try:
                import openai as _openai
                client = _openai.OpenAI(api_key=api_key)

                full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

                stream = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=full_messages,
                    tools=INTAKE_TOOLS,
                    tool_choice="auto",
                    stream=True,
                    temperature=0.7,
                    max_tokens=600,
                )

                # Accumulate tool calls across streaming chunks
                # tool_calls_acc: {index: {id, name, arguments}}
                tool_calls_acc: dict[int, dict] = {}
                ai_response_text = ""

                for chunk in stream:
                    if not chunk.choices:
                        continue
                    choice = chunk.choices[0]
                    delta = choice.delta

                    # Stream text content to client and accumulate for log
                    if delta.content:
                        ai_response_text += delta.content
                        yield f"data: {json.dumps({'type': 'text', 'content': delta.content})}\n\n"

                    # Accumulate tool call fragments
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                            if tc.id:
                                tool_calls_acc[idx]["id"] = tc.id
                            if tc.function and tc.function.name:
                                tool_calls_acc[idx]["name"] += tc.function.name
                            if tc.function and tc.function.arguments:
                                tool_calls_acc[idx]["arguments"] += tc.function.arguments

                    # Execute accumulated tool calls on finish
                    if choice.finish_reason in ("tool_calls", "stop") and tool_calls_acc:
                        # Reload submission fresh to avoid stale state
                        try:
                            sub = IntakeSubmission.objects.get(pk=sub_id, user=user)
                        except IntakeSubmission.DoesNotExist:
                            break

                        for idx in sorted(tool_calls_acc):
                            tc = tool_calls_acc[idx]
                            try:
                                args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                            except json.JSONDecodeError:
                                args = {}

                            if tc["name"] == "save_intake_data":
                                updated = _apply_intake_data(sub, args)
                                if updated:
                                    yield f"data: {json.dumps({'type': 'intake_saved', 'fields': updated})}\n\n"

                            elif tc["name"] == "complete_intake":
                                if sub.status == "draft":
                                    sub.status = "pending"
                                    if args.get("urgency_level"):
                                        sub.urgency_level = args["urgency_level"]
                                    sub.save(update_fields=["status", "urgency_level", "updated_at"])
                                yield f"data: {json.dumps({'type': 'intake_complete', 'submission_id': sub_id, 'urgency': args.get('urgency_level', 'not_urgent')})}\n\n"

                        tool_calls_acc = {}

                # Persist the AI response to the audit log
                if ai_response_text.strip():
                    IntakeChatLog.objects.create(
                        submission_id=sub_id,
                        role=IntakeChatLog.ROLE_ASSISTANT,
                        content=ai_response_text,
                        source=IntakeChatLog.SOURCE_WEB,
                    )

                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


# ---------------------------------------------------------------------------
# Collected-fields helper (used by history view + SMS)
# ---------------------------------------------------------------------------

_TRACKED_FIELDS = [
    "first_name", "last_name", "phone", "property_address", "county",
    "landlord_name", "issue_type", "issue_description", "court_date",
    "notice_date", "urgency_level", "desired_outcome",
]


def get_collected_fields(submission: IntakeSubmission) -> list[str]:
    """Return which intake fields have been saved for a submission."""
    return [f for f in _TRACKED_FIELDS if getattr(submission, f, None)]


# ---------------------------------------------------------------------------
# Chat history endpoint  GET /api/intake/chat/history/?submission_id=<id>
# ---------------------------------------------------------------------------

class IntakeChatHistoryView(APIView):
    """
    Returns the full persisted chat log for a submission so the frontend
    can restore the conversation after a page reload or device restart.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        submission_id = request.query_params.get("submission_id")
        if not submission_id:
            # Look for any active draft for this user
            submission = (
                IntakeSubmission.objects
                .filter(user=request.user, status="draft")
                .order_by("-created_at")
                .first()
            )
            if not submission:
                return Response({"messages": [], "submission_id": None})
        else:
            try:
                submission = IntakeSubmission.objects.get(
                    pk=submission_id, user=request.user
                )
            except IntakeSubmission.DoesNotExist:
                return Response({"error": "Not found"}, status=404)

        logs = IntakeChatLog.objects.filter(submission=submission)
        return Response({
            "submission_id": submission.id,
            "status": submission.status,
            "urgency_level": submission.urgency_level or "not_urgent",
            "collected_fields": get_collected_fields(submission),
            "messages": [
                {"role": log.role, "content": log.content}
                for log in logs
            ],
        })
