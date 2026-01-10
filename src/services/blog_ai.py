"""
Shared helpers for AI blog generation.
"""

import json
import os
from datetime import datetime

import requests


def _split_env_list(value):
    if not value:
        return []
    return [item.strip() for item in value.split(',') if item.strip()]


def select_provider_config(provider_index=None):
    api_keys = _split_env_list(os.getenv('OPENAI_API_KEYS'))
    models = _split_env_list(os.getenv('OPENAI_MODELS'))

    if not api_keys:
        single_key = os.getenv('OPENAI_API_KEY')
        if single_key:
            api_keys = [single_key]

    if not models:
        single_model = os.getenv('OPENAI_MODEL', 'gpt-4')
        models = [single_model]

    if not api_keys:
        raise ValueError("OPENAI_API_KEY(S) not configured")

    index = 0
    if provider_index is not None:
        try:
            index = int(provider_index)
        except (TypeError, ValueError) as exc:
            raise ValueError("provider_index must be an integer") from exc
    elif len(api_keys) > 1:
        index = int(datetime.utcnow().timestamp()) % len(api_keys)

    if index < 0 or index >= len(api_keys):
        raise ValueError("provider_index out of range for OPENAI_API_KEYS")

    model = models[index] if index < len(models) else models[0]
    return api_keys[index], model


def parse_llm_json(response_text):
    try:
        data = json.loads(response_text)
        if isinstance(data, dict):
            return data, None
        return None, "LLM response JSON is not an object."
    except json.JSONDecodeError:
        pass

    json_start = response_text.find('{')
    json_end = response_text.rfind('}') + 1
    if json_start >= 0 and json_end > json_start:
        try:
            data = json.loads(response_text[json_start:json_end])
            if isinstance(data, dict):
                return data, None
            return None, "LLM response JSON fragment is not an object."
        except json.JSONDecodeError as exc:
            return None, f"LLM response JSON parse error: {exc}"

    return None, "LLM response did not include valid JSON."


def call_openai_chat(prompt, context=None, provider_index=None):
    api_key, model = select_provider_config(provider_index)
    timeout = float(os.getenv('OPENAI_REQUEST_TIMEOUT', '30'))

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert blog writer for TenantGuard, a legal tech platform. "
                "Return ONLY valid JSON and no markdown."
            ),
        },
    ]

    if context:
        messages.append({
            "role": "system",
            "content": f"Context and source materials:\n{context}",
        })

    messages.append({
        "role": "user",
        "content": prompt,
    })

    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': model,
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 2000,
        },
        timeout=timeout,
    )

    if response.status_code != 200:
        raise ValueError(f"LLM API error: {response.text}")

    payload = response.json()
    try:
        return payload['choices'][0]['message']['content']
    except (KeyError, IndexError) as exc:
        raise ValueError(f"Unexpected LLM response: {exc}") from exc
