"""
SEO Dashboard views — served inside the Django admin for superadmins.

These views render the SEO dashboard with data from Google Search Console.
If the API isn't configured yet, they show a helpful setup guide instead.
"""

import json

from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

from . import gsc_client


@staff_member_required
@require_GET
def seo_dashboard(request):
    """Main SEO dashboard page."""
    context = {
        "title": "SEO Dashboard",
        "site_url": gsc_client.SITE_URL,
    }

    # Try to fetch data — if API not configured, show setup instructions
    summary = gsc_client.get_search_performance_summary(days=28)
    if isinstance(summary, dict) and "error" in summary:
        context["api_error"] = summary["error"]
        context["setup_needed"] = True
    else:
        context["summary"] = summary
        context["top_queries"] = gsc_client.get_top_queries(limit=20)
        context["top_pages"] = gsc_client.get_top_pages(limit=20)
        context["daily_data"] = json.dumps(gsc_client.get_daily_performance(days=28))
        context["index_coverage"] = gsc_client.get_index_coverage()

    return render(request, "admin/seo/dashboard.html", context)


@staff_member_required
@require_GET
def seo_inspect_url(request):
    """Inspect a single URL for indexing status (AJAX endpoint)."""
    url = request.GET.get("url", "")
    if not url:
        return JsonResponse({"error": "No URL provided"}, status=400)

    result = gsc_client.inspect_url(url)
    return JsonResponse(result)


@staff_member_required
@require_GET
def seo_api_data(request):
    """JSON API for refreshing dashboard data (AJAX)."""
    data_type = request.GET.get("type", "summary")
    days = int(request.GET.get("days", 28))

    if data_type == "summary":
        return JsonResponse(gsc_client.get_search_performance_summary(days=days), safe=False)
    elif data_type == "queries":
        return JsonResponse(gsc_client.get_top_queries(days=days), safe=False)
    elif data_type == "pages":
        return JsonResponse(gsc_client.get_top_pages(days=days), safe=False)
    elif data_type == "daily":
        return JsonResponse(gsc_client.get_daily_performance(days=days), safe=False)
    elif data_type == "coverage":
        return JsonResponse(gsc_client.get_index_coverage(), safe=False)
    else:
        return JsonResponse({"error": f"Unknown data type: {data_type}"}, status=400)
