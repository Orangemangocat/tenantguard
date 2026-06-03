"""
Management command to normalize blog post featured_image paths so they resolve
correctly via the GCS storage backend (tenantguard-media bucket).

Django's ImageField should store only the relative path (e.g. blog/images/foo.jpg).
The storage backend then builds the full URL.  Old records may have a full URL or
an absolute /media/ path stored, which breaks GCS URL generation.

This command strips known prefixes and saves only the relative path.

Usage:
    python manage.py fix_featured_image_urls           # dry-run (no writes)
    python manage.py fix_featured_image_urls --apply   # apply changes
"""

import re
from django.core.management.base import BaseCommand
from blog.models import Post

# Prefixes to strip, in order (longest/most-specific first)
STRIP_PREFIXES = [
    # Full GCS URL (already correct storage, but wrong base — shouldn't normally happen)
    r"^https?://storage\.googleapis\.com/[^/]+/",
    # Any https/http domain + /media/
    r"^https?://[^/]+/media/",
    # Absolute path
    r"^/media/",
]


def normalize_path(raw: str) -> str:
    """Return just the relative storage path, stripping any URL/path prefix."""
    for pattern in STRIP_PREFIXES:
        cleaned = re.sub(pattern, "", raw)
        if cleaned != raw:
            return cleaned
    return raw


class Command(BaseCommand):
    help = "Normalize blog post featured_image paths for GCS storage"

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually write changes to the database (default is dry-run)",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        mode = "APPLY" if apply else "DRY-RUN"
        self.stdout.write(f"[{mode}] Scanning blog posts for featured_image paths...\n")

        posts = Post.objects.exclude(featured_image="").exclude(featured_image__isnull=True)
        changed = 0
        skipped = 0

        for post in posts:
            raw = post.featured_image.name  # stored value in DB
            normalized = normalize_path(raw)

            if normalized == raw:
                skipped += 1
                continue

            self.stdout.write(
                f"  Post #{post.pk} ({post.slug})\n"
                f"    before: {raw}\n"
                f"    after:  {normalized}\n"
            )

            if apply:
                post.featured_image.name = normalized
                Post.objects.filter(pk=post.pk).update(featured_image=normalized)

            changed += 1

        self.stdout.write(
            f"\n[{mode}] Done. {changed} record(s) {'updated' if apply else 'would be updated'}, "
            f"{skipped} already clean.\n"
        )

        if not apply and changed:
            self.stdout.write(
                "Run with --apply to write these changes to the database.\n"
            )
