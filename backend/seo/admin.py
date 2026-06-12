"""
Register SEO Dashboard in the Django admin sidebar.

This uses a proxy model trick to get a link in the admin menu
that redirects to our custom SEO dashboard view.
"""

from django.contrib import admin
from django.utils.html import format_html


# We don't need a real model — just a way to appear in the admin sidebar.
# The actual dashboard is served by seo/views.py at /admin/seo-dashboard/
