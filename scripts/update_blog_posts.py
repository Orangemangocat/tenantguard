#!/usr/bin/env python3
"""
Backfill missing blog post featured images using the current app DB config.
"""

from argparse import ArgumentParser
import base64
from datetime import datetime
import os
import re
import sys
from urllib.parse import urlparse
from uuid import uuid4

# from sqlalchemy import or_
import requests

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
IMAGE_UPLOAD_SUBDIR = os.path.join("uploads", "blog")
IMAGE_URL_PREFIX = "/static/uploads/blog"


def _split_env_list(value):
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _has_openai_keys():
    return bool(os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEYS"))


def _select_openai_key(provider_index=None):
    api_keys = _split_env_list(os.getenv("OPENAI_API_KEYS"))
    if not api_keys:
        single_key = os.getenv("OPENAI_API_KEY")
        if single_key:
            api_keys = [single_key]

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

    return api_keys[index]


def _safe_slug(value):
    cleaned = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return cleaned or "post"


def _is_blank(value):
    if value is None:
        return True
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned == "" or cleaned.lower() == "null"
    return False


def _local_image_path(value):
    if not value:
        return None

    path = value
    if value.startswith("http://") or value.startswith("https://"):
        parsed = urlparse(value)
        if parsed.netloc and "tenantguard.net" not in parsed.netloc:
            return None
        path = parsed.path or ""

    if not path.startswith("/"):
        path = f"/{path}"

    if path.startswith("/static/"):
        return os.path.join(app.static_folder, path[len("/static/") :])

    if path.startswith("/assets/"):
        return os.path.join(app.static_folder, path.lstrip("/"))

    if path.startswith("/uploads/"):
        return os.path.join(app.static_folder, path.lstrip("/"))

    return None


def is_missing_featured_image(post):
    value = post.featured_image
    if _is_blank(value):
        return True, "empty"
    if value == DEFAULT_IMAGE:
        return True, "default"

    local_path = _local_image_path(value)
    if local_path:
        if not os.path.exists(local_path):
            return True, "missing_file"
        return False, "exists"

    return False, "external_unverified"


def build_image_prompt(post):
    slug_text = re.sub(r"[-_]+", " ", post.slug or "").strip()
    title_text = (post.title or "").strip()
    tag_text = ", ".join(
        tag.strip() for tag in (post.tags or "").split(",") if tag.strip()
    )
    parts = [title_text, slug_text, tag_text, post.category]
    topic = ", ".join([part for part in parts if part])
    if not topic:
        topic = "tenant advocacy and housing guidance"

    return (
        "Create a clean, modern blog header illustration for TenantGuard about "
        f"{topic}. Use a professional vector style with subtle gradients. "
        "No text, no logos, no watermarks, no identifiable people. Square format."
    )


def generate_ai_image(post, provider_index=None):
    api_key = _select_openai_key(provider_index)
    model = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")
    size = os.getenv("OPENAI_IMAGE_SIZE", "1024x1024")
    quality = os.getenv("OPENAI_IMAGE_QUALITY")
    timeout = float(os.getenv("OPENAI_REQUEST_TIMEOUT", "30"))

    payload = {
        "model": model,
        "prompt": build_image_prompt(post),
    }
    if size:
        payload["size"] = size
    if quality:
        payload["quality"] = quality

    response = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout,
    )

    if response.status_code != 200:
        raise ValueError(f"Image API error: {response.text}")

    data = response.json()
    try:
        image_base64 = data["data"][0]["b64_json"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("Image API response missing base64 data") from exc

    image_bytes = base64.b64decode(image_base64)
    filename = f"{_safe_slug(post.slug)}-{post.id}-{uuid4().hex[:8]}.png"
    upload_dir = os.path.join(app.static_folder, IMAGE_UPLOAD_SUBDIR)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as file:
        file.write(image_bytes)

    return f"{IMAGE_URL_PREFIX}/{filename}"


def pick_image(post):
    slug = (post.slug or "").lower()
    title = (post.title or "").lower()
    searchable = f"{slug} {title}"
    for keyword, image in IMAGE_RULES:
        if keyword in searchable:
            return image
    return DEFAULT_IMAGE


def update_missing_images(dry_run=False, limit=None, provider_index=None):
    with app.app_context():
        query = BlogPost.query.order_by(BlogPost.id.asc())
        if limit:
            query = query.limit(limit)
        posts = query.all()

        if not posts:
            print("No blog posts found.")
            return

        updated = 0
        skipped = 0
        for post in posts:
            missing, reason = is_missing_featured_image(post)
            if not missing:
                skipped += 1
                print(
                    f"Skipped id={post.id} slug={post.slug!r} "
                    f"featured_image={post.featured_image!r} reason={reason}"
                )
                continue

            if dry_run:
                prompt = build_image_prompt(post)
                print(
                    f"[DRY-RUN] Would update id={post.id} slug={post.slug!r} "
                    f"with AI prompt={prompt!r} reason={reason}"
                )
                continue

            image = None
            source = "ai"
            if _has_openai_keys():
                try:
                    image = generate_ai_image(post, provider_index=provider_index)
                except Exception as exc:
                    print(
                        f"[WARN] AI image generation failed for id={post.id} "
                        f"slug={post.slug!r}: {exc}"
                    )
            else:
                print(
                    f"[WARN] OPENAI_API_KEY(S) missing; falling back for "
                    f"id={post.id} slug={post.slug!r}"
                )

            if not image:
                image = pick_image(post)
                source = "fallback"

            post.featured_image = image
            post.updated_at = datetime.utcnow()
            updated += 1
            print(
                f"Updated id={post.id} slug={post.slug!r} "
                f"to featured_image={image} source={source}"
            )

        if not dry_run:
            db.session.commit()
            print(f"Updated {updated} post(s). Skipped {skipped} post(s).")


def main():
    parser = ArgumentParser(description="Backfill missing blog post images.")
    parser.add_argument("--dry-run", action="store_true", help="Print changes only.")
    parser.add_argument("--limit", type=int, default=None, help="Limit rows processed.")
    parser.add_argument(
        "--provider-index",
        type=int,
        default=None,
        help="Index for OPENAI_API_KEYS selection.",
    )
    args = parser.parse_args()

    update_missing_images(
        dry_run=args.dry_run,
        limit=args.limit,
        provider_index=args.provider_index,
    )


if __name__ == "__main__":
    main()
