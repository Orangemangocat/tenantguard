"""create case_analyses table

Revision ID: 0001_create_case_analyses
Revises: 
Create Date: 2026-01-04 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_case_analyses'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'case_analyses',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('analysis', sa.Text(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('confidence', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
    )
    op.create_foreign_key('fk_case_analysis_case', 'case_analyses', 'cases', ['case_id'], ['id'])


def downgrade():
    op.drop_constraint('fk_case_analysis_case', 'case_analyses', type_='foreignkey')
    op.drop_table('case_analyses')
