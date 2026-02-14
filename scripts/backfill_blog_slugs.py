#!/usr/bin/env python3
"""
Backfill Blog Post Slugs Migration Script

This script ensures all existing blog posts have valid, unique slugs.
It's safe to run multiple times (idempotent).

Usage:
    python scripts/backfill_blog_slugs.py [--dry-run] [--verbose]

Options:
    --dry-run    Show what would be changed without making changes
    --verbose    Show detailed output for each post
"""

import sys
import os
import argparse

# Add parent directory to path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models.user import db
from src.models.blog import BlogPost
from src.routes.blog_slug_utils import generate_unique_slug, validate_slug


def backfill_slugs(dry_run=False, verbose=False):
    """
    Backfill slugs for all blog posts that are missing them or have invalid slugs
    
    Args:
        dry_run (bool): If True, don't actually save changes
        verbose (bool): If True, print detailed information
    """
    print("=" * 70)
    print("Blog Post Slug Backfill Migration")
    print("=" * 70)
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be saved")
    
    print()
    
    # Get all blog posts
    all_posts = BlogPost.query.order_by(BlogPost.id).all()
    total_posts = len(all_posts)
    
    print(f"📊 Found {total_posts} blog posts in database")
    print()
    
    # Track statistics
    stats = {
        'missing_slug': 0,
        'invalid_slug': 0,
        'duplicate_slug': 0,
        'valid_slug': 0,
        'updated': 0,
        'errors': 0
    }
    
    # First pass: identify issues
    posts_to_update = []
    existing_slugs = set()
    
    for post in all_posts:
        has_issue = False
        issue_type = None
        
        # Check if slug is missing
        if not post.slug or post.slug.strip() == '':
            has_issue = True
            issue_type = 'missing_slug'
            stats['missing_slug'] += 1
        
        # Check if slug is valid
        elif post.slug:
            is_valid, error_msg = validate_slug(post.slug)
            if not is_valid:
                has_issue = True
                issue_type = 'invalid_slug'
                stats['invalid_slug'] += 1
                if verbose:
                    print(f"⚠️  Post #{post.id}: Invalid slug '{post.slug}' - {error_msg}")
            
            # Check for duplicates
            elif post.slug in existing_slugs:
                has_issue = True
                issue_type = 'duplicate_slug'
                stats['duplicate_slug'] += 1
                if verbose:
                    print(f"⚠️  Post #{post.id}: Duplicate slug '{post.slug}'")
            
            else:
                stats['valid_slug'] += 1
                existing_slugs.add(post.slug)
        
        if has_issue:
            posts_to_update.append({
                'post': post,
                'issue': issue_type,
                'old_slug': post.slug
            })
    
    # Print summary of issues
    print("📋 Issue Summary:")
    print(f"   ✅ Valid slugs:     {stats['valid_slug']}")
    print(f"   ❌ Missing slugs:   {stats['missing_slug']}")
    print(f"   ⚠️  Invalid slugs:  {stats['invalid_slug']}")
    print(f"   🔄 Duplicate slugs: {stats['duplicate_slug']}")
    print()
    
    if not posts_to_update:
        print("✨ All blog posts have valid, unique slugs. Nothing to do!")
        return stats
    
    # Second pass: fix issues
    print(f"🔧 Updating {len(posts_to_update)} blog posts...")
    print()
    
    for item in posts_to_update:
        post = item['post']
        issue = item['issue']
        old_slug = item['old_slug']
        
        try:
            # Generate new slug from title
            new_slug = generate_unique_slug(post.title, exclude_post_id=post.id)
            
            if verbose or not dry_run:
                print(f"   Post #{post.id}: '{post.title[:50]}...'")
                print(f"      Issue: {issue}")
                print(f"      Old slug: '{old_slug or '(empty)'}'")
                print(f"      New slug: '{new_slug}'")
                print()
            
            if not dry_run:
                post.slug = new_slug
                stats['updated'] += 1
            
        except Exception as e:
            print(f"   ❌ Error updating post #{post.id}: {str(e)}")
            stats['errors'] += 1
    
    # Commit changes
    if not dry_run and stats['updated'] > 0:
        try:
            db.session.commit()
            print(f"✅ Successfully updated {stats['updated']} blog posts")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error committing changes: {str(e)}")
            stats['errors'] += 1
            return stats
    
    # Final summary
    print()
    print("=" * 70)
    print("Migration Complete")
    print("=" * 70)
    print(f"Total posts:    {total_posts}")
    print(f"Updated:        {stats['updated']}")
    print(f"Errors:         {stats['errors']}")
    
    if dry_run:
        print()
        print("💡 Run without --dry-run to apply these changes")
    
    return stats


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Backfill slugs for existing blog posts'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making changes'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output for each post'
    )
    
    args = parser.parse_args()
    
    try:
        # Import Flask app to get database context
        from src.main import app
        
        with app.app_context():
            stats = backfill_slugs(dry_run=args.dry_run, verbose=args.verbose)
            
            # Exit with error code if there were errors
            if stats['errors'] > 0:
                sys.exit(1)
            
    except ImportError as e:
        print(f"❌ Error importing Flask app: {str(e)}")
        print("Make sure you're running this from the tenantguard root directory")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
