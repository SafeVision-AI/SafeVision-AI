"""secure user profiles and create sos incidents

Revision ID: 10001_secure_user_profiles_and_sos
Revises: 10000_live_tracking
Create Date: 2026-05-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = '10001_secure_user_profiles_and_sos'
down_revision = '10000_live_tracking'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('user_profiles', sa.Column('user_id', sa.String(length=255), nullable=True))
    op.execute("UPDATE user_profiles SET user_id = id::text WHERE user_id IS NULL")
    op.alter_column('user_profiles', 'user_id', nullable=False)
    op.create_index('ix_user_profiles_user_id', 'user_profiles', ['user_id'])

    op.execute("""
        CREATE TABLE IF NOT EXISTS sos_incidents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT,
            lat DOUBLE PRECISION NOT NULL,
            lon DOUBLE PRECISION NOT NULL,
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    op.create_index('ix_sos_incidents_created_at', 'sos_incidents', ['created_at'])
    op.create_index('ix_sos_incidents_user_id', 'sos_incidents', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_sos_incidents_user_id', table_name='sos_incidents')
    op.drop_index('ix_sos_incidents_created_at', table_name='sos_incidents')
    op.execute("DROP TABLE IF EXISTS sos_incidents")
    op.drop_index('ix_user_profiles_user_id', table_name='user_profiles')
    op.drop_column('user_profiles', 'user_id')
