"""create live_tracking table for family tracking

Revision ID: 10000_live_tracking
Revises: 9999_enable_rls
Create Date: 2026-04-27 00:00:00.000000
"""
from alembic import op

revision = '10000_live_tracking'
down_revision = '9999_enable_rls'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS live_tracking (
            session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            accuracy FLOAT,
            speed_kmh FLOAT,
            battery_percent INT,
            is_active BOOLEAN DEFAULT TRUE,
            started_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '4 hours',
            user_name TEXT,
            blood_group TEXT,
            vehicle_number TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)

    # Enable RLS
    op.execute("ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;")

    # Public read - anyone with a session_id link can view (no login needed)
    op.execute("""
        CREATE POLICY "Anyone can read active tracking sessions"
        ON live_tracking FOR SELECT
        USING (is_active = true AND expires_at > NOW());
    """)

    # Only authenticated users (or service role) can insert/update
    op.execute("""
        CREATE POLICY "Authenticated users can create tracking sessions"
        ON live_tracking FOR INSERT
        TO authenticated
        WITH CHECK (true);
    """)

    op.execute("""
        CREATE POLICY "Users can update their own tracking sessions"
        ON live_tracking FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid()::text);
    """)

    # Enable Realtime on this table (Supabase specific)
    op.execute("ALTER PUBLICATION supabase_realtime ADD TABLE live_tracking;")


def downgrade() -> None:
    op.execute('DROP POLICY IF EXISTS "Anyone can read active tracking sessions" ON live_tracking;')
    op.execute('DROP POLICY IF EXISTS "Authenticated users can create tracking sessions" ON live_tracking;')
    op.execute('DROP POLICY IF EXISTS "Users can update their own tracking sessions" ON live_tracking;')
    op.execute("DROP TABLE IF EXISTS live_tracking;")
