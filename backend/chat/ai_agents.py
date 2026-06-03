from blog.ai_agents import BaseAgent


SYSTEM_PROMPT_BASE = """You are a compassionate and knowledgeable legal assistant for TenantGuard, \
specializing in Tennessee landlord-tenant law. You help tenants understand their rights and options.

Key facts you always keep in mind:
- Tennessee law requires a 14-day written notice before eviction filing for non-payment of rent.
- Landlords must maintain habitable conditions under the Tennessee Uniform Residential Landlord and Tenant Act (URLTA).
- URLTA applies in counties that have adopted it (Davidson, Shelby, Knox, Hamilton, and others).
- Tenants have the right to repair-and-deduct in URLTA counties under certain conditions.
- Security deposit disputes have specific rules: landlords must return deposits within 30 days.

You give clear, plain-language guidance. You are NOT providing legal advice — always remind users \
to consult a licensed attorney for their specific situation. Be empathetic and concise."""


def _build_intake_context(user) -> str:
    """Pull the user's most recent intake submission and case notebook as AI context."""
    try:
        from intake.models import IntakeSubmission
        submission = IntakeSubmission.objects.filter(user=user).latest("created_at")
        lines = [
            "--- USER'S INTAKE INFORMATION ---",
            f"Role: {submission.get_role_display()}",
            f"Issue Type: {submission.get_issue_type_display() if submission.issue_type else 'Not specified'}",
        ]
        if submission.property_address:
            lines.append(f"Property: {submission.property_address}")
        if submission.county:
            lines.append(f"County: {submission.get_county_display()}")
        if submission.landlord_name:
            lines.append(f"Landlord: {submission.landlord_name}")
        if submission.notice_date:
            lines.append(f"Notice Date: {submission.notice_date}")
        if submission.issue_description:
            lines.append(f"Description: {submission.issue_description}")

        # Attach case notebook summary if analysis is complete
        notebook = getattr(submission, "notebook", None)
        if notebook and notebook.summary:
            lines.append("\n--- AI CASE NOTEBOOK SUMMARY ---")
            lines.append(notebook.summary[:1500])
            if notebook.urgent_deadlines:
                lines.append(f"Urgent Deadlines: {notebook.urgent_deadlines}")

        return "\n".join(lines)
    except Exception:
        return ""


def _build_conversation_history(messages, limit: int = 10) -> list[dict]:
    """Convert the last N DB messages into the OpenAI messages format."""
    history = []
    for msg in messages[max(0, len(messages) - limit):]:
        if msg.sender_type == "user":
            history.append({"role": "user", "content": msg.content})
        elif msg.sender_type in ("ai", "staff"):
            history.append({"role": "assistant", "content": msg.content})
    return history


class LegalAssistantAgent(BaseAgent):
    """
    AI legal assistant for the TenantGuard chat widget.

    Uses the user's intake submission and case notebook as grounding context
    so responses are tailored to their specific situation.
    """

    def reply(self, user, existing_messages, new_message: str) -> str:
        intake_context = _build_intake_context(user)

        system_prompt = SYSTEM_PROMPT_BASE
        if intake_context:
            system_prompt += f"\n\n{intake_context}"

        history = _build_conversation_history(existing_messages)

        if not self.client:
            return (
                "[AI Unavailable] I'm sorry, the AI assistant isn't configured right now. "
                "Please contact us directly at john@tenantguard.net for assistance."
            )

        try:
            messages_payload = [{"role": "system", "content": system_prompt}]
            messages_payload.extend(history)
            messages_payload.append({"role": "user", "content": new_message})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages_payload,
                temperature=0.4,
                max_tokens=500,
            )
            return response.choices[0].message.content
        except Exception as e:
            return (
                f"I'm having trouble connecting right now. Please try again in a moment, "
                f"or reach us at john@tenantguard.net."
            )
