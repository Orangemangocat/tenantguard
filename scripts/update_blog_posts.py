#!/usr/bin/env python3
"""
Backfill missing blog post featured images using the current app DB config.
"""

from argparse import ArgumentParser
import os
import sys
from datetime import datetime

from sqlalchemy import or_

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models.blog import BlogPost
from src.models.user import db


DEFAULT_IMAGE = "/assets/logo.png"
IMAGE_RULES = [
    ("cybersecurity", "/assets/blog/cybersecurity-alert.png"),
    ("market", "/assets/blog/market-analysis.png"),
    ("eviction", "/assets/blog/eviction-crisis.png"),
    ("technology", "/assets/blog/technology-platform.png"),
    ("admin", "/assets/blog/admin-panel.png"),
    ("roadmap", "/assets/blog/future-roadmap.png"),
    ("future", "/assets/blog/future-roadmap.png"),
]


def pick_image(post):
    slug = (post.slug or "").lower()
    title = (post.title or "").lower()
    searchable = f"{slug} {title}"
    for keyword, image in IMAGE_RULES:
        if keyword in searchable:
            return image
    return DEFAULT_IMAGE


def update_missing_images(dry_run=False, limit=None):
    with app.app_context():
        query = BlogPost.query.filter(
            or_(BlogPost.featured_image.is_(None), BlogPost.featured_image == "")
        ).order_by(BlogPost.id.asc())
        if limit:
            query = query.limit(limit)
        posts = query.all()

        if not posts:
            print("No blog posts missing featured images.")
            return

        updated = 0
        for post in posts:
            image = pick_image(post)
            if dry_run:
                print(
                    f"[DRY-RUN] Would update id={post.id} slug={post.slug!r} "
                    f"to featured_image={image}"
                )
                continue

            post.featured_image = image
            post.updated_at = datetime.utcnow()
            updated += 1
            print(
                f"Updated id={post.id} slug={post.slug!r} "
                f"to featured_image={image}"
            )

        if not dry_run:
            db.session.commit()
            print(f"Updated {updated} post(s).")


def main():
    parser = ArgumentParser(description="Backfill missing blog post images.")
    parser.add_argument("--dry-run", action="store_true", help="Print changes only.")
    parser.add_argument("--limit", type=int, default=None, help="Limit rows processed.")
    args = parser.parse_args()

    update_missing_images(dry_run=args.dry_run, limit=args.limit)


if __name__ == "__main__":
    main()
