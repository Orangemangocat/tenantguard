#!/usr/bin/env python
"""
Generate featured images for blog posts that are missing one.

Usage:
    python generate_featured_images.py           # Generate for all posts missing images
    python generate_featured_images.py --dry-run  # Preview which posts would be processed
    python generate_featured_images.py --slug some-post-slug  # Single post
"""

import os
import sys
import argparse
import django
from pathlib import Path

# Django setup
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

django.setup()

import re
import requests
from io import BytesIO
from django.core.files.base import ContentFile
from openai import OpenAI
from blog.models import Post


def slugify_filename(title: str) -> str:
    """Convert post title to a safe filename."""
    filename = title.lower()
    filename = re.sub(r"[^\w\s-]", "", filename)
    filename = re.sub(r"[\s_]+", "-", filename)
    filename = filename.strip("-")
    return filename[:60]


def build_image_prompt(post: Post) -> str:
    """Build a DALL-E prompt from post title, category, and excerpt."""
    category = post.category.name if post.category else "General"
    excerpt = post.excerpt[:200] if post.excerpt else ""

    base = (
        f"Professional blog header image for an article titled '{post.title}'. "
        f"Topic: tenant rights and housing justice in Tennessee. "
        f"Category: {category}. "
    )
    if excerpt:
        base += f"Context: {excerpt}. "

    base += (
        "Style: modern, clean, editorial photography or illustration. "
        "No text or words in the image. Wide format, suitable for a blog header. "
        "Colors: professional blues, greens, and warm neutrals."
    )
    return base


def generate_image(client: OpenAI, prompt: str) -> bytes:
    """Call DALL-E 3 and return image bytes."""
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1792x1024",
        quality="standard",
        n=1,
    )
    image_url = response.data[0].url
    img_response = requests.get(image_url, timeout=30)
    img_response.raise_for_status()
    return img_response.content


def process_post(post: Post, client: OpenAI, dry_run: bool = False) -> bool:
    """Generate and save a featured image for a single post."""
    print(f"\n→ '{post.title}'")

    if dry_run:
        print("  [dry-run] Would generate image")
        return True

    prompt = build_image_prompt(post)
    print(f"  Prompt: {prompt[:100]}...")

    try:
        image_bytes = generate_image(client, prompt)
    except Exception as e:
        print(f"  ERROR generating image: {e}")
        return False

    filename = f"{slugify_filename(post.title)}.png"
    post.featured_image.save(filename, ContentFile(image_bytes), save=True)
    print(f"  Saved: blog/images/{filename}")
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate featured images for blog posts")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    parser.add_argument("--slug", help="Process a single post by slug")
    parser.add_argument("--all", action="store_true", help="Regenerate images even if one exists")
    args = parser.parse_args()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set in .env")
        sys.exit(1)

    client = OpenAI(api_key=api_key)

    # Build queryset
    if args.slug:
        posts = Post.objects.filter(slug=args.slug)
        if not posts.exists():
            print(f"No post found with slug '{args.slug}'")
            sys.exit(1)
    elif args.all:
        posts = Post.objects.filter(status="published")
    else:
        # Only posts missing a featured image
        from django.db.models import Q
        posts = Post.objects.filter(status="published").filter(
            Q(featured_image="") | Q(featured_image__isnull=True)
        )

    total = posts.count()
    if total == 0:
        print("All published posts already have featured images.")
        return

    print(f"Found {total} post(s) {'to process' if not args.dry_run else 'that would be processed'}:")
    for p in posts:
        print(f"  - {p.title}")

    if args.dry_run:
        for post in posts:
            process_post(post, client, dry_run=True)
        return

    succeeded = 0
    failed = 0
    for post in posts:
        if process_post(post, client):
            succeeded += 1
        else:
            failed += 1

    print(f"\nComplete: {succeeded} generated, {failed} failed")


if __name__ == "__main__":
    main()
