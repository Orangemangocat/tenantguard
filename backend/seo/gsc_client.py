"""
Google Search Console API client for TenantGuard SEO Dashboard.

Authentication priority:
1. GCE instance service account (automatic on Google Cloud VMs)
2. GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
3. GSC_SERVICE_ACCOUNT_JSON env var (inline JSON string for Docker secrets)

Setup requirements:
- Enable "Google Search Console API" in your GCP project
- Add the service account email as a Full user in Search Console
  (Settings > Users and permissions > Add user)
- Set SITE_URL env var to your verified property (e.g., https://tenantguard.net)
"""

import json
import logging
import os
from datetime import date, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# Site property URL — must match exactly what's verified in Search Console
SITE_URL = os.environ.get("SITE_URL", "https://tenantguard.net")


def _get_service():
    """Build and return an authenticated Search Console API service."""
    try:
        from google.oauth2 import service_account as sa
        from googleapiclient.discovery import build
        import google.auth.default
    except ImportError:
        logger.error(
            "google-api-python-client or google-auth not installed. "
            "Run: pip install google-api-python-client google-auth"
        )
        return None

    SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

    credentials = None

    # Option 1: Inline JSON from env var (useful for Docker secrets)
    inline_json = os.environ.get("GSC_SERVICE_ACCOUNT_JSON")
    if inline_json:
        try:
            info = json.loads(inline_json)
            credentials = sa.Credentials.from_service_account_info(info, scopes=SCOPES)
        except Exception as e:
            logger.warning(f"Failed to parse GSC_SERVICE_ACCOUNT_JSON: {e}")

    # Option 2: File path from GOOGLE_APPLICATION_CREDENTIALS
    if not credentials:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path and os.path.exists(cred_path):
            try:
                credentials = sa.Credentials.from_service_account_file(cred_path, scopes=SCOPES)
            except Exception as e:
                logger.warning(f"Failed to load credentials from file: {e}")

    # Option 3: Default credentials (GCE instance service account)
    if not credentials:
        try:
            credentials, _ = google.auth.default(scopes=SCOPES)
        except Exception as e:
            logger.warning(f"Failed to get default credentials: {e}")
            return None

    try:
        service = build("searchconsole", "v1", credentials=credentials, cache_discovery=False)
        return service
    except Exception as e:
        logger.error(f"Failed to build Search Console service: {e}")
        return None


def get_search_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    dimensions: Optional[list] = None,
    row_limit: int = 100,
    dimension_filter_groups: Optional[list] = None,
):
    """
    Query Search Analytics data (clicks, impressions, CTR, position).

    Returns list of dicts with keys: keys, clicks, impressions, ctr, position
    """
    service = _get_service()
    if not service:
        return {"error": "Search Console API not configured. See seo/gsc_client.py for setup."}

    if not end_date:
        end_date = date.today() - timedelta(days=3)  # GSC data has ~3 day lag
    if not start_date:
        start_date = end_date - timedelta(days=28)
    if not dimensions:
        dimensions = ["page"]

    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": dimensions,
        "rowLimit": row_limit,
    }
    if dimension_filter_groups:
        body["dimensionFilterGroups"] = dimension_filter_groups

    try:
        response = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
        return response.get("rows", [])
    except Exception as e:
        logger.error(f"Search Analytics query failed: {e}")
        return {"error": str(e)}


def get_search_performance_summary(days: int = 28):
    """
    Get overall site performance: total clicks, impressions, avg CTR, avg position.
    """
    service = _get_service()
    if not service:
        return {"error": "Search Console API not configured."}

    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days)

    body = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": [],
        "rowLimit": 1,
    }

    try:
        response = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
        rows = response.get("rows", [])
        if rows:
            row = rows[0]
            return {
                "total_clicks": row.get("clicks", 0),
                "total_impressions": row.get("impressions", 0),
                "avg_ctr": round(row.get("ctr", 0) * 100, 2),
                "avg_position": round(row.get("position", 0), 1),
                "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
            }
        return {
            "total_clicks": 0,
            "total_impressions": 0,
            "avg_ctr": 0,
            "avg_position": 0,
            "period": f"{start_date.isoformat()} to {end_date.isoformat()}",
        }
    except Exception as e:
        return {"error": str(e)}


def get_top_queries(limit: int = 25, days: int = 28):
    """Get top search queries by clicks."""
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days)
    rows = get_search_analytics(
        start_date=start_date,
        end_date=end_date,
        dimensions=["query"],
        row_limit=limit,
    )
    if isinstance(rows, dict) and "error" in rows:
        return rows
    return [
        {
            "query": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": round(row["ctr"] * 100, 2),
            "position": round(row["position"], 1),
        }
        for row in rows
    ]


def get_top_pages(limit: int = 25, days: int = 28):
    """Get top pages by clicks."""
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days)
    rows = get_search_analytics(
        start_date=start_date,
        end_date=end_date,
        dimensions=["page"],
        row_limit=limit,
    )
    if isinstance(rows, dict) and "error" in rows:
        return rows
    return [
        {
            "page": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": round(row["ctr"] * 100, 2),
            "position": round(row["position"], 1),
        }
        for row in rows
    ]


def get_index_coverage():
    """
    Get sitemap-based indexing overview.

    The Sitemaps API shows submitted URLs, indexed count, warnings, and errors.
    """
    service = _get_service()
    if not service:
        return {"error": "Search Console API not configured."}

    try:
        sitemaps_response = service.sitemaps().list(siteUrl=SITE_URL).execute()
        sitemaps = sitemaps_response.get("sitemap", [])

        results = []
        for sm in sitemaps:
            results.append({
                "path": sm.get("path", ""),
                "last_submitted": sm.get("lastSubmitted", ""),
                "last_downloaded": sm.get("lastDownloaded", ""),
                "is_pending": sm.get("isPending", False),
                "warnings": sm.get("warnings", 0),
                "errors": sm.get("errors", 0),
                "contents": sm.get("contents", []),
            })

        return {
            "sitemaps": results,
            "total_sitemaps": len(results),
        }
    except Exception as e:
        return {"error": str(e)}


def inspect_url(url: str):
    """
    Inspect a single URL for indexing status.

    Returns coverage state, crawl info, indexing state, etc.
    Uses the URL Inspection API (limited to 2000 calls/day).
    """
    service = _get_service()
    if not service:
        return {"error": "Search Console API not configured."}

    try:
        body = {
            "inspectionUrl": url,
            "siteUrl": SITE_URL,
        }
        response = service.urlInspection().index().inspect(body=body).execute()
        result = response.get("inspectionResult", {})

        index_status = result.get("indexStatusResult", {})
        crawl_info = index_status.get("crawledAs", "")
        coverage_state = index_status.get("coverageState", "")
        verdict = index_status.get("verdict", "")
        last_crawl = index_status.get("lastCrawlTime", "")
        page_fetch = index_status.get("pageFetchState", "")
        indexing_state = index_status.get("indexingState", "")
        robots_txt_state = index_status.get("robotsTxtState", "")

        mobile_result = result.get("mobileUsabilityResult", {})
        mobile_verdict = mobile_result.get("verdict", "")

        return {
            "url": url,
            "verdict": verdict,
            "coverage_state": coverage_state,
            "indexing_state": indexing_state,
            "last_crawl_time": last_crawl,
            "crawled_as": crawl_info,
            "page_fetch_state": page_fetch,
            "robots_txt_state": robots_txt_state,
            "mobile_usability": mobile_verdict,
        }
    except Exception as e:
        return {"error": str(e), "url": url}


def get_daily_performance(days: int = 28):
    """Get daily clicks/impressions for charting."""
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days)
    rows = get_search_analytics(
        start_date=start_date,
        end_date=end_date,
        dimensions=["date"],
        row_limit=days + 5,
    )
    if isinstance(rows, dict) and "error" in rows:
        return rows
    return [
        {
            "date": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": round(row["ctr"] * 100, 2),
            "position": round(row["position"], 1),
        }
        for row in rows
    ]
