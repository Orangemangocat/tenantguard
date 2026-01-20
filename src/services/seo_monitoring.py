import json
import os
from datetime import datetime, timezone
from urllib.parse import quote

import requests

try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request as GoogleAuthRequest
except Exception:  # pragma: no cover - optional dependency
    service_account = None
    GoogleAuthRequest = None

SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_sitemap_url() -> str:
    return (
        os.environ.get('PUBLIC_SITEMAP_URL')
        or os.environ.get('GOOGLE_SEARCH_CONSOLE_SITEMAP_URL')
        or 'https://www.tenantguard.net/sitemap.xml'
    )


def is_ping_enabled() -> bool:
    value = os.environ.get('SEO_PING_ON_PUBLISH', 'true').strip().lower()
    return value in {'1', 'true', 'yes', 'on'}


def ping_google_sitemap(sitemap_url: str) -> dict:
    ping_url = f"https://www.google.com/ping?sitemap={quote(sitemap_url, safe='')}"
    try:
        response = requests.get(ping_url, timeout=8)
        return {
            'ok': response.ok,
            'status_code': response.status_code,
            'ping_url': ping_url,
            'timestamp': _utc_now_iso()
        }
    except Exception as exc:
        return {
            'ok': False,
            'status_code': None,
            'ping_url': ping_url,
            'error': str(exc),
            'timestamp': _utc_now_iso()
        }


def _load_search_console_credentials():
    if service_account is None:
        return None, ['google-auth']

    raw = os.environ.get('GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON')
    if not raw:
        return None, ['GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON']
    try:
        info = json.loads(raw)
    except json.JSONDecodeError:
        return None, ['GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON (invalid JSON)']

    credentials = service_account.Credentials.from_service_account_info(
        info,
        scopes=[SEARCH_CONSOLE_SCOPE],
    )
    return credentials, []


def _fetch_access_token(credentials):
    if GoogleAuthRequest is None:
        raise RuntimeError('google-auth transport is unavailable')
    request = GoogleAuthRequest()
    credentials.refresh(request)
    return credentials.token


def _summarize_sitemaps(sitemaps, primary_url=None):
    submitted_total = 0
    indexed_total = 0
    last_submitted = None
    last_downloaded = None
    primary = None

    for item in sitemaps:
        submitted_total += int(item.get('submitted') or 0)
        indexed_total += int(item.get('indexed') or 0)
        candidate_submitted = item.get('last_submitted')
        candidate_downloaded = item.get('last_downloaded')
        if candidate_submitted and (last_submitted is None or candidate_submitted > last_submitted):
            last_submitted = candidate_submitted
        if candidate_downloaded and (last_downloaded is None or candidate_downloaded > last_downloaded):
            last_downloaded = candidate_downloaded
        if primary_url and item.get('path') == primary_url:
            primary = item

    return {
        'submitted_total': submitted_total,
        'indexed_total': indexed_total,
        'last_submitted': last_submitted,
        'last_downloaded': last_downloaded,
        'primary_sitemap': primary
    }


def fetch_search_console_sitemaps():
    site_url = os.environ.get('GOOGLE_SEARCH_CONSOLE_SITE_URL')
    primary_sitemap_url = os.environ.get('GOOGLE_SEARCH_CONSOLE_SITEMAP_URL') or get_sitemap_url()
    missing = []

    if not site_url:
        missing.append('GOOGLE_SEARCH_CONSOLE_SITE_URL')

    credentials, credential_missing = _load_search_console_credentials()
    missing.extend(credential_missing)

    if missing:
        return {
            'status': 'unconfigured',
            'site_url': site_url,
            'missing': missing,
            'fetched_at': _utc_now_iso()
        }

    try:
        token = _fetch_access_token(credentials)
        encoded_site = quote(site_url, safe='')
        api_url = f"https://www.googleapis.com/webmasters/v3/sites/{encoded_site}/sitemaps"
        response = requests.get(
            api_url,
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        if not response.ok:
            return {
                'status': 'error',
                'site_url': site_url,
                'error': f"Search Console request failed ({response.status_code})",
                'details': response.text,
                'fetched_at': _utc_now_iso()
            }
        payload = response.json()
        sitemaps = payload.get('sitemap', [])
        normalized = []
        for item in sitemaps:
            normalized.append({
                'path': item.get('path'),
                'last_submitted': item.get('lastSubmitted'),
                'last_downloaded': item.get('lastDownloaded'),
                'warnings': item.get('warnings'),
                'errors': item.get('errors'),
                'submitted': item.get('submitted'),
                'indexed': item.get('indexed'),
                'type': item.get('type')
            })

        summary = _summarize_sitemaps(normalized, primary_url=primary_sitemap_url)

        return {
            'status': 'ok',
            'site_url': site_url,
            'sitemaps': normalized,
            'summary': summary,
            'primary_sitemap': summary.get('primary_sitemap'),
            'fetched_at': _utc_now_iso()
        }
    except Exception as exc:
        return {
            'status': 'error',
            'site_url': site_url,
            'error': 'Failed to fetch Search Console sitemap data',
            'details': str(exc),
            'fetched_at': _utc_now_iso()
        }
