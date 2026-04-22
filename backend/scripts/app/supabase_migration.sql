-- ============================================
-- SafeVixAI / SafeVixAI - Supabase Migration
-- Paste this entire script into your Supabase
-- Dashboard > SQL Editor > New Query > Run
-- ============================================

-- Step 1: Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Step 2: Create alembic version tracking table
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO alembic_version (version_num) VALUES ('001_initial_schema')
ON CONFLICT DO NOTHING;

-- ============================================
-- TABLE: emergency_services
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_services (
    id                SERIAL PRIMARY KEY,
    osm_id            BIGINT UNIQUE,
    osm_type          VARCHAR(32),
    name              TEXT NOT NULL,
    name_local        TEXT,
    category          VARCHAR(32) NOT NULL,
    sub_category      VARCHAR(64),
    address           TEXT,
    phone             VARCHAR(64),
    phone_emergency   VARCHAR(64),
    website           TEXT,
    location          GEOMETRY(POINT, 4326) NOT NULL,
    city              VARCHAR(128),
    district          VARCHAR(128),
    state             VARCHAR(128),
    state_code        VARCHAR(2),
    country_code      VARCHAR(2) NOT NULL DEFAULT 'IN',
    is_24hr           BOOLEAN NOT NULL DEFAULT TRUE,
    has_trauma        BOOLEAN NOT NULL DEFAULT FALSE,
    has_icu           BOOLEAN NOT NULL DEFAULT FALSE,
    bed_count         INTEGER,
    rating            FLOAT,
    source            VARCHAR(32) NOT NULL DEFAULT 'overpass',
    raw_tags          JSON,
    verified          BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_emergency_services_category
    ON emergency_services (category);

CREATE INDEX IF NOT EXISTS ix_emergency_services_state_code
    ON emergency_services (state_code);

CREATE INDEX IF NOT EXISTS ix_emergency_services_country_code
    ON emergency_services (country_code);

CREATE INDEX IF NOT EXISTS ix_emergency_services_location_gist
    ON emergency_services USING GIST (location);

-- ============================================
-- TABLE: road_infrastructure
-- ============================================
CREATE TABLE IF NOT EXISTS road_infrastructure (
    id                    SERIAL PRIMARY KEY,
    road_id               VARCHAR(128) NOT NULL UNIQUE,
    road_name             TEXT,
    road_type             VARCHAR(64),
    road_number           VARCHAR(64),
    length_km             FLOAT,
    geometry              GEOMETRY(LINESTRING, 4326) NOT NULL,
    state_code            VARCHAR(2),
    contractor_name       TEXT,
    exec_engineer         TEXT,
    exec_engineer_phone   VARCHAR(64),
    budget_sanctioned     BIGINT,
    budget_spent          BIGINT,
    construction_date     DATE,
    last_relayed_date     DATE,
    next_maintenance      DATE,
    project_source        VARCHAR(64),
    data_source_url       TEXT
);

CREATE INDEX IF NOT EXISTS ix_road_infrastructure_state_code
    ON road_infrastructure (state_code);

CREATE INDEX IF NOT EXISTS ix_road_infrastructure_geometry_gist
    ON road_infrastructure USING GIST (geometry);

-- ============================================
-- TABLE: road_issues
-- ============================================
CREATE TABLE IF NOT EXISTS road_issues (
    id                SERIAL PRIMARY KEY,
    uuid              UUID NOT NULL UNIQUE,
    issue_type        VARCHAR(64) NOT NULL,
    severity          INTEGER NOT NULL,
    description       TEXT,
    location          GEOMETRY(POINT, 4326) NOT NULL,
    location_address  TEXT,
    road_name         TEXT,
    road_type         VARCHAR(64),
    road_number       VARCHAR(64),
    photo_url         TEXT,
    ai_detection      JSONB,
    reporter_id       UUID,
    authority_name    TEXT,
    authority_phone   VARCHAR(64),
    authority_email   TEXT,
    complaint_ref     VARCHAR(128),
    status            VARCHAR(32) NOT NULL DEFAULT 'open',
    status_updated    TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_road_issues_location_gist
    ON road_issues USING GIST (location);

CREATE INDEX IF NOT EXISTS ix_road_issues_status
    ON road_issues (status);

-- ============================================
-- Done! All 3 tables with PostGIS indexes created.
-- ============================================
