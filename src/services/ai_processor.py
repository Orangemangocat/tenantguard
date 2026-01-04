"""AI processor service (placeholder heuristics).

This module provides a simple, safe analysis function that inspects a
case dict and returns a short `summary` and `recommendation` map. It is
designed to be a local, dependency-free fallback. To integrate a real
LLM (OpenAI, Anthropic, etc.), implement the `call_llm()` helper and
use environment variables (do NOT commit keys).

Env vars expected for future integration (NOT required for this placeholder):
- OPENAI_API_KEY or LLM_API_KEY
- AI_PROVIDER

Do not store secrets in the repo; use runtime env vars / secret stores.
"""
import os
from typing import Dict, Any


def analyze_case(case: Dict[str, Any]) -> Dict[str, Any]:
    """Return a lightweight analysis for a case.

    The function uses deterministic heuristics to produce a helpful
    summary and a short recommendation. This avoids calling external
    APIs while enabling frontend UX to show results. Replace
    `heuristic_analysis` with an LLM call in future iterations.
    """
    # Basic extracted fields
    evict = False
    try:
        evict = case.get('eviction_info', {}).get('notice_received', False)
    except Exception:
        evict = False

    amount_owed = None
    try:
        amount_owed = case.get('financial_info', {}).get('amount_owed')
    except Exception:
        amount_owed = None

    urgency = case.get('legal_issue', {}).get('urgency_level') if case.get('legal_issue') else None

    summary_parts = []
    rec_parts = []

    if evict:
        summary_parts.append('Eviction notice reported.')
        rec_parts.append('Prioritize sheltering immediate deadlines; verify response_deadline.')

    if amount_owed:
        try:
            if float(amount_owed) > 0:
                rec_parts.append('Explore emergency rental assistance and payment negotiation.')
        except Exception:
            pass

    if urgency and urgency.lower() in ('high', 'urgent'):
        summary_parts.append(f'Urgency flagged: {urgency}.')
        rec_parts.append('Escalate to an attorney for quick intake triage.')

    if not summary_parts:
        summary_parts.append('No immediate eviction or urgent flags detected from intake fields.')

    # Heuristic recommendation assembly
    if not rec_parts:
        rec_parts.append('Recommend standard intake review and documentation collection.')

    analysis = {
        'summary': ' '.join(summary_parts),
        'recommendation': ' '.join(rec_parts),
        'confidence': 'low',
        'notes': {
            'heuristic': True,
            'provider': os.environ.get('AI_PROVIDER', 'heuristic')
        }
    }

    return analysis
