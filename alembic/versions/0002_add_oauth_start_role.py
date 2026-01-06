"""add start_role to oauth_states

Revision ID: 0002_add_oauth_start_role
Revises: 0001_create_case_analyses
Create Date: 2026-01-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_oauth_start_role'
down_revision = '0001_create_case_analyses'
branch_labels = None
depends_on = None


def upgrade():
    # Add nullable start_role column to oauth_states
    op.add_column('oauth_states', sa.Column('start_role', sa.String(length=50), nullable=True))


def downgrade():
    # Remove start_role column
    op.drop_column('oauth_states', 'start_role')
