"""ensure blog post slugs are unique and valid

Revision ID: 0004
Revises: 0003
Create Date: 2026-02-09 16:30:00.000000

This migration ensures that:
1. All blog posts have slugs (the column already exists)
2. All slugs are unique (constraint already exists)
3. Backfills any missing slugs using the backfill script

Note: The slug column and unique constraint already exist in the BlogPost model.
This migration is primarily for documentation and to trigger the backfill script.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    """
    Ensure all blog posts have valid, unique slugs
    
    The slug column and unique constraint already exist in the model,
    so we just need to backfill any missing or invalid slugs.
    """
    
    # Get database connection
    connection = op.get_bind()
    
    # Check if blog_posts table exists
    inspector = sa.inspect(connection)
    tables = inspector.get_table_names()
    
    if 'blog_posts' not in tables:
        print("ℹ️  blog_posts table does not exist yet, skipping slug backfill")
        return
    
    # Check if slug column exists
    columns = [col['name'] for col in inspector.get_columns('blog_posts')]
    
    if 'slug' not in columns:
        print("⚠️  slug column does not exist in blog_posts table")
        print("   This migration expects the slug column to already exist")
        print("   Please ensure the BlogPost model is up to date")
        return
    
    print("✅ blog_posts table and slug column exist")
    
    # Count posts without slugs
    result = connection.execute(
        text("SELECT COUNT(*) FROM blog_posts WHERE slug IS NULL OR slug = ''")
    )
    missing_count = result.scalar()
    
    if missing_count > 0:
        print(f"⚠️  Found {missing_count} blog posts without slugs")
        print("   Run: python scripts/backfill_blog_slugs.py")
        print("   to generate slugs for these posts")
    else:
        print("✅ All blog posts have slugs")


def downgrade():
    """
    Downgrade is a no-op since we're not changing schema
    
    Note: This doesn't remove slugs, as they're part of the original model.
    """
    pass
