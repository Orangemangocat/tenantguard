"""add seo ping logs table

Revision ID: 0003_add_seo_ping_logs
Revises: 0002_add_oauth_start_role
Create Date: 2026-02-07
"""

from alembic import op
import sqlalchemy as sa


revision = '0003_add_seo_ping_logs'
down_revision = '0002_add_oauth_start_role'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'seo_ping_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('post_id', sa.Integer(), nullable=True),
        sa.Column('post_slug', sa.String(length=255), nullable=True),
        sa.Column('post_title', sa.String(length=500), nullable=True),
        sa.Column('sitemap_url', sa.String(length=1000), nullable=True),
        sa.Column('ping_url', sa.String(length=1000), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('ok', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('search_console_status', sa.String(length=50), nullable=True),
        sa.Column('search_console_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('seo_ping_logs')
